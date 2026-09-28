'use client';

import { useState, useEffect } from 'react';
import {
  Zap,
  TrendingUp,
  Book,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InterviewModal } from '@/components/interviews/InterviewModal';

interface ApplicationCard {
  id: string;
  jobTitle: string;
  companyName: string;
  status: string;

  // Q&A Bank
  qaBank: {
    totalQuestions: number;
    categories: string[];
  };

  // Performance
  totalSessions: number;
  bestScore: number;
  averageScore: number;
  lastScore?: number;
  lastSessionDate?: string;

  // Skills to upgrade
  skillsToUpgrade: Array<{
    name: string;
    urgency: 'high' | 'medium' | 'low';
  }>;
}

export default function InterviewsPage() {
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [applications, setApplications] = useState<ApplicationCard[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchApplications() {
      try {
        const response = await fetch('/api/interviews/applications');
        if (!response.ok) throw new Error('Failed to fetch applications');
        const data = await response.json();
        setApplications(data);
      } catch (error) {
        console.error('Failed to fetch applications:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchApplications();
  }, []);

  const selected = applications?.find(app => app.id === selectedApp);

  if (isLoading) {
    return <InterviewsLoadingSkeleton />;
  }

  if (!applications || applications.length === 0) {
    return <NoApplicationsState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Interview Practice</h1>
          <p className="text-lg text-slate-600">
            Track your progress and master interviews for each role
          </p>
        </div>

        {/* Applications grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map(app => (
            <ApplicationCard
              key={app.id}
              app={app}
              onSelect={() => {
                setSelectedApp(app.id);
                setIsModalOpen(true);
              }}
            />
          ))}
        </div>
      </div>

      {/* Interview modal */}
      {selected && (
        <InterviewModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedApp(null);
          }}
          application={selected}
        />
      )}
    </div>
  );
}

function ApplicationCard({
  app,
  onSelect,
}: {
  app: ApplicationCard;
  onSelect: () => void;
}) {
  const scoreColor =
    app.averageScore >= 80
      ? 'text-green-600'
      : app.averageScore >= 60
        ? 'text-amber-600'
        : 'text-red-600';

  const scoreBackground =
    app.averageScore >= 80
      ? 'bg-green-50'
      : app.averageScore >= 60
        ? 'bg-amber-50'
        : 'bg-red-50';

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer group">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-slate-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              {app.jobTitle}
            </h3>
            <p className="text-sm text-slate-600">{app.companyName}</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
            {app.status}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Q&A Bank */}
        <div className="flex items-start gap-3 pb-4 border-b border-slate-200">
          <Book className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-slate-600 mb-1">Q&A Bank Ready</p>
            <p className="font-semibold text-slate-900">
              {app.qaBank.totalQuestions} questions
            </p>
            <p className="text-xs text-slate-600 mt-1">
              {app.qaBank.categories.join(', ')}
            </p>
          </div>
        </div>

        {/* Performance */}
        {app.totalSessions > 0 ? (
          <>
            {/* Score display */}
            <div className="grid grid-cols-3 gap-3">
              <div className={`${scoreBackground} rounded-lg p-3 text-center`}>
                <p className="text-xs text-slate-600 mb-1">Average</p>
                <p className={`text-2xl font-bold ${scoreColor}`}>
                  {app.averageScore}%
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-600 mb-1">Best</p>
                <p className="text-2xl font-bold text-blue-600">{app.bestScore}%</p>
              </div>
              <div className="bg-slate-100 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-600 mb-1">Sessions</p>
                <p className="text-2xl font-bold text-slate-900">{app.totalSessions}</p>
              </div>
            </div>

            {/* Last session */}
            {app.lastScore !== undefined && (
              <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600">Last Practice</p>
                  <p className="font-semibold text-slate-900">{app.lastScore}%</p>
                </div>
                {app.lastSessionDate && (
                  <p className="text-xs text-slate-600">{formatDate(app.lastSessionDate)}</p>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
            <AlertCircle className="w-5 h-5 text-amber-600 mx-auto mb-2" />
            <p className="text-sm text-amber-900 font-medium">No practice sessions yet</p>
            <p className="text-xs text-amber-800 mt-1">Start your first interview to begin tracking</p>
          </div>
        )}

        {/* Skills to upgrade */}
        {app.skillsToUpgrade.length > 0 && (
          <div className="border-t border-slate-200 pt-4">
            <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              Skills to Upgrade
            </p>
            <div className="space-y-2">
              {app.skillsToUpgrade.slice(0, 3).map(skill => (
                <div key={skill.name} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700">{skill.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded font-medium ${
                      skill.urgency === 'high'
                        ? 'bg-red-100 text-red-700'
                        : skill.urgency === 'medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {skill.urgency}
                  </span>
                </div>
              ))}
              {app.skillsToUpgrade.length > 3 && (
                <p className="text-xs text-slate-600 pt-1">
                  +{app.skillsToUpgrade.length - 3} more
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-slate-50 border-t border-slate-200 p-4">
        <Button
          onClick={onSelect}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Zap className="w-4 h-4 mr-2" />
          Start Interview
        </Button>
      </div>
    </div>
  );
}

function InterviewsLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 animate-pulse">
      <div className="max-w-7xl mx-auto">
        <div className="h-12 bg-slate-300 rounded mb-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-300 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

function NoApplicationsState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-8">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">No Applications Yet</h2>
        <p className="text-slate-600 mb-6">
          Save a job application to start practicing interviews.
        </p>
        <Button onClick={() => window.location.href = '/applications'} className="bg-blue-600 hover:bg-blue-700 text-white">
          Browse Jobs
        </Button>
      </div>
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
