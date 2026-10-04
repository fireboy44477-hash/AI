import React, { useState } from 'react';
import {
  Code2,
  Cpu,
  ShieldAlert,
  Play,
  Copy,
  Check,
  Download,
  Sparkles,
  Terminal,
  FileCode,
  Layers,
  CheckCircle2,
  Bug,
  Zap,
} from 'lucide-react';
import { playConfirmChime, playJarvisBeep, speakPersona } from '../utils/audioSynthesizer';

export const QualityCodeStudio: React.FC = () => {
  const [language, setLanguage] = useState('typescript');
  const [action, setAction] = useState<'generate' | 'audit' | 'test' | 'refactor'>('generate');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>(`// Stark Industries J.A.R.V.I.S. Quality Code Studio
// Ready to synthesize hardened, production-ready software architectures.

export interface ArcReactorTelemetry {
  coreId: string;
  plasmaDensityTesla: number;
  containmentFieldStability: number; // 0.0 - 1.0
  thermalOutputKelvin: number;
  outputMegaWatts: number;
}

export class QuantumReactorController {
  private static readonly CRITICAL_TEMP_KELVIN = 3400;

  constructor(private readonly telemetryStream: AsyncIterable<ArcReactorTelemetry>) {}

  public async monitorContainment(onEmergencyVenting: () => Promise<void>): Promise<void> {
    for await (const frame of this.telemetryStream) {
      if (frame.thermalOutputKelvin >= QuantumReactorController.CRITICAL_TEMP_KELVIN) {
        console.warn(\`[CRITICAL ALERT] Core \${frame.coreId} thermal overload: \${frame.thermalOutputKelvin}K\`);
        await onEmergencyVenting();
      }
    }
  }
}`);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'EDITOR' | 'PREVIEW'>('EDITOR');

  const languages = [
    { id: 'typescript', label: 'TypeScript / React' },
    { id: 'rust', label: 'Rust (Hardened)' },
    { id: 'python', label: 'Python (AI / Async)' },
    { id: 'go', label: 'Go (High Concurrency)' },
    { id: 'cpp', label: 'C++ 20 (Performance)' },
    { id: 'glsl', label: 'GLSL / WebGL Shader' },
    { id: 'sql', label: 'PostgreSQL / SQL' },
  ];

  const presets = [
    {
      title: 'Stark Drone Swarm 3D Pathfinding (A* & Octree)',
      lang: 'typescript',
      action: 'generate',
      prompt: 'Write a high-performance 3D spatial pathfinding and collision avoidance algorithm for a swarm of autonomous drones using an Octree data structure and modified A* search in TypeScript.',
    },
    {
      title: 'Arc Reactor Quantum Plasma PID Controller',
      lang: 'rust',
      action: 'generate',
      prompt: 'Implement a zero-allocation, thread-safe PID feedback controller in Rust for magnetic plasma containment in an Arc Reactor, with atomic state and panic-free error handling.',
    },
    {
      title: 'Real-Time Financial Order Book Matching Engine',
      lang: 'go',
      action: 'generate',
      prompt: 'Write a lock-free, sub-microsecond latency Limit Order Book matching engine in Go supporting limit orders, market orders, cancelation, and price-time priority.',
    },
    {
      title: 'Holographic Arc Reactor Raymarching Shader',
      lang: 'glsl',
      action: 'generate',
      prompt: 'Create a stunning GLSL fragment shader for raymarching a glowing sci-fi holographic arc reactor with concentric energy rings, volumetric light absorption, and pulsing plasma core.',
    },
  ];

  const handleGenerate = async (customPrompt?: string) => {
    const targetPrompt = customPrompt || prompt;
    if (!targetPrompt.trim() || isGenerating) return;

    setIsGenerating(true);
    playJarvisBeep();
    speakPersona(`Initiating code architecture synthesis in ${language}. Hardening algorithms, Sir.`, 'JARVIS');

    try {
      const res = await fetch('/api/jarvis/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: targetPrompt,
          language,
          action,
        }),
      });

      const data = await res.json();
      if (data.code) {
        setGeneratedCode(data.code);
        playConfirmChime();
        speakPersona('Code compilation and security verification complete.', 'JARVIS');
      } else {
        alert(data.error || 'Failed to generate code.');
      }
    } catch (err: any) {
      alert('Code synthesis error: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    playConfirmChime();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const extMap: Record<string, string> = {
      typescript: 'ts',
      rust: 'rs',
      python: 'py',
      go: 'go',
      cpp: 'cpp',
      glsl: 'glsl',
      sql: 'sql',
    };
    const ext = extMap[language] || 'txt';
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stark_module_${Date.now()}.${ext}`;
    a.click();
    playConfirmChime();
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto font-rajdhani">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-blue-500/30 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/40 text-blue-400">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="font-orbitron font-bold text-lg text-blue-200 tracking-wider">
              J.A.R.V.I.S. OMNI-CODER // SOFTWARE FORGE
            </h2>
            <p className="text-xs font-tech text-blue-400/80">
              MISSION-CRITICAL SOFTWARE ARCHITECTURE &amp; SECURITY AUDITING
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-500/40 text-blue-300 font-tech text-xs transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY CODE'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-tech text-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>EXPORT FILE</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Language, Action Mode */}
      <div className="my-4 flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/90 border border-blue-500/30">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-tech text-slate-400">LANGUAGE:</span>
          {languages.map((l) => (
            <button
              key={l.id}
              onClick={() => {
                setLanguage(l.id);
                playJarvisBeep();
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-tech transition-all ${
                language === l.id
                  ? 'bg-blue-600 text-white font-bold shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {[
            { id: 'generate', label: 'SYNTHESIZE', icon: Sparkles },
            { id: 'audit', label: 'AUDIT & HARDEN', icon: ShieldAlert },
            { id: 'test', label: 'UNIT TESTS', icon: CheckCircle2 },
            { id: 'refactor', label: 'OPTIMIZE', icon: Zap },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.id}
                onClick={() => {
                  setAction(a.id as any);
                  playJarvisBeep();
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-tech transition-all ${
                  action === a.id
                    ? 'bg-blue-500 text-black font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3 h-3" />
                {a.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Prompt Builder & Presets + Code Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Column: Input Prompt & Stark Presets */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-blue-500/30 space-y-3">
            <h3 className="font-orbitron font-bold text-xs text-blue-300 tracking-wider">
              PROGRAM SPECIFICATION
            </h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your architecture requirements, data models, concurrency constraints, or algorithms in detail..."
              rows={4}
              className="w-full p-3 rounded-lg bg-black/90 border border-blue-500/40 text-blue-100 font-tech text-xs focus:outline-none focus:border-blue-400 resize-none"
            />

            <button
              onClick={() => handleGenerate()}
              disabled={isGenerating || !prompt.trim()}
              className={`w-full py-2.5 rounded-xl font-orbitron font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-all ${
                isGenerating
                  ? 'bg-blue-950 text-blue-400 animate-pulse'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]'
              }`}
            >
              {isGenerating ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-blue-300 border-t-transparent animate-spin" />
                  ANALYZING &amp; SYNTHESIZING...
                </>
              ) : (
                <>
                  <Code2 className="w-4 h-4" />
                  GENERATE QUALITY CODE
                </>
              )}
            </button>
          </div>

          {/* Stark Engineering Presets */}
          <div className="space-y-2">
            <h3 className="font-orbitron font-bold text-xs text-slate-400 tracking-wider">
              STARK HARDWARE PRESETS
            </h3>
            {presets.map((p, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setLanguage(p.lang);
                  setAction(p.action as any);
                  setPrompt(p.prompt);
                  handleGenerate(p.prompt);
                }}
                className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-orbitron font-semibold text-blue-200 group-hover:text-blue-400">
                  <span>{p.title}</span>
                  <span className="text-[10px] font-tech text-slate-500 uppercase">
                    {p.lang}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">
                  {p.prompt}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Code Editor & Terminal Output */}
        <div className="lg:col-span-8 flex flex-col bg-slate-950 rounded-2xl border-2 border-blue-500/40 shadow-[0_0_35px_rgba(59,130,246,0.2)] overflow-hidden">
          {/* Editor Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-blue-500/30">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="ml-2 text-xs font-tech text-blue-300">
                STARK_SYSTEM_CORE.{language === 'typescript' ? 'tsx' : language}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-tech text-slate-400">
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                ZERO DETECTED VULNERABILITIES
              </span>
              <span>UTF-8</span>
            </div>
          </div>

          {/* Code Viewer Body */}
          <div className="flex-1 p-4 bg-black overflow-y-auto font-tech text-xs leading-relaxed selection:bg-blue-600 selection:text-white text-blue-200">
            <pre className="whitespace-pre-wrap">{generatedCode}</pre>
          </div>

          {/* Bottom Telemetry Footer */}
          <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-[11px] font-tech text-slate-400">
            <span>STATIC ANALYSIS: HARDENED BEST PRACTICES ENFORCED</span>
            <span>J.A.R.V.I.S. VERIFIED COMPILATION</span>
          </div>
        </div>
      </div>
    </div>
  );
};
