import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Volume2 } from "lucide-react";

export function VoiceMode({
  questionText,
  onSubmit,
  isLoading
}: {
  questionText: string;
  onSubmit: (text: string) => void;
  isLoading: boolean;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Speak the question when component mounts
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(questionText);
      window.speechSynthesis.speak(utterance);
    }
    
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [questionText]);

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Your browser does not support Speech Recognition. Please use Text mode.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    
    recognitionRef.current.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript;
      }
      setTranscript(finalTranscript);
    };

    recognitionRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const speakQuestionAgain = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(questionText);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-6 flex flex-col items-center py-6">
      <Button variant="ghost" onClick={speakQuestionAgain} className="text-indigo-600 gap-2">
        <Volume2 className="w-4 h-4" /> Repeat Question
      </Button>

      <div className="flex gap-4 justify-center">
        {!isRecording ? (
          <Button 
            onClick={startRecording} 
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 shadow-lg"
          >
            <Mic className="w-8 h-8 text-white" />
          </Button>
        ) : (
          <Button 
            onClick={stopRecording} 
            className="w-16 h-16 rounded-full bg-slate-800 hover:bg-slate-900 shadow-lg animate-pulse"
          >
            <Square className="w-6 h-6 text-white" fill="white" />
          </Button>
        )}
      </div>
      
      <p className="text-sm text-slate-500 text-center">
        {isRecording ? "Listening... Click stop when finished." : "Click microphone to start answering."}
      </p>

      {transcript && (
        <div className="w-full mt-6 space-y-4">
          <label className="text-sm font-medium text-slate-700">Transcript (You can edit this before submitting):</label>
          <textarea
            className="w-full min-h-[100px] p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
          />
          <Button 
            onClick={() => onSubmit(transcript)} 
            disabled={isLoading || isRecording}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {isLoading ? "Evaluating..." : "Submit Voice Answer"}
          </Button>
        </div>
      )}
    </div>
  );
}
