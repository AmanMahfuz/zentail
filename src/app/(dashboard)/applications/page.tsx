import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddApplicationModal } from "./AddApplicationModal";
import { KanbanWrapper } from "./KanbanWrapper";
import { Bookmark, Send, TerminalSquare, MessageSquare, CheckCircle2, XCircle, Search, LayoutGrid, List, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  type StatusConfig = { id: string, label: string, sub: string, icon: any, color: string, bg: string, border?: string, labelColor?: string, numColor?: string };
  const statuses: StatusConfig[] = [
    { id: "saved", label: "SAVED", sub: "Archived", icon: Bookmark, color: "text-slate-500", bg: "bg-slate-100", numColor: "text-slate-900" },
    { id: "applied", label: "APPLIED", sub: "Submitted", icon: Send, color: "text-slate-500", bg: "bg-slate-100", numColor: "text-slate-900" },
    { id: "assessment", label: "ASSESSMENT", sub: "Pending", icon: TerminalSquare, color: "text-slate-500", bg: "bg-slate-100", numColor: "text-slate-900" },
    { id: "interview", label: "INTERVIEW", sub: "In Progress", icon: MessageSquare, color: "text-[#FC5C3C]", bg: "bg-[#FC5C3C]/10", border: "border-[#FC5C3C]", labelColor: "text-[#FC5C3C]", numColor: "text-[#FC5C3C]" },
    { id: "offer", label: "OFFER", sub: "Secured", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", numColor: "text-slate-900" },
    { id: "rejected", label: "REJECTED", sub: "Closed", icon: XCircle, color: "text-red-600", bg: "bg-red-50", numColor: "text-red-600" }
  ];

  const counts = statuses.reduce((acc, status) => {
    acc[status.id] = applications?.filter(app => app.status === status.id).length || 0;
    return acc;
  }, {} as Record<string, number>);

  const activeLeads = (counts.interview || 0) + (counts.offer || 0) + (counts.assessment || 0);

  return (
    <div className="flex flex-col flex-1 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden min-h-0">
      <div className="mb-6 flex-none flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1
              className="text-3xl font-semibold"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--color-graphite-heading)",
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
              }}
            >
              Applications Pipeline
            </h1>
            <span className="bg-[#FC5C3C]/10 text-[#FC5C3C] px-3 py-1 rounded-full text-xs font-semibold">
              {activeLeads} Active Leads
            </span>
          </div>
          <p className="text-sm mt-1" style={{ color: "var(--color-slate-body)", letterSpacing: "-0.01em" }}>
            Track, manage, and win your active job opportunities across interview stages.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl h-10 px-4 border-slate-200 shadow-sm flex items-center gap-2 font-medium text-slate-700">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5C2.5 4.22386 2.72386 4 3 4H12C12.2761 4 12.5 4.22386 12.5 4.5C12.5 4.77614 12.2761 5 12 5H3C2.72386 5 2.5 4.77614 2.5 4.5ZM4.5 7.5C4.5 7.22386 4.72386 7 5 7H10C10.2761 7 10.5 7.22386 10.5 7.5C10.5 7.77614 10.2761 8 10 8H5C4.72386 8 4.5 7.77614 4.5 7.5ZM6.5 10.5C6.5 10.22386 6.72386 10 7 10H8C8.27614 10 8.5 10.22386 8.5 10.5C8.5 10.77614 8.27614 11 8 11H7C6.72386 11 6.5 10.77614 6.5 10.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
            Filters
          </Button>
          <AddApplicationModal resumes={resumes || []} />
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="flex gap-4 mb-6 shrink-0 flex-wrap lg:flex-nowrap">
        {statuses.map(status => {
          const Icon = status.icon;
          return (
            <div key={status.id} className={`bg-white rounded-[14px] p-5 flex-1 min-w-[140px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between transition-all duration-300 ${status.border ? 'border border-[#FC5C3C] shadow-md ring-4 ring-[#FC5C3C]/20' : 'border border-slate-100'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-[11px] font-bold tracking-widest ${status.labelColor || 'text-slate-900'}`}>{status.label}</h3>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${status.bg} ${status.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <p className={`text-[32px] leading-none font-semibold ${status.numColor || 'text-slate-900'}`}>{counts[status.id]}</p>
                <p className="text-[11px] font-medium text-slate-400 mb-1">{status.sub}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 shrink-0 bg-slate-50/80 p-2 rounded-xl border border-slate-100">
        <div className="flex items-center gap-2 flex-1 max-w-3xl pl-2">
          <div className="relative flex-1">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Filter company, role, stage..." 
              className="pl-7 bg-transparent border-none shadow-none h-9 text-sm focus-visible:ring-0 px-0"
            />
          </div>
          <div className="h-4 w-px bg-slate-300 mx-2"></div>
          <Button variant="ghost" className="h-8 text-sm text-slate-600 gap-1.5 hover:bg-slate-100 px-3">
            <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7h-9M14 17H5M20 12H9"/></svg>
            Role: All
            <svg className="w-3.5 h-3.5 ml-1 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
          </Button>
          <Button variant="ghost" className="h-8 text-sm text-slate-600 gap-1.5 hover:bg-slate-100 px-3">
            <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            Date: Newest
            <svg className="w-3.5 h-3.5 ml-1 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
          </Button>
        </div>
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-[#FC5C3C] bg-[#FC5C3C]/10 hover:bg-[#FC5C3C]/10 rounded-md">
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-600 rounded-md">
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden pb-4">
        <KanbanWrapper initialApplications={applications || []} />
      </div>

      {/* AI Tip Banner */}
      <div className="mt-4 shrink-0 bg-[#FC5C3C]/5 rounded-2xl p-4 flex items-center justify-between border border-[#FC5C3C]/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FC5C3C] flex items-center justify-center shadow-sm shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="text-[15px] font-semibold text-slate-900 mb-0.5" style={{ fontFamily: "var(--font-display)" }}>Job Matcher AI Tip for Aman</h4>
            <p className="text-[13px] text-slate-600">You have 3 technical interviews aligned with F6 IT Services. Would you like our AI to draft targeted questions for the System Design round?</p>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-4">
          <Button variant="outline" className="bg-white border-transparent text-slate-700 h-10 px-6 rounded-lg font-medium hover:bg-slate-50 shadow-sm">
            Dismiss
          </Button>
          <Button className="h-10 px-6 rounded-lg font-medium shadow-sm transition-all text-white" style={{ backgroundColor: "var(--color-sunset-orange)", border: "1px solid var(--color-sunset-orange)" }}>
            Generate Prep Pack
          </Button>
        </div>
      </div>
    </div>
  );
}
