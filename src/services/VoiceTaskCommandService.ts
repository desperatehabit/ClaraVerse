
export interface VoiceCommandResult {
  action: 'create' | 'update' | 'delete' | 'complete' | 'create_project' | 'show_project' | 'move_task' | 'help';
  parameters: {
    title?: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    due_date?: string;
    project_name?: string;
    task_id?: string;
    project_id?: string;
    status?: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  };
  confidence: number;
  original_command: string;
}

export interface ParsedTaskData {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: Date;
  project_name?: string;
}

/**
 * Enhanced voice command parsing service for task management
 * Parses natural language commands into structured task operations
 */
export class VoiceTaskCommandService {
  private commandPatterns = {
    // Task creation patterns
    create: [
      /(?:create|add|new)\s+task(?:\s+to|\s+for)?\s+(.+)/i,
      /(?:make|do)\s+(.+?)(?:\s+task)?/i,
      /i\s+need\s+to\s+(.+)/i,
      /remind\s+me\s+to\s+(.+)/i,
    ],

    // Task completion patterns
    complete: [
      /(?:complete|finish|done|mark\s+as\s+done)\s+(.+)/i,
      /(?:check\s+off|tick\s+off)\s+(.+)/i,
      /i'?m\s+done\s+with\s+(.+)/i,
    ],

    // Task update patterns
    update: [
      /change\s+(.+?)\s+(?:priority\s+to\s+)?(.+)/i,
      /make\s+(.+?)\s+(?:priority\s+)?(.+)/i,
      /set\s+(.+?)\s+(?:priority\s+to\s+)?(.+)/i,
    ],

    // Task deletion patterns
    delete: [
      /(?:delete|remove|cancel)\s+(.+)/i,
      /get\s+rid\s+of\s+(.+)/i,
    ],

    // Project creation patterns
    create_project: [
      /(?:create|add|new)\s+project\s+(.+)/i,
      /make\s+(.+?)\s+project/i,
    ],

    // Project selection patterns
    show_project: [
      /show\s+(.+?)\s+(?:tasks|project)/i,
      /open\s+(.+?)\s+(?:tasks|project)/i,
      /go\s+to\s+(.+?)\s+(?:tasks|project)/i,
    ],

    // Move task patterns
    move_task: [
      /move\s+(.+?)\s+to\s+(.+)/i,
      /put\s+(.+?)\s+in\s+(.+)/i,
    ],
  };

  private priorityKeywords = {
    'low': ['low', 'minor', 'small', 'unimportant'],
    'medium': ['medium', 'normal', 'regular', 'average'],
    'high': ['high', 'important', 'urgent', 'critical', 'priority'],
    'urgent': ['urgent', 'asap', 'emergency', 'critical', 'rush'],
  };

  private timeKeywords = {
    'today': ['today', 'tonight', 'this evening'],
    'tomorrow': ['tomorrow'],
    'next_week': ['next week', 'week from now'],
    'next_month': ['next month', 'month from now'],
    'monday': ['monday', 'on monday'],
    'tuesday': ['tuesday', 'on tuesday'],
    'wednesday': ['wednesday', 'on wednesday'],
    'thursday': ['thursday', 'on thursday'],
    'friday': ['friday', 'on friday'],
    'saturday': ['saturday', 'on saturday'],
    'sunday': ['sunday', 'on sunday'],
  };

  /**
   * Parse a voice command into structured task data
   */
  parseCommand(command: string): VoiceCommandResult {
    const trimmedCommand = command.trim().toLowerCase();

    // Try to match against each pattern type
    for (const [action, patterns] of Object.entries(this.commandPatterns)) {
      for (const pattern of patterns) {
        const match = trimmedCommand.match(pattern);
        if (match) {
          const result = this.processMatch(action as any, match, command);
          if (result) {
            return result;
          }
        }
      }
    }

    // If no specific pattern matches, try to extract task information
    const taskInfo = this.extractTaskInfo(command);
    if (taskInfo) {
      return {
        action: 'create',
        parameters: {
          title: taskInfo.title,
          description: taskInfo.description,
          priority: taskInfo.priority,
          due_date: taskInfo.due_date?.toISOString(),
        },
        confidence: 0.6,
        original_command: command,
      };
    }

    // Return help action if nothing matches
    return {
      action: 'help',
      parameters: {},
      confidence: 0.3,
      original_command: command,
    };
  }

  /**
   * Process a regex match and extract parameters
   */
  private processMatch(action: VoiceCommandResult['action'], match: RegExpMatchArray, originalCommand: string): VoiceCommandResult | null {
    const parameters: VoiceCommandResult['parameters'] = {};
    let confidence = 0.8;

    switch (action) {
      case 'create':
        const taskMatch = match[1];
        const taskInfo = this.extractTaskInfo(taskMatch);
        if (taskInfo) {
          parameters.title = taskInfo.title;
          parameters.description = taskInfo.description;
          parameters.priority = taskInfo.priority;
          parameters.due_date = taskInfo.due_date?.toISOString();
        } else {
          parameters.title = taskMatch;
        }
        break;

      case 'complete':
        parameters.title = match[1];
        parameters.status = 'completed';
        break;

      case 'update':
        parameters.title = match[1];
        const newPriority = this.extractPriority(match[2]);
        if (newPriority) {
          parameters.priority = newPriority;
        }
        break;

      case 'delete':
        parameters.title = match[1];
        break;

      case 'create_project':
        parameters.project_name = match[1];
        break;

      case 'show_project':
        parameters.project_name = match[1];
        break;

      case 'move_task':
        parameters.title = match[1];
        parameters.project_name = match[2];
        break;

      default:
        return null;
    }

    return {
      action,
      parameters,
      confidence,
      original_command: originalCommand,
    };
  }

  /**
   * Extract task information from a text string
   */
  private extractTaskInfo(text: string): ParsedTaskData | null {
    const words = text.toLowerCase().split(' ');
    let title = '';
    let description = '';
    let priority: ParsedTaskData['priority'] = 'medium';
    let due_date: Date | undefined;

    // Extract priority
    for (const [priorityLevel, keywords] of Object.entries(this.priorityKeywords)) {
      if (keywords.some(keyword => words.includes(keyword))) {
        priority = priorityLevel as ParsedTaskData['priority'];
        break;
      }
    }

    // Extract due dates
    due_date = this.extractDueDate(text);

    // Extract project name (look for common project indicators)
    const projectIndicators = ['for project', 'in project', 'under project', 'project:'];
    for (const indicator of projectIndicators) {
      const index = text.toLowerCase().indexOf(indicator);
      if (index !== -1) {
        const start = index + indicator.length;
        const projectMatch = text.substring(start).trim();
        const endIndex = projectMatch.indexOf(' ');
        // Note: project_name will be set by the calling function
        break;
      }
    }

    // Try to separate title and description
    const sentences = text.split(/[.,;]/);
    title = sentences[0]?.trim() || text;

    if (sentences.length > 1) {
      description = sentences.slice(1).join('. ').trim();
    }

    if (!title) return null;

    return {
      title,
      description: description || undefined,
      priority,
      due_date,
    };
  }

  /**
   * Extract priority from text
   */
  private extractPriority(text: string): VoiceCommandResult['parameters']['priority'] {
    const lowerText = text.toLowerCase();

    for (const [priority, keywords] of Object.entries(this.priorityKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return priority as VoiceCommandResult['parameters']['priority'];
      }
    }

    return 'medium';
  }

  /**
   * Extract due date from text
   */
  private extractDueDate(text: string): Date | undefined {
    const lowerText = text.toLowerCase();

    // Check for specific days
    for (const [key, keywords] of Object.entries(this.timeKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return this.parseRelativeDate(key);
      }
    }

    // Check for date patterns like "March 15" or "15/03"
    const datePatterns = [
      /(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?/i,  // "March 15" or "March 15th"
      /(\d{1,2})\/(\d{1,2})/,                // "15/03" or "3/15"
      /(\d{1,2})-(\d{1,2})/,                // "15-03" or "3-15"
    ];

    for (const pattern of datePatterns) {
      const match = lowerText.match(pattern);
      if (match) {
        return this.parseDateMatch(match);
      }
    }

    return undefined;
  }

  /**
   * Parse relative date keywords
   */
  private parseRelativeDate(key: string): Date {
    const now = new Date();
    const targetDate = new Date(now);

    switch (key) {
      case 'today':
        break;
      case 'tomorrow':
        targetDate.setDate(now.getDate() + 1);
        break;
      case 'next_week':
        targetDate.setDate(now.getDate() + 7);
        break;
      case 'next_month':
        targetDate.setMonth(now.getMonth() + 1);
        break;
      case 'monday':
      case 'tuesday':
      case 'wednesday':
      case 'thursday':
      case 'friday':
      case 'saturday':
      case 'sunday':
        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const targetDay = daysOfWeek.indexOf(key);
        const currentDay = now.getDay();
        let daysToAdd = targetDay - currentDay;

        if (daysToAdd <= 0) {
          daysToAdd += 7; // Next week
        }

        targetDate.setDate(now.getDate() + daysToAdd);
        break;
    }

    return targetDate;
  }

  /**
   * Parse date match from regex
   */
  private parseDateMatch(match: RegExpMatchArray): Date {
    const now = new Date();
    let month: number, day: number;

    if (match[1] && !match[2]) {
      // Pattern like "March 15"
      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ];

      month = monthNames.indexOf(match[1].toLowerCase()) + 1;
      day = parseInt(match[2]);

      if (month > 0 && day > 0) {
        return new Date(now.getFullYear(), month - 1, day);
      }
    } else if (match[1] && match[2]) {
      // Pattern like "15/03" or "3/15"
      if (match[1].length <= 2 && match[2].length <= 2) {
        // Assume MM/DD format
        month = parseInt(match[1]) - 1;
        day = parseInt(match[2]);
        return new Date(now.getFullYear(), month, day);
      }
    }

    return new Date(); // Fallback to today
  }

  /**
   * Get help text for voice commands
   */
  getHelpText(): string {
    return `
      Voice Task Commands:

      Create Tasks:
      • "Create task to buy groceries"
      • "Add task for tomorrow's meeting"
      • "Remind me to call mom"

      Complete Tasks:
      • "Complete buy groceries"
      • "Mark finish project as done"
      • "I'm done with the report"

      Update Tasks:
      • "Change buy groceries priority to high"
      • "Make the report urgent"

      Delete Tasks:
      • "Delete buy groceries"
      • "Remove finish project"

      Projects:
      • "Create project Work Tasks"
      • "Show Personal tasks"
      • "Move buy groceries to Work Tasks"

      Time References:
      • "today", "tomorrow", "next week"
      • "Monday", "Tuesday", etc.
      • "March 15th", "15/03"
    `;
  }
}

// Export singleton instance
export const voiceTaskCommandService = new VoiceTaskCommandService();