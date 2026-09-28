"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Trash2, Edit2, Copy, Loader2, Sparkles, ShieldCheck, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { duplicateResume, deleteResume, convertResumeToBestAtsAction } from "@/lib/actions/resumes";
import { toast } from "sonner";

export function ResumeActionsDropdown({ resumeId }: { resumeId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const handleConvertToAts = async () => {
    setIsConverting(true);
    try {
      const res = await convertResumeToBestAtsAction(resumeId);
      if (res.success) {
        toast.success(`Converted to ${res.blueprintName}!`, {
          description: res.rationale || "Single-column ATS formatting and margins applied.",
        });
        if (res.newResumeId) {
          router.push(`/resumes/${res.newResumeId}/edit`);
        } else {
          router.refresh();
        }
      } else {
        toast.error(res.message || "Failed to convert resume.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred during ATS conversion.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      const res = await duplicateResume(resumeId);
      if (res.success) {
        toast.success("Resume cloned as new version!");
        router.refresh();
      } else {
        toast.error(res.message || "Failed to duplicate resume.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred.");
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this resume? This cannot be undone.")) return;
    setIsDeleting(true);
    try {
      const res = await deleteResume(resumeId);
      if (res.success) {
        toast.success("Resume deleted.");
        router.refresh();
      } else {
        toast.error(res.message || "Failed to delete resume.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred.");
    } finally {
      setIsDeleting(false);
    }
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/resumes/${resumeId}/download-pdf`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate PDF');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Resume_${resumeId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      toast.success('Resume PDF downloaded!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to download PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-slate-600 rounded-md">
            <MoreVertical className="w-4 h-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => router.push(`/resumes/${resumeId}/edit`)}>
          <Edit2 className="mr-2 h-4 w-4" />
          <span>Edit in Builder</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownload} disabled={isDownloading} className="cursor-pointer">
          {isDownloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-emerald-600" />
          ) : (
            <Download className="mr-2 h-4 w-4 text-emerald-600" />
          )}
          <span>{isDownloading ? 'Generating PDF...' : 'Download PDF'}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleConvertToAts}
          disabled={isConverting}
          className="cursor-pointer text-[#4F46E5] font-medium focus:text-[#4F46E5]"
        >
          {isConverting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#4F46E5]" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4 text-[#4F46E5]" />
          )}
          <span>{isConverting ? "Analyzing & Converting..." : "Convert to Best ATS Blueprint"}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDuplicate} disabled={isDuplicating} className="cursor-pointer">
          {isDuplicating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-600" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          <span>{isDuplicating ? "Duplicating..." : "Duplicate (Clone)"}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-red-600 focus:text-red-600 cursor-pointer"
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-red-600" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          <span>{isDeleting ? "Deleting..." : "Delete"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
