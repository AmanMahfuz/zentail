import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import puppeteer from 'puppeteer';
import PDFDocument from 'pdfkit';
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
    let resumeContent: any = null;
    let resumeTitle = 'Resume';

    // A. Check resume_versions by ID
    if (resumeId && resumeId !== 'undefined' && resumeId !== 'null') {
      const { data: versionData } = await (supabase as any)
        .from('resume_versions')
        .select('*')
        .eq('id', resumeId)
        .maybeSingle();

      if (versionData) {
        resumeContent = versionData.content;
        resumeTitle = versionData.version_label || 'Resume';
      }
    }

    // B. Check resumes_generated table (by id or application_id)
    if (!resumeContent && resumeId && resumeId !== 'undefined' && resumeId !== 'null') {
      // First try by direct ID
      const { data: genById } = await (supabase as any)
        .from('resumes_generated')
        .select('*')
        .eq('id', resumeId)
        .maybeSingle();

      const genData = genById || (await (supabase as any)
        .from('resumes_generated')
        .select('*')
        .eq('application_id', resumeId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()).data;

      if (genData) {
        resumeContent = {
          markdown: genData.resume_markdown,
          personal: { fullName: user.user_metadata?.full_name || 'Candidate' }
        };
        resumeTitle = genData.company ? `Tailored_Resume_${genData.company}` : 'Tailored_Resume';
      }
    }

    // C. Check application linked resume_version_id or resumes_generated
    if (!resumeContent && resumeId && resumeId !== 'undefined' && resumeId !== 'null') {
      const { data: appData } = await (supabase as any)
        .from('applications')
        .select('id, resume_version_id, user_id, company_name, job_title')
        .eq('id', resumeId)
        .maybeSingle();

      if (appData) {
        // Try getting generated resume for this application first
        const { data: appGen } = await (supabase as any)
          .from('resumes_generated')
          .select('*')
          .eq('application_id', appData.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (appGen?.resume_markdown) {
          resumeContent = {
            markdown: appGen.resume_markdown,
            personal: { fullName: user.user_metadata?.full_name || 'Candidate' }
          };
          resumeTitle = `Tailored_${appData.company_name || 'Resume'}`;
        } else if (appData.resume_version_id) {
          const { data: linkedV } = await (supabase as any)
            .from('resume_versions')
            .select('*')
            .eq('id', appData.resume_version_id)
            .maybeSingle();

          if (linkedV) {
            resumeContent = linkedV.content;
            resumeTitle = linkedV.version_label || 'Resume';
          }
        }
      }
    }

    // D. Fallback to latest master resume version if available
    if (!resumeContent) {
      const { data: latestV } = await (supabase as any)
        .from('resume_versions')
        .select('*')
        .eq('user_id', user.id)
        .order('is_latest', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestV) {
        resumeContent = latestV.content;
        resumeTitle = latestV.version_label || 'Master_Resume';
      }
    }

    // E. Fallback to latest generated resume if available
    if (!resumeContent) {
      const { data: latestGen } = await (supabase as any)
        .from('resumes_generated')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestGen?.resume_markdown) {
        resumeContent = {
          markdown: latestGen.resume_markdown,
          personal: { fullName: user.user_metadata?.full_name || 'Candidate' }
        };
        resumeTitle = latestGen.company ? `Tailored_${latestGen.company}` : 'Tailored_Resume';
      }
    }

    // F. Fallback to profile and user_evidence
    if (!resumeContent) {
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const { data: evidence } = await (supabase as any)
        .from('user_evidence')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      resumeContent = {
        personal: {
          fullName: profile?.full_name || user.user_metadata?.full_name || 'Candidate',
          email: user.email || profile?.email || '',
          phone: profile?.phone || '',
          location: profile?.location || '',
        },
        summary: profile?.bio || '',
        skills: evidence?.evidence_skills || [],
        experience: evidence?.evidence_experiences || [],
        education: evidence?.evidence_education || [],
      };
      resumeTitle = 'Resume';
    }

    // 3. Map into clean unified BuilderResumeData
    const data: BuilderResumeData = mapToBuilderResumeData({
      versionContent: resumeContent,
      userMetadata: user.user_metadata,
      userEmail: user.email,
    });

    // 4. Generate clean, printable HTML
    const html = generateResumeHTML(data);

    // 5. Render to PDF with Puppeteer (with PDFKit fallback)
    let pdfBuffer: Buffer;
    try {
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

        const rendered = await page.pdf({
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

        pdfBuffer = Buffer.from(rendered);
      } finally {
        await browser.close().catch(() => {});
      }
    } catch (puppeteerErr) {
      console.warn('[ResumeDownload] Puppeteer failed, using PDFKit fallback:', puppeteerErr);
      pdfBuffer = await generateResumePDFWithPDFKit(data);
    }

    const filename = `${resumeTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;

    // Save to Supabase Storage
    try {
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(`resumes/${user.id}/${filename}`, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        console.warn('[ResumeDownload] Failed to upload to Supabase Storage:', uploadError);
      } else {
        console.log(`[ResumeDownload] Successfully uploaded ${filename} to Supabase Storage.`);
      }
    } catch (e) {
      console.warn('[ResumeDownload] Error uploading to Supabase Storage:', e);
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

function generateResumePDFWithPDFKit(data: BuilderResumeData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const name = data.contact?.name || 'Candidate';
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#0f172a').text(name, { align: 'center' });

    const contacts = [
      data.contact?.email,
      data.contact?.phone,
      data.contact?.location,
      data.contact?.linkedin,
      data.contact?.github,
    ].filter(Boolean);

    if (contacts.length > 0) {
      doc.moveDown(0.3);
      doc.fontSize(8.5).font('Helvetica').fillColor('#64748b').text(contacts.join('  •  '), { align: 'center' });
    }

    doc.moveDown(0.8);
    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.8);

    const summary = data.summary;
    if (summary) {
      doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#0f172a').text('PROFESSIONAL SUMMARY');
      doc.moveDown(0.2);
      doc.fontSize(9).font('Helvetica').fillColor('#334155').text(summary, { lineGap: 2.5 });
      doc.moveDown(0.8);
    }

    if (data.skills && data.skills.length > 0) {
      doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#0f172a').text('TECHNICAL SKILLS');
      doc.moveDown(0.2);
      const skillText = data.skills
        .map((s: any) => typeof s === 'string' ? s : `${s.category ? `${s.category}: ` : ''}${s.items || ''}`)
        .filter(Boolean)
        .join(', ');
      if (skillText) {
        doc.fontSize(9).font('Helvetica').fillColor('#334155').text(skillText, { lineGap: 2.5 });
        doc.moveDown(0.8);
      }
    }

    if (data.experience && data.experience.length > 0) {
      doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#0f172a').text('EXPERIENCE');
      doc.moveDown(0.3);
      data.experience.forEach((exp: any) => {
        const title = exp.jobTitle || exp.title || 'Role';
        const company = exp.company || 'Company';
        const dates = [exp.startDate, exp.current ? 'Present' : exp.endDate].filter(Boolean).join(' - ');
        doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#0f172a').text(`${title} — ${company} ${dates ? `(${dates})` : ''}`);
        if (exp.description) {
          doc.fontSize(8.5).font('Helvetica').fillColor('#475569').text(exp.description, { lineGap: 2 });
        }
        if (Array.isArray(exp.bullets)) {
          exp.bullets.forEach((b: string) => {
            doc.fontSize(8.5).font('Helvetica').fillColor('#334155').text(`•  ${b}`, { indent: 10, lineGap: 2 });
          });
        }
        doc.moveDown(0.5);
      });
      doc.moveDown(0.4);
    }

    if (data.education && data.education.length > 0) {
      doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#0f172a').text('EDUCATION');
      doc.moveDown(0.3);
      data.education.forEach((edu: any) => {
        const deg = edu.degree || 'Degree';
        const school = edu.school || edu.institution || 'University';
        const field = edu.field ? ` in ${edu.field}` : '';
        const yr = edu.endDate || edu.startDate || '';
        doc.fontSize(8.5).font('Helvetica').fillColor('#334155').text(`•  ${deg}${field}, ${school} ${yr ? `(${yr})` : ''}`);
      });
      doc.moveDown(0.4);
    }

    if (data.projects && data.projects.length > 0) {
      doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#0f172a').text('PROJECTS');
      doc.moveDown(0.3);
      data.projects.forEach((proj: any) => {
        const title = proj.name || 'Project';
        doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#0f172a').text(title);
        if (proj.tech) {
          doc.fontSize(8.5).font('Helvetica').fillColor('#475569').text(`Technologies: ${proj.tech}`, { lineGap: 2 });
        }
        if (Array.isArray(proj.bullets)) {
          proj.bullets.forEach((b: string) => {
            doc.fontSize(8.5).font('Helvetica').fillColor('#334155').text(`•  ${b}`, { indent: 10, lineGap: 2 });
          });
        }
        doc.moveDown(0.5);
      });
      doc.moveDown(0.4);
    }

    doc.end();
  });
}

function generateResumeHTML(data: BuilderResumeData): string {
  const { contact, summary, experience, education, skills, projects, certifications, theme } = data;
  const primaryColor = theme?.primaryColor || '#0f172a';

  // Clean location from placeholder "Remote"
  const cleanLocation = (contact.location && !contact.location.toLowerCase().includes("remote"))
    ? contact.location
    : "";

  const isFresher = !experience || experience.length === 0;

  // Skills section markup
  const skillsHTML = (skills && skills.length > 0) ? `
    <section class="section">
      <h2 class="section-title">Technical Skills</h2>
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
  ` : '';

  // Experience section markup
  const experienceHTML = (experience && experience.length > 0) ? `
    <section class="section">
      <h2 class="section-title">Work Experience</h2>
      ${experience.map(exp => {
        const bullets = Array.isArray(exp.bullets) ? exp.bullets.filter(Boolean) : [];
        const hasBullets = bullets.length > 0;
        return `
        <div class="item">
          <div class="item-header">
            <div>
              <span class="item-title">${escapeHTML(exp.title)}</span>
              ${exp.company ? ` • <span class="item-subtitle">${escapeHTML(exp.company)}</span>` : ''}
            </div>
            <div class="item-date">
              ${escapeHTML(exp.startDate || '')} ${exp.startDate && (exp.endDate || exp.current) ? '–' : ''} ${exp.current ? 'Present' : escapeHTML(exp.endDate || '')}
              ${exp.location && !exp.location.toLowerCase().includes("remote") ? `<span class="item-location"> | ${escapeHTML(exp.location)}</span>` : ''}
            </div>
          </div>
          ${!hasBullets && exp.description ? `<p style="font-size: 9pt; color: #475569; margin: 2px 0;">${escapeHTML(exp.description)}</p>` : ''}
          ${hasBullets ? `
            <ul class="bullets">
              ${bullets.map((b: string) => `<li>${escapeHTML(b)}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `;
      }).join('')}
    </section>
  ` : '';

  // Projects section markup
  const projectsHTML = (projects && projects.length > 0) ? `
    <section class="section">
      <h2 class="section-title">${isFresher ? 'Key Projects & Technical Implementations' : 'Featured Projects'}</h2>
      ${projects.map((proj: any) => {
        const projName = proj.name || proj.title || 'Project';
        const projTech = proj.tech || (proj.technologies ? proj.technologies.join(', ') : '');
        const projUrl = proj.url || proj.link || '';
        const bullets = Array.isArray(proj.bullets) ? proj.bullets.filter(Boolean) : [];
        const hasBullets = bullets.length > 0;
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
          ${!hasBullets && proj.description ? `<p style="font-size: 9pt; color: #475569; margin: 2px 0;">${escapeHTML(proj.description)}</p>` : ''}
          ${hasBullets ? `
            <ul class="bullets">
              ${bullets.map((b: string) => `<li>${escapeHTML(b)}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `;
      }).join('')}
    </section>
  ` : '';

  // Education section markup
  const educationHTML = (education && education.length > 0) ? `
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
  ` : '';

  // Certifications section markup
  const certificationsHTML = (certifications && certifications.length > 0) ? `
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
  ` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHTML(contact.name || 'Resume')}</title>
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
        ${cleanLocation ? `<span class="contact-item">📍 ${escapeHTML(cleanLocation)}</span>` : ''}
        ${contact.linkedin ? `<span class="contact-item">🔗 ${escapeHTML(contact.linkedin)}</span>` : ''}
        ${contact.github ? `<span class="contact-item">💻 ${escapeHTML(contact.github)}</span>` : ''}
        ${contact.portfolio ? `<span class="contact-item">🌐 ${escapeHTML(contact.portfolio)}</span>` : ''}
      </div>
    </header>

    <!-- Professional Summary -->
    <!-- EXPERIENCED ORDER (Enforced Exact Order): Summary -> Skills -> Experience -> Education -> Projects -->
    ${summary ? `
    <section class="section">
      <h2 class="section-title">Professional Summary</h2>
      <p class="summary-text">${escapeHTML(summary)}</p>
    </section>
    ` : ''}

    ${skillsHTML}
    ${experienceHTML}
    ${educationHTML}
    ${projectsHTML}


    ${certificationsHTML}
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
