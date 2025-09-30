export type Platform = 'win' | 'mac' | 'linux';

export type KeyCode = string;

export type ModifierKey = 'ctrl' | 'alt' | 'shift' | 'meta' | 'cmd';

export interface KeyCombination {
  key: KeyCode;
  modifiers: ModifierKey[];
  platform?: Platform;
}

export interface KeyboardShortcut {
  id: string;
  name: string;
  description: string;
  combination: KeyCombination;
  category: 'voice' | 'task' | 'navigation' | 'general';
  action: () => void | Promise<void>;
  enabled?: boolean;
  contextual?: boolean;
  context?: string[];
}

export interface KeyboardShortcutConfig {
  shortcuts: Record<string, KeyboardShortcut>;
  globalEnabled: boolean;
  visualIndicators: boolean;
  preventDefault: boolean;
}

export interface KeyboardServiceEvents {
  shortcutTriggered: (shortcut: KeyboardShortcut) => void;
  shortcutRegistered: (shortcut: KeyboardShortcut) => void;
  shortcutUnregistered: (shortcutId: string) => void;
  configChanged: (config: KeyboardShortcutConfig) => void;
}

export interface KeyboardContext {
  isMac: boolean;
  isWindows: boolean;
  isLinux: boolean;
  platform: Platform;
}

export interface KeyboardShortcutDisplay {
  shortcut: KeyboardShortcut;
  displayText: string;
  isActive: boolean;
}

export interface IKeyboardService {
  register(shortcut: KeyboardShortcut): void;
  unregister(shortcutId: string): void;
  getShortcut(shortcutId: string): KeyboardShortcut | undefined;
  getAllShortcuts(): KeyboardShortcut[];
  getShortcutsByCategory(category: string): KeyboardShortcut[];
  updateShortcut(shortcutId: string, updates: Partial<KeyboardShortcut>): void;
  enableShortcut(shortcutId: string): void;
  disableShortcut(shortcutId: string): void;
  startListening(): void;
  stopListening(): void;
  updateConfig(config: Partial<KeyboardShortcutConfig>): void;
  getConfig(): KeyboardShortcutConfig;
  addEventListener<K extends keyof KeyboardServiceEvents>(
    event: K,
    listener: KeyboardServiceEvents[K]
  ): void;
  removeEventListener<K extends keyof KeyboardServiceEvents>(
    event: K,
    listener: KeyboardServiceEvents[K]
  ): void;
  destroy(): void;
}