import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function analyzeFit(
  userId: string,
  jobDescription: string,
  resumeVersionId?: string
) {
  const supabase = createClient();
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // Get latest resume (or specific version)
  let resumeQuery = supabase
    .from("resume_versions")
    .select("content, version_number, version_label");
    
  if (resumeVersionId) {
    resumeQuery = resumeQuery.eq("id", resumeVersionId);
  } else {
    resumeQuery = resumeQuery.eq("user_id", userId).eq("is_latest", true);
  }
  
  const { data: resume } = await resumeQuery.single();

  if (!resume) throw new Error("No resume found");

  const prompt = `
    Compare this resume against this job description.
    Be honest and specific. Don't sugarcoat.
    
    RESUME:
    ${JSON.stringify(resume.content, null, 2)}
    
    JOB DESCRIPTION:
    ${jobDescription.slice(0, 4000)}
    
    Return JSON only:
    {
      "fitScore": 78,
      "fitLevel": "moderate",
      "jobTitle": "Senior Frontend Developer",
      "company": "TechCorp",
      "companyType": "product_startup",
      
      "matched": [
        {"skill": "React", "evidence": "3 years in StartupXYZ project"},
        {"skill": "TypeScript", "evidence": "Used in e-commerce project"}
      ],
      
      "partial": [
        {
          "skill": "Node.js",
          "evidence": "Mentioned once in project list",
          "issue": "Not prominent enough for a backend-heavy role"
        }
      ],
      
      "missing": [
        {
          "skill": "Docker",
          "importance": "high",
          "suggestedAction": "Add Docker project or mention containerization work"
        },
        {
          "skill": "AWS",
          "importance": "medium",
          "suggestedAction": "Not critical — can apply without it"
        }
      ],
      
      "criticalMissing": ["5+ years experience"],
      
      "resumeIssues": [
        "React experience is buried in projects — should be in skills and highlighted",
        "TypeScript is listed but no quantified examples",
        "API development not clearly described"
      ],
      
      "improvements": [
        "Move React to top of skills section and add years of experience",
        "Add a TypeScript-specific bullet to your e-commerce project",
        "Rewrite the API section to highlight endpoints built and scale"
      ],
      
      "verdict": "Good match — a few targeted changes will significantly improve your application.",
      
      "recommendation": "tailor",
      "recommendationReason": "74% match with 2 high-priority gaps. Tailoring recommended."
    }
    
    fitLevel rules:
    - 85+ AND no critical missing = "strong"
    - 65-84 OR has critical missing = "moderate"
    - below 65 = "weak"
    
    recommendation rules:
    - 85+ AND no critical missing = "use_current"
    - 65-84 = "tailor"
    - below 65 = "tailor" (but warn)
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text()
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  return JSON.parse(text);
}
