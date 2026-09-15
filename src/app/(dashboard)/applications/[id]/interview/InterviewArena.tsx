import { useState } from "react";
import { useInterviewStore } from "@/store/useInterviewStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CodeWorkspace } from "./CodeWorkspace";
import { VoiceMode } from "./VoiceMode";
import { Badge } from "@/components/ui/badge";

export function InterviewArena() {
  const { 
    sessionId, questions, currentQuestionIndex, mode, companyType, phase, evaluation,
    setEvaluation, nextQuestion, completeSession 
  } = useInterviewStore();

  const [answerText, setAnswerText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const currentQ = questions[currentQuestionIndex];

  const handleSubmit = async (finalText: string) => {
    if (!finalText.trim()) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionIndex: currentQuestionIndex,
          answer: finalText,
          answerType: mode,
          companyType: companyType || "general"
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setEvaluation(data);
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    if (evaluation?.nextAction === "retry") {
      setEvaluation(null); // Just clear evaluation and let them try again
      setAnswerText("");
      return;
    }

    if (currentQuestionIndex + 1 < questions.length) {
      nextQuestion();
      setAnswerText("");
    } else {
      // Finish
      setIsLoading(true);
      try {
        const res = await fetch("/api/interview/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        completeSession(data);
      } catch (err: any) {
        console.error(err);
        alert(err.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!currentQ) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <Badge variant="outline">Question {currentQuestionIndex + 1} of {questions.length}</Badge>
        <Badge className="bg-indigo-50 text-indigo-700">{currentQ.track}</Badge>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-medium text-slate-900">{currentQ.question}</h2>
          {evaluation?.askFollowUp && (
            <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-100">
              <p className="font-semibold text-amber-800 text-sm mb-1">Follow Up:</p>
              <p className="text-amber-900 italic">"{evaluation.followUpQuestion}"</p>
            </div>
          )}
        </CardContent>
      </Card>

      {phase === "active" && (
        <Card>
          <CardContent className="p-6">
            {currentQ.isCoding ? (
              <CodeWorkspace 
                value={answerText}
                onChange={setAnswerText}
                onSubmit={() => handleSubmit(answerText)}
                isLoading={isLoading}
              />
            ) : mode === "voice" ? (
              <VoiceMode 
                questionText={currentQ.question}
                onSubmit={handleSubmit}
                isLoading={isLoading}
              />
            ) : (
              <div className="space-y-4">
                <textarea
                  className="w-full min-h-[200px] p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Type your answer here..."
                  value={answerText}
                  onChange={e => setAnswerText(e.target.value)}
                />
                <Button 
                  onClick={() => handleSubmit(answerText)} 
                  disabled={isLoading || !answerText.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {isLoading ? "Evaluating..." : "Submit Answer"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {phase === "feedback" && evaluation && (
        <Card className="border-indigo-100">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-xl font-bold text-indigo-700">
                {evaluation.overallScore}
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Score Breakdown</h3>
                <p className="text-sm text-slate-500">Clarity: {evaluation.breakdown.clarity} • Relevance: {evaluation.breakdown.relevance} • Evidence: {evaluation.breakdown.evidence}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-emerald-700 mb-2">What Worked</h4>
              <ul className="list-disc pl-5 text-slate-700 text-sm space-y-1">
                {evaluation.feedback.whatWorked.map((w: string, i: number) => <li key={i}>{w}</li>)}
              </ul>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg">
              <h4 className="font-semibold text-amber-800 mb-1">Priority Fix</h4>
              <p className="text-sm text-amber-900">{evaluation.feedback.priorityFix}</p>
            </div>

            <Button onClick={handleNext} disabled={isLoading} className="w-full">
              {isLoading ? "Loading..." : evaluation.nextAction === "retry" ? "Retry Question" : "Continue"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
