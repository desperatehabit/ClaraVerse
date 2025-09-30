import {
  VoiceCommand,
  ParsedCommand,
  VoiceCommandParameter,
  VoiceCommandCategory
} from '../../types/voice-commands';

export class VoiceCommandParser {
  private commands: Map<string, VoiceCommand> = new Map();
  private commandPatterns: Map<VoiceCommandCategory, VoiceCommand[]> = new Map();

  constructor() {
    this.initializeDefaultCommands();
  }

  /**
   * Register a new voice command
   */
  public registerCommand(command: VoiceCommand): void {
    this.commands.set(command.id, command);

    if (!this.commandPatterns.has(command.category)) {
      this.commandPatterns.set(command.category, []);
    }
    this.commandPatterns.get(command.category)!.push(command);
  }

  /**
   * Register multiple commands
   */
  public registerCommands(commands: VoiceCommand[]): void {
    commands.forEach(command => this.registerCommand(command));
  }

  /**
   * Parse natural language text into a voice command
   */
  public async parseCommand(text: string): Promise<ParsedCommand | null> {
    const normalizedText = this.normalizeText(text);

    // Try to find matching commands
    const candidates = this.findCommandCandidates(normalizedText);

    if (candidates.length === 0) {
      return null;
    }

    // Score and rank candidates
    const scoredCandidates = candidates.map(candidate => ({
      ...candidate,
      score: this.scoreCommandMatch(candidate, normalizedText)
    }));

    // Sort by score (highest first)
    scoredCandidates.sort((a, b) => b.score - a.score);

    const bestMatch = scoredCandidates[0];

    // If confidence is too low, return null
    if (bestMatch.score < 0.3) {
      return null;
    }

    // Extract parameters from the text
    const parameters = this.extractParameters(bestMatch.command, normalizedText);

    return {
      command: bestMatch.command,
      parameters,
      confidence: bestMatch.score,
      rawText: text
    };
  }

  /**
   * Get all commands in a category
   */
  public getCommandsByCategory(category: VoiceCommandCategory): VoiceCommand[] {
    return this.commandPatterns.get(category) || [];
  }

  /**
   * Get all registered commands
   */
  public getAllCommands(): VoiceCommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * Search commands by name or description
   */
  public searchCommands(query: string): VoiceCommand[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllCommands().filter(command =>
      command.name.toLowerCase().includes(lowerQuery) ||
      command.description.toLowerCase().includes(lowerQuery) ||
      command.examples.some(example => example.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Normalize text for better matching
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Find potential command matches
   */
  private findCommandCandidates(text: string): Array<{command: VoiceCommand, matches: string[]}> {
    const candidates: Array<{command: VoiceCommand, matches: string[]}> = [];

    for (const command of this.commands.values()) {
      const matches: string[] = [];

      // Check each pattern
      for (const pattern of command.patterns) {
        const normalizedPattern = this.normalizeText(pattern);
        const words = normalizedPattern.split(' ');

        // Count matching words
        let matchCount = 0;
        for (const word of words) {
          if (word.length > 2 && text.includes(word)) {
            matchCount++;
          }
        }

        // If we have significant word matches, consider it a candidate
        if (matchCount >= Math.min(2, words.length * 0.5)) {
          matches.push(pattern);
        }
      }

      if (matches.length > 0) {
        candidates.push({ command, matches });
      }
    }

    return candidates;
  }

  /**
   * Score how well a command matches the input text
   */
  private scoreCommandMatch(
    candidate: {command: VoiceCommand, matches: string[]},
    text: string
  ): number {
    let score = 0;
    const { command, matches } = candidate;

    // Base score from pattern matches
    const bestPatternMatch = Math.max(...matches.map(pattern => {
      const normalizedPattern = this.normalizeText(pattern);
      const patternWords = normalizedPattern.split(' ');
      const textWords = text.split(' ');

      let wordMatches = 0;
      for (const patternWord of patternWords) {
        if (patternWord.length > 2) {
          for (const textWord of textWords) {
            if (this.wordsMatch(patternWord, textWord)) {
              wordMatches++;
              break;
            }
          }
        }
      }

      return patternWords.length > 0 ? wordMatches / patternWords.length : 0;
    }));

    score += bestPatternMatch * 0.6;

    // Boost score for exact name matches
    if (text.includes(this.normalizeText(command.name))) {
      score += 0.3;
    }

    // Boost score for synonym matches
    const synonyms = this.getCommandSynonyms(command);
    for (const synonym of synonyms) {
      if (text.includes(this.normalizeText(synonym))) {
        score += 0.1;
        break;
      }
    }

    return Math.min(1.0, score);
  }

  /**
   * Extract parameters from command text
   */
  private extractParameters(command: VoiceCommand, text: string): Record<string, any> {
    const parameters: Record<string, any> = {};

    if (!command.parameters) {
      return parameters;
    }

    for (const param of command.parameters) {
      const value = this.extractParameterValue(param, text);
      if (value !== null) {
        parameters[param.name] = value;
      } else if (param.required) {
        // For required parameters, try to find any reasonable value
        parameters[param.name] = this.extractFallbackValue(param, text);
      }
    }

    return parameters;
  }

  /**
   * Extract a specific parameter value
   */
  private extractParameterValue(param: VoiceCommandParameter, text: string): any {
    // This is a simplified implementation
    // In a real system, you'd use more sophisticated NLP techniques

    const textLower = text.toLowerCase();

    // Look for common parameter indicators
    const indicators = [
      `${param.name}:`,
      `${param.name} is`,
      `${param.name} =`,
      `with ${param.name}`,
      `to ${param.name}`
    ];

    for (const indicator of indicators) {
      const index = textLower.indexOf(indicator);
      if (index !== -1) {
        const valueStart = index + indicator.length;
        const remainingText = text.substring(valueStart).trim();

        // Extract until next word boundary or common delimiters
        const value = remainingText.split(/[\s,;]/)[0];
        if (value) {
          return this.parseParameterValue(value, param.type);
        }
      }
    }

    // If no explicit indicator, try to extract based on parameter type
    return this.extractByType(param, text);
  }

  /**
   * Extract fallback value for missing parameters
   */
  private extractFallbackValue(param: VoiceCommandParameter, text: string): any {
    return this.extractByType(param, text);
  }

  /**
   * Extract parameter based on its type
   */
  private extractByType(param: VoiceCommandParameter, text: string): any {
    switch (param.type) {
      case 'url':
        return this.extractUrl(text);
      case 'application':
        return this.extractApplication(text);
      case 'file':
        return this.extractFile(text);
      case 'number':
        return this.extractNumber(text);
      default:
        return this.extractString(text);
    }
  }

  /**
   * Parse parameter value based on type
   */
  private parseParameterValue(value: string, type: VoiceCommandParameter['type']): any {
    switch (type) {
      case 'number':
        const num = parseFloat(value);
        return isNaN(num) ? value : num;
      case 'boolean':
        return ['true', 'yes', 'on', 'enable', 'enabled'].includes(value.toLowerCase());
      case 'url':
        return value.startsWith('http') ? value : `https://${value}`;
      default:
        return value;
    }
  }

  /**
   * Extract URL from text
   */
  private extractUrl(text: string): string | null {
    const urlRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/g;
    const matches = text.match(urlRegex);
    return matches ? matches[0] : null;
  }

  /**
   * Extract application name from text
   */
  private extractApplication(text: string): string | null {
    // Common application patterns
    const appPatterns = [
      'open (.+)', 'launch (.+)', 'start (.+)',
      'switch to (.+)', 'go to (.+)'
    ];

    for (const pattern of appPatterns) {
      const regex = new RegExp(pattern, 'i');
      const match = text.match(regex);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Extract file path from text
   */
  private extractFile(text: string): string | null {
    const fileRegex = /(?:open|edit|read)\s+(.+\.[a-zA-Z0-9]+)/i;
    const match = text.match(fileRegex);
    return match ? match[1].trim() : null;
  }

  /**
   * Extract number from text
   */
  private extractNumber(text: string): number | null {
    const numberRegex = /(\d+(?:\.\d+)?)/;
    const match = text.match(numberRegex);
    if (match) {
      const num = parseFloat(match[1]);
      return isNaN(num) ? null : num;
    }
    return null;
  }

  /**
   * Extract string value
   */
  private extractString(text: string): string | null {
    // Return the whole text as a fallback
    return text.trim() || null;
  }

  /**
   * Check if two words match (including partial matches)
   */
  private wordsMatch(word1: string, word2: string): boolean {
    if (word1 === word2) return true;

    // Allow partial matches for longer words
    if (word1.length > 4 && word2.length > 4) {
      return word1.includes(word2) || word2.includes(word1);
    }

    return false;
  }

  /**
   * Get synonyms for a command
   */
  private getCommandSynonyms(command: VoiceCommand): string[] {
    const synonyms: string[] = [];

    // Add category-based synonyms
    switch (command.category) {
      case VoiceCommandCategory.BROWSER:
        synonyms.push('web', 'internet', 'browse');
        break;
      case VoiceCommandCategory.SYSTEM:
        synonyms.push('computer', 'os', 'operating system');
        break;
      case VoiceCommandCategory.APPLICATION:
        synonyms.push('app', 'program', 'software');
        break;
      case VoiceCommandCategory.FILESYSTEM:
        synonyms.push('files', 'folder', 'directory');
        break;
    }

    return synonyms;
  }

  /**
   * Initialize default voice commands
   */
  private initializeDefaultCommands(): void {
    const defaultCommands: VoiceCommand[] = [
      // Browser commands
      {
        id: 'open_browser',
        name: 'Open Browser',
        description: 'Open a web browser',
        category: VoiceCommandCategory.BROWSER,
        patterns: ['open browser', 'launch browser', 'start browser'],
        parameters: [
          {
            name: 'browser',
            type: 'application',
            required: false,
            description: 'Browser to open (chrome, firefox, edge, safari)'
          }
        ],
        handler: 'browser.open',
        examples: ['open chrome', 'launch firefox', 'open browser']
      },
      {
        id: 'navigate_to',
        name: 'Navigate To',
        description: 'Navigate to a website',
        category: VoiceCommandCategory.BROWSER,
        patterns: ['go to', 'navigate to', 'visit', 'open'],
        parameters: [
          {
            name: 'url',
            type: 'url',
            required: true,
            description: 'Website URL to navigate to'
          }
        ],
        handler: 'browser.navigate',
        examples: ['go to google.com', 'navigate to github.com', 'open youtube']
      },
      {
        id: 'close_tab',
        name: 'Close Tab',
        description: 'Close the current browser tab',
        category: VoiceCommandCategory.BROWSER,
        patterns: ['close tab', 'close current tab'],
        handler: 'browser.closeTab',
        examples: ['close tab', 'close current tab']
      },

      // System commands
      {
        id: 'lock_screen',
        name: 'Lock Screen',
        description: 'Lock the computer screen',
        category: VoiceCommandCategory.SYSTEM,
        patterns: ['lock screen', 'lock computer', 'lock pc'],
        handler: 'system.lock',
        sensitive: true,
        examples: ['lock screen', 'lock my computer']
      },
      {
        id: 'take_screenshot',
        name: 'Take Screenshot',
        description: 'Take a screenshot',
        category: VoiceCommandCategory.SYSTEM,
        patterns: ['take screenshot', 'capture screen', 'screenshot'],
        handler: 'system.screenshot',
        examples: ['take screenshot', 'capture screen']
      },
      {
        id: 'adjust_volume',
        name: 'Adjust Volume',
        description: 'Adjust system volume',
        category: VoiceCommandCategory.SYSTEM,
        patterns: ['set volume', 'adjust volume', 'volume'],
        parameters: [
          {
            name: 'level',
            type: 'number',
            required: true,
            description: 'Volume level (0-100)'
          }
        ],
        handler: 'system.volume',
        examples: ['set volume to 50', 'volume 75']
      },

      // Application commands
      {
        id: 'open_application',
        name: 'Open Application',
        description: 'Open an application',
        category: VoiceCommandCategory.APPLICATION,
        patterns: ['open', 'launch', 'start'],
        parameters: [
          {
            name: 'application',
            type: 'application',
            required: true,
            description: 'Application name'
          }
        ],
        handler: 'application.open',
        examples: ['open vscode', 'launch calculator', 'start chrome']
      },
      {
        id: 'switch_to_app',
        name: 'Switch Application',
        description: 'Switch to a running application',
        category: VoiceCommandCategory.APPLICATION,
        patterns: ['switch to', 'focus', 'activate'],
        parameters: [
          {
            name: 'application',
            type: 'application',
            required: true,
            description: 'Application to switch to'
          }
        ],
        handler: 'application.switch',
        examples: ['switch to chrome', 'focus on vscode']
      },

      // File system commands
      {
        id: 'open_file',
        name: 'Open File',
        description: 'Open a file',
        category: VoiceCommandCategory.FILESYSTEM,
        patterns: ['open file', 'read file', 'edit file'],
        parameters: [
          {
            name: 'file',
            type: 'file',
            required: true,
            description: 'File path or name'
          }
        ],
        handler: 'filesystem.open',
        examples: ['open document.txt', 'read myfile.docx']
      }
    ];

    this.registerCommands(defaultCommands);
  }
}