export interface VoiceCommand {
  id: string;
  name: string;
  description: string;
  category: VoiceCommandCategory;
  patterns: string[];
  parameters?: VoiceCommandParameter[];
  handler: string;
  requiresConfirmation?: boolean;
  sensitive?: boolean;
  examples: string[];
}

export interface VoiceCommandParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'url' | 'application' | 'file' | 'folder';
  required: boolean;
  description: string;
  validation?: (value: unknown) => boolean;
}

export enum VoiceCommandCategory {
  BROWSER = 'browser',
  SYSTEM = 'system',
  APPLICATION = 'application',
  FILESYSTEM = 'filesystem',
  WEB_INTERACTION = 'web_interaction',
  MEDIA = 'media',
  PRODUCTIVITY = 'productivity',
  COMMUNICATION = 'communication',
  NAVIGATION = 'navigation',
  DEVELOPMENT = 'development'
}

export interface ParsedCommand {
  command: VoiceCommand;
  parameters: Record<string, unknown>;
  confidence: number;
  rawText: string;
}

export interface VoiceCommandResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  requiresConfirmation?: boolean;
  confirmationType?: 'warning' | 'danger' | 'info';
}

export interface VoiceCommandContext {
  activeApplication?: string;
  activeWindow?: string;
  currentUrl?: string;
  systemInfo: {
    platform: string;
    version: string;
  };
  userPermissions: string[];
}

export interface CommandAnalysisResult {
  command: VoiceCommand;
  context: {
    type: string;
    confidence: number;
    metadata: Record<string, unknown>;
    timestamp: Date;
    source: string;
  };
  parameters: Record<string, unknown>;
  confidence: number;
  rawText: string;
  suggestedActions: string[];
  relatedCommands: string[];
}

export interface SafetyRule {
  id: string;
  name: string;
  description: string;
  patterns: string[];
  action: 'block' | 'warn' | 'require_confirmation';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface VoiceCommandSettings {
  enabledCategories: VoiceCommandCategory[];
  safetyLevel: 'strict' | 'moderate' | 'permissive';
  confirmSensitiveCommands: boolean;
  confirmSystemCommands: boolean;
  autoExecuteSafeCommands: boolean;
  maxCommandHistory: number;
  enableCommandLearning: boolean;
  customCommands: VoiceCommand[];
}

export interface VoiceCommandHistory {
  id: string;
  timestamp: Date;
  command: string;
  parsedCommand?: ParsedCommand;
  result: VoiceCommandResult;
  context: VoiceCommandContext;
}

export interface SystemCapabilities {
  browser: {
    supported: boolean;
    availableBrowsers: string[];
    canControlTabs: boolean;
    canAutomateForms: boolean;
  };
  system: {
    supported: boolean;
    canControlVolume: boolean;
    canAdjustBrightness: boolean;
    canLockScreen: boolean;
    canTakeScreenshots: boolean;
  };
  applications: {
    supported: boolean;
    canLaunchApps: boolean;
    canSwitchApps: boolean;
    canCloseApps: boolean;
  };
  filesystem: {
    supported: boolean;
    canReadFiles: boolean;
    canWriteFiles: boolean;
    canCreateFolders: boolean;
  };
}