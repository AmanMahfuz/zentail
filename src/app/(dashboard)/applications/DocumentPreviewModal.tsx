"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, ExternalLink } from "lucide-react";

type DocumentPreviewModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  markdownContent: string;
  pdfUrl?: string | null;
};

export function DocumentPreviewModal({ isOpen, onOpenChange, title, markdownContent, pdfUrl }: DocumentPreviewModalProps) {
  const handleDownload = () => {
    if (pdfUrl) {
      // Open the signed Supabase URL — real PDF download
      window.open(pdfUrl, "_blank");
    } else {
      // Fallback: download raw markdown
      const element = document.createElement("a");
      const file = new Blob([markdownContent], { type: "text/markdown" });
      element.href = URL.createObjectURL(file);
      element.download = `${title.replace(/\s+/g, "_")}.md`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">{title}</DialogTitle>
              {pdfUrl ? (
                <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  PDF generated & saved to your storage
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Preview only — no PDF yet</p>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {/* Content preview as formatted text */}
          <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 bg-transparent p-0 m-0 leading-relaxed">
            {markdownContent}
          </pre>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            {pdfUrl ? "PDF stored securely in your Zentail workspace" : "Generate to create a downloadable PDF"}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button
              onClick={handleDownload}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              {pdfUrl ? "Download PDF" : "Download Markdown"}
              {pdfUrl && <ExternalLink className="w-3 h-3 ml-1.5 opacity-60" />}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
