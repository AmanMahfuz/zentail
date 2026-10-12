import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAuthClient } from '@/lib/supabase/server';
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
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '');
    const supabase = token ? createAuthClient(token) : await createClient();

    // 1. Verify Authentication
    const {
      data: { user },
    } = await (token ? supabase.auth.getUser(token) : supabase.auth.getUser());

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch the Resume Version or Resume Record
    let resumeContent: any = null;
    let resumeTitle = 'Resume';

    // Check if client sent fresh data via POST body
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body?.data) {
          resumeContent = body.data;
          if (body.versionLabel || body.name) {
            resumeTitle = body.versionLabel || body.name;
          }
        }
      } catch {}
    }

    // 0. Check tailored_resumes table by id or application_id with strict user ownership verification
    if (!resumeContent && resumeId && resumeId !== 'undefined' && resumeId !== 'null') {
      const { data: tailored } = await (supabase as any)
        .from('tailored_resumes')
        .select('*')
        .or(`id.eq.${resumeId},application_id.eq.${resumeId}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (tailored) {
        // P0-A: Verify ownership via applications table
        let isOwner = false;
        if (tailored.application_id) {
          const { data: appOwnership } = await (supabase as any)
            .from('applications')
            .select('id')
            .eq('id', tailored.application_id)
            .eq('user_id', user.id)
            .maybeSingle();
          isOwner = !!appOwnership;
        }

        if (isOwner) {
          if (tailored.tailored_content && typeof tailored.tailored_content === 'object' && Object.keys(tailored.tailored_content).length > 0) {
            resumeContent = tailored.tailored_content;
            resumeTitle = 'Tailored_Resume';
          } else {
            let md = tailored.resume_markdown;
            if (!md && tailored.tailored_content) {
              const { tailoredResumeToMarkdown } = await import('@/lib/agents/resume-tailor');
              md = tailoredResumeToMarkdown(tailored.tailored_content);
            }
            if (md) {
              resumeContent = {
                markdown: md,
                personal: { fullName: user.user_metadata?.full_name || 'Candidate' }
              };
              resumeTitle = 'Tailored_Resume';
            }
          }
        }
      }
    }

    // A. Check resume_versions by ID and user_id
    if (!resumeContent && resumeId && resumeId !== 'undefined' && resumeId !== 'null') {
      const { data: versionData } = await (supabase as any)
        .from('resume_versions')
        .select('*')
        .eq('id', resumeId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (versionData) {
        resumeContent = versionData.content;
        resumeTitle = versionData.version_label || 'Resume';
      }
    }

    // B. Check resumes_generated table (by id or application_id) scoped to user_id
    if (!resumeContent && resumeId && resumeId !== 'undefined' && resumeId !== 'null') {
      // First try by direct ID
      const { data: genById } = await (supabase as any)
        .from('resumes_generated')
        .select('*')
        .eq('id', resumeId)
        .eq('user_id', user.id)
        .maybeSingle();

      const genData = genById || (await (supabase as any)
        .from('resumes_generated')
        .select('*')
        .eq('application_id', resumeId)
        .eq('user_id', user.id)
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

    // C. Check application linked resume_version_id or resumes_generated scoped to user_id
    if (!resumeContent && resumeId && resumeId !== 'undefined' && resumeId !== 'null') {
      const { data: appData } = await (supabase as any)
        .from('applications')
        .select('id, resume_version_id, user_id, company_name, job_title')
        .eq('id', resumeId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (appData) {
        // Try getting generated resume for this application first
        const { data: appGen } = await (supabase as any)
          .from('resumes_generated')
          .select('*')
          .eq('application_id', appData.id)
          .eq('user_id', user.id)
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
            .eq('user_id', user.id)
            .maybeSingle();

          if (linkedV) {
            resumeContent = linkedV.content;
            resumeTitle = linkedV.version_label || 'Resume';
          }
        }
      }
    }

    if (!resumeContent) {
      return NextResponse.json({ error: 'Resume not found or access denied.' }, { status: 404 });
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

    const name = data.contact?.name || 'Candidate Name';
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#0f172a').text(name.toUpperCase(), { align: 'center' });

    if (data.contact?.title) {
      doc.moveDown(0.2);
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#475569').text(data.contact.title.toUpperCase(), { align: 'center' });
    }

    const cleanLocation = (data.contact?.location && !data.contact.location.toLowerCase().includes('remote'))
      ? data.contact.location.trim()
      : '';

    const contacts: string[] = [];
    if (data.contact?.email) contacts.push(data.contact.email);
    if (data.contact?.phone) contacts.push(data.contact.phone);
    if (cleanLocation) contacts.push(cleanLocation);
    if (data.contact?.linkedin) contacts.push(cleanUrl(data.contact.linkedin));
    if (data.contact?.github) contacts.push(cleanUrl(data.contact.github));
    const port = data.contact?.portfolio || data.contact?.website;
    if (port) contacts.push(cleanUrl(port));

    if (contacts.length > 0) {
      doc.moveDown(0.25);
      doc.fontSize(8.5).font('Helvetica').fillColor('#475569').text(contacts.join('  •  '), { align: 'center' });
    }

    doc.moveDown(0.5);
    doc.strokeColor('#0f172a').lineWidth(1.5).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.6);

    const isFresher = !data.experience || data.experience.length === 0;

    // 1. Summary
    if (data.summary) {
      renderPDFKitSectionHeader(doc, 'PROFESSIONAL SUMMARY');
      doc.fontSize(9).font('Helvetica').fillColor('#334155').text(data.summary, { lineGap: 2.5, align: 'justify' });
      doc.moveDown(0.6);
    }

    // 2. Skills
    if (data.skills && data.skills.length > 0) {
      renderPDFKitSectionHeader(doc, 'TECHNICAL SKILLS');
      data.skills.forEach((cat: any) => {
        const catName = cat.category || 'Skills';
        const items = Array.isArray(cat.items) ? cat.items.join(', ') : String(cat.items || '');
        if (items.trim()) {
          doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0f172a').text(`${catName}: `, { continued: true });
          doc.font('Helvetica').fillColor('#334155').text(items, { lineGap: 2 });
        }
      });
      doc.moveDown(0.6);
    }

    const renderExperiencePDFKit = () => {
      if (data.experience && data.experience.length > 0) {
        renderPDFKitSectionHeader(doc, 'WORK EXPERIENCE');
        data.experience.forEach((exp: any) => {
          const title = exp.title || exp.jobTitle || 'Role';
          const company = exp.company || '';
          const dates = [exp.startDate, exp.current ? 'Present' : exp.endDate].filter(Boolean).join(' – ');
          const loc = exp.location && !exp.location.toLowerCase().includes('remote') ? ` | ${exp.location}` : '';

          const y = doc.y;
          doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#0f172a').text(title, 40, y, { continued: !!company });
          if (company) {
            doc.font('Helvetica').fillColor('#475569').text(` • ${company}`);
          }
          if (dates || loc) {
            doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#475569').text(`${dates}${loc}`, 40, y, { align: 'right' });
          }

          if (Array.isArray(exp.bullets) && exp.bullets.length > 0) {
            exp.bullets.forEach((b: string) => {
              if (b.trim()) {
                doc.fontSize(8.5).font('Helvetica').fillColor('#334155').text(`•  ${b.trim()}`, 52, undefined, { lineGap: 2 });
              }
            });
          } else if (exp.description) {
            doc.fontSize(8.5).font('Helvetica').fillColor('#334155').text(exp.description, 52, undefined, { lineGap: 2 });
          }
          doc.moveDown(0.4);
        });
        doc.moveDown(0.4);
      }
    };

    const renderEducationPDFKit = () => {
      if (data.education && data.education.length > 0) {
        renderPDFKitSectionHeader(doc, 'EDUCATION');
        data.education.forEach((edu: any) => {
          const deg = edu.degree || 'Degree';
          const field = edu.field ? ` in ${edu.field}` : '';
          const school = edu.school || edu.institution || '';
          const yr = [edu.startDate, edu.endDate || edu.graduationDate].filter(Boolean).join(' – ') || (edu.endDate || edu.graduationDate || '');
          const gpa = edu.gpa ? ` | GPA: ${edu.gpa}` : '';

          const y = doc.y;
          doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#0f172a').text(`${deg}${field}`, 40, y, { continued: !!school });
          if (school) {
            doc.font('Helvetica').fillColor('#475569').text(` • ${school}`);
          }
          if (yr || gpa) {
            doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#475569').text(`${yr}${gpa}`, 40, y, { align: 'right' });
          }
          doc.moveDown(0.3);
        });
        doc.moveDown(0.4);
      }
    };

    const renderProjectsPDFKit = () => {
      if (data.projects && data.projects.length > 0) {
        renderPDFKitSectionHeader(doc, isFresher ? 'KEY PROJECTS & IMPLEMENTATIONS' : 'FEATURED PROJECTS');
        data.projects.forEach((proj: any) => {
          const title = proj.name || proj.title || 'Project';
          const tech = proj.tech || (Array.isArray(proj.techStack) ? proj.techStack.join(', ') : '');
          const url = proj.url || proj.link || '';
          const cleanPUrl = cleanUrl(url);

          const y = doc.y;
          doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#0f172a').text(title, 40, y, { continued: !!tech });
          if (tech) {
            doc.font('Helvetica').fontSize(8.5).fillColor('#64748b').text(` (${tech})`);
          }
          if (cleanPUrl) {
            doc.fontSize(8).font('Helvetica').fillColor('#2563eb').text(cleanPUrl, 40, y, { align: 'right' });
          }

          if (Array.isArray(proj.bullets) && proj.bullets.length > 0) {
            proj.bullets.forEach((b: string) => {
              if (b.trim()) {
                doc.fontSize(8.5).font('Helvetica').fillColor('#334155').text(`•  ${b.trim()}`, 52, undefined, { lineGap: 2 });
              }
            });
          } else if (proj.description) {
            doc.fontSize(8.5).font('Helvetica').fillColor('#334155').text(proj.description, 52, undefined, { lineGap: 2 });
          }
          doc.moveDown(0.4);
        });
        doc.moveDown(0.4);
      }
    };

    if (isFresher) {
      renderEducationPDFKit();
      renderProjectsPDFKit();
      renderExperiencePDFKit();
    } else {
      renderExperiencePDFKit();
      renderEducationPDFKit();
      renderProjectsPDFKit();
    }

    if (data.certifications && data.certifications.length > 0) {
      renderPDFKitSectionHeader(doc, 'CERTIFICATIONS & CREDENTIALS');
      data.certifications.forEach((cert: any) => {
        const y = doc.y;
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#0f172a').text(cert.name || 'Certification', 40, y, { continued: !!cert.issuer });
        if (cert.issuer) {
          doc.font('Helvetica').fillColor('#475569').text(` — ${cert.issuer}`);
        }
        if (cert.date) {
          doc.fontSize(8.5).font('Helvetica').fillColor('#64748b').text(cert.date, 40, y, { align: 'right' });
        }
        doc.moveDown(0.25);
      });
    }

    doc.end();
  });
}

function renderPDFKitSectionHeader(doc: any, title: string) {
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text(title);
  doc.moveDown(0.15);
  doc.strokeColor('#cbd5e1').lineWidth(0.8).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
  doc.moveDown(0.3);
}

function generateResumeHTML(data: BuilderResumeData): string {
  const { contact, summary, experience, education, skills, projects, certifications, theme } = data;
  const primaryColor = theme?.primaryColor || '#0f172a';

  const cleanLocation = (contact.location && !contact.location.toLowerCase().includes('remote'))
    ? contact.location.trim()
    : '';

  const isFresher = !experience || experience.length === 0;

  // Contact line items with clean text separators and zero emojis
  const contactParts: string[] = [];
  if (contact.email) {
    contactParts.push(`<a href="mailto:${escapeHTML(contact.email)}">${escapeHTML(contact.email)}</a>`);
  }
  if (contact.phone) {
    contactParts.push(escapeHTML(contact.phone));
  }
  if (cleanLocation) {
    contactParts.push(escapeHTML(cleanLocation));
  }
  if (contact.linkedin) {
    const cleanLi = cleanUrl(contact.linkedin);
    contactParts.push(`<a href="${escapeHTML(contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`)}" target="_blank">${escapeHTML(cleanLi)}</a>`);
  }
  if (contact.github) {
    const cleanGh = cleanUrl(contact.github);
    contactParts.push(`<a href="${escapeHTML(contact.github.startsWith('http') ? contact.github : `https://${contact.github}`)}" target="_blank">${escapeHTML(cleanGh)}</a>`);
  }
  const portfolio = contact.portfolio || contact.website;
  if (portfolio) {
    const cleanPf = cleanUrl(portfolio);
    contactParts.push(`<a href="${escapeHTML(portfolio.startsWith('http') ? portfolio : `https://${portfolio}`)}" target="_blank">${escapeHTML(cleanPf)}</a>`);
  }

  // Skills section
  const skillsHTML = (skills && skills.length > 0) ? `
    <section class="section">
      <h2 class="section-title">Technical Skills</h2>
      <div class="skills-grid">
        ${skills.map((skillCat: any) => {
          const itemsStr = Array.isArray(skillCat.items) ? skillCat.items.join(', ') : String(skillCat.items || '');
          if (!itemsStr.trim()) return '';
          return `
          <div class="skill-row">
            <span class="skill-category">${escapeHTML(skillCat.category || 'Skills')}: </span>
            <span class="skill-items">${escapeHTML(itemsStr)}</span>
          </div>
        `;
        }).join('')}
      </div>
    </section>
  ` : '';

  // Experience section
  const experienceHTML = (experience && experience.length > 0) ? `
    <section class="section">
      <h2 class="section-title">Work Experience</h2>
      ${experience.map(exp => {
        const bullets = Array.isArray(exp.bullets) ? exp.bullets.filter(Boolean) : [];
        const hasBullets = bullets.length > 0;
        const dateRange = [exp.startDate, exp.current ? 'Present' : exp.endDate].filter(Boolean).join(' – ');
        return `
        <div class="item">
          <div class="item-header">
            <div>
              <span class="item-title">${escapeHTML(exp.title || 'Role')}</span>
              ${exp.company ? `<span class="item-divider"> • </span><span class="item-subtitle">${escapeHTML(exp.company)}</span>` : ''}
            </div>
            <div class="item-date">
              ${escapeHTML(dateRange)}
              ${exp.location && !exp.location.toLowerCase().includes('remote') ? `<span class="item-location"> | ${escapeHTML(exp.location)}</span>` : ''}
            </div>
          </div>
          ${!hasBullets && exp.description ? `<p class="item-desc">${escapeHTML(exp.description)}</p>` : ''}
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

  // Education section
  const educationHTML = (education && education.length > 0) ? `
    <section class="section">
      <h2 class="section-title">Education</h2>
      ${education.map((edu: any) => {
        const dateStr = [edu.startDate, edu.endDate || edu.graduationDate].filter(Boolean).join(' – ') || (edu.endDate || edu.graduationDate || '');
        return `
        <div class="edu-item">
          <div>
            <span class="item-title">${escapeHTML(edu.degree || 'Degree')}</span>
            ${edu.field ? ` in ${escapeHTML(edu.field)}` : ''}
            ${(edu.school || edu.institution) ? `<span class="item-divider"> • </span><span class="item-subtitle">${escapeHTML(edu.school || edu.institution)}</span>` : ''}
          </div>
          <div class="item-date">
            ${escapeHTML(dateStr)}
            ${edu.gpa ? `<span class="item-location"> | GPA: ${escapeHTML(edu.gpa)}</span>` : ''}
          </div>
        </div>
      `;
      }).join('')}
    </section>
  ` : '';

  // Projects section
  const projectsHTML = (projects && projects.length > 0) ? `
    <section class="section">
      <h2 class="section-title">${isFresher ? 'Key Projects & Technical Implementations' : 'Featured Projects'}</h2>
      ${projects.map((proj: any) => {
        const projName = proj.name || proj.title || 'Project';
        const projTech = proj.tech || (Array.isArray(proj.techStack) ? proj.techStack.join(', ') : '');
        const projUrl = proj.url || proj.link || '';
        const cleanProjUrl = cleanUrl(projUrl);
        const bullets = Array.isArray(proj.bullets) ? proj.bullets.filter(Boolean) : [];
        const hasBullets = bullets.length > 0;
        return `
        <div class="item">
          <div class="item-header">
            <div>
              <span class="item-title">${escapeHTML(projName)}</span>
              ${projTech ? `<span class="item-tech"> (${escapeHTML(projTech)})</span>` : ''}
            </div>
            ${projUrl ? `
              <div class="item-date">
                <a href="${escapeHTML(projUrl.startsWith('http') ? projUrl : `https://${projUrl}`)}" target="_blank" class="proj-link">${escapeHTML(cleanProjUrl)}</a>
              </div>
            ` : ''}
          </div>
          ${!hasBullets && proj.description ? `<p class="item-desc">${escapeHTML(proj.description)}</p>` : ''}
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

  // Certifications section
  const certificationsHTML = (certifications && certifications.length > 0) ? `
    <section class="section">
      <h2 class="section-title">Certifications & Credentials</h2>
      <div class="cert-grid">
        ${certifications.map((cert: any) => `
          <div class="cert-item">
            <div>
              <span class="item-title">${escapeHTML(cert.name || 'Certification')}</span>
              ${cert.issuer ? `<span class="item-subtitle"> — ${escapeHTML(cert.issuer)}</span>` : ''}
            </div>
            ${cert.date ? `<div class="item-date">${escapeHTML(cert.date)}</div>` : ''}
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
    @page {
      size: A4;
      margin: 12mm 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background-color: #ffffff;
      line-height: 1.45;
      font-size: 10pt;
      -webkit-font-smoothing: antialiased;
    }
    a {
      color: inherit;
      text-decoration: none;
    }
    .proj-link {
      color: #2563eb;
      text-decoration: underline;
    }
    .container {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
    }
    /* Header */
    .header {
      text-align: center;
      border-bottom: 2px solid ${primaryColor};
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .name {
      font-size: 20pt;
      font-weight: 800;
      color: ${primaryColor};
      letter-spacing: -0.3px;
      text-transform: uppercase;
      line-height: 1.1;
      margin-bottom: 3px;
    }
    .title {
      font-size: 10pt;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .contact-info {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: 6px;
      font-size: 9pt;
      color: #475569;
    }
    .contact-item {
      display: inline-flex;
      align-items: center;
    }
    .separator {
      color: #94a3b8;
      font-weight: bold;
      user-select: none;
    }
    /* Sections */
    .section {
      margin-bottom: 12px;
      page-break-inside: auto;
    }
    .section-title {
      font-size: 10.5pt;
      font-weight: 700;
      color: ${primaryColor};
      text-transform: uppercase;
      letter-spacing: 0.6px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 2px;
      margin-bottom: 6px;
      page-break-after: avoid;
      break-after: avoid;
    }
    .summary-text {
      font-size: 9.5pt;
      color: #334155;
      line-height: 1.45;
      text-align: justify;
    }
    /* Experience & Projects */
    .item {
      margin-bottom: 8px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .item:last-child {
      margin-bottom: 0;
    }
    .item-header, .edu-item, .cert-item {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 2px;
      page-break-inside: avoid;
      break-inside: avoid;
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
    .item-divider {
      color: #94a3b8;
      font-size: 9pt;
    }
    .item-tech {
      font-size: 8.5pt;
      color: #64748b;
      font-weight: 500;
    }
    .item-date {
      font-size: 8.5pt;
      font-weight: 600;
      color: #475569;
      white-space: nowrap;
      text-align: right;
    }
    .item-location {
      font-style: italic;
      color: #64748b;
      font-weight: normal;
    }
    .item-desc {
      font-size: 9pt;
      color: #334155;
      margin: 2px 0;
    }
    .bullets {
      list-style-type: disc;
      padding-left: 18px;
      margin-top: 3px;
    }
    .bullets li {
      font-size: 9pt;
      color: #334155;
      line-height: 1.4;
      margin-bottom: 2px;
    }
    /* Skills */
    .skills-grid {
      display: flex;
      flex-direction: column;
      gap: 3px;
      page-break-inside: avoid;
      break-inside: avoid;
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
      color: #334155;
      display: inline;
    }
    .cert-grid {
      display: flex;
      flex-direction: column;
      gap: 4px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <header class="header">
      <h1 class="name">${escapeHTML(contact.name || 'Candidate Name')}</h1>
      ${contact.title ? `<div class="title">${escapeHTML(contact.title)}</div>` : ''}
      <div class="contact-info">
        ${contactParts.map(part => `<span class="contact-item">${part}</span>`).join(' <span class="separator">•</span> ')}
      </div>
    </header>

    <!-- Professional Summary -->
    ${summary ? `
    <section class="section">
      <h2 class="section-title">Professional Summary</h2>
      <p class="summary-text">${escapeHTML(summary)}</p>
    </section>
    ` : ''}

    ${skillsHTML}

    ${isFresher ? `
      ${educationHTML}
      ${projectsHTML}
      ${experienceHTML}
    ` : `
      ${experienceHTML}
      ${educationHTML}
      ${projectsHTML}
    `}

    ${certificationsHTML}
  </div>
</body>
</html>`;
}

function cleanUrl(url: string): string {
  if (!url) return '';
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
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
