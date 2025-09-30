import { VoiceTaskResult } from './VoiceTaskProcessor';
import { PersonalTask, PersonalProject } from '../features/tasks/types';

export interface VoiceFeedbackOptions {
  enableAudioFeedback?: boolean;
  enableVisualFeedback?: boolean;
  feedbackDelay?: number;
  voiceRate?: number;
  voicePitch?: number;
  voiceVolume?: number;
}

export interface VoiceFeedbackMessage {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  priority: 'low' | 'medium' | 'high';
  duration?: number;
}

/**
 * Voice feedback service for providing audio and visual confirmations
 * Handles text-to-speech announcements and visual feedback for task operations
 */
export class VoiceTaskFeedbackService {
  private options: Required<VoiceFeedbackOptions>;
  private synthesis: SpeechSynthesis | null = null;
  private currentSpeaking: SpeechSynthesisUtterance | null = null;
  private feedbackQueue: VoiceFeedbackMessage[] = [];
  private isProcessingQueue = false;

  constructor(options: VoiceFeedbackOptions = {}) {
    this.options = {
      enableAudioFeedback: true,
      enableVisualFeedback: true,
      feedbackDelay: 100,
      voiceRate: 1.0,
      voicePitch: 1.0,
      voiceVolume: 0.8,
      ...options,
    };

    // Initialize speech synthesis if available
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    }
  }

  /**
   * Provide feedback for a voice task operation result
   */
  async provideFeedback(result: VoiceTaskResult): Promise<void> {
    const feedbackMessage = this.createFeedbackMessage(result);

    if (feedbackMessage) {
      await this.queueFeedback(feedbackMessage);
    }
  }

  /**
   * Provide feedback for task status changes
   */
  async announceTaskChange(
    action: 'created' | 'updated' | 'completed' | 'deleted',
    task: PersonalTask,
    project?: PersonalProject
  ): Promise<void> {
    const message = this.createTaskChangeMessage(action, task, project);
    const feedbackMessage: VoiceFeedbackMessage = {
      type: action === 'deleted' ? 'warning' : 'success',
      message,
      priority: action === 'completed' ? 'high' : 'medium',
    };

    await this.queueFeedback(feedbackMessage);
  }

  /**
   * Provide feedback for project operations
   */
  async announceProjectChange(
    action: 'created' | 'selected' | 'changed',
    project: PersonalProject
  ): Promise<void> {
    const message = this.createProjectChangeMessage(action, project);
    const feedbackMessage: VoiceFeedbackMessage = {
      type: 'info',
      message,
      priority: 'low',
    };

    await this.queueFeedback(feedbackMessage);
  }

  /**
   * Provide immediate feedback without queuing
   */
  async provideImmediateFeedback(message: string, type: VoiceFeedbackMessage['type'] = 'info'): Promise<void> {
    const feedbackMessage: VoiceFeedbackMessage = {
      type,
      message,
      priority: 'high',
    };

    if (this.options.enableAudioFeedback) {
      await this.speakMessage(feedbackMessage);
    }

    if (this.options.enableVisualFeedback) {
      this.showVisualFeedback(feedbackMessage);
    }
  }

  /**
   * Stop all current feedback
   */
  stopAllFeedback(): void {
    // Stop speech synthesis
    if (this.synthesis && this.currentSpeaking) {
      this.synthesis.cancel();
      this.currentSpeaking = null;
    }

    // Clear queue
    this.feedbackQueue = [];

    // Hide any visual feedback
    this.hideVisualFeedback();
  }

  /**
   * Create feedback message from voice task result
   */
  private createFeedbackMessage(result: VoiceTaskResult): VoiceFeedbackMessage | null {
    if (!result.message) return null;

    let type: VoiceFeedbackMessage['type'] = 'info';
    let priority: VoiceFeedbackMessage['priority'] = 'medium';

    if (result.success) {
      type = 'success';
      if (result.action === 'complete') {
        priority = 'high';
      }
    } else {
      type = 'error';
      priority = 'high';
    }

    return {
      type,
      message: result.message,
      priority,
    };
  }

  /**
   * Create message for task status changes
   */
  private createTaskChangeMessage(
    action: 'created' | 'updated' | 'completed' | 'deleted',
    task: PersonalTask,
    project?: PersonalProject
  ): string {
    const projectText = project ? ` in ${project.name}` : '';
    const priorityText = task.priority !== 'medium' ? ` with ${task.priority} priority` : '';

    switch (action) {
      case 'created':
        return `Task "${task.title}" has been created${projectText}${priorityText}`;
      case 'updated':
        return `Task "${task.title}" has been updated${projectText}`;
      case 'completed':
        return `Task "${task.title}" has been completed! Great job!`;
      case 'deleted':
        return `Task "${task.title}" has been deleted${projectText}`;
      default:
        return `Task "${task.title}" operation completed${projectText}`;
    }
  }

  /**
   * Create message for project changes
   */
  private createProjectChangeMessage(
    action: 'created' | 'selected' | 'changed',
    project: PersonalProject
  ): string {
    switch (action) {
      case 'created':
        return `Project "${project.name}" has been created`;
      case 'selected':
        return `Switched to project "${project.name}"`;
      case 'changed':
        return `Project changed to "${project.name}"`;
      default:
        return `Project "${project.name}" updated`;
    }
  }

  /**
   * Queue feedback message for processing
   */
  private async queueFeedback(message: VoiceFeedbackMessage): Promise<void> {
    // Add to queue based on priority
    if (message.priority === 'high' && this.feedbackQueue.length > 0) {
      // Insert high priority messages at the front
      this.feedbackQueue.unshift(message);
    } else {
      this.feedbackQueue.push(message);
    }

    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      this.processFeedbackQueue();
    }
  }

  /**
   * Process the feedback queue
   */
  private async processFeedbackQueue(): Promise<void> {
    if (this.feedbackQueue.length === 0) return;

    this.isProcessingQueue = true;

    while (this.feedbackQueue.length > 0) {
      const message = this.feedbackQueue.shift()!;
      await this.processFeedbackMessage(message);

      // Add delay between messages
      if (this.feedbackQueue.length > 0) {
        await this.delay(this.options.feedbackDelay);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Process a single feedback message
   */
  private async processFeedbackMessage(message: VoiceFeedbackMessage): Promise<void> {
    // Audio feedback
    if (this.options.enableAudioFeedback) {
      await this.speakMessage(message);
    }

    // Visual feedback
    if (this.options.enableVisualFeedback) {
      this.showVisualFeedback(message);
    }
  }

  /**
   * Speak a message using text-to-speech
   */
  private async speakMessage(message: VoiceFeedbackMessage): Promise<void> {
    if (!this.synthesis) {
      console.warn('Speech synthesis not available');
      return;
    }

    // Stop current speech if any
    if (this.currentSpeaking) {
      this.synthesis.cancel();
    }

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(message.message);

      // Configure voice settings
      utterance.rate = this.options.voiceRate;
      utterance.pitch = this.options.voicePitch;
      utterance.volume = this.options.voiceVolume;

      // Set voice based on message type
      if (this.synthesis) {
        const voices = this.synthesis.getVoices();
        if (voices.length > 0) {
          // Try to find a pleasant voice
          const preferredVoice = voices.find(voice =>
            voice.name.includes('Samantha') || // macOS
            voice.name.includes('Susan') ||   // Windows
            voice.name.includes('Zoe') ||     // iOS
            voice.name.includes('Karen')      // Default English
          );

          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
        }
      }

      // Handle speech events
      utterance.onstart = () => {
        this.currentSpeaking = utterance;
      };

      utterance.onend = () => {
        this.currentSpeaking = null;
        resolve();
      };

      utterance.onerror = (error) => {
        console.error('Speech synthesis error:', error);
        this.currentSpeaking = null;
        resolve();
      };

      // Speak the message
      if (this.synthesis) {
        this.synthesis.speak(utterance);
      }
    });
  }

  /**
   * Show visual feedback for a message
   */
  private showVisualFeedback(message: VoiceFeedbackMessage): void {
    // Create or update toast notification
    this.showToast(message);
  }

  /**
   * Hide visual feedback
   */
  private hideVisualFeedback(): void {
    // Remove any existing toast notifications
    const existingToasts = document.querySelectorAll('.voice-feedback-toast');
    existingToasts.forEach(toast => toast.remove());
  }

  /**
   * Show toast notification
   */
  private showToast(message: VoiceFeedbackMessage): void {
    // Remove any existing toasts
    this.hideVisualFeedback();

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `voice-feedback-toast voice-feedback-toast--${message.type}`;
    toast.textContent = message.message;

    // Style the toast
    Object.assign(toast.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      borderRadius: '8px',
      color: 'white',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: '9999',
      maxWidth: '300px',
      wordWrap: 'break-word',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      opacity: '0',
      transform: 'translateY(-20px)',
      transition: 'all 0.3s ease-in-out',
    });

    // Set background color based on type
    const colors = {
      success: '#10B981', // Green
      error: '#EF4444',   // Red
      warning: '#F59E0B', // Yellow
      info: '#3B82F6',    // Blue
    };

    toast.style.backgroundColor = colors[message.type];

    // Add to document
    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 10);

    // Auto remove after duration
    const duration = message.duration || (message.type === 'error' ? 5000 : 3000);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-20px)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update feedback options
   */
  updateOptions(newOptions: Partial<VoiceFeedbackOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Check if audio feedback is available
   */
  isAudioFeedbackAvailable(): boolean {
    return this.synthesis !== null;
  }

  /**
   * Get current feedback options
   */
  getOptions(): Required<VoiceFeedbackOptions> {
    return { ...this.options };
  }
}

// Export singleton instance
export const voiceTaskFeedbackService = new VoiceTaskFeedbackService();