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
        <TabsList className="bg-slate-100/50 p-1 flex w-max rounded-xl h-auto border border-slate-200/50">
          <TabsTrigger
            value="all"
            className="rounded-lg px-5 py-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 font-semibold transition-all flex items-center text-[13px]"
          >
            All <span className="ml-2 bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-[10px] font-bold">{filteredAll.length}</span>
          </TabsTrigger>
          <TabsTrigger
            value="master"
            className="rounded-lg px-5 py-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 font-semibold transition-all flex items-center text-[13px]"
          >
            Master <span className="ml-2 bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-[10px] font-bold">{filteredMaster.length}</span>
          </TabsTrigger>
          <TabsTrigger
            value="tailored"
            className="rounded-lg px-5 py-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 font-semibold transition-all flex items-center text-[13px]"
          >
            Tailored <span className="ml-2 bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-[10px] font-bold">{filteredTailored.length}</span>
          </TabsTrigger>
        </TabsList>
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
          <div className="flex flex-col gap-4">
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
          <div className="flex flex-col gap-4">
            {filteredMaster.map((resume) => (
              <MasterResumeCard
                key={resume.id}
                resume={resume}
                applications={applications}
              />
            ))}
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
          <div className="flex flex-col gap-4">
            {filteredTailored.map((resume) => (
              <TailoredResumeCard key={resume.id} resume={resume} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
