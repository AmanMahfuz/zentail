import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UploadResumeModal } from "./UploadResumeModal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Calendar, Briefcase, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function ResumesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // Fetch resumes and their related applications
  const { data: resumes, error } = await supabase
    .from("resumes")
    .select(`
      id,
      name,
      version_tag,
      file_url,
      created_at,
      applications (
        id,
        status
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col flex-1">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Resume Manager</h1>
          <p className="text-slate-500">Upload variations of your resume and track their performance.</p>
        </div>
        <UploadResumeModal />
      </div>

      {!resumes || resumes.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-300">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">No resumes uploaded</h3>
          <p className="text-slate-500 mt-1 mb-6">Upload your first resume to start tracking its success rate.</p>
          <UploadResumeModal />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map((resume) => {
            const totalApps = resume.applications?.length || 0;
            const interviews = resume.applications?.filter(a => a.status === "interview" || a.status === "offer").length || 0;
            const successRate = totalApps > 0 ? Math.round((interviews / totalApps) * 100) : 0;

            return (
              <Card key={resume.id} className="rounded-2xl border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-blue-200 transition-all duration-300">
                <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-500" />
                        {resume.version_tag || "Default"}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> 
                        Uploaded {new Date(resume.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1">
                        <Briefcase className="w-3 h-3" /> Applications
                      </p>
                      <p className="text-2xl font-bold text-slate-900">{totalApps}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1">
                        <CalendarCheck className="w-3 h-3" /> Interviews
                      </p>
                      <p className="text-2xl font-bold text-slate-900">{interviews}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="text-sm">
                      <span className="font-semibold text-slate-900">{successRate}%</span>
                      <span className="text-slate-500 ml-1 text-xs">Interview Rate</span>
                    </div>
                    <a 
                      href={`/api/resumes/${resume.id}/view`}
                      target="_blank" 
                      rel="noreferrer" 
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 px-2.5 h-8 text-xs font-medium transition-colors"
                    >
                      View PDF
                    </a>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
