import {
  VoiceContextType,
  VoiceContextMode,
  ContextualVoiceSettings,
  ContextSuggestion
} from '../../types/context-aware-voice';

export class ContextModesService {
  private contextModes: Map<VoiceContextType, VoiceContextMode> = new Map();
  private contextualSettings: Map<VoiceContextType, ContextualVoiceSettings> = new Map();

  constructor() {
    this.initializeContextModes();
    this.initializeContextualSettings();
  }

  private initializeContextModes(): void {
    const modes: VoiceContextMode[] = [
      {
        type: VoiceContextType.TASKS,
        name: 'Task Management',
        description: 'Voice commands for managing tasks, projects, and productivity',
        icon: '📋',
        color: '#3B82F6',
        availableCommands: [
          'create_task', 'list_tasks', 'complete_task', 'delete_task',
          'create_project', 'list_projects', 'set_priority', 'set_due_date',
          'search_tasks', 'filter_tasks', 'sort_tasks', 'task_summary'
        ],
        defaultSettings: {
          voiceConfig: {
            ttsSpeed: 1.1,
            autoStartListening: true
          },
          behaviorConfig: {
            autoSuggestCommands: true,
            confirmSensitiveCommands: true,
            showCommandHints: true,
            adaptiveResponses: true,
            contextAnnouncements: true
          }
        },
        supportedFeatures: ['task_creation', 'project_management', 'productivity_tracking'],
        examples: [
          'Create a new task to review the quarterly report',
          'Show me all high priority tasks due today',
          'Mark the database migration task as completed'
        ]
      },
      {
        type: VoiceContextType.CHAT,
        name: 'Communication',
        description: 'Enhanced voice features for chat and communication',
        icon: '💬',
        color: '#10B981',
        availableCommands: [
          'send_message', 'reply_to', 'start_chat', 'join_call',
          'send_voice_message', 'read_messages', 'search_conversation',
          'create_group', 'invite_user', 'set_status', 'clear_chat'
        ],
        defaultSettings: {
          voiceConfig: {
            ttsEngine: 'auto',
            ttsVoice: 'af_sarah',
            sttLanguage: 'en'
          },
          behaviorConfig: {
            autoSuggestCommands: true,
            confirmSensitiveCommands: false,
            showCommandHints: false,
            adaptiveResponses: true,
            contextAnnouncements: false
          }
        },
        supportedFeatures: ['voice_messaging', 'conversation_search', 'real_time_communication'],
        examples: [
          'Send a message to John about the project update',
          'Read my recent messages',
          'Start a voice call with the team'
        ]
      },
      {
        type: VoiceContextType.SETTINGS,
        name: 'Configuration',
        description: 'Voice-guided configuration and settings management',
        icon: '⚙️',
        color: '#8B5CF6',
        availableCommands: [
          'open_settings', 'change_voice_settings', 'configure_commands',
          'enable_feature', 'disable_feature', 'reset_settings',
          'backup_settings', 'restore_settings', 'export_config', 'import_config'
        ],
        defaultSettings: {
          voiceConfig: {
            ttsSpeed: 0.9,
            autoStartListening: false,
            pushToTalk: true
          },
          behaviorConfig: {
            autoSuggestCommands: true,
            confirmSensitiveCommands: true,
            showCommandHints: true,
            adaptiveResponses: false,
            contextAnnouncements: true
          }
        },
        supportedFeatures: ['voice_guided_setup', 'configuration_management', 'settings_backup'],
        examples: [
          'Open voice settings',
          'Change the TTS voice to a female voice',
          'Enable push to talk mode'
        ]
      },
      {
        type: VoiceContextType.BROWSER,
        name: 'Web Browser',
        description: 'Browser navigation and web interaction commands',
        icon: '🌐',
        color: '#F59E0B',
        availableCommands: [
          'open_website', 'navigate_to', 'go_back', 'go_forward',
          'refresh_page', 'new_tab', 'close_tab', 'search_web',
          'bookmark_page', 'read_page', 'click_element', 'scroll_page'
        ],
        defaultSettings: {
          voiceConfig: {
            ttsSpeed: 1.0,
            sttLanguage: 'en'
          },
          behaviorConfig: {
            autoSuggestCommands: true,
            confirmSensitiveCommands: true,
            showCommandHints: false,
            adaptiveResponses: true,
            contextAnnouncements: false
          }
        },
        supportedFeatures: ['web_navigation', 'page_interaction', 'content_reading'],
        examples: [
          'Open Google and search for machine learning',
          'Go to my bookmarks',
          'Read the content of this page'
        ]
      },
      {
        type: VoiceContextType.DASHBOARD,
        name: 'Dashboard',
        description: 'General dashboard and overview commands',
        icon: '🏠',
        color: '#6B7280',
        availableCommands: [
          'show_overview', 'recent_activity', 'quick_stats',
          'navigate_to_section', 'show_help', 'system_status',
          'notifications', 'quick_actions', 'search_app'
        ],
        defaultSettings: {
          voiceConfig: {
            ttsSpeed: 1.0,
            autoStartListening: false
          },
          behaviorConfig: {
            autoSuggestCommands: true,
            confirmSensitiveCommands: false,
            showCommandHints: true,
            adaptiveResponses: true,
            contextAnnouncements: false
          }
        },
        supportedFeatures: ['overview', 'quick_navigation', 'system_info'],
        examples: [
          'Show me an overview of my tasks',
          'What are my recent activities?',
          'Navigate to the settings section'
        ]
      },
      {
        type: VoiceContextType.DEVELOPMENT,
        name: 'Development',
        description: 'Code editing and development workflow commands',
        icon: '💻',
        color: '#059669',
        availableCommands: [
          'run_command', 'compile_code', 'run_tests', 'debug_code',
          'search_code', 'format_code', 'create_file', 'open_file',
          'git_commit', 'git_push', 'run_server', 'stop_server'
        ],
        defaultSettings: {
          voiceConfig: {
            ttsEngine: 'auto',
            ttsSpeed: 1.2,
            pushToTalk: true
          },
          behaviorConfig: {
            autoSuggestCommands: true,
            confirmSensitiveCommands: true,
            showCommandHints: false,
            adaptiveResponses: true,
            contextAnnouncements: false
          }
        },
        supportedFeatures: ['code_execution', 'file_management', 'version_control'],
        examples: [
          'Run the development server',
          'Create a new React component',
          'Search for the login function in the codebase'
        ]
      },
      {
        type: VoiceContextType.MEDIA,
        name: 'Media Control',
        description: 'Media playback and entertainment commands',
        icon: '🎵',
        color: '#DC2626',
        availableCommands: [
          'play_music', 'pause_music', 'next_track', 'previous_track',
          'volume_up', 'volume_down', 'mute_audio', 'play_video',
          'pause_video', 'fullscreen', 'create_playlist', 'search_media'
        ],
        defaultSettings: {
          voiceConfig: {
            ttsSpeed: 1.0,
            autoStartListening: false,
            pushToTalk: true
          },
          behaviorConfig: {
            autoSuggestCommands: false,
            confirmSensitiveCommands: false,
            showCommandHints: false,
            adaptiveResponses: false,
            contextAnnouncements: false
          }
        },
        supportedFeatures: ['audio_control', 'video_control', 'playlist_management'],
        examples: [
          'Play my favorite playlist',
          'Turn up the volume',
          'Pause the current video'
        ]
      }
    ];

    modes.forEach(mode => {
      this.contextModes.set(mode.type, mode);
    });
  }

  private initializeContextualSettings(): void {
    this.contextModes.forEach((mode, contextType) => {
      const settings: ContextualVoiceSettings = {
        contextType,
        enabledCommands: mode.availableCommands,
        disabledCommands: [],
        customCommands: [],
        voiceConfig: mode.defaultSettings.voiceConfig || {},
        behaviorConfig: {
          autoSuggestCommands: true,
          confirmSensitiveCommands: false,
          showCommandHints: true,
          adaptiveResponses: true,
          contextAnnouncements: false,
          ...mode.defaultSettings.behaviorConfig
        },
        priority: this.getContextPriority(contextType),
        isActive: false
      };

      this.contextualSettings.set(contextType, settings);
    });
  }

  private getContextPriority(contextType: VoiceContextType): number {
    const priorities = {
      [VoiceContextType.CHAT]: 10,
      [VoiceContextType.TASKS]: 9,
      [VoiceContextType.SETTINGS]: 8,
      [VoiceContextType.BROWSER]: 7,
      [VoiceContextType.DEVELOPMENT]: 6,
      [VoiceContextType.MEDIA]: 5,
      [VoiceContextType.DASHBOARD]: 4,
      [VoiceContextType.SYSTEM]: 3,
      [VoiceContextType.PRODUCTIVITY]: 2,
      [VoiceContextType.COMMUNICATION]: 1,
      [VoiceContextType.NAVIGATION]: 1,
      [VoiceContextType.UNKNOWN]: 0
    };

    return priorities[contextType] || 0;
  }

  public getContextMode(contextType: VoiceContextType): VoiceContextMode | undefined {
    return this.contextModes.get(contextType);
  }

  public getAllContextModes(): VoiceContextMode[] {
    return Array.from(this.contextModes.values());
  }

  public getContextualSettings(contextType: VoiceContextType): ContextualVoiceSettings | undefined {
    return this.contextualSettings.get(contextType);
  }

  public updateContextualSettings(
    contextType: VoiceContextType,
    updates: Partial<ContextualVoiceSettings>
  ): void {
    const currentSettings = this.contextualSettings.get(contextType);
    if (currentSettings) {
      const updatedSettings = { ...currentSettings, ...updates };
      this.contextualSettings.set(contextType, updatedSettings);
    }
  }

  public getContextSuggestions(contextType: VoiceContextType): ContextSuggestion[] {
    const mode = this.contextModes.get(contextType);
    if (!mode) return [];

    const suggestions: ContextSuggestion[] = [];

    // Add example-based suggestions
    mode.examples.forEach((example, index) => {
      suggestions.push({
        id: `example_${contextType}_${index}`,
        context: contextType,
        command: this.extractCommandFromExample(example),
        description: example,
        confidence: 0.8,
        reason: 'context_relevance',
        metadata: { type: 'example' }
      });
    });

    // Add feature-based suggestions
    mode.supportedFeatures.forEach((feature, index) => {
      suggestions.push({
        id: `feature_${contextType}_${index}`,
        context: contextType,
        command: this.getCommandForFeature(feature),
        description: `Use ${feature} functionality`,
        confidence: 0.7,
        reason: 'context_relevance',
        metadata: { type: 'feature', feature }
      });
    });

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  private extractCommandFromExample(example: string): string {
    // Simple extraction of command-like phrases from examples
    const words = example.split(' ');
    const commandWords = words.slice(0, 3).join('_').toLowerCase();
    return commandWords.replace(/[^a-z_]/g, '');
  }

  private getCommandForFeature(feature: string): string {
    const featureCommandMap: Record<string, string> = {
      'task_creation': 'create_task',
      'project_management': 'list_projects',
      'productivity_tracking': 'task_summary',
      'voice_messaging': 'send_voice_message',
      'conversation_search': 'search_conversation',
      'real_time_communication': 'start_chat',
      'voice_guided_setup': 'open_settings',
      'configuration_management': 'change_voice_settings',
      'settings_backup': 'backup_settings',
      'web_navigation': 'open_website',
      'page_interaction': 'click_element',
      'content_reading': 'read_page',
      'overview': 'show_overview',
      'quick_navigation': 'navigate_to_section',
      'system_info': 'system_status',
      'code_execution': 'run_command',
      'file_management': 'create_file',
      'version_control': 'git_commit',
      'audio_control': 'play_music',
      'video_control': 'play_video',
      'playlist_management': 'create_playlist'
    };

    return featureCommandMap[feature] || feature.replace('_', '_');
  }

  public getActiveCommandsForContext(contextType: VoiceContextType): string[] {
    const settings = this.contextualSettings.get(contextType);
    if (!settings) return [];

    return settings.enabledCommands.filter(cmd =>
      !settings.disabledCommands.includes(cmd)
    );
  }

  public activateContext(contextType: VoiceContextType): void {
    // Deactivate all contexts first
    this.contextualSettings.forEach(settings => {
      settings.isActive = false;
    });

    // Activate the specified context
    const settings = this.contextualSettings.get(contextType);
    if (settings) {
      settings.isActive = true;
    }
  }

  public getActiveContext(): VoiceContextType | null {
    for (const [contextType, settings] of this.contextualSettings) {
      if (settings.isActive) {
        return contextType;
      }
    }
    return null;
  }

  public getContextTransitionMessage(fromContext: VoiceContextType, toContext: VoiceContextType): string {
    const fromMode = this.contextModes.get(fromContext);
    const toMode = this.contextModes.get(toContext);

    if (!fromMode || !toMode) {
      return `Switched to ${toMode?.name || toContext} mode`;
    }

    return `Switched from ${fromMode.name} to ${toMode.name} mode. ${toMode.description}`;
  }

  public isCommandAvailableInContext(command: string, contextType: VoiceContextType): boolean {
    const activeCommands = this.getActiveCommandsForContext(contextType);
    return activeCommands.includes(command);
  }

  public getRecommendedContextForCommand(command: string): VoiceContextType[] {
    const recommendations: Array<{ context: VoiceContextType; score: number }> = [];

    this.contextModes.forEach((mode, contextType) => {
      let score = 0;

      // Check if command is in available commands
      if (mode.availableCommands.includes(command)) {
        score += 10;
      }

      // Check if command relates to context features
      const commandLower = command.toLowerCase();
      mode.supportedFeatures.forEach(feature => {
        if (commandLower.includes(feature.replace('_', ''))) {
          score += 5;
        }
      });

      if (score > 0) {
        recommendations.push({ context: contextType, score });
      }
    });

    return recommendations
      .sort((a, b) => b.score - a.score)
      .map(r => r.context);
  }

  public destroy(): void {
    this.contextModes.clear();
    this.contextualSettings.clear();
  }
}