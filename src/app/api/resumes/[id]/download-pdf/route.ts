import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import puppeteer from 'puppeteer';
import { mapToBuilderResumeData } from '@/lib/resume/map-resume-data';
import { BuilderResumeData } from '@/types/resume-builder';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleDownload(req, params);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleDownload(req, params);
}

async function handleDownload(
  req: NextRequest,
  paramsPromise: Promise<{ id: string }>
) {
  try {
    const { id } = await paramsPromise;
    const resumeId = id;
    const supabase = await createClient();

    // 1. Verify Authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch the Resume Version or Resume Record
    // Try resume_versions first
    let resumeContent: any = null;
    let resumeTitle = 'Resume';

    const { data: versionData } = await (supabase as any)
      .from('resume_versions')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (versionData) {
      resumeContent = versionData.content;
      resumeTitle = versionData.version_label || 'Resume';
    } else {
      // Fallback check on resumes table
      const { data: resumeData } = await (supabase as any)
        .from('resumes')
        .select('*')
        .eq('id', resumeId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (resumeData) {
        resumeContent = resumeData.content || resumeData.parsed_data;
        resumeTitle = resumeData.title || resumeData.name || 'Resume';
      }
    }

    if (!resumeContent) {
      return NextResponse.json(
        { error: 'Resume not found or access denied.' },
        { status: 404 }
      );
    }

    // 3. Map into clean unified BuilderResumeData
    const data: BuilderResumeData = mapToBuilderResumeData({
      versionContent: resumeContent,
      userMetadata: user.user_metadata,
      userEmail: user.email,
    });

    // 4. Generate clean, printable HTML
    const html = generateResumeHTML(data);

    // 5. Render to PDF with Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
      await page.setContent(html, { waitUntil: 'domcontentloaded' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: '12mm',
          bottom: '12mm',
          left: '12mm',
          right: '12mm',
        },
      });

      await browser.close();

      const filename = `${resumeTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;

      return new NextResponse(Buffer.from(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      });
    } catch (renderError) {
      await browser.close();
      throw renderError;
    }
  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

function generateResumeHTML(data: BuilderResumeData): string {
  const { contact, summary, experience, education, skills, projects, certifications, theme } = data;
  const primaryColor = theme?.primaryColor || '#0f172a';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${contact.name || 'Resume'}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background-color: #ffffff;
      line-height: 1.45;
      font-size: 10pt;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
    }
    /* Header */
    .header {
      border-bottom: 2px solid ${primaryColor};
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .name {
      font-size: 24pt;
      font-weight: 800;
      color: ${primaryColor};
      letter-spacing: -0.5px;
      text-transform: uppercase;
      line-height: 1.1;
    }
    .title {
      font-size: 11pt;
      font-weight: 600;
      color: #475569;
      margin-top: 4px;
    }
    .contact-info {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 8px;
      font-size: 9pt;
      color: #64748b;
    }
    .contact-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    /* Sections */
    .section {
      margin-bottom: 14px;
      page-break-inside: auto;
    }
    .section-title {
      font-size: 10.5pt;
      font-weight: 700;
      color: ${primaryColor};
      text-transform: uppercase;
      letter-spacing: 0.8px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 3px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
    }
    .summary-text {
      font-size: 9.5pt;
      color: #334155;
      line-height: 1.5;
      text-align: justify;
    }
    /* Experience & Projects */
    .item {
      margin-bottom: 10px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .item:last-child {
      margin-bottom: 0;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 2px;
    }
    .item-title {
      font-weight: 700;
      font-size: 10pt;
      color: #0f172a;
    }
    .item-subtitle {
      font-weight: 600;
      font-size: 9.5pt;
      color: #334155;
    }
    .item-date {
      font-size: 8.5pt;
      font-weight: 600;
      color: #64748b;
    }
    .item-location {
      font-size: 8.5pt;
      color: #94a3b8;
      font-style: italic;
    }
    .bullets {
      list-style-type: square;
      padding-left: 16px;
      margin-top: 4px;
    }
    .bullets li {
      font-size: 9pt;
      color: #334155;
      line-height: 1.45;
      margin-bottom: 3px;
    }
    /* Skills */
    .skills-grid {
      display: flex;
      flex-direction: column;
      gap: 4px;
      page-break-inside: avoid;
    }
    .skill-row {
      font-size: 9pt;
      line-height: 1.4;
    }
    .skill-category {
      font-weight: 700;
      color: #0f172a;
      display: inline;
    }
    .skill-items {
      color: #475569;
      display: inline;
    }
    /* Education */
    .edu-item {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 6px;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <header class="header">
      <h1 class="name">${escapeHTML(contact.name || 'Your Name')}</h1>
      ${contact.title ? `<div class="title">${escapeHTML(contact.title)}</div>` : ''}
      <div class="contact-info">
        ${contact.email ? `<span class="contact-item">✉ ${escapeHTML(contact.email)}</span>` : ''}
        ${contact.phone ? `<span class="contact-item">📱 ${escapeHTML(contact.phone)}</span>` : ''}
        ${contact.location ? `<span class="contact-item">📍 ${escapeHTML(contact.location)}</span>` : ''}
        ${contact.linkedin ? `<span class="contact-item">🔗 ${escapeHTML(contact.linkedin)}</span>` : ''}
        ${contact.github ? `<span class="contact-item">💻 ${escapeHTML(contact.github)}</span>` : ''}
        ${contact.portfolio ? `<span class="contact-item">🌐 ${escapeHTML(contact.portfolio)}</span>` : ''}
      </div>
    </header>

    <!-- Professional Summary -->
    ${summary ? `
    <section class="section">
      <h2 class="section-title">Professional Summary</h2>
      <p class="summary-text">${escapeHTML(summary)}</p>
    </section>
    ` : ''}

    <!-- Experience -->
    ${experience && experience.length > 0 ? `
    <section class="section">
      <h2 class="section-title">Work Experience</h2>
      ${experience.map(exp => `
        <div class="item">
          <div class="item-header">
            <div>
              <span class="item-title">${escapeHTML(exp.title)}</span>
              ${exp.company ? ` • <span class="item-subtitle">${escapeHTML(exp.company)}</span>` : ''}
            </div>
            <div class="item-date">
              ${escapeHTML(exp.startDate || '')} ${exp.startDate && (exp.endDate || exp.current) ? '–' : ''} ${exp.current ? 'Present' : escapeHTML(exp.endDate || '')}
              ${exp.location ? `<span class="item-location"> | ${escapeHTML(exp.location)}</span>` : ''}
            </div>
          </div>
          ${exp.description ? `<p style="font-size: 9pt; color: #475569; margin: 2px 0;">${escapeHTML(exp.description)}</p>` : ''}
          ${exp.bullets && exp.bullets.length > 0 ? `
            <ul class="bullets">
              ${exp.bullets.map(b => `<li>${escapeHTML(b)}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `).join('')}
    </section>
    ` : ''}

    <!-- Projects -->
    ${projects && projects.length > 0 ? `
    <section class="section">
      <h2 class="section-title">Featured Projects</h2>
      ${projects.map((proj: any) => {
        const projName = proj.name || proj.title || 'Project';
        const projTech = proj.tech || (proj.technologies ? proj.technologies.join(', ') : '');
        const projUrl = proj.url || proj.link || '';
        return `
        <div class="item">
          <div class="item-header">
            <div>
              <span class="item-title">${escapeHTML(projName)}</span>
              ${projTech ? `
                <span style="font-size: 8.5pt; color: #64748b; font-weight: 500;"> (${escapeHTML(projTech)})</span>
              ` : ''}
            </div>
            ${projUrl ? `<span class="item-date" style="color: #2563eb;">${escapeHTML(projUrl)}</span>` : ''}
          </div>
          ${proj.description ? `<p style="font-size: 9pt; color: #475569; margin: 2px 0;">${escapeHTML(proj.description)}</p>` : ''}
          ${proj.bullets && proj.bullets.length > 0 ? `
            <ul class="bullets">
              ${proj.bullets.map((b: string) => `<li>${escapeHTML(b)}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `;
      }).join('')}
    </section>
    ` : ''}

    <!-- Skills -->
    ${skills && skills.length > 0 ? `
    <section class="section">
      <h2 class="section-title">Technical & Professional Skills</h2>
      <div class="skills-grid">
        ${skills.map((skillCat: any) => {
          const itemsStr = Array.isArray(skillCat.items) ? skillCat.items.join(', ') : String(skillCat.items || '');
          return `
          <div class="skill-row">
            <span class="skill-category">${escapeHTML(skillCat.category)}: </span>
            <span class="skill-items">${escapeHTML(itemsStr)}</span>
          </div>
        `;
        }).join('')}
      </div>
    </section>
    ` : ''}

    <!-- Education -->
    ${education && education.length > 0 ? `
    <section class="section">
      <h2 class="section-title">Education</h2>
      ${education.map((edu: any) => `
        <div class="edu-item">
          <div>
            <span class="item-title">${escapeHTML(edu.degree || 'Degree')}</span>
            ${edu.field ? ` in ${escapeHTML(edu.field)}` : ''}
            ${(edu.school || edu.institution) ? ` • <span class="item-subtitle">${escapeHTML(edu.school || edu.institution)}</span>` : ''}
          </div>
          <div class="item-date">
            ${escapeHTML(edu.endDate || edu.graduationDate || '')}
            ${edu.gpa ? ` | GPA: ${escapeHTML(edu.gpa)}` : ''}
          </div>
        </div>
      `).join('')}
    </section>
    ` : ''}

    <!-- Certifications -->
    ${certifications && certifications.length > 0 ? `
    <section class="section">
      <h2 class="section-title">Certifications & Credentials</h2>
      <div class="skills-grid">
        ${certifications.map(cert => `
          <div class="skill-row">
            <span class="skill-category">${escapeHTML(cert.name)}</span>
            ${cert.issuer ? `<span class="skill-items"> — ${escapeHTML(cert.issuer)}</span>` : ''}
            ${cert.date ? `<span class="item-date" style="float: right;">${escapeHTML(cert.date)}</span>` : ''}
          </div>
        `).join('')}
      </div>
    </section>
    ` : ''}
  </div>
</body>
</html>`;
}

function escapeHTML(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
