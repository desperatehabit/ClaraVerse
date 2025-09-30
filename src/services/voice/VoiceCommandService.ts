import { VoiceService } from './VoiceService';
import { VoiceCommandParser } from './VoiceCommandParser';
import { VoiceCommandRegistry, ServiceContainer } from './VoiceCommandRegistry';
import { BrowserAutomationService, BrowserConfig } from './BrowserAutomationService';
import { ApplicationManagementService, ApplicationConfig } from './ApplicationManagementService';
import { FileSystemService, FileSystemConfig } from './FileSystemService';
import { WebInteractionService, WebInteractionConfig } from './WebInteractionService';
import { SafetyService } from './SafetyService';
import {
   VoiceCommand,
   VoiceCommandResult,
   VoiceCommandContext,
   VoiceCommandSettings,
   VoiceCommandCategory,
   VoiceCommandHistory
 } from '../../types/voice-commands';

export interface VoiceCommandServiceConfig {
  voiceService: VoiceService;
  browser?: BrowserConfig;
  application?: ApplicationConfig;
  filesystem?: FileSystemConfig;
  webInteraction?: WebInteractionConfig;
  commandSettings?: Partial<VoiceCommandSettings>;
}

export class VoiceCommandService {
  private voiceService: VoiceService;
  private parser!: VoiceCommandParser;
  private registry!: VoiceCommandRegistry;
  private services!: ServiceContainer;
  private safetyService!: SafetyService;
  private config: VoiceCommandServiceConfig;
  private isInitialized = false;

  constructor(config: VoiceCommandServiceConfig) {
    this.config = config;
    this.voiceService = config.voiceService;

    // Initialize settings with defaults
    const defaultSettings: VoiceCommandSettings = {
      enabledCategories: Object.values(VoiceCommandCategory),
      safetyLevel: 'moderate',
      confirmSensitiveCommands: true,
      confirmSystemCommands: true,
      autoExecuteSafeCommands: true,
      maxCommandHistory: 100,
      enableCommandLearning: true,
      customCommands: []
    };

    const settings = { ...defaultSettings, ...config.commandSettings };

    // Initialize services
    this.initializeServices(settings);

    // Set up voice service integration
    this.setupVoiceIntegration();
  }

  /**
   * Initialize the voice command service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('Initializing Voice Command Service...');

      // Initialize all services
      await this.initializeAllServices();

      // Load custom commands
      await this.loadCustomCommands();

      // Set up event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      console.log('Voice Command Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Voice Command Service:', error);
      throw error;
    }
  }

  /**
   * Process voice input and execute command
   */
  async processVoiceInput(audioBlob: Blob, context: VoiceCommandContext): Promise<VoiceCommandResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Send audio to voice service for processing
      await this.voiceService.sendAudio(audioBlob);

      // In a real implementation, this would be called when transcription is complete
      // For now, return a placeholder
      return {
        success: true,
        message: 'Voice input processed - awaiting transcription'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to process voice input: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Execute a text command directly
   */
  async executeTextCommand(text: string, context: VoiceCommandContext): Promise<VoiceCommandResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return await this.registry.executeCommand(text, context);
  }

  /**
   * Get available voice commands
   */
  getAvailableCommands(): VoiceCommand[] {
    return this.registry.getAvailableCommands();
  }

  /**
   * Search voice commands
   */
  searchCommands(query: string): VoiceCommand[] {
    return this.registry.searchCommands(query);
  }

  /**
   * Get command history
   */
  getCommandHistory(limit?: number): VoiceCommandHistory[] {
    return this.registry.getCommandHistory(limit);
  }

  /**
   * Update voice command settings
   */
  updateSettings(settings: Partial<VoiceCommandSettings>): void {
    this.registry.updateSettings(settings);
  }

  /**
   * Check if voice commands are ready
   */
  isReady(): boolean {
    return this.voiceService.isEnabled() && this.voiceService.isConnected() && this.isInitialized;
  }

  /**
   * Get service status
   */
  getStatus(): {
    initialized: boolean;
    voiceService: boolean;
    browserAutomation: boolean;
    applicationManagement: boolean;
    fileSystem: boolean;
    webInteraction: boolean;
    safety: boolean;
  } {
    return {
      initialized: this.isInitialized,
      voiceService: this.voiceService.isEnabled(),
      browserAutomation: !!this.services.browserAutomation,
      applicationManagement: !!this.services.applicationManagement,
      fileSystem: !!this.services.fileSystem,
      webInteraction: !!this.services.webInteraction,
      safety: !!this.services.safety
    };
  }

  /**
   * Initialize all services
   */
  private async initializeAllServices(): Promise<void> {
    const initPromises = [];

    // Initialize Electron main process services
    if (this.services.systemControl && typeof this.services.systemControl.initialize === 'function') {
      initPromises.push(this.services.systemControl.initialize());
    }

    // Initialize TypeScript services
    if (this.services.browserAutomation && typeof this.services.browserAutomation.destroy === 'function') {
      // Browser service doesn't need async initialization
    }

    if (this.services.applicationManagement && typeof this.services.applicationManagement.destroy === 'function') {
      // Application service doesn't need async initialization
    }

    if (this.services.fileSystem && typeof this.services.fileSystem.destroy === 'function') {
      // File system service doesn't need async initialization
    }

    if (this.services.webInteraction && typeof this.services.webInteraction.destroy === 'function') {
      // Web interaction service doesn't need async initialization
    }

    await Promise.all(initPromises);
  }

  /**
   * Initialize services container
   */
  private initializeServices(settings: VoiceCommandSettings): void {
    this.safetyService = new SafetyService(settings);

    // Initialize parser
    this.parser = new VoiceCommandParser();

    // Initialize services based on config
    if (this.config.browser) {
      this.services.browserAutomation = new BrowserAutomationService(this.config.browser);
    }

    if (this.config.application) {
      this.services.applicationManagement = new ApplicationManagementService(this.config.application);
    }

    if (this.config.filesystem) {
      this.services.fileSystem = new FileSystemService(this.config.filesystem);
    }

    if (this.config.webInteraction) {
      this.services.webInteraction = new WebInteractionService(this.config.webInteraction);
    }

    this.services.safety = this.safetyService;

    // Initialize registry
    this.registry = new VoiceCommandRegistry(this.parser, this.services, settings);
  }

  /**
   * Set up voice service integration
   */
  private setupVoiceIntegration(): void {
    // Listen for voice service events
    this.voiceService.addEventListener('speechStart', () => {
      console.log('Voice command processing started');
    });

    this.voiceService.addEventListener('speechEnd', () => {
      console.log('Voice command processing ended');
    });

    this.voiceService.addEventListener('stateChange', (state) => {
      console.log('Voice service state changed:', state);
    });

    this.voiceService.addEventListener('error', (error) => {
      console.error('Voice service error:', error);
    });
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Clean up on voice service disable
    this.voiceService.addEventListener('stateChange', (state) => {
      if (!state.isEnabled) {
        this.cleanup();
      }
    });
  }

  /**
   * Load custom commands
   */
  private async loadCustomCommands(): Promise<void> {
    try {
      // In a real implementation, this would load from storage
      // For now, we'll use the default commands
      console.log('Custom commands loaded');
    } catch (error) {
      console.error('Failed to load custom commands:', error);
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    // Cleanup all services
    Object.values(this.services).forEach(service => {
      if (service && typeof service.destroy === 'function') {
        service.destroy();
      }
    });
  }

  /**
   * Destroy the voice command service
   */
  async destroy(): Promise<void> {
    this.cleanup();
    this.isInitialized = false;
    console.log('Voice Command Service destroyed');
  }
}