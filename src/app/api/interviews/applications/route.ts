import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get all applications
    const { data: applications, error: appError } = await (supabase as any)
      .from('applications')
      .select('id, job_title, company_name, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (appError) throw appError;

    if (!applications || applications.length === 0) {
      return NextResponse.json([]);
    }

    // 2. For each application, get recommendation, Q&A bank, and interview sessions
    const enrichedApps = await Promise.all(
      applications.map(async (app: any) => {
        // Get recommendation for missing skills
        const { data: rec } = await (supabase as any)
          .from('resume_recommendations')
          .select('missing_skills, match_score')
          .eq('application_id', app.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Get Q&A bank
        let qaBank = { totalQuestions: 0, categories: [] as string[] };

        const { data: qaBankData } = await (supabase as any)
          .from('qa_banks')
          .select('questions')
          .eq('application_id', app.id)
          .maybeSingle();

        if (qaBankData?.questions) {
          const questions = qaBankData.questions as any[];
          qaBank = {
            totalQuestions: questions.length,
            categories: Array.from(new Set(questions.map((q: any) => q.category))) as string[],
          };
        }

        // Get interview sessions
        const { data: sessions } = await (supabase as any)
          .from('interview_sessions')
          .select('score, created_at')
          .eq('application_id', app.id)
          .order('created_at', { ascending: false });

        let totalSessions = 0;
        let bestScore = 0;
        let averageScore = 0;
        let lastScore: number | undefined;
        let lastSessionDate: string | undefined;

        if (sessions && sessions.length > 0) {
          totalSessions = sessions.length;
          const scores = sessions.map((s: any) => s.score);
          bestScore = Math.max(...scores);
          averageScore = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
          lastScore = sessions[0].score;
          lastSessionDate = sessions[0].created_at;
        }

        // 3. Determine skills to upgrade based on:
        //    - Missing skills from recommendation
        //    - Recent interview performance
        const skillsToUpgrade = generateSkillsToUpgrade({
          missingSkills: rec?.missing_skills || [],
          averageScore,
          bestScore,
          totalSessions,
        });

        return {
          id: app.id,
          jobTitle: app.job_title,
          companyName: app.company_name,
          status: app.status,
          qaBank,
          totalSessions,
          bestScore,
          averageScore,
          lastScore,
          lastSessionDate,
          skillsToUpgrade,
        };
      })
    );

    return NextResponse.json(enrichedApps);
  } catch (error) {
    console.error('Interviews fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interviews' },
      { status: 500 }
    );
  }
}

/**
 * Generate skills to upgrade based on performance and missing skills
 */
function generateSkillsToUpgrade(data: {
  missingSkills: string[];
  averageScore: number;
  bestScore: number;
  totalSessions: number;
}): Array<{ name: string; urgency: 'high' | 'medium' | 'low' }> {
  const skills: Array<{ name: string; urgency: 'high' | 'medium' | 'low' }> = [];

  // Missing skills are always high priority
  if (data.missingSkills.length > 0) {
    data.missingSkills.slice(0, 3).forEach(skill => {
      skills.push({
        name: skill,
        urgency: 'high',
      });
    });
  }

  // If average score is low, add generic skills to improve
  if (data.averageScore < 60 && data.totalSessions > 0) {
    skills.push(
      {
        name: 'Answer Structuring',
        urgency: 'high',
      },
      {
        name: 'Technical Clarity',
        urgency: 'medium',
      }
    );
  } else if (data.averageScore < 75 && data.totalSessions > 0) {
    skills.push(
      {
        name: 'Follow-up Handling',
        urgency: 'medium',
      },
      {
        name: 'Example Specificity',
        urgency: 'medium',
      }
    );
  }

  // Gap between best and average means inconsistency
  if (data.bestScore - data.averageScore > 15 && data.totalSessions > 2) {
    skills.push({
      name: 'Consistency Improvement',
      urgency: 'medium',
    });
  }

  // Remove duplicates
  const uniqueSkills = Array.from(
    new Map(skills.map(s => [s.name.toLowerCase(), s])).values()
  );

  return uniqueSkills;
}
