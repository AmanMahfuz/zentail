'use client';

import React, { useState } from 'react';
import { Download, Loader2, FileCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ResumeDownloadButtonProps {
  resumeId: string;
  resumeTitle?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'emerald' | 'indigo';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export function ResumeDownloadButton({
  resumeId,
  resumeTitle = 'Resume',
  variant = 'default',
  size = 'md',
  className = '',
  children,
}: ResumeDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isDownloading) return;

    setIsDownloading(true);
    setError(null);

    try {
      const response = await fetch(`/api/resumes/${resumeId}/download-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Download failed (${response.status})`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;

      // Extract filename from Content-Disposition if present
      const disposition = response.headers.get('Content-Disposition');
      let filename = `${resumeTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err: any) {
      console.error('Resume download error:', err);
      setError(err.message || 'Failed to download PDF');
      alert(err.message || 'Failed to download PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'outline':
        return 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs';
      case 'ghost':
        return 'hover:bg-slate-100 text-slate-700';
      case 'emerald':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs';
      case 'indigo':
        return 'bg-[#4F39F6] hover:bg-[#4330E0] text-white shadow-xs';
      default:
        return 'bg-slate-900 hover:bg-black text-white shadow-xs';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'h-8 px-2.5 text-xs font-semibold rounded-lg gap-1.5';
      case 'lg':
        return 'h-11 px-5 text-sm font-bold rounded-xl gap-2';
      default:
        return 'h-9 px-3.5 text-xs font-bold rounded-xl gap-2';
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isDownloading}
      className={`inline-flex items-center justify-center transition-all cursor-pointer ${getVariantStyles()} ${getSizeStyles()} ${className}`}
      title={error || 'Download pixel-perfect PDF'}
    >
      {isDownloading ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Generating PDF...</span>
        </>
      ) : isSuccess ? (
        <>
          <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Downloaded!</span>
        </>
      ) : (
        <>
          {children || (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </>
          )}
        </>
      )}
    </Button>
  );
}
export default ResumeDownloadButton;
