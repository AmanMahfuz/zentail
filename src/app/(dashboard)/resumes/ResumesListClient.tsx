"use client";

import React, { useState, useMemo } from "react";
import { Search, Plus, Sparkles, CheckCircle2, FileText, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MasterResumeCard, TailoredResumeCard, AddNewResumePlaceholder } from "./ResumeCards";
import { TemplateGallery } from "@/components/resumes/TemplateGallery";
import Link from "next/link";

interface ResumesListClientProps {
  resumes: any[];
  masterResumes: any[];
  tailoredResumes: any[];
  applications: any[];
}

export function ResumesListClient({
  resumes,
  masterResumes,
  tailoredResumes,
  applications,
}: ResumesListClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filterList = (list: any[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((r) => {
      const name = (r.name || "").toLowerCase();
      const company = (r.company || "").toLowerCase();
      const jobTitle = (r.jobTitle || "").toLowerCase();
      const candidate = (r.content?.personal?.fullName || r.content?.contact?.name || "").toLowerCase();
      const skillsStr = Array.isArray(r.content?.skills)
        ? r.content.skills.map((s: any) => typeof s === "string" ? s : s.name || s.items || "").join(" ").toLowerCase()
        : "";

      return (
        name.includes(q) ||
        company.includes(q) ||
        jobTitle.includes(q) ||
        candidate.includes(q) ||
        skillsStr.includes(q)
      );
    });
  };

  const filteredAll = useMemo(() => filterList(resumes), [resumes, searchQuery]);
  const filteredMaster = useMemo(() => filterList(masterResumes), [masterResumes, searchQuery]);
  const filteredTailored = useMemo(() => filterList(tailoredResumes), [tailoredResumes, searchQuery]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        {/* Tab triggers */}
        <TabsList className="bg-transparent p-0 flex flex-wrap gap-2 sm:gap-4 h-auto">
          <TabsTrigger
            value="all"
            className="rounded-full px-5 py-2.5 data-[state=active]:border-2 data-[state=active]:border-[#7C3AED] data-[state=active]:bg-white border-2 border-transparent text-slate-600 data-[state=active]:text-slate-900 font-medium transition-all shadow-none flex items-center gap-2"
          >
            All <span className="bg-slate-100/80 text-slate-600 font-semibold rounded-full px-2.5 py-0.5 text-xs">{filteredAll.length}</span>
          </TabsTrigger>
          <TabsTrigger
            value="master"
            className="rounded-full px-5 py-2.5 data-[state=active]:border-2 data-[state=active]:border-[#7C3AED] data-[state=active]:bg-white border-2 border-transparent text-slate-600 data-[state=active]:text-slate-900 font-medium transition-all shadow-none flex items-center gap-2"
          >
            Master Profiles <span className="bg-slate-100/80 text-slate-600 font-semibold rounded-full px-2.5 py-0.5 text-xs">{filteredMaster.length}</span>
          </TabsTrigger>
          <TabsTrigger
            value="tailored"
            className="rounded-full px-5 py-2.5 data-[state=active]:border-2 data-[state=active]:border-[#7C3AED] data-[state=active]:bg-white border-2 border-transparent text-slate-600 data-[state=active]:text-slate-900 font-medium transition-all shadow-none flex items-center gap-2"
          >
            Role Tailored <span className="bg-slate-100/80 text-slate-600 font-semibold rounded-full px-2.5 py-0.5 text-xs">{filteredTailored.length}</span>
          </TabsTrigger>
          <TabsTrigger
            value="templates"
            className="rounded-full px-5 py-2.5 data-[state=active]:border-2 data-[state=active]:border-[#7C3AED] data-[state=active]:bg-white border-2 border-transparent text-slate-600 data-[state=active]:text-slate-900 font-medium transition-all shadow-none flex items-center gap-2"
          >
            Templates & ATS
          </TabsTrigger>
        </TabsList>

        {/* Search input & ATS indicator */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          {activeTab !== "templates" && (
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search by role, company, or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-xl bg-white border-slate-200 text-xs shadow-2xs"
              />
            </div>
          )}

          <div className="hidden sm:flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-full text-xs font-semibold border border-emerald-100 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            ATS Compliant JSON
          </div>
        </div>
      </div>

      {/* ALL TAB */}
      <TabsContent value="all" className="mt-0 flex-1 flex flex-col">
        {filteredAll.length === 0 ? (
          searchQuery ? (
            <div className="text-center py-16 bg-white rounded-[24px] border border-slate-200 p-8">
              <p className="text-slate-500 text-sm">No resumes matching "{searchQuery}"</p>
              <Button
                variant="ghost"
                onClick={() => setSearchQuery("")}
                className="mt-3 text-xs text-[#4F46E5] font-semibold"
              >
                Clear search filter
              </Button>
            </div>
          ) : null
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAll.map((resume) =>
              resume.type === "tailored" ? (
                <TailoredResumeCard key={resume.id} resume={resume} />
              ) : (
                <MasterResumeCard
                  key={resume.id}
                  resume={resume}
                  applications={applications}
                />
              )
            )}
            <AddNewResumePlaceholder />
          </div>
        )}
      </TabsContent>

      {/* MASTER TAB */}
      <TabsContent value="master" className="mt-0">
        {filteredMaster.length === 0 ? (
          <div className="text-center p-12 text-slate-500 bg-white rounded-[24px] border border-slate-200">
            {searchQuery ? `No master resumes match "${searchQuery}"` : "No master profiles found."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaster.map((resume) => (
              <MasterResumeCard
                key={resume.id}
                resume={resume}
                applications={applications}
              />
            ))}
            <AddNewResumePlaceholder />
          </div>
        )}
      </TabsContent>

      {/* TAILORED TAB */}
      <TabsContent value="tailored" className="mt-0">
        {filteredTailored.length === 0 ? (
          <div className="text-center p-12 text-slate-500 bg-white rounded-[24px] border border-slate-200">
            {searchQuery ? `No tailored resumes match "${searchQuery}"` : "No tailored resumes found."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTailored.map((resume) => (
              <TailoredResumeCard key={resume.id} resume={resume} />
            ))}
          </div>
        )}
      </TabsContent>

      {/* TEMPLATES TAB */}
      <TabsContent value="templates" className="mt-0">
        <TemplateGallery />
      </TabsContent>
    </Tabs>
  );
}
