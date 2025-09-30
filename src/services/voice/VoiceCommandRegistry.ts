import {
  VoiceCommand,
  ParsedCommand,
  VoiceCommandResult,
  VoiceCommandContext,
  VoiceCommandHistory,
  VoiceCommandSettings,
  VoiceCommandCategory
} from '../../types/voice-commands';

import { VoiceCommandParser } from './VoiceCommandParser';
import { BrowserAutomationService } from './BrowserAutomationService';
import { ApplicationManagementService } from './ApplicationManagementService';
import { FileSystemService } from './FileSystemService';
import { WebInteractionService } from './WebInteractionService';
import { SafetyService } from './SafetyService';

export interface VoiceCommandHandler {
  (parameters: Record<string, any>, context: VoiceCommandContext): Promise<VoiceCommandResult>;
}

export interface ServiceContainer {
  systemControl?: any; // SystemControlService from CommonJS
  browserAutomation?: BrowserAutomationService;
  applicationManagement?: ApplicationManagementService;
  fileSystem?: FileSystemService;
  webInteraction?: WebInteractionService;
  safety?: SafetyService;
}

export class VoiceCommandRegistry {
  private parser: VoiceCommandParser;
  private handlers: Map<string, VoiceCommandHandler> = new Map();
  private commandHistory: VoiceCommandHistory[] = [];
  private services: ServiceContainer;
  private settings: VoiceCommandSettings;

  constructor(
    parser: VoiceCommandParser,
    services: ServiceContainer,
    settings: VoiceCommandSettings
  ) {
    this.parser = parser;
    this.services = services;
    this.settings = settings;
    this.initializeDefaultHandlers();
  }

  /**
   * Execute a voice command
   */
  async executeCommand(
    text: string,
    context: VoiceCommandContext
  ): Promise<VoiceCommandResult> {
    try {
      // Parse the command
      const parsedCommand = await this.parser.parseCommand(text);

      if (!parsedCommand) {
        return {
          success: false,
          message: `Could not understand command: "${text}"`
        };
      }

      // Check safety
      if (this.services.safety) {
        const safetyResult = await this.services.safety.checkCommandSafety(parsedCommand, context);
        if (!safetyResult.success) {
          return safetyResult;
        }
      }

      // Execute the command
      const handler = this.handlers.get(parsedCommand.command.handler);
      if (!handler) {
        return {
          success: false,
          message: `No handler found for command: ${parsedCommand.command.name}`
        };
      }

      const result = await handler(parsedCommand.parameters, context);

      // Record in history
      this.addToHistory({
        id: `history_${Date.now()}`,
        timestamp: new Date(),
        command: text,
        parsedCommand,
        result,
        context
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Command execution failed: ${errorMessage}`
      };
    }
  }

  /**
   * Register a command handler
   */
  registerHandler(handlerName: string, handler: VoiceCommandHandler): void {
    this.handlers.set(handlerName, handler);
  }

  /**
   * Get command history
   */
  getCommandHistory(limit: number = 50): VoiceCommandHistory[] {
    return this.commandHistory.slice(-limit);
  }

  /**
   * Clear command history
   */
  clearHistory(): void {
    this.commandHistory = [];
  }

  /**
   * Get available commands
   */
  getAvailableCommands(): VoiceCommand[] {
    return this.parser.getAllCommands();
  }

  /**
   * Search commands
   */
  searchCommands(query: string): VoiceCommand[] {
    return this.parser.searchCommands(query);
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<VoiceCommandSettings>): void {
    this.settings = { ...this.settings, ...settings };

    if (this.services.safety) {
      this.services.safety.updateSafetySettings(this.settings);
    }
  }

  /**
   * Initialize default command handlers
   */
  private initializeDefaultHandlers(): void {
    // Browser handlers
    this.registerHandler('browser.open', this.handleBrowserOpen.bind(this));
    this.registerHandler('browser.navigate', this.handleBrowserNavigate.bind(this));
    this.registerHandler('browser.closeTab', this.handleBrowserCloseTab.bind(this));
    this.registerHandler('browser.search', this.handleBrowserSearch.bind(this));

    // System handlers
    this.registerHandler('system.lock', this.handleSystemLock.bind(this));
    this.registerHandler('system.screenshot', this.handleSystemScreenshot.bind(this));
    this.registerHandler('system.volume', this.handleSystemVolume.bind(this));
    this.registerHandler('system.brightness', this.handleSystemBrightness.bind(this));

    // Application handlers
    this.registerHandler('application.open', this.handleApplicationOpen.bind(this));
    this.registerHandler('application.switch', this.handleApplicationSwitch.bind(this));
    this.registerHandler('application.close', this.handleApplicationClose.bind(this));

    // File system handlers
    this.registerHandler('filesystem.open', this.handleFileOpen.bind(this));
    this.registerHandler('filesystem.save', this.handleFileSave.bind(this));
    this.registerHandler('filesystem.create', this.handleFileCreate.bind(this));
    this.registerHandler('filesystem.delete', this.handleFileDelete.bind(this));

    // Web interaction handlers
    this.registerHandler('web.click', this.handleWebClick.bind(this));
    this.registerHandler('web.fill', this.handleWebFill.bind(this));
    this.registerHandler('web.submit', this.handleWebSubmit.bind(this));
    this.registerHandler('web.scroll', this.handleWebScroll.bind(this));
  }

  /**
   * Browser command handlers
   */
  private async handleBrowserOpen(parameters: Record<string, any>, context: VoiceCommandContext): Promise<VoiceCommandResult> {
    if (!this.services.browserAutomation) {
      return { success: false, message: 'Browser automation service not available' };
    }

    const browser = parameters.browser || 'chrome';
    return await this.services.browserAutomation.openBrowser(browser, parameters.url);
  }

  private async handleBrowserNavigate(parameters: Record<string, any>, context: VoiceCommandContext): Promise<VoiceCommandResult> {
    if (!this.services.browserAutomation) {
      return { success: false, message: 'Browser automation service not available' };
    }

    return await this.services.browserAutomation.navigateTo(parameters.url);
  }

  private async handleBrowserCloseTab(parameters: Record<string, any>, context: VoiceCommandContext): Promise<VoiceCommandResult> {
    if (!this.services.browserAutomation) {
      return { success: false, message: 'Browser automation service not available' };
    }

    return await this.services.browserAutomation.closeCurrentTab();
  }

  private async handleBrowserSearch(parameters: Record<string, any>, context: VoiceCommandContext): Promise<VoiceCommandResult> {
    if (!this.services.browserAutomation) {
      return { success: false, message: 'Browser automation service not available' };
    }

    const query = parameters.query || parameters.q;
    const engine = parameters.engine || 'google';

    return await this.services.browserAutomation.search(query, engine);
  }

  /**
   * System command handlers
   */
  private async handleSystemLock(parameters: Record<string, any>, context: VoiceCommandContext): Promise<VoiceCommandResult> {
    if (!this.services.systemControl) {
      return { success: false, message: 'System control service not available' };
    }

    return await this.services.systemControl.lockScreen();
  }

  private async handleSystemScreenshot(parameters: Record<string, any>, context: VoiceCommandContext): Promise<VoiceCommandResult> {
    if (!this.services.systemControl) {
      return { success: false, message: 'System control service not available' };
    }

    return await this.services.systemControl.takeScreenshot({
      captureArea: parameters.area || 'screen',
      format: parameters.format || 'png',
      clipboard: parameters.clipboard !== false
    });
  }

  private async handleSystemVolume(parameters: Record<string, any>, context: VoiceCommandContext): Promise<VoiceCommandResult> {
    if (!this.services.systemControl) {
      return { success: false, message: 'System control service not available' };
    }

    const level = parameters.level;
    if (level === undefined) {
      return { success: false, message: 'Volume level is required' };
    }

    return await this.services.systemControl.setVolume(level);
  }

  private async handleSystemBrightness(parameters: Record<string, any>, context: VoiceCommandContext): Promise<VoiceCommandResult> {
    if (!this.services.systemControl) {
      return { success: false, message: 'System control service not available' };
    }

    const level = parameters.level;
    if (level === undefined) {
      return { success: false, message: 'Brightness level is required' };
    }

    return await this.services.systemControl.setBrightness(level);
  }

  /**
   * Application command handlers
   */
  private async handleApplicationOpen(parameters: Record<string, any>, context: VoiceCommandContext): Promise<VoiceCommandResult> {
    if (!this.services.applicationManagement) {
      return { success: false, message: 'Application management service not available' };
    }

    const app = parameters.application;
    if (!app) {
      return { success: false, message: 'Application name is required' };
    }

    return await this.services.applicationManagement.launchApplication(app, parameters.args);
  }

  private async handleApplicationSwitch(parameters: Record<string, any>, context: VoiceCommandContext): Promise<VoiceCommandResult> {
    if (!this.services.applicationManagement) {
      return { success: false, message: 'Application management service not available' };
    }

    const app = parameters.application;
    if (!app) {
      return { success: false, message: 'Application name is required' };
    }

    return await this.services.applicationManagement.switchToApplication(app);
  }

  private async handleApplicationClose(parameters: Record<string, any>, context: VoiceCommandContext): Promise<VoiceCommandResult> {
    if (!this.services.applicationManagement) {
      return { success: false, message: 'Application management service not available' };
    }

    const app = parameters.application;
    if (!app) {
      return { success: false, message: 'Application name is required' };
    }

    return await this.services.applicationManagement.closeApplication(app, parameters.force === true);
  }

  /**
   * File system command handlers
   */
  private async handleFileOpen(parameters: Record<string, any>, context: VoiceCommandContext): Promise<VoiceCommandResult> {
    if (!this.services.fileSystem) {
      return { success: false, message: 'File system service not available' };
    }

    const file = parameters.file;
    if (!file) {
      return { success: false, message: 'File path is required' };
    }

    return await this.services.fileSystem.openFile(file);
  }

  private async handleFileSave(parameters: Record<string, any>, context: VoiceCommandContext): Promise<VoiceCommandResult> {
    if (!this.services.fileSystem) {
      return { success: false, message: 'File system service not available' };
    }

    const file = parameters.file;
    const content = parameters.content;

    if (!file) {
      return { success: false, message: 'File path is required' };
    }

    return await this.services.fileSystem.saveFile(file, content);
  }

  private async handleFileCreate(parameters: Record<string, any>, context: VoiceCommandContext): Promise<VoiceCommandResult> {
    if (!this.services.fileSystem) {
      return { success: false, message: 'File system service not available' };
    }

    const file = parameters.file;
    if (!file) {
      return { success: false, message: 'File path is required' };
    }

    return await this.services.fileSystem.createFile(file, parameters.content);
  }

  private async handleFileDelete(parameters: Record<string, any>, context: VoiceCommandContext): Promise<VoiceCommandResult> {
    if (!this.services.fileSystem) {
      return { success: false, message: 'File system service not available' };
    }

    const file = parameters.file;
    if (!file) {
      return { success: false, message: 'File path is required' };
    }

    return await this.services.fileSystem.deletePath(file);
  }

  /**
   * Web interaction command handlers
   */
  private async handleWebClick(parameters: Record<string, any>, context: VoiceCommandContext): Promise<VoiceCommandResult> {
    if (!this.services.webInteraction) {
      return { success: false, message: 'Web interaction service not available' };
    }

    const element = parameters.element;
    if (!element) {
      return { success: false, message: 'Element description is required' };
    }

    return await this.services.webInteraction.clickElement(element);
  }

  private async handleWebFill(parameters: Record<string, any>, context: VoiceCommandContext): Promise<VoiceCommandResult> {
    if (!this.services.webInteraction) {
      return { success: false, message: 'Web interaction service not available' };
    }

    const field = parameters.field;
    const value = parameters.value;

    if (!field || !value) {
      return { success: false, message: 'Field description and value are required' };
    }

    return await this.services.webInteraction.fillForm(field, value);
  }

  private async handleWebSubmit(parameters: Record<string, any>, context: VoiceCommandContext): Promise<VoiceCommandResult> {
    if (!this.services.webInteraction) {
      return { success: false, message: 'Web interaction service not available' };
    }

    return await this.services.webInteraction.submitForm(parameters.form);
  }

  private async handleWebScroll(parameters: Record<string, any>, context: VoiceCommandContext): Promise<VoiceCommandResult> {
    if (!this.services.webInteraction) {
      return { success: false, message: 'Web interaction service not available' };
    }

    const element = parameters.element;
    if (!element) {
      return { success: false, message: 'Element description is required' };
    }

    return await this.services.webInteraction.scrollTo(element);
  }

  /**
   * Add command to history
   */
  private addToHistory(history: VoiceCommandHistory): void {
    this.commandHistory.push(history);

    // Keep only recent history
    if (this.commandHistory.length > this.settings.maxCommandHistory) {
      this.commandHistory = this.commandHistory.slice(-this.settings.maxCommandHistory);
    }
  }

  /**
   * Get command statistics
   */
  getStatistics(): {
    totalCommands: number;
    successfulCommands: number;
    failedCommands: number;
    categoryUsage: Record<string, number>;
    recentActivity: VoiceCommandHistory[];
  } {
    const successfulCommands = this.commandHistory.filter(h => h.result.success).length;
    const failedCommands = this.commandHistory.length - successfulCommands;

    const categoryUsage: Record<string, number> = {};
    this.commandHistory.forEach(history => {
      if (history.parsedCommand) {
        const category = history.parsedCommand.command.category;
        categoryUsage[category] = (categoryUsage[category] || 0) + 1;
      }
    });

    return {
      totalCommands: this.commandHistory.length,
      successfulCommands,
      failedCommands,
      categoryUsage,
      recentActivity: this.commandHistory.slice(-10)
    };
  }
}