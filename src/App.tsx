import React, { useState, useEffect, useRef } from 'react';
import { SystemMode, ChatMessage, PluginModule, ControllerCommand } from './types';
import { TopNavbar } from './components/TopNavbar';
import { ArcReactorCore } from './components/ArcReactorCore';
import { JarvisChatPanel } from './components/JarvisChatPanel';
import { GameForgeStudio } from './components/GameForgeStudio';
import { QualityCodeStudio } from './components/QualityCodeStudio';
import { EdithTacticalHud } from './components/EdithTacticalHud';
import { PluginManager } from './components/PluginManager';
import { PhoneControllerModal } from './components/PhoneControllerModal';
import { MobileControllerView } from './components/MobileControllerView';
import { VoiceControlMode } from './components/VoiceControlMode';
import { VisionScannerMode } from './components/VisionScannerMode';
import { PermissionsBanner } from './components/PermissionsBanner';
import {
  playConfirmChime,
  playJarvisBeep,
  playTacticalAlert,
  playReactorHum,
  speakPersona,
} from './utils/audioSynthesizer';
import {
  Activity,
  Cpu,
  Shield,
  Gamepad2,
  Terminal,
  Zap,
  Smartphone,
  Radio,
  Sparkles,
  Eye,
} from 'lucide-react';

export default function App() {
  // Check if current URL is mobile controller mode
  const [isControllerMode, setIsControllerMode] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    const sessionParam = params.get('session');

    if (modeParam === 'controller' && sessionParam) {
      setIsControllerMode(true);
      setSessionId(sessionParam);
    } else {
      // Generate or retrieve session id for host
      let sid = sessionParam;
      if (!sid) {
        sid = 'stark-' + Math.random().toString(36).substring(2, 9);
      }
      setSessionId(sid);
    }
  }, []);

  // Host State
  const [currentMode, setCurrentMode] = useState<SystemMode>('JARVIS');
  const [arcPower, setArcPower] = useState<number>(100);
  const [threatLevel, setThreatLevel] = useState<'NOMINAL' | 'ELEVATED' | 'CRITICAL'>('NOMINAL');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [phoneModalOpen, setPhoneModalOpen] = useState<boolean>(false);
  const [connectedControllers, setConnectedControllers] = useState<number>(0);
  const [lastRemoteCommand, setLastRemoteCommand] = useState<ControllerCommand | null>(null);

  // Initial plugins
  const [plugins, setPlugins] = useState<PluginModule[]>([
    {
      id: 'plugin-game-forge',
      name: 'Game Forge Engine 3.0',
      codename: 'FORGE-MK3',
      category: 'DEV',
      description: 'Real-time HTML5 Canvas mini-game synthesizer with 60 FPS physics loops and remote D-Pad hooks.',
      enabled: true,
      version: '3.4.0',
      loadPercentage: 18,
      iconName: 'Gamepad2',
    },
    {
      id: 'plugin-omni-coder',
      name: 'Omni-Coder Hardened Studio',
      codename: 'STARK-DEV-01',
      category: 'DEV',
      description: 'Production-grade software architecture synthesis across TypeScript, Rust, Go, Python, and GLSL.',
      enabled: true,
      version: '2.8.1',
      loadPercentage: 24,
      iconName: 'Cpu',
    },
    {
      id: 'plugin-edith-defense',
      name: 'E.D.I.T.H. Tactical Defense Grid',
      codename: 'EDITH-ORBITAL-85',
      category: 'TACTICAL',
      description: 'Global satellite recon array, orbital drone telemetry, and target kinetic disruption vectors.',
      enabled: true,
      version: '4.1.0',
      loadPercentage: 32,
      iconName: 'Shield',
    },
    {
      id: 'plugin-stark-link',
      name: 'Stark Link QR Controller Protocol',
      codename: 'STARK-LINK-P2P',
      category: 'PERIPHERAL',
      description: 'Zero-latency mobile pairing via QR code to pilot games, stream voice commands, and trigger protocols.',
      enabled: true,
      version: '1.9.0',
      loadPercentage: 8,
      iconName: 'Smartphone',
    },
    {
      id: 'plugin-vocal-core',
      name: 'Vocal Neural Processor & TTS',
      codename: 'NEURAL-SPEECH-GB',
      category: 'CORE',
      description: 'Acoustic synthesis for refined British JARVIS and tactical E.D.I.T.H. voice protocols.',
      enabled: true,
      version: '2.2.0',
      loadPercentage: 12,
      iconName: 'Mic',
    },
    {
      id: 'plugin-reactor-overclock',
      name: 'Arc Reactor Overclock Governor',
      codename: 'ARC-PLASMA-VIB',
      category: 'CORE',
      description: 'Dynamic power routing to surge neural throughput up to 150% capacity.',
      enabled: true,
      version: '5.0.0',
      loadPercentage: 15,
      iconName: 'Zap',
    },
    {
      id: 'plugin-perimeter-defense',
      name: 'Cyber Intrusion & Threat Shield',
      codename: 'AEGIS-FIREWALL',
      category: 'TACTICAL',
      description: 'Real-time packet inspection and biometric perimeter anomaly detection.',
      enabled: true,
      version: '3.1.2',
      loadPercentage: 10,
      iconName: 'ShieldAlert',
    },
    {
      id: 'plugin-quantum-reasoning',
      name: 'Quantum Deep Reasoning Matrix',
      codename: 'Q-REASON-7B',
      category: 'QUANTUM',
      description: 'Higher-order cognitive reasoning for hard mathematical, robotics, and physics formulations.',
      enabled: true,
      version: '2.0.4',
      loadPercentage: 20,
      iconName: 'Sparkles',
    },
    {
      id: 'plugin-satellite-recon',
      name: 'Satellite Orbital Recon Array',
      codename: 'STARK-SAT-GLOBAL',
      category: 'TACTICAL',
      description: 'Real-time multispectral orbital imaging and drone constellation telemetry.',
      enabled: true,
      version: '3.0.0',
      loadPercentage: 14,
      iconName: 'Radio',
    },
    {
      id: 'plugin-nanotech-lab',
      name: 'Vibranium Nanotech Simulation Lab',
      codename: 'NANO-FORGE-85',
      category: 'QUANTUM',
      description: 'Molecular lattice integrity simulation for nanotech armor reconfigurations.',
      enabled: true,
      version: '1.5.0',
      loadPercentage: 9,
      iconName: 'Layers',
    },
  ]);

  // Initial messages
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'jarvis',
      text: 'Good day, Sir. J.A.R.V.I.S. neural core is online and operating at nominal efficiency. All plugins are loaded, the Game Forge engine is primed, and E.D.I.T.H. orbital satellite arrays are synchronized. Scan the QR code to pair your handheld Stark PADD controller, or instruct me as you wish.',
      timestamp: 'ONLINE // 00:01',
    },
  ]);

  const wsRef = useRef<WebSocket | null>(null);
  const broadcastRef = useRef<BroadcastChannel | null>(null);

  // Initialize Host WebSocket & BroadcastChannel
  useEffect(() => {
    if (!sessionId || isControllerMode) return;

    // 1. BroadcastChannel fallback
    try {
      const bc = new BroadcastChannel(`stark_session_${sessionId}`);
      broadcastRef.current = bc;
      bc.onmessage = (event) => {
        if (event.data?.type === 'CONTROLLER_COMMAND') {
          handleIncomingCommand(event.data.payload);
        }
      };
    } catch (e) {
      console.log('BroadcastChannel not supported');
    }

    // 2. WebSocket pairing
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'REGISTER',
          role: 'host',
          sessionId,
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'CONTROLLER_CONNECTED') {
          setConnectedControllers(msg.payload.clientCount || 1);
          playConfirmChime();
          speakPersona('Stark Link connected. Mobile handheld controller paired to terminal.', 'JARVIS');
        } else if (msg.type === 'CONTROLLER_DISCONNECTED') {
          setConnectedControllers(msg.payload.clientCount || 0);
        } else if (msg.type === 'CONTROLLER_COMMAND') {
          handleIncomingCommand(msg.payload);
        }
      } catch (err) {
        console.error('WS Error on host:', err);
      }
    };

    return () => {
      ws.close();
      broadcastRef.current?.close();
    };
  }, [sessionId, isControllerMode]);

  // Handle incoming commands from paired mobile phone
  const handleIncomingCommand = (cmd: ControllerCommand) => {
    setLastRemoteCommand(cmd);

    if (cmd.type === 'VOICE_COMMAND' && cmd.voiceText) {
      playJarvisBeep();
      handleUserMessage(cmd.voiceText);
    } else if (cmd.type === 'PROTOCOL') {
      if (cmd.protocol === 'PROTOCOL_VOICE_MODE') {
        setCurrentMode('VOICE');
        playConfirmChime();
        speakPersona('Hands-free voice control mode activated.', 'JARVIS');
      } else if (cmd.protocol === 'PROTOCOL_VISION_SCAN') {
        setCurrentMode('VISION');
        playJarvisBeep();
        speakPersona('Multimodal vision scanner online.', 'JARVIS');
      } else if (cmd.protocol === 'PROTOCOL_EDITH_SCAN') {
        setCurrentMode('EDITH');
        playTacticalAlert();
        speakPersona('Switching HUD to E.D.I.T.H. Tactical Defense Grid.', 'EDITH');
      } else if (cmd.protocol === 'PROTOCOL_OVERCLOCK') {
        handleOverclockCore();
      } else if (cmd.protocol === 'PROTOCOL_GAME_FORGE') {
        setCurrentMode('FORGE');
        playConfirmChime();
        speakPersona('Opening Game Forge engine. Canvas sandbox active.', 'JARVIS');
      }
    } else if (cmd.type === 'ACTION') {
      if (cmd.action === 'SPECIAL') {
        playTacticalAlert();
      }
    }
  };

  // Broadcast host status changes to mobile controller
  useEffect(() => {
    if (isControllerMode || !sessionId) return;
    const payload = {
      mode: currentMode,
      arcCore: arcPower,
      threatLevel,
    };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'HOST_STATUS_UPDATE',
          sessionId,
          payload,
        })
      );
    }

    if (broadcastRef.current) {
      broadcastRef.current.postMessage({
        type: 'STATUS_UPDATE',
        payload,
      });
    }
  }, [currentMode, arcPower, threatLevel, isControllerMode, sessionId]);

  // Overclock Arc Reactor Core
  const handleOverclockCore = () => {
    playReactorHum();
    setArcPower(150);
    speakPersona('Arc Reactor overclocked to 150 percent capacity. Core temperatures surging.', 'JARVIS');
    setTimeout(() => {
      setArcPower(100);
    }, 8000);
  };

  // Send message to Jarvis AI backend
  const handleUserMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);
    playJarvisBeep();

    // Contextual system status
    const systemStatus = {
      mode: currentMode,
      arcPower,
      threatLevel,
      connectedControllers,
      activePlugins: plugins.filter((p) => p.enabled).map((p) => p.name),
    };

    try {
      const res = await fetch('/api/jarvis/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          mode: currentMode === 'EDITH' ? 'EDITH' : 'JARVIS',
          systemStatus,
        }),
      });

      const data = await res.json();
      const replyText = data.text || 'Processing complete. All sectors clear.';

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: currentMode === 'EDITH' ? 'edith' : 'jarvis',
        text: replyText,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, botMsg]);
      playConfirmChime();
      speakPersona(replyText, currentMode === 'EDITH' ? 'EDITH' : 'JARVIS');
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'system',
        text: 'Neural transmission anomaly: ' + err.message,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  // Toggle individual plugins
  const handleTogglePlugin = (pluginId: string) => {
    setPlugins((prev) =>
      prev.map((p) => (p.id === pluginId ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const handleAddPlugin = (newPlugin: PluginModule) => {
    setPlugins((prev) => [newPlugin, ...prev]);
  };

  // Render Mobile Controller View if URL param `mode=controller`
  if (isControllerMode) {
    return <MobileControllerView sessionId={sessionId} />;
  }

  return (
    <div className="min-h-screen bg-[#030712] text-cyan-100 flex flex-col font-rajdhani selection:bg-cyan-500 selection:text-black relative overflow-x-hidden">
      {/* Background Holographic Grid & Scanlines */}
      <div className="fixed inset-0 bg-stark-grid opacity-25 pointer-events-none" />
      <div className="fixed inset-0 scanline-overlay pointer-events-none" />

      {/* Top Navigation & Status Bar */}
      <TopNavbar
        currentMode={currentMode}
        onSelectMode={(m) => {
          setCurrentMode(m);
          if (m === 'VOICE') speakPersona('Hands-free voice control mode active. Speak naturally, Sir.', 'JARVIS');
          else if (m === 'VISION') speakPersona('Multimodal ocular sensors initialized.', 'JARVIS');
          else if (m === 'EDITH') speakPersona('E.D.I.T.H. defense protocol engaged.', 'EDITH');
          else if (m === 'FORGE') speakPersona('Game Forge compilation sandbox loaded.', 'JARVIS');
          else if (m === 'CODER') speakPersona('Quality Code Studio ready for software architecture.', 'JARVIS');
          else if (m === 'JARVIS') speakPersona('J.A.R.V.I.S. neural dashboard online.', 'JARVIS');
        }}
        arcPower={arcPower}
        threatLevel={threatLevel}
        connectedControllers={connectedControllers}
        onOpenPhoneModal={() => setPhoneModalOpen(true)}
        pluginCount={plugins.filter((p) => p.enabled).length}
      />

      {/* Biometric Camera and Voice Permission Authorization Banner */}
      <PermissionsBanner />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative z-10 p-2 md:p-4 max-w-7xl w-full mx-auto">
        {currentMode === 'VOICE' ? (
          <VoiceControlMode
            onExecuteCommand={(action, payload) => {
              if (action === 'SWITCH_MODE' && payload) {
                setCurrentMode(payload);
              }
            }}
            arcPower={arcPower}
            onOverclock={handleOverclockCore}
            onOpenPhoneModal={() => setPhoneModalOpen(true)}
          />
        ) : currentMode === 'VISION' ? (
          <VisionScannerMode />
        ) : currentMode === 'FORGE' ? (
          <GameForgeStudio
            lastRemoteCommand={lastRemoteCommand}
            onOpenPhoneModal={() => setPhoneModalOpen(true)}
          />
        ) : currentMode === 'CODER' ? (
          <QualityCodeStudio />
        ) : currentMode === 'EDITH' ? (
          <EdithTacticalHud onOpenPhoneModal={() => setPhoneModalOpen(true)} />
        ) : currentMode === 'PLUGINS' ? (
          <PluginManager
            plugins={plugins}
            onTogglePlugin={handleTogglePlugin}
            onAddPlugin={handleAddPlugin}
          />
        ) : (
          /* J.A.R.V.I.S. Core Dashboard */
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Arc Reactor Core Centerpiece & Diagnostics */}
            <div className="lg:col-span-4 flex flex-col items-center justify-between p-4 rounded-2xl bg-slate-950/70 border border-cyan-500/30 shadow-[0_0_35px_rgba(6,182,212,0.15)] space-y-4">
              <div className="w-full flex items-center justify-between text-xs font-tech text-cyan-400 border-b border-cyan-500/20 pb-2">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  PALLADIUM / VIBRANIUM CORE
                </span>
                <span>QUANTUM HARMONIC</span>
              </div>

              {/* Arc Reactor Core with Overclock trigger */}
              <ArcReactorCore
                mode={currentMode}
                isProcessing={isThinking}
                powerLevel={arcPower}
                onOverclock={handleOverclockCore}
              />

              {/* System Diagnostics Metrics */}
              <div className="w-full grid grid-cols-2 gap-2 text-xs font-tech">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400">NEURAL BANDWIDTH</div>
                  <div className="text-cyan-300 font-bold text-sm">48.2 TFLOPS</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400">QUANTUM MEMORY</div>
                  <div className="text-cyan-300 font-bold text-sm">99.4% NOMINAL</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400">ACTIVE PLUGINS</div>
                  <div className="text-emerald-400 font-bold text-sm">
                    {plugins.filter((p) => p.enabled).length} RUNNING
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400">PHONE CONTROLLERS</div>
                  <div
                    className={`font-bold text-sm ${
                      connectedControllers > 0 ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {connectedControllers > 0 ? `${connectedControllers} PAIRED` : '0 PAIRED'}
                  </div>
                </div>
              </div>

              {/* Quick Launch Stark Features */}
              <div className="w-full space-y-2 pt-2 border-t border-cyan-500/20">
                <button
                  onClick={() => setCurrentMode('VOICE')}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-200 font-tech text-xs flex items-center justify-between transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    HANDS-FREE VOICE CONTROL
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">SPEAK →</span>
                </button>

                <button
                  onClick={() => setCurrentMode('VISION')}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 text-amber-200 font-tech text-xs flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-amber-400" />
                    OCULAR VISION SCANNER
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold">SCAN →</span>
                </button>

                <button
                  onClick={() => setCurrentMode('FORGE')}
                  className="w-full py-2.5 px-3 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-200 font-tech text-xs flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-purple-400" />
                    LAUNCH GAME FORGE ENGINE
                  </span>
                  <span className="text-[10px] text-purple-400 font-bold">PLAY / BUILD →</span>
                </button>

                <button
                  onClick={() => setCurrentMode('CODER')}
                  className="w-full py-2.5 px-3 rounded-xl bg-blue-950/60 hover:bg-blue-900/80 border border-blue-500/40 text-blue-200 font-tech text-xs flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-400" />
                    OMNI-CODER SOFTWARE SUITE
                  </span>
                  <span className="text-[10px] text-blue-400 font-bold">SYNTHESIZE →</span>
                </button>

                <button
                  onClick={() => setCurrentMode('EDITH')}
                  className="w-full py-2.5 px-3 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-200 font-tech text-xs flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-red-400" />
                    E.D.I.T.H. ORBITAL SATELLITES
                  </span>
                  <span className="text-[10px] text-red-400 font-bold">DEFENSE →</span>
                </button>
              </div>
            </div>

            {/* Right Column: Conversational AI Terminal */}
            <div className="lg:col-span-8 flex flex-col h-[640px]">
              <JarvisChatPanel
                messages={messages}
                mode={currentMode}
                onSendMessage={handleUserMessage}
                isThinking={isThinking}
                onSelectMode={setCurrentMode}
              />
            </div>
          </div>
        )}
      </main>

      {/* QR Code Phone Controller Pairing Modal */}
      <PhoneControllerModal
        isOpen={phoneModalOpen}
        onClose={() => setPhoneModalOpen(false)}
        sessionId={sessionId}
        connectedCount={connectedControllers}
      />
    </div>
  );
}
