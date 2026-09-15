"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useInterviewStore } from "@/store/useInterviewStore";
import { PlayCircle, Target, Briefcase, Mic, Keyboard, Code, Settings2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export function StandaloneConfigurator() {
  const { stage, difficulty, tracks, mode, setConfig, startSession } = useInterviewStore();
  const [role, setRole] = useState("");
  const [companyType, setCompanyType] = useState("product_startup");
  const [isStarting, setIsStarting] = useState(false);

  const toggleTrack = (t: string) => {
    if (tracks.includes(t)) {
      setConfig({ tracks: tracks.filter((x: string) => x !== t) });
    } else {
      setConfig({ tracks: [...tracks, t] });
    }
  };

  const handleStart = async () => {
    if (!role.trim()) return;
    setIsStarting(true);
    try {
      const res = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          applicationId: null, // Standalone
          role,
          company: companyType, // passed as generic company style
          jobDescription: "Generic requirements for " + role,
          stage,
          difficulty,
          tracks,
          mode,
          companyType
        })
      });

      const data = await res.json();
      if (res.ok) {
        startSession({ sessionId: data.sessionId, questions: data.questions });
      } else {
        alert("Failed to start session: " + data.error);
        setIsStarting(false);
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred while starting the session.");
      setIsStarting(false);
    }
  };

  return (
    <Card className="border-indigo-100 shadow-md">
      <CardHeader className="bg-indigo-50/50 border-b border-indigo-100/50 pb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-600 rounded-lg shadow-sm">
            <Target className="w-5 h-5 text-white" />
          </div>
          <CardTitle className="text-2xl">Daily Interview Practice</CardTitle>
        </div>
        <CardDescription className="text-base text-slate-600">
          Configure a generic mock interview session to keep your skills sharp.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-8 space-y-8">
        {/* Role & Company Style */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-lg">
            <Briefcase className="w-5 h-5 text-indigo-500" />
            Target Role & Style
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-600 font-medium">What role are you practicing for?</Label>
              <Input 
                placeholder="e.g. Frontend Engineer, Product Manager"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-11 border-slate-200 focus-visible:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600 font-medium">Target Company Style</Label>
              <select 
                className="w-full h-11 px-3 rounded-md border border-slate-200 bg-white text-sm focus-visible:ring-2 focus-visible:ring-indigo-500"
                value={companyType}
                onChange={(e) => setCompanyType(e.target.value)}
              >
                <option value="faang">FAANG / Big Tech</option>
                <option value="indian_giant">Large Unicorn / Giant</option>
                <option value="product_startup">Product Startup (Series A-C)</option>
                <option value="early_startup">Early Stage Startup (Seed)</option>
                <option value="mnc">MNC / Enterprise Services</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tracks */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-lg">
            <Settings2 className="w-5 h-5 text-indigo-500" />
            Focus Areas
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[
              { id: "behavioral", label: "Behavioral / Leadership" },
              { id: "technical", label: "Core Technical" },
              { id: "dsa", label: "Data Structures & Algo" },
              { id: "system_design", label: "System Design" },
              { id: "product", label: "Product Thinking" },
              { id: "culture", label: "Culture Fit" }
            ].map(t => (
              <label 
                key={t.id} 
                className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  tracks.includes(t.id) 
                    ? "border-indigo-600 bg-indigo-50" 
                    : "border-slate-100 hover:border-indigo-200 hover:bg-slate-50"
                }`}
              >
                <Checkbox 
                  checked={tracks.includes(t.id)} 
                  onCheckedChange={() => toggleTrack(t.id)}
                  className={tracks.includes(t.id) ? "border-indigo-600" : ""}
                />
                <span className={`text-sm font-medium ${tracks.includes(t.id) ? "text-indigo-900" : "text-slate-600"}`}>
                  {t.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <Label className="text-slate-600 font-medium">Interview Stage</Label>
            <select 
              className="w-full h-11 px-3 rounded-md border border-slate-200 bg-white text-sm focus-visible:ring-2 focus-visible:ring-indigo-500"
              value={stage}
              onChange={(e) => setConfig({ stage: e.target.value })}
            >
              <option value="Quick Practice">Quick Practice (2 Qs)</option>
              <option value="Initial Screen">Initial Screen (3 Qs)</option>
              <option value="Technical Deep Dive">Technical Deep Dive (4 Qs)</option>
              <option value="Final Round">Final Round (5 Qs)</option>
            </select>
          </div>
          
          <div className="space-y-3">
            <Label className="text-slate-600 font-medium">Difficulty Level</Label>
            <select 
              className="w-full h-11 px-3 rounded-md border border-slate-200 bg-white text-sm focus-visible:ring-2 focus-visible:ring-indigo-500"
              value={difficulty}
              onChange={(e) => setConfig({ difficulty: e.target.value })}
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert (FAANG standard)</option>
            </select>
          </div>

          <div className="space-y-3">
            <Label className="text-slate-600 font-medium">Answer Mode</Label>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setConfig({ mode: "text" })}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === "text" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Keyboard className="w-4 h-4" /> Text
              </button>
              <button
                type="button"
                onClick={() => setConfig({ mode: "voice" })}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === "voice" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Mic className="w-4 h-4" /> Voice
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <Button 
            className="w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
            onClick={handleStart}
            disabled={isStarting || !role.trim() || tracks.length === 0}
          >
            {isStarting ? (
              "Generating Session..."
            ) : (
              <>
                <PlayCircle className="w-5 h-5 mr-2" /> Start Mock Interview
              </>
            )}
          </Button>
          {(!role.trim() || tracks.length === 0) && (
            <p className="text-center text-sm text-amber-600 mt-2">
              Please enter a target role and select at least one focus area.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
