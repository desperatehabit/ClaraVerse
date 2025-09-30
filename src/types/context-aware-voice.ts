// Context-Aware Voice System Types
export enum VoiceContextType {
  TASKS = 'tasks',
  CHAT = 'chat',
  SETTINGS = 'settings',
  BROWSER = 'browser',
  SYSTEM = 'system',
  DASHBOARD = 'dashboard',
  DEVELOPMENT = 'development',
  MEDIA = 'media',
  PRODUCTIVITY = 'productivity',
  COMMUNICATION = 'communication',
  NAVIGATION = 'navigation',
  UNKNOWN = 'unknown'
}

export interface ContextInfo {
  type: VoiceContextType;
  confidence: number;
  metadata: Record<string, any>;
  timestamp: Date;
  source: 'route' | 'url' | 'active_element' | 'user_activity' | 'manual';
}

export interface ContextualVoiceSettings {
  contextType: VoiceContextType;
  enabledCommands: string[];
  disabledCommands: string[];
  customCommands: VoiceCommand[];
  voiceConfig: {
    ttsEngine?: 'gtts' | 'pyttsx3' | 'kokoro' | 'kokoro-onnx' | 'auto';
    ttsVoice?: string;
    ttsSpeed?: number;
    sttEngine?: 'whisper' | 'google' | 'azure';
    sttLanguage?: string;
    vadSensitivity?: number;
    autoStartListening?: boolean;
    pushToTalk?: boolean;
  };
  behaviorConfig: {
    autoSuggestCommands: boolean;
    confirmSensitiveCommands: boolean;
    showCommandHints: boolean;
    adaptiveResponses: boolean;
    contextAnnouncements: boolean;
  };
  priority: number;
  isActive: boolean;
}

export interface VoiceCommandContext {
  command: VoiceCommand;
  context: ContextInfo;
  parameters: Record<string, any>;
  confidence: number;
  rawText: string;
  suggestedActions: string[];
  relatedCommands: string[];
}

export interface ContextTransition {
  fromContext: VoiceContextType;
  toContext: VoiceContextType;
  timestamp: Date;
  reason: 'navigation' | 'user_activity' | 'manual' | 'timeout' | 'error';
  smoothTransition: boolean;
  announcements: string[];
}

export interface UserContextPreferences {
  userId: string;
  contextPreferences: Record<VoiceContextType, {
    favoriteCommands: string[];
    avoidedCommands: string[];
    customSettings: Partial<ContextualVoiceSettings>;
    usagePatterns: {
      command: string;
      frequency: number;
      lastUsed: Date;
      successRate: number;
    }[];
    adaptiveBehavior: boolean;
    learningEnabled: boolean;
  }>;
  globalPreferences: {
    enableContextAwareness: boolean;
    transitionAnnouncements: boolean;
    adaptiveSuggestions: boolean;
    rememberContextHistory: boolean;
    maxContextHistory: number;
  };
  lastUpdated: Date;
}

export interface ContextSuggestion {
  id: string;
  context: VoiceContextType;
  command: string;
  description: string;
  confidence: number;
  reason: 'frequency' | 'recency' | 'context_relevance' | 'success_rate' | 'user_preference';
  metadata: Record<string, any>;
}

export interface VoiceContextMode {
  type: VoiceContextType;
  name: string;
  description: string;
  icon: string;
  color: string;
  availableCommands: string[];
  defaultSettings: Partial<ContextualVoiceSettings>;
  supportedFeatures: string[];
  examples: string[];
}

export interface ContextDetectionRule {
  id: string;
  name: string;
  description: string;
  priority: number;
  conditions: ContextCondition[];
  action: {
    setContext: VoiceContextType;
    confidence: number;
    metadata?: Record<string, any>;
  };
  enabled: boolean;
}

export interface ContextCondition {
  type: 'route' | 'url' | 'active_element' | 'user_activity' | 'time' | 'custom';
  operator: 'equals' | 'contains' | 'starts_with' | 'regex' | 'exists' | 'greater_than' | 'less_than';
  value: string | number | boolean;
  field?: string;
}

export interface ContextHistoryEntry {
  id: string;
  timestamp: Date;
  context: ContextInfo;
  commandsUsed: string[];
  successRate: number;
  sessionDuration: number;
  userSatisfaction?: number;
}

// Import existing types
import { VoiceCommand } from './voice-commands';