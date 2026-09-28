'use client';

import { useState } from 'react';
import { X, Mic, Type, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface ApplicationCardData {
  id: string;
  jobTitle: string;
  companyName: string;
  qaBank: {
    totalQuestions: number;
    categories: string[];
  };
}

interface InterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: ApplicationCardData;
}

export function InterviewModal({ isOpen, onClose, application }: InterviewModalProps) {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<'text' | 'voice' | 'pdf' | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStart = () => {
    if (!selectedMode) return;
    // Navigate to interview arena with mode
    router.push(
      `/interviews/prepare/${application.id}?mode=${selectedMode}`
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold">{application.jobTitle}</h2>
            <p className="text-blue-100">{application.companyName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Q&A Bank Overview */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Q&A Bank</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-blue-600 font-medium mb-1">Total Questions</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {application.qaBank.totalQuestions}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium mb-1">Categories</p>
                  <p className="text-sm text-blue-900 font-semibold">
                    {application.qaBank.categories.length}
                  </p>
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                {application.qaBank.categories.map(category => (
                  <button
                    key={category}
                    onClick={() =>
                      setExpandedCategory(expandedCategory === category ? null : category)
                    }
                    className="w-full text-left p-3 bg-white border border-blue-100 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">{category}</span>
                      <span
                        className={`transition-transform ${
                          expandedCategory === category ? 'rotate-180' : ''
                        }`}
                      >
                        ▼
                      </span>
                    </div>
                    {expandedCategory === category && (
                      <div className="mt-3 pt-3 border-t border-slate-200 text-sm text-slate-600">
                        <p>Click "Start Interview" to see all questions in this category</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interview Modes */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Choose Interview Mode</h3>
            <div className="space-y-3">
              {/* Text Mode */}
              <label
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedMode === 'text'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="mode"
                    value="text"
                    checked={selectedMode === 'text'}
                    onChange={e => setSelectedMode(e.target.value as 'text')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Type className="w-5 h-5 text-blue-600" />
                      <span className="font-bold text-slate-900">Text Mode</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        Standard
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      Type your answers. AI provides feedback after each response. Best for:
                      scripting answers, detailed thinking.
                    </p>
                  </div>
                </div>
              </label>

              {/* Voice Mode */}
              <label
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedMode === 'voice'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="mode"
                    value="voice"
                    checked={selectedMode === 'voice'}
                    onChange={e => setSelectedMode(e.target.value as 'voice')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Mic className="w-5 h-5 text-purple-600" />
                      <span className="font-bold text-slate-900">Voice Mode</span>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                        Realistic
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      Speak your answers. Real-time audio with AI voice feedback. Best for:
                      simulating real interviews, natural speaking.
                    </p>
                  </div>
                </div>
              </label>

              {/* PDF Q&A Mode */}
              <label
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedMode === 'pdf'
                    ? 'border-emerald-600 bg-emerald-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="mode"
                    value="pdf"
                    checked={selectedMode === 'pdf'}
                    onChange={e => setSelectedMode(e.target.value as 'pdf')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-5 h-5 text-emerald-600" />
                      <span className="font-bold text-slate-900">PDF Q&A Bank</span>
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                        Read-only
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      View all 15 customized questions and expert tips on how to answer them. Best for:
                      studying offline, reading on the go.
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h4 className="font-semibold text-slate-900 mb-2">💡 Pro Tip</h4>
            <p className="text-sm text-slate-700">
              Start with the <strong>PDF Q&A Bank</strong> to study the questions, craft your answers in <strong>Text Mode</strong>, and practice your delivery with <strong>Voice Mode</strong>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-6 flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleStart}
            disabled={!selectedMode}
            className={`flex-1 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed ${
              selectedMode === 'pdf'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : selectedMode === 'voice'
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {selectedMode === 'pdf'
              ? 'Open & Download Q&A Bank (PDF)'
              : selectedMode === 'voice'
              ? 'Start Voice Simulation'
              : 'Start Text Interview'}
          </Button>
        </div>
      </div>
    </div>
  );
}
