import { VoiceState, VoiceSettings, VoiceServiceConfig, VoiceServiceEvents } from '../../types/voice';
import { claraTTSService } from '../claraTTSService';

export class VoiceService {
  private config: VoiceServiceConfig;
  private state: VoiceState;
  private eventListeners: Map<keyof VoiceServiceEvents, Set<Function>> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;

  constructor(config: VoiceServiceConfig) {
    this.config = config;
    this.state = {
      isEnabled: false,
      isListening: false,
      isProcessing: false,
      isSpeaking: false,
      isConnected: false,
      connectionStatus: 'disconnected',
      inputLevel: 0,
      outputLevel: 0,
      error: null,
      settings: {
        vadEnabled: true,
        vadSensitivity: 0.6,
        vadThreshold: 0.15,
        ttsEnabled: true,
        ttsEngine: 'auto' as const,
        ttsVoice: 'af_sarah',
        ttsSpeed: 1.0,
        ttsAutoPlay: true,
        sttEnabled: true,
        sttEngine: 'whisper',
        sttLanguage: 'en',
        audioInputDevice: null,
        audioOutputDevice: null,
        noiseReduction: true,
        echoCancellation: true,
        autoStartVoiceMode: false,
        pushToTalk: false,
        pushToTalkKey: 'Space',
        voiceActivationThreshold: 0.3,
      },
      sessionId: null,
      lastActivity: null,
    };

    this.setupEventListeners();
    this.startHealthCheck();
  }

  private setupEventListeners(): void {
    // Listen to TTS service health changes
    claraTTSService.onHealthChange((isHealthy) => {
      if (!isHealthy && this.state.settings.ttsEnabled) {
        this.emit('error', 'TTS service is not available');
      }
    });
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      const isHealthy = await this.checkHealth();
      if (!isHealthy && this.state.isConnected) {
        this.handleConnectionError('Health check failed');
      }
    }, this.config.healthCheckInterval);
  }

  private handleConnectionError(error: string): void {
    this.state.connectionStatus = 'error';
    this.state.error = error;
    this.emit('stateChange', { ...this.state });
    this.emit('error', error);

    if (this.reconnectAttempts < this.config.reconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    this.reconnectTimeout = setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        this.handleConnectionError(`Reconnection attempt ${this.reconnectAttempts} failed`);
      }
    }, this.config.reconnectDelay);
  }

  // Event handling
  public addEventListener<K extends keyof VoiceServiceEvents>(
    event: K,
    listener: VoiceServiceEvents[K]
  ): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  public removeEventListener<K extends keyof VoiceServiceEvents>(
    event: K,
    listener: VoiceServiceEvents[K]
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  protected emit<K extends keyof VoiceServiceEvents>(
    event: K,
    ...args: Parameters<VoiceServiceEvents[K]>
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          (listener as any)(...args);
        } catch (error) {
          console.error(`Error in voice service event listener for ${event}:`, error);
        }
      });
    }
  }

  // Core methods
  public async enable(): Promise<void> {
    if (this.state.isEnabled) {
      throw new Error('Voice service is already enabled');
    }

    try {
      this.state.error = null;
      this.state.isEnabled = true;
      this.state.lastActivity = new Date();

      if (this.config.autoConnect) {
        await this.connect();
      }

      this.emit('stateChange', { ...this.state });
    } catch (error) {
      this.state.isEnabled = false;
      throw error;
    }
  }

  public async disable(): Promise<void> {
    if (!this.state.isEnabled) {
      return;
    }

    try {
      // Stop all activities
      await this.stopListening();
      await this.stopSpeaking();

      // Disconnect if connected
      if (this.state.isConnected) {
        await this.disconnect();
      }

      // Reset state
      this.state.isEnabled = false;
      this.state.isListening = false;
      this.state.isProcessing = false;
      this.state.isSpeaking = false;
      this.state.error = null;
      this.state.sessionId = null;

      // Clear any pending reconnections
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      this.reconnectAttempts = 0;

      this.emit('stateChange', { ...this.state });
    } catch (error) {
      throw error;
    }
  }

  public async connect(): Promise<void> {
    if (this.state.isConnected) {
      throw new Error('Voice service is already connected');
    }

    try {
      this.state.connectionStatus = 'connecting';
      this.state.error = null;
      this.emit('stateChange', { ...this.state });

      // Generate session ID
      this.state.sessionId = `voice_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 500));

      this.state.isConnected = true;
      this.state.connectionStatus = 'connected';
      this.state.lastActivity = new Date();
      this.reconnectAttempts = 0;

      this.emit('stateChange', { ...this.state });
    } catch (error) {
      this.state.connectionStatus = 'error';
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.state.isConnected) {
      return;
    }

    try {
      // Stop all activities
      await this.stopListening();
      await this.stopSpeaking();

      // Clear session
      this.state.sessionId = null;
      this.state.isConnected = false;
      this.state.connectionStatus = 'disconnected';

      // Clear any pending reconnections
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      this.reconnectAttempts = 0;

      this.emit('stateChange', { ...this.state });
    } catch (error) {
      throw error;
    }
  }

  public async startListening(): Promise<void> {
    if (!this.state.isEnabled || !this.state.isConnected) {
      throw new Error('Voice service must be enabled and connected to start listening');
    }

    if (this.state.isListening) {
      return;
    }

    try {
      this.state.isListening = true;
      this.state.lastActivity = new Date();
      this.emit('speechStart');
      this.emit('stateChange', { ...this.state });

      // Simulate listening process
      // In a real implementation, this would start VAD and audio capture
    } catch (error) {
      this.state.isListening = false;
      throw error;
    }
  }

  public async stopListening(): Promise<void> {
    if (!this.state.isListening) {
      return;
    }

    try {
      this.state.isListening = false;
      this.emit('speechEnd');
      this.emit('stateChange', { ...this.state });
    } catch (error) {
      throw error;
    }
  }

  public async sendAudio(audioBlob: Blob): Promise<void> {
    if (!this.state.isEnabled || !this.state.isConnected) {
      throw new Error('Voice service must be enabled and connected to send audio');
    }

    try {
      this.state.isProcessing = true;
      this.state.lastActivity = new Date();
      this.emit('stateChange', { ...this.state });

      // Simulate audio processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In a real implementation, this would:
      // 1. Send audio to STT service
      // 2. Get transcription
      // 3. Send to LLM for processing
      // 4. Get response
      // 5. Send response to TTS service

      this.state.isProcessing = false;
      this.emit('stateChange', { ...this.state });
    } catch (error) {
      this.state.isProcessing = false;
      throw error;
    }
  }

  public async speak(text: string, options?: { voice?: string; speed?: number }): Promise<void> {
    if (!this.state.isEnabled || !this.state.isConnected || !this.state.settings.ttsEnabled) {
      throw new Error('Voice service must be enabled, connected, and TTS must be enabled to speak');
    }

    try {
      this.state.isSpeaking = true;
      this.state.lastActivity = new Date();
      this.emit('speakingStart');
      this.emit('stateChange', { ...this.state });

      // Use Clara TTS service
      await claraTTSService.synthesizeAndPlay({
        text,
        engine: this.state.settings.ttsEngine,
        voice: options?.voice || this.state.settings.ttsVoice,
        speed: options?.speed || this.state.settings.ttsSpeed,
        language: this.state.settings.sttLanguage,
      });

      this.state.isSpeaking = false;
      this.emit('speakingEnd');
      this.emit('stateChange', { ...this.state });
    } catch (error) {
      this.state.isSpeaking = false;
      throw error;
    }
  }

  public async stopSpeaking(): Promise<void> {
    try {
      await claraTTSService.stopPlayback();
      this.state.isSpeaking = false;
      this.emit('speakingEnd');
      this.emit('stateChange', { ...this.state });
    } catch (error) {
      throw error;
    }
  }

  public async updateSettings(settings: VoiceSettings): Promise<void> {
    try {
      this.state.settings = { ...this.state.settings, ...settings };
      this.emit('stateChange', { ...this.state });

      // Apply settings to services
      if (settings.ttsEnabled !== undefined && !settings.ttsEnabled) {
        await this.stopSpeaking();
      }
    } catch (error) {
      throw error;
    }
  }

  public async checkHealth(): Promise<boolean> {
    try {
      // Check TTS service health
      const ttsHealthy = claraTTSService.isBackendHealthy();

      // Check basic connectivity
      const connected = this.state.isConnected;

      // Check if we have recent activity (within session timeout)
      const hasRecentActivity = this.state.lastActivity &&
        Date.now() - this.state.lastActivity.getTime() < this.config.sessionTimeout;

      return Boolean(ttsHealthy) && connected && !!hasRecentActivity;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Getters
  public getState(): VoiceState {
    return { ...this.state };
  }

  public getSettings(): VoiceSettings {
    return { ...this.state.settings };
  }

  public isEnabled(): boolean {
    return this.state.isEnabled;
  }

  public isConnected(): boolean {
    return this.state.isConnected;
  }

  // Cleanup
  public destroy(): void {
    // Stop health check
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    // Clear reconnection timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Stop all activities
    this.disable();

    // Clear event listeners
    this.eventListeners.clear();
  }
}