"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Calendar,
  FileText,
  Briefcase,
  Target,
  ChevronRight,
  Plus,
  AlertCircle,
  TrendingUp
} from "lucide-react";
import { AddApplicationModal } from "@/app/(dashboard)/applications/AddApplicationModal";
import { format } from "date-fns";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    applied: "bg-blue-50 text-blue-600",
    interview: "bg-amber-50 text-amber-600",
    saved: "bg-slate-50 text-slate-600",
    offer: "bg-emerald-50 text-emerald-600",
    rejected: "bg-red-50 text-red-600",
  };
  const style = styles[status?.toLowerCase()] || styles.saved;
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : "Saved";
  return (
    <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${style}`}>
      {label}
    </span>
  );
}

export function DashboardClient({
  userName,
  firstName,
}: {
  userName: string;
  firstName: string;
  targetRole?: string;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/summary", { cache: "no-store" });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const recentApps = data?.applications?.slice(0, 5) || [];
  const upcomingInterviews = data?.upcomingInterviews || [];
  const followUps = data?.followUps || [];
  const stats = data?.stats || { total: 0, interviews: 0, offers: 0 };
  const hasApplications = stats.total > 0;

  // Determine what needs attention
  // 1. Upcoming Interview
  const nextInterview = upcomingInterviews.length > 0 ? upcomingInterviews[0] : null;
  
  // 2. Resume review needed (a recently saved application that hasn't been applied yet)
  const needsResumeReview = recentApps.find((app: any) => app.status === "saved" || !app.status);

  // 3. Follow-up needed (from backend followUps array)
  const nextFollowUp = followUps.length > 0 ? followUps[0] : null;

  return (
    <div className="w-full px-6 lg:px-10 pt-10 pb-16 space-y-12 bg-zinc-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
            Good morning, {firstName} <span className="text-2xl">👋</span>
          </h1>
          <p className="text-base text-slate-500 mt-2 font-medium">
            Let's move your job search forward.
          </p>
        </div>
        <div className="flex items-center">
          <AddApplicationModal
            onSuccess={fetchData}
            triggerClassName="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-11 px-6 text-sm font-semibold transition-all shadow-sm"
            buttonText={
              <>
                <Plus className="w-4 h-4" /> Add Job
              </>
            }
          />
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-8">
          <div className="h-40 bg-slate-200 rounded-2xl w-full"></div>
          <div className="h-32 bg-slate-200 rounded-2xl w-full"></div>
        </div>
      ) : (
        <>
          {/* Needs your attention */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Needs your attention</h2>
            
            {!hasApplications ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Welcome to Zentail</h3>
                <p className="text-sm text-slate-500 max-w-sm mb-6">
                  Your action center is empty. Start your journey by adding the first job you want to apply for.
                </p>
                <AddApplicationModal
                  onSuccess={fetchData}
                  triggerClassName="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-6 text-sm font-semibold transition-all shadow-sm"
                  buttonText={
                    <>
                      <Plus className="w-4 h-4" /> Add your first job
                    </>
                  }
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {needsResumeReview && (
                  <div className="bg-white border border-slate-200 hover:border-slate-300 transition rounded-2xl p-5 shadow-sm flex flex-col">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Review your tailored resume</h3>
                        <p className="text-xs font-medium text-slate-500 mt-1">
                          {needsResumeReview.job_title} · {needsResumeReview.company_name}
                        </p>
                      </div>
                    </div>
                    <div className="mt-auto pt-2">
                      <Link href={`/resumes/builder?applicationId=${needsResumeReview.id}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 transition">
                        Review resume <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                )}

                {nextInterview && (
                  <div className="bg-white border border-slate-200 hover:border-slate-300 transition rounded-2xl p-5 shadow-sm flex flex-col">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Prepare for your interview</h3>
                        <p className="text-xs font-medium text-slate-500 mt-1">
                          {nextInterview.application?.job_title} · {format(new Date(nextInterview.scheduled_at), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                    <div className="mt-auto pt-2">
                      <Link href={`/interviews/prepare/${nextInterview.application?.id}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-purple-600 hover:text-purple-700 transition">
                        Practice now <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                )}

                {nextFollowUp && !nextInterview && !needsResumeReview && (
                  <div className="bg-white border border-slate-200 hover:border-slate-300 transition rounded-2xl p-5 shadow-sm flex flex-col">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Follow up needed</h3>
                        <p className="text-xs font-medium text-slate-500 mt-1">
                          {nextFollowUp.job_title} · {nextFollowUp.company_name} (Waiting 7+ days)
                        </p>
                      </div>
                    </div>
                    <div className="mt-auto pt-2">
                      <Link href={`/applications/${nextFollowUp.id}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-600 hover:text-amber-700 transition">
                        View application <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                )}

                {!needsResumeReview && !nextInterview && !nextFollowUp && hasApplications && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 col-span-full">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">You're all caught up!</h3>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">
                        Keep the momentum going by adding more target roles to your pipeline.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {hasApplications && (
            <>
              {/* Your job search (Metrics) */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900">Your job search</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Briefcase className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-slate-900 leading-none mb-1">{stats.total}</div>
                      <div className="text-sm font-semibold text-slate-500">Applications</div>
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                      <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-slate-900 leading-none mb-1">{stats.interviews}</div>
                      <div className="text-sm font-semibold text-slate-500">Interviews</div>
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                      <Target className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-slate-900 leading-none mb-1">{stats.offers}</div>
                      <div className="text-sm font-semibold text-slate-500">Offers</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Applications */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">Recent applications</h2>
                  <Link href="/applications" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition">
                    View all <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100">
                  {recentApps.map((app: any, idx: number) => {
                    const initials = app.company_name?.substring(0, 2).toUpperCase() || "JD";
                    return (
                      <Link href={`/applications/${app.id}`} key={idx} className="flex items-center justify-between p-4 px-6 hover:bg-slate-50 transition group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm shrink-0 border border-slate-200">
                            {initials}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">{app.job_title}</h3>
                            <p className="text-xs font-medium text-slate-500 mt-0.5">{app.company_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="w-24 hidden sm:block">
                            <StatusBadge status={app.status} />
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

