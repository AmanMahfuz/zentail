"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DiffViewerProps {
  originalMarkdown: string;
  newMarkdown: string;
  tailoringLog: string[];
  onApprove: () => void;
  onReject: () => void;
}

export function DiffViewer({ originalMarkdown, newMarkdown, tailoringLog, onApprove, onReject }: DiffViewerProps) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-50 border rounded-lg p-4">
        <h3 className="font-semibold mb-2">Tailoring Summary</h3>
        <ul className="space-y-2">
          {tailoringLog.map((log, i) => (
            <li key={i} className="text-sm flex items-start gap-2">
              <span className="text-green-600 mt-0.5">•</span>
              {log}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-4 h-[600px]">
        <div className="border rounded-lg flex flex-col overflow-hidden bg-white">
          <div className="bg-slate-100 p-2 text-sm font-semibold border-b text-slate-500 text-center">Original Resume</div>
          <ScrollArea className="flex-1 p-4">
            <pre className="text-xs whitespace-pre-wrap font-mono text-slate-600">
              {originalMarkdown}
            </pre>
          </ScrollArea>
        </div>
        
        <div className="border border-green-200 rounded-lg flex flex-col overflow-hidden bg-green-50/10">
          <div className="bg-green-100/50 p-2 text-sm font-semibold border-b border-green-200 text-green-700 text-center flex items-center justify-center gap-2">
            Tailored for Job <ArrowRight className="w-4 h-4" />
          </div>
          <ScrollArea className="flex-1 p-4">
            <pre className="text-xs whitespace-pre-wrap font-mono text-slate-900">
              {newMarkdown}
            </pre>
          </ScrollArea>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onReject} className="text-red-600 hover:text-red-700">
          <X className="w-4 h-4 mr-2" />
          Discard Changes
        </Button>
        <Button onClick={onApprove} className="bg-green-600 hover:bg-green-700 text-white">
          <Check className="w-4 h-4 mr-2" />
          Approve & Save Resume
        </Button>
      </div>
    </div>
  );
}
