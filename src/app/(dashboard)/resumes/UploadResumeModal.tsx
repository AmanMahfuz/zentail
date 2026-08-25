"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UploadCloud, FileText, Loader2 } from "lucide-react";
import { uploadResume } from "@/lib/actions/resumes";

export function UploadResumeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append("file", file);

    const result = await uploadResume(formData);

    if (result.success) {
      setIsOpen(false);
      setFile(null);
    } else {
      setError(result.message || "Failed to upload.");
    }
    setIsUploading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger 
        render={
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm h-11 px-6">
            <UploadCloud className="w-5 h-5 mr-2" /> Upload Resume
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Resume</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleUpload} className="space-y-6 pt-4">
          {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
          
          <div 
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${file ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'}`}
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
                <FileText className="w-10 h-10 text-blue-500 mb-3" />
                <p className="font-semibold text-slate-900">{file.name}</p>
                <p className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <Button type="button" variant="link" className="text-xs text-blue-600 mt-2 h-auto p-0" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                  Remove file
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <UploadCloud className="w-10 h-10 text-slate-400 mb-3" />
                <p className="font-medium text-slate-900">Click to upload a PDF</p>
                <p className="text-xs text-slate-500 mt-1">Maximum file size: 5MB</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="resumeName">Resume Name <span className="text-slate-400 font-normal">(Optional)</span></Label>
            <Input 
              id="resumeName" 
              name="resumeName" 
              placeholder="e.g. Software Engineer (React)" 
            />
            <p className="text-xs text-slate-500">A clear name helps you identify this resume in dropdowns.</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!file || isUploading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</> : "Upload File"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
