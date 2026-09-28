import { NextRequest } from 'next/server';
import { GET as getResumePdf, POST as postResumePdf } from '@/app/api/resumes/[id]/download-pdf/route';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolved = await params;
  return getResumePdf(req, {
    params: Promise.resolve({ id: resolved.id }),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolved = await params;
  return postResumePdf(req, {
    params: Promise.resolve({ id: resolved.id }),
  });
}
