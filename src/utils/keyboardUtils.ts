import { Platform } from '../types/keyboard';

/**
 * Utility functions for keyboard shortcuts and cross-platform support
 */

export const getPlatform = (): Platform => {
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('mac')) return 'mac';
  if (userAgent.includes('win')) return 'win';
  return 'linux';
};

export const isMac = (): boolean => getPlatform() === 'mac';
export const isWindows = (): boolean => getPlatform() === 'win';
export const isLinux = (): boolean => getPlatform() === 'linux';

export const formatKeyForDisplay = (key: string): string => {
  const displayKeys: Record<string, string> = {
    'ctrl': isMac() ? '⌃' : 'Ctrl',
    'alt': isMac() ? '⌥' : 'Alt',
    'shift': '⇧',
    'meta': isMac() ? '⌘' : '⊞',
    'cmd': isMac() ? '⌘' : 'Ctrl',
    ' ': 'Space',
    'arrowup': '↑',
    'arrowdown': '↓',
    'arrowleft': '←',
    'arrowright': '→',
    'enter': '↵',
    'return': '↵',
    'escape': 'Esc',
    'esc': 'Esc',
    'tab': 'Tab',
    'capslock': 'Caps',
    'backspace': '⌫',
    'delete': 'Del',
    'home': 'Home',
    'end': 'End',
    'pageup': 'PgUp',
    'pagedown': 'PgDn',
    'insert': 'Ins',
    'f1': 'F1',
    'f2': 'F2',
    'f3': 'F3',
    'f4': 'F4',
    'f5': 'F5',
    'f6': 'F6',
    'f7': 'F7',
    'f8': 'F8',
    'f9': 'F9',
    'f10': 'F10',
    'f11': 'F11',
    'f12': 'F12',
  };

  return displayKeys[key.toLowerCase()] || key.toUpperCase();
};

export const formatShortcutForDisplay = (keyCombination: {
  key: string;
  modifiers: string[];
}): string => {
  const parts = [];

  // Add modifiers in the correct order for each platform
  const modifierOrder = isMac() ? ['ctrl', 'alt', 'shift', 'cmd'] : ['ctrl', 'alt', 'shift'];

  modifierOrder.forEach(modifier => {
    if (keyCombination.modifiers.includes(modifier)) {
      parts.push(formatKeyForDisplay(modifier));
    }
  });

  // Add the main key
  parts.push(formatKeyForDisplay(keyCombination.key));

  return parts.join(isMac() ? '' : '+');
};

export const normalizeKeyEvent = (event: KeyboardEvent): {
  key: string;
  modifiers: string[];
  normalizedKey: string;
} => {
  const modifiers: string[] = [];

  if (event.ctrlKey || event.metaKey) modifiers.push('ctrl');
  if (event.altKey) modifiers.push('alt');
  if (event.shiftKey) modifiers.push('shift');
  if (event.metaKey) modifiers.push('meta');

  // Normalize the key
  let normalizedKey = event.key.toLowerCase();

  // Handle special cases
  if (normalizedKey === ' ') normalizedKey = 'space';
  if (normalizedKey.startsWith('arrow')) normalizedKey = normalizedKey.replace('arrow', '');
  if (normalizedKey === 'escape') normalizedKey = 'esc';

  return {
    key: event.key,
    modifiers,
    normalizedKey,
  };
};

export const isKeyCombinationPressed = (
  event: KeyboardEvent,
  keyCombination: { key: string; modifiers: string[] }
): boolean => {
  const { normalizedKey, modifiers } = normalizeKeyEvent(event);

  // Check if the main key matches
  const keyMatches = normalizedKey === keyCombination.key.toLowerCase();
  if (!keyMatches) return false;

  // Check if all required modifiers are present
  const requiredModifiers = new Set(keyCombination.modifiers.map(m => m.toLowerCase()));
  const pressedModifiers = new Set(modifiers);

  for (const modifier of requiredModifiers) {
    if (!pressedModifiers.has(modifier)) return false;
  }

  // Check that no extra modifiers are pressed (optional - can be made configurable)
  // For now, we'll be lenient and allow extra modifiers

  return true;
};

export const createKeyCombination = (
  key: string,
  modifiers: string[] = []
): { key: string; modifiers: string[] } => {
  return {
    key: key.toLowerCase(),
    modifiers: modifiers.map(m => m.toLowerCase()),
  };
};

// Common key combinations for voice features
export const VOICE_SHORTCUTS = {
  TOGGLE_VOICE_MODE: createKeyCombination('v', ['ctrl', 'shift']),
  QUICK_RECORDING: createKeyCombination('m', ['ctrl', 'shift']),
  VOICE_COMMAND_MODE: createKeyCombination('c', ['ctrl', 'shift']),
  TASK_VOICE_COMMANDS: createKeyCombination('t', ['ctrl', 'shift']),
  VOICE_SETTINGS: createKeyCombination('s', ['ctrl', 'shift']),
} as const;

export const getShortcutDisplayName = (shortcutKey: string): string => {
  const names: Record<string, string> = {
    'TOGGLE_VOICE_MODE': 'Voice Mode Toggle',
    'QUICK_RECORDING': 'Quick Voice Recording',
    'VOICE_COMMAND_MODE': 'Voice Command Mode',
    'TASK_VOICE_COMMANDS': 'Task Voice Commands',
    'VOICE_SETTINGS': 'Voice Settings',
  };
  return names[shortcutKey] || shortcutKey;
};