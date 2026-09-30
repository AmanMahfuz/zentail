import { createClient } from "@/lib/supabase/server";
import { RequirementMap } from "@/components/applications/RequirementMap";
import { redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, Share2, Building2, MapPin, Calendar, Briefcase, CheckCircle2, Coins, Clock, Search, Download, Trash2, ArrowRight, FileText, CheckSquare, Check, Lock, Info, Hash, Upload } from "lucide-react";
import Link from "next/link";
import { formatProfileToMarkdown } from "@/lib/resume/map-resume-data";

import { ApplicationSidebar } from "@/components/applications/ApplicationSidebar";

export default async function ApplicationDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: appDataRaw } = await supabase
    .from("applications")
    .select("*, resume_versions!applications_resume_version_id_fkey(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!appDataRaw) redirect("/applications");

  const { data: coverLetters } = await supabase
    .from("cover_letters_generated")
    .select("*")
    .eq("application_id", id);

  const appData = { ...appDataRaw, cover_letters_generated: coverLetters || [] } as any;

  // Fetch candidate evidence for citation mapping
  const { data: userEvidenceProjects } = await (supabase as any)
    .from("evidence_projects")
    .select("title, description, tech_stack, bullets")
    .eq("user_id", user.id);

  const { data: userEvidenceExp } = await (supabase as any)
    .from("evidence_experience")
    .select("job_title, company, description, bullets, skills_used")
    .eq("user_id", user.id);

  const rContent = (appDataRaw.resume_versions?.content || {}) as any;
  const allProjects = [
    ...(userEvidenceProjects || []),
    ...(rContent.projects || []).map((p: any) => ({
      title: p.name || p.title,
      description: p.description,
      tech_stack: Array.isArray(p.techStack) ? p.techStack : (typeof p.tech === "string" ? p.tech.split(",").map((s: string) => s.trim()) : []),
      bullets: p.bullets
    }))
  ];
  const allExp = [
    ...(userEvidenceExp || []),
    ...(rContent.experience || []).map((e: any) => ({
      job_title: e.title || e.jobTitle,
      company: e.company,
      description: e.description,
      bullets: e.bullets,
      skills_used: Array.isArray(e.skillsUsed) ? e.skillsUsed : []
    }))
  ];

  function getSkillEvidence(skill: string) {
    const s = skill.toLowerCase().trim();
    // 1. Projects
    for (const proj of allProjects) {
      if (!proj) continue;
      const title = proj.title || "Project";
      const techStack = (proj.tech_stack || []).map((t: string) => String(t).toLowerCase());
      const desc = (proj.description || "").toLowerCase();
      const bullets = (proj.bullets || []).join(" ").toLowerCase();

      if (techStack.some((t: string) => t.includes(s) || s.includes(t)) || desc.includes(s) || bullets.includes(s)) {
        const stackStr = (proj.tech_stack && proj.tech_stack.length > 0) ? ` (${proj.tech_stack.slice(0, 3).join(", ")})` : "";
        return `Proven in Project: ${title}${stackStr}`;
      }
    }
    // 2. Experience
    for (const exp of allExp) {
      if (!exp) continue;
      const role = `${exp.job_title || "Role"}${exp.company ? ` at ${exp.company}` : ""}`;
      const skillsUsed = (exp.skills_used || []).map((sk: string) => String(sk).toLowerCase());
      const desc = (exp.description || "").toLowerCase();
      const bullets = (exp.bullets || []).join(" ").toLowerCase();

      if (skillsUsed.some((sk: string) => sk.includes(s) || s.includes(sk)) || desc.includes(s) || bullets.includes(s)) {
        return `Applied on the job: ${role}`;
      }
    }
    return "Verified in Career Profile & Skills";
  }

  // Map legacy schema to new requirements with rich evidence citations
  const requirements: any[] = [];
  
  if (appData.matched_skills) {
    appData.matched_skills.forEach((skill: string) => {
      requirements.push({
        requirement: skill,
        type: "Skill",
        importance: "high",
        evidence: getSkillEvidence(skill),
        status: "found",
        suggestedAction: ""
      });
    });
  }

  if (appData.partial_skills) {
    appData.partial_skills.forEach((skill: string) => {
      requirements.push({
        requirement: skill,
        type: "Skill",
        importance: "medium",
        evidence: null,
        status: "partial",
        suggestedAction: "Strengthen this on your resume or prep for questions."
      });
    });
  }

  if (appData.missing_skills || appData.critical_missing) {
    const missing = [...(appData.missing_skills || []), ...(appData.critical_missing || [])];
    const uniqueMissing = Array.from(new Set(missing));
    uniqueMissing.forEach((skill: string) => {
      requirements.push({
        requirement: skill,
        type: "Skill",
        importance: "high",
        evidence: null,
        status: "missing",
        suggestedAction: "Consider how to frame adjacent experience or start learning this."
      });
    });
  }

  const app = {
    ...appData,
    company_name: appData.company_name || appData.job?.company || "Unknown Company",
    job_title: appData.job_title || appData.job?.title || "Unknown Role",
    fit_score: appData.fit_score || 95,
    company_type: appData.company_type || null,
    status: appData.status || "saved",
    requirement_maps: {
      matched_count: (appData.matched_skills || []).length,
      missing_count: (appData.missing_skills || []).length + (appData.critical_missing || []).length,
      requirements: requirements.length > 0 ? requirements : [
        { requirement: "React", type: "Skill", importance: "high", evidence: "Built 5 apps", status: "found", suggestedAction: "" },
        { requirement: "GraphQL", type: "Skill", importance: "medium", evidence: null, status: "missing", suggestedAction: "Build a small project to show GraphQL knowledge" }
      ]
    },
  };

  const files: any[] = [];
  if (appData.resume_versions) {
    const rContent = (appData.resume_versions.content as any) || {};
    let resumeMd = rContent.markdown || "";
    if (!resumeMd && (rContent.personal || rContent.experience || rContent.skills)) {
      resumeMd = formatProfileToMarkdown(rContent, appData.job_title);
    }
    files.push({
      name: `Resume_v${appData.resume_versions.version_number}.pdf`,
      type: "resume",
      meta: "Verified Match · Primary",
      url: appData.resume_versions.pdf_url || `/api/download/resume/${appData.resume_versions.id}`,
      markdown: resumeMd
    });
  } else {
    const { data: genResume } = await supabase
      .from("resumes_generated")
      .select("*")
      .eq("application_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (genResume) {
      files.push({
        name: `Resume_Tailored_${appData.company_name || 'Role'}.pdf`,
        type: "resume",
        meta: `Tailored Match (${genResume.ats_score || appData.fit_score || 85}%)`,
        url: genResume.pdf_url || `/api/download/resume/${genResume.id}`,
        markdown: genResume.resume_markdown || ""
      });
    } else {
      // Fallback check on master resume_versions for this user
      const { data: fallbackVersion } = await supabase
        .from("resume_versions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fallbackVersion) {
        const fbContent = (fallbackVersion.content as any) || {};
        let fbMd = fbContent.markdown || "";
        if (!fbMd && (fbContent.personal || fbContent.experience || fbContent.skills)) {
          fbMd = formatProfileToMarkdown(fbContent, appData.job_title);
        }
        files.push({
          name: `${fallbackVersion.version_label || 'Master_Resume'}.pdf`,
          type: "resume",
          meta: `Matched Profile (${appData.fit_score || 85}%)`,
          url: fallbackVersion.pdf_url || `/api/download/resume/${fallbackVersion.id}`,
          markdown: fbMd
        });
      }
    }
  }

  if (appData.cover_letters_generated && appData.cover_letters_generated.length > 0) {
    const cl = appData.cover_letters_generated[0];
    const clContent = cl.cover_letter_content || cl.content || "";
    files.push({
      name: `Cover_Letter_${appData.company_name || 'Draft'}.pdf`,
      type: "cover_letter",
      meta: "AI Tailored",
      url: cl.pdf_url || `/api/download/cover-letter/${cl.id}`,
      markdown: clContent
    });
  }

  // Job description file with captured content
  const jdContent = appData.job_description || appData.job?.description || "";
  files.push({
    name: `${appData.company_name || 'Company'}_JD.pdf`,
    type: "jd",
    meta: "Captured posting",
    url: "#",
    markdown: jdContent ? `## Job Description — ${appData.job_title || 'Role'} at ${appData.company_name || 'Company'}\n\n${jdContent}` : "No job description captured for this posting."
  });

  const hasResume = !!(appData.resume_version_id || appData.resume_versions || files.some(f => f.type === 'resume'));
  const readiness = {
    score: appData.status !== "saved" ? 100 : (hasResume ? 85 : 70),
    items: [
      { id: 'resume', label: "Resume tailored & ATS validated", checked: hasResume, readonly: true },
      { id: 'cover_letter', label: "Cover letter customized for role", checked: appData.cover_letters_generated && appData.cover_letters_generated.length > 0, readonly: true },
      { id: 'portfolio_verified', label: "Portfolio & GitHub links verified", checked: appData.portfolio_verified || false, readonly: false },
      { id: 'intro_note_sent', label: "Send intro note to Recruiter", checked: appData.intro_note_sent || false, tag: "In progress", readonly: false }
    ]
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto min-h-screen bg-slate-50/50">
      
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6 border-b border-slate-200/60 pb-4">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-500">
          <Link href="/applications?view=kanban" className="hover:text-slate-900 flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Board
          </Link>
          <span className="text-slate-300">/</span>
          <span>Workspace</span>
          <span className="text-slate-300">/</span>
          <span>Applications</span>
          <span className="text-slate-300">/</span>
          <span className="text-indigo-600 font-bold">{app.job_title}</span>
        </div>
        <div className="flex items-center gap-2">
          <a href={app.job?.url || "#"} target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
            <ExternalLink className="w-3.5 h-3.5" /> Original Job Post
          </a>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Column */}
        <div className="flex-1 min-w-0">
          
          {/* Main Job Card */}
          <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 shadow-sm mb-6 relative">
            <div className="flex items-start gap-5">
              <div className="w-[72px] h-[72px] rounded-[20px] bg-[#4F39F6] text-white font-bold text-4xl flex items-center justify-center shrink-0 shadow-inner">
                {app.company_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Engineering Pipeline</span>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div> Active Target
                  </span>
                  <span className="ml-auto px-3 py-0.5 bg-indigo-50/80 text-indigo-700 rounded-full text-[11px] font-bold border border-indigo-100 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div> Stage: {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                </div>
                
                <div className="flex items-start justify-between mt-1">
                  <div>
                    <h1 className="text-[28px] font-black text-slate-900 tracking-tight leading-tight uppercase">
                      {app.job_title}
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-bold text-slate-700">{app.company_name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="text-[13px] font-medium text-slate-500">{app.job?.location || "Remote / Flexible (Location N/A)"}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-[13px] font-medium text-slate-500" suppressHydrationWarning>
                        Saved on {new Date(app.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right pt-2">
                    <div className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                      Candidate: <span className="text-slate-700">{user.user_metadata?.full_name || "Candidate"}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-slate-100/80">
                  <span className="px-3 py-1.5 bg-slate-50 border border-slate-200/60 text-slate-600 rounded-xl text-[11px] font-bold flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" /> {app.job?.employment_type || "Full-time"}
                  </span>
                  <span className={`px-3 py-1.5 border rounded-xl text-[11px] font-bold flex items-center gap-1.5 ${
                    app.fit_score >= 80 ? "bg-[#E8F8F0] border-[#A6E8C6] text-[#008B5C]" :
                    app.fit_score >= 60 ? "bg-indigo-50 border-indigo-200 text-indigo-700" :
                    "bg-amber-50 border-amber-200 text-amber-700"
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> {app.fit_score}% {app.fit_score >= 80 ? "Interview Ready" : "Targeted Fit"}
                  </span>
                  <span className="px-3 py-1.5 bg-slate-50 border border-slate-200/60 text-slate-600 rounded-xl text-[11px] font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> 15-Question Q&A Bank Ready
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Resume Match Card */}
          <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 shadow-sm mb-6">
            <div className="flex items-start gap-8">
              <div className="relative w-32 h-32 shrink-0 flex items-center justify-center ml-2">
                <svg className="w-full h-full rotate-[-90deg]">
                  <circle cx="64" cy="64" r="56" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                  <circle 
                    cx="64" cy="64" r="56" fill="none" 
                    stroke={app.fit_score >= 80 ? "#10b981" : app.fit_score >= 60 ? "#4F46E5" : "#f59e0b"} 
                    strokeWidth="10" strokeDasharray="351" 
                    strokeDashoffset={351 - (351 * Math.min(app.fit_score || 75, 100)) / 100} 
                    className="transition-all duration-1000 ease-out" strokeLinecap="round" 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                  <span className="text-[38px] font-black text-slate-900 leading-none flex items-start">
                    {app.fit_score}<span className="text-lg mt-1">%</span>
                  </span>
                  <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 mt-0.5 uppercase">Match</span>
                </div>
              </div>
              <div className="flex-1 pt-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold mb-3 border ${
                  app.fit_score >= 80 ? "bg-[#E8F8F0] text-[#008B5C] border-[#A6E8C6]" :
                  app.fit_score >= 60 ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                  "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> {app.fit_score >= 80 ? "Interview Qualified" : "Tailored Resume Active"}
                </span>
                <h2 className="text-[22px] font-black text-slate-900 mb-1.5 tracking-tight">
                  {app.fit_score >= 80 ? "Strong match! Apply with confidence." : "Targeted match. Tailored resume optimized for ATS."}
                </h2>
                <p className="text-sm font-medium text-slate-500">
                  {app.fit_summary || "Your profile and tailored resume demonstrate aligned technical keywords for this role."}
                </p>
                
                <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="text-[12px] font-semibold text-slate-600">
                    Linked Resume: <span className="text-indigo-600 font-bold">{appData.resume_versions?.version_label || "Master Resume"}</span>
                  </div>
                  <Link 
                    href={`/applications/${app.id}/builder`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition-colors border border-indigo-200"
                  >
                    Open Resume & Match Canvas →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Requirement Map */}
          <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 shadow-sm mb-6">
            <RequirementMap
              applicationId={app.id}
              requirementMap={app.requirement_maps}
              status={app.status}
            />
          </div>

          {/* Interview Prep Card */}
          <div className="bg-[#F4F5FF] border border-[#E0E4FF] rounded-[24px] p-8 shadow-sm mb-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-[#4F39F6] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">AI Simulator</span>
                  <span className="text-[11px] font-semibold text-[#4F39F6]/80">Tailored specifically for {app.company_name}</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 flex items-center gap-2">
                  🚀 Interview Prep - Practice for {app.company_name}
                </h2>
                <p className="text-sm font-medium text-slate-600 max-w-xl">
                  Simulate a real technical & behavioral interview tailored to this specific internship description and your verified resume credentials.
                </p>
              </div>
              <Link
                href={`/interviews/prepare/${app.id}`}
                className="flex flex-col items-center shrink-0"
              >
                <div className="flex items-center justify-center gap-2 px-6 py-3 bg-[#4F39F6] hover:bg-[#4330E0] text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-indigo-200 hover:-translate-y-0.5">
                  <ArrowRight className="w-4 h-4" /> Start Simulator
                </div>
                <span className="text-[10px] font-medium text-slate-500 mt-2">~15 mins session · Instant feedback</span>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E0E4FF]/50">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 mb-1.5 uppercase tracking-wider">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div> Full Stack Architecture
                </div>
                <p className="text-[11px] font-medium text-slate-500 leading-relaxed mb-3">SSR vs CSR with Next.js, API request lifecycles, and backend state handling.</p>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Likely Scenario - 96% Probability</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E0E4FF]/50">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 mb-1.5 uppercase tracking-wider">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div> React Hooks & State
                </div>
                <p className="text-[11px] font-medium text-slate-500 leading-relaxed mb-3">Custom hooks, component lifecycle optimization, Tailwind modular UI layouts.</p>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Likely Scenario - 93% Probability</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E0E4FF]/50">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 mb-1.5 uppercase tracking-wider">
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></div> REST & PostgreSQL
                </div>
                <p className="text-[11px] font-medium text-slate-500 leading-relaxed mb-3">Database schema design, Supabase auth integration, CRUD debugging scenarios.</p>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Likely Scenario - 89% Probability</div>
              </div>
            </div>
          </div>

          {/* Application Journey */}
          <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 shadow-sm mb-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Application Journey</h2>
                <p className="text-[12px] font-medium text-slate-500">Tracking your pipeline milestones for {app.company_name}.</p>
              </div>
              <div className="text-[11px] font-semibold text-slate-400" suppressHydrationWarning>
                Application Saved: {new Date(app.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            
            <div className="relative px-8 pb-4">
              <div className="absolute top-5 left-10 right-10 h-1 bg-slate-100 rounded-full z-0"></div>
              <div className="absolute top-5 left-10 h-1 bg-[#4F39F6] rounded-full z-0" style={{ width: '25%' }}></div>
              
              <div className="relative z-10 flex justify-between">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[#4F39F6] text-white flex items-center justify-center font-bold mb-2 shadow-[0_0_0_4px_white]">
                    ✓
                  </div>
                  <span className="text-[11px] font-bold text-slate-900">Saved</span>
                  <span className="text-[10px] font-medium text-slate-400" suppressHydrationWarning>{new Date(app.created_at).toLocaleDateString()}</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 border-2 border-[#4F39F6] text-[#4F39F6] flex items-center justify-center font-bold mb-2 shadow-[0_0_0_4px_white]">
                    ✨
                  </div>
                  <span className="text-[11px] font-bold text-[#4F39F6]">Tailored</span>
                  <span className="text-[10px] font-bold text-[#4F39F6]">In Progress</span>
                </div>
                
                <div className="flex flex-col items-center opacity-50">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-slate-200 text-slate-400 flex items-center justify-center font-bold mb-2 shadow-[0_0_0_4px_white]">
                    ▶
                  </div>
                  <span className="text-[11px] font-bold text-slate-900">Applied</span>
                  <span className="text-[10px] font-medium text-slate-400">Pending</span>
                </div>
                
                <div className="flex flex-col items-center opacity-50">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-slate-200 text-slate-400 flex items-center justify-center font-bold mb-2 shadow-[0_0_0_4px_white]">
                    👥
                  </div>
                  <span className="text-[11px] font-bold text-slate-900">Interview</span>
                  <span className="text-[10px] font-medium text-slate-400">Stage 2</span>
                </div>
                
                <div className="flex flex-col items-center opacity-50">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-slate-200 text-slate-400 flex items-center justify-center font-bold mb-2 shadow-[0_0_0_4px_white]">
                    🎉
                  </div>
                  <span className="text-[11px] font-bold text-slate-900">Offer</span>
                  <span className="text-[10px] font-medium text-slate-400">Goal</span>
                </div>
              </div>
            </div>
          </div>
          
        </div>

        {/* Right Sidebar (320px) */}
        <ApplicationSidebar app={app} files={files} readiness={readiness} />
      </div>
    </div>
  );
}
