import React, { useState, useEffect, useRef } from 'react';
import { DroneTelemetry } from '../types';
import {
  Shield,
  Crosshair,
  Radio,
  Satellite,
  AlertTriangle,
  Flame,
  Target,
  Eye,
  Zap,
  Activity,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { playTacticalAlert, playLaserShot, playConfirmChime, speakPersona } from '../utils/audioSynthesizer';

export const EdithTacticalHud: React.FC<{
  onOpenPhoneModal: () => void;
}> = ({ onOpenPhoneModal }) => {
  const [threatLevel, setThreatLevel] = useState<'NOMINAL' | 'ELEVATED' | 'CRITICAL'>('NOMINAL');
  const [selectedDrone, setSelectedDrone] = useState<string>('ALPHA-1');
  const [strikeInProgress, setStrikeInProgress] = useState(false);
  const [strikeCountdown, setStrikeCountdown] = useState(0);
  const [strikeTarget, setStrikeTarget] = useState<{ lat: number; lng: number } | null>(null);

  const [drones, setDrones] = useState<DroneTelemetry[]>([
    {
      id: 'd-1',
      callsign: 'ALPHA-1 (TACTICAL LEAD)',
      altitudeMeters: 14200,
      batteryPercent: 96,
      status: 'PATROLLING',
      targetDistanceKm: 12.4,
      coordinates: { lat: 34.0522, lng: -118.2437 },
    },
    {
      id: 'd-2',
      callsign: 'BRAVO-2 (EMP DISRUPTOR)',
      altitudeMeters: 18500,
      batteryPercent: 88,
      status: 'STANDBY',
      targetDistanceKm: 8.1,
      coordinates: { lat: 40.7128, lng: -74.006 },
    },
    {
      id: 'd-3',
      callsign: 'CHARLIE-3 (ORBITAL STRIKE)',
      altitudeMeters: 24000,
      batteryPercent: 99,
      status: 'LOCKED_ON',
      targetDistanceKm: 2.3,
      coordinates: { lat: 51.5074, lng: -0.1278 },
    },
    {
      id: 'd-4',
      callsign: 'DELTA-4 (PERIMETER SHIELD)',
      altitudeMeters: 11800,
      batteryPercent: 74,
      status: 'ENGAGING',
      targetDistanceKm: 15.6,
      coordinates: { lat: 35.6762, lng: 139.6503 },
    },
  ]);

  const radarCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Radar sweep animation on canvas
  useEffect(() => {
    const canvas = radarCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;
    let animId: number;

    const targets = [
      { r: 40, theta: 0.8, label: 'T-01' },
      { r: 85, theta: 2.4, label: 'T-02' },
      { r: 120, theta: 4.1, label: 'T-03' },
    ];

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const maxR = cx - 10;

      // Concentric circles
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.lineWidth = 1;
      for (let r = 30; r <= maxR; r += 35) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx, 10);
      ctx.lineTo(cx, canvas.height - 10);
      ctx.moveTo(10, cy);
      ctx.lineTo(canvas.width - 10, cy);
      ctx.stroke();

      // Sweeping beam
      angle += 0.035;
      const sweepX = cx + Math.cos(angle) * maxR;
      const sweepY = cy + Math.sin(angle) * maxR;

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxR, angle - 0.4, angle);
      ctx.lineTo(cx, cy);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.fill();

      // Blip line
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(sweepX, sweepY);
      ctx.stroke();

      // Detected targets
      targets.forEach((t) => {
        const tx = cx + Math.cos(t.theta) * t.r;
        const ty = cy + Math.sin(t.theta) * t.r;
        ctx.fillStyle = '#f87171';
        ctx.beginPath();
        ctx.arc(tx, ty, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#f87171';
        ctx.strokeRect(tx - 6, ty - 6, 12, 12);

        ctx.fillStyle = '#ef4444';
        ctx.font = '10px Share Tech Mono';
        ctx.fillText(t.label, tx + 8, ty - 2);
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleInitiateScan = () => {
    playTacticalAlert();
    setThreatLevel('ELEVATED');
    speakPersona('E.D.I.T.H. orbital satellite array scanning sector. No critical unauthorized breaches found.', 'EDITH');
    setTimeout(() => {
      setThreatLevel('NOMINAL');
    }, 5000);
  };

  const handleOrbitalStrike = () => {
    if (strikeInProgress) return;
    playTacticalAlert();
    setStrikeInProgress(true);
    setStrikeCountdown(3);
    setThreatLevel('CRITICAL');
    speakPersona('Target acquired by orbital drone array Charlie-3. Initiating non-lethal kinetic suppression in 3, 2, 1.', 'EDITH');

    const interval = setInterval(() => {
      setStrikeCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          playLaserShot();
          playConfirmChime();
          setStrikeInProgress(false);
          setThreatLevel('NOMINAL');
          speakPersona('Target neutralized. Orbital drone returning to standby vector.', 'EDITH');
          return 0;
        }
        playTacticalAlert();
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto font-rajdhani bg-slate-950">
      {/* Top E.D.I.T.H. Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-red-500/40 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/50 text-red-500">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-orbitron font-bold text-lg text-red-400 tracking-wider">
                E.D.I.T.H. TACTICAL DEFENSE HUD
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-tech bg-red-950/80 text-red-300 border border-red-700">
                STARK PROTOCOL 85
              </span>
            </div>
            <p className="text-xs font-tech text-red-400/80">
              EVEN DEAD, I'M THE HERO // ORBITAL DRONE SATELLITE NETWORK
            </p>
          </div>
        </div>

        {/* Threat Level & Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-xs font-tech text-slate-400">THREAT LEVEL:</span>
            <span
              className={`font-orbitron font-bold text-xs ${
                threatLevel === 'CRITICAL'
                  ? 'text-red-500 animate-pulse'
                  : threatLevel === 'ELEVATED'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {threatLevel}
            </span>
          </div>

          <button
            onClick={handleInitiateScan}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 font-tech text-xs transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>GLOBAL SCAN</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Radar, Drones, Orbital Strike Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-4">
        {/* Left Column: Tactical Radar Screen */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900/90 border-2 border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <div className="w-full flex items-center justify-between pb-2 border-b border-red-500/20 text-xs font-tech text-red-400">
            <span className="flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 animate-pulse text-red-500" />
              ORBITAL RADAR SWEEP // 360°
            </span>
            <span>3 TARGETS IN SECTOR</span>
          </div>

          <div className="relative my-3 flex items-center justify-center">
            <canvas
              ref={radarCanvasRef}
              width={280}
              height={280}
              className="rounded-full bg-black/90 border border-red-500/50 shadow-inner"
            />
          </div>

          <div className="w-full grid grid-cols-3 gap-2 text-center text-xs font-tech text-slate-400 border-t border-red-500/20 pt-2">
            <div>
              <div className="text-[10px] text-slate-500">BANDWIDTH</div>
              <div className="text-red-400 font-bold">12.8 TB/s</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">SATELLITES</div>
              <div className="text-red-400 font-bold">42 ONLINE</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">LATENCY</div>
              <div className="text-red-400 font-bold">0.4 MS</div>
            </div>
          </div>
        </div>

        {/* Right Column: Drone Fleet Telemetry & Strike Panel */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Drone Fleet List */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-red-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-orbitron font-bold text-xs text-red-300 tracking-wider flex items-center gap-1.5">
                <Satellite className="w-4 h-4 text-red-400" />
                STARK ORBITAL DRONE FLEET
              </h3>
              <span className="text-[11px] font-tech text-slate-400">
                AUTONOMOUS DEFENSE ACTIVE
              </span>
            </div>

            <div className="space-y-2">
              {drones.map((d) => (
                <div
                  key={d.id}
                  onClick={() => setSelectedDrone(d.callsign)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedDrone === d.callsign
                      ? 'bg-red-950/60 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                      : 'bg-slate-950/80 border-slate-800 hover:border-red-500/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-950 border border-red-600/50 text-red-400">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-orbitron font-semibold text-xs text-red-200">
                        {d.callsign}
                      </div>
                      <div className="text-[11px] font-tech text-slate-400">
                        ALT: {d.altitudeMeters}M | DISTANCE: {d.targetDistanceKm}KM
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-[10px] font-tech px-2 py-0.5 rounded border ${
                        d.status === 'LOCKED_ON'
                          ? 'bg-red-950 text-red-400 border-red-700 animate-pulse font-bold'
                          : 'bg-slate-900 text-slate-300 border-slate-700'
                      }`}
                    >
                      {d.status}
                    </span>
                    <div className="text-[11px] font-tech text-slate-400 mt-1">
                      BATTERY: {d.batteryPercent}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Orbital Strike Simulator Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-red-950/50 to-slate-950 border-2 border-red-500/40 p-4 shadow-[0_0_25px_rgba(239,68,68,0.2)] flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-red-400 font-orbitron font-bold text-xs tracking-wider">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                ORBITAL KINETIC DISRUPTION SYSTEM
              </div>
              <p className="text-xs text-slate-300 font-rajdhani mt-1 max-w-sm">
                Target vector locked to simulated hostile signature. Authorized by Peter Parker / Tony Stark biometric key.
              </p>
            </div>

            <button
              onClick={handleOrbitalStrike}
              disabled={strikeInProgress}
              className={`py-3 px-5 rounded-xl font-orbitron font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-all ${
                strikeInProgress
                  ? 'bg-red-700 text-white animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.8)]'
                  : 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'
              }`}
            >
              {strikeInProgress ? (
                <>
                  <Flame className="w-4 h-4 animate-bounce" />
                  STRIKE IN {strikeCountdown}S...
                </>
              ) : (
                <>
                  <Crosshair className="w-4 h-4" />
                  EXECUTE E.D.I.T.H. STRIKE
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
