import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import puppeteer from 'puppeteer';
import PDFDocument from 'pdfkit';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleCoverLetterDownload(req, params);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleCoverLetterDownload(req, params);
}

async function handleCoverLetterDownload(
  req: NextRequest,
  paramsPromise: Promise<{ id: string }>
) {
  try {
    const { id } = await paramsPromise;
    const supabase = await createClient();

    // 1. Verify auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch cover letter record (by id or application_id)
    let coverLetter: any = null;
    const { data: byId } = await (supabase as any)
      .from('cover_letters_generated')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (byId) {
      coverLetter = byId;
    } else {
      const { data: byApp } = await (supabase as any)
        .from('cover_letters_generated')
        .select('*')
        .eq('application_id', id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (byApp) {
        coverLetter = byApp;
      }
    }

    if (!coverLetter) {
      return NextResponse.json(
        { error: 'Cover letter not found' },
        { status: 404 }
      );
    }

    // 3. Fetch application details if available
    let jobTitle = 'Target Role';
    let companyName = 'Hiring Team';

    if (coverLetter.application_id) {
      const { data: application } = await supabase
        .from('applications')
        .select('job_title, company_name')
        .eq('id', coverLetter.application_id)
        .maybeSingle();

      if (application) {
        jobTitle = application.job_title || coverLetter.job_title || jobTitle;
        companyName = application.company_name || coverLetter.company || companyName;
      }
    } else {
      jobTitle = coverLetter.job_title || jobTitle;
      companyName = coverLetter.company || companyName;
    }

    const candidateName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Applicant';
    const candidateEmail = user.email || '';
    const dateFormatted = new Date(coverLetter.created_at || Date.now()).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const coverLetterText = coverLetter.cover_letter_content || coverLetter.content || '';

    // 4. Generate clean HTML for Cover Letter
    const html = generateCoverLetterHTML({
      candidateName,
      candidateEmail,
      jobTitle,
      companyName,
      content: coverLetterText,
      dateStr: dateFormatted,
    });

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
            top: '20mm',
            bottom: '20mm',
            left: '20mm',
            right: '20mm',
          },
        });

        pdfBuffer = Buffer.from(rendered);
      } finally {
        await browser.close().catch(() => {});
      }
    } catch (puppeteerErr) {
      console.warn('[CoverLetterDownload] Puppeteer failed, using PDFKit fallback:', puppeteerErr);
      pdfBuffer = await generateCoverLetterPDFWithPDFKit({
        candidateName,
        candidateEmail,
        jobTitle,
        companyName,
        content: coverLetterText,
        dateStr: dateFormatted,
      });
    }

    const safeCompany = companyName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Cover_Letter_${safeCompany}_${new Date().toISOString().slice(0, 10)}.pdf`;

    // Save to Supabase Storage
    try {
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(`cover-letters/${user.id}/${filename}`, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        console.warn('[CoverLetterDownload] Failed to upload to Supabase Storage:', uploadError);
      } else {
        console.log(`[CoverLetterDownload] Successfully uploaded ${filename} to Supabase Storage.`);
      }
    } catch (e) {
      console.warn('[CoverLetterDownload] Error uploading to Supabase Storage:', e);
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
    console.error('Cover Letter PDF Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate Cover Letter PDF' },
      { status: 500 }
    );
  }
}

function generateCoverLetterPDFWithPDFKit({
  candidateName,
  candidateEmail,
  jobTitle,
  companyName,
  content,
  dateStr,
}: {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyName: string;
  content: string;
  dateStr: string;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 54, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#0f172a').text(candidateName.toUpperCase());
    if (candidateEmail) {
      doc.fontSize(9.5).font('Helvetica').fillColor('#64748b').text(candidateEmail);
    }
    doc.moveDown(1);
    doc.strokeColor('#0f172a').lineWidth(1.5).moveTo(54, doc.y).lineTo(541, doc.y).stroke();
    doc.moveDown(1.2);

    // Date & Recipient
    doc.fontSize(9.5).font('Helvetica').fillColor('#64748b').text(dateStr);
    doc.moveDown(0.6);
    doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#0f172a').text('Hiring Team');
    doc.fontSize(10).font('Helvetica').fillColor('#334155').text(companyName);
    doc.moveDown(0.4);
    doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#0f172a').text(`Re: Application for ${jobTitle}`);
    doc.moveDown(1.2);

    // Content
    doc.fontSize(10).font('Helvetica').fillColor('#334155');
    const paragraphs = content.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    paragraphs.forEach((p) => {
      doc.text(p, { align: 'justify', lineGap: 3 });
      doc.moveDown(0.8);
    });

    // Sign off
    doc.moveDown(0.8);
    doc.text('Sincerely,');
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fillColor('#0f172a').text(candidateName);

    doc.end();
  });
}

function generateCoverLetterHTML({
  candidateName,
  candidateEmail,
  jobTitle,
  companyName,
  content,
  dateStr,
}: {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyName: string;
  content: string;
  dateStr: string;
}): string {
  // Format paragraphs from markdown / plain text
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Cover Letter — ${escapeHTML(candidateName)}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
      background-color: #ffffff;
      line-height: 1.6;
      font-size: 10.5pt;
      -webkit-font-smoothing: antialiased;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 14px;
      margin-bottom: 24px;
    }
    .candidate-name {
      font-size: 22pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
      text-transform: uppercase;
    }
    .candidate-email {
      font-size: 9.5pt;
      color: #64748b;
      margin-top: 3px;
    }
    .letter-meta {
      margin-bottom: 24px;
      font-size: 10pt;
      color: #334155;
    }
    .date {
      color: #64748b;
      margin-bottom: 16px;
      font-weight: 500;
    }
    .recipient {
      line-height: 1.4;
    }
    .recipient-role {
      font-weight: 700;
      color: #0f172a;
    }
    .content-body {
      color: #334155;
      font-size: 10pt;
      line-height: 1.65;
    }
    .paragraph {
      margin-bottom: 14px;
      text-align: justify;
    }
    .sign-off {
      margin-top: 28px;
      line-height: 1.5;
    }
    .signature-name {
      font-weight: 700;
      color: #0f172a;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="candidate-name">${escapeHTML(candidateName)}</h1>
    ${candidateEmail ? `<div class="candidate-email">${escapeHTML(candidateEmail)}</div>` : ''}
  </div>

  <div class="letter-meta">
    <div class="date">${escapeHTML(dateStr)}</div>
    <div class="recipient">
      <div>Hiring Team</div>
      <div class="recipient-role">${escapeHTML(companyName)}</div>
      <div>Re: Application for <strong>${escapeHTML(jobTitle)}</strong></div>
    </div>
  </div>

  <div class="content-body">
    ${paragraphs.map((p) => `<p class="paragraph">${escapeHTML(p)}</p>`).join('')}
  </div>

  <div class="sign-off">
    <p>Sincerely,</p>
    <div class="signature-name">${escapeHTML(candidateName)}</div>
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
