const { EventEmitter } = require('events');

class VoiceService extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      autoConnect: true,
      reconnectAttempts: 3,
      reconnectDelay: 2000,
      healthCheckInterval: 5000,
      sessionTimeout: 30000,
      ...config
    };

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
        ttsEngine: 'auto',
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

    this.healthCheckInterval = null;
    this.reconnectTimeout = null;
    this.reconnectAttempts = 0;

    this.setupEventListeners();
    this.startHealthCheck();
  }

  setupEventListeners() {
    // Set up any necessary event listeners
  }

  startHealthCheck() {
    this.healthCheckInterval = setInterval(async () => {
      const isHealthy = await this.checkHealth();
      if (!isHealthy && this.state.isConnected) {
        this.handleConnectionError('Health check failed');
      }
    }, this.config.healthCheckInterval);
  }

  handleConnectionError(error) {
    this.state.connectionStatus = 'error';
    this.state.error = error;
    this.emit('stateChange', { ...this.state });
    this.emit('error', error);

    // Send error notification
    this.sendNotification('Voice Service Error', error, [
      { type: 'button', text: 'Retry Connection' },
      { type: 'button', text: 'Open Settings' }
    ]);

    if (this.reconnectAttempts < this.config.reconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    this.reconnectAttempts++;
    this.reconnectTimeout = setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        this.handleConnectionError(`Reconnection attempt ${this.reconnectAttempts} failed`);
      }
    }, this.config.reconnectDelay);
  }

  async enable() {
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
      return true;
    } catch (error) {
      this.state.isEnabled = false;
      throw error;
    }
  }

  async disable() {
    if (!this.state.isEnabled) {
      return true;
    }

    try {
      await this.stopListening();
      await this.stopSpeaking();

      if (this.state.isConnected) {
        await this.disconnect();
      }

      this.state.isEnabled = false;
      this.state.isListening = false;
      this.state.isProcessing = false;
      this.state.isSpeaking = false;
      this.state.error = null;
      this.state.sessionId = null;

      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      this.reconnectAttempts = 0;

      this.emit('stateChange', { ...this.state });
      return true;
    } catch (error) {
      throw error;
    }
  }

  async connect() {
    if (this.state.isConnected) {
      throw new Error('Voice service is already connected');
    }

    try {
      this.state.connectionStatus = 'connecting';
      this.state.error = null;
      this.emit('stateChange', { ...this.state });

      this.state.sessionId = `voice_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await new Promise(resolve => setTimeout(resolve, 500));

      this.state.isConnected = true;
      this.state.connectionStatus = 'connected';
      this.state.lastActivity = new Date();
      this.reconnectAttempts = 0;

      this.emit('stateChange', { ...this.state });
      return true;
    } catch (error) {
      this.state.connectionStatus = 'error';
      throw error;
    }
  }

  async disconnect() {
    if (!this.state.isConnected) {
      return true;
    }

    try {
      await this.stopListening();
      await this.stopSpeaking();

      this.state.sessionId = null;
      this.state.isConnected = false;
      this.state.connectionStatus = 'disconnected';

      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      this.reconnectAttempts = 0;

      this.emit('stateChange', { ...this.state });
      return true;
    } catch (error) {
      throw error;
    }
  }

  async startListening() {
    if (!this.state.isEnabled || !this.state.isConnected) {
      throw new Error('Voice service must be enabled and connected to start listening');
    }

    if (this.state.isListening) {
      return true;
    }

    try {
      this.state.isListening = true;
      this.state.lastActivity = new Date();
      this.emit('speechStart');
      this.emit('stateChange', { ...this.state });

      // Send notification about listening
      this.sendNotification('Voice Assistant Listening', 'Listening for your command...');

      return true;
    } catch (error) {
      this.state.isListening = false;
      this.emit('error', error.message);
      throw error;
    }
  }

  async stopListening() {
    if (!this.state.isListening) {
      return true;
    }

    try {
      this.state.isListening = false;
      this.emit('speechEnd');
      this.emit('stateChange', { ...this.state });
      return true;
    } catch (error) {
      throw error;
    }
  }

  async speak(text, options = {}) {
    if (!this.state.isEnabled || !this.state.isConnected || !this.state.settings.ttsEnabled) {
      throw new Error('Voice service must be enabled, connected, and TTS must be enabled to speak');
    }

    try {
      this.state.isSpeaking = true;
      this.state.lastActivity = new Date();
      this.emit('speakingStart');
      this.emit('stateChange', { ...this.state });

      // Send notification about speaking
      this.sendNotification('Voice Assistant Speaking', `Speaking: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

      // Simulate TTS processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.state.isSpeaking = false;
      this.emit('speakingEnd');
      this.emit('stateChange', { ...this.state });
      return true;
    } catch (error) {
      this.state.isSpeaking = false;
      this.emit('error', error.message);
      throw error;
    }
  }

  sendNotification(title, body, actions = []) {
    try {
      // Send notification through main window if available
      const { mainWindow } = require('../main/window-manager');
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('voice-notification', { title, body, actions });
      }

      // Also emit as event for tray or other listeners
      this.emit('notification', { title, body, actions });
    } catch (error) {
      console.error('Error sending voice notification:', error);
    }
  }

  // Quick voice commands
  async executeQuickCommand(command) {
    if (!this.state.isEnabled || !this.state.isConnected) {
      throw new Error('Voice service must be enabled and connected');
    }

    const commands = {
      'status': () => this.getStatusReport(),
      'help': () => this.getAvailableCommands(),
      'settings': () => this.openVoiceSettings(),
      'test': () => this.testVoiceService(),
      'stop': () => this.stopSpeaking()
    };

    const commandFn = commands[command.toLowerCase()];
    if (commandFn) {
      return await commandFn();
    } else {
      throw new Error(`Unknown command: ${command}`);
    }
  }

  async getStatusReport() {
    const status = {
      enabled: this.state.isEnabled,
      connected: this.state.isConnected,
      listening: this.state.isListening,
      speaking: this.state.isSpeaking,
      processing: this.state.isProcessing,
      connectionStatus: this.state.connectionStatus,
      error: this.state.error
    };

    const report = `Voice Status: ${status.enabled ? 'Enabled' : 'Disabled'}, ${status.connected ? 'Connected' : 'Disconnected'}${status.listening ? ', Listening' : ''}${status.speaking ? ', Speaking' : ''}`;
    this.sendNotification('Voice Status', report);
    return report;
  }

  async getAvailableCommands() {
    const commands = [
      'status - Get current voice service status',
      'help - Show available commands',
      'settings - Open voice settings',
      'test - Test voice functionality',
      'stop - Stop current speech'
    ];

    const commandList = 'Available commands:\n' + commands.join('\n');
    this.sendNotification('Voice Commands', commandList);
    return commands;
  }

  async openVoiceSettings() {
    const { mainWindow } = require('../main/window-manager');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('show-voice-settings');
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.show();
      mainWindow.focus();
    }
    this.sendNotification('Voice Settings', 'Opening voice settings...');
  }

  async testVoiceService() {
    if (!this.state.isEnabled) {
      await this.enable();
    }

    this.sendNotification('Voice Test', 'Testing voice service...');
    await this.speak('Voice service test successful. You can now use voice commands.');
    return true;
  }

  async stopSpeaking() {
    try {
      this.state.isSpeaking = false;
      this.emit('speakingEnd');
      this.emit('stateChange', { ...this.state });
      return true;
    } catch (error) {
      throw error;
    }
  }

  async updateSettings(settings) {
    try {
      this.state.settings = { ...this.state.settings, ...settings };
      this.emit('stateChange', { ...this.state });

      if (settings.ttsEnabled !== undefined && !settings.ttsEnabled) {
        await this.stopSpeaking();
      }
      return true;
    } catch (error) {
      throw error;
    }
  }

  async checkHealth() {
    try {
      const connected = this.state.isConnected;
      const hasRecentActivity = this.state.lastActivity &&
        Date.now() - this.state.lastActivity.getTime() < this.config.sessionTimeout;

      return connected && hasRecentActivity;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  getState() {
    return { ...this.state };
  }

  getSettings() {
    return { ...this.state.settings };
  }

  isEnabled() {
    return this.state.isEnabled;
  }

  isConnected() {
    return this.state.isConnected;
  }

  destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.disable();
    this.removeAllListeners();
  }
}

module.exports = { VoiceService };