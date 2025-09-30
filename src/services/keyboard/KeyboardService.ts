import { KeyboardShortcut, KeyboardShortcutConfig, KeyboardServiceEvents, KeyboardContext, Platform, KeyCombination, IKeyboardService } from '../../types/keyboard';
import { VoiceService } from '../voice/VoiceService';

export class KeyboardService implements IKeyboardService {
  private config: KeyboardShortcutConfig;
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private eventListeners: Map<keyof KeyboardServiceEvents, Set<Function>> = new Map();
  private context: KeyboardContext;
  private voiceService: VoiceService;
  private isListening = false;
  private pressedKeys = new Set<string>();

  constructor(voiceService: VoiceService) {
    this.voiceService = voiceService;
    this.context = this.detectPlatform();
    this.config = {
      shortcuts: {},
      globalEnabled: true,
      visualIndicators: true,
      preventDefault: true,
    };

    this.setupEventListeners();
    this.loadDefaultShortcuts();
  }

  private detectPlatform(): KeyboardContext {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMac = /macintosh|mac os x/.test(userAgent);
    const isWindows = /windows|win32|win64/.test(userAgent);
    const isLinux = /linux/.test(userAgent);

    let platform: Platform = 'linux';
    if (isMac) platform = 'mac';
    else if (isWindows) platform = 'win';

    return {
      isMac,
      isWindows,
      isLinux,
      platform,
    };
  }

  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    window.addEventListener('blur', this.handleWindowBlur.bind(this));

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pressedKeys.clear();
      }
    });
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.config.globalEnabled || !this.isListening) return;

    const key = event.key.toLowerCase();
    this.pressedKeys.add(key);

    // Add modifier keys to pressed keys
    if (event.ctrlKey || event.metaKey) this.pressedKeys.add('ctrl');
    if (event.altKey) this.pressedKeys.add('alt');
    if (event.shiftKey) this.pressedKeys.add('shift');
    if (event.metaKey) this.pressedKeys.add('meta');

    const triggeredShortcut = this.findTriggeredShortcut(event);
    if (triggeredShortcut) {
      event.preventDefault();
      event.stopPropagation();

      if (this.config.preventDefault) {
        event.preventDefault();
      }

      this.executeShortcut(triggeredShortcut);
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    this.pressedKeys.delete(key);

    // Remove modifier keys when released
    if (!event.ctrlKey && !event.metaKey) this.pressedKeys.delete('ctrl');
    if (!event.altKey) this.pressedKeys.delete('alt');
    if (!event.shiftKey) this.pressedKeys.delete('shift');
    if (!event.metaKey) this.pressedKeys.delete('meta');
  }

  private handleWindowBlur(): void {
    this.pressedKeys.clear();
  }

  private findTriggeredShortcut(event: KeyboardEvent): KeyboardShortcut | null {
    for (const shortcut of this.shortcuts.values()) {
      if (!shortcut.enabled) continue;

      const matches = this.keyCombinationMatches(shortcut.combination, event);
      if (matches) {
        return shortcut;
      }
    }
    return null;
  }

  private keyCombinationMatches(combination: KeyCombination, event: KeyboardEvent): boolean {
    const { key, modifiers } = combination;

    // Check if the main key matches
    const mainKeyMatches = key.toLowerCase() === event.key.toLowerCase() ||
                          this.normalizeKey(key) === this.normalizeKey(event.key);

    if (!mainKeyMatches) return false;

    // Check modifiers
    const requiredModifiers = new Set(modifiers.map(m => m.toLowerCase()));

    // Platform-specific modifier handling
    if (this.context.isMac) {
      // On Mac, cmd key is meta
      if (requiredModifiers.has('cmd') && !event.metaKey) return false;
      if (requiredModifiers.has('ctrl') && !event.ctrlKey) return false;
    } else {
      // On Windows/Linux, cmd doesn't exist, ctrl is primary
      if (requiredModifiers.has('cmd')) return false;
      if (requiredModifiers.has('ctrl') && !event.ctrlKey && !event.metaKey) return false;
    }

    if (requiredModifiers.has('alt') && !event.altKey) return false;
    if (requiredModifiers.has('shift') && !event.shiftKey) return false;
    if (requiredModifiers.has('meta') && !event.metaKey) return false;

    return true;
  }

  private normalizeKey(key: string): string {
    const keyMap: Record<string, string> = {
      ' ': 'space',
      'arrowup': 'up',
      'arrowdown': 'down',
      'arrowleft': 'left',
      'arrowright': 'right',
      'escape': 'esc',
    };
    return keyMap[key.toLowerCase()] || key.toLowerCase();
  }

  private executeShortcut(shortcut: KeyboardShortcut): void {
    try {
      const result = shortcut.action();
      if (result instanceof Promise) {
        result.catch(error => {
          console.error(`Error executing shortcut ${shortcut.id}:`, error);
        });
      }

      this.emit('shortcutTriggered', shortcut);
    } catch (error) {
      console.error(`Error executing shortcut ${shortcut.id}:`, error);
    }
  }

  private loadDefaultShortcuts(): void {
    // Voice Mode Toggle (Ctrl+Shift+V)
    this.register({
      id: 'voice-mode-toggle',
      name: 'Voice Mode Toggle',
      description: 'Toggle voice mode on/off',
      combination: { key: 'V', modifiers: ['ctrl', 'shift'] },
      category: 'voice',
      action: async () => {
        if (this.voiceService.isEnabled()) {
          await this.voiceService.disable();
        } else {
          await this.voiceService.enable();
        }
      },
    });

    // Quick Voice Recording (Ctrl+Shift+M)
    this.register({
      id: 'quick-voice-recording',
      name: 'Quick Voice Recording',
      description: 'Start/stop voice recording',
      combination: { key: 'M', modifiers: ['ctrl', 'shift'] },
      category: 'voice',
      action: async () => {
        if (this.voiceService.getState().isListening) {
          await this.voiceService.stopListening();
        } else {
          await this.voiceService.startListening();
        }
      },
    });

    // Voice Command Mode (Ctrl+Shift+C)
    this.register({
      id: 'voice-command-mode',
      name: 'Voice Command Mode',
      description: 'Enter dedicated voice command mode',
      combination: { key: 'C', modifiers: ['ctrl', 'shift'] },
      category: 'voice',
      action: () => {
        // This could be used to enter a special command mode
        // For now, just start listening if not already
        if (!this.voiceService.getState().isListening) {
          this.voiceService.startListening();
        }
      },
    });

    // Task Voice Commands (Ctrl+Shift+T)
    this.register({
      id: 'task-voice-commands',
      name: 'Task Voice Commands',
      description: 'Access task-related voice commands',
      combination: { key: 'T', modifiers: ['ctrl', 'shift'] },
      category: 'task',
      action: () => {
        // This could be used to trigger task-specific voice commands
        console.log('Task voice commands triggered');
      },
    });

    // Voice Settings (Ctrl+Shift+S)
    this.register({
      id: 'voice-settings',
      name: 'Voice Settings',
      description: 'Open voice settings',
      combination: { key: 'S', modifiers: ['ctrl', 'shift'] },
      category: 'voice',
      action: () => {
        // This could be used to open voice settings modal
        console.log('Voice settings triggered');
      },
    });
  }

  // Public API methods
  public register(shortcut: KeyboardShortcut): void {
    this.shortcuts.set(shortcut.id, { ...shortcut, enabled: shortcut.enabled ?? true });
    this.emit('shortcutRegistered', shortcut);
  }

  public unregister(shortcutId: string): void {
    this.shortcuts.delete(shortcutId);
    this.emit('shortcutUnregistered', shortcutId);
  }

  public getShortcut(shortcutId: string): KeyboardShortcut | undefined {
    return this.shortcuts.get(shortcutId);
  }

  public getAllShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  public getShortcutsByCategory(category: string): KeyboardShortcut[] {
    return this.getAllShortcuts().filter(shortcut => shortcut.category === category);
  }

  public updateShortcut(shortcutId: string, updates: Partial<KeyboardShortcut>): void {
    const shortcut = this.shortcuts.get(shortcutId);
    if (shortcut) {
      this.shortcuts.set(shortcutId, { ...shortcut, ...updates });
    }
  }

  public enableShortcut(shortcutId: string): void {
    this.updateShortcut(shortcutId, { enabled: true });
  }

  public disableShortcut(shortcutId: string): void {
    this.updateShortcut(shortcutId, { enabled: false });
  }

  public startListening(): void {
    this.isListening = true;
  }

  public stopListening(): void {
    this.isListening = false;
    this.pressedKeys.clear();
  }

  public updateConfig(config: Partial<KeyboardShortcutConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('configChanged', this.config);
  }

  public getConfig(): KeyboardShortcutConfig {
    return { ...this.config };
  }

  // Event handling
  public addEventListener<K extends keyof KeyboardServiceEvents>(
    event: K,
    listener: KeyboardServiceEvents[K]
  ): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  public removeEventListener<K extends keyof KeyboardServiceEvents>(
    event: K,
    listener: KeyboardServiceEvents[K]
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  private emit<K extends keyof KeyboardServiceEvents>(
    event: K,
    ...args: Parameters<KeyboardServiceEvents[K]>
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          (listener as any)(...args);
        } catch (error) {
          console.error(`Error in keyboard service event listener for ${event}:`, error);
        }
      });
    }
  }

  public destroy(): void {
    this.stopListening();
    this.shortcuts.clear();
    this.eventListeners.clear();

    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleKeyDown.bind(this));
      window.removeEventListener('keyup', this.handleKeyUp.bind(this));
      window.removeEventListener('blur', this.handleWindowBlur.bind(this));
    }
  }
}