import { createClient } from "@/lib/supabase/server";
import { RequirementMap } from "@/components/applications/RequirementMap";
import { redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, Share2, Building2, MapPin, Calendar, Briefcase, CheckCircle2, Coins, Clock, Search, Download, Trash2, ArrowRight, FileText, CheckSquare, Check, Lock, Info, Hash, Upload } from "lucide-react";
import Link from "next/link";

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

  // Temporarily map legacy schema to new requirements while waiting for DB migration
  const requirements: any[] = [];
  
  if (appData.matched_skills) {
    appData.matched_skills.forEach((skill: string) => {
      requirements.push({
        requirement: skill,
        type: "Skill",
        importance: "high",
        evidence: "Mentioned in resume",
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

  const files = [];
  if (appData.resume_versions) {
    files.push({
      name: `Resume_v${appData.resume_versions.version_number}.pdf`,
      type: "resume",
      meta: "Verified Match · Primary",
      url: appData.resume_versions.pdf_url || `/api/download/resume/${appData.resume_versions.id}`,
      markdown: appData.resume_versions.resume_markdown || ""
    });
  }
  if (appData.cover_letters_generated && appData.cover_letters_generated.length > 0) {
    files.push({
      name: `Cover_Letter_${appData.company_name || 'Draft'}.txt`,
      type: "cover_letter",
      meta: "AI Tailored",
      url: appData.cover_letters_generated[0].pdf_url || `/api/download/cover-letter/${appData.cover_letters_generated[0].id}`,
      markdown: appData.cover_letters_generated[0].content || ""
    });
  }
  // Mock JD if none
  files.push({
    name: `${appData.company_name || 'Company'}_JD.pdf`,
    type: "jd",
    meta: "Captured posting",
    url: "#"
  });

  const readiness = {
    score: appData.status !== "saved" ? 100 : 75,
    items: [
      { id: 'resume', label: "Resume tailored & ATS validated", checked: !!appData.resume_id, readonly: true },
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
                      Candidate: <span className="text-slate-700">Aman Mahfuz KZ</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-slate-100/80">
                  <span className="px-3 py-1.5 bg-slate-50 border border-slate-200/60 text-slate-600 rounded-xl text-[11px] font-bold flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Full-time Internship
                  </span>
                  <span className="px-3 py-1.5 bg-[#E8F8F0] border border-[#A6E8C6] text-[#008B5C] rounded-xl text-[11px] font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 95% Strong Match
                  </span>
                  <span className="px-3 py-1.5 bg-slate-50 border border-slate-200/60 text-slate-600 rounded-xl text-[11px] font-bold flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-slate-400" /> Competitive Stipend
                  </span>
                  <span className="px-3 py-1.5 bg-slate-50 border border-slate-200/60 text-slate-600 rounded-xl text-[11px] font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> 15-min AI Interview Ready
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
                  <circle cx="64" cy="64" r="56" fill="none" stroke="#10b981" strokeWidth="10" strokeDasharray="351" strokeDashoffset={351 - (351 * 95) / 100} className="transition-all duration-1000 ease-out" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                  <span className="text-[40px] font-black text-slate-900 leading-none flex items-start">
                    95<span className="text-xl mt-1">%</span>
                  </span>
                  <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 mt-0.5 uppercase">Match</span>
                </div>
              </div>
              <div className="flex-1 pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#E8F8F0] text-[#008B5C] rounded-full text-[11px] font-bold mb-3 border border-[#A6E8C6]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready to Apply
                </span>
                <h2 className="text-[22px] font-black text-slate-900 mb-1.5 tracking-tight">Strong match! Apply with confidence.</h2>
                <p className="text-sm font-medium text-slate-500">Your profile demonstrates verified technical and workflow alignment for this role.</p>
                
                <div className="mt-8 space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-2">
                    <span>ATS Resume Alignment (Aman_FS_Resume_2026.pdf)</span>
                    <span className="text-slate-700">Exceptional Keyword Density</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full flex overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: '40%' }}></div>
                    <div className="h-full bg-[#4F39F6]" style={{ width: '35%' }}></div>
                    <div className="h-full bg-indigo-400" style={{ width: '20%' }}></div>
                  </div>
                  <div className="flex justify-between text-[9px] font-bold tracking-wider uppercase text-slate-400 pt-1.5">
                    <span>Core Tech Stack: 100%</span>
                    <span>Workflow & Overlap: 94%</span>
                    <span>Education & Soft Skills: 96%</span>
                  </div>
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
                href="/interviews"
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
