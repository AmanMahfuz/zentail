import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UploadResumeModal } from "./UploadResumeModal";
import { AIGenerateModal } from "./AIGenerateModal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Calendar, Briefcase, Plus, Search, MoreVertical, Star, CheckCircle2, XCircle, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Resume } from "@/types/resume";
import { MasterResumeCard, TailoredResumeCard, AddNewResumePlaceholder } from "./ResumeCards";
import { ResumeSessionSync } from "./ResumeSessionSync";
import { TemplateGallery } from "@/components/resumes/TemplateGallery";
import { ResumesListClient } from "./ResumesListClient";

export default async function ResumesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // Fetch resumes
  const { data: resumesRaw, error } = await supabase
    .from("resume_versions")
    .select(`
      id,
      user_id,
      origin_type,
      version_label,
      is_latest,
      content,
      created_at,
      version_number,
      pdf_url,
      application_id
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch applications to enrich fit scores, skills matched, and company info
  const { data: applicationsRaw } = await supabase
    .from("applications")
    .select("id, company_name, job_title, fit_score, matched_skills, missing_skills, resume_version_id")
    .eq("user_id", user.id);

  const appByResumeId = new Map<string, any>();
  const appById = new Map<string, any>();
  (applicationsRaw || []).forEach(a => {
    if (a.resume_version_id) appByResumeId.set(a.resume_version_id, a);
    appById.set(a.id, a);
  });

  // Fetch generated resumes as well to guarantee coverage for all tailored applications
  const { data: generatedRaw } = await supabase
    .from("resumes_generated")
    .select(`
      id,
      user_id,
      application_id,
      job_title,
      company,
      resume_markdown,
      match_percentage,
      ats_score,
      skills_matched,
      skills_missing,
      pdf_url,
      created_at
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Map to Resume type
  const resumes = (resumesRaw || []).map(r => {
    const content = (r.content as any) || {};
    const personal = content.personal || content.contact || {};
    const candidateName =
      personal.fullName ||
      personal.name ||
      content.fullName ||
      content.name ||
      r.version_label ||
      "Resume";

    const linkedApp = (r.application_id ? appById.get(r.application_id) : null) || appByResumeId.get(r.id);
    const fitScore = linkedApp?.fit_score || content.ats_score || content.match_percentage || 90;
    const matchedCount = linkedApp?.matched_skills?.length ?? (Array.isArray(content.skills) ? Math.min(content.skills.length, 12) : 10);
    const missingCount = linkedApp?.missing_skills?.length ?? 2;

    return {
      ...r,
      type: r.origin_type || "master",
      name: r.version_label || candidateName || "Resume",
      is_default: r.is_latest || false,
      content: {
        ...content,
        fullName: candidateName,
        experience: Array.isArray(content.experience) ? content.experience : [],
        skills: Array.isArray(content.skills) ? content.skills : [],
        education: Array.isArray(content.education) ? content.education : [],
      },
      version: r.version_number || 1,
      file_url: r.pdf_url,
      fitScore,
      matchedCount,
      missingCount,
      company: linkedApp?.company_name || null,
      jobTitle: linkedApp?.job_title || null,
    };
  }) as any[];

  // Fallback map generated records not yet reflected in resume_versions
  const generatedMapped = (generatedRaw || [])
    .filter(g => !resumesRaw?.some(r => r.application_id === g.application_id || r.id === g.id))
    .map(g => {
      const linkedApp = g.application_id ? appById.get(g.application_id) : null;
      const comp = g.company || linkedApp?.company_name || "Role";
      const title = g.job_title || linkedApp?.job_title || "Tailored Resume";
      return {
        id: g.id,
        user_id: g.user_id,
        origin_type: "tailored",
        type: "tailored",
        version_label: `Tailored for ${comp}`,
        name: `Tailored for ${comp}`,
        is_default: false,
        is_latest: true,
        content: {
          markdown: g.resume_markdown,
          fullName: "Candidate",
          skills: g.skills_matched || [],
          experience: [],
          education: [],
        },
        version: 1,
        file_url: g.pdf_url,
        fitScore: g.ats_score || g.match_percentage || linkedApp?.fit_score || 85,
        matchedCount: Array.isArray(g.skills_matched) ? g.skills_matched.length : 8,
        missingCount: Array.isArray(g.skills_missing) ? g.skills_missing.length : 2,
        company: comp,
        jobTitle: title,
        application_id: g.application_id,
        created_at: g.created_at,
      };
    });

  const allResumes = [...resumes, ...generatedMapped].sort((a, b) => {
    const timeA = new Date(a.created_at || a.updated_at || 0).getTime();
    const timeB = new Date(b.created_at || b.updated_at || 0).getTime();
    return timeB - timeA;
  });
  const masterResumes = allResumes.filter(r => r.type !== "tailored");

  // Deduplicate tailored resumes by job label / application to prevent duplicate cards
  const seenTailored = new Set<string>();
  const tailoredResumes = allResumes.filter(r => {
    if (r.type !== "tailored") return false;
    const key = r.application_id || r.version_label || r.name;
    if (seenTailored.has(key)) return false;
    seenTailored.add(key);
    return true;
  });

  return (
    <div className="flex flex-col flex-1 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto w-full overflow-y-auto">
      <ResumeSessionSync resumesCount={allResumes.length} />
      {/* Breadcrumb */}
      <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-3 flex items-center gap-2">
        <span>Workspace</span> <span className="text-slate-300">/</span> <span className="text-[#3730A3]">Resumes</span>
      </div>

      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h1 className="text-[32px] font-bold text-slate-900 tracking-tight mb-1 flex items-center gap-3" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
            Resumes
            <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">
              {allResumes.length} Active
            </span>
          </h1>
          <p className="text-slate-500 text-[15px]">
            Manage your master resumes and job-specific tailored versions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/resumes/builder">
            <Button variant="outline" className="rounded-xl h-10 px-4 border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 shadow-sm">
              <Plus className="w-4 h-4 mr-2 text-slate-500" />
              Create New
            </Button>
          </Link>
          <UploadResumeModal>
            <Button variant="outline" className="rounded-xl h-10 px-4 border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 shadow-sm">
              <svg className="w-4 h-4 mr-2 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              Upload Resume
            </Button>
          </UploadResumeModal>
          <AIGenerateModal>
            <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl shadow-sm h-10 px-5 text-sm font-medium">
              <Sparkles className="w-4 h-4 mr-2" /> AI Generate
            </Button>
          </AIGenerateModal>
        </div>
      </div>

      {!allResumes || allResumes.length === 0 ? (
        <div className="flex-1 flex flex-col">
          <div className="text-center py-20 bg-[#F8FAFC]/50 rounded-[24px] border border-slate-200 shadow-sm relative overflow-hidden mb-8">
            <div className="w-[120px] h-[120px] bg-indigo-50/50 rounded-3xl mx-auto mb-6 flex items-center justify-center relative">
              <div className="absolute -top-2 -right-2 bg-emerald-100 p-1.5 rounded-full">
                <Star className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              </div>
              <FileText className="w-12 h-12 text-[#4F46E5]" />
              <div className="absolute bottom-2 bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                PDF • DOCX
              </div>
            </div>
            <h3 className="text-[28px] font-bold text-slate-900 mb-3" style={{ fontFamily: "var(--font-display)" }}>No Resumes Yet</h3>
            <p className="text-slate-500 text-[15px] mb-8 max-w-[420px] mx-auto leading-relaxed">
              Create your master resume to get started with Zentail. You can build one from scratch or upload an existing PDF.
            </p>
            <div className="flex justify-center items-center gap-4">
              <Link href="/resumes/builder">
                <Button variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl shadow-sm h-11 px-6 font-medium">
                  <Plus className="w-4 h-4 mr-2 text-slate-500" />
                  Create New
                </Button>
              </Link>
              <UploadResumeModal>
                <Button variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl shadow-sm h-11 px-6 font-medium">
                  <svg className="w-4 h-4 mr-2 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  Upload Resume
                </Button>
              </UploadResumeModal>
              <AIGenerateModal>
                <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl shadow-sm h-11 px-6 font-medium">
                  <Sparkles className="w-4 h-4 mr-2" /> AI Generate
                </Button>
              </AIGenerateModal>
            </div>
            <div className="mt-8 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> AES-256 Encryption active
            </div>
          </div>

          <div className="mt-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Zentail Intelligence Suite</h2>
                <p className="text-sm text-slate-500">Everything built to streamline hiring pipelines and maximize interview conversion rates.</p>
              </div>
              <Badge className="bg-slate-100 hover:bg-slate-100 text-slate-700 border-none font-semibold shadow-none">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" /> All 3 tools active on free tier
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-6 mb-8">
              {/* Card 1 */}
              <div className="bg-white rounded-[20px] p-6 border border-slate-200 shadow-sm flex flex-col">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4 text-blue-600">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M12 12v9"/><path d="m8 17 4 4 4-4"/></svg>
                </div>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-slate-900 leading-tight">ATS Scanner &<br/>Optimizer</h3>
                  <Badge className="bg-emerald-100 hover:bg-emerald-100 text-emerald-700 border-none rounded text-[10px] font-bold px-1.5 py-0">98%<br/>PASS</Badge>
                </div>
                <p className="text-sm text-slate-500 flex-1 mb-6">Get instant feedback on keywords, format readability, and score against job descriptions.</p>
                <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-600">Target Keyword Match</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full w-[86%]" />
                    </div>
                    <span className="text-slate-900 font-bold">86%</span>
                  </div>
                </div>
              </div>
              {/* Card 2 */}
              <div className="bg-white rounded-[20px] p-6 border border-slate-200 shadow-sm flex flex-col">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mb-4 text-indigo-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-bold text-slate-900">AI Resume Builder</h3>
                  <Badge className="bg-indigo-50 hover:bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold px-1.5">XYZ Model</Badge>
                </div>
                <p className="text-sm text-slate-500 flex-1 mb-6">Generate bullet points using the Google XYZ formula (Accomplished X by doing Y resulting in Z).</p>
                <div className="bg-slate-50 rounded-lg p-3 text-xs font-medium">
                  <span className="text-indigo-600 font-bold mr-1">Example:</span>
                  <span className="text-slate-600 italic">"Scaled user retention by 24% vi..."</span>
                </div>
              </div>
              {/* Card 3 */}
              <div className="bg-white rounded-[20px] p-6 border border-slate-200 shadow-sm flex flex-col">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-4 text-emerald-600">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-bold text-slate-900">Job-Specific Tailoring</h3>
                  <Badge className="bg-slate-100 hover:bg-slate-100 text-slate-700 border-none text-[10px] font-bold px-1.5">1-Click</Badge>
                </div>
                <p className="text-sm text-slate-500 flex-1 mb-6">Create targeted 1-click tailored resume variations linked directly to your application pipeline.</p>
                <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-600">Linked Kanban items</span>
                  <span className="text-emerald-600 font-bold">Ready to sync</span>
                </div>
              </div>
            </div>

            <div className="bg-[#F8FAFC] rounded-2xl p-4 flex items-center justify-between border border-slate-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0 border border-slate-100">
                  <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Tip for competitive applicant pools</h4>
                  <p className="text-xs text-slate-500">Keep one comprehensive Master Resume with 100% of your career data, then generate lean 1-page tailored PDFs per role.</p>
                </div>
              </div>
              <Button variant="ghost" className="text-[#4F46E5] hover:bg-[#4F46E5]/10 text-sm font-bold shrink-0">
                View Best Practices Guide <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <ResumesListClient
          resumes={allResumes}
          masterResumes={masterResumes}
          tailoredResumes={tailoredResumes}
          applications={applicationsRaw || []}
        />
      )}
    </div>
  );
}
