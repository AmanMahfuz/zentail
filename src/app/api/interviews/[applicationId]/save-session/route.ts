import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const resolvedParams = await params;
    const applicationId = resolvedParams.applicationId;
    const body = await request.json();
    
    const { 
      mode, 
      answers, 
      overallFeedback, 
      overallScore, 
      duration_seconds,
      strengths = [],
      weaknesses = [],
      skillsPerformedWell = [],
      skillsToImprove = []
    } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Verify application exists and belongs to user
    const { data: app, error: appError } = await (supabase as any)
      .from('applications')
      .select('id, total_interview_sessions')
      .eq('id', applicationId)
      .eq('user_id', user.id)
      .single();

    if (appError || !app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // 2. Insert interview session
    const { data: session, error: insertError } = await (supabase as any)
      .from('interview_sessions')
      .insert({
        user_id: user.id,
        application_id: applicationId,
        mode,
        score: overallScore,
        answers,
        overall_feedback: overallFeedback,
        duration_seconds,
        strengths,
        weaknesses,
        skills_performed_well: skillsPerformedWell,
        skills_to_improve: skillsToImprove,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving interview session:', insertError);
      return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
    }

    // 3. Update application stats
    await (supabase as any)
      .from('applications')
      .update({ 
        last_interview_score: overallScore,
        total_interview_sessions: (app.total_interview_sessions || 0) + 1
      })
      .eq('id', applicationId);

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error('Error in save-session route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
