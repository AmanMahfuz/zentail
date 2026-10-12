import { GoogleGenAI } from "@google/genai";
import { generateContentWithRetry } from "@/lib/gemini";
import { QABank, QABankQuestion } from "@/types/resume-matching";

export async function generateQABankForRole(
  jobTitle: string,
  companyName: string,
  jobDescription: string,
  resumeContent?: any
): Promise<QABank> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const ai = new GoogleGenAI({ apiKey });

  const resumeContext = resumeContent ? JSON.stringify({
    fullName: resumeContent.personal?.fullName,
    skills: resumeContent.skills,
    experience: resumeContent.experience?.map((e: any) => ({
      title: e.jobTitle,
      company: e.company,
      bullets: e.bullets,
      skillsUsed: e.skillsUsed
    })),
    projects: resumeContent.projects?.map((p: any) => ({
      title: p.title,
      description: p.description,
      techStack: p.techStack
    }))
  }, null, 2) : "General candidate profile";

  const prompt = `
You are an expert hiring manager and technical interviewer preparing a comprehensive 15-question interview Q&A bank.

## TARGET ROLE:
Position: ${jobTitle}
Company: ${companyName}

## JOB DESCRIPTION:
${jobDescription}

## CANDIDATE PROFILE & EVIDENCE:
${resumeContext}

## INSTRUCTIONS:
Generate exactly 14-15 realistic, role-specific interview questions divided across:
1. "technical" (4-5 questions): Deep-dive into technical stack, languages, architecture, debugging, or frameworks mentioned in the job.
2. "behavioral" (3-4 questions): STAR method questions testing teamwork, conflict, leadership, or handling tight deadlines.
3. "system_design" (2-3 questions): Scalability, data flow, architecture, or API design tailored to this company's scale.
4. "situational" (3-4 questions): Real-world challenges, trade-offs, handling production outages, or ambiguity.

For EVERY question, write:
- A high-scoring, authentic "modelAnswer" referencing the candidate's actual projects/skills where applicable.
- 3-4 "keyPoints" (what the interviewer will evaluate and must hear).
- "difficulty": "junior" | "mid" | "senior" | "lead".

Return ONLY raw JSON with no Markdown wrappers matching this structure:
{
  "questions": [
    {
      "id": "q-1",
      "category": "technical",
      "difficulty": "senior",
      "question": "string",
      "modelAnswer": "string (structured, comprehensive answer)",
      "keyPoints": ["point 1", "point 2", "point 3"]
    }
  ]
}
`;

  let rawQuestions: any[] = [];
  try {
    const response = await generateContentWithRetry({
      ai,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3
      }
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    rawQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];
  } catch (err) {
    console.warn("[QAGenerator] AI generation failed or depleted, using role-targeted question generator:", err);
  }

  if (rawQuestions.length === 0) {
    const candSkills = Array.isArray(resumeContent?.skills) ? resumeContent.skills : [];
    const topSkills = candSkills.length > 0 ? candSkills.slice(0, 3) : ["Modern Web Tech", "Architecture", "Databases"];
    rawQuestions = [
      {
        id: "q-1",
        category: "technical",
        difficulty: "mid",
        question: `How do you approach debugging and optimizing performance in applications built with ${topSkills[0]}?`,
        modelAnswer: `I systematically analyze bottlenecks using profiling tools, inspect network/render lifecycles, and implement optimizations such as caching, memoization, and lazy loading.`,
        keyPoints: ["Profiling tools", "Root cause isolation", "Measurable performance gains"]
      },
      {
        id: "q-2",
        category: "technical",
        difficulty: "mid",
        question: `Can you walk me through the architecture of a production feature you built using ${topSkills[1] || topSkills[0]}?`,
        modelAnswer: `I designed modular service layers with clear separation of concerns, ensuring decoupled data flow and comprehensive error boundaries.`,
        keyPoints: ["Modularity", "Error handling", "Maintainability"]
      },
      {
        id: "q-3",
        category: "behavioral",
        difficulty: "mid",
        question: `Tell me about a time you had to balance delivery deadlines with technical quality. How did you decide what trade-offs to make?`,
        modelAnswer: `I communicated transparently with stakeholders, prioritized core user flows, and logged necessary follow-up technical debt tickets for subsequent sprints.`,
        keyPoints: ["Stakeholder communication", "Pragmatic trade-offs", "Ownership"]
      },
      {
        id: "q-4",
        category: "situational",
        difficulty: "junior",
        question: `How do you stay up to date with rapid changes in ${topSkills[0]} and related web ecosystems?`,
        modelAnswer: `I actively review official release changelogs, build hands-on prototypes for new paradigms, and contribute to developer communities.`,
        keyPoints: ["Continuous learning", "Practical prototyping", "Community engagement"]
      },
      {
        id: "q-5",
        category: "system_design",
        difficulty: "senior",
        question: `How would you design a resilient data synchronization mechanism between the client and backend for high-traffic operations?`,
        modelAnswer: `I would utilize optimistic UI updates paired with idempotent background sync endpoints, queue retries with exponential backoff, and state reconciling.`,
        keyPoints: ["Idempotency", "Optimistic updates", "Fault tolerance"]
      }
    ];
  }

  const questions: QABankQuestion[] = rawQuestions.map((q, idx) => {
    const validCategories = ["technical", "behavioral", "system_design", "situational"];
    const validDifficulties = ["junior", "mid", "senior", "lead"];

    const cat = validCategories.includes(q.category) ? q.category : "technical";
    const diff = validDifficulties.includes(q.difficulty) ? q.difficulty : "mid";

    return {
      id: q.id || `q-${idx + 1}`,
      category: cat as any,
      difficulty: diff as any,
      question: q.question || `Interview question ${idx + 1}`,
      modelAnswer: q.modelAnswer || "Model answer outlining key concepts and practical implementation.",
      keyPoints: Array.isArray(q.keyPoints) && q.keyPoints.length > 0 ? q.keyPoints : [
        "Clarity and technical depth",
        "Demonstrated hands-on experience",
        "Clear communication of trade-offs"
      ]
    };
  });

  return {
    jobTitle,
    companyName,
    totalQuestions: questions.length,
    questions,
    createdAt: new Date().toISOString()
  };
}
