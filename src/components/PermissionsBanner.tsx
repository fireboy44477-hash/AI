import React, { useState, useEffect } from 'react';
import { Camera, Mic, ShieldCheck, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { playConfirmChime, playJarvisBeep, speakPersona } from '../utils/audioSynthesizer';

interface PermissionsBannerProps {
  onPermissionsGranted?: (stream: MediaStream) => void;
}

export const PermissionsBanner: React.FC<PermissionsBannerProps> = ({ onPermissionsGranted }) => {
  const [micStatus, setMicStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [camStatus, setCamStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [isRequesting, setIsRequesting] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check permission states if supported by browser
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'microphone' as any })
        .then((res) => {
          setMicStatus(res.state as any);
          res.onchange = () => setMicStatus(res.state as any);
        })
        .catch(() => {});

      navigator.permissions
        .query({ name: 'camera' as any })
        .then((res) => {
          setCamStatus(res.state as any);
          res.onchange = () => setCamStatus(res.state as any);
        })
        .catch(() => {});
    }
  }, []);

  const handleRequestAccess = async () => {
    setIsRequesting(true);
    playJarvisBeep();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      setMicStatus('granted');
      setCamStatus('granted');
      setIsRequesting(false);
      playConfirmChime();
      speakPersona('Biometric authorization confirmed. Camera optics and vocal sensors online, Sir.', 'JARVIS');

      if (onPermissionsGranted) {
        onPermissionsGranted(stream);
      }
    } catch (err: any) {
      console.warn('Combined permission request fallback:', err);
      // Try requesting microphone individually if camera was denied or not attached
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicStatus('granted');
        playConfirmChime();
        speakPersona('Vocal sensor permission granted, Sir.', 'JARVIS');
        if (onPermissionsGranted) onPermissionsGranted(audioStream);
      } catch (audioErr) {
        setMicStatus('denied');
      }

      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setCamStatus('granted');
      } catch (videoErr) {
        setCamStatus('denied');
      }

      setIsRequesting(false);
    }
  };

  if (dismissed || (micStatus === 'granted' && camStatus === 'granted')) {
    return null;
  }

  return (
    <div className="w-full bg-slate-900/95 border-b border-amber-500/40 p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-[0_0_25px_rgba(245,158,11,0.2)] font-rajdhani relative z-30 animate-in slide-in-from-top">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-400">
          <ShieldCheck className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-orbitron font-bold text-xs text-amber-300 tracking-wider">
              BIOMETRIC SENSORS AUTHORIZATION REQUIRED
            </span>
            <span className="text-[10px] font-tech text-amber-500/80 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800">
              FRAME ACCESS
            </span>
          </div>
          <p className="text-xs text-slate-300 font-sans">
            Enable microphone for continuous hands-free voice control and camera for multimodal optical object inspection.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-xs font-tech mr-2">
          <span className={`flex items-center gap-1 ${micStatus === 'granted' ? 'text-emerald-400' : 'text-amber-400'}`}>
            <Mic className="w-3.5 h-3.5" />
            MIC: {micStatus.toUpperCase()}
          </span>
          <span className="text-slate-600">|</span>
          <span className={`flex items-center gap-1 ${camStatus === 'granted' ? 'text-emerald-400' : 'text-amber-400'}`}>
            <Camera className="w-3.5 h-3.5" />
            CAM: {camStatus.toUpperCase()}
          </span>
        </div>

        <button
          onClick={handleRequestAccess}
          disabled={isRequesting}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-orbitron font-bold text-xs shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all flex items-center gap-1.5"
        >
          {isRequesting ? (
            <>
              <span className="w-3 h-3 rounded-full border-2 border-black border-t-transparent animate-spin" />
              AUTHORIZING...
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5" />
              AUTHORIZE CAMERA &amp; VOICE ACCESS
            </>
          )}
        </button>

        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 text-xs text-slate-400 hover:text-white font-tech"
          title="Dismiss"
        >
          DISMISS
        </button>
      </div>
    </div>
  );
};
