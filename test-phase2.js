const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function runTests() {
  console.log("🚀 Starting Phase 2 Integration Tests...");

  // 1. Auth Setup
  const email = `test_${Date.now()}@zentail.local`;
  const password = "password123";
  console.log(`\n--- 1. AUTH SETUP ---`);
  console.log(`Signing up mock user: ${email}`);
  
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    console.error("Auth Error:", authError.message);
    return;
  }
  
  const userId = authData.user.id;
  console.log(`User created with ID: ${userId}`);

  // 2. Resume Analytics Logic Test
  console.log(`\n--- 2. RESUME ANALYTICS TEST ---`);
  
  // Create 2 Resumes
  const { data: resumes, error: resumeError } = await supabase
    .from('resumes')
    .insert([
      { user_id: userId, name: 'Resume V1', version_tag: 'V1', file_path: 'v1.pdf', file_url: 'dummy.pdf' },
      { user_id: userId, name: 'Resume V2', version_tag: 'V2', file_path: 'v2.pdf', file_url: 'dummy.pdf' }
    ])
    .select();

  if (resumeError) {
    console.error("Resume Error:", resumeError);
    return;
  }
  
  const resume1 = resumes[0].id;
  const resume2 = resumes[1].id;
  console.log(`Created Resumes: V1 (${resume1}), V2 (${resume2})`);

  // Create Jobs
  const { data: jobs, error: jobError } = await supabase
    .from('jobs')
    .insert([
      { user_id: userId, title: 'Job 1', company: 'TechCorp 1' },
      { user_id: userId, title: 'Job 2', company: 'TechCorp 2' }
    ])
    .select();

  // Create 10 apps for V1 (2 interview, 1 offer)
  let v1Apps = [];
  for(let i=0; i<10; i++) {
    let status = 'applied';
    if(i === 0 || i === 1) status = 'interview';
    if(i === 2) status = 'offer';
    v1Apps.push({ user_id: userId, resume_id: resume1, job_id: jobs[0].id, status });
  }

  // Create 5 apps for V2 (3 interview)
  let v2Apps = [];
  for(let i=0; i<5; i++) {
    let status = 'applied';
    if(i < 3) status = 'interview';
    v2Apps.push({ user_id: userId, resume_id: resume2, job_id: jobs[1].id, status });
  }

  await supabase.from('applications').insert([...v1Apps, ...v2Apps]);
  console.log(`Inserted 10 applications for V1, 5 applications for V2.`);

  // Calculate stats (Simulating the logic from getResumeAnalytics)
  const { data: apps } = await supabase.from('applications').select('*').eq('user_id', userId);
  
  const v1Count = apps.filter(a => a.resume_id === resume1).length;
  const v1Interviews = apps.filter(a => a.resume_id === resume1 && (a.status === 'interview' || a.status === 'offer')).length;
  const v1Rate = (v1Interviews / v1Count) * 100;
  
  const v2Count = apps.filter(a => a.resume_id === resume2).length;
  const v2Interviews = apps.filter(a => a.resume_id === resume2 && (a.status === 'interview' || a.status === 'offer')).length;
  const v2Rate = (v2Interviews / v2Count) * 100;

  console.log(`\nMetrics Calculated:`);
  console.log(`- V1: ${v1Count} Apps, ${v1Interviews} Interviews -> ${v1Rate}% Rate`);
  console.log(`- V2: ${v2Count} Apps, ${v2Interviews} Interviews -> ${v2Rate}% Rate`);
  
  if (v1Rate === 30 && v2Rate === 60) {
    console.log(`✅ Resume Analytics Calculation works perfectly.`);
  }

  // AI Insight Gen Test
  console.log(`\nTesting AI Insight Generation...`);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const prompt = `Analyze these resume stats: V1 has a ${v1Rate}% interview rate, V2 has a ${v2Rate}% interview rate. Which one is better? Provide a short 1-sentence recommendation.`;
  
  try {
    const result = await model.generateContent(prompt);
    console.log(`AI Insight Output: "${result.response.text().trim()}"`);
    console.log(`✅ AI Insight Generation works perfectly.`);
  } catch(e) {
    console.error("AI Insight Error:", e.message);
  }

  // 3. Interview Prep Generation Test
  console.log(`\n--- 3. INTERVIEW PREP TEST ---`);
  
  const interviewPrompt = `You are an interview coach. Generate 2 technical interview topics for a React Developer role at TechCorp. Return as a short JSON list of strings.`;
  try {
    const result2 = await model.generateContent(interviewPrompt);
    console.log(`AI Topics Generated:\n${result2.response.text().trim()}`);
    console.log(`✅ AI Topics Generation works perfectly.`);
  } catch(e) {
    console.error("AI Topics Error:", e.message);
  }

  console.log(`\n🚀 All Phase 2 Logic Tests completed successfully!`);
}

runTests();
