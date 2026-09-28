"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, PenTool, Upload, UserCircle, Sparkles, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { UploadResumeModal } from "./UploadResumeModal";
import { AIGenerateModal } from "./AIGenerateModal";

export function AddNewResumeModal({ children }: { children?: React.ReactElement }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  const options = [
    {
      id: "scratch",
      title: "Build from Scratch",
      description: "Start with a blank canvas and use our builder to create your resume step by step.",
      icon: <PenTool className="w-5 h-5 text-blue-600" />,
      color: "bg-blue-50 border-blue-100 hover:border-blue-300",
      action: () => {
        setIsOpen(false);
        router.push("/resumes/builder?scratch=true");
      },
    },
    {
      id: "import-profile",
      title: "Import from Zentail Profile",
      description: "Auto-fill your resume using the experience and education you've already added to Zentail.",
      icon: <UserCircle className="w-5 h-5 text-emerald-600" />,
      color: "bg-emerald-50 border-emerald-100 hover:border-emerald-300",
      action: () => {
        setIsOpen(false);
        // Passes a query param to tell the builder to load from user_evidence
        router.push("/resumes/builder?importProfile=true");
      },
    },
    {
      id: "upload",
      title: "Upload Existing PDF",
      description: "Already have a resume? Upload it and our AI will parse it into a structured format.",
      icon: <Upload className="w-5 h-5 text-amber-600" />,
      color: "bg-amber-50 border-amber-100 hover:border-amber-300",
      action: () => {
        setIsOpen(false);
        setShowUploadModal(true);
      },
    },
    {
      id: "ai",
      title: "AI Generation",
      description: "Paste your raw notes or LinkedIn summary and let our AI write a professional master resume for you.",
      icon: <Sparkles className="w-5 h-5 text-purple-600" />,
      color: "bg-purple-50 border-purple-100 hover:border-purple-300",
      action: () => {
        setIsOpen(false);
        setShowAIModal(true);
      },
    },
  ];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger
          nativeButton={true}
          render={
            children || (
              <button
                type="button"
                className="w-full text-left bg-slate-50/50 rounded-[24px] border-2 border-dashed border-slate-200 hover:border-[#4F46E5] hover:bg-indigo-50/30 transition-all flex flex-col items-center justify-center p-8 min-h-[360px] cursor-pointer group shadow-2xs"
              >
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Plus className="w-8 h-8 text-slate-400 group-hover:text-[#4F46E5]" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-1">Add New Resume</h3>
                <p className="text-sm text-slate-500 text-center max-w-[200px]">
                  Create from scratch or upload an existing PDF
                </p>
              </button>
            )
          }
        />
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden rounded-[24px] border border-slate-200 shadow-2xl">
          <div className="p-8">
            <DialogHeader className="mb-8">
              <DialogTitle className="text-2xl font-bold text-slate-900">
                How would you like to start?
              </DialogTitle>
              <p className="text-slate-500 mt-2">
                Choose a method to create your new master resume or target profile.
              </p>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={opt.action}
                  className={`flex flex-col items-start p-6 rounded-2xl border text-left transition-all ${opt.color} group relative overflow-hidden`}
                >
                  <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center mb-4 z-10 relative border border-slate-100">
                    {opt.icon}
                  </div>
                  <h4 className="font-bold text-slate-900 text-lg mb-2 z-10 relative">
                    {opt.title}
                  </h4>
                  <p className="text-sm text-slate-600 z-10 relative">
                    {opt.description}
                  </p>
                  
                  {/* Hover effect arrow */}
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300 z-10">
                    <ArrowRight className="w-5 h-5 text-slate-800" />
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-end">
            <Button variant="ghost" onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-700">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Render the hidden modals that can be triggered from the options */}
      {showUploadModal && (
        <UploadResumeModal forceOpen={true} onClose={() => setShowUploadModal(false)} />
      )}
      
      {showAIModal && (
        <AIGenerateModal forceOpen={true} onClose={() => setShowAIModal(false)} />
      )}
    </>
  );
}
