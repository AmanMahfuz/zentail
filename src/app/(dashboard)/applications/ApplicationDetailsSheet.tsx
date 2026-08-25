"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Building2, MapPin, Calendar, DollarSign, ExternalLink, Briefcase, Sparkles } from "lucide-react";
import { ApplicationStatus, updateApplication, deleteApplication } from "@/lib/actions/applications";

type ApplicationDetailsSheetProps = {
  app: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

const statusColors: Record<ApplicationStatus, string> = {
  saved: "bg-slate-100 text-slate-700 border-slate-200",
  applied: "bg-blue-100 text-blue-700 border-blue-200",
  assessment: "bg-purple-100 text-purple-700 border-purple-200",
  interview: "bg-amber-100 text-amber-700 border-amber-200",
  offer: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

export function ApplicationDetailsSheet({ app, isOpen, onOpenChange }: ApplicationDetailsSheetProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState(app?.notes || "");
  const [status, setStatus] = useState<ApplicationStatus>(app?.status || "saved");

  if (!app) return null;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this application?")) return;
    setIsDeleting(true);
    await deleteApplication(app.id);
    setIsDeleting(false);
    onOpenChange(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updateApplication(app.id, { notes, status });
    setIsSaving(false);
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[540px] p-0 flex flex-col h-full bg-white border-l border-slate-100 shadow-2xl">
        {/* Header Section */}
        <div className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white px-8 pt-10 pb-6 border-b border-slate-100">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Briefcase className="w-32 h-32" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <span className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full border ${statusColors[status]}`}>
                {status}
              </span>
            </div>
            
            <SheetTitle className="text-3xl font-black text-slate-900 tracking-tight leading-tight mb-2">
              {app.job.title}
            </SheetTitle>
            
            <SheetDescription className="flex items-center gap-2 text-base text-slate-600 font-medium">
              <Building2 className="w-4 h-4 text-slate-400" /> {app.job.company}
            </SheetDescription>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50 hover:bg-slate-100/50 transition-colors">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3 h-3" /> Location
              </Label>
              <p className="text-sm font-medium text-slate-900">{app.job.location || "Not specified"}</p>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50 hover:bg-slate-100/50 transition-colors">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Applied On
              </Label>
              <p className="text-sm font-medium text-slate-900">
                {app.applied_at ? new Date(app.applied_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "Not recorded"}
              </p>
            </div>

            {(app.job.salary_min || app.job.salary_max) && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50 hover:bg-slate-100/50 transition-colors col-span-2 sm:col-span-1">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <DollarSign className="w-3 h-3" /> Comp
                </Label>
                <p className="text-sm font-medium text-slate-900">
                  {app.job.salary_min && `$${app.job.salary_min.toLocaleString()}`}
                  {app.job.salary_min && app.job.salary_max && ' - '}
                  {app.job.salary_max && `$${app.job.salary_max.toLocaleString()}`}
                </p>
              </div>
            )}
            
            {app.job.url && (
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 hover:bg-blue-50 transition-colors col-span-2 sm:col-span-1 flex flex-col justify-center items-start">
                <a href={app.job.url} target="_blank" rel="noreferrer" className="group flex items-center gap-2 text-sm font-semibold text-blue-600">
                  <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  View Job Posting
                </a>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Pipeline Stage</Label>
              <div className="relative">
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                  className="appearance-none flex h-12 w-full items-center justify-between rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors cursor-pointer shadow-sm hover:border-slate-200"
                >
                  <option value="saved">Saved</option>
                  <option value="applied">Applied</option>
                  <option value="assessment">Assessment</option>
                  <option value="interview">Interview</option>
                  <option value="offer">Offer</option>
                  <option value="rejected">Rejected</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex justify-between items-center">
                Private Notes
                {notes && <span className="text-[10px] font-medium text-slate-400 normal-case">Saved automatically</span>}
              </Label>
              <Textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="Jot down interview feedback, thoughts, or next steps..."
                className="min-h-[160px] resize-none rounded-xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500 shadow-sm p-4 text-sm leading-relaxed transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 p-6 bg-slate-50/80 backdrop-blur-md border-t border-slate-100 flex justify-between items-center">
          <Button 
            variant="ghost" 
            onClick={handleDelete} 
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl px-4 font-medium"
          >
            <Trash2 className="w-4 h-4 mr-2" /> {isDeleting ? "Deleting..." : "Discard"}
          </Button>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl font-medium border-slate-200">
              Close
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-slate-900 hover:bg-slate-800 text-white shadow-md rounded-xl font-medium px-6">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
