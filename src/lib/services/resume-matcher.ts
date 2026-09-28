import { GoogleGenAI } from "@google/genai";
import { ResumeMatchCandidate, ResumeRecommendation, RecommendationType } from "@/types/resume-matching";

export interface MatcherResumeInput {
  id: string;
  versionLabel: string;
  versionNumber: number;
  content: any;
}

export async function matchResumesAgainstJob(
  jobTitle: string,
  companyName: string,
  jobDescription: string,
  resumes: MatcherResumeInput[]
): Promise<ResumeRecommendation> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const ai = new GoogleGenAI({ apiKey });

  if (resumes.length === 0) {
    return {
      jobTitle,
      companyName,
      jobDescription,
      bestResumeId: null,
      bestResumeLabel: null,
      matchScore: 0,
      matchedSkills: [],
      missingSkills: ["No resumes uploaded"],
      recommendationType: "tailor_new",
      explanation: "No existing resumes found in your profile. Create or upload a resume to match against this job.",
      tailoringSuggestions: [
        "Upload your master resume",
        "Add relevant skills matching the job description",
        "Generate a tailored resume specifically for this position"
      ],
      allCandidates: []
    };
  }

  // Build candidate summaries for prompt
  const resumesSummary = resumes.map((r, idx) => {
    return `### RESUME CANDIDATE ${idx + 1}
ID: ${r.id}
Label: ${r.versionLabel} (v${r.versionNumber})
Content Summary:
${JSON.stringify({
  personal: r.content?.personal?.fullName || "Candidate",
  summary: r.content?.summary,
  skills: r.content?.skills?.map((s: any) => typeof s === 'string' ? s : s.name),
  experience: r.content?.experience?.map((e: any) => ({
    title: e.jobTitle,
    company: e.company,
    skills: e.skillsUsed
  })),
  projects: r.content?.projects?.map((p: any) => ({
    title: p.title,
    techStack: p.techStack
  }))
}, null, 2)}
`;
  }).join("\n---\n");

  const prompt = `
You are an expert technical recruiter and talent acquisition leader.
Analyze the following Job Posting and evaluate EACH candidate resume to find the strongest match.

## JOB POSTING
Role: ${jobTitle}
Company: ${companyName}
Description:
${jobDescription}

## CANDIDATE RESUMES
${resumesSummary}

## SCORING CRITERIA:
- Hard technical skills (programming languages, frameworks, cloud, databases) required vs present.
- Relevant project and experience alignment.
- Seniority and domain relevance.
- Score each candidate from 0 to 100.
- If score >= 75, recommendationType = "use_existing".
- If score < 75, recommendationType = "tailor_new".

Return ONLY raw JSON with no Markdown wrappers matching this structure:
{
  "bestResumeId": "string (the exact ID of the winning resume)",
  "bestResumeLabel": "string",
  "matchScore": number,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["missing1", "missing2"],
  "recommendationType": "use_existing" | "tailor_new",
  "explanation": "Detailed 2-3 sentence strategic rationale on why this resume won and how well it fits.",
  "tailoringSuggestions": [
    "Actionable bullet 1 to improve alignment",
    "Actionable bullet 2 to highlight missing keywords",
    "Actionable bullet 3"
  ],
  "candidates": [
    {
      "resumeId": "string",
      "versionLabel": "string",
      "matchScore": number,
      "matchedSkills": ["skill"],
      "missingSkills": ["skill"],
      "summary": "1 sentence verdict"
    }
  ]
}
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.2
    }
  });

  const text = response.text || "{}";
  const parsed = JSON.parse(text);

  const bestId = parsed.bestResumeId || resumes[0].id;
  const bestResume = resumes.find(r => r.id === bestId) || resumes[0];

  return {
    jobTitle,
    companyName,
    jobDescription,
    bestResumeId: bestResume.id,
    bestResumeLabel: bestResume.versionLabel || `V${bestResume.versionNumber}`,
    matchScore: Math.round(Number(parsed.matchScore) || 50),
    matchedSkills: Array.isArray(parsed.matchedSkills) ? parsed.matchedSkills : [],
    missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
    recommendationType: parsed.recommendationType === "use_existing" ? "use_existing" : "tailor_new",
    explanation: parsed.explanation || `Resume ${bestResume.versionLabel} is the closest match for ${jobTitle} at ${companyName}.`,
    tailoringSuggestions: Array.isArray(parsed.tailoringSuggestions) ? parsed.tailoringSuggestions : [
      "Highlight key requirements mentioned in the job description",
      "Add quantifiable metrics to relevant experience",
      "Align skill naming conventions with company terminology"
    ],
    allCandidates: Array.isArray(parsed.candidates) ? parsed.candidates.map((c: any) => {
      const match = resumes.find(r => r.id === c.resumeId);
      return {
        resumeId: c.resumeId || match?.id || "",
        versionLabel: c.versionLabel || match?.versionLabel || "Resume",
        versionNumber: match?.versionNumber || 1,
        matchScore: Math.round(Number(c.matchScore) || 50),
        matchedSkills: Array.isArray(c.matchedSkills) ? c.matchedSkills : [],
        missingSkills: Array.isArray(c.missingSkills) ? c.missingSkills : [],
        summary: c.summary || "Evaluated resume candidate"
      };
    }) : []
  };
}
