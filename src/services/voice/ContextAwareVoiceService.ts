import { VoiceService } from './VoiceService';
import { ContextDetectionService } from './ContextDetectionService';
import { ContextModesService } from './ContextModesService';
import {
   VoiceContextType,
   ContextInfo,
   ContextualVoiceSettings,
   ContextTransition,
   UserContextPreferences
 } from '../../types/context-aware-voice';
import {
   VoiceCommandResult
 } from '../../types/voice-commands';
import { VoiceSettings } from '../../types/voice';

export class ContextAwareVoiceService extends VoiceService {
  private contextDetection: ContextDetectionService;
  private contextModes: ContextModesService;
  private currentContext: ContextInfo | null = null;
  private contextTransitions: ContextTransition[] = [];
  private userPreferences: UserContextPreferences | null = null;
  private contextCommandHistory: Map<VoiceContextType, string[]> = new Map();
  private contextChangeListeners: Set<(context: ContextInfo, previousContext: ContextInfo | null) => void> = new Set();

  constructor(config: any) {
    super(config);

    this.contextDetection = new ContextDetectionService();
    this.contextModes = new ContextModesService();

    this.setupContextIntegration();
    this.loadUserPreferences();
  }

  private setupContextIntegration(): void {
    // Listen to context changes
    this.contextDetection.onContextChange((contextInfo) => {
      this.handleContextChange(contextInfo);
    });

    // Override parent voice settings with context-aware settings
    this.addEventListener('stateChange', () => {
      this.applyContextualSettings();
    });
  }

  private async handleContextChange(newContext: ContextInfo): Promise<void> {
    const previousContext = this.currentContext;
    this.currentContext = newContext;

    // Record the transition
    const transition: ContextTransition = {
      fromContext: previousContext?.type || VoiceContextType.UNKNOWN,
      toContext: newContext.type,
      timestamp: new Date(),
      reason: newContext.source === 'manual' ? 'manual' : 'navigation',
      smoothTransition: true,
      announcements: []
    };

    this.contextTransitions.push(transition);

    // Keep only last 50 transitions
    if (this.contextTransitions.length > 50) {
      this.contextTransitions = this.contextTransitions.slice(-50);
    }

    // Apply contextual settings
    await this.applyContextualSettings();

    // Activate context mode
    this.contextModes.activateContext(newContext.type);

    // Generate transition announcement
    const announcement = this.generateContextTransitionAnnouncement(previousContext, newContext);
    if (announcement && this.shouldAnnounceContextChange(newContext)) {
      this.speak(announcement, { speed: 0.9 });
    }

    // Record command usage for this context
    if (!this.contextCommandHistory.has(newContext.type)) {
      this.contextCommandHistory.set(newContext.type, []);
    }

    // Notify listeners
    this.notifyContextChange(newContext, previousContext);

    console.log(`Voice context changed: ${previousContext?.type || 'none'} → ${newContext.type}`);
  }

  private generateContextTransitionAnnouncement(previousContext: ContextInfo | null, newContext: ContextInfo): string {
    const mode = this.contextModes.getContextMode(newContext.type);
    if (!mode) return '';

    let announcement = `Entering ${mode.name} mode`;

    if (previousContext) {
      const previousMode = this.contextModes.getContextMode(previousContext.type);
      announcement = `Switched from ${previousMode?.name || previousContext.type} to ${mode.name} mode`;
    }

    // Add context-specific guidance
    const suggestions = this.contextModes.getContextSuggestions(newContext.type);
    if (suggestions.length > 0 && this.shouldShowContextHints(newContext)) {
      const topSuggestion = suggestions[0];
      announcement += `. Try saying: ${topSuggestion.description}`;
    }

    return announcement;
  }

  private shouldAnnounceContextChange(context: ContextInfo): boolean {
    const settings = this.contextModes.getContextualSettings(context.type);
    return settings?.behaviorConfig.contextAnnouncements ?? false;
  }

  private shouldShowContextHints(context: ContextInfo): boolean {
    const settings = this.contextModes.getContextualSettings(context.type);
    return settings?.behaviorConfig.showCommandHints ?? true;
  }

  private async applyContextualSettings(): Promise<void> {
    if (!this.currentContext) return;

    const contextSettings = this.contextModes.getContextualSettings(this.currentContext.type);
    if (!contextSettings) return;

    // Merge context settings with user preferences
    const mergedSettings = this.mergeWithUserPreferences(contextSettings);

    // Apply voice configuration
    if (mergedSettings.voiceConfig) {
      const currentVoiceSettings = this.getSettings();

      const updatedSettings: VoiceSettings = {
        ...currentVoiceSettings,
        ...mergedSettings.voiceConfig,
        // Preserve core settings that shouldn't be overridden
        vadEnabled: currentVoiceSettings.vadEnabled,
        sttEnabled: currentVoiceSettings.sttEnabled,
        ttsEnabled: currentVoiceSettings.ttsEnabled,
        noiseReduction: currentVoiceSettings.noiseReduction,
        echoCancellation: currentVoiceSettings.echoCancellation
      };

      await this.updateSettings(updatedSettings);
    }

    // Update available commands based on context
    this.updateContextualCommands(mergedSettings);
  }

  private mergeWithUserPreferences(contextSettings: ContextualVoiceSettings): ContextualVoiceSettings {
    if (!this.userPreferences) return contextSettings;

    const userPrefs = this.userPreferences.contextPreferences[contextSettings.contextType];
    if (!userPrefs || !userPrefs.adaptiveBehavior) return contextSettings;

    return {
      ...contextSettings,
      voiceConfig: {
        ...contextSettings.voiceConfig,
        ...userPrefs.customSettings.voiceConfig
      },
      behaviorConfig: {
        ...contextSettings.behaviorConfig,
        ...userPrefs.customSettings.behaviorConfig
      },
      enabledCommands: userPrefs.customSettings.enabledCommands || contextSettings.enabledCommands,
      disabledCommands: userPrefs.customSettings.disabledCommands || contextSettings.disabledCommands
    };
  }

  private updateContextualCommands(settings: ContextualVoiceSettings): void {
    // This would integrate with the command system to filter available commands
    // based on the current context
    const activeCommands = settings.enabledCommands.filter(cmd =>
      !settings.disabledCommands.includes(cmd)
    );

    // Emit event for command system to update available commands
    this.emit('contextCommandsChanged', activeCommands);
  }

  private async loadUserPreferences(): Promise<void> {
    try {
      // Load user preferences from storage
      // This would typically come from a database or local storage
      const stored = localStorage.getItem('voice_context_preferences');
      if (stored) {
        this.userPreferences = JSON.parse(stored);
      } else {
        // Initialize default preferences
        this.userPreferences = this.createDefaultUserPreferences();
      }
    } catch (error) {
      console.error('Failed to load user context preferences:', error);
      this.userPreferences = this.createDefaultUserPreferences();
    }
  }

  private createDefaultUserPreferences(): UserContextPreferences {
    const defaultPrefs: UserContextPreferences = {
      userId: 'default_user',
      contextPreferences: {} as Record<VoiceContextType, any>,
      globalPreferences: {
        enableContextAwareness: true,
        transitionAnnouncements: true,
        adaptiveSuggestions: true,
        rememberContextHistory: true,
        maxContextHistory: 100
      },
      lastUpdated: new Date()
    };

    // Initialize preferences for each context type
    Object.values(VoiceContextType).forEach(contextType => {
      defaultPrefs.contextPreferences[contextType] = {
        favoriteCommands: [],
        avoidedCommands: [],
        customSettings: {},
        usagePatterns: [],
        adaptiveBehavior: true,
        learningEnabled: true
      };
    });

    return defaultPrefs;
  }

  private async saveUserPreferences(): Promise<void> {
    if (!this.userPreferences) return;

    this.userPreferences.lastUpdated = new Date();
    localStorage.setItem('voice_context_preferences', JSON.stringify(this.userPreferences));
  }

  // Public API for context management
  public getCurrentContext(): ContextInfo | null {
    return this.currentContext ? { ...this.currentContext } : null;
  }

  public getContextMode(contextType?: VoiceContextType): any {
    const type = contextType || this.currentContext?.type;
    if (!type) return null;

    return this.contextModes.getContextMode(type);
  }

  public getContextualSettings(contextType?: VoiceContextType): ContextualVoiceSettings | undefined {
    const type = contextType || this.currentContext?.type;
    if (!type) return undefined;

    return this.contextModes.getContextualSettings(type);
  }

  public getContextSuggestions(contextType?: VoiceContextType): any[] {
    const type = contextType || this.currentContext?.type || VoiceContextType.DASHBOARD;
    return this.contextModes.getContextSuggestions(type);
  }

  public async setContextManually(contextType: VoiceContextType, metadata?: Record<string, any>): Promise<void> {
    this.contextDetection.manuallySetContext(contextType, 1.0, metadata);
  }

  public async updateContextualSettings(
    contextType: VoiceContextType,
    updates: Partial<ContextualVoiceSettings>
  ): Promise<void> {
    this.contextModes.updateContextualSettings(contextType, updates);

    // Update user preferences
    if (this.userPreferences) {
      const userPrefs = this.userPreferences.contextPreferences[contextType];
      if (userPrefs) {
        userPrefs.customSettings = {
          ...userPrefs.customSettings,
          ...updates
        };
        await this.saveUserPreferences();
      }
    }

    // Reapply settings if this is the current context
    if (this.currentContext?.type === contextType) {
      await this.applyContextualSettings();
    }
  }

  public getContextHistory(): ContextTransition[] {
    return [...this.contextTransitions];
  }

  public onContextChange(listener: (context: ContextInfo, previousContext: ContextInfo | null) => void): () => void {
    this.contextChangeListeners.add(listener);
    return () => this.contextChangeListeners.delete(listener);
  }

  private notifyContextChange(context: ContextInfo, previousContext: ContextInfo | null): void {
    this.contextChangeListeners.forEach(listener => {
      try {
        listener(context, previousContext);
      } catch (error) {
        console.error('Error in context change listener:', error);
      }
    });
  }

  public recordCommandUsage(command: string, success: boolean): void {
    if (!this.currentContext) return;

    const contextHistory = this.contextCommandHistory.get(this.currentContext.type) || [];
    contextHistory.push(command);

    // Keep only last 20 commands per context
    if (contextHistory.length > 20) {
      contextHistory.splice(0, contextHistory.length - 20);
    }

    this.contextCommandHistory.set(this.currentContext.type, contextHistory);

    // Update user preferences with usage patterns
    this.updateUserPreferencesWithUsage(command, success);
  }

  private updateUserPreferencesWithUsage(command: string, success: boolean): void {
    if (!this.userPreferences || !this.currentContext) return;

    const contextPrefs = this.userPreferences.contextPreferences[this.currentContext.type];
    if (!contextPrefs.learningEnabled) return;

    // Find existing pattern or create new one
    let pattern = contextPrefs.usagePatterns.find(p => p.command === command);
    if (!pattern) {
      pattern = {
        command,
        frequency: 0,
        lastUsed: new Date(),
        successRate: 0
      };
      contextPrefs.usagePatterns.push(pattern);
    }

    // Update pattern
    pattern.frequency += 1;
    pattern.lastUsed = new Date();
    pattern.successRate = (pattern.successRate * (pattern.frequency - 1) + (success ? 1 : 0)) / pattern.frequency;

    // Update favorite/avoided commands based on usage
    if (success && pattern.frequency >= 3 && pattern.successRate >= 0.8) {
      if (!contextPrefs.favoriteCommands.includes(command)) {
        contextPrefs.favoriteCommands.push(command);
      }
    } else if (!success && pattern.frequency >= 3 && pattern.successRate < 0.3) {
      if (!contextPrefs.avoidedCommands.includes(command)) {
        contextPrefs.avoidedCommands.push(command);
      }
    }

    this.saveUserPreferences();
  }

  public getRecommendedCommands(limit = 5): string[] {
    if (!this.currentContext) return [];

    const suggestions = this.contextModes.getContextSuggestions(this.currentContext.type);
    const userPrefs = this.userPreferences?.contextPreferences[this.currentContext.type];

    let recommendations = [...suggestions];

    // Boost favorite commands
    if (userPrefs?.favoriteCommands.length) {
      recommendations = recommendations.map(suggestion => {
        if (userPrefs.favoriteCommands.includes(suggestion.command)) {
          return { ...suggestion, confidence: suggestion.confidence + 0.2 };
        }
        return suggestion;
      });
    }

    // Filter out avoided commands
    if (userPrefs?.avoidedCommands.length) {
      recommendations = recommendations.filter(suggestion =>
        !userPrefs.avoidedCommands.includes(suggestion.command)
      );
    }

    return recommendations
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit)
      .map(s => s.command);
  }

  public async executeContextualCommand(
    command: string,
    parameters: Record<string, any> = {}
  ): Promise<VoiceCommandResult> {
    if (!this.currentContext) {
      return {
        success: false,
        message: 'No active context for command execution'
      };
    }

    // Check if command is available in current context
    if (!this.contextModes.isCommandAvailableInContext(command, this.currentContext.type)) {
      return {
        success: false,
        message: `Command "${command}" is not available in ${this.currentContext.type} context`
      };
    }

    try {
      // Execute command with context awareness
      const result = await this.executeCommandWithContext(command, parameters);

      // Record usage for learning
      this.recordCommandUsage(command, result.success);

      return result;
    } catch (error) {
      this.recordCommandUsage(command, false);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Command execution failed'
      };
    }
  }

  private async executeCommandWithContext(command: string, parameters: Record<string, any>): Promise<VoiceCommandResult> {
    // This would integrate with the existing command execution system
    // For now, return a mock result
    return {
      success: true,
      message: `Executed ${command} in ${this.currentContext?.type} context`,
      data: { command, parameters, context: this.currentContext?.type }
    };
  }

  public getContextualHelp(): string {
    if (!this.currentContext) return 'No active context. Say "help" for general assistance.';

    const mode = this.contextModes.getContextMode(this.currentContext.type);
    if (!mode) return 'Context help not available.';

    const suggestions = this.contextModes.getContextSuggestions(this.currentContext.type);
    const topCommands = suggestions.slice(0, 3);

    let help = `${mode.name} Mode Help:\n\n`;
    help += `${mode.description}\n\n`;

    if (topCommands.length > 0) {
      help += 'Try these commands:\n';
      topCommands.forEach(suggestion => {
        help += `• ${suggestion.description}\n`;
      });
      help += '\n';
    }

    help += `Available commands: ${mode.availableCommands.length}\n`;
    help += `Say "list commands" to see all available commands in this context.`;

    return help;
  }

  public override async speak(text: string, options?: { voice?: string; speed?: number }): Promise<void> {
    if (!this.currentContext) {
      return super.speak(text, options);
    }

    // Apply context-specific speech settings
    const contextSettings = this.contextModes.getContextualSettings(this.currentContext.type);
    const contextOptions = {
      ...options,
      ...contextSettings?.voiceConfig
    };

    return super.speak(text, contextOptions);
  }

  public override async destroy(): Promise<void> {
    // Save preferences before destroying
    if (this.userPreferences) {
      await this.saveUserPreferences();
    }

    // Clean up context services
    this.contextDetection.destroy();
    this.contextModes.destroy();
    this.contextChangeListeners.clear();

    // Call parent destroy
    super.destroy();
  }

  // Context switching methods
  public async switchToContext(contextType: VoiceContextType): Promise<void> {
    await this.setContextManually(contextType);
  }

  public async switchToTaskContext(): Promise<void> {
    await this.switchToContext(VoiceContextType.TASKS);
  }

  public async switchToChatContext(): Promise<void> {
    await this.switchToContext(VoiceContextType.CHAT);
  }

  public async switchToSettingsContext(): Promise<void> {
    await this.switchToContext(VoiceContextType.SETTINGS);
  }

  // Get context-aware insights
  public getContextInsights(): any {
    if (!this.currentContext) return null;

    const contextHistory = this.contextCommandHistory.get(this.currentContext.type) || [];
    const userPrefs = this.userPreferences?.contextPreferences[this.currentContext.type];

    return {
      currentContext: this.currentContext,
      contextMode: this.contextModes.getContextMode(this.currentContext.type),
      recentCommands: contextHistory.slice(-5),
      favoriteCommands: userPrefs?.favoriteCommands.slice(0, 3) || [],
      suggestions: this.getContextSuggestions().slice(0, 3),
      usageStats: {
        totalCommands: contextHistory.length,
        uniqueCommands: new Set(contextHistory).size,
        favoriteCount: userPrefs?.favoriteCommands.length || 0
      }
    };
  }

  // Command context validation
  public validateCommandForContext(command: string, contextType?: VoiceContextType): {
    isValid: boolean;
    reason?: string;
    suggestions?: string[];
  } {
    const type = contextType || this.currentContext?.type;
    if (!type) {
      return { isValid: false, reason: 'No active context' };
    }

    const isAvailable = this.contextModes.isCommandAvailableInContext(command, type);
    if (!isAvailable) {
      const suggestions = this.contextModes.getContextSuggestions(type)
        .slice(0, 3)
        .map(s => s.command);

      return {
        isValid: false,
        reason: `Command "${command}" is not available in ${type} context`,
        suggestions
      };
    }

    return { isValid: true };
  }
}