import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, Download, FileSignature } from "lucide-react";

export default async function CoverLetterPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const applicationId = resolvedParams.id;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // Get application info
  const { data: appRecord } = await (supabase as any)
    .from("applications")
    .select("job_title, company_name")
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!appRecord) {
    redirect("/applications");
  }

  // Get cover letter
  const { data: coverLetter } = await (supabase as any)
    .from("cover_letters_generated")
    .select("*")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (!coverLetter || !coverLetter.cover_letter_content) {
    redirect(`/applications/${applicationId}`);
  }

  return (
    <div className="min-h-screen bg-[#f8faff] font-sans pb-24">
      <div className="pt-8 pb-16 px-6 lg:px-10 max-w-[1000px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link
            href={`/applications/${applicationId}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Application Workspace
          </Link>
          
          <a
            href={`/api/download/cover-letter/${applicationId}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition shadow-sm"
          >
            <Download className="w-4 h-4" /> Download PDF
          </a>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-6">
            <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
              <FileSignature className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 mb-1" style={{ fontFamily: "var(--font-display)" }}>
                Cover Letter
              </h1>
              <div className="text-sm font-medium text-slate-500">
                {appRecord.job_title} at {appRecord.company_name || "Company"}
              </div>
            </div>
          </div>
          
          <div className="prose prose-slate max-w-none text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {coverLetter.cover_letter_content}
          </div>
        </div>
      </div>
    </div>
  );
}
