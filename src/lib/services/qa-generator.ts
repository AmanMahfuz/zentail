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

  const rawQuestions: any[] = Array.isArray(parsed.questions) ? parsed.questions : [];

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
