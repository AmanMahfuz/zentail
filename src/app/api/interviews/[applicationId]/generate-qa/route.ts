import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenAI } from '@google/genai';
import { generateContentWithRetry } from '@/lib/gemini';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const supabase = await createClient();

    // Verify auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const applicationId = resolvedParams.applicationId;

    // 1. Get the application
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .eq('user_id', user.id)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // 2. Check if Q&A bank already exists
    const { data: existingQA } = await (supabase as any)
      .from('qa_banks')
      .select('id, questions')
      .eq('application_id', applicationId)
      .maybeSingle();

    if (existingQA && existingQA.questions && (existingQA.questions as any[]).length > 0) {
      return NextResponse.json(
        { message: 'Q&A bank already exists', questions: existingQA.questions, qaBank: existingQA },
        { status: 200 }
      );
    }

    // 3. Fetch candidate's career evidence to ground interview questions
    const { data: evidenceProjects } = await (supabase as any)
      .from('evidence_projects')
      .select('title, description, tech_stack')
      .eq('user_id', user.id);

    const { data: evidenceExp } = await (supabase as any)
      .from('evidence_experience')
      .select('job_title, company, description, skills_used')
      .eq('user_id', user.id);

    const { data: resumeVersion } = application.resume_version_id
      ? await (supabase as any).from('resume_versions').select('content').eq('id', application.resume_version_id).maybeSingle()
      : { data: null };

    const rContent = (resumeVersion?.content || {}) as any;
    const candidateProjects = (evidenceProjects && evidenceProjects.length > 0)
      ? evidenceProjects
      : (rContent.projects || []).map((p: any) => ({
          title: p.name || p.title,
          description: p.description,
          tech_stack: Array.isArray(p.techStack) ? p.techStack : (p.tech ? [p.tech] : [])
        }));

    const candidateExp = (evidenceExp && evidenceExp.length > 0)
      ? evidenceExp
      : (rContent.experience || []).map((e: any) => ({
          job_title: e.title || e.jobTitle,
          company: e.company,
          description: e.description,
          skills_used: e.skillsUsed || []
        }));

    // 4. Generate questions using Gemini with resilient fallback
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    const jobDescription = application.job_description || application.job_title;
    const companyName = application.company_name;

    let questions: any[] = [];

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `You are an expert technical interviewer and hiring manager. Generate realistic interview questions tailored for this role and candidate:

POSITION: ${application.job_title}
COMPANY: ${companyName}
JOB DESCRIPTION: ${jobDescription}

CANDIDATE EVIDENCE:
Projects:
${JSON.stringify(candidateProjects, null, 2)}

Experience:
${JSON.stringify(candidateExp, null, 2)}

CRITICAL SYSTEM RULES:
1. Ground technical questions in the candidate's verified projects (e.g. asking how they implemented specific features with their tech stack).
2. Ground behavioral questions in real engineering scenarios relevant to their projects and background.
3. For sample answers, reference their actual projects and technologies rather than generic textbook responses.
4. Generate 12-15 questions covering:
   - 4 Technical Architecture & Coding questions
   - 4 Behavioral / Project-deep-dive questions
   - 3 Situational & Problem-solving questions
   - 2 Culture & Role alignment questions

Return ONLY a valid JSON array:
[
  {
    "id": "q-1",
    "question": "The actual interview question",
    "category": "behavioral|technical|situational|cultural",
    "difficulty": "easy|medium|hard",
    "groundedEvidence": "Name of project or experience this question tests (e.g. Interactive Web Application)",
    "howToAnswer": "Actionable advice on how to structure the answer (e.g., STAR method, key trade-offs to highlight)",
    "sampleAnswer": "A strong, evidence-grounded sample response referencing the candidate's actual project",
    "followUp": "Optional follow-up question to probe deeper",
    "keywords": ["keyword1", "keyword2"],
    "expectedKeywords": ["most important keyword"]
  }
]`;

        const response = await generateContentWithRetry({
          ai,
          contents: prompt,
        });

        const responseText = (response as any).text || '';

        try {
          questions = JSON.parse(responseText);
        } catch {
          const jsonMatch = responseText.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            questions = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (geminiError) {
        console.warn('Gemini question generation error, falling back to role-tailored questions:', geminiError);
      }
    }

    // If Gemini failed or key invalid, generate high-quality fallback questions
    if (!Array.isArray(questions) || questions.length === 0) {
      questions = generateFallbackQuestions(application.job_title, companyName);
    }

    // 4. Save Q&A bank to database
    const categories = Array.from(new Set(questions.map((q: any) => q.category)));
    const { data: qaBank, error: qaError } = await (supabase as any)
      .from('qa_banks')
      .upsert({
        user_id: user.id,
        application_id: applicationId,
        categories,
        questions,
      }, { onConflict: 'application_id' })
      .select()
      .single();

    if (qaError) {
      console.error('Database error inserting QA bank:', qaError);
      throw qaError;
    }

    // 5. Update application to mark QA bank as generated
    await (supabase as any)
      .from('applications')
      .update({
        qa_bank_generated_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    return NextResponse.json({
      success: true,
      questions,
      qaBank: {
        id: qaBank?.id,
        totalQuestions: questions.length,
        categories: Array.from(new Set(questions.map((q: any) => q.category))),
      },
      message: 'Q&A bank generated successfully',
    });
  } catch (error) {
    console.error('QA generation error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate Q&A bank',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/interviews/[applicationId]/generate-qa
 * Check if Q&A bank exists, if not generate it
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;

    // Check if Q&A bank exists
    const { data: qaBank } = await (supabase as any)
      .from('qa_banks')
      .select('id, questions')
      .eq('application_id', resolvedParams.applicationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (qaBank && qaBank.questions) {
      return NextResponse.json({
        exists: true,
        questions: qaBank.questions,
        qaBank,
      });
    }

    // Q&A bank doesn't exist - caller should POST to generate it
    return NextResponse.json({
      exists: false,
      message: 'Q&A bank not yet generated. Call POST to generate.',
    });
  } catch (error) {
    console.error('QA check error:', error);
    return NextResponse.json(
      { error: 'Failed to check Q&A bank' },
      { status: 500 }
    );
  }
}

function generateFallbackQuestions(jobTitle: string, companyName: string) {
  return [
    {
      id: "q-1",
      question: `Tell me about a challenging project related to ${jobTitle} that you led or significantly contributed to. What was your approach?`,
      category: "behavioral",
      difficulty: "medium",
      howToAnswer: "Use the STAR framework (Situation, Task, Action, Result). Focus 70% of your time on the specific Actions you took and quantifiable Results.",
      sampleAnswer: `In my previous project, we needed to optimize system throughput under heavy user traffic. I redesigned the core processing pipeline and implemented distributed caching, which reduced latency by 42% and supported 3x traffic without downtime.`,
      keywords: ["STAR method", "ownership", "measurable impact", "architecture"],
      expectedKeywords: ["leadership", "problem solving"]
    },
    {
      id: "q-2",
      question: `What are the core technical design principles and architectural patterns you rely on when building scalable solutions for ${jobTitle}?`,
      category: "technical",
      difficulty: "hard",
      howToAnswer: "Discuss separation of concerns, modularity, fault tolerance, and trade-offs between speed of delivery vs. long-term maintainability.",
      sampleAnswer: `I prioritize high cohesion and loose coupling. For microservices and web APIs, I implement clear boundary contracts, idempotent endpoints, and resilient error recovery mechanisms.`,
      keywords: ["scalability", "modularity", "trade-offs", "resilience"],
      expectedKeywords: ["system design", "best practices"]
    },
    {
      id: "q-3",
      question: `How do you diagnose and debug a complex, intermittent production bug that cannot be easily reproduced locally?`,
      category: "technical",
      difficulty: "medium",
      howToAnswer: "Walk through your systematic troubleshooting methodology: logging, APM telemetry, bisecting commits, metrics, and isolating variables.",
      sampleAnswer: `I first inspect distributed traces and correlation IDs in the observability dashboard. I correlate error spikes with recent deployments and dependency latency, then write targeted reproduction integration tests before pushing a verified patch.`,
      keywords: ["observability", "metrics", "debugging", "root cause analysis"],
      expectedKeywords: ["structured troubleshooting", "isolation"]
    },
    {
      id: "q-4",
      question: `Describe a situation where you had a strong technical disagreement with a teammate or senior engineer. How did you resolve it?`,
      category: "behavioral",
      difficulty: "medium",
      howToAnswer: "Show emotional intelligence, objectivity, and commitment to project goals over ego. Demonstrate data-driven decision making.",
      sampleAnswer: `We differed on choosing between synchronous RPC vs. event-driven messaging. Rather than debating opinions, I created a quick benchmark prototype demonstrating backpressure under load, which led the team to adopt the event-driven approach smoothly.`,
      keywords: ["collaboration", "conflict resolution", "data-driven", "teamwork"],
      expectedKeywords: ["communication", "consensus"]
    },
    {
      id: "q-5",
      question: `Why are you interested in joining ${companyName} specifically, and how does this ${jobTitle} position align with your career trajectory?`,
      category: "cultural",
      difficulty: "easy",
      howToAnswer: "Connect your specific technical strengths with the company's product vision and market challenges. Show you've researched their domain.",
      sampleAnswer: `I've followed ${companyName}'s growth and product development. This role allows me to leverage my core skills while solving impactful problems at scale.`,
      keywords: ["company alignment", "mission", "career goals", "value add"],
      expectedKeywords: ["culture fit", "passion"]
    },
    {
      id: "q-6",
      question: `How do you balance technical debt against the pressure to deliver product features rapidly under tight deadlines?`,
      category: "situational",
      difficulty: "medium",
      howToAnswer: "Explain pragmatic engineering: make trade-offs transparent, document shortcuts as explicit backlog items, and allocate recurring capacity for refactoring.",
      sampleAnswer: `I communicate trade-offs in business terms: shipping fast today with documented guardrails, while allocating 20% of sprint capacity to pay down highest-risk debt before it compounds.`,
      keywords: ["pragmatism", "velocity", "risk management", "prioritization"],
      expectedKeywords: ["trade-offs", "delivery"]
    },
    {
      id: "q-7",
      question: `What strategies and automated testing practices do you implement to ensure high code quality and prevent regressions?`,
      category: "technical",
      difficulty: "medium",
      howToAnswer: "Describe the testing pyramid: unit tests for business logic, integration tests for API contracts, and automated CI/CD gating.",
      sampleAnswer: `I use a combination of automated unit tests for edge cases, contract testing for external integrations, and strict linting/typing in our CI pipeline prior to merging.`,
      keywords: ["unit testing", "CI/CD", "code quality", "regressions"],
      expectedKeywords: ["test coverage", "automation"]
    },
    {
      id: "q-8",
      question: `Tell me about a time a project you were working on failed or missed a critical deadline. What did you learn?`,
      category: "behavioral",
      difficulty: "hard",
      howToAnswer: "Take ownership without making excuses. Focus on root causes (e.g., scoping ambiguity) and the enduring improvements you instituted afterward.",
      sampleAnswer: `Early on, unexpected 3rd-party API limitations caused a 2-week delay. I learned the necessity of spike investigations and setting buffer milestones early in sprint planning.`,
      keywords: ["accountability", "growth mindset", "retrospective", "learning"],
      expectedKeywords: ["ownership", "resilience"]
    },
    {
      id: "q-9",
      question: `Imagine a critical service crashes during peak user traffic and you are the first engineer on-call. What are your immediate first 15 minutes?`,
      category: "situational",
      difficulty: "hard",
      howToAnswer: "Emphasize incident management protocol: acknowledge, triage/mitigate (e.g. rollback, scale up), communicate status, and conduct post-mortem later.",
      sampleAnswer: `My priority is user restoration over debugging: verify alerts, check if a recent deployment occurred, rollback or enable circuit breakers, notify stakeholders, and save heap/log dumps for root-cause analysis once stabilized.`,
      keywords: ["incident response", "triage", "rollback", "communication"],
      expectedKeywords: ["calm under pressure", "mitigation"]
    },
    {
      id: "q-10",
      question: `How do you approach learning new technologies, libraries, or programming paradigms required for a new project?`,
      category: "cultural",
      difficulty: "easy",
      howToAnswer: "Highlight curiosity, structured learning (reading docs, building small proof-of-concepts), and sharing knowledge with team members.",
      sampleAnswer: `I dive into official documentation, build a sandboxed prototype to understand mental models and limitations, and summarize key takeaways in our team knowledge base.`,
      keywords: ["continuous learning", "prototyping", "knowledge sharing", "adaptability"],
      expectedKeywords: ["curiosity", "speed of learning"]
    },
    {
      id: "q-11",
      question: `What security best practices do you incorporate into your day-to-day software development lifecycle?`,
      category: "technical",
      difficulty: "medium",
      howToAnswer: "Mention OWASP top vulnerabilities, input sanitization, least-privilege access, secret management, and dependency vulnerability scanning.",
      sampleAnswer: `I enforce input validation, ensure all secrets are fetched from secure vaults (never hardcoded), use parameterized queries to eliminate injection, and audit dependencies regularly.`,
      keywords: ["OWASP", "least privilege", "encryption", "sanitization"],
      expectedKeywords: ["security first", "auth"]
    },
    {
      id: "q-12",
      question: `Tell me about a time you mentored a junior engineer or helped onboard a new team member. What was your strategy?`,
      category: "behavioral",
      difficulty: "easy",
      howToAnswer: "Show mentorship skills, empathy, pairing sessions, constructive code reviews, and creating a supportive learning environment.",
      sampleAnswer: `I created a structured 30-day onboarding roadmap with beginner-friendly starter tasks and scheduled daily 15-minute syncs. Within three weeks, the engineer shipped their first major feature independently.`,
      keywords: ["mentorship", "empathy", "code review", "team growth"],
      expectedKeywords: ["leadership", "support"]
    },
    {
      id: "q-13",
      question: `If product management requests an urgent feature that compromises system performance or reliability, how do you navigate that discussion?`,
      category: "situational",
      difficulty: "medium",
      howToAnswer: "Show cross-functional partnership: understand the underlying business objective and propose phased alternatives that meet business goals safely.",
      sampleAnswer: `I seek to understand the true business urgency and propose an MVP with scoped traffic or feature flags, followed by proper hardening, rather than flatly rejecting the request.`,
      keywords: ["cross-functional", "stakeholder management", "compromise", "phased rollout"],
      expectedKeywords: ["diplomacy", "business acumen"]
    },
    {
      id: "q-14",
      question: `What performance optimization technique have you implemented that yielded the most significant real-world improvement?`,
      category: "technical",
      difficulty: "hard",
      howToAnswer: "Name specific bottlenecks (database queries, N+1 query problem, bundle size, cache invalidation) and the quantitative before-and-after results.",
      sampleAnswer: `I resolved a critical N+1 database querying issue in our main listing endpoint by introducing batch fetching and Redis caching, cutting P99 latency from 1.8s down to 120ms.`,
      keywords: ["profiling", "benchmarking", "caching", "optimization"],
      expectedKeywords: ["performance", "metrics"]
    },
    {
      id: "q-15",
      question: `Where do you see yourself evolving technically over the next 2-3 years, and what skills are you actively developing right now?`,
      category: "cultural",
      difficulty: "easy",
      howToAnswer: "Demonstrate long-term ambition, self-awareness, and dedication to mastering advanced architecture and leadership in your domain.",
      sampleAnswer: `I am deepening my expertise in distributed systems and AI-augmented workflows, with the goal of driving technical architecture decisions and helping mentor high-velocity engineering teams.`,
      keywords: ["growth", "ambition", "leadership", "continuous improvement"],
      expectedKeywords: ["self-awareness", "drive"]
    }
  ];
}
