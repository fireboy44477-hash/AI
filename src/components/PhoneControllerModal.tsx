import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Smartphone, QrCode, Copy, Check, ExternalLink, X, ShieldAlert, Wifi, Radio } from 'lucide-react';
import { playConfirmChime, playJarvisBeep } from '../utils/audioSynthesizer';

interface PhoneControllerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  connectedCount: number;
}

export const PhoneControllerModal: React.FC<PhoneControllerModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  connectedCount,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const controllerUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?session=${sessionId}&mode=controller`
    : '';

  useEffect(() => {
    if (isOpen && controllerUrl) {
      QRCode.toDataURL(
        controllerUrl,
        {
          width: 280,
          margin: 2,
          color: {
            dark: '#06b6d4',
            light: '#030712',
          },
        },
        (err, url) => {
          if (!err && url) {
            setQrDataUrl(url);
          }
        }
      );
      playJarvisBeep();
    }
  }, [isOpen, controllerUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(controllerUrl);
    setCopied(true);
    playConfirmChime();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenPreview = () => {
    playConfirmChime();
    window.open(controllerUrl, '_blank', 'width=420,height=780');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-950 border border-cyan-500/50 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.3)] p-6 overflow-hidden">
        {/* Holographic background grid lines */}
        <div className="absolute inset-0 bg-stark-grid opacity-30 pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between pb-4 border-b border-cyan-500/30">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/40 text-cyan-400">
              <QrCode className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-orbitron font-bold text-sm tracking-wide text-cyan-200">
                STARK LINK // PHONE PAIRING
              </h3>
              <p className="text-[11px] font-tech text-cyan-500/80">
                E.D.I.T.H. NEURAL HANDHELD PROTOCOL
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playJarvisBeep();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Connection status badge */}
        <div className="relative z-10 mt-4 flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-tech">
            <Radio className={`w-4 h-4 ${connectedCount > 0 ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span className="text-slate-300">PAIRED DEVICES:</span>
            <span className={`font-bold ${connectedCount > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {connectedCount > 0 ? `${connectedCount} CONTROLLER ACTIVE` : 'WAITING FOR SCAN'}
            </span>
          </div>
          <span className="text-[10px] font-tech text-cyan-400/80 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
            ID: {sessionId.slice(0, 8)}
          </span>
        </div>

        {/* QR Code Presentation */}
        <div className="relative z-10 my-4 flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 shadow-inner">
          <div className="relative p-2 rounded-lg bg-black border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Stark Link QR Code"
                className="w-56 h-56 rounded object-contain"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-cyan-400 font-tech">
                Generating Neural QR...
              </div>
            )}
            {/* Animated scanning laser line */}
            <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#22d3ee] animate-[bounce_2.5s_infinite]" />
          </div>

          <p className="mt-3 text-center text-xs font-rajdhani text-cyan-200">
            Point your mobile camera at this QR code to take remote control of J.A.R.V.I.S., pilot arcade games, and trigger E.D.I.T.H. protocols.
          </p>
        </div>

        {/* Action Controls */}
        <div className="relative z-10 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-tech text-xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'LINK COPIED' : 'COPY CONTROLLER URL'}
            </button>

            <button
              onClick={handleOpenPreview}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-500/40 text-blue-300 font-tech text-xs transition-colors"
              title="Test controller on this computer in a simulated phone window"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              TEST ON DESKTOP
            </button>
          </div>

          <div className="px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 font-rajdhani leading-relaxed">
            <span className="text-cyan-400 font-bold">Supported Features:</span> Real-time D-Pad game pilot, Voice Command streaming from phone mic, E.D.I.T.H. drone strike triggers, and Arc Reactor overclocking.
          </div>
        </div>
      </div>
    </div>
  );
};
