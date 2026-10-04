import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Mic,
  MicOff,
  Zap,
  Shield,
  Gamepad2,
  Crosshair,
  Volume2,
  VolumeX,
  Radio,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Flame,
  RotateCcw,
  Sparkles,
  Eye,
} from 'lucide-react';
import { ControllerCommand, SystemMode } from '../types';
import { playJarvisBeep, playLaserShot, playTacticalAlert, playConfirmChime } from '../utils/audioSynthesizer';

interface MobileControllerViewProps {
  sessionId: string;
}

export const MobileControllerView: React.FC<MobileControllerViewProps> = ({ sessionId }) => {
  const [connected, setConnected] = useState(false);
  const [hostStatus, setHostStatus] = useState<{
    mode: SystemMode;
    arcCore: number;
    threatLevel: string;
    gameScore?: number;
  }>({
    mode: 'JARVIS',
    arcCore: 100,
    threatLevel: 'NOMINAL',
    gameScore: 0,
  });

  const [isListening, setIsListening] = useState(false);
  const [lastSpeech, setLastSpeech] = useState('');
  const [activeButton, setActiveButton] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Connection via WebSocket and BroadcastChannel
  useEffect(() => {
    // 1. BroadcastChannel fallback for same-device/browser testing
    try {
      const bc = new BroadcastChannel(`stark_session_${sessionId}`);
      broadcastRef.current = bc;
      bc.onmessage = (event) => {
        if (event.data?.type === 'STATUS_UPDATE') {
          setHostStatus(event.data.payload);
        }
      };
      setConnected(true);
    } catch (e) {
      console.log('BroadcastChannel not supported:', e);
    }

    // 2. WebSocket for real phone-to-computer pairing across network
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(
        JSON.stringify({
          type: 'REGISTER',
          role: 'controller',
          sessionId,
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'STATUS_UPDATE') {
          setHostStatus((prev) => ({ ...prev, ...msg.payload }));
        }
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };

    ws.onclose = () => {
      setConnected(false);
    };

    // Speech recognition setup
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setLastSpeech(transcript);
        setIsListening(false);
        sendCommand({
          type: 'VOICE_COMMAND',
          voiceText: transcript,
          timestamp: Date.now(),
        });
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }

    return () => {
      ws.close();
      broadcastRef.current?.close();
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, [sessionId]);

  // Send command to host
  const sendCommand = (cmd: ControllerCommand) => {
    // Haptic feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(35);
    }

    // Send via WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'CONTROLLER_COMMAND',
          sessionId,
          payload: cmd,
        })
      );
    }

    // Send via BroadcastChannel fallback
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({
        type: 'CONTROLLER_COMMAND',
        payload: cmd,
      });
    }

    // Send via REST fallback
    fetch('/api/session/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, command: cmd }),
    }).catch(() => {});
  };

  const handleKeyTouch = (key: string, isDown: boolean) => {
    if (isDown) {
      playJarvisBeep();
      setActiveButton(key);
      sendCommand({ type: 'KEY_DOWN', key, timestamp: Date.now() });
    } else {
      setActiveButton(null);
      sendCommand({ type: 'KEY_UP', key, timestamp: Date.now() });
    }
  };

  const handleAction = (action: 'FIRE' | 'BOOST' | 'SPECIAL' | 'RESTART') => {
    if (action === 'FIRE') playLaserShot();
    else if (action === 'SPECIAL') playTacticalAlert();
    else playConfirmChime();

    sendCommand({ type: 'ACTION', action, timestamp: Date.now() });
  };

  const handleProtocol = (protocol: string) => {
    playTacticalAlert();
    sendCommand({ type: 'PROTOCOL', protocol, timestamp: Date.now() });
  };

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition not supported in this browser. Please use keyboard or action buttons.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setLastSpeech('');
      recognitionRef.current.start();
      setIsListening(true);
      playJarvisBeep();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-cyan-100 flex flex-col justify-between p-4 select-none touch-none overflow-hidden font-rajdhani">
      {/* Mobile Top HUD */}
      <div className="p-3 rounded-xl bg-slate-900/90 border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-400/60 flex items-center justify-center text-cyan-400">
            <Smartphone className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-orbitron font-bold text-cyan-300 tracking-wider">
              STARK LINK // PADD
            </div>
            <div className="text-[10px] font-tech text-cyan-500 flex items-center gap-1">
              <Radio className={`w-3 h-3 ${connected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
              {connected ? 'QUANTUM UPLINK ACTIVE' : 'CONNECTING...'}
            </div>
          </div>
        </div>

        {/* Telemetry pill */}
        <div className="text-right">
          <div className="text-[10px] font-tech text-slate-400">ARC POWER</div>
          <div className="text-sm font-orbitron font-bold text-cyan-400">
            {hostStatus.arcCore}%
          </div>
        </div>
      </div>

      {/* Voice Control Strip */}
      <div className="my-3 p-3 rounded-xl bg-slate-900/60 border border-cyan-500/20 text-center">
        <button
          onClick={toggleMic}
          className={`w-full py-3 px-4 rounded-xl font-orbitron font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-all ${
            isListening
              ? 'bg-red-600 text-white animate-pulse shadow-[0_0_25px_rgba(239,68,68,0.7)]'
              : 'bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-400/50 text-cyan-300'
          }`}
        >
          {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          {isListening ? 'LISTENING... SPEAK NOW' : 'TAP TO TRANSMIT VOICE COMMAND'}
        </button>
        {lastSpeech && (
          <div className="mt-2 text-xs font-tech text-cyan-400/90 truncate">
            TRANSMITTED: "{lastSpeech}"
          </div>
        )}
      </div>

      {/* Game Controller Surface: D-Pad + Action Cluster */}
      <div className="flex-1 flex flex-col md:flex-row items-center justify-around gap-6 my-2">
        {/* Holographic D-PAD */}
        <div className="relative w-44 h-44 flex items-center justify-center bg-slate-900/80 rounded-full border border-cyan-500/30 p-2 shadow-inner">
          {/* UP */}
          <button
            onTouchStart={(e) => { e.preventDefault(); handleKeyTouch('ArrowUp', true); }}
            onTouchEnd={(e) => { e.preventDefault(); handleKeyTouch('ArrowUp', false); }}
            onMouseDown={() => handleKeyTouch('ArrowUp', true)}
            onMouseUp={() => handleKeyTouch('ArrowUp', false)}
            className={`absolute top-2 w-12 h-12 rounded-xl border border-cyan-500/50 flex items-center justify-center text-cyan-300 transition-all ${
              activeButton === 'ArrowUp' ? 'bg-cyan-500 text-black scale-95' : 'bg-cyan-950/80'
            }`}
          >
            <ArrowUp className="w-6 h-6" />
          </button>

          {/* DOWN */}
          <button
            onTouchStart={(e) => { e.preventDefault(); handleKeyTouch('ArrowDown', true); }}
            onTouchEnd={(e) => { e.preventDefault(); handleKeyTouch('ArrowDown', false); }}
            onMouseDown={() => handleKeyTouch('ArrowDown', true)}
            onMouseUp={() => handleKeyTouch('ArrowDown', false)}
            className={`absolute bottom-2 w-12 h-12 rounded-xl border border-cyan-500/50 flex items-center justify-center text-cyan-300 transition-all ${
              activeButton === 'ArrowDown' ? 'bg-cyan-500 text-black scale-95' : 'bg-cyan-950/80'
            }`}
          >
            <ArrowDown className="w-6 h-6" />
          </button>

          {/* LEFT */}
          <button
            onTouchStart={(e) => { e.preventDefault(); handleKeyTouch('ArrowLeft', true); }}
            onTouchEnd={(e) => { e.preventDefault(); handleKeyTouch('ArrowLeft', false); }}
            onMouseDown={() => handleKeyTouch('ArrowLeft', true)}
            onMouseUp={() => handleKeyTouch('ArrowLeft', false)}
            className={`absolute left-2 w-12 h-12 rounded-xl border border-cyan-500/50 flex items-center justify-center text-cyan-300 transition-all ${
              activeButton === 'ArrowLeft' ? 'bg-cyan-500 text-black scale-95' : 'bg-cyan-950/80'
            }`}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          {/* RIGHT */}
          <button
            onTouchStart={(e) => { e.preventDefault(); handleKeyTouch('ArrowRight', true); }}
            onTouchEnd={(e) => { e.preventDefault(); handleKeyTouch('ArrowRight', false); }}
            onMouseDown={() => handleKeyTouch('ArrowRight', true)}
            onMouseUp={() => handleKeyTouch('ArrowRight', false)}
            className={`absolute right-2 w-12 h-12 rounded-xl border border-cyan-500/50 flex items-center justify-center text-cyan-300 transition-all ${
              activeButton === 'ArrowRight' ? 'bg-cyan-500 text-black scale-95' : 'bg-cyan-950/80'
            }`}
          >
            <ArrowRight className="w-6 h-6" />
          </button>

          {/* Central Logo */}
          <div className="w-10 h-10 rounded-full border border-cyan-400/40 bg-slate-950 flex items-center justify-center text-[10px] font-orbitron font-bold text-cyan-400">
            J
          </div>
        </div>

        {/* Action Buttons Cluster */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          <button
            onClick={() => handleAction('FIRE')}
            className="py-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 active:scale-95 text-white font-orbitron font-bold text-sm tracking-wider shadow-[0_0_20px_rgba(239,68,68,0.4)] flex flex-col items-center justify-center gap-1 border border-red-400/50"
          >
            <Flame className="w-5 h-5" />
            <span>REPULSOR (FIRE)</span>
          </button>

          <button
            onClick={() => handleAction('BOOST')}
            className="py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 active:scale-95 text-white font-orbitron font-bold text-sm tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.4)] flex flex-col items-center justify-center gap-1 border border-cyan-400/50"
          >
            <Zap className="w-5 h-5" />
            <span>THRUST (BOOST)</span>
          </button>

          <button
            onClick={() => handleAction('SPECIAL')}
            className="py-3.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-800 active:scale-95 text-white font-orbitron font-bold text-xs tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center justify-center gap-1.5 border border-purple-400/40"
          >
            <Sparkles className="w-4 h-4" />
            <span>E.D.I.T.H. EMP</span>
          </button>

          <button
            onClick={() => handleAction('RESTART')}
            className="py-3.5 rounded-xl bg-slate-800 active:scale-95 text-slate-200 font-orbitron font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 border border-slate-600"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART GAME</span>
          </button>
        </div>
      </div>

      {/* Quick Stark Protocols Bar */}
      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
        <div className="text-[10px] font-tech text-slate-400 mb-2 tracking-wider">
          STARK PROTOCOLS REMOTE EXECUTION:
        </div>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => handleProtocol('PROTOCOL_VOICE_MODE')}
            className="py-2 px-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-tech text-[10px] truncate flex items-center justify-center gap-1"
          >
            <Mic className="w-3 h-3" />
            VOICE HUD
          </button>

          <button
            onClick={() => handleProtocol('PROTOCOL_VISION_SCAN')}
            className="py-2 px-1 rounded-lg bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 text-amber-300 font-tech text-[10px] truncate flex items-center justify-center gap-1"
          >
            <Eye className="w-3 h-3" />
            VISION
          </button>

          <button
            onClick={() => handleProtocol('PROTOCOL_EDITH_SCAN')}
            className="py-2 px-1 rounded-lg bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-300 font-tech text-[10px] truncate flex items-center justify-center gap-1"
          >
            <Shield className="w-3 h-3" />
            E.D.I.T.H.
          </button>

          <button
            onClick={() => handleProtocol('PROTOCOL_OVERCLOCK')}
            className="py-2 px-1 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-tech text-[10px] truncate flex items-center justify-center gap-1"
          >
            <Zap className="w-3 h-3" />
            OVERCLOCK
          </button>
        </div>
      </div>
    </div>
  );
};
