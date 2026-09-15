"use client";

import { useState } from "react";
import { Sparkles, MessageSquare, Layers, CheckSquare } from "lucide-react";
import { AITopicsTab } from "./AITopicsTab";
import { Badge } from "@/components/ui/badge";

export function InterviewDashboardTabs() {
  const [activeTab, setActiveTab] = useState("topics");

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setActiveTab("topics")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === "topics" 
              ? "bg-indigo-600 text-white shadow-sm" 
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          AI Topics
          {activeTab === "topics" && <div className="w-1.5 h-1.5 rounded-full bg-white ml-1"></div>}
        </button>

        <button
          onClick={() => setActiveTab("qa")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === "qa" 
              ? "bg-indigo-600 text-white shadow-sm" 
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Q&A Practice
        </button>

        <button
          onClick={() => setActiveTab("flashcards")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === "flashcards" 
              ? "bg-indigo-600 text-white shadow-sm" 
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Layers className="w-4 h-4" />
          Flashcards
          <Badge className="ml-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none px-1.5 py-0 text-[10px]">
            12
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab("checklist")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === "checklist" 
              ? "bg-indigo-600 text-white shadow-sm" 
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          Checklist
          <Badge className="ml-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-1.5 py-0 text-[10px]">
            2/4
          </Badge>
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-slate-200">
        {activeTab === "topics" && <AITopicsTab />}
        
        {/* Placeholders for other tabs */}
        {activeTab === "qa" && (
          <div className="py-12 text-center text-slate-500">Q&A Practice functionality coming soon.</div>
        )}
        {activeTab === "flashcards" && (
          <div className="py-12 text-center text-slate-500">Flashcards functionality coming soon.</div>
        )}
        {activeTab === "checklist" && (
          <div className="py-12 text-center text-slate-500">Checklist functionality coming soon.</div>
        )}
      </div>
    </div>
  );
}
