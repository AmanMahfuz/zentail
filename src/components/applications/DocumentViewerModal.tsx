"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  Download,
  Copy,
  Check,
  ExternalLink,
  Edit3,
  FileText,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface DocumentFile {
  name: string;
  type: "resume" | "cover_letter" | "jd";
  meta: string;
  url?: string;
  markdown?: string;
}

interface DocumentViewerModalProps {
  file: DocumentFile | null;
  applicationId: string;
  companyName: string;
  jobTitle: string;
  onClose: () => void;
}

export function DocumentViewerModal({
  file,
  applicationId,
  companyName,
  jobTitle,
  onClose,
}: DocumentViewerModalProps) {
  const [copied, setCopied] = useState(false);

  if (!file) return null;

  const handleCopy = () => {
    if (!file.markdown) return;
    navigator.clipboard.writeText(file.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (file.url && file.url !== "#") {
      const link = document.createElement("a");
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (file.markdown) {
      const blob = new Blob([file.markdown], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name.endsWith(".txt") || file.name.endsWith(".md") ? file.name : `${file.name}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const renderContent = () => {
    if (!file.markdown || file.markdown.trim().length === 0) {
      return (
        <div className="text-center py-16 text-slate-500">
          <p className="text-sm">No preview content available for this document.</p>
          {file.type === "resume" && (
            <Link href={`/applications/${applicationId}/builder`}>
              <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs">
                Open in Resume Builder <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      );
    }

    if (file.type === "cover_letter") {
      const paragraphs = file.markdown.split("\n\n").filter(Boolean);
      return (
        <div className="bg-white rounded-xl p-8 shadow-xs border border-slate-200/80 text-slate-800 leading-relaxed space-y-4 max-w-2xl mx-auto font-serif">
          {paragraphs.map((p, idx) => (
            <p key={idx} className="text-[14px] leading-relaxed text-slate-800">
              {p.trim()}
            </p>
          ))}
        </div>
      );
    }

    // Default formatted Markdown for Resume and JD
    const lines = file.markdown.split("\n");
    return (
      <div className="bg-white rounded-xl p-8 shadow-xs border border-slate-200/80 text-slate-800 max-w-2xl mx-auto space-y-2 font-sans">
        {lines.map((line, idx) => {
          if (line.startsWith("# ")) {
            return (
              <h1 key={idx} className="text-2xl font-black text-slate-900 border-b border-slate-200 pb-2 mb-2 tracking-tight">
                {line.slice(2)}
              </h1>
            );
          }
          if (line.startsWith("## ")) {
            return (
              <h2 key={idx} className="text-sm font-bold uppercase tracking-wider text-indigo-700 border-b border-slate-200/70 pb-1 mt-4 mb-2">
                {line.slice(3)}
              </h2>
            );
          }
          if (line.startsWith("### ")) {
            return (
              <h3 key={idx} className="text-xs font-bold text-slate-900 mt-3 mb-1">
                {line.slice(4)}
              </h3>
            );
          }
          if (line.startsWith("- ") || line.startsWith("• ")) {
            return (
              <li key={idx} className="text-xs text-slate-600 ml-4 list-disc leading-relaxed">
                {line.replace(/^[-•]\s*/, "")}
              </li>
            );
          }
          if (line.trim() === "") {
            return <div key={idx} className="h-1" />;
          }
          return (
            <p key={idx} className="text-xs text-slate-600 leading-relaxed">
              {line}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#F8FAFC] border border-slate-200 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              file.type === "resume" ? "bg-indigo-100 text-indigo-700" :
              file.type === "cover_letter" ? "bg-emerald-100 text-emerald-700" :
              "bg-blue-100 text-blue-700"
            }`}>
              {file.type === "resume" ? <FileText className="w-5 h-5" /> :
               file.type === "cover_letter" ? <span className="text-lg">✉️</span> :
               <span className="text-lg">📋</span>}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-base truncate flex items-center gap-2">
                {file.name}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">
                  {file.meta}
                </span>
              </h3>
              <p className="text-xs text-slate-500 truncate">
                {file.type === "resume" ? `Tailored Profile for ${companyName}` :
                 file.type === "cover_letter" ? `Custom Letter for ${jobTitle} at ${companyName}` :
                 `Posting Requirements for ${jobTitle}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/60">
          {renderContent()}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {file.markdown && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="rounded-xl h-9 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                {copied ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1.5 text-slate-500" />}
                {copied ? "Copied to Clipboard" : "Copy Text"}
              </Button>
            )}
            {file.type === "resume" && (
              <>
                <Link href={`/applications/${applicationId}/builder`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl h-9 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                    Open in Builder
                  </Button>
                </Link>
                <Link href={`/applications/${applicationId}/resume`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl h-9 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Resume Center
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              size="sm"
              onClick={handleDownload}
              className="bg-slate-900 hover:bg-black text-white rounded-xl h-9 px-4 text-xs font-semibold shadow-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download {file.type === "resume" ? "PDF" : file.type === "cover_letter" ? "Letter PDF" : "Asset"}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
