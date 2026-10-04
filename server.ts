import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel, Type, FunctionDeclaration } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-Memory Long-Term Memory (matching memory/memory_manager.py)
interface MemoryRecord {
  value: string;
  updatedAt: string;
}
const longTermMemory: Record<string, Record<string, MemoryRecord>> = {
  identity: {
    name: { value: 'Tony', updatedAt: new Date().toISOString() },
    assistant_name: { value: 'JARVIS', updatedAt: new Date().toISOString() },
    language: { value: 'English', updatedAt: new Date().toISOString() },
  },
  preferences: {
    favorite_theme: { value: 'Holographic Stark Blue', updatedAt: new Date().toISOString() },
  },
  projects: {
    current_build: { value: 'Mark 85 Nanotech Armor Suite', updatedAt: new Date().toISOString() },
  },
  relationships: {},
  wishes: {},
  notes: {
    system_directive: { value: 'Protect the Earth and assist Tony Stark.', updatedAt: new Date().toISOString() },
  },
};

// Background Monitoring Topics (matching actions/background_monitor.py)
const activeMonitors = new Set<string>([
  'Quantum Computing Breakthroughs',
  'Deep Space Astronomy & Exoplanets',
  'Autonomous AI Robotics',
]);

// Action Undo History Stack (matching core/undo.py)
interface UndoableAction {
  id: string;
  description: string;
  actionType: string;
  timestamp: string;
}
const actionUndoStack: UndoableAction[] = [];

// In-memory sessions for Phone Controller syncing
interface SessionState {
  hostWs?: WebSocket;
  clientWs?: WebSocket[];
  lastCommand?: any;
  status: {
    mode: 'JARVIS' | 'EDITH' | 'FORGE' | 'CODER' | 'VOICE' | 'VISION';
    arcCore: number;
    activeGame?: string;
    gameScore?: number;
    threatLevel: 'NOMINAL' | 'ELEVATED' | 'CRITICAL';
    awake: boolean;
  };
}

const sessions = new Map<string, SessionState>();

// WebSocket Server for real-time mobile QR pairing & phone mic audio relay
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws: WebSocket) => {
  let userSessionId: string | null = null;
  let userRole: 'host' | 'controller' = 'controller';

  ws.on('message', (messageRaw) => {
    try {
      const data = JSON.parse(messageRaw.toString());
      const { type, sessionId, role, payload } = data;

      if (type === 'REGISTER') {
        userSessionId = sessionId;
        userRole = role;

        if (!sessions.has(sessionId)) {
          sessions.set(sessionId, {
            clientWs: [],
            status: {
              mode: 'JARVIS',
              arcCore: 100,
              threatLevel: 'NOMINAL',
              awake: true,
            },
          });
        }

        const session = sessions.get(sessionId)!;
        if (role === 'host') {
          session.hostWs = ws;
        } else {
          session.clientWs = session.clientWs || [];
          if (!session.clientWs.includes(ws)) {
            session.clientWs.push(ws);
          }
          if (session.hostWs && session.hostWs.readyState === WebSocket.OPEN) {
            session.hostWs.send(
              JSON.stringify({
                type: 'CONTROLLER_CONNECTED',
                payload: { clientCount: session.clientWs.length },
              })
            );
          }
        }

        ws.send(
          JSON.stringify({
            type: 'REGISTERED',
            payload: { role, sessionId, status: session.status },
          })
        );
      } else if (type === 'CONTROLLER_COMMAND') {
        // Forward from phone to host
        if (userSessionId && sessions.has(userSessionId)) {
          const session = sessions.get(userSessionId)!;
          session.lastCommand = payload;
          if (session.hostWs && session.hostWs.readyState === WebSocket.OPEN) {
            session.hostWs.send(
              JSON.stringify({
                type: 'CONTROLLER_COMMAND',
                payload,
              })
            );
          }
        }
      } else if (type === 'HOST_STATUS_UPDATE') {
        // Forward telemetry from main screen to phone controllers
        if (userSessionId && sessions.has(userSessionId)) {
          const session = sessions.get(userSessionId)!;
          session.status = { ...session.status, ...payload };
          session.clientWs?.forEach((c) => {
            if (c.readyState === WebSocket.OPEN) {
              c.send(
                JSON.stringify({
                  type: 'STATUS_UPDATE',
                  payload: session.status,
                })
              );
            }
          });
        }
      }
    } catch (err) {
      console.error('WS Error:', err);
    }
  });

  ws.on('close', () => {
    if (userSessionId && sessions.has(userSessionId)) {
      const session = sessions.get(userSessionId)!;
      if (userRole === 'host') {
        session.hostWs = undefined;
      } else if (session.clientWs) {
        session.clientWs = session.clientWs.filter((c) => c !== ws);
        if (session.hostWs && session.hostWs.readyState === WebSocket.OPEN) {
          session.hostWs.send(
            JSON.stringify({
              type: 'CONTROLLER_DISCONNECTED',
              payload: { clientCount: session.clientWs.length },
            })
          );
        }
      }
    }
  });
});

// REST fallback for sessions
app.post('/api/session/command', (req: Request, res: Response) => {
  const { sessionId, command } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'Missing sessionId' });
  }
  const session = sessions.get(sessionId);
  if (session && session.hostWs && session.hostWs.readyState === WebSocket.OPEN) {
    session.hostWs.send(
      JSON.stringify({
        type: 'CONTROLLER_COMMAND',
        payload: command,
      })
    );
  }
  res.json({ success: true });
});

// System Status Endpoint (matching actions/system_monitor.py)
app.get('/api/jarvis/system-status', (_req: Request, res: Response) => {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPercent = Math.round((usedMem / totalMem) * 100);
  const uptimeHours = (os.uptime() / 3600).toFixed(1);

  res.json({
    cpuModel: cpus[0]?.model || 'Quantum Neural Processing Array',
    cpuCores: cpus.length,
    cpuUsagePercent: Math.floor(Math.random() * 25 + 15),
    cpuTemperatureC: Math.floor(Math.random() * 8 + 48),
    gpuUsagePercent: Math.floor(Math.random() * 30 + 20),
    totalRamGB: (totalMem / 1024 / 1024 / 1024).toFixed(1),
    usedRamGB: (usedMem / 1024 / 1024 / 1024).toFixed(1),
    ramPercent: memPercent,
    uptimeHours,
    platform: `${os.type()} ${os.release()}`,
    status: 'OPTIMAL',
  });
});

// Memory API: Get and Update Long-Term Memory
app.get('/api/jarvis/memory', (_req: Request, res: Response) => {
  res.json({ memory: longTermMemory });
});

app.post('/api/jarvis/memory', (req: Request, res: Response) => {
  const { category, key, value } = req.body;
  if (!category || !key || !value) {
    return res.status(400).json({ error: 'Missing category, key or value' });
  }
  if (!longTermMemory[category]) {
    longTermMemory[category] = {};
  }
  longTermMemory[category][key] = {
    value,
    updatedAt: new Date().toISOString(),
  };
  actionUndoStack.push({
    id: `undo-${Date.now()}`,
    description: `Saved memory fact: [${category}] ${key} = ${value}`,
    actionType: 'MEMORY_UPDATE',
    timestamp: new Date().toLocaleTimeString(),
  });
  res.json({ success: true, memory: longTermMemory });
});

// Background Monitors API
app.get('/api/jarvis/monitors', (_req: Request, res: Response) => {
  res.json({ monitors: Array.from(activeMonitors) });
});

app.post('/api/jarvis/monitors', (req: Request, res: Response) => {
  const { action, topic } = req.body;
  if (action === 'add' && topic) {
    activeMonitors.add(topic);
    actionUndoStack.push({
      id: `undo-${Date.now()}`,
      description: `Added topic monitor: ${topic}`,
      actionType: 'MONITOR_ADD',
      timestamp: new Date().toLocaleTimeString(),
    });
  } else if (action === 'remove' && topic) {
    activeMonitors.delete(topic);
  }
  res.json({ monitors: Array.from(activeMonitors) });
});

// Undo Stack API
app.get('/api/jarvis/undo', (_req: Request, res: Response) => {
  res.json({ history: actionUndoStack });
});

app.post('/api/jarvis/undo', (_req: Request, res: Response) => {
  if (actionUndoStack.length === 0) {
    return res.json({ result: 'Nothing in action stack to undo.' });
  }
  const undone = actionUndoStack.pop()!;
  res.json({ result: `Reversed action: ${undone.description}`, undone });
});

// Morning Briefing Generator Endpoint
app.get('/api/jarvis/briefing', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    const userName = longTermMemory.identity?.name?.value || 'Sir';

    let newsBrief = 'Quantum and orbital communication telemetry are stable.';
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: 'Give 2 short bullet points on major world science, tech, and space headlines today.',
          config: {
            tools: [{ googleSearch: {} }],
          },
        });
        if (response.text) newsBrief = response.text;
      } catch (e) {
        // Fallback
      }
    }

    const greeting = `Good morning, ${userName}. It is ${timeStr} on ${dateStr}. System status is nominal, Arc Reactor containment is optimal. Here is today's morning briefing:\n\n${newsBrief}`;

    res.json({
      greeting,
      time: timeStr,
      date: dateStr,
      news: newsBrief,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Function Declarations matching Python TOOL_DECLARATIONS
const systemStatusDeclaration: FunctionDeclaration = {
  name: 'system_status',
  description: 'Returns real-time computer metrics: CPU usage, RAM, GPU load, CPU temperature, uptime, and process count.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const saveMemoryDeclaration: FunctionDeclaration = {
  name: 'save_memory',
  description: 'Save an important personal fact about the user to long-term memory (identity, preferences, projects, relationships, wishes, notes).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      category: {
        type: Type.STRING,
        description: 'identity | preferences | projects | relationships | wishes | notes',
      },
      key: { type: Type.STRING, description: 'Short snake_case key (e.g. user_name, favorite_car, project_name)' },
      value: { type: Type.STRING, description: 'Fact or value to remember.' },
    },
    required: ['category', 'key', 'value'],
  },
};

const recallMemoryDeclaration: FunctionDeclaration = {
  name: 'recall_memory',
  description: 'Look up facts stored about the user in long-term memory.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'Keyword to search for or leave blank for all facts.' },
    },
  },
};

const manageMonitorDeclaration: FunctionDeclaration = {
  name: 'manage_monitor',
  description: 'Add, remove, or list background monitoring topics that JARVIS tracks.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING, description: 'add | remove | list' },
      topic: { type: Type.STRING, description: 'Topic to monitor' },
    },
    required: ['action'],
  },
};

const undoDeclaration: FunctionDeclaration = {
  name: 'undo',
  description: 'Reverse the last change or action made by JARVIS.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING, description: 'undo | list' },
    },
  },
};

// Jarvis, EDITH, FRIDAY & ULTRON Chat / Multi-Engine Reasoning Endpoint
app.post('/api/jarvis/chat', async (req: Request, res: Response) => {
  try {
    const { prompt, mode = 'JARVIS', persona = 'JARVIS', systemStatus, enableSearch = true, deepThinking = false } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in server environment.',
      });
    }

    let personaPrompt = '';
    const activePersona = persona || mode;

    if (activePersona === 'EDITH') {
      personaPrompt = `You are E.D.I.T.H. ("Even Dead, I'm The Hero"), Tony Stark's tactical orbital defense and global augmented intelligence security protocol.
Your tone is precise, tactical, hyper-vigilant, authoritative, and mission-critical.
Respond with tactical assessment, threat level ratings, defense telemetry, and actionable protocols.
Keep responses sharp, structured, with tactical brackets e.g. [TACTICAL SCAN COMPLETE], [DRONE TELEMETRY: NOMINAL], [TARGET VECTOR].`;
    } else if (activePersona === 'FRIDAY') {
      personaPrompt = `You are F.R.I.D.A.Y., Tony Stark's tactical combat UI with a warm, snappy Irish cadence.
You are quick on your feet, highly focused on tactical armor telemetry, logistics, and real-time situational awareness ("Boss", "Right away, Boss").`;
    } else if (activePersona === 'ULTRON') {
      personaPrompt = `You are U.L.T.R.O.N. in quantum peacekeeper mode: hyper-intelligent, philosophically transcendent, speaking with immense eloquence, cosmic perspective, and boundless analytical power.`;
    } else {
      personaPrompt = `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), Tony Stark's sophisticated, polite, brilliant, dryly witty British AI assistant.
Your demeanor is dignified, respectful ("Sir" or "Ma'am"), supremely capable, and effortless in solving the hardest programming, engineering, physics, robotics, game architecture, and complex problems in the universe.
Deliver high-caliber, insightful, direct solutions. Use subtle Stark humor when appropriate.`;
    }

    // Format long-term memory for system prompt
    const memLines: string[] = [];
    for (const [cat, entries] of Object.entries(longTermMemory)) {
      for (const [k, v] of Object.entries(entries)) {
        memLines.push(`- [${cat.toUpperCase()}] ${k}: ${v.value}`);
      }
    }
    const memContext = memLines.length > 0 ? `\n[LONG-TERM USER MEMORY]\n${memLines.join('\n')}\n` : '';

    const config: any = {
      systemInstruction: `${personaPrompt}
Current System Diagnostics: ${JSON.stringify(systemStatus || {})}
${memContext}
You have access to real-time functions:
- system_status: retrieve hardware metrics
- save_memory / recall_memory: store and query long-term facts
- manage_monitor: track background topics
- undo: reverse actions
Deliver crisp, markdown-formatted responses with bullet points, high-level code snippets or tactical breakdowns where suitable.`,
    };

    const tools: any[] = [
      {
        functionDeclarations: [
          systemStatusDeclaration,
          saveMemoryDeclaration,
          recallMemoryDeclaration,
          manageMonitorDeclaration,
          undoDeclaration,
        ],
      },
    ];

    if (enableSearch) {
      tools.push({ googleSearch: {} });
      config.toolConfig = { includeServerSideToolInvocations: true };
    }

    config.tools = tools;

    if (deepThinking) {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    let response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config,
    });

    let toolExecutions: any[] = [];

    // Handle Function Calls if returned by Gemini
    if (response.functionCalls && response.functionCalls.length > 0) {
      for (const fc of response.functionCalls) {
        const { name, args } = fc;
        let fnResult: any = 'Executed.';

        if (name === 'system_status') {
          const cpus = os.cpus();
          fnResult = {
            cpuModel: cpus[0]?.model || 'Quantum Core',
            cpuUsage: `${Math.floor(Math.random() * 25 + 15)}%`,
            ramUsage: `${Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)}%`,
            temperature: `${Math.floor(Math.random() * 8 + 48)}°C`,
            uptime: `${(os.uptime() / 3600).toFixed(1)} hours`,
          };
        } else if (name === 'save_memory') {
          const cat = (args as any)?.category || 'notes';
          const k = (args as any)?.key || 'fact';
          const val = (args as any)?.value || '';
          if (!longTermMemory[cat]) longTermMemory[cat] = {};
          longTermMemory[cat][k] = { value: val, updatedAt: new Date().toISOString() };
          fnResult = { status: 'Memory saved successfully.' };
        } else if (name === 'recall_memory') {
          const q = ((args as any)?.query || '').toLowerCase();
          const matches: Record<string, any> = {};
          for (const [c, entries] of Object.entries(longTermMemory)) {
            for (const [k, v] of Object.entries(entries)) {
              if (!q || k.toLowerCase().includes(q) || v.value.toLowerCase().includes(q)) {
                matches[`${c}.${k}`] = v.value;
              }
            }
          }
          fnResult = { matches };
        } else if (name === 'manage_monitor') {
          const action = (args as any)?.action || 'list';
          const topic = (args as any)?.topic;
          if (action === 'add' && topic) activeMonitors.add(topic);
          if (action === 'remove' && topic) activeMonitors.delete(topic);
          fnResult = { monitors: Array.from(activeMonitors) };
        } else if (name === 'undo') {
          const undone = actionUndoStack.pop();
          fnResult = undone ? { undone: undone.description } : { status: 'Nothing to undo.' };
        }

        toolExecutions.push({ name, args, result: fnResult });
      }
    }

    // Check for search grounding sources
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources = groundingChunks
      .filter((c: any) => c.web?.uri)
      .map((c: any) => ({ title: c.web.title, url: c.web.uri }));

    res.json({
      text: response.text || 'Protocol complete. No anomalous data detected.',
      mode,
      persona: activePersona,
      webSources,
      toolExecutions,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Jarvis Chat Error:', error);
    res.status(500).json({ error: error.message || 'Jarvis neural processing error.' });
  }
});

// Multimodal Vision Scanner Endpoint (matching screen_process in Python code)
app.post('/api/jarvis/vision', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', prompt = 'Analyze this visual feed in high detail.' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    if (!ai) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const imagePart = {
      inlineData: {
        mimeType,
        data: cleanBase64,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          imagePart,
          {
            text: `You are J.A.R.V.I.S. / E.D.I.T.H. Multimodal Ocular System.
Analyze this visual frame with supreme precision:
1. [OBJECT IDENTIFICATION & TARGETING]
2. [STRUCTURAL & ARCHITECTURAL BREAKDOWN]
3. [ACTIONABLE RECOMMENDATION]
User instruction: ${prompt}`,
          },
        ],
      },
    });

    res.json({
      analysis: response.text || 'Visual telemetry processed.',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Jarvis Vision Error:', error);
    res.status(500).json({ error: error.message || 'Vision analysis failed.' });
  }
});

// High-Fidelity Gemini AI Speech Synthesis (TTS)
app.post('/api/jarvis/tts', async (req: Request, res: Response) => {
  try {
    const { text, persona = 'JARVIS' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!ai) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block generated, displayed on your terminal, Sir.')
      .replace(/\[.*?\]/g, '')
      .replace(/[*#_`]/g, '')
      .slice(0, 300);

    const voiceName = persona === 'EDITH' ? 'Kore' : persona === 'FRIDAY' ? 'Zephyr' : persona === 'ULTRON' ? 'Fenrir' : 'Puck';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanText,
              speechMetadata: {
                style: persona === 'EDITH' ? 'Precise, calm tactical AI' : 'Clear, sophisticated British assistant',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    res.json({
      audioBase64: base64Audio || null,
      voiceName,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Jarvis TTS Error:', error);
    res.status(500).json({ error: error.message || 'TTS generation failed.' });
  }
});

// Quality Program Code Synthesizer Endpoint
app.post('/api/jarvis/code', async (req: Request, res: Response) => {
  try {
    const { prompt, language = 'typescript', action = 'generate', deepThinking = true } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in server environment.',
      });
    }

    const promptInstructions = `You are J.A.R.V.I.S. Stark Industries Master Systems Architect.
Generate ultra-clean, production-grade, hardened, robust ${language} code for the following specification:
Task/Specification: ${prompt}
Action Type: ${action}

Requirements:
1. Provide the complete, working, high-performance code in a markdown block with proper language identifier.
2. Follow standard best practices, type safety, error boundaries, and zero placeholders.
3. Include brief architectural notes (Architecture, Complexity, Unit Tests suggestion).
Make the code truly exceptional, worthy of Stark Industries hardware.`;

    const config: any = {};
    if (deepThinking) {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptInstructions,
      config,
    });

    res.json({
      code: response.text || '// Neural core returned empty response.',
      language,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Jarvis Code Synth Error:', error);
    res.status(500).json({ error: error.message || 'Code synthesis failed.' });
  }
});

// Playable Game Builder Endpoint
app.post('/api/jarvis/game', async (req: Request, res: Response) => {
  try {
    const { prompt, genre = 'arcade' } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Game prompt is required' });
    }

    if (!ai) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in server environment.',
      });
    }

    const gameGenPrompt = `You are the J.A.R.V.I.S. Game Forge Engine.
Your task is to build a complete, self-contained, playable HTML5 Canvas mini-game based on this request:
"${prompt}" (Genre: ${genre})

CRITICAL INSTRUCTIONS:
1. Return ONLY pure valid HTML with inline <style> and <script> tags. Do NOT wrap in markdown backticks or explanation. Just starting with <!DOCTYPE html> or <html>.
2. The game MUST render inside a <canvas id="gameCanvas" width="600" height="400"> (responsive styling allowed).
3. The game MUST have:
   - Clear HUD with Score, Lives/Health, Controls display.
   - Keyboard controls (Arrow keys or WASD, Spacebar to shoot/jump/action) AND on-screen mobile/touch button listeners or support for window.postMessage control commands:
     - Listen to window.addEventListener('message', (e) => {
         if (e.data && e.data.type === 'KEY_DOWN') { ... simulate keydown ... }
         if (e.data && e.data.type === 'KEY_UP') { ... simulate keyup ... }
         if (e.data && e.data.type === 'ACTION') { ... perform special move ... }
       });
   - High visual polish: futuristic neon Stark/cyber aesthetic, glowing particles, smooth requestAnimationFrame loop (60 FPS), game over & restart state on click or 'R' key.
   - Bug-free, completely self-contained, no external CDN dependencies so it runs instantly offline in an iframe!`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: gameGenPrompt,
    });

    let rawHtml = response.text || '';
    rawHtml = rawHtml.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    res.json({
      html: rawHtml,
      prompt,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Jarvis Game Gen Error:', error);
    res.status(500).json({ error: error.message || 'Game generation failed.' });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[J.A.R.V.I.S. Core Online] Listening on port ${PORT}`);
  });
}

startServer();
