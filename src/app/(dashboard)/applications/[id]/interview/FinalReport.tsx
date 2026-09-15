import { useInterviewStore } from "@/store/useInterviewStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function FinalReport() {
  const { finalReport, applicationId, reset } = useInterviewStore();

  if (!finalReport) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-indigo-100 overflow-hidden">
        <div className="bg-indigo-600 p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-2">Interview Complete</h2>
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white text-indigo-700 text-4xl font-bold mt-4 shadow-lg">
            {finalReport.overallScore}
          </div>
          <p className="mt-4 opacity-90">{finalReport.summary}</p>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-emerald-700">Strengths</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-slate-700">
              {finalReport.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-amber-700">Priority Fixes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-slate-700">
              {finalReport.priorityFixes.map((f: string, i: number) => <li key={i}>{f}</li>)}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-indigo-900">Learning Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2 text-slate-700">
            {finalReport.learningPlan.map((l: string, i: number) => <li key={i}>{l}</li>)}
          </ul>
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-center mt-8">
        <Button onClick={reset} variant="outline">
          Practice Again
        </Button>
        <Link href={`/applications/${applicationId}`}>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            Return to Application
          </Button>
        </Link>
      </div>
    </div>
  );
}
