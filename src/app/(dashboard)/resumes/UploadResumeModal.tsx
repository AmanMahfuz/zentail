"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UploadCloud, FileText, Loader2, Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";
import { uploadResume } from "@/lib/actions/resumes";
import { toast } from "sonner";

export function UploadResumeModal({ children, forceOpen = false, onClose }: { children?: React.ReactElement, forceOpen?: boolean, onClose?: () => void }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(forceOpen);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [autoConvertAts, setAutoConvertAts] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open && onClose) {
      onClose();
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append("file", file);
    formData.append("autoConvertAts", String(autoConvertAts));

    const result = await uploadResume(formData);

    if (result.success) {
      handleOpenChange(false);
      setFile(null);
      if (result.blueprintName) {
        toast.success(`Converted to ${result.blueprintName}!`, {
          description: result.rationale || "Optimized for 100% ATS parser compliance.",
        });
      } else {
        toast.success("Resume uploaded successfully!");
      }

      if (result.resumeId) {
        router.push(`/resumes/builder?resumeId=${result.resumeId}`);
      } else {
        router.push("/resumes/builder");
      }
    } else {
      setError(result.message || "Failed to upload.");
      toast.error(result.message || "Failed to upload resume.");
    }
    setIsUploading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {!forceOpen && (
        <DialogTrigger
          nativeButton={false}
          render={
            children || (
              <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl shadow-xs h-10 px-5 text-sm font-medium">
                <UploadCloud className="w-4 h-4 mr-2" /> Upload Resume
              </Button>
            )
          }
        />
      )}
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-2xl bg-white border border-slate-200">
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> ATS Smart Extraction
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-white">
            Upload & Convert Resume
          </DialogTitle>
          <p className="text-xs text-slate-300 mt-1">
            Drop your existing PDF and let Zentail map your content into our best single-column ATS blueprint.
          </p>
        </div>
        
        <form onSubmit={handleUpload} className="p-6 space-y-5">
          {error && <div className="text-red-600 text-xs bg-red-50 p-3 rounded-xl border border-red-200">{error}</div>}
          
          <div 
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              file ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              accept=".pdf"
              className="hidden" 
              ref={fileInputRef}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            
            {file ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="font-semibold text-slate-900 text-sm">{file.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <Button type="button" variant="link" className="text-xs text-indigo-600 mt-2 h-auto p-0 font-semibold" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                  Choose another file
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center py-2">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="font-semibold text-slate-900 text-sm">Click or drag & drop a PDF resume</p>
                <p className="text-xs text-slate-400 mt-1">PDF format up to 10MB</p>
              </div>
            )}
          </div>

          {/* Auto-Convert to ATS Blueprint Option */}
          <div 
            onClick={() => setAutoConvertAts(!autoConvertAts)}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
              autoConvertAts ? 'bg-indigo-50/50 border-indigo-200' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
              autoConvertAts ? 'bg-[#4F46E5] border-[#4F46E5] text-white' : 'border-slate-400 bg-white'
            }`}>
              {autoConvertAts && <CheckCircle2 className="w-3.5 h-3.5" />}
            </div>
            <div className="text-xs">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Convert to best ATS blueprint (Recommended)
              </span>
              <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
                Automatically determines whether you match <strong>Fresher (1.0" margins)</strong>, <strong>Experienced (0.5" margins)</strong>, or <strong>Hybrid (0.75" margins)</strong> and structures your content to pass ATS filters.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="resumeName" className="text-xs font-semibold text-slate-700">Resume Label <span className="text-slate-400 font-normal">(Optional)</span></Label>
            <Input 
              id="resumeName" 
              name="resumeName" 
              placeholder="e.g. Master Resume - Full Stack" 
              className="h-10 text-xs rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl h-10 text-xs font-semibold">
              Cancel
            </Button>
            <Button type="submit" disabled={!file || isUploading} className="bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl h-10 px-5 text-xs font-semibold shadow-xs">
              {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing & Converting...</> : "Upload & Convert"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
