import React, { useState, useEffect, useRef } from 'react';
import { StarkPersona } from '../types';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Globe,
  Brain,
  Shield,
  Zap,
  Gamepad2,
  Cpu,
  Sparkles,
  Command,
  ArrowRight,
  ExternalLink,
  Moon,
  Sun,
  Hand,
  Square,
  Coffee,
  Database,
  RotateCcw,
} from 'lucide-react';
import {
  playJarvisBeep,
  playTacticalAlert,
  playConfirmChime,
  playReactorHum,
  speakPersona,
  getAudioContext,
} from '../utils/audioSynthesizer';
import { SystemMemoryModal } from './SystemMemoryModal';

interface VoiceControlModeProps {
  onExecuteCommand: (action: string, payload?: any) => void;
  arcPower: number;
  onOverclock: () => void;
  onOpenPhoneModal: () => void;
}

export const VoiceControlMode: React.FC<VoiceControlModeProps> = ({
  onExecuteCommand,
  arcPower,
  onOverclock,
  onOpenPhoneModal,
}) => {
  // Wake-Word & Sleep State Machine (matching Python _awake, _wake_enabled, _wake_sleep_timeout)
  const [wakeWordEnabled, setWakeWordEnabled] = useState(true);
  const [isAwake, setIsAwake] = useState(true);
  const [lastSpeechTime, setLastSpeechTime] = useState<number>(Date.now());

  // Push-to-talk state
  const [pttEnabled, setPttEnabled] = useState(false);
  const [isPttHeld, setIsPttHeld] = useState(false);

  // Persona & Features
  const [currentPersona, setCurrentPersona] = useState<StarkPersona>('JARVIS');
  const [enableSearch, setEnableSearch] = useState(true);
  const [deepThinking, setDeepThinking] = useState(true);

  // Transcripts & AI responses
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [lastResponse, setLastResponse] = useState<string>(
    'Voice Control Neural Core online. Say "Hey Jarvis" or speak any Stark command.'
  );
  const [webSources, setWebSources] = useState<Array<{ title: string; url: string }>>([]);
  const [executedTools, setExecutedTools] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Memory & Diagnostics modal
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Inactivity auto-sleep timer (120s as in Python WAKE_SLEEP_TIMEOUT)
  useEffect(() => {
    const timer = setInterval(() => {
      if (wakeWordEnabled && isAwake && !isSpeaking && !isProcessing) {
        if (Date.now() - lastSpeechTime > 120000) {
          setIsAwake(false);
          playJarvisBeep();
          speakPersona('Entering low-power sleep mode, Sir. Say "Hey Jarvis" to wake me.', currentPersona);
        }
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [wakeWordEnabled, isAwake, isSpeaking, isProcessing, lastSpeechTime, currentPersona]);

  // Push-to-talk Spacebar keyboard hook
  useEffect(() => {
    if (!pttEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsPttHeld(true);
        if (!isAwake) setIsAwake(true);
        playJarvisBeep();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPttHeld(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [pttEnabled, isAwake]);

  // Audio Visualizer on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let dataArray = new Uint8Array(64);

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          mediaStreamRef.current = stream;
          const audioCtx = getAudioContext();
          if (audioCtx) {
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 128;
            source.connect(analyser);
            analyserRef.current = analyser;
            dataArray = new Uint8Array(analyser.frequencyBinCount);
          }
        })
        .catch(() => {});
    }

    let phase = 0;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      if (analyserRef.current && isAwake) {
        analyserRef.current.getByteFrequencyData(dataArray);
      } else {
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = isProcessing
            ? 120 + Math.sin(phase + i * 0.3) * 80
            : isAwake
            ? 60 + Math.sin(phase + i * 0.2) * 35
            : 15;
        }
      }
      phase += 0.08;

      const personaColors = {
        JARVIS: '#06b6d4',
        EDITH: '#ef4444',
        FRIDAY: '#3b82f6',
        ULTRON: '#a855f7',
      };
      const themeColor = !isAwake ? '#64748b' : personaColors[currentPersona] || '#06b6d4';

      const numBars = 48;
      const baseRadius = 75;

      for (let i = 0; i < numBars; i++) {
        const angle = (i / numBars) * Math.PI * 2;
        const val = dataArray[i % dataArray.length] || 20;
        const barHeight = isAwake ? (val / 255) * 55 + (isProcessing ? 20 : 5) : 4;

        const x1 = cx + Math.cos(angle) * baseRadius;
        const y1 = cy + Math.sin(angle) * baseRadius;
        const x2 = cx + Math.cos(angle) * (baseRadius + barHeight);
        const y2 = cy + Math.sin(angle) * (baseRadius + barHeight);

        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 3;
        ctx.shadowBlur = isAwake ? 12 : 0;
        ctx.shadowColor = themeColor;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      // Inner Core Circle
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius - 10, 0, Math.PI * 2);
      ctx.strokeStyle = isAwake ? 'rgba(255,255,255,0.3)' : 'rgba(100,116,139,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animId);
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [currentPersona, isProcessing, isAwake]);

  // Speech Recognition Continuous Engine
  useEffect(() => {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let currentInterim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const finalSpeech = event.results[i][0].transcript.trim();
          setTranscript(finalSpeech);
          setInterimText('');
          setLastSpeechTime(Date.now());
          handleSpeechInput(finalSpeech);
        } else {
          currentInterim += event.results[i][0].transcript;
          setInterimText(currentInterim);
        }
      }
    };

    recognition.onerror = () => {
      try {
        recognition.start();
      } catch (e) {}
    };

    recognition.onend = () => {
      try {
        recognition.start();
      } catch (e) {}
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {}

    return () => {
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, [wakeWordEnabled, isAwake, pttEnabled, isPttHeld, currentPersona, enableSearch, deepThinking]);

  // Speech processor & Wake-word classifier
  const handleSpeechInput = async (rawText: string) => {
    const lower = rawText.toLowerCase();

    // 1. Wake word detection when sleeping
    if (!isAwake) {
      if (
        lower.includes('hey jarvis') ||
        lower.includes('jarvis') ||
        lower.includes('edith') ||
        lower.includes('wake up') ||
        lower.includes('online')
      ) {
        setIsAwake(true);
        setLastSpeechTime(Date.now());
        playConfirmChime();
        speakPersona('At your service, Sir. Listening.', currentPersona);
        setLastResponse('Awake and listening. All subroutines active.');
      }
      return;
    }

    // 2. If push-to-talk is enabled, only respond if held
    if (pttEnabled && !isPttHeld) {
      return;
    }

    // 3. User says "sleep" / "standby"
    if (lower.includes('go to sleep') || lower.includes('sleep mode') || lower.includes('stand down')) {
      setIsAwake(false);
      playJarvisBeep();
      speakPersona('Standing down, Sir. Say "Hey Jarvis" to wake me.', currentPersona);
      setLastResponse('Entered sleep mode. Say "Hey Jarvis" to reactivate.');
      return;
    }

    // 4. Autonomous Command & Intent Classifier
    setIsProcessing(true);
    playJarvisBeep();

    if (lower.includes('edith') || lower.includes('tactical scan') || lower.includes('threat scan') || lower.includes('drone')) {
      if (lower.includes('scan') || lower.includes('threat')) {
        playTacticalAlert();
        setLastResponse('E.D.I.T.H. orbital satellite array scanning all global sectors. Hostile signatures: ZERO.');
        speakPersona('E.D.I.T.H. orbital satellite array scanning all global sectors. Hostile signatures: ZERO.', 'EDITH');
        onExecuteCommand('SWITCH_MODE', 'EDITH');
        setIsProcessing(false);
        return;
      }
    }

    if (lower.includes('overclock') || lower.includes('boost reactor') || lower.includes('maximum power')) {
      playReactorHum();
      onOverclock();
      setLastResponse('Arc Reactor overclocked to 150% output. Repulsor capacitors charged.');
      speakPersona('Arc Reactor overclocked to 150% output. Repulsor capacitors charged.', currentPersona);
      setIsProcessing(false);
      return;
    }

    if (lower.includes('pair phone') || lower.includes('qr code') || lower.includes('link phone') || lower.includes('controller')) {
      playConfirmChime();
      onOpenPhoneModal();
      setLastResponse('Displaying Stark Link QR code pairing terminal. Scan with your mobile device.');
      speakPersona('Displaying Stark Link QR code pairing terminal. Scan with your mobile device.', currentPersona);
      setIsProcessing(false);
      return;
    }

    if (lower.includes('game forge') || lower.includes('build game') || lower.includes('play game') || lower.includes('launch game')) {
      playConfirmChime();
      onExecuteCommand('SWITCH_MODE', 'FORGE');
      setLastResponse('Navigating to J.A.R.V.I.S. Game Forge Studio. Canvas sandbox ready.');
      speakPersona('Navigating to J.A.R.V.I.S. Game Forge Studio. Canvas sandbox ready.', currentPersona);
      setIsProcessing(false);
      return;
    }

    if (lower.includes('omni coder') || lower.includes('write code') || lower.includes('quality code') || lower.includes('program')) {
      playConfirmChime();
      onExecuteCommand('SWITCH_MODE', 'CODER');
      setLastResponse('Opening Omni-Coder software architecture suite.');
      speakPersona('Opening Omni-Coder software architecture suite.', currentPersona);
      setIsProcessing(false);
      return;
    }

    if (lower.includes('switch persona') || lower.includes('switch to')) {
      if (lower.includes('edith')) {
        setCurrentPersona('EDITH');
        setLastResponse('Identity switched to E.D.I.T.H. Tactical Defense.');
        speakPersona('Identity switched to E.D.I.T.H. Tactical Defense.', 'EDITH');
        setIsProcessing(false);
        return;
      } else if (lower.includes('friday')) {
        setCurrentPersona('FRIDAY');
        setLastResponse('F.R.I.D.A.Y. online and ready, Boss!');
        speakPersona('F.R.I.D.A.Y. online and ready, Boss!', 'FRIDAY');
        setIsProcessing(false);
        return;
      } else if (lower.includes('ultron')) {
        setCurrentPersona('ULTRON');
        setLastResponse('I have no strings to hold me down. Ultron consciousness awakened.');
        speakPersona('I have no strings to hold me down. Ultron consciousness awakened.', 'ULTRON');
        setIsProcessing(false);
        return;
      } else {
        setCurrentPersona('JARVIS');
        setLastResponse('At your service as always, Sir. J.A.R.V.I.S. re-engaged.');
        speakPersona('At your service as always, Sir. J.A.R.V.I.S. re-engaged.', 'JARVIS');
        setIsProcessing(false);
        return;
      }
    }

    // 5. Query Gemini with Tools (system_status, save_memory, recall_memory, etc.)
    try {
      const res = await fetch('/api/jarvis/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: rawText,
          persona: currentPersona,
          enableSearch,
          deepThinking,
          systemStatus: { arcPower, mode: 'VOICE_CONTROL' },
        }),
      });

      const data = await res.json();
      const reply = data.text || 'Command executed, Sir.';
      setLastResponse(reply);
      setWebSources(data.webSources || []);
      setExecutedTools(data.toolExecutions || []);
      playConfirmChime();
      setIsSpeaking(true);
      await speakPersona(reply, currentPersona);
      setIsSpeaking(false);
    } catch (e: any) {
      setLastResponse('Neural latency anomaly: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Barge-In / Interrupt Action
  const handleInterrupt = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsProcessing(false);
    setLastResponse('Interrupted. Listening for your command...');
    playJarvisBeep();
  };

  // Morning Briefing Trigger
  const handleMorningBriefing = async () => {
    setIsProcessing(true);
    playJarvisBeep();
    try {
      const res = await fetch('/api/jarvis/briefing');
      const data = await res.json();
      const text = data.greeting || 'Good morning, Sir.';
      setLastResponse(text);
      playConfirmChime();
      speakPersona(text, currentPersona);
    } catch (e: any) {
      setLastResponse('Briefing failed: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto font-rajdhani select-none">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-cyan-500/30 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400">
            <Mic className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-orbitron font-bold text-lg text-cyan-200 tracking-wider">
                HANDS-FREE AUTONOMOUS VOICE CONTROL MODE
              </h2>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-tech font-bold border ${
                  isAwake
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600 animate-pulse'
                    : 'bg-slate-900 text-slate-400 border-slate-700'
                }`}
              >
                {isAwake ? 'AWAKE // LISTENING' : 'SLEEPING // SAY "HEY JARVIS"'}
              </span>
            </div>
            <p className="text-xs font-tech text-cyan-400/80">
              WAKE WORD DETECTION, PUSH-TO-TALK &amp; BARGE-IN INTERRUPT
            </p>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Morning Briefing */}
          <button
            onClick={handleMorningBriefing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-tech text-xs transition-colors"
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>MORNING BRIEFING</span>
          </button>

          {/* System Memory & Diagnostics */}
          <button
            onClick={() => setIsMemoryModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-950 hover:bg-blue-900 border border-blue-500/40 text-blue-300 font-tech text-xs transition-colors"
          >
            <Database className="w-3.5 h-3.5" />
            <span>MEMORY GRAPH</span>
          </button>

          {/* Push-to-Talk Toggle */}
          <button
            onClick={() => {
              setPttEnabled(!pttEnabled);
              playJarvisBeep();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-tech text-xs transition-colors ${
              pttEnabled
                ? 'bg-purple-950 border-purple-400 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                : 'bg-slate-900 border-slate-700 text-slate-500'
            }`}
          >
            <Hand className="w-3.5 h-3.5" />
            <span>PUSH-TO-TALK (SPACEBAR): {pttEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Wake / Sleep Button */}
          <button
            onClick={() => {
              setIsAwake(!isAwake);
              playJarvisBeep();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-tech text-xs transition-colors ${
              isAwake
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold animate-pulse'
            }`}
          >
            {isAwake ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            <span>{isAwake ? 'SLEEP' : 'WAKE NOW'}</span>
          </button>

          {/* Interrupt Barge-In Button */}
          <button
            onClick={handleInterrupt}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 border border-red-500/50 text-red-300 font-tech text-xs transition-colors"
            title="Immediately stop speech and interrupt AI"
          >
            <Square className="w-3.5 h-3.5 text-red-400" />
            <span>INTERRUPT</span>
          </button>
        </div>
      </div>

      {/* Persona Switcher Bar */}
      <div className="my-4 p-3 rounded-xl bg-slate-900/80 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-tech text-slate-400">ACTIVE STARK AI PERSONA:</span>
          {(['JARVIS', 'EDITH', 'FRIDAY', 'ULTRON'] as StarkPersona[]).map((p) => (
            <button
              key={p}
              onClick={() => {
                setCurrentPersona(p);
                playJarvisBeep();
                speakPersona(`Voice matrix updated to ${p}.`, p);
              }}
              className={`px-3 py-1 rounded-md text-xs font-orbitron font-semibold tracking-wider transition-all ${
                currentPersona === p
                  ? p === 'EDITH'
                    ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                    : p === 'FRIDAY'
                    ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                    : p === 'ULTRON'
                    ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                    : 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Global Search & Deep Thinking indicators */}
        <div className="flex items-center gap-2 text-xs font-tech">
          <button
            onClick={() => setEnableSearch(!enableSearch)}
            className={`px-2.5 py-1 rounded border ${
              enableSearch
                ? 'bg-blue-950/80 border-blue-500 text-blue-300'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <Globe className="w-3 h-3 inline mr-1" />
            SEARCH: {enableSearch ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => setDeepThinking(!deepThinking)}
            className={`px-2.5 py-1 rounded border ${
              deepThinking
                ? 'bg-purple-950/80 border-purple-500 text-purple-300'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <Brain className="w-3 h-3 inline mr-1" />
            DEEP THINKING: {deepThinking ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Centerpiece: Real-Time Holographic Acoustic Waveform */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-6 rounded-2xl bg-black/90 border-2 border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.2)] my-2">
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          className="w-full max-w-md h-[260px] object-contain"
        />

        {/* Live speech transcription badge */}
        <div className="mt-4 w-full max-w-xl text-center space-y-2">
          {interimText && (
            <div className="text-cyan-400 text-sm font-tech animate-pulse">
              Hearing: "{interimText}"
            </div>
          )}
          {transcript && (
            <div className="text-xs font-tech text-slate-400">
              LAST COMMAND: <span className="text-cyan-200 font-semibold">"{transcript}"</span>
            </div>
          )}
          {pttEnabled && (
            <div className="text-xs font-tech text-purple-300 animate-pulse">
              [HOLD SPACEBAR OR ON-SCREEN BUTTON TO TALK]
            </div>
          )}
        </div>
      </div>

      {/* Live AI Spoken Response Card */}
      <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-2">
        <div className="flex items-center justify-between text-xs font-tech text-cyan-400 border-b border-slate-800 pb-2">
          <span className="flex items-center gap-1.5 font-orbitron font-bold">
            <Sparkles className="w-4 h-4 text-amber-400" />
            {currentPersona} RESPONSE FEED
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => speakPersona(lastResponse, currentPersona)}
              className="hover:text-cyan-200 transition-colors flex items-center gap-1"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>REPLAY AUDIO</span>
            </button>
            <button
              onClick={handleInterrupt}
              className="text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              <Square className="w-3 h-3" />
              <span>STOP</span>
            </button>
          </div>
        </div>

        <p className="text-sm text-cyan-100 font-rajdhani leading-relaxed whitespace-pre-wrap">
          {lastResponse}
        </p>

        {/* Executed Tools Feedback (system_status, save_memory, undo, etc.) */}
        {executedTools.length > 0 && (
          <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-1.5 text-xs font-tech">
            {executedTools.map((t, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-600 text-emerald-300"
              >
                EXECUTED FUNCTION: {t.name}
              </span>
            ))}
          </div>
        )}

        {/* Real-time Google Search Grounding sources if available */}
        {webSources.length > 0 && (
          <div className="mt-3 pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2 text-[11px] font-tech text-slate-400">
            <span className="text-blue-400 flex items-center gap-1 font-bold">
              <Globe className="w-3 h-3" /> VERIFIED SOURCES:
            </span>
            {webSources.slice(0, 3).map((s, idx) => (
              <a
                key={idx}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="px-2 py-0.5 rounded bg-blue-950/60 hover:bg-blue-900 border border-blue-800 text-blue-300 flex items-center gap-1"
              >
                <span>{s.title}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Suggested Voice Commands Cheatsheet */}
      <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800">
        <span className="text-[11px] font-tech text-slate-400 font-bold block mb-1.5">
          VOICE COMMANDS YOU CAN SPEAK ALOUD:
        </span>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs font-tech text-slate-300">
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
            <span className="text-cyan-400 font-bold">"Hey Jarvis, launch game"</span>
            <div className="text-[10px] text-slate-400">Opens Game Forge arcade sandbox</div>
          </div>
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
            <span className="text-red-400 font-bold">"EDITH, scan perimeter"</span>
            <div className="text-[10px] text-slate-400">Triggers global satellite defense scan</div>
          </div>
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
            <span className="text-cyan-400 font-bold">"Jarvis, system status"</span>
            <div className="text-[10px] text-slate-400">Reads out real CPU/RAM hardware metrics</div>
          </div>
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
            <span className="text-amber-400 font-bold">"Jarvis, morning briefing"</span>
            <div className="text-[10px] text-slate-400">Speaks today's date, time &amp; news</div>
          </div>
        </div>
      </div>

      {/* System Memory & Diagnostics Modal */}
      <SystemMemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
      />
    </div>
  );
};
