import React, { useState, useRef, useEffect } from 'react';
import { BuiltinGame, ControllerCommand } from '../types';
import {
  Gamepad2,
  Play,
  RotateCcw,
  Sparkles,
  Code2,
  Download,
  Copy,
  Check,
  Smartphone,
  ChevronRight,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { playConfirmChime, playJarvisBeep, playLaserShot, speakPersona } from '../utils/audioSynthesizer';

// Built-in Stark Arcade Game 1: Orbital Drone Defender
const GAME_ORBITAL_DEFENDER_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { margin: 0; background: #030712; color: #06b6d4; font-family: 'Courier New', monospace; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; }
  canvas { border: 2px solid #06b6d4; box-shadow: 0 0 20px rgba(6,182,212,0.4); background: radial-gradient(circle, #081a2e 0%, #020617 100%); }
  #hud { position: absolute; top: 10px; width: 560px; display: flex; justify-content: space-between; font-weight: bold; text-shadow: 0 0 8px #06b6d4; }
  .btn-bar { margin-top: 10px; display: flex; gap: 10px; }
  button { background: #06b6d4; color: #000; border: none; padding: 6px 16px; font-weight: bold; cursor: pointer; border-radius: 4px; }
</style>
</head>
<body>
<div id="hud">
  <span>MARK 85 DEFENDER</span>
  <span id="score">SCORE: 0</span>
  <span id="lives">ARMOR: 100%</span>
</div>
<canvas id="c" width="580" height="380"></canvas>
<script>
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  let score = 0;
  let armor = 100;
  let gameOver = false;

  const player = { x: 270, y: 320, w: 40, h: 30, speed: 6, vx: 0, vy: 0 };
  const bullets = [];
  const enemies = [];
  const particles = [];
  const keys = {};

  window.addEventListener('keydown', e => { keys[e.key] = true; if(e.key === ' ' || e.code === 'Space') fireBullet(); if(e.key.toLowerCase() === 'r' && gameOver) resetGame(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Remote controller message hook
  window.addEventListener('message', (e) => {
    if(!e.data) return;
    if(e.data.type === 'KEY_DOWN') { keys[e.data.key] = true; }
    if(e.data.type === 'KEY_UP') { keys[e.data.key] = false; }
    if(e.data.type === 'ACTION') {
      if(e.data.action === 'FIRE') fireBullet();
      if(e.data.action === 'SPECIAL') triggerEmp();
      if(e.data.action === 'RESTART' && gameOver) resetGame();
    }
  });

  function fireBullet() {
    if(gameOver) return;
    bullets.push({ x: player.x + 10, y: player.y, r: 3, vy: -9, color: '#38bdf8' });
    bullets.push({ x: player.x + 30, y: player.y, r: 3, vy: -9, color: '#38bdf8' });
  }

  function triggerEmp() {
    enemies.forEach(en => {
      for(let i=0; i<15; i++) particles.push({ x: en.x, y: en.y, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, life: 30, color: '#a855f7' });
      score += 150;
    });
    enemies.length = 0;
    document.getElementById('score').innerText = 'SCORE: ' + score;
  }

  function spawnEnemy() {
    if(gameOver) return;
    const x = Math.random() * (canvas.width - 40);
    const speed = 1.5 + Math.random() * 2;
    enemies.push({ x, y: -20, w: 30, h: 25, vy: speed, hp: 1 });
  }
  setInterval(spawnEnemy, 900);

  function resetGame() {
    score = 0; armor = 100; gameOver = false;
    enemies.length = 0; bullets.length = 0; particles.length = 0;
    player.x = 270; player.y = 320;
    document.getElementById('score').innerText = 'SCORE: 0';
    document.getElementById('lives').innerText = 'ARMOR: 100%';
  }

  function loop() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Player input
    if(keys['ArrowLeft'] || keys['a'] || keys['A']) player.x = Math.max(0, player.x - player.speed);
    if(keys['ArrowRight'] || keys['d'] || keys['D']) player.x = Math.min(canvas.width - player.w, player.x + player.speed);
    if(keys['ArrowUp'] || keys['w'] || keys['W']) player.y = Math.max(0, player.y - player.speed);
    if(keys['ArrowDown'] || keys['s'] || keys['S']) player.y = Math.min(canvas.height - player.h, player.y + player.speed);

    // Draw Stark Armor
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    // Arc reactor on chest
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(player.x + 20, player.y + 12, 6, 0, Math.PI*2);
    ctx.fill();
    // Thruster flame
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(player.x + 8, player.y + player.h, 6, Math.random()*12 + 6);
    ctx.fillRect(player.x + 26, player.y + player.h, 6, Math.random()*12 + 6);

    // Bullets
    for(let i=bullets.length-1; i>=0; i--) {
      const b = bullets[i];
      b.y += b.vy;
      ctx.fillStyle = b.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = b.color;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      if(b.y < -10) bullets.splice(i,1);
    }

    // Enemies
    for(let i=enemies.length-1; i>=0; i--) {
      const en = enemies[i];
      en.y += en.vy;
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(en.x, en.y, en.w, en.h);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(en.x + 5, en.y + 8, 20, 4);

      // Check bullet collision
      for(let j=bullets.length-1; j>=0; j--) {
        const b = bullets[j];
        if(b.x > en.x && b.x < en.x + en.w && b.y > en.y && b.y < en.y + en.h) {
          bullets.splice(j,1);
          for(let p=0; p<10; p++) particles.push({ x: en.x + 15, y: en.y + 10, vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6, life: 20, color: '#f59e0b' });
          enemies.splice(i,1);
          score += 100;
          document.getElementById('score').innerText = 'SCORE: ' + score;
          break;
        }
      }

      // Check player collision
      if(en && en.x < player.x + player.w && en.x + en.w > player.x && en.y < player.y + player.h && en.y + en.h > player.y) {
        enemies.splice(i,1);
        armor -= 20;
        document.getElementById('lives').innerText = 'ARMOR: ' + Math.max(0, armor) + '%';
        if(armor <= 0) { gameOver = true; }
      }

      if(en && en.y > canvas.height + 20) enemies.splice(i,1);
    }

    // Particles
    for(let i=particles.length-1; i>=0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.life--;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 3, 3);
      if(p.life <= 0) particles.splice(i,1);
    }

    if(gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = '#ef4444';
      ctx.font = '24px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('CRITICAL DAMAGE // ARMOR OFFLINE', canvas.width/2, canvas.height/2 - 20);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '16px Courier New';
      ctx.fillText('PRESS "R" OR MOBILE [RESTART] TO REBOOT', canvas.width/2, canvas.height/2 + 20);
    }

    requestAnimationFrame(loop);
  }
  loop();
</script>
</body>
</html>`;

// Built-in Stark Arcade Game 2: Cyber Arc Runner
const GAME_CYBER_RUNNER_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { margin: 0; background: #050515; color: #a855f7; font-family: monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; }
  canvas { border: 2px solid #a855f7; box-shadow: 0 0 25px rgba(168,85,247,0.5); }
  #hud { position: absolute; top: 12px; width: 560px; display: flex; justify-content: space-between; font-weight: bold; }
</style>
</head>
<body>
<div id="hud">
  <span>CYBER ARC RUNNER</span>
  <span id="score">DISTANCE: 0M</span>
</div>
<canvas id="c" width="580" height="380"></canvas>
<script>
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  let distance = 0;
  let gameOver = false;
  const lanes = [100, 220, 340, 460];
  let curLane = 1;
  const obstacles = [];
  const energyNodes = [];

  window.addEventListener('keydown', e => {
    if(e.key === 'ArrowLeft' || e.key === 'a') if(curLane > 0) curLane--;
    if(e.key === 'ArrowRight' || e.key === 'd') if(curLane < lanes.length - 1) curLane++;
    if(e.key.toLowerCase() === 'r' && gameOver) reset();
  });

  window.addEventListener('message', e => {
    if(!e.data) return;
    if(e.data.key === 'ArrowLeft') if(curLane > 0) curLane--;
    if(e.data.key === 'ArrowRight') if(curLane < lanes.length - 1) curLane++;
    if(e.data.action === 'RESTART' && gameOver) reset();
  });

  function spawnObstacle() {
    if(gameOver) return;
    const lane = Math.floor(Math.random() * lanes.length);
    obstacles.push({ lane, y: -40, w: 40, h: 40, vy: 5 + distance/1000 });
  }
  setInterval(spawnObstacle, 700);

  function reset() {
    distance = 0; gameOver = false; obstacles.length = 0; curLane = 1;
  }

  function loop() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Neon Grid Road
    ctx.strokeStyle = 'rgba(168,85,247,0.3)';
    lanes.forEach(x => {
      ctx.beginPath(); ctx.moveTo(x + 20, 0); ctx.lineTo(x + 20, canvas.height); ctx.stroke();
    });

    if(!gameOver) {
      distance += 2;
      document.getElementById('score').innerText = 'DISTANCE: ' + Math.floor(distance) + 'M';
    }

    // Player Stark Speeder
    const px = lanes[curLane];
    const py = 300;
    ctx.fillStyle = '#06b6d4';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#06b6d4';
    ctx.fillRect(px, py, 40, 50);
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(px + 10, py + 10, 20, 15);
    ctx.shadowBlur = 0;

    // Obstacles
    for(let i=obstacles.length-1; i>=0; i--) {
      const o = obstacles[i];
      o.y += o.vy;
      const ox = lanes[o.lane];
      ctx.fillStyle = '#e11d48';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#e11d48';
      ctx.fillRect(ox, o.y, o.w, o.h);
      ctx.shadowBlur = 0;

      // Collision
      if(o.lane === curLane && o.y + o.h > py && o.y < py + 50) {
        gameOver = true;
      }
      if(o.y > canvas.height + 50) obstacles.splice(i, 1);
    }

    if(gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = '#f43f5e';
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GRID COLLISION DETECTED', canvas.width/2, canvas.height/2);
      ctx.fillStyle = '#06b6d4';
      ctx.font = '16px monospace';
      ctx.fillText('PRESS "R" OR CONTROLLER [RESTART]', canvas.width/2, canvas.height/2 + 35);
    }

    requestAnimationFrame(loop);
  }
  loop();
</script>
</body>
</html>`;

export const GameForgeStudio: React.FC<{
  lastRemoteCommand?: ControllerCommand | null;
  onOpenPhoneModal: () => void;
}> = ({ lastRemoteCommand, onOpenPhoneModal }) => {
  const [activeTab, setActiveTab] = useState<'BUILTIN' | 'AI_GENERATOR'>('BUILTIN');
  const [selectedGame, setSelectedGame] = useState<number>(0);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [customGameHtml, setCustomGameHtml] = useState<string | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const games: BuiltinGame[] = [
    {
      id: 'orbital_defender',
      title: 'Stark Orbital Drone Defender',
      genre: 'Space Shoot-Em-Up',
      difficulty: 'TACTICAL',
      description: 'Pilot the Mark 85 armor. Intercept rogue drones, fire plasma repulsors, and fire E.D.I.T.H. EMP pulse.',
      html: GAME_ORBITAL_DEFENDER_HTML,
      highScore: 18500,
    },
    {
      id: 'cyber_runner',
      title: 'Cyber Arc Neon Runner',
      genre: 'Endless Synthwave',
      difficulty: 'MODERATE',
      description: 'Pilot an arc-powered hovercraft across cybernetic highway grids. Dodge laser barricades at supersonic speeds.',
      html: GAME_CYBER_RUNNER_HTML,
      highScore: 2420,
    },
  ];

  const currentHtml = customGameHtml || games[selectedGame].html;

  // Forward remote phone commands into active game iframe
  useEffect(() => {
    if (lastRemoteCommand && iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(lastRemoteCommand, '*');
    }
  }, [lastRemoteCommand]);

  const handleGenerateGame = async (gamePrompt: string) => {
    if (!gamePrompt.trim() || isGenerating) return;
    setIsGenerating(true);
    playJarvisBeep();
    speakPersona('Initiating Game Forge neural synthesis. Compiling canvas engine and physics logic.', 'JARVIS');

    try {
      const res = await fetch('/api/jarvis/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: gamePrompt }),
      });
      const data = await res.json();
      if (data.html) {
        setCustomGameHtml(data.html);
        playConfirmChime();
        speakPersona('Game Forge compilation complete. Playable sandbox deployed to your HUD.', 'JARVIS');
      } else {
        alert(data.error || 'Failed to generate game.');
      }
    } catch (e: any) {
      alert('Error building game: ' + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentHtml);
    setCopied(true);
    playConfirmChime();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stark_game_${Date.now()}.html`;
    a.click();
    playConfirmChime();
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto font-rajdhani">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-purple-500/30 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/40 text-purple-400">
            <Gamepad2 className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="font-orbitron font-bold text-lg text-purple-200 tracking-wider">
              J.A.R.V.I.S. GAME FORGE ENGINE
            </h2>
            <p className="text-xs font-tech text-purple-400/80">
              REAL-TIME HTML5/CANVAS ARCHITECT &amp; QR MOBILE INTEGRATION
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenPhoneModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-tech text-xs transition-colors"
          >
            <Smartphone className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>PAIR PHONE CONTROLLER</span>
          </button>

          <button
            onClick={() => setShowCodeModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-purple-500/40 text-purple-300 font-tech text-xs transition-colors"
          >
            <Code2 className="w-4 h-4" />
            <span>VIEW CODE</span>
          </button>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex items-center gap-2 my-4">
        <button
          onClick={() => {
            setActiveTab('BUILTIN');
            setCustomGameHtml(null);
            playJarvisBeep();
          }}
          className={`px-4 py-2 rounded-lg font-orbitron font-bold text-xs tracking-wider transition-all ${
            activeTab === 'BUILTIN'
              ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          STARK LAB ARCADE PRESETS
        </button>

        <button
          onClick={() => {
            setActiveTab('AI_GENERATOR');
            playJarvisBeep();
          }}
          className={`px-4 py-2 rounded-lg font-orbitron font-bold text-xs tracking-wider flex items-center gap-1.5 transition-all ${
            activeTab === 'AI_GENERATOR'
              ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          AI CUSTOM GAME CREATOR
        </button>
      </div>

      {/* Main Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Game Player / Canvas Container */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="relative rounded-2xl bg-black border-2 border-purple-500/40 p-1 shadow-[0_0_35px_rgba(168,85,247,0.2)] overflow-hidden">
            {/* Top Bar inside Canvas Window */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border-b border-purple-500/30 text-xs font-tech text-purple-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                SANDBOX EXECUTING // 60 FPS
              </span>
              <span className="text-slate-400">
                CONTROLS: ARROWS / WASD + SPACEBAR | MOBILE PHONE D-PAD SYNCED
              </span>
            </div>

            {/* Game iFrame */}
            <iframe
              ref={iframeRef}
              srcDoc={currentHtml}
              className="w-full h-[420px] bg-slate-950 border-none rounded-b-xl"
              sandbox="allow-scripts"
              title="Stark Game Engine"
            />
          </div>

          {/* Quick Controller Prompt Bar */}
          <div className="mt-3 flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-cyan-300 font-tech">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>Control this game from your phone with the QR pairing code!</span>
            </div>
            <button
              onClick={onOpenPhoneModal}
              className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-tech text-[11px]"
            >
              SCAN QR CODE
            </button>
          </div>
        </div>

        {/* Right Side: Game Selector / AI Generator Panel */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {activeTab === 'BUILTIN' ? (
            <div className="space-y-3">
              <h3 className="font-orbitron font-bold text-xs text-purple-300 tracking-wider">
                SELECT GAME PROTOCOL
              </h3>

              {games.map((g, idx) => (
                <div
                  key={g.id}
                  onClick={() => {
                    setSelectedGame(idx);
                    setCustomGameHtml(null);
                    playConfirmChime();
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedGame === idx && !customGameHtml
                      ? 'bg-purple-950/60 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-purple-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-orbitron font-bold text-xs text-purple-200">
                      {g.title}
                    </span>
                    <span className="text-[10px] font-tech text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800">
                      {g.genre}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-300 font-rajdhani leading-relaxed">
                    {g.description}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between text-[11px] font-tech text-slate-400">
                    <span>RECORD: {g.highScore} PTS</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Play className="w-3 h-3" /> LAUNCHED
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-900/90 border border-purple-500/40 space-y-4">
              <div>
                <h3 className="font-orbitron font-bold text-xs text-purple-300 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  PROMPT JARVIS TO BUILD A GAME
                </h3>
                <p className="text-xs text-slate-400 font-rajdhani mt-1">
                  Describe any game mechanics, theme, controls, or rules. Jarvis compiles pure HTML5 Canvas code.
                </p>
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Build an asteroid defense game where Stark armor destroys rogue comets, collects energy shield crystals, and has a boss fight."
                rows={4}
                className="w-full p-3 rounded-lg bg-black/80 border border-purple-500/40 text-purple-100 font-tech text-xs focus:outline-none focus:border-purple-400 resize-none"
              />

              {/* Rapid Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-tech text-slate-400">QUICK PRESETS:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Quantum Breakout Brick Smasher',
                    'Retro Flappy Iron Man Armor',
                    'Deep Space Alien Fleet Infiltration',
                    'Cyber Matrix Neon Snake Game',
                  ].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        setPrompt(preset);
                        handleGenerateGame(preset);
                      }}
                      className="px-2 py-1 rounded bg-purple-950/50 hover:bg-purple-900/60 border border-purple-800 text-[11px] font-tech text-purple-300 text-left transition-colors"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleGenerateGame(prompt)}
                disabled={isGenerating || !prompt.trim()}
                className={`w-full py-3 rounded-xl font-orbitron font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-all ${
                  isGenerating
                    ? 'bg-purple-950 text-purple-400 animate-pulse'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                }`}
              >
                {isGenerating ? (
                  <>
                    <span className="w-3 h-3 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
                    SYNTHESIZING GAME CANVAS...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    SYNTHESIZE &amp; RUN GAME
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Code Inspector Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-3xl bg-slate-950 border border-purple-500/50 rounded-2xl p-6 flex flex-col max-h-[85vh] shadow-[0_0_50px_rgba(168,85,247,0.3)]">
            <div className="flex items-center justify-between pb-4 border-b border-purple-500/30">
              <div className="flex items-center gap-2 text-purple-300 font-orbitron font-bold text-sm">
                <Code2 className="w-5 h-5 text-purple-400" />
                GAME ENGINE SOURCE CODE // HTML5 CANVAS
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 rounded-lg bg-purple-950 hover:bg-purple-900 border border-purple-500/40 text-purple-300 font-tech text-xs flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'COPIED' : 'COPY CODE'}
                </button>
                <button
                  onClick={handleDownload}
                  className="px-3 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 font-tech text-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  DOWNLOAD .HTML
                </button>
                <button
                  onClick={() => setShowCodeModal(false)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 my-4 overflow-y-auto bg-black p-4 rounded-xl border border-slate-800 font-tech text-xs text-purple-200 selection:bg-purple-500">
              <pre className="whitespace-pre-wrap">{currentHtml}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
