import React, { useState, useRef } from 'react';
import {
  Eye,
  Camera,
  Upload,
  Sparkles,
  Shield,
  Crosshair,
  RefreshCw,
  Scan,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { playConfirmChime, playJarvisBeep, playTacticalAlert, speakPersona } from '../utils/audioSynthesizer';

export const VisionScannerMode: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>(
    'Sensors ready. Upload an engineering diagram, blueprint, photo, or activate camera feed for J.A.R.V.I.S. multimodal ocular inspection.'
  );
  const [isWebcamActive, setIsWebcamActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const presetSchematics = [
    {
      title: 'Arc Reactor Core Mk 85 Blueprint',
      desc: 'Palladium ring core with electromagnetic coil confinement vectors.',
      url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23020617"/><circle cx="200" cy="150" r="90" stroke="%2306b6d4" stroke-width="4" fill="none"/><circle cx="200" cy="150" r="45" stroke="%2338bdf8" stroke-width="6" fill="%23082f49"/><polygon points="200,90 250,180 150,180" stroke="%23ef4444" stroke-width="3" fill="none"/><text x="140" y="270" fill="%2338bdf8" font-family="monospace" font-size="14">STARK ARC BLUEPRINT</text></svg>',
    },
    {
      title: 'E.D.I.T.H. Orbital Drone Circuit',
      desc: 'Multispectral targeting optics and repulsor stabilizer circuit layout.',
      url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%230f172a"/><circle cx="200" cy="150" r="80" stroke="%23ef4444" stroke-width="3" fill="none"/><line x1="120" y1="150" x2="280" y2="150" stroke="%23ef4444" stroke-width="2"/><line x1="200" y1="70" x2="200" y2="230" stroke="%23ef4444" stroke-width="2"/><rect x="180" y="130" width="40" height="40" stroke="%23f59e0b" stroke-width="3" fill="%23450a0a"/><text x="125" y="270" fill="%23ef4444" font-family="monospace" font-size="14">EDITH DRONE OPTICS</text></svg>',
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSelectedImage(base64);
      analyzeImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const startWebcam = async () => {
    setIsWebcamActive(true);
    playJarvisBeep();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e: any) {
      alert('Camera access denied or unavailable: ' + e.message);
      setIsWebcamActive(false);
    }
  };

  const captureWebcamFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg');
    setSelectedImage(dataUrl);

    // Stop webcam tracks
    const stream = videoRef.current.srcObject as MediaStream;
    stream?.getTracks().forEach((t) => t.stop());
    setIsWebcamActive(false);

    analyzeImage(dataUrl);
  };

  const analyzeImage = async (base64Data: string) => {
    setIsScanning(true);
    playTacticalAlert();
    speakPersona('Initiating multimodal ocular scan. Processing visual telemetry with Gemini neural core.', 'JARVIS');

    try {
      const res = await fetch('/api/jarvis/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          prompt: 'Identify objects, architectural design, component flaws, and suggest tactical optimizations.',
        }),
      });

      const data = await res.json();
      const output = data.analysis || 'Visual scan complete. Nominal structural integrity detected.';
      setAnalysisResult(output);
      playConfirmChime();
      speakPersona('Visual analysis complete, Sir. Insights displayed on your HUD.', 'JARVIS');
    } catch (e: any) {
      setAnalysisResult('Scan failure: ' + e.message);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto font-rajdhani">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-cyan-500/30 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400">
            <Eye className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="font-orbitron font-bold text-lg text-cyan-200 tracking-wider">
              MULTIMODAL OCULAR SENSOR &amp; VISION SCANNER
            </h2>
            <p className="text-xs font-tech text-cyan-400/80">
              REAL-TIME COMPUTER VISION, OBJECT IDENTIFICATION &amp; BLUEPRINT AUDITING
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-tech text-xs transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>UPLOAD IMAGE</span>
          </button>

          {!isWebcamActive ? (
            <button
              onClick={startWebcam}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-950 hover:bg-blue-900 border border-blue-500/40 text-blue-300 font-tech text-xs transition-colors"
            >
              <Camera className="w-4 h-4" />
              <span>LIVE WEBCAM</span>
            </button>
          ) : (
            <button
              onClick={captureWebcamFrame}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-tech text-xs transition-colors animate-pulse"
            >
              <Scan className="w-4 h-4" />
              <span>CAPTURE &amp; SCAN</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Visual Frame + Analysis Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-4">
        {/* Left Side: Optical Viewport */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950 border-2 border-cyan-500/30 shadow-[0_0_35px_rgba(6,182,212,0.15)] relative overflow-hidden min-h-[380px]">
          {/* Holographic targeting reticle overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
            <Crosshair className="w-32 h-32 text-cyan-400" />
          </div>

          {isWebcamActive ? (
            <div className="relative w-full h-full flex flex-col items-center">
              <video
                ref={videoRef}
                className="w-full max-h-[340px] rounded-xl border border-cyan-400/50 object-cover"
                autoPlay
                playsInline
                muted
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-red-600/80 text-white text-[10px] font-tech animate-pulse">
                LIVE OPTICAL FEED
              </div>
            </div>
          ) : selectedImage ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={selectedImage}
                alt="Scan target"
                className="max-h-[340px] rounded-xl border border-cyan-500/50 object-contain shadow-inner"
              />
              {isScanning && (
                <div className="absolute inset-0 bg-cyan-500/15 animate-pulse flex items-center justify-center">
                  <div className="h-1 w-full bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-[bounce_1.5s_infinite]" />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-3 p-6">
              <Eye className="w-12 h-12 text-cyan-500/40 mx-auto" />
              <p className="text-xs text-slate-400 font-tech">
                NO OPTICAL TARGET SELECTED. CHOOSE A PRESET BELOW OR UPLOAD A PHOTO.
              </p>
            </div>
          )}
        </div>

        {/* Right Side: Gemini Multimodal Tactical Report */}
        <div className="lg:col-span-6 flex flex-col bg-slate-900/90 rounded-2xl border border-cyan-500/30 p-5 shadow-[0_0_25px_rgba(6,182,212,0.1)]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-tech text-cyan-400">
            <span className="flex items-center gap-1.5 font-bold">
              <Sparkles className="w-4 h-4 text-amber-400" />
              OCULAR TELEMETRY REPORT
            </span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              GEMINI MULTIMODAL ACTIVE
            </span>
          </div>

          <div className="flex-1 my-3 overflow-y-auto font-sans text-xs md:text-sm text-cyan-100 leading-relaxed whitespace-pre-wrap">
            {analysisResult}
          </div>

          {/* Preset Stark Schematics */}
          <div className="pt-3 border-t border-slate-800">
            <span className="text-[11px] font-tech text-slate-400 block mb-2 font-bold">
              PRESET STARK SCHEMATICS (TAP TO AUDIT):
            </span>
            <div className="grid grid-cols-2 gap-2">
              {presetSchematics.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedImage(s.url);
                    analyzeImage(s.url);
                  }}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 text-left transition-colors"
                >
                  <div className="font-orbitron font-semibold text-xs text-cyan-300">
                    {s.title}
                  </div>
                  <div className="text-[10px] text-slate-400 font-tech mt-1 line-clamp-1">
                    {s.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
