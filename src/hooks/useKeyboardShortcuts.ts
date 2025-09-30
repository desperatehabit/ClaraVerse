import { useEffect, useRef, useState, useCallback } from 'react';
import { KeyboardService } from '../services/keyboard/KeyboardService';
import { KeyboardShortcut, KeyboardShortcutConfig, KeyboardServiceEvents } from '../types/keyboard';
import { VoiceService } from '../services/voice/VoiceService';

export interface UseKeyboardShortcutsOptions {
  voiceService: VoiceService;
  autoStart?: boolean;
  enabled?: boolean;
}

export interface UseKeyboardShortcutsReturn {
  keyboardService: KeyboardService;
  shortcuts: KeyboardShortcut[];
  config: KeyboardShortcutConfig;
  isListening: boolean;
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (shortcutId: string) => void;
  updateConfig: (config: Partial<KeyboardShortcutConfig>) => void;
  startListening: () => void;
  stopListening: () => void;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions): UseKeyboardShortcutsReturn {
  const { voiceService, autoStart = true, enabled = true } = options;
  const keyboardServiceRef = useRef<KeyboardService | null>(null);
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [config, setConfig] = useState<KeyboardShortcutConfig | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Initialize keyboard service
  useEffect(() => {
    if (!keyboardServiceRef.current) {
      keyboardServiceRef.current = new KeyboardService(voiceService);
    }

    return () => {
      if (keyboardServiceRef.current) {
        keyboardServiceRef.current.destroy();
        keyboardServiceRef.current = null;
      }
    };
  }, [voiceService]);

  // Set up event listeners
  useEffect(() => {
    const keyboardService = keyboardServiceRef.current;
    if (!keyboardService) return;

    const handleShortcutRegistered = (shortcut: KeyboardShortcut) => {
      setShortcuts(prev => [...prev, shortcut]);
    };

    const handleShortcutUnregistered = (shortcutId: string) => {
      setShortcuts(prev => prev.filter(s => s.id !== shortcutId));
    };

    const handleConfigChanged = (newConfig: KeyboardShortcutConfig) => {
      setConfig(newConfig);
    };

    const handleShortcutTriggered = (shortcut: KeyboardShortcut) => {
      // Handle any UI feedback for shortcut triggers
      console.log('Shortcut triggered:', shortcut.name);
    };

    keyboardService.addEventListener('shortcutRegistered', handleShortcutRegistered);
    keyboardService.addEventListener('shortcutUnregistered', handleShortcutUnregistered);
    keyboardService.addEventListener('configChanged', handleConfigChanged);
    keyboardService.addEventListener('shortcutTriggered', handleShortcutTriggered);

    // Initialize state
    setShortcuts(keyboardService.getAllShortcuts());
    setConfig(keyboardService.getConfig());

    return () => {
      keyboardService.removeEventListener('shortcutRegistered', handleShortcutRegistered);
      keyboardService.removeEventListener('shortcutUnregistered', handleShortcutUnregistered);
      keyboardService.removeEventListener('configChanged', handleConfigChanged);
      keyboardService.removeEventListener('shortcutTriggered', handleShortcutTriggered);
    };
  }, []);

  // Auto-start listening if enabled
  useEffect(() => {
    const keyboardService = keyboardServiceRef.current;
    if (!keyboardService || !enabled) return;

    if (autoStart) {
      keyboardService.startListening();
      setIsListening(true);
    }

    return () => {
      if (keyboardService) {
        keyboardService.stopListening();
        setIsListening(false);
      }
    };
  }, [autoStart, enabled]);

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    keyboardServiceRef.current?.register(shortcut);
  }, []);

  const unregisterShortcut = useCallback((shortcutId: string) => {
    keyboardServiceRef.current?.unregister(shortcutId);
  }, []);

  const updateConfig = useCallback((newConfig: Partial<KeyboardShortcutConfig>) => {
    keyboardServiceRef.current?.updateConfig(newConfig);
  }, []);

  const startListening = useCallback(() => {
    keyboardServiceRef.current?.startListening();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    keyboardServiceRef.current?.stopListening();
    setIsListening(false);
  }, []);

  return {
    keyboardService: keyboardServiceRef.current!,
    shortcuts,
    config: config!,
    isListening,
    registerShortcut,
    unregisterShortcut,
    updateConfig,
    startListening,
    stopListening,
  };
}