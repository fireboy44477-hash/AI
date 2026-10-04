export type SystemMode = 'JARVIS' | 'EDITH' | 'FORGE' | 'CODER' | 'PLUGINS' | 'VOICE' | 'VISION';

export type StarkPersona = 'JARVIS' | 'EDITH' | 'FRIDAY' | 'ULTRON';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'jarvis' | 'edith' | 'friday' | 'ultron' | 'system';
  text: string;
  timestamp: string;
  codeSnippet?: {
    language: string;
    code: string;
  };
  gameData?: {
    title: string;
    html: string;
  };
  webSources?: Array<{ title: string; url: string }>;
  actionTaken?: string;
}

export interface PluginModule {
  id: string;
  name: string;
  codename: string;
  category: 'CORE' | 'TACTICAL' | 'DEV' | 'QUANTUM' | 'PERIPHERAL';
  description: string;
  enabled: boolean;
  version: string;
  loadPercentage: number;
  iconName: string;
}

export interface DroneTelemetry {
  id: string;
  callsign: string;
  altitudeMeters: number;
  batteryPercent: number;
  status: 'PATROLLING' | 'LOCKED_ON' | 'STANDBY' | 'ENGAGING';
  targetDistanceKm: number;
  coordinates: { lat: number; lng: number };
}

export interface BuiltinGame {
  id: string;
  title: string;
  genre: string;
  difficulty: 'EASY' | 'MODERATE' | 'TACTICAL';
  description: string;
  html: string;
  highScore: number;
}

export interface ControllerCommand {
  type: 'KEY_DOWN' | 'KEY_UP' | 'ACTION' | 'PROTOCOL' | 'VOICE_COMMAND' | 'MODE_SWITCH';
  key?: string;
  action?: 'FIRE' | 'BOOST' | 'SPECIAL' | 'RESTART' | 'PAUSE';
  protocol?: string;
  voiceText?: string;
  mode?: SystemMode;
  timestamp: number;
}
