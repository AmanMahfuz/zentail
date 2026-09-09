"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Sparkles } from "lucide-react";
import { generateMasterResume } from "@/lib/actions/ai-resume-generator";
import { Textarea } from "@/components/ui/textarea";

export function AIGenerateModal({ children }: { children?: React.ReactElement }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawText, setRawText] = useState("");

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!rawText || rawText.trim().length < 50) {
      setError("Please provide more details to generate a meaningful resume.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    const result = await generateMasterResume(rawText);

    if (result.success) {
      setIsOpen(false);
      setRawText("");
      // Optionally redirect to the editor: 
      // window.location.href = `/resumes/${result.resumeId}/edit`;
    } else {
      setError(result.message || "Failed to generate resume.");
    }
    setIsGenerating(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          children || (
            <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl shadow-sm h-11 px-6 font-medium">
              <Sparkles className="w-4 h-4 mr-2" /> AI Generate
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            AI Master Resume Generator
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleGenerate} className="space-y-6 pt-4">
          <p className="text-sm text-slate-500">
            Paste your LinkedIn profile text, an old resume, or just a comprehensive list of your career history. 
            Our AI will parse and format it into a perfect Master Resume template.
          </p>

          {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
          
          <div className="space-y-2">
            <Textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste your career details here (at least a few paragraphs)..."
              className="min-h-[250px] resize-y rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!rawText || isGenerating} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating Master Resume...</> : "Generate Resume"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
