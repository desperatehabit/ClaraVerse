import {
  VoiceContextType,
  ContextInfo
} from '../../types/context-aware-voice';
import {
  VoiceCommand,
  VoiceCommandCategory,
  ParsedCommand,
  VoiceCommandResult,
  CommandAnalysisResult
} from '../../types/voice-commands';

export class AdaptiveCommandService {
  private contextCommands: Map<VoiceContextType, VoiceCommand[]> = new Map();
  private globalCommands: VoiceCommand[] = [];
  private commandUsage: Map<string, { count: number; successRate: number; lastUsed: Date }> = new Map();
  private contextCommandCache: Map<VoiceContextType, string[]> = new Map();

  constructor() {
    this.initializeGlobalCommands();
    this.initializeContextCommands();
    this.loadCommandUsageData();
  }

  private initializeGlobalCommands(): void {
    this.globalCommands = [
      {
        id: 'help',
        name: 'help',
        description: 'Get help and command suggestions',
        category: VoiceCommandCategory.NAVIGATION,
        patterns: ['help', 'what can i say', 'show commands', 'list commands'],
        handler: 'showHelp',
        examples: ['help', 'what can I say?', 'show me available commands']
      },
      {
        id: 'switch_context',
        name: 'switch_context',
        description: 'Switch to a different voice context',
        category: VoiceCommandCategory.NAVIGATION,
        patterns: ['switch to [context]', 'change to [context] mode', 'enter [context]'],
        parameters: [
          {
            name: 'context',
            type: 'string',
            required: true,
            description: 'Context to switch to (tasks, chat, settings, etc.)'
          }
        ],
        handler: 'switchContext',
        examples: ['switch to tasks', 'change to chat mode', 'enter settings context']
      },
      {
        id: 'status',
        name: 'status',
        description: 'Get current voice system status',
        category: VoiceCommandCategory.SYSTEM,
        patterns: ['status', 'voice status', 'system status', 'how am i doing'],
        handler: 'getStatus',
        examples: ['status', 'voice status', 'how am I doing?']
      }
    ];
  }

  private initializeContextCommands(): void {
    // Task Context Commands
    const taskCommands: VoiceCommand[] = [
      {
        id: 'create_task',
        name: 'create_task',
        description: 'Create a new task',
        category: VoiceCommandCategory.PRODUCTIVITY,
        patterns: [
          'create task [title]',
          'new task [title]',
          'add task [title]',
          'create [title] as task',
          'make a task for [title]'
        ],
        parameters: [
          {
            name: 'title',
            type: 'string',
            required: true,
            description: 'Task title or description'
          }
        ],
        handler: 'createTask',
        examples: [
          'create task review quarterly report',
          'new task call John about meeting',
          'add task buy groceries'
        ]
      },
      {
        id: 'list_tasks',
        name: 'list_tasks',
        description: 'List tasks with optional filtering',
        category: VoiceCommandCategory.PRODUCTIVITY,
        patterns: [
          'list tasks',
          'show tasks',
          'tasks',
          'list [filter] tasks',
          'show [filter] tasks'
        ],
        parameters: [
          {
            name: 'filter',
            type: 'string',
            required: false,
            description: 'Filter criteria (today, urgent, completed, etc.)'
          }
        ],
        handler: 'listTasks',
        examples: [
          'list tasks',
          'show urgent tasks',
          'list tasks for today',
          'show completed tasks'
        ]
      },
      {
        id: 'complete_task',
        name: 'complete_task',
        description: 'Mark a task as completed',
        category: VoiceCommandCategory.PRODUCTIVITY,
        patterns: [
          'complete task [title]',
          'mark [title] complete',
          'finish [title]',
          'done with [title]'
        ],
        parameters: [
          {
            name: 'title',
            type: 'string',
            required: true,
            description: 'Task to mark as completed'
          }
        ],
        handler: 'completeTask',
        examples: [
          'complete task review report',
          'mark database migration complete',
          'finish the quarterly review'
        ]
      },
      {
        id: 'search_tasks',
        name: 'search_tasks',
        description: 'Search for tasks by keyword',
        category: VoiceCommandCategory.PRODUCTIVITY,
        patterns: [
          'search tasks for [keyword]',
          'find tasks [keyword]',
          'look for [keyword] in tasks'
        ],
        parameters: [
          {
            name: 'keyword',
            type: 'string',
            required: true,
            description: 'Search keyword'
          }
        ],
        handler: 'searchTasks',
        examples: [
          'search tasks for meeting',
          'find tasks database',
          'look for urgent in tasks'
        ]
      }
    ];

    // Chat Context Commands
    const chatCommands: VoiceCommand[] = [
      {
        id: 'send_message',
        name: 'send_message',
        description: 'Send a message to someone',
        category: VoiceCommandCategory.COMMUNICATION,
        patterns: [
          'send message to [person]',
          'message [person] [message]',
          'tell [person] [message]'
        ],
        parameters: [
          {
            name: 'person',
            type: 'string',
            required: true,
            description: 'Recipient name'
          },
          {
            name: 'message',
            type: 'string',
            required: true,
            description: 'Message content'
          }
        ],
        handler: 'sendMessage',
        examples: [
          'send message to John about the project',
          'message Sarah I will be late',
          'tell Mike meeting is at 3pm'
        ]
      },
      {
        id: 'read_messages',
        name: 'read_messages',
        description: 'Read recent messages or from specific person',
        category: VoiceCommandCategory.COMMUNICATION,
        patterns: [
          'read messages',
          'check messages',
          'read from [person]',
          'messages from [person]'
        ],
        parameters: [
          {
            name: 'person',
            type: 'string',
            required: false,
            description: 'Specific person to read messages from'
          }
        ],
        handler: 'readMessages',
        examples: [
          'read messages',
          'check my messages',
          'read from John'
        ]
      },
      {
        id: 'start_chat',
        name: 'start_chat',
        description: 'Start a chat with someone',
        category: VoiceCommandCategory.COMMUNICATION,
        patterns: [
          'start chat with [person]',
          'chat with [person]',
          'begin conversation with [person]'
        ],
        parameters: [
          {
            name: 'person',
            type: 'string',
            required: true,
            description: 'Person to start chat with'
          }
        ],
        handler: 'startChat',
        examples: [
          'start chat with Sarah',
          'chat with John',
          'begin conversation with Mike'
        ]
      }
    ];

    // Settings Context Commands
    const settingsCommands: VoiceCommand[] = [
      {
        id: 'open_settings',
        name: 'open_settings',
        description: 'Open voice or application settings',
        category: VoiceCommandCategory.SYSTEM,
        patterns: [
          'open settings',
          'show settings',
          'voice settings',
          'app settings'
        ],
        handler: 'openSettings',
        examples: [
          'open settings',
          'show voice settings',
          'open app settings'
        ]
      },
      {
        id: 'change_voice',
        name: 'change_voice',
        description: 'Change voice settings',
        category: VoiceCommandCategory.SYSTEM,
        patterns: [
          'change voice to [voice]',
          'set voice [voice]',
          'use [voice] voice',
          'switch voice'
        ],
        parameters: [
          {
            name: 'voice',
            type: 'string',
            required: false,
            description: 'Voice name or type (male, female, etc.)'
          }
        ],
        handler: 'changeVoice',
        examples: [
          'change voice to female',
          'set voice to Alex',
          'use a deeper voice'
        ]
      },
      {
        id: 'toggle_feature',
        name: 'toggle_feature',
        description: 'Enable or disable a feature',
        category: VoiceCommandCategory.SYSTEM,
        patterns: [
          'enable [feature]',
          'disable [feature]',
          'turn on [feature]',
          'turn off [feature]'
        ],
        parameters: [
          {
            name: 'feature',
            type: 'string',
            required: true,
            description: 'Feature to toggle'
          }
        ],
        handler: 'toggleFeature',
        examples: [
          'enable push to talk',
          'disable voice activation',
          'turn on auto suggestions'
        ]
      }
    ];

    // Browser Context Commands
    const browserCommands: VoiceCommand[] = [
      {
        id: 'open_website',
        name: 'open_website',
        description: 'Open a website or search the web',
        category: VoiceCommandCategory.BROWSER,
        patterns: [
          'open [website]',
          'go to [website]',
          'visit [website]',
          'search for [query]'
        ],
        parameters: [
          {
            name: 'website',
            type: 'url',
            required: true,
            description: 'Website URL or search query'
          }
        ],
        handler: 'openWebsite',
        examples: [
          'open google.com',
          'go to github',
          'search for machine learning tutorials'
        ]
      },
      {
        id: 'navigate',
        name: 'navigate',
        description: 'Navigate browser actions',
        category: VoiceCommandCategory.BROWSER,
        patterns: [
          'go back',
          'go forward',
          'refresh',
          'new tab',
          'close tab'
        ],
        handler: 'navigateBrowser',
        examples: [
          'go back',
          'refresh the page',
          'open new tab'
        ]
      }
    ];

    // Development Context Commands
    const devCommands: VoiceCommand[] = [
      {
        id: 'run_command',
        name: 'run_command',
        description: 'Run a development command',
        category: VoiceCommandCategory.DEVELOPMENT,
        patterns: [
          'run [command]',
          'execute [command]',
          'npm [command]',
          'git [command]'
        ],
        parameters: [
          {
            name: 'command',
            type: 'string',
            required: true,
            description: 'Command to execute'
          }
        ],
        handler: 'runDevCommand',
        examples: [
          'run npm start',
          'execute npm test',
          'git status',
          'npm install'
        ]
      },
      {
        id: 'create_file',
        name: 'create_file',
        description: 'Create a new file',
        category: VoiceCommandCategory.DEVELOPMENT,
        patterns: [
          'create file [filename]',
          'new file [filename]',
          'make file [filename]'
        ],
        parameters: [
          {
            name: 'filename',
            type: 'file',
            required: true,
            description: 'File name with extension'
          }
        ],
        handler: 'createFile',
        examples: [
          'create file app.js',
          'new file index.html',
          'make file styles.css'
        ]
      }
    ];

    // Media Context Commands
    const mediaCommands: VoiceCommand[] = [
      {
        id: 'play_music',
        name: 'play_music',
        description: 'Control music playback',
        category: VoiceCommandCategory.MEDIA,
        patterns: [
          'play [song/artist]',
          'play music',
          'pause',
          'next',
          'previous',
          'volume [level]'
        ],
        parameters: [
          {
            name: 'song',
            type: 'string',
            required: false,
            description: 'Song or artist name'
          },
          {
            name: 'level',
            type: 'number',
            required: false,
            description: 'Volume level (0-100)'
          }
        ],
        handler: 'controlMusic',
        examples: [
          'play my favorite playlist',
          'pause music',
          'next song',
          'volume 50'
        ]
      }
    ];

    this.contextCommands.set(VoiceContextType.TASKS, taskCommands);
    this.contextCommands.set(VoiceContextType.CHAT, chatCommands);
    this.contextCommands.set(VoiceContextType.SETTINGS, settingsCommands);
    this.contextCommands.set(VoiceContextType.BROWSER, browserCommands);
    this.contextCommands.set(VoiceContextType.DEVELOPMENT, devCommands);
    this.contextCommands.set(VoiceContextType.MEDIA, mediaCommands);
  }

  private loadCommandUsageData(): void {
    try {
      const stored = localStorage.getItem('voice_command_usage');
      if (stored) {
        const data = JSON.parse(stored);
        this.commandUsage = new Map(Object.entries(data));
      }
    } catch (error) {
      console.error('Failed to load command usage data:', error);
    }
  }

  private saveCommandUsageData(): void {
    try {
      const data = Object.fromEntries(this.commandUsage);
      localStorage.setItem('voice_command_usage', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save command usage data:', error);
    }
  }

  public getAvailableCommands(contextType?: VoiceContextType): VoiceCommand[] {
    const commands: VoiceCommand[] = [...this.globalCommands];

    if (contextType) {
      const contextCommands = this.contextCommands.get(contextType) || [];
      commands.push(...contextCommands);
    } else {
      // Add all context commands if no specific context
      this.contextCommands.forEach(contextCmds => {
        commands.push(...contextCmds);
      });
    }

    return commands;
  }

  public getCommandsForContext(contextType: VoiceContextType): VoiceCommand[] {
    const cached = this.contextCommandCache.get(contextType);
    if (cached) {
      return cached.map(cmdName => this.findCommandByName(cmdName)).filter(Boolean) as VoiceCommand[];
    }

    const contextCommands = this.contextCommands.get(contextType) || [];
    const globalCommands = this.globalCommands;
    const allCommands = [...globalCommands, ...contextCommands];

    // Cache command names for performance
    this.contextCommandCache.set(contextType, allCommands.map(cmd => cmd.name));

    return allCommands;
  }

  private findCommandByName(name: string): VoiceCommand | null {
    // Search in global commands
    let command = this.globalCommands.find(cmd => cmd.name === name);

    // Search in context commands
    if (!command) {
      for (const contextCmds of this.contextCommands.values()) {
        command = contextCmds.find(cmd => cmd.name === name);
        if (command) break;
      }
    }

    return command || null;
  }

  public parseCommand(input: string, contextType?: VoiceContextType): ParsedCommand | null {
    const commands = this.getAvailableCommands(contextType);
    let bestMatch: VoiceCommand | null = null;
    let bestScore = 0;
    let bestParams: Record<string, unknown> = {};

    for (const command of commands) {
      const result = this.matchCommand(input, command);
      if (result.match && result.score > bestScore) {
        bestMatch = command;
        bestScore = result.score;
        bestParams = result.parameters;
      }
    }

    if (bestMatch && bestScore > 0.3) { // Minimum confidence threshold
      return {
        command: bestMatch,
        parameters: bestParams,
        confidence: bestScore,
        rawText: input
      };
    }

    return null;
  }

  private matchCommand(input: string, command: VoiceCommand): {
    match: boolean;
    score: number;
    parameters: Record<string, unknown>;
  } {
    let score = 0;
    const parameters: Record<string, unknown> = {};
    const inputLower = input.toLowerCase();

    // Direct pattern matching
    for (const pattern of command.patterns) {
      const patternScore = this.calculatePatternMatch(inputLower, pattern.toLowerCase(), parameters);
      if (patternScore > score) {
        score = patternScore;
      }
    }

    // Keyword matching as fallback
    if (score === 0) {
      const keywords = command.name.split('_');
      const keywordMatches = keywords.filter(keyword =>
        inputLower.includes(keyword)
      ).length;
      score = keywordMatches / keywords.length * 0.5;
    }

    return {
      match: score > 0.1,
      score: Math.min(score, 1.0),
      parameters
    };
  }

  private calculatePatternMatch(input: string, pattern: string, parameters: Record<string, unknown>): number {
    // Simple pattern matching with parameter extraction
    // This is a basic implementation - in a real system you'd use NLP

    let score = 0;
    const inputWords = input.split(' ');
    const patternWords = pattern.split(' ');

    // Check for exact matches first
    if (input === pattern) {
      return 1.0;
    }

    // Check for partial matches with parameter placeholders
    for (let i = 0; i < patternWords.length; i++) {
      const patternWord = patternWords[i];

      if (patternWord.startsWith('[') && patternWord.endsWith(']')) {
        // Parameter placeholder
        const paramName = patternWord.slice(1, -1);
        if (i < inputWords.length) {
          parameters[paramName] = inputWords[i];
          score += 0.8;
        }
      } else if (i < inputWords.length && inputWords[i] === patternWord) {
        score += 1.0;
      } else {
        // Word doesn't match
        score -= 0.2;
      }
    }

    return Math.max(0, score / patternWords.length);
  }

  public async executeCommand(
    parsedCommand: ParsedCommand,
    context?: ContextInfo
  ): Promise<VoiceCommandResult> {
    try {
      // Record usage
      this.recordCommandUsage(parsedCommand.command.name, true);

      // Execute based on handler
      const result = await this.executeCommandHandler(parsedCommand, context);

      return result;
    } catch (error) {
      // Record failure
      this.recordCommandUsage(parsedCommand.command.name, false);

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Command execution failed'
      };
    }
  }

  private async executeCommandHandler(
    parsedCommand: ParsedCommand,
    context?: ContextInfo
  ): Promise<VoiceCommandResult> {
    const { command, parameters } = parsedCommand;

    switch (command.handler) {
      case 'showHelp':
        return {
          success: true,
          message: this.generateHelpText(context?.type),
          data: { suggestions: this.getCommandSuggestions(context?.type) }
        };

      case 'switchContext': {
        const targetContext = parameters.context as VoiceContextType;
        return {
          success: true,
          message: `Switching to ${targetContext} context`,
          data: { targetContext, requiresContextSwitch: true }
        };
      }

      case 'getStatus':
        return {
          success: true,
          message: this.generateStatusText(context),
          data: { context, availableCommands: this.getAvailableCommands(context?.type).length }
        };

      case 'createTask':
        return {
          success: true,
          message: `Creating task: ${parameters.title}`,
          data: { task: { title: parameters.title, context: context?.type } }
        };

      case 'listTasks':
        return {
          success: true,
          message: `Listing ${parameters.filter || 'all'} tasks`,
          data: { filter: parameters.filter, context: context?.type }
        };

      case 'sendMessage':
        return {
          success: true,
          message: `Sending message to ${parameters.person}: ${parameters.message}`,
          data: { recipient: parameters.person, message: parameters.message }
        };

      case 'openWebsite':
        return {
          success: true,
          message: `Opening ${parameters.website}`,
          data: { url: parameters.website }
        };

      default:
        return {
          success: false,
          message: `Unknown command handler: ${command.handler}`
        };
    }
  }

  private generateHelpText(contextType?: VoiceContextType): string {
    const commands = this.getAvailableCommands(contextType);
    const contextName = contextType ? `${contextType} context` : 'all contexts';

    let help = `Available commands in ${contextName}:\n\n`;

    // Group commands by category
    const byCategory = commands.reduce((acc, cmd) => {
      if (!acc[cmd.category]) acc[cmd.category] = [];
      acc[cmd.category].push(cmd);
      return acc;
    }, {} as Record<VoiceCommandCategory, VoiceCommand[]>);

    Object.entries(byCategory).forEach(([category, cmds]) => {
      help += `${category}:\n`;
      cmds.slice(0, 3).forEach(cmd => {
        help += `  • ${cmd.name} - ${cmd.description}\n`;
      });
      help += '\n';
    });

    return help;
  }

  private generateStatusText(context?: ContextInfo): string {
    const contextInfo = context ? ` in ${context.type} context` : '';
    const commandsCount = this.getAvailableCommands(context?.type).length;

    return `Voice system active${contextInfo}. ${commandsCount} commands available.`;
  }

  private getCommandSuggestions(contextType?: VoiceContextType): string[] {
    const commands = this.getAvailableCommands(contextType);
    const usageData = Array.from(this.commandUsage.entries())
      .sort(([, a], [, b]) => b.successRate - a.successRate)
      .slice(0, 5);

    const suggestions = usageData.map(([name]) => name);

    // Add some popular commands if we don't have usage data
    if (suggestions.length < 3) {
      const popularCommands = ['help', 'create_task', 'send_message', 'open_website'];
      popularCommands.forEach(cmd => {
        if (!suggestions.includes(cmd) && commands.some(c => c.name === cmd)) {
          suggestions.push(cmd);
        }
      });
    }

    return suggestions.slice(0, 5);
  }

  private recordCommandUsage(commandName: string, success: boolean): void {
    const existing = this.commandUsage.get(commandName) || { count: 0, successRate: 0, lastUsed: new Date() };

    existing.count += 1;
    existing.lastUsed = new Date();
    existing.successRate = (existing.successRate * (existing.count - 1) + (success ? 1 : 0)) / existing.count;

    this.commandUsage.set(commandName, existing);
    this.saveCommandUsageData();
  }

  public getCommandUsageStats(): Array<{ command: string; count: number; successRate: number }> {
    return Array.from(this.commandUsage.entries())
      .map(([command, stats]) => ({ command, ...stats }))
      .sort((a, b) => b.count - a.count);
  }

  public addCustomCommand(command: VoiceCommand, contextType?: VoiceContextType): void {
    if (contextType) {
      const contextCommands = this.contextCommands.get(contextType) || [];
      contextCommands.push(command);
      this.contextCommands.set(contextType, contextCommands);
      this.contextCommandCache.delete(contextType); // Clear cache
    } else {
      this.globalCommands.push(command);
    }
  }

  public removeCommand(commandName: string, contextType?: VoiceContextType): boolean {
    if (contextType) {
      const contextCommands = this.contextCommands.get(contextType);
      if (contextCommands) {
        const index = contextCommands.findIndex(cmd => cmd.name === commandName);
        if (index !== -1) {
          contextCommands.splice(index, 1);
          this.contextCommandCache.delete(contextType); // Clear cache
          return true;
        }
      }
    } else {
      const index = this.globalCommands.findIndex(cmd => cmd.name === commandName);
      if (index !== -1) {
        this.globalCommands.splice(index, 1);
        return true;
      }
    }
    return false;
  }

  public getRecommendedCommands(contextType?: VoiceContextType, limit = 5): VoiceCommand[] {
    const commands = this.getAvailableCommands(contextType);
    const usageStats = this.getCommandUsageStats();

    // Sort by usage frequency and success rate
    const scoredCommands = commands.map(command => {
      const usage = usageStats.find(u => u.command === command.name);
      const score = usage ? (usage.count * usage.successRate) : 0.1;
      return { command, score };
    });

    return scoredCommands
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.command);
  }

  public searchCommands(query: string, contextType?: VoiceContextType): VoiceCommand[] {
    const commands = this.getAvailableCommands(contextType);
    const queryLower = query.toLowerCase();

    return commands.filter(command =>
      command.name.toLowerCase().includes(queryLower) ||
      command.description.toLowerCase().includes(queryLower) ||
      command.examples.some(example => example.toLowerCase().includes(queryLower))
    );
  }

  public getCommandContext(commandName: string): CommandAnalysisResult | null {
    const command = this.findCommandByName(commandName);
    if (!command) return null;

    // Determine appropriate context for this command
    let contextType = VoiceContextType.DASHBOARD;
    let confidence = 0.5;

    // Find the most appropriate context
    for (const [ctxType, commands] of this.contextCommands) {
      if (commands.some(cmd => cmd.name === commandName)) {
        contextType = ctxType;
        confidence = 0.9;
        break;
      }
    }

    return {
      command: command,
      context: {
        type: contextType,
        confidence,
        metadata: {},
        timestamp: new Date(),
        source: 'command_analysis'
      },
      parameters: {},
      confidence,
      rawText: commandName,
      suggestedActions: [],
      relatedCommands: this.findRelatedCommands(command)
    };
  }

  private findRelatedCommands(command: VoiceCommand): string[] {
    const related: string[] = [];
    const commands = this.getAvailableCommands();

    // Find commands in the same category
    const categoryCommands = commands
      .filter(cmd => cmd.category === command.category && cmd.name !== command.name)
      .slice(0, 3);

    categoryCommands.forEach(cmd => related.push(cmd.name));

    // Find commands with similar names or purposes
    const similarCommands = commands
      .filter(cmd =>
        cmd.name !== command.name &&
        (cmd.name.includes(command.name.split('_')[0]) ||
         command.name.includes(cmd.name.split('_')[0]))
      )
      .slice(0, 2);

    similarCommands.forEach(cmd => {
      if (!related.includes(cmd.name)) {
        related.push(cmd.name);
      }
    });

    return related;
  }

  public destroy(): void {
    this.saveCommandUsageData();
    this.contextCommands.clear();
    this.globalCommands = [];
    this.commandUsage.clear();
    this.contextCommandCache.clear();
  }
}