import React, { useState, useEffect } from 'react';
import { SystemMode } from '../types';
import {
  Zap,
  Shield,
  Gamepad2,
  Cpu,
  Layers,
  Smartphone,
  Volume2,
  VolumeX,
  Radio,
  Clock,
  Activity,
  Terminal,
  Mic,
  Eye,
} from 'lucide-react';
import { playJarvisBeep, playConfirmChime, setSoundMuted, isSoundMuted } from '../utils/audioSynthesizer';

interface TopNavbarProps {
  currentMode: SystemMode;
  onSelectMode: (mode: SystemMode) => void;
  arcPower: number;
  threatLevel: string;
  connectedControllers: number;
  onOpenPhoneModal: () => void;
  pluginCount: number;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentMode,
  onSelectMode,
  arcPower,
  threatLevel,
  connectedControllers,
  onOpenPhoneModal,
  pluginCount,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [muted, setMuted] = useState(isSoundMuted());

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toTimeString().split(' ')[0] + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    setSoundMuted(next);
  };

  const navItems: { mode: SystemMode; label: string; icon: any; color: string }[] = [
    { mode: 'VOICE', label: 'VOICE CONTROL', icon: Mic, color: 'text-emerald-400' },
    { mode: 'JARVIS', label: 'J.A.R.V.I.S.', icon: Terminal, color: 'text-cyan-400' },
    { mode: 'VISION', label: 'VISION SCAN', icon: Eye, color: 'text-amber-400' },
    { mode: 'EDITH', label: 'E.D.I.T.H.', icon: Shield, color: 'text-red-400' },
    { mode: 'FORGE', label: 'GAME FORGE', icon: Gamepad2, color: 'text-purple-400' },
    { mode: 'CODER', label: 'OMNI-CODER', icon: Cpu, color: 'text-blue-400' },
    { mode: 'PLUGINS', label: `PLUGINS (${pluginCount})`, icon: Layers, color: 'text-teal-400' },
  ];

  return (
    <header className="w-full bg-slate-950/95 border-b border-cyan-500/30 backdrop-blur-md px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 font-rajdhani select-none relative z-40">
      {/* Brand & Arc Reactor status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-400/60 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <Zap className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="font-orbitron font-bold text-sm tracking-wider text-cyan-100 flex items-center gap-2">
              <span>J.A.R.V.I.S.</span>
              <span className="text-[10px] text-cyan-400/80 font-tech px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-800">
                MARK 85
              </span>
            </div>
            <div className="text-[10px] font-tech text-slate-400">
              STARK INDUSTRIES OS // E.D.I.T.H.
            </div>
          </div>
        </div>

        {/* Vertical divider */}
        <div className="hidden lg:block h-6 w-px bg-slate-800 mx-2" />

        {/* Telemetry pill */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-tech text-slate-300">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>CORE:</span>
            <span className="font-bold text-cyan-400">{arcPower}%</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">{timeStr}</span>
          </div>
        </div>
      </div>

      {/* Navigation Modes Bar */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentMode === item.mode;
          return (
            <button
              key={item.mode}
              onClick={() => {
                playJarvisBeep();
                onSelectMode(item.mode);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-orbitron font-semibold tracking-wider transition-all ${
                isActive
                  ? item.mode === 'EDITH'
                    ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                    : item.mode === 'FORGE'
                    ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                    : item.mode === 'CODER'
                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                    : item.mode === 'PLUGINS'
                    ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                    : 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right Controls: QR Phone Link & Sound Toggle */}
      <div className="flex items-center gap-2">
        {/* QR Mobile Controller Button */}
        <button
          onClick={() => {
            playConfirmChime();
            onOpenPhoneModal();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-tech text-xs transition-all ${
            connectedControllers > 0
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse'
              : 'bg-cyan-950/80 hover:bg-cyan-900 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
          }`}
          title="Scan QR code on your phone to control games and trigger protocols"
        >
          <Smartphone className="w-4 h-4 text-cyan-400" />
          <span>
            {connectedControllers > 0
              ? `PHONE SYNCED (${connectedControllers})`
              : 'PAIR PHONE (QR)'}
          </span>
        </button>

        {/* Mute Audio Button */}
        <button
          onClick={handleToggleMute}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-400 transition-colors"
          title={muted ? 'Unmute Audio & Voice' : 'Mute Audio & Voice'}
        >
          {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
