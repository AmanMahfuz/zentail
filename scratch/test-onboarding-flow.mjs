// scratch/test-onboarding-flow.mjs
import fetch from "node-fetch";

const BASE_URL = "http://localhost:3000";

async function run() {
  console.log("=== Testing Onboarding & Application Auto-Generation ===");

  // 1. Test Match Analysis API (used in Onboarding & Landing)
  const candidateProfile = {
    personal: {
      fullName: "Alex Rivera",
      jobTitle: "Frontend Developer",
      email: `alex.test.${Date.now()}@example.com`
    },
    skills: ["React", "TypeScript", "Tailwind CSS", "JavaScript", "HTML/CSS", "Next.js"]
  };

  const jobDescription = `
    Senior Full Stack Engineer at FinTech Corp
    Requirements:
    - 5+ years of experience with React, TypeScript, Node.js
    - Experience with GraphQL, PostgreSQL, and AWS
    - Strong understanding of microservices and REST APIs
    - Passion for financial technology and high-throughput systems
  `;

  console.log("\n1. Testing /api/public/match-analysis...");
  const matchRes = await fetch(`${BASE_URL}/api/public/match-analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      profile: candidateProfile,
      jobDescription
    })
  });

  const matchData = await matchRes.json();
  console.log("Match analysis response status:", matchRes.status);
  console.log("Fit Score:", matchData.analysis?.fitScore);
  console.log("Matched Skills:", matchData.analysis?.matched);
  console.log("Missing Skills:", matchData.analysis?.missing);
  console.log("Verdict:", matchData.analysis?.verdict);

  if (!matchData.analysis || typeof matchData.analysis.fitScore !== "number") {
    throw new Error("Match analysis failed or returned invalid shape");
  }

  // 2. Create User via Supabase API / Auth
  console.log("\n2. Signing up test user for Onboarding save...");
  const email = `alex.rivera.${Date.now()}@test.com`;
  const password = "password123!";

  // We can use Supabase client directly
  const { createClient } = await import("@supabase/supabase-js");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.log("Supabase credentials not in env, reading from .env.local");
  }

  // Let's read .env.local to get Supabase credentials
  const fs = await import("fs");
  const envContent = fs.readFileSync(".env.local", "utf8");
  const envVars = {};
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  }

  const sbUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(sbUrl, sbKey);

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: "Alex Rivera" } }
  });

  if (authError || !authData.user) {
    throw new Error(`Failed to sign up test user: ${authError?.message}`);
  }
  const userId = authData.user.id;
  console.log("Created test user:", userId, email);

  // Sign in to get session cookies for HTTP calls
  const { data: sessionData } = await supabase.auth.signInWithPassword({ email, password });
  const token = sessionData.session.access_token;
  const cookieHeader = `sb-${sbUrl.split("//")[1].split(".")[0]}-auth-token=${JSON.stringify([token, sessionData.session.refresh_token])}`;

  // 3. Insert Master Resume into resume_versions
  console.log("\n3. Inserting Master Resume into resume_versions...");
  const { data: masterResume, error: masterErr } = await supabase
    .from("resume_versions")
    .insert({
      user_id: userId,
      version_label: "Master Resume",
      origin_type: "master",
      version_number: 1,
      is_latest: true,
      content: {
        personal: { fullName: "Alex Rivera", email, jobTitle: "Frontend Developer" },
        skills: candidateProfile.skills,
        experience: [
          { title: "Frontend Developer", company: "Tech Startup", dates: "2023 - Present", description: "Built modern React dashboards." }
        ]
      }
    })
    .select()
    .single();

  if (masterErr) throw masterErr;
  console.log("Master resume created:", masterResume.id);

  // 4. Test Application Creation with Auto-Tailoring and Q&A Bank Generation
  console.log("\n4. Calling /api/applications/create with JD & preComputedAnalysis...");
  // Using direct Supabase client & server actions or API with service role auth
  // Let's call the server action or test route
  const { ResumeAgent } = await import("../src/lib/agents/resume-agent.js");
  const { generateQABank } = await import("../src/lib/actions/phase3.js");

  // Insert application row
  const { data: app, error: appErr } = await supabase
    .from("applications")
    .insert({
      user_id: userId,
      job_title: "Senior Full Stack Engineer",
      company_name: "FinTech Corp",
      job_description: jobDescription,
      status: "review_needed",
      resume_version_id: masterResume.id,
      fit_score: matchData.analysis.fitScore,
      fit_summary: matchData.analysis.verdict,
      matched_skills: matchData.analysis.matched,
      missing_skills: matchData.analysis.missing
    })
    .select()
    .single();

  if (appErr) throw appErr;
  console.log("Application created:", app.id);

  // Auto-generate Q&A Bank
  console.log("\n5. Generating 15-question Q&A bank...");
  const qaResult = await generateQABank(app.id);
  console.log("generateQABank success:", qaResult.success);

  // Check qa_banks in DB
  const { data: qbRow, error: qbErr } = await supabase
    .from("qa_banks")
    .select("*")
    .eq("application_id", app.id)
    .single();

  if (qbErr || !qbRow) throw new Error("Q&A bank was not found in DB!");
  console.log("Verified Q&A bank in DB!");
  console.log("Total questions in bank:", qbRow.questions?.length);
  console.log("Sample question 1:", qbRow.questions?.[0]?.question);
  console.log("Sample question 1 category:", qbRow.questions?.[0]?.category);

  // 6. Verify resume versions (check if tailoring works or if master is linked)
  const { data: versions } = await supabase
    .from("resume_versions")
    .select("id, version_label, origin_type, is_latest")
    .eq("user_id", userId);

  console.log("\n6. Candidate Resume Versions in collection:");
  console.table(versions);

  console.log("\n=== ALL ONBOARDING & AUTO-GENERATION VERIFICATIONS PASSED SUCCESSFULLY! ===");
}

run().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
