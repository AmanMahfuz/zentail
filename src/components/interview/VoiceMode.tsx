'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Mic, Square, Loader2, CheckCircle2, AlertTriangle, ArrowRight, Volume2, Target, Sparkles, Wifi, BatteryMedium, Keyboard, Settings, Activity, FileText, RefreshCw } from 'lucide-react';

interface VoiceModeProps {
  questions: any[];
  onComplete: (scores: any[]) => void;
  onSwitchToTextMode?: () => void;
  aiVoice?: string;
  interviewStyle?: 'training' | 'simulation';
  config?: any;
  sessionId?: string | null;
}

export default function VoiceMode({ questions: initialQuestions, onComplete, onSwitchToTextMode, aiVoice = 'Kore', interviewStyle = 'training', config, sessionId }: VoiceModeProps) {
  const [dynamicQuestions, setDynamicQuestions] = useState<any[]>(initialQuestions || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [transcript, setTranscript] = useState('');
  const [scores, setScores] = useState<any[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [microphoneError, setMicrophoneError] = useState('');

  // Sync questions if initialQuestions updates
  useEffect(() => {
    if (initialQuestions && initialQuestions.length > 0) {
      setDynamicQuestions(initialQuestions);
    }
  }, [initialQuestions]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const speakSessionRef = useRef<number>(0);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const currentQ = dynamicQuestions[currentIndex] || initialQuestions?.[currentIndex] || { question: 'Interview Question' };

  // Speak the question when it changes
  useEffect(() => {
    if (evaluation) return; // Don't speak if showing evaluation
    if (currentQ?.question) {
      speakText(currentQ.question);
    }
    
    return () => {
      window.speechSynthesis.cancel();
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, [currentIndex, evaluation, currentQ?.question]);

  const speakText = async (text: string) => {
    if (!text) return;
    speakSessionRef.current += 1;
    const currentSession = speakSessionRef.current;
    setAutoplayBlocked(false);

    window.speechSynthesis.cancel();
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.src = "";
      audioPlayerRef.current = null;
    }
    
    setIsSpeaking(true);
    try {
      // Call dedicated Gemini TTS endpoint for the EXACT question text
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: aiVoice })
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(`TTS API failed: ${errData.error || res.statusText}`);
      }
      
      const data = await res.json();
      if (!data.audioBase64) {
        throw new Error("No audio data received");
      }
      const audioBase64 = data.audioBase64;
      const mimeType = data.mimeType || 'audio/wav';

      if (currentSession !== speakSessionRef.current) return;
      
      const audio = new Audio(`data:${mimeType};base64,${audioBase64}`);
      audioPlayerRef.current = audio;
      
      audio.onended = () => {
        if (currentSession === speakSessionRef.current) setIsSpeaking(false);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          if (e.name === 'NotAllowedError') {
            console.warn("Autoplay blocked. Tap to play.");
            if (currentSession === speakSessionRef.current) {
              setAutoplayBlocked(true);
              setIsSpeaking(false);
            }
          } else if (e.name !== 'AbortError' && e.name !== 'NotSupportedError') {
            console.error("Audio playback error:", e);
          }
        });
      }
    } catch (e: any) {
      if (currentSession !== speakSessionRef.current) return;
      const errorMsg = e.message || String(e);
      console.warn("Gemini TTS failed, falling back to browser TTS. Reason:", errorMsg);
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05; // Natural interview pace
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const goodVoiceNames = ['Google US English', 'Samantha', 'Karen', 'Daniel', 'Moira'];
      const selectedVoice = voices.find(v => goodVoiceNames.some(name => v.name.includes(name))) || voices.find(v => v.lang.startsWith('en'));
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onend = () => {
        if (currentSession === speakSessionRef.current) setIsSpeaking(false);
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  const startRecording = async () => {
    try {
      window.speechSynthesis.cancel();
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setMicrophoneError('');
    } catch (err: any) {
      console.error("Error accessing microphone", err);
      setMicrophoneError("Could not access microphone. Please check your browser permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'answer.webm');
      formData.append('question', JSON.stringify(currentQ));
      if (sessionId) {
        formData.append('interviewId', sessionId);
      }
      
      formData.append('budgetLimit', config?.budgetLimit?.toString() || '3');
      formData.append('itemsConsumed', (scores.length + 1).toString());
      formData.append('goal', config?.goal || 'practice_question');
      
      const history = scores.map(s => ({ q: s.question.question, a: s.answer }));
      formData.append('sessionHistory', JSON.stringify(history));
      
      formData.append('voice', aiVoice);

      const res = await fetch('/api/interview/respond', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.evaluation) {
        const transcriptText = data.evaluation.transcript || "No transcript detected.";
        
        if (interviewStyle === 'simulation') {
          const newScores = [...scores, { question: currentQ, answer: transcriptText, evaluation: data.evaluation }];
          setScores(newScores);
          
          if (currentIndex + 1 < dynamicQuestions.length) {
            setCurrentIndex(currentIndex + 1);
          } else {
            onComplete(newScores);
          }
        } else {
          setTranscript(transcriptText);
          setEvaluation(data.evaluation);
        }
      } else {
        alert(data.error || "Failed to process audio.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to connect to AI.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNextInTraining = () => {
    const newScores = [...scores, { question: currentQ, answer: transcript, evaluation }];
    setScores(newScores);
    setEvaluation(null);
    setTranscript('');
    
    if (currentIndex + 1 < dynamicQuestions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete(newScores);
    }
  };

  const handleRetry = () => {
    setEvaluation(null);
    setTranscript('');
  };



  return (
    <div className="flex-1 flex flex-col bg-[#FCFCFD] dark:bg-[#0B0C10] relative overflow-hidden h-full w-full font-sans" 
         style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
      
      {/* Top Navigation Bar */}
      <header className="flex justify-between items-center px-6 lg:px-12 py-6 z-10 relative">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse shadow-[0_0_8px_rgba(147,51,234,0.8)]" />
            <span className="text-[11px] font-black text-purple-700 dark:text-purple-400 uppercase tracking-[0.2em]">Connected</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onSwitchToTextMode}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/5 transition-colors"
          >
            <Keyboard size={12} /> Text Mode
          </button>
          <button className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors p-2 bg-slate-100/50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg">
            <Settings size={16} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col px-6 lg:px-12 pb-32 z-10 relative max-w-screen-lg mx-auto w-full items-center justify-center space-y-12">
        
        {/* Top Status */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em]">
              Question <span className="text-purple-600 dark:text-purple-400">{String(currentIndex + 1).padStart(2, '0')}</span> / {String(dynamicQuestions.length).padStart(2, '0')}
            </span>
          </div>
          <div className="w-48 h-[3px] bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
            <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${((currentIndex + 1) / dynamicQuestions.length) * 100}%` }} />
          </div>
        </div>

        {/* The Visualization Orb (Old Voice Animation) */}
        <div className="relative flex items-center justify-center w-48 h-48 sm:w-64 sm:h-64 my-8">
          <AnimatePresence>
            {(isSpeaking || isRecording || isProcessing) && (
              <>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full bg-purple-500/20"
                />
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.5 }}
                  className="absolute inset-0 rounded-full bg-indigo-500/20"
                />
              </>
            )}
          </AnimatePresence>
          <div className={`relative z-10 w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${isSpeaking ? 'bg-purple-600 shadow-purple-500/50' : isRecording ? 'bg-indigo-600 shadow-indigo-500/50' : isProcessing ? 'bg-emerald-600 shadow-emerald-500/50' : 'bg-slate-800 dark:bg-slate-900'}`}>
             {isSpeaking ? (
                <Volume2 className="text-white w-12 h-12 animate-pulse" />
             ) : isRecording ? (
                <Mic className="text-white w-12 h-12" />
             ) : isProcessing ? (
                <Activity className="text-white w-12 h-12 animate-spin" />
             ) : (
                <Bot className="text-slate-400 w-12 h-12" />
             )}
          </div>
        </div>

        {/* Question Text */}
        <div className="text-center w-full max-w-3xl flex flex-col items-center">
          <div className="relative mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-relaxed tracking-tight relative z-10 text-center">
              {currentQ.question}
            </h1>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
            <button
              onClick={() => currentQ?.question && speakText(currentQ.question)}
              disabled={isSpeaking}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-full text-xs font-semibold transition-colors shadow-sm"
              title="Replay Question"
            >
              <Volume2 size={14} className={isSpeaking ? 'animate-pulse text-purple-500' : ''} />
              Replay Question
            </button>
            {autoplayBlocked && (
              <button
                onClick={() => currentQ?.question && speakText(currentQ.question)}
                className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-300 rounded-full text-xs font-semibold animate-pulse"
              >
                Tap to enable audio
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-purple-500 animate-bounce' : 'bg-purple-300'} [animation-delay:0ms]`} />
              <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-purple-500 animate-bounce' : 'bg-purple-300'} [animation-delay:150ms]`} />
              <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-purple-500 animate-bounce' : 'bg-purple-300'} [animation-delay:300ms]`} />
            </div>
            <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-[0.2em]">
              {isSpeaking ? 'AI IS SPEAKING' : isRecording ? 'LISTENING FOR RESPONSE' : isProcessing ? 'PROCESSING AUDIO...' : 'WAITING FOR RESPONSE'}
            </span>
          </div>
        </div>

      </div>

      {/* Bottom Action Area */}
      <div className="absolute bottom-0 left-0 w-full pb-8 pt-24 bg-gradient-to-t from-[#FCFCFD] dark:from-[#0B0C10] via-[#FCFCFD]/90 dark:via-[#0B0C10]/90 to-transparent z-20 flex flex-col items-center">
        {microphoneError && (
          <div className="bg-red-500/10 text-red-600 border border-red-500/20 px-4 py-2 rounded-lg text-sm mb-4">
            {microphoneError}
          </div>
        )}
        
        <div className="relative group">
          <div className={`absolute inset-0 rounded-full blur-2xl transition-all duration-700 ${isRecording ? 'bg-indigo-500/50 scale-150 animate-pulse' : 'bg-purple-500/30 group-hover:scale-110 group-hover:bg-purple-500/40'}`} />
          <button 
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`relative w-[88px] h-[88px] rounded-full flex items-center justify-center transition-all duration-300 ${
              isRecording 
                ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 scale-95 shadow-[inset_0_4px_10px_rgba(0,0,0,0.2)]' 
                : 'bg-gradient-to-br from-purple-500 to-purple-600 hover:scale-105 shadow-[0_10px_30px_rgba(147,51,234,0.3)] hover:shadow-[0_15px_40px_rgba(147,51,234,0.4)]'
            }`}
          >
            {isProcessing ? (
              <Loader2 size={28} className="text-white animate-spin" />
            ) : isRecording ? (
              <Square fill="currentColor" size={28} className="text-white" />
            ) : (
              <Mic size={32} className="text-white" />
            )}
          </button>
        </div>
        
        <div className="text-center mt-5">
          <h3 className="text-base font-black text-slate-900 dark:text-white mb-1 tracking-tight">
            {isProcessing ? 'Processing Response...' : isRecording ? 'Tap to Stop Recording' : 'Tap Mic to Answer'}
          </h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium tracking-wide">
            {isRecording ? 'Capturing audio with high-fidelity' : 'Aether AI is ready to transcribe your response'}
          </p>
        </div>
      </div>

      {/* Evaluation Feedback Modal overlay */}
      <AnimatePresence>
        {evaluation && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              className="bg-white dark:bg-[#111216] border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-2xl max-w-2xl w-full relative overflow-hidden my-auto"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-white/5 gap-4">
                <h3 className="text-2xl font-black flex items-center gap-3 text-slate-900 dark:text-white"><Sparkles className="text-purple-500"/> Micro-Feedback</h3>
                <div className="flex flex-col md:items-end">
                   <div className="text-4xl font-black text-indigo-600">{evaluation.overall_score}<span className="text-xl text-slate-400">/100</span></div>
                   <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Overall Score</span>
                </div>
              </div>
              
              <div className="space-y-6 mb-8">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-[0.15em] flex items-center gap-1.5"><CheckCircle2 size={16}/> What worked</span>
                  <ul className="space-y-2">
                    {evaluation.what_worked?.map((w: string, i: number) => (
                      <li key={i} className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"/> {w}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-orange-600 dark:text-orange-500 uppercase tracking-[0.15em] flex items-center gap-1.5"><AlertTriangle size={16}/> Priority fix</span>
                  <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 p-4 rounded-xl">
                    <p className="text-sm font-medium text-orange-900 dark:text-orange-200">{evaluation.priority_fix}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black text-purple-700 dark:text-purple-400 uppercase tracking-[0.15em] flex items-center gap-1.5"><Target size={16}/> Better structure</span>
                  <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 p-4 rounded-xl">
                    <p className="text-sm font-medium text-purple-900 dark:text-purple-200">{evaluation.better_structure}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={handleRetry}
                  className="flex-1 py-4 rounded-xl font-bold text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} /> Retry Question
                </button>
                <button
                  onClick={handleNextInTraining}
                  className="flex-1 py-4 rounded-xl font-bold text-sm bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30"
                >
                  {currentIndex < dynamicQuestions.length - 1 ? 'Next Question' : 'Finish Session'} <ArrowRight size={16} />
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
