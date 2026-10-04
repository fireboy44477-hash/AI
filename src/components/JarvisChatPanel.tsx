import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, SystemMode } from '../types';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  Bot,
  User,
  Shield,
  Gamepad2,
  Cpu,
  Terminal,
  RefreshCw,
} from 'lucide-react';
import { playJarvisBeep, playTacticalAlert, playConfirmChime, speakPersona } from '../utils/audioSynthesizer';

interface JarvisChatPanelProps {
  messages: ChatMessage[];
  mode: SystemMode;
  onSendMessage: (text: string) => void;
  isThinking: boolean;
  onSelectMode: (mode: SystemMode) => void;
}

export const JarvisChatPanel: React.FC<JarvisChatPanelProps> = ({
  messages,
  mode,
  onSendMessage,
  isThinking,
  onSelectMode,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Web Speech Recognition for Jarvis mic input
  useEffect(() => {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
        playJarvisBeep();
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your command.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      playJarvisBeep();
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || isThinking) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const quickPrompts = [
    { label: 'EDITH Scan', text: 'EDITH, execute comprehensive global threat scan.' },
    { label: 'Build Game', text: 'Jarvis, synthesize a new arcade game for the Game Forge.' },
    { label: 'Overclock Core', text: 'Jarvis, boost the Arc Reactor core to maximum output.' },
    { label: 'Quality Code', text: 'Jarvis, architect a hardened zero-trust authorization gateway.' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950/80 border border-cyan-500/30 rounded-2xl shadow-[0_0_35px_rgba(6,182,212,0.15)] overflow-hidden font-rajdhani">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-cyan-500/30">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="font-orbitron font-bold text-xs text-cyan-300 tracking-wider">
            {mode === 'EDITH' ? 'E.D.I.T.H. TACTICAL TERMINAL' : 'J.A.R.V.I.S. QUANTUM NEURAL INTERFACE'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-tech text-cyan-500">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>NEURAL SYNCHRONIZED</span>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${
                  isUser
                    ? 'bg-slate-800 border-slate-700 text-slate-300'
                    : msg.sender === 'edith'
                    ? 'bg-red-950 border-red-500 text-red-400'
                    : 'bg-cyan-950 border-cyan-500 text-cyan-300'
                }`}
              >
                {isUser ? (
                  <User className="w-4 h-4" />
                ) : msg.sender === 'edith' ? (
                  <Shield className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-xl p-3.5 border text-xs md:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-slate-900/90 border-slate-700 text-slate-200'
                    : msg.sender === 'edith'
                    ? 'bg-red-950/40 border-red-500/50 text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                    : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-tech text-slate-400 mb-1 border-b border-white/5 pb-1">
                  <span className="uppercase tracking-wider font-semibold">
                    {msg.sender === 'user' ? 'STARK IDENT' : msg.sender === 'edith' ? 'E.D.I.T.H.' : 'J.A.R.V.I.S.'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span>{msg.timestamp}</span>
                    {!isUser && (
                      <button
                        onClick={() => speakPersona(msg.text, msg.sender === 'edith' ? 'EDITH' : 'JARVIS')}
                        className="hover:text-cyan-400 transition-colors"
                        title="Replay Voice Synthesis"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="whitespace-pre-wrap font-sans text-xs md:text-sm">
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}

        {/* Thinking Indicator */}
        {isThinking && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500 text-cyan-300 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-300 text-xs font-tech flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>J.A.R.V.I.S. COMPUTING NEURAL WEIGHTS &amp; SATELLITE TELEMETRY...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Pills */}
      <div className="px-4 py-1.5 bg-slate-950 flex flex-wrap items-center gap-1.5 border-t border-slate-800">
        <span className="text-[10px] font-tech text-slate-500 mr-1">PROTOCOLS:</span>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => {
              playJarvisBeep();
              onSendMessage(qp.text);
            }}
            className="px-2 py-0.5 rounded bg-slate-900 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-500 text-[11px] font-tech text-slate-300 hover:text-cyan-300 transition-colors"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Input Box Bar */}
      <div className="p-3 bg-slate-900 border-t border-cyan-500/30 flex items-center gap-2">
        {/* Voice Input Mic */}
        <button
          onClick={toggleListening}
          className={`p-2.5 rounded-xl border transition-all ${
            isListening
              ? 'bg-red-600 text-white border-red-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.7)]'
              : 'bg-slate-950 hover:bg-cyan-950/80 border-slate-700 hover:border-cyan-500 text-cyan-400'
          }`}
          title={isListening ? 'Stop Listening' : 'Speak to Jarvis'}
        >
          {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        {/* Text Input */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            mode === 'EDITH'
              ? 'Transmit tactical instruction to E.D.I.T.H...'
              : 'Ask Jarvis: solve math, architect code, build a game, overclock reactor...'
          }
          className="flex-1 py-2 px-3 rounded-xl bg-black/90 border border-cyan-500/40 text-cyan-100 font-tech text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!inputText.trim() || isThinking}
          className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
