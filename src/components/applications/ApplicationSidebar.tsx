"use client";

import { useState } from "react";
import { FileText, CheckSquare, Check, Lock, Info, Hash, Upload, Download, Trash2, Archive } from "lucide-react";
import { updateApplicationNotes, deleteApplication } from "@/lib/actions/applications";
import { useRouter } from "next/navigation";

export function ApplicationSidebar({ app, files, readiness }: { app: any, files: any[], readiness: any }) {
  const [notes, setNotes] = useState(app.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Autosaved just now");
  const router = useRouter();

  const handleSaveNotes = async () => {
    setIsSaving(true);
    setSaveStatus("Saving...");
    try {
      await updateApplicationNotes(app.id, notes);
      setSaveStatus("Saved successfully");
      setTimeout(() => setSaveStatus("Autosaved just now"), 3000);
    } catch (error) {
      setSaveStatus("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this application?")) {
      await deleteApplication(app.id);
      router.push("/applications");
    }
  };

  const handleChip = (text: string) => {
    setNotes((prev: string) => prev + (prev ? "\n" : "") + text + ": ");
  };

  const [readinessItems, setReadinessItems] = useState(readiness.items);

  const handleToggleChecklist = async (id: string, current: boolean, readonly: boolean) => {
    if (readonly) return;
    
    // Optimistic update
    const newValue = !current;
    setReadinessItems((prev: any[]) => 
      prev.map(item => item.id === id ? { ...item, checked: newValue } : item)
    );
    
    try {
      // Import missing dynamically or assume it's imported at top, wait I need to import it at top
      // Actually, I can just use fetch or since I'm going to update the top of the file, I'll do that next.
      const { updateApplicationChecklist } = await import("@/lib/actions/applications");
      const res = await updateApplicationChecklist(app.id, id, newValue);
      if (!res.success) {
        throw new Error(res.error);
      }
    } catch (err) {
      console.error(err);
      // Revert on error
      setReadinessItems((prev: any[]) => 
        prev.map(item => item.id === id ? { ...item, checked: current } : item)
      );
    }
  };

  return (
    <div className="w-full lg:w-[320px] shrink-0 space-y-5">
      {/* Documents & Attachments */}
      <div className="bg-white border border-slate-200/80 rounded-[24px] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Documents & Attachments
          </h3>
          <span className="text-[10px] font-bold text-slate-400">{files.length} Files</span>
        </div>
        
        <div className="space-y-2 mb-4">
          {files.map((file, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl group cursor-pointer hover:border-slate-200 transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  file.type === 'resume' ? 'bg-indigo-100 text-indigo-600' :
                  file.type === 'cover_letter' ? 'bg-emerald-100 text-emerald-600' :
                  'bg-slate-200 text-slate-500'
                }`}>
                  {file.type === 'resume' ? '📄' : file.type === 'cover_letter' ? '✉️' : '📋'}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-700 truncate">{file.name}</p>
                  <p className="text-[9px] font-medium text-slate-400">{file.meta}</p>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (file.url && file.url !== "#") {
                    window.open(file.url, "_blank");
                  } else if (file.markdown) {
                    const element = document.createElement("a");
                    const blob = new Blob([file.markdown], { type: "text/markdown" });
                    element.href = URL.createObjectURL(blob);
                    element.download = file.name;
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);
                  } else {
                    alert("No file content available yet.");
                  }
                }}
                className="p-1 cursor-pointer z-10 relative"
                title="Download File"
              >
                <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
              </button>
            </div>
          ))}
          {files.length === 0 && (
            <div className="text-center py-4 text-xs font-medium text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
              No files attached yet.
            </div>
          )}
        </div>
        
        <button className="w-full py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors">
          <Upload className="w-3 h-3" /> Upload Additional Asset
        </button>
      </div>

      {/* Application Readiness */}
      <div className="bg-white border border-slate-200/80 rounded-[24px] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5" /> Application Readiness
          </h3>
          <span className="text-[10px] font-bold text-[#008B5C]">{Math.round((readinessItems.filter((i: any) => i.checked).length / readinessItems.length) * 100) || 0}% Ready</span>
        </div>
        
        <div className="space-y-3">
          {readinessItems.map((item: any, idx: number) => (
            <label 
              key={idx} 
              className={`flex items-start gap-2.5 group ${item.readonly ? 'cursor-default' : 'cursor-pointer'}`}
              onClick={(e) => {
                e.preventDefault(); // prevent default to handle custom logic
                handleToggleChecklist(item.id, item.checked, item.readonly);
              }}
            >
              <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                item.checked ? 'bg-[#4F39F6] text-white' : 'border border-slate-300 bg-white'
              }`}>
                {item.checked && <Check className="w-3 h-3" />}
              </div>
              <div className="flex-1 flex items-center justify-between">
                <span className={`text-[12px] font-bold transition-colors ${item.checked ? 'text-slate-700' : 'text-slate-500'} ${!item.readonly && 'group-hover:text-slate-900'}`}>
                  {item.label}
                </span>
                {item.tag && (
                  <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                    {item.tag}
                  </span>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Private Scratchpad */}
      <div className="bg-white border border-slate-200/80 rounded-[24px] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Private Scratchpad
          </h3>
          <span className={`text-[9px] font-bold ${saveStatus === 'Failed to save' ? 'text-red-500' : 'text-emerald-500'}`}>
            {saveStatus}
          </span>
        </div>
        
        <div className="flex flex-wrap gap-1.5 mb-3">
          <button onClick={() => handleChip("+ Recruiter Note")} className="text-[10px] font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-md transition-colors">+ Recruiter Note</button>
          <button onClick={() => handleChip("+ Interview Tip")} className="text-[10px] font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-md transition-colors">+ Interview Tip</button>
          <button onClick={() => handleChip("+ Salary")} className="text-[10px] font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-md transition-colors">+ Salary</button>
        </div>
        
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-medium text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-[#4F39F6] focus:bg-white transition-all leading-relaxed"
          placeholder="Add your private notes here..."
        />
        
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1"><Info className="w-3 h-3" /> Markdown supported</span>
          <button 
            onClick={handleSaveNotes}
            disabled={isSaving || notes === (app.notes || "")}
            className="text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            {isSaving ? "Saving..." : "Save Notes"}
          </button>
        </div>
      </div>

      {/* Footer Status & Meta */}
      <div className="pt-2 px-2">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-2">
          <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> APP-{app.id.substring(0, 4).toUpperCase()}</span>
          <span suppressHydrationWarning>Created: {new Date(app.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-4">
          <span>Last Activity: <span suppressHydrationWarning>{new Date(app.updated_at || app.created_at).toLocaleDateString()}</span></span>
          <span className="text-indigo-600">Audited</span>
        </div>
        
        <div className="flex gap-2">
          <button className="flex-1 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors">
            Archive Role
          </button>
          <button onClick={handleDelete} className="flex items-center justify-center gap-1.5 flex-1 py-2 bg-white border border-red-100 rounded-xl text-[11px] font-bold text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
