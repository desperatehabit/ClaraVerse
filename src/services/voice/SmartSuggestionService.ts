import {
  VoiceContextType,
  UserContextPreferences
} from '../../types/context-aware-voice';
import { VoiceCommand, VoiceCommandCategory } from '../../types/voice-commands';

export interface SuggestionContext {
  currentContext?: VoiceContextType;
  recentCommands: string[];
  userPreferences?: UserContextPreferences;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: string;
  userActivityLevel: 'low' | 'medium' | 'high';
}

export interface SmartSuggestion {
  id: string;
  command: string;
  description: string;
  confidence: number;
  reason: string;
  context: VoiceContextType;
  category: 'frequent' | 'contextual' | 'time_based' | 'preference' | 'related' | 'new_feature';
  metadata: Record<string, any>;
  expiresAt?: Date;
}

export class SmartSuggestionService {
  private suggestionHistory: Map<string, SmartSuggestion[]> = new Map();
  private userBehaviorPatterns: Map<string, any> = new Map();
  private suggestionCache: Map<string, { suggestions: SmartSuggestion[]; timestamp: Date }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.loadBehaviorPatterns();
  }

  public generateSuggestions(
    context: SuggestionContext,
    availableCommands: VoiceCommand[]
  ): SmartSuggestion[] {
    const cacheKey = this.getCacheKey(context);
    const cached = this.suggestionCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp.getTime() < this.CACHE_DURATION) {
      return cached.suggestions;
    }

    const suggestions: SmartSuggestion[] = [];

    // Generate different types of suggestions
    suggestions.push(...this.generateFrequentCommandSuggestions(context, availableCommands));
    suggestions.push(...this.generateContextualSuggestions(context, availableCommands));
    suggestions.push(...this.generateTimeBasedSuggestions(context, availableCommands));
    suggestions.push(...this.generatePreferenceBasedSuggestions(context, availableCommands));
    suggestions.push(...this.generateRelatedCommandSuggestions(context, availableCommands));
    suggestions.push(...this.generateNewFeatureSuggestions(context, availableCommands));

    // Filter and rank suggestions
    const filteredSuggestions = this.filterAndRankSuggestions(suggestions, context);

    // Cache the results
    this.suggestionCache.set(cacheKey, {
      suggestions: filteredSuggestions,
      timestamp: new Date()
    });

    return filteredSuggestions;
  }

  private getCacheKey(context: SuggestionContext): string {
    return `${context.currentContext || 'none'}_${context.timeOfDay}_${context.userActivityLevel}_${context.recentCommands.slice(-3).join(',')}`;
  }

  private generateFrequentCommandSuggestions(
    context: SuggestionContext,
    availableCommands: VoiceCommand[]
  ): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    const { userPreferences } = context;

    if (!userPreferences) return suggestions;

    const contextPrefs = userPreferences.contextPreferences[context.currentContext || VoiceContextType.DASHBOARD];
    if (!contextPrefs) return suggestions;

    // Suggest favorite commands
    contextPrefs.favoriteCommands.forEach(commandName => {
      const command = availableCommands.find(cmd => cmd.name === commandName);
      if (command) {
        suggestions.push({
          id: `frequent_${commandName}_${Date.now()}`,
          command: commandName,
          description: `Frequently used: ${command.description}`,
          confidence: 0.9,
          reason: 'Based on your usage patterns',
          context: context.currentContext || VoiceContextType.DASHBOARD,
          category: 'frequent',
          metadata: {
            usageCount: contextPrefs.usagePatterns.find(p => p.command === commandName)?.frequency || 0,
            lastUsed: contextPrefs.usagePatterns.find(p => p.command === commandName)?.lastUsed
          }
        });
      }
    });

    return suggestions;
  }

  private generateContextualSuggestions(
    context: SuggestionContext,
    availableCommands: VoiceCommand[]
  ): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    const currentContext = context.currentContext;

    if (!currentContext) return suggestions;

    // Context-specific suggestions based on current activity
    switch (currentContext) {
      case VoiceContextType.TASKS:
        suggestions.push(
          {
            id: `contextual_tasks_quick_${Date.now()}`,
            command: 'list_tasks',
            description: 'View your current tasks',
            confidence: 0.8,
            reason: 'You\'re in task management mode',
            context: VoiceContextType.TASKS,
            category: 'contextual',
            metadata: { priority: 'high' }
          },
          {
            id: `contextual_tasks_create_${Date.now()}`,
            command: 'create_task',
            description: 'Create a new task quickly',
            confidence: 0.7,
            reason: 'Common action in task context',
            context: VoiceContextType.TASKS,
            category: 'contextual',
            metadata: { priority: 'medium' }
          }
        );
        break;

      case VoiceContextType.CHAT:
        suggestions.push(
          {
            id: `contextual_chat_quick_${Date.now()}`,
            command: 'read_messages',
            description: 'Check your recent messages',
            confidence: 0.8,
            reason: 'You\'re in communication mode',
            context: VoiceContextType.CHAT,
            category: 'contextual',
            metadata: { priority: 'high' }
          }
        );
        break;

      case VoiceContextType.SETTINGS:
        suggestions.push(
          {
            id: `contextual_settings_voice_${Date.now()}`,
            command: 'change_voice',
            description: 'Adjust voice settings',
            confidence: 0.8,
            reason: 'You\'re in settings mode',
            context: VoiceContextType.SETTINGS,
            category: 'contextual',
            metadata: { priority: 'high' }
          }
        );
        break;

      case VoiceContextType.BROWSER:
        suggestions.push(
          {
            id: `contextual_browser_search_${Date.now()}`,
            command: 'open_website',
            description: 'Search or open a website',
            confidence: 0.8,
            reason: 'You\'re in browser mode',
            context: VoiceContextType.BROWSER,
            category: 'contextual',
            metadata: { priority: 'high' }
          }
        );
        break;

      case VoiceContextType.DEVELOPMENT:
        suggestions.push(
          {
            id: `contextual_dev_run_${Date.now()}`,
            command: 'run_command',
            description: 'Run a development command',
            confidence: 0.8,
            reason: 'You\'re in development mode',
            context: VoiceContextType.DEVELOPMENT,
            category: 'contextual',
            metadata: { priority: 'high' }
          }
        );
        break;

      case VoiceContextType.MEDIA:
        suggestions.push(
          {
            id: `contextual_media_play_${Date.now()}`,
            command: 'play_music',
            description: 'Control media playback',
            confidence: 0.8,
            reason: 'You\'re in media mode',
            context: VoiceContextType.MEDIA,
            category: 'contextual',
            metadata: { priority: 'high' }
          }
        );
        break;
    }

    return suggestions;
  }

  private generateTimeBasedSuggestions(
    context: SuggestionContext,
    availableCommands: VoiceCommand[]
  ): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    const { timeOfDay, dayOfWeek } = context;

    // Morning suggestions
    if (timeOfDay === 'morning') {
      suggestions.push({
        id: `time_morning_tasks_${Date.now()}`,
        command: 'list_tasks',
        description: 'Review your tasks for today',
        confidence: 0.7,
        reason: 'Morning routine',
        context: VoiceContextType.TASKS,
        category: 'time_based',
        metadata: { timeOfDay, priority: 'medium' }
      });
    }

    // Evening suggestions
    if (timeOfDay === 'evening') {
      suggestions.push({
        id: `time_evening_summary_${Date.now()}`,
        command: 'task_summary',
        description: 'Get a summary of completed work',
        confidence: 0.7,
        reason: 'End of day review',
        context: VoiceContextType.TASKS,
        category: 'time_based',
        metadata: { timeOfDay, priority: 'medium' }
      });
    }

    // Weekend suggestions
    if (dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday') {
      suggestions.push({
        id: `time_weekend_media_${Date.now()}`,
        command: 'play_music',
        description: 'Enjoy some music or entertainment',
        confidence: 0.6,
        reason: 'Weekend relaxation',
        context: VoiceContextType.MEDIA,
        category: 'time_based',
        metadata: { dayOfWeek, priority: 'low' }
      });
    }

    return suggestions;
  }

  private generatePreferenceBasedSuggestions(
    context: SuggestionContext,
    availableCommands: VoiceCommand[]
  ): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    const { userPreferences } = context;

    if (!userPreferences) return suggestions;

    const contextPrefs = userPreferences.contextPreferences[context.currentContext || VoiceContextType.DASHBOARD];
    if (!contextPrefs || !contextPrefs.adaptiveBehavior) return suggestions;

    // Suggest commands based on success rate and preferences
    contextPrefs.usagePatterns
      .filter(pattern => pattern.successRate > 0.8 && pattern.frequency > 2)
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 3)
      .forEach(pattern => {
        suggestions.push({
          id: `preference_${pattern.command}_${Date.now()}`,
          command: pattern.command,
          description: `Your preferred command with ${Math.round(pattern.successRate * 100)}% success rate`,
          confidence: 0.8,
          reason: 'Based on your preferences',
          context: context.currentContext || VoiceContextType.DASHBOARD,
          category: 'preference',
          metadata: {
            successRate: pattern.successRate,
            frequency: pattern.frequency
          }
        });
      });

    return suggestions;
  }

  private generateRelatedCommandSuggestions(
    context: SuggestionContext,
    availableCommands: VoiceCommand[]
  ): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    const { recentCommands } = context;

    if (recentCommands.length === 0) return suggestions;

    const lastCommand = recentCommands[recentCommands.length - 1];
    const lastCommandObj = availableCommands.find(cmd => cmd.name === lastCommand);

    if (!lastCommandObj) return suggestions;

    // Find related commands in the same category
    const relatedCommands = availableCommands
      .filter(cmd =>
        cmd.category === lastCommandObj.category &&
        cmd.name !== lastCommand
      )
      .slice(0, 2);

    relatedCommands.forEach(command => {
      suggestions.push({
        id: `related_${command.name}_${Date.now()}`,
        command: command.name,
        description: `Related to your last command: ${command.description}`,
        confidence: 0.6,
        reason: `Related to "${lastCommand}"`,
        context: context.currentContext || VoiceContextType.DASHBOARD,
        category: 'related',
        metadata: {
          relatedTo: lastCommand,
          category: command.category
        }
      });
    });

    return suggestions;
  }

  private generateNewFeatureSuggestions(
    context: SuggestionContext,
    availableCommands: VoiceCommand[]
  ): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    // Identify less commonly used but useful commands
    const underusedCommands = availableCommands
      .filter(cmd => {
        const usage = this.userBehaviorPatterns.get(`command_${cmd.name}`);
        return !usage || usage.count < 3;
      })
      .filter(cmd => {
        // Filter for commands that are likely to be useful in current context
        if (context.currentContext === VoiceContextType.TASKS) {
          return cmd.category === VoiceCommandCategory.PRODUCTIVITY;
        }
        if (context.currentContext === VoiceContextType.CHAT) {
          return cmd.category === VoiceCommandCategory.COMMUNICATION;
        }
        return true;
      })
      .slice(0, 2);

    underusedCommands.forEach(command => {
      suggestions.push({
        id: `new_feature_${command.name}_${Date.now()}`,
        command: command.name,
        description: `Try this feature: ${command.description}`,
        confidence: 0.5,
        reason: 'Discover new capabilities',
        context: context.currentContext || VoiceContextType.DASHBOARD,
        category: 'new_feature',
        metadata: {
          isNewFeature: true,
          category: command.category
        }
      });
    });

    return suggestions;
  }

  private filterAndRankSuggestions(
    suggestions: SmartSuggestion[],
    context: SuggestionContext
  ): SmartSuggestion[] {
    // Remove duplicates
    const uniqueSuggestions = suggestions.filter((suggestion, index, self) =>
      index === self.findIndex(s => s.command === suggestion.command)
    );

    // Filter out recently suggested commands
    const recentSuggestions = this.getRecentSuggestions(context);
    const filteredSuggestions = uniqueSuggestions.filter(suggestion =>
      !recentSuggestions.some(recent => recent.command === suggestion.command)
    );

    // Apply context-specific filtering
    let finalSuggestions = filteredSuggestions;

    if (context.currentContext) {
      // Prioritize context-relevant suggestions
      finalSuggestions = filteredSuggestions.map(suggestion => {
        if (suggestion.context === context.currentContext) {
          suggestion.confidence += 0.1;
        }
        return suggestion;
      });
    }

    // Sort by confidence and return top suggestions
    return finalSuggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }

  private getRecentSuggestions(context: SuggestionContext): SmartSuggestion[] {
    const contextKey = context.currentContext || 'global';
    const history = this.suggestionHistory.get(contextKey) || [];
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    return history.filter(suggestion =>
      suggestion.expiresAt && suggestion.expiresAt.getTime() > oneHourAgo
    );
  }

  public recordSuggestionShown(suggestion: SmartSuggestion, context: SuggestionContext): void {
    const contextKey = context.currentContext || 'global';
    const history = this.suggestionHistory.get(contextKey) || [];

    // Add expiration time (1 hour from now)
    suggestion.expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    history.push(suggestion);

    // Keep only last 50 suggestions per context
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }

    this.suggestionHistory.set(contextKey, history);
  }

  public recordSuggestionUsed(suggestion: SmartSuggestion, context: SuggestionContext): void {
    // Update behavior patterns
    const patternKey = `suggestion_used_${suggestion.command}`;
    const current = this.userBehaviorPatterns.get(patternKey) || { count: 0, lastUsed: new Date() };
    current.count += 1;
    current.lastUsed = new Date();
    this.userBehaviorPatterns.set(patternKey, current);

    this.saveBehaviorPatterns();
  }

  public getPersonalizedHelp(context: SuggestionContext, availableCommands: VoiceCommand[]): string {
    const suggestions = this.generateSuggestions(context, availableCommands);
    const contextName = context.currentContext ? `${context.currentContext} context` : 'current context';

    let help = `Voice Assistant Help - ${contextName}\n\n`;

    if (suggestions.length > 0) {
      help += 'Recommended commands:\n';
      suggestions.slice(0, 3).forEach(suggestion => {
        help += `• "${suggestion.command}" - ${suggestion.description}\n`;
        help += `  ${suggestion.reason}\n\n`;
      });
    }

    // Add context-specific guidance
    help += this.getContextSpecificGuidance(context);

    help += '\nSay "help" anytime for more assistance.';

    return help;
  }

  private getContextSpecificGuidance(context: SuggestionContext): string {
    const currentContext = context.currentContext;

    switch (currentContext) {
      case VoiceContextType.TASKS:
        return 'You can create tasks, list them, mark them complete, and search through them. Try saying "create task" or "list tasks".';

      case VoiceContextType.CHAT:
        return 'You can send messages, read conversations, and start new chats. Try saying "send message" or "read messages".';

      case VoiceContextType.SETTINGS:
        return 'You can adjust voice settings, enable/disable features, and customize your experience. Try saying "open settings" or "change voice".';

      case VoiceContextType.BROWSER:
        return 'You can open websites, navigate pages, and search the web. Try saying "open website" or "search for".';

      case VoiceContextType.DEVELOPMENT:
        return 'You can run commands, create files, and manage your development workflow. Try saying "run command" or "create file".';

      case VoiceContextType.MEDIA:
        return 'You can control music playback, adjust volume, and manage playlists. Try saying "play music" or "volume".';

      default:
        return 'You can use various commands across different contexts. Try saying "help" or "status" to get started.';
    }
  }

  public analyzeUserBehavior(commands: VoiceCommand[], usageData: any[]): void {
    // Analyze command usage patterns
    const categoryUsage = new Map<VoiceCommandCategory, number>();
    const timePatterns = new Map<string, number>();
    const contextPatterns = new Map<VoiceContextType, number>();

    usageData.forEach(entry => {
      // Count by category
      const command = commands.find(cmd => cmd.name === entry.command);
      if (command) {
        categoryUsage.set(command.category, (categoryUsage.get(command.category) || 0) + 1);
      }

      // Analyze time patterns
      const hour = new Date(entry.timestamp).getHours();
      const timeSlot = `${Math.floor(hour / 4) * 4}-${Math.floor(hour / 4) * 4 + 4}`;
      timePatterns.set(timeSlot, (timePatterns.get(timeSlot) || 0) + 1);

      // Analyze context patterns
      if (entry.context) {
        contextPatterns.set(entry.context, (contextPatterns.get(entry.context) || 0) + 1);
      }
    });

    // Store patterns for future suggestions
    this.userBehaviorPatterns.set('category_preferences', Object.fromEntries(categoryUsage));
    this.userBehaviorPatterns.set('time_patterns', Object.fromEntries(timePatterns));
    this.userBehaviorPatterns.set('context_patterns', Object.fromEntries(contextPatterns));

    this.saveBehaviorPatterns();
  }

  public getAdaptiveSuggestions(
    context: SuggestionContext,
    availableCommands: VoiceCommand[],
    userInput?: string
  ): SmartSuggestion[] {
    let suggestions = this.generateSuggestions(context, availableCommands);

    // If user provided input, prioritize matching commands
    if (userInput) {
      const inputLower = userInput.toLowerCase();
      suggestions = suggestions.filter(suggestion =>
        suggestion.command.toLowerCase().includes(inputLower) ||
        suggestion.description.toLowerCase().includes(inputLower)
      );

      // Boost confidence for partial matches
      suggestions.forEach(suggestion => {
        if (suggestion.command.toLowerCase().startsWith(inputLower)) {
          suggestion.confidence += 0.2;
        }
      });
    }

    return suggestions.slice(0, 3);
  }

  private loadBehaviorPatterns(): void {
    try {
      const stored = localStorage.getItem('voice_behavior_patterns');
      if (stored) {
        const data = JSON.parse(stored);
        this.userBehaviorPatterns = new Map(Object.entries(data));
      }
    } catch (error) {
      console.error('Failed to load behavior patterns:', error);
    }
  }

  private saveBehaviorPatterns(): void {
    try {
      const data = Object.fromEntries(this.userBehaviorPatterns);
      localStorage.setItem('voice_behavior_patterns', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save behavior patterns:', error);
    }
  }

  public getSuggestionInsights(): any {
    const totalSuggestions = Array.from(this.suggestionHistory.values())
      .reduce((total, suggestions) => total + suggestions.length, 0);

    const categoryStats = this.getCategorySuggestionStats();
    const contextStats = this.getContextSuggestionStats();

    return {
      totalSuggestions,
      categoryBreakdown: categoryStats,
      contextBreakdown: contextStats,
      behaviorPatterns: Object.fromEntries(this.userBehaviorPatterns)
    };
  }

  private getCategorySuggestionStats(): Record<string, number> {
    const stats: Record<string, number> = {};

    this.suggestionHistory.forEach((suggestions, context) => {
      suggestions.forEach(suggestion => {
        stats[suggestion.category] = (stats[suggestion.category] || 0) + 1;
      });
    });

    return stats;
  }

  private getContextSuggestionStats(): Record<string, number> {
    const stats: Record<string, number> = {};

    this.suggestionHistory.forEach((suggestions, context) => {
      stats[context] = suggestions.length;
    });

    return stats;
  }

  public clearSuggestionHistory(): void {
    this.suggestionHistory.clear();
    this.suggestionCache.clear();
  }

  public exportSuggestionData(): any {
    return {
      history: Object.fromEntries(this.suggestionHistory),
      patterns: Object.fromEntries(this.userBehaviorPatterns),
      cache: Object.fromEntries(this.suggestionCache),
      exportedAt: new Date().toISOString()
    };
  }

  public importSuggestionData(data: any): void {
    try {
      if (data.history) {
        this.suggestionHistory = new Map(Object.entries(data.history));
      }
      if (data.patterns) {
        this.userBehaviorPatterns = new Map(Object.entries(data.patterns));
      }
      if (data.cache) {
        this.suggestionCache = new Map(Object.entries(data.cache));
      }
    } catch (error) {
      console.error('Failed to import suggestion data:', error);
    }
  }

  public destroy(): void {
    this.saveBehaviorPatterns();
    this.suggestionHistory.clear();
    this.userBehaviorPatterns.clear();
    this.suggestionCache.clear();
  }
}