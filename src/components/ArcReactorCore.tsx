import React, { useState } from 'react';
import { SystemMode } from '../types';
import { playJarvisBeep, playReactorHum } from '../utils/audioSynthesizer';
import { Zap, Shield, Cpu, Activity } from 'lucide-react';

interface ArcReactorCoreProps {
  mode: SystemMode;
  isProcessing: boolean;
  powerLevel: number;
  onOverclock: () => void;
}

export const ArcReactorCore: React.FC<ArcReactorCoreProps> = ({
  mode,
  isProcessing,
  powerLevel,
  onOverclock,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getThemeColors = () => {
    switch (mode) {
      case 'EDITH':
        return {
          glow: 'rgba(239, 68, 68, 0.7)',
          border: 'border-red-500/70',
          ring: 'border-red-400',
          text: 'text-red-400',
          accent: 'bg-red-500',
          name: 'E.D.I.T.H. TACTICAL CORE',
          protocol: 'DEFENSE GRID ACTIVE',
        };
      case 'FORGE':
        return {
          glow: 'rgba(168, 85, 247, 0.7)',
          border: 'border-purple-500/70',
          ring: 'border-purple-400',
          text: 'text-purple-400',
          accent: 'bg-purple-500',
          name: 'GAME FORGE ENGINE',
          protocol: 'REAL-TIME CANVAS SANDBOX',
        };
      case 'CODER':
        return {
          glow: 'rgba(59, 130, 246, 0.7)',
          border: 'border-blue-500/70',
          ring: 'border-blue-400',
          text: 'text-blue-400',
          accent: 'bg-blue-500',
          name: 'OMNI-CODER ARCHITECT',
          protocol: 'HARDENED SYNTHESIS',
        };
      default:
        return {
          glow: 'rgba(6, 182, 212, 0.7)',
          border: 'border-cyan-500/70',
          ring: 'border-cyan-400',
          text: 'text-cyan-400',
          accent: 'bg-cyan-500',
          name: 'MARK 85 NEURAL CORE',
          protocol: 'J.A.R.V.I.S. ONLINE',
        };
    }
  };

  const theme = getThemeColors();

  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      {/* Outer Holographic HUD Ring */}
      <div
        className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center cursor-pointer select-none group"
        onClick={() => {
          playReactorHum();
          onOverclock();
        }}
        onMouseEnter={() => {
          setIsHovered(true);
          playJarvisBeep();
        }}
        onMouseLeave={() => setIsHovered(false)}
        title="Click to Overclock Core"
      >
        {/* Ambient Glow */}
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-40 transition-all duration-700 pointer-events-none"
          style={{
            backgroundColor: theme.glow,
            transform: isHovered || isProcessing ? 'scale(1.25)' : 'scale(1)',
          }}
        />

        {/* Outer segmented ring */}
        <div
          className={`absolute inset-0 rounded-full border-2 border-dashed ${theme.ring} opacity-40 animate-[spin_24s_linear_infinite]`}
        />

        {/* Counter-rotating segmented ring */}
        <div
          className={`absolute inset-2 rounded-full border border-dotted ${theme.border} opacity-50 animate-[spin_16s_linear_infinite_reverse]`}
        />

        {/* Static Tick marks */}
        <div className="absolute inset-4 rounded-full border border-slate-700/50 flex items-center justify-center">
          <div className="absolute -top-1 w-2 h-2 bg-cyan-400 rounded-full opacity-60" />
          <div className="absolute -bottom-1 w-2 h-2 bg-cyan-400 rounded-full opacity-60" />
          <div className="absolute -left-1 w-2 h-2 bg-cyan-400 rounded-full opacity-60" />
          <div className="absolute -right-1 w-2 h-2 bg-cyan-400 rounded-full opacity-60" />
        </div>

        {/* Inner Arc Reactor Coil segments */}
        <div
          className={`absolute inset-8 rounded-full border-2 ${theme.border} bg-slate-950/80 backdrop-blur-md flex items-center justify-center shadow-inner overflow-hidden ${
            mode === 'EDITH' ? 'edith-pulse' : 'arc-pulse'
          }`}
        >
          {/* Reactor internal coils (10 segments) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                style={{ transform: `rotate(${i * 22.5}deg)` }}
              />
            ))}
          </div>

          {/* Central Vibranium / Palladium Core Node */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <div
              className={`w-14 h-14 md:w-16 md:h-16 rounded-full border-2 ${theme.border} ${theme.accent}/20 flex items-center justify-center transition-transform duration-300 ${
                isHovered || isProcessing ? 'scale-110' : 'scale-100'
              }`}
            >
              {mode === 'EDITH' ? (
                <Shield className="w-7 h-7 text-red-400 animate-pulse" />
              ) : mode === 'FORGE' ? (
                <Activity className="w-7 h-7 text-purple-400 animate-pulse" />
              ) : mode === 'CODER' ? (
                <Cpu className="w-7 h-7 text-blue-400 animate-pulse" />
              ) : (
                <Zap className="w-7 h-7 text-cyan-300 animate-pulse" />
              )}
            </div>

            <span className={`text-[10px] font-orbitron font-bold mt-1 tracking-widest ${theme.text}`}>
              {powerLevel}%
            </span>
          </div>
        </div>

        {/* Frequency visualizer spikes */}
        <div className="absolute -inset-2 flex items-center justify-center pointer-events-none opacity-40">
          {[...Array(16)].map((_, i) => {
            const h = isProcessing ? 6 + (i % 5) * 4 : 3 + (i % 3) * 2;
            return (
              <div
                key={i}
                className="absolute origin-bottom w-1 rounded-full transition-all duration-150"
                style={{
                  height: `${h}px`,
                  backgroundColor: mode === 'EDITH' ? '#ef4444' : '#06b6d4',
                  transform: `rotate(${i * 22.5}deg) translateY(-108px)`,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Telemetry Label */}
      <div className="mt-3 text-center">
        <div className={`font-orbitron font-bold text-xs tracking-wider ${theme.text}`}>
          {theme.name}
        </div>
        <div className="font-tech text-[11px] text-slate-400 tracking-wider">
          STATUS: <span className="text-emerald-400 font-semibold">{theme.protocol}</span>
        </div>
        <div className="text-[10px] text-slate-500 font-tech mt-0.5">
          [CLICK TO BOOST REPULSOR CORE]
        </div>
      </div>
    </div>
  );
};
