"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RequirementTable } from "@/components/applications/requirement-table";
import { generateRequirementMap } from "@/lib/actions/requirement-map";
import { Loader2 } from "lucide-react";

export default function RequirementMapPage() {
  const [jd, setJd] = useState("");
  const [requirements, setRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!jd) return;
    setLoading(true);
    setError("");
    
    const result = await generateRequirementMap(jd);
    
    if (result.success) {
      setRequirements(result.requirementMap);
    } else {
      setError(result.error || "Failed to generate requirement map");
    }
    
    setLoading(false);
  };

  return (
    <div className="container max-w-5xl py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Requirement Map</h1>
        <p className="text-muted-foreground mt-2">
          Paste the job description below. We'll extract exactly what they want and map it against your evidence profile.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Description</CardTitle>
          <CardDescription>Paste the full JD to see your evidence fit.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea 
            placeholder="Paste job description here..." 
            className="min-h-[200px]"
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />
          <Button onClick={handleGenerate} disabled={loading || !jd}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Analyze Fit
          </Button>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </CardContent>
      </Card>

      {requirements.length > 0 && (
        <RequirementTable requirements={requirements} />
      )}
    </div>
  );
}
