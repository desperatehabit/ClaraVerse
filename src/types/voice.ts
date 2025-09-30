import { Room } from 'livekit-client';

export interface VoiceSettings {
  // Voice Activity Detection settings
  vadEnabled: boolean;
  vadSensitivity: number;
  vadThreshold: number;

  // TTS settings
  ttsEnabled: boolean;
  ttsEngine: 'gtts' | 'pyttsx3' | 'kokoro' | 'kokoro-onnx' | 'auto';
  ttsVoice: string;
  ttsSpeed: number;
  ttsAutoPlay: boolean;

  // STT settings
  sttEnabled: boolean;
  sttEngine: 'whisper' | 'google' | 'azure';
  sttLanguage: string;

  // Audio settings
  audioInputDevice: string | null;
  audioOutputDevice: string | null;
  noiseReduction: boolean;
  echoCancellation: boolean;

  // Behavior settings
  autoStartVoiceMode: boolean;
  pushToTalk: boolean;
  pushToTalkKey: string;
  voiceActivationThreshold: number;

  // New provider settings
  activeProviderId?: string;
  providerSettings?: {
    [providerId: string]: Record<string, any>;
  };
}

export interface ProviderSetting {
  key: string;
  label: string;
  type: 'text' | 'password';
}

export interface VoiceProvider {
  id: string;
  name: string;
  settings: ProviderSetting[];
}

export interface VoiceState {
  // Core state
  isEnabled: boolean;
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;

  // Connection state
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  localTrack: any;

  // Audio levels
  inputLevel: number;
  outputLevel: number;

  // Error state
  error: string | null;

  // Settings
  settings: VoiceSettings;

  // Session info
  sessionId: string | null;
  lastActivity: Date | null;
  transcript: any[];
}

export interface VoiceActions {
  // Core actions
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  toggle: () => Promise<void>;

  // Audio control
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  sendAudio: (audioBlob: Blob) => Promise<void>;

  // TTS control
  speak: (text: string, options?: { voice?: string; speed?: number }) => Promise<void>;
  stopSpeaking: () => Promise<void>;

  // Settings
  updateSettings: (settings: Partial<VoiceSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;

  // Connection
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;

  // Health check
  checkHealth: () => Promise<boolean>;
}

export interface VoiceContextType extends VoiceState, VoiceActions {
  // Additional computed properties
  isReady: boolean;
  canListen: boolean;
  canSpeak: boolean;
  isActive: boolean;
  room: Room | null;
  localTrack: any;
}

export interface VoiceServiceEvents {
  stateChange: (state: VoiceState) => void;
  error: (error: string) => void;
  audioLevel: (input: number, output: number) => void;
  speechStart: () => void;
  speechEnd: () => void;
  speakingStart: () => void;
  speakingEnd: () => void;
  contextCommandsChanged: (commands: string[]) => void;
}

export interface VoiceServiceConfig {
  autoConnect: boolean;
  reconnectAttempts: number;
  reconnectDelay: number;
  healthCheckInterval: number;
  sessionTimeout: number;
}