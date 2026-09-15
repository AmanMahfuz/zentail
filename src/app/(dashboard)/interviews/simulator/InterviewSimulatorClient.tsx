"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Mic, Square, Volume2, Play, ChevronRight, CheckCircle2 } from "lucide-react";
import { CompanyProfile, InterviewQuestion, AnswerEvaluation } from "@/lib/actions/ai-interview";
import ReactMarkdown from "react-markdown";

type SimulatorPhase = "setup" | "intro" | "active" | "feedback" | "completed";

export default function InterviewSimulatorClient({ applicationId, userId }: { applicationId: string, userId: string }) {
  const [phase, setPhase] = useState<SimulatorPhase>("setup");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Session Data
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Active Question State
  const [answerText, setAnswerText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [finalReport, setFinalReport] = useState<{ avgScore: number, report: string } | null>(null);
  
  const recognitionRef = useRef<any>(null);

  const startInterview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, userId })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to start interview");
      
      setSessionId(data.sessionId);
      setProfile(data.profile);
      setQuestions(data.questions);
      setPhase("intro");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const speakQuestion = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // stop any current speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes("Google") || v.name.includes("Natural"));
    if (preferred) utterance.voice = preferred;
    
    window.speechSynthesis.speak(utterance);
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Your browser does not support the Web Speech API for recording.");
        return;
      }
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        setAnswerText(transcript);
      };
      
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
      setAnswerText(""); // Clear previous text
    }
  };

  const submitAnswer = async () => {
    if (!answerText.trim() || !sessionId || !profile) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionIndex: currentQuestionIndex,
          answer: answerText,
          answerType: "text",
          companyType: profile.companyType
        })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to evaluate answer");
      
      setEvaluation(data);
      setPhase("feedback");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const nextQuestion = async () => {
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setAnswerText("");
      setEvaluation(null);
      setPhase("active");
    } else {
      // Complete interview
      setIsLoading(true);
      try {
        const res = await fetch("/api/interview/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId })
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "Failed to complete interview");
        
        setFinalReport(data);
        setPhase("completed");
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (phase === "setup") {
    return (
      <Card className="max-w-2xl mx-auto shadow-sm border-slate-200">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold text-slate-900">Adaptive AI Simulator</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center pt-6">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6">
            <Mic className="w-8 h-8" />
          </div>
          <p className="text-slate-600 text-center mb-8 max-w-md">
            Click start to let Zentail analyze the job description and build a custom interview specific to this company's hiring standards.
          </p>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <Button 
            onClick={startInterview} 
            disabled={isLoading}
            className="w-full sm:w-auto bg-[#4F46E5] hover:bg-indigo-600 text-white px-8 py-6 rounded-xl text-lg font-medium shadow-md transition-all"
          >
            {isLoading ? "Analyzing Company..." : "Start Interview Simulator"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === "intro" && profile) {
    return (
      <Card className="max-w-2xl mx-auto shadow-sm border-slate-200 animate-in fade-in slide-in-from-bottom-4">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Company Profile Detected
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Company Type</p>
              <p className="text-slate-900 font-semibold capitalize">{profile.companyType.replace("_", " ")}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Difficulty</p>
              <p className="text-slate-900 font-semibold capitalize">{profile.difficulty}</p>
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Focus Areas</p>
            <div className="flex flex-wrap gap-2">
              {profile.focusAreas.map(area => (
                <Badge key={area} variant="secondary" className="bg-indigo-50 text-indigo-700 capitalize">
                  {area.replace("_", " ")}
                </Badge>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
            <p className="text-sm text-amber-800 font-medium flex items-center gap-2 mb-2">
              <Volume2 className="w-4 h-4" />
              What to Expect
            </p>
            <p className="text-sm text-amber-700 leading-relaxed">
              {profile.interviewStyle}
            </p>
          </div>

          <Button 
            onClick={() => {
              setPhase("active");
              speakQuestion(questions[0].question);
            }} 
            className="w-full bg-[#4F46E5] hover:bg-indigo-600 text-white py-6 rounded-xl text-lg shadow-md"
          >
            I'm Ready. Begin Question 1
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === "active") {
    const currentQ = questions[currentQuestionIndex];
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-slate-500 border-slate-200">
            Question {currentQuestionIndex + 1} of {questions.length}
          </Badge>
          <Badge className="bg-indigo-50 text-indigo-700 border-none capitalize">
            {currentQ.category.replace("_", " ")}
          </Badge>
        </div>
        
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-start gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              className="shrink-0 rounded-full w-10 h-10 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              onClick={() => speakQuestion(currentQ.question)}
            >
              <Volume2 className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-medium text-slate-900 leading-relaxed pt-1">
              {currentQ.question}
            </h2>
          </div>
          
          <CardContent className="p-6">
            <textarea
              className="w-full min-h-[200px] p-4 bg-white border border-slate-200 rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Type your answer here, or click the microphone to speak..."
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
            />
            
            <div className="flex items-center justify-between mt-6">
              <Button
                variant={isRecording ? "destructive" : "outline"}
                onClick={toggleRecording}
                className={`rounded-xl px-6 h-12 flex items-center gap-2 ${
                  isRecording ? "animate-pulse shadow-md" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4 text-slate-500" />}
                {isRecording ? "Stop Recording" : "Record Answer"}
              </Button>
              
              <Button
                onClick={submitAnswer}
                disabled={isLoading || !answerText.trim()}
                className="bg-[#4F46E5] hover:bg-indigo-600 text-white rounded-xl px-8 h-12 shadow-sm font-medium"
              >
                {isLoading ? "Evaluating..." : "Submit Answer"}
              </Button>
            </div>
            {error && <p className="text-red-500 mt-4 text-sm text-right">{error}</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "feedback" && evaluation) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in slide-in-from-right-4 fade-in">
        <Card className="border-emerald-100 shadow-sm overflow-hidden">
          <div className="bg-emerald-50 p-6 border-b border-emerald-100">
            <h2 className="text-xl font-bold text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              Answer Feedback
            </h2>
          </div>
          
          <CardContent className="p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <p className="text-sm text-slate-500 font-medium mb-1">Overall</p>
                <p className="text-2xl font-bold text-slate-900">{evaluation.overallScore}/10</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <p className="text-sm text-slate-500 font-medium mb-1">Clarity</p>
                <p className="text-2xl font-bold text-slate-900">{evaluation.clarityScore}/10</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <p className="text-sm text-slate-500 font-medium mb-1">Relevance</p>
                <p className="text-2xl font-bold text-slate-900">{evaluation.relevanceScore}/10</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <p className="text-sm text-slate-500 font-medium mb-1">STAR Format</p>
                <p className="text-2xl font-bold text-slate-900">{evaluation.starFormatScore}/10</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Detailed Feedback</h3>
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {evaluation.feedback}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Strengths
                </h3>
                <ul className="space-y-2">
                  {evaluation.strengths.map((str, i) => (
                    <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-amber-700 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  To Improve
                </h3>
                <ul className="space-y-2">
                  {evaluation.improvements.map((imp, i) => (
                    <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {evaluation.askFollowUp && (
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <p className="text-sm text-indigo-800 font-semibold mb-1">Interviewer Follow-up Question:</p>
                <p className="text-indigo-900 italic">"{evaluation.followUpQuestion}"</p>
              </div>
            )}

            <Button 
              onClick={() => {
                nextQuestion();
                if (currentQuestionIndex + 1 < questions.length) {
                  speakQuestion(questions[currentQuestionIndex + 1].question);
                }
              }} 
              disabled={isLoading}
              className="w-full bg-[#4F46E5] hover:bg-indigo-600 text-white py-6 rounded-xl text-lg shadow-md mt-4"
            >
              {isLoading ? "Loading..." : currentQuestionIndex + 1 < questions.length ? "Continue to Next Question" : "Complete Interview & View Report"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "completed" && finalReport) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in zoom-in-95 fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Interview Complete!</h1>
          <p className="text-slate-500">Your final score: <span className="font-bold text-slate-900">{finalReport.avgScore.toFixed(1)}/10</span></p>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle className="text-xl font-bold text-slate-900">AI Interview Report</CardTitle>
          </CardHeader>
          <CardContent className="p-6 prose prose-slate max-w-none">
            <ReactMarkdown>{finalReport.report}</ReactMarkdown>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
