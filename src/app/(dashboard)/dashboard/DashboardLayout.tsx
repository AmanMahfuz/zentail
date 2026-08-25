"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Briefcase, Calendar, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { AddApplicationModal } from "@/app/(dashboard)/applications/AddApplicationModal";

type DashboardProps = {
  countsByStatus: Record<string, number>;
  upcomingInterviews: any[];
  followUps: any[];
  applicationsThisWeek: number;
};

export default function DashboardLayoutClient({
  countsByStatus,
  upcomingInterviews,
  followUps,
  applicationsThisWeek,
}: DashboardProps) {
  const totalApplications = Object.values(countsByStatus).reduce((a, b) => a + b, 0);
  const offers = countsByStatus.offer || 0;
  const rejections = countsByStatus.rejected || 0;

  return (
    <div className="space-y-8">
      {/* Quick Actions Row */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Track a new opportunity</h2>
          <p className="text-sm text-slate-500">Keep your pipeline up to date.</p>
        </div>
        <AddApplicationModal />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-2xl border-blue-100 bg-gradient-to-br from-white to-blue-50/50 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Total Applications</CardTitle>
            <div className="bg-blue-100 p-2 rounded-lg">
              <Briefcase className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{totalApplications}</div>
            <p className="text-xs text-slate-500 mt-1">
              <span className="text-blue-600 font-medium">+{applicationsThisWeek}</span> this week
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-amber-100 bg-gradient-to-br from-white to-amber-50/50 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Interviews</CardTitle>
            <div className="bg-amber-100 p-2 rounded-lg">
              <Calendar className="w-4 h-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{upcomingInterviews.length}</div>
            <p className="text-xs text-slate-500 mt-1">Upcoming scheduled</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-emerald-100 bg-gradient-to-br from-white to-emerald-50/50 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Offers</CardTitle>
            <div className="bg-emerald-100 p-2 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{offers}</div>
            <p className="text-xs text-slate-500 mt-1">Landed so far</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-red-100 bg-gradient-to-br from-white to-red-50/50 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Rejections</CardTitle>
            <div className="bg-red-100 p-2 rounded-lg">
              <XCircle className="w-4 h-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{rejections}</div>
            <p className="text-xs text-slate-500 mt-1">Keep pushing forward</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Needs Follow-up */}
        <Card className="rounded-2xl border-slate-200 shadow-sm h-full">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" /> Needs Follow-up
            </CardTitle>
            <CardDescription>Applications in later stages with no recent activity.</CardDescription>
          </CardHeader>
          <CardContent>
            {followUps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Clock className="w-8 h-8 text-slate-400 mb-3" />
                <p className="text-sm font-medium text-slate-600">You're all caught up!</p>
                <p className="text-xs text-slate-500 mt-1">No stale applications right now.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {followUps.map((app) => {
                  const daysAgo = Math.floor((new Date().getTime() - new Date(app.updated_at).getTime()) / (1000 * 3600 * 24));
                  return (
                    <div key={app.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-blue-100 transition-colors">
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm">{app.job.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">{app.job.company}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 mb-1">
                          {app.status}
                        </span>
                        <p className="text-[11px] text-slate-400">{daysAgo} days ago</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* This Week's Progress (Placeholder for chart) */}
        <Card className="rounded-2xl border-slate-200 shadow-sm h-full">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Weekly Activity</CardTitle>
            <CardDescription>Your application velocity over the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center min-h-[250px]">
             {/* We will build a real chart here in Phase 4/5. For Phase 1, we show a beautiful empty state or basic static viz */}
             <div className="w-full flex items-end justify-between px-4 gap-2 h-40 opacity-70">
                {[2, 5, 3, 7, 4, 1, applicationsThisWeek || 1].map((val, i) => (
                  <div key={i} className="w-full bg-blue-100 rounded-t-sm relative group hover:bg-blue-200 transition-colors" style={{ height: `${(val / 10) * 100}%`, minHeight: '10%' }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {val}
                    </div>
                  </div>
                ))}
             </div>
             <div className="flex w-full justify-between mt-4 px-4 text-xs font-medium text-slate-400 uppercase">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
