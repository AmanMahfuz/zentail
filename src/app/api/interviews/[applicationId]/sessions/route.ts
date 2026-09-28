import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const resolvedParams = await params;
    const applicationId = resolvedParams.applicationId;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: sessions, error } = await (supabase as any)
      .from('interview_sessions')
      .select('id, score, mode, duration_seconds, created_at, completed_at')
      .eq('application_id', applicationId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching interview sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      sessions: sessions || [],
    });
  } catch (error) {
    console.error('Error in fetch sessions route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
