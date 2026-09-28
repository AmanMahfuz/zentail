import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import puppeteer from 'puppeteer';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  return handleDownload(req, params);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  return handleDownload(req, params);
}

async function handleDownload(
  req: NextRequest,
  paramsPromise: Promise<{ applicationId: string }>
) {
  try {
    const { applicationId } = await paramsPromise;
    const supabase = await createClient();

    // 1. Verify user auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch application details
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .eq('user_id', user.id)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Application not found or unauthorized' },
        { status: 404 }
      );
    }

    // 3. Fetch QA bank questions
    const { data: qaBank } = await (supabase as any)
      .from('qa_banks')
      .select('*')
      .eq('application_id', applicationId)
      .maybeSingle();

    let questions: any[] = [];
    if (qaBank && Array.isArray(qaBank.questions) && qaBank.questions.length > 0) {
      questions = qaBank.questions;
    } else {
      // Return 404 if no questions have been generated yet
      return NextResponse.json(
        { error: 'Interview Q&A bank has not been generated for this application yet.' },
        { status: 404 }
      );
    }

    // 4. Generate clean HTML for the interview questions
    const html = generateQABankHTML({
      jobTitle: application.job_title || 'Position',
      companyName: application.company_name || 'Target Company',
      questions,
    });

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

      const safeCompany = (application.company_name || 'Interview').replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeRole = (application.job_title || 'Prep').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${safeCompany}_${safeRole}_Interview_QA_Bank_${new Date().toISOString().slice(0, 10)}.pdf`;

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
    console.error('Interview QA PDF Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

function generateQABankHTML({
  jobTitle,
  companyName,
  questions,
}: {
  jobTitle: string;
  companyName: string;
  questions: any[];
}): string {
  const categoriesCount: Record<string, number> = {};
  questions.forEach((q) => {
    const cat = (q.category || 'General').toLowerCase();
    categoriesCount[cat] = (categoriesCount[cat] || 0) + 1;
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHTML(companyName)} - ${escapeHTML(jobTitle)} Interview Q&A Bank</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background-color: #ffffff;
      line-height: 1.5;
      font-size: 9.5pt;
      -webkit-font-smoothing: antialiased;
    }
    .header {
      border-bottom: 2px solid #4F39F6;
      padding-bottom: 14px;
      margin-bottom: 16px;
    }
    .badge {
      display: inline-block;
      font-size: 7.5pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 2px 7px;
      border-radius: 4px;
    }
    .badge-primary {
      background: #eff6ff;
      color: #2563eb;
      border: 1px solid #bfdbfe;
    }
    .title {
      font-size: 18pt;
      font-weight: 800;
      color: #0f172a;
      margin-top: 6px;
      letter-spacing: -0.4px;
    }
    .subtitle {
      font-size: 10pt;
      color: #475569;
      margin-top: 3px;
    }
    .meta-row {
      display: flex;
      gap: 16px;
      margin-top: 10px;
      padding: 8px 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 8.5pt;
      color: #64748b;
    }
    .meta-item strong {
      color: #0f172a;
    }
    .stats-bar {
      display: flex;
      gap: 8px;
      margin-top: 8px;
      flex-wrap: wrap;
    }
    .stat-pill {
      font-size: 8pt;
      font-weight: 600;
      padding: 3px 8px;
      background: #f1f5f9;
      color: #334155;
      border-radius: 6px;
      text-transform: capitalize;
    }
    .question-card {
      margin-bottom: 14px;
      padding: 12px 14px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .q-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .q-number-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .num {
      width: 20px;
      height: 20px;
      background: #0f172a;
      color: white;
      font-weight: 800;
      font-size: 8pt;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .category-tag {
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      color: #4338ca;
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      padding: 1px 6px;
      border-radius: 4px;
    }
    .difficulty-tag {
      font-size: 8pt;
      color: #64748b;
      font-weight: 600;
      text-transform: capitalize;
    }
    .question-title {
      font-size: 11pt;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.35;
      margin-bottom: 8px;
    }
    .concepts {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }
    .concept-tag {
      font-size: 7pt;
      font-weight: 700;
      color: #4f46e5;
      background: #f5f3ff;
      border: 1px solid #ddd6fe;
      padding: 1px 5px;
      border-radius: 3px;
    }
    .section-label {
      font-size: 8pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .how-to-box {
      background: #fafaf9;
      border-left: 3px solid #f59e0b;
      padding: 6px 10px;
      margin-bottom: 6px;
      border-radius: 0 6px 6px 0;
    }
    .how-to-box .section-label {
      color: #b45309;
    }
    .how-to-text {
      font-size: 8.5pt;
      color: #44403c;
      line-height: 1.4;
    }
    .answer-box {
      background: #f0fdf4;
      border-left: 3px solid #16a34a;
      padding: 6px 10px;
      border-radius: 0 6px 6px 0;
    }
    .answer-box .section-label {
      color: #15803d;
    }
    .answer-text {
      font-size: 8.5pt;
      color: #166534;
      line-height: 1.4;
    }
    .footer {
      margin-top: 20px;
      text-align: center;
      font-size: 8pt;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
      padding-top: 8px;
    }
  </style>
</head>
<body>
  <div class="header">
    <span class="badge badge-primary">Zentail Executive Interview Preparation</span>
    <h1 class="title">${escapeHTML(jobTitle)} — Interview Q&A Bank</h1>
    <div class="subtitle">Target Opportunity: <strong>${escapeHTML(companyName)}</strong></div>
    <div class="meta-row">
      <div class="meta-item">Total Questions: <strong>${questions.length}</strong></div>
      <div class="meta-item">Format: <strong>STAR Method Structured</strong></div>
      <div class="meta-item">Date: <strong>${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong></div>
    </div>
    <div class="stats-bar">
      ${Object.entries(categoriesCount)
        .map(([cat, count]) => `<span class="stat-pill">${escapeHTML(cat)}: ${count}</span>`)
        .join('')}
    </div>
  </div>

  <div class="questions-list">
    ${questions
      .map(
        (q, idx) => `
      <div class="question-card">
        <div class="q-header">
          <div class="q-number-pill">
            <span class="num">${idx + 1}</span>
            <span class="category-tag">${escapeHTML(q.category || 'General')}</span>
          </div>
          <span class="difficulty-tag">${escapeHTML(q.difficulty || 'Medium')} Difficulty</span>
        </div>
        <div class="question-title">${escapeHTML(q.question)}</div>
        ${
          q.keywords && q.keywords.length > 0
            ? `<div class="concepts">${q.keywords
                .map((kw: string) => `<span class="concept-tag">${escapeHTML(kw)}</span>`)
                .join('')}</div>`
            : ''
        }
        ${
          q.howToAnswer
            ? `
        <div class="how-to-box">
          <div class="section-label">How to Structure Your Answer</div>
          <div class="how-to-text">${escapeHTML(q.howToAnswer)}</div>
        </div>
        `
            : ''
        }
        ${
          q.sampleAnswer
            ? `
        <div class="answer-box">
          <div class="section-label">Model Answer / Key Points</div>
          <div class="answer-text">${escapeHTML(q.sampleAnswer)}</div>
        </div>
        `
            : ''
        }
      </div>
    `
      )
      .join('')}
  </div>

  <div class="footer">
    Generated exclusively for your interview with ${escapeHTML(companyName)} by Zentail AI. All rights reserved.
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
