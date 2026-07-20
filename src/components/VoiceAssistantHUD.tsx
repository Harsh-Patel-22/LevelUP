'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, HelpCircle, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { parseVoiceCommand, speakSystemVoice, findBestTaskMatch } from '@/lib/voice';

interface VoiceAssistantHUDProps {
  tasks?: Array<{ id: number; title: string; is_completed_today?: boolean }>;
  onCompleteTask?: (task: any) => void;
  onRefresh?: () => void;
}

export default function VoiceAssistantHUD({ tasks = [], onCompleteTask, onRefresh }: VoiceAssistantHUDProps) {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastCommandMsg, setLastCommandMsg] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          handleFinalCommand(event.results[i][0].transcript);
        }
      }
      setTranscript(currentTranscript);
    };

    rec.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setLastCommandMsg('⚠️ Microphone permission denied.');
        setIsListening(false);
      }
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
  }, [tasks, onCompleteTask, router]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setTranscript('');
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setTranscript('Listening...');
        setLastCommandMsg(null);
        if (!voiceMuted) speakSystemVoice('System voice online. State your command.');
      } catch (err) {
        console.error('Error starting recognition:', err);
      }
    }
  };

  const handleFinalCommand = async (finalText: string) => {
    const intent = parseVoiceCommand(finalText);

    switch (intent.type) {
      case 'COMPLETE_TASK': {
        const match = findBestTaskMatch(intent.taskTitle, tasks);
        if (match) {
          if (match.is_completed_today) {
            const msg = `Quest "${match.title}" is already cleared and locked.`;
            setLastCommandMsg(`🔒 ${msg}`);
            if (!voiceMuted) speakSystemVoice(msg);
          } else if (onCompleteTask) {
            onCompleteTask(match);
            const msg = `Completed quest "${match.title}".`;
            setLastCommandMsg(`✅ ${msg}`);
            if (!voiceMuted) speakSystemVoice(msg);
          }
        } else {
          const msg = `Task matching "${intent.taskTitle}" not found.`;
          setLastCommandMsg(`⚠️ ${msg}`);
          if (!voiceMuted) speakSystemVoice(msg);
        }
        break;
      }

      case 'NAVIGATE': {
        router.push(intent.destination);
        const pageName = intent.destination === '/' ? 'Dashboard' : intent.destination.replace('/', '');
        const msg = `Navigating to ${pageName}.`;
        setLastCommandMsg(`🧭 ${msg}`);
        if (!voiceMuted) speakSystemVoice(msg);
        break;
      }

      case 'CREATE_TASK': {
        try {
          const catRes = await fetch('/api/categories');
          const catData = await catRes.json();
          const firstCatId = catData.categories?.[0]?.id || 1;

          const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: intent.title,
              category_id: firstCatId,
              type: intent.taskType,
              weight: 2,
            }),
          });
          if (res.ok) {
            const msg = `Created new ${intent.taskType} quest: "${intent.title}".`;
            setLastCommandMsg(`✨ ${msg}`);
            if (!voiceMuted) speakSystemVoice(msg);
            if (onRefresh) onRefresh();
          }
        } catch (err) {
          setLastCommandMsg('❌ Failed to create task via voice.');
        }
        break;
      }

      case 'RUN_AUDIT': {
        const res = await fetch('/api/cron/penalty', { method: 'POST' });
        const data = await res.json();
        const msg = data.penalizedCount > 0 ? `Penalized ${data.penalizedCount} missed habits.` : 'All daily habits are up to date.';
        setLastCommandMsg(`⚡ Audit: ${msg}`);
        if (!voiceMuted) speakSystemVoice(`Audit executed. ${msg}`);
        if (onRefresh) onRefresh();
        break;
      }

      case 'UNKNOWN':
      default: {
        setLastCommandMsg(`❓ Unrecognized: "${finalText}"`);
        break;
      }
    }
  };

  if (!speechSupported) return null;

  return (
    <>
      {/* Floating System Voice Button HUD */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {/* Transcript / Result Toast */}
        {(isListening || lastCommandMsg) && (
          <div className="system-panel-glow rounded-xl p-3 max-w-xs sm:max-w-sm border-solo-cyan shadow-[0_0_20px_rgba(34,211,238,0.3)] animate-fade-in text-xs font-rajdhani font-bold">
            {isListening && (
              <div className="flex items-center gap-2 text-solo-cyan mb-1">
                <span className="w-2 h-2 rounded-full bg-solo-cyan animate-ping" />
                <span>SYSTEM VOICE: LISTENING...</span>
              </div>
            )}
            {transcript && <p className="text-text-primary italic">"{transcript}"</p>}
            {lastCommandMsg && <p className="text-solo-cyan mt-1 font-semibold">{lastCommandMsg}</p>}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2 bg-surface/90 backdrop-blur-md p-1.5 rounded-full border border-solo-blue/30 shadow-2xl">
          <button
            onClick={() => setVoiceMuted(!voiceMuted)}
            className="p-2 rounded-full text-text-muted hover:text-text-primary transition-all"
            title={voiceMuted ? 'Unmute System Audio Voice' : 'Mute System Audio Voice'}
          >
            {voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-solo-cyan" />}
          </button>

          <button
            onClick={() => setShowHelpModal(true)}
            className="p-2 rounded-full text-text-muted hover:text-text-primary transition-all"
            title="Voice Commands Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={toggleListening}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-orbitron font-extrabold text-xs uppercase tracking-wider transition-all duration-300 ${
              isListening
                ? 'bg-solo-cyan text-black shadow-[0_0_25px_rgba(34,211,238,0.8)] animate-pulse'
                : 'bg-solo-blue/20 text-solo-blue border border-solo-blue/40 hover:bg-solo-blue/30'
            }`}
          >
            {isListening ? <Mic className="w-4 h-4 animate-bounce" /> : <MicOff className="w-4 h-4" />}
            <span>{isListening ? 'Listening' : 'Voice Control'}</span>
          </button>
        </div>
      </div>

      {/* Voice Commands Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="system-panel-glow w-full max-w-lg rounded-2xl p-6 border-solo-cyan relative">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-solo-cyan" />
              <h2 className="font-orbitron font-extrabold text-xl text-text-primary">
                System Voice Command Guide
              </h2>
            </div>

            <div className="space-y-3 font-rajdhani text-xs">
              <div className="p-3 bg-surface rounded-lg border border-surface-border">
                <div className="font-bold text-solo-cyan text-sm uppercase mb-1">
                  1. Complete / Mark Task Done
                </div>
                <p className="text-text-muted">
                  Say: <strong className="text-text-primary">"Complete [task name]"</strong> or{' '}
                  <strong className="text-text-primary">"Mark [task name] as done"</strong>
                </p>
                <p className="text-text-dim text-[11px] mt-1">
                  🔒 Note: Once completed, task completions are locked and cannot be undone.
                </p>
              </div>

              <div className="p-3 bg-surface rounded-lg border border-surface-border">
                <div className="font-bold text-solo-cyan text-sm uppercase mb-1">2. Page Navigation</div>
                <p className="text-text-muted">
                  Say: <strong className="text-text-primary">"Go to stats"</strong>,{' '}
                  <strong className="text-text-primary">"Open tasks"</strong>, or{' '}
                  <strong className="text-text-primary">"Go to dashboard"</strong>
                </p>
              </div>

              <div className="p-3 bg-surface rounded-lg border border-surface-border">
                <div className="font-bold text-solo-cyan text-sm uppercase mb-1">3. Create New Quest</div>
                <p className="text-text-muted">
                  Say: <strong className="text-text-primary">"Create task Read 10 pages"</strong> or{' '}
                  <strong className="text-text-primary">"Add habit 30 min workout"</strong>
                </p>
              </div>

              <div className="p-3 bg-surface rounded-lg border border-surface-border">
                <div className="font-bold text-solo-cyan text-sm uppercase mb-1">4. Daily Audit & Penalties</div>
                <p className="text-text-muted">
                  Say: <strong className="text-text-primary">"Run audit"</strong> or{' '}
                  <strong className="text-text-primary">"Check streaks"</strong>
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-solo-cyan text-black font-orbitron font-extrabold text-xs uppercase"
            >
              CLOSE GUIDE
            </button>
          </div>
        </div>
      )}
    </>
  );
}
