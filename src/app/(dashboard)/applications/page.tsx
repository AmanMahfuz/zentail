import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddApplicationModal } from "./AddApplicationModal";
import { KanbanWrapper } from "./KanbanWrapper";

export default async function ApplicationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const { data: applications } = await supabase
    .from("applications")
    .select(`
      id,
      status,
      applied_at,
      notes,
      job:jobs (
        id,
        company,
        title,
        location,
        salary_min,
        salary_max,
        currency,
        deadline,
        url
      ),
      resume:resumes (
        id,
        name,
        version_tag
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: resumes } = await supabase
    .from("resumes")
    .select("id, version_tag")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const statuses = ["saved", "applied", "assessment", "interview", "offer", "rejected"] as const;
  const counts = statuses.reduce((acc, status) => {
    acc[status] = applications?.filter(app => app.status === status).length || 0;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="mb-6 flex-none flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">Applications Pipeline</h1>
          <p className="text-slate-500 font-medium">Track, manage, and win your active job opportunities.</p>
        </div>
        <AddApplicationModal resumes={resumes || []} />
      </div>

      {/* Summary Stats Row */}
      <div className="flex gap-4 mb-6 overflow-x-auto pb-2 shrink-0">
        {statuses.map(status => (
          <div key={status} className="bg-slate-100 rounded-xl p-4 min-w-[140px] flex-1 flex flex-col justify-center shadow-sm">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{status}</h3>
            <p className="text-3xl font-medium text-slate-800 tracking-tight">{counts[status]}</p>
          </div>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-x-auto pb-4">
        <KanbanWrapper initialApplications={applications || []} />
      </div>
    </div>
  );
}
