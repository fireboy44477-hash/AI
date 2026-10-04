// Futuristic Web Audio API sound synthesis for Stark HUD and Jarvis vocal synthesis
import { StarkPersona } from '../types';

let audioCtx: AudioContext | null = null;
let isMuted = false;
let currentAudioElement: HTMLAudioElement | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setSoundMuted(muted: boolean) {
  isMuted = muted;
  if (muted) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (currentAudioElement) {
      currentAudioElement.pause();
      currentAudioElement = null;
    }
  }
}

export function isSoundMuted() {
  return isMuted;
}

// Crisp Stark UI Blip
export function playJarvisBeep() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.08);

  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.08);
}

// Tactical Warning Radar Alert (EDITH)
export function playTacticalAlert() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(440, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.15);

  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.15);
}

// Multi-tone Stark Confirmation Chord
export function playConfirmChime() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = ctx.currentTime + idx * 0.06;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.08, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.25);
  });
}

// Laser / Repulsor Blast for Games
export function playLaserShot() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(990, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.12);

  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.12);
}

// Arc Reactor Hum / Pulse
export function playReactorHum() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(60, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.3);
  osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.6);

  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.6);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.6);
}

// High-Fidelity Voice Synthesis with Gemini TTS & Web Speech fallback
export async function speakPersona(text: string, persona: StarkPersona = 'JARVIS') {
  if (isMuted || typeof window === 'undefined') return;

  // Clean text
  const cleanedText = text
    .replace(/```[\s\S]*?```/g, 'Code block generated, displayed on your terminal, Sir.')
    .replace(/\[.*?\]/g, '')
    .replace(/[*#_`]/g, '')
    .slice(0, 300);

  // Try Gemini AI High-Fidelity TTS via backend
  try {
    const res = await fetch('/api/jarvis/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanedText, persona }),
    });
    const data = await res.json();
    if (data.audioBase64) {
      if (currentAudioElement) {
        currentAudioElement.pause();
      }
      const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
      currentAudioElement = audio;
      audio.play().catch(() => {
        fallbackWebSpeech(cleanedText, persona);
      });
      return;
    }
  } catch (e) {
    // Silently fall back to browser Web Speech API
  }

  fallbackWebSpeech(cleanedText, persona);
}

function fallbackWebSpeech(text: string, persona: StarkPersona) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();

  if (persona === 'EDITH') {
    const femaleVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.toLowerCase().includes('female') ||
          v.name.toLowerCase().includes('zira') ||
          v.name.toLowerCase().includes('samantha') ||
          v.name.toLowerCase().includes('karen'))
    );
    if (femaleVoice) utterance.voice = femaleVoice;
    utterance.pitch = 1.05;
    utterance.rate = 1.05;
  } else if (persona === 'FRIDAY') {
    const irishVoice = voices.find(
      (v) =>
        v.lang.includes('IE') ||
        (v.lang.startsWith('en') && v.name.toLowerCase().includes('moira'))
    );
    if (irishVoice) utterance.voice = irishVoice;
    utterance.pitch = 1.1;
    utterance.rate = 1.08;
  } else if (persona === 'ULTRON') {
    const deepVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('male'))
    );
    if (deepVoice) utterance.voice = deepVoice;
    utterance.pitch = 0.65;
    utterance.rate = 0.9;
  } else {
    // JARVIS: British male
    const britishVoice = voices.find(
      (v) =>
        v.lang.startsWith('en-GB') ||
        (v.lang.startsWith('en') &&
          (v.name.toLowerCase().includes('george') ||
            v.name.toLowerCase().includes('uk english male') ||
            v.name.toLowerCase().includes('daniel') ||
            v.name.toLowerCase().includes('oliver') ||
            v.name.toLowerCase().includes('british')))
    );
    if (britishVoice) utterance.voice = britishVoice;
    utterance.pitch = 0.95;
    utterance.rate = 0.98;
  }

  window.speechSynthesis.speak(utterance);
}
