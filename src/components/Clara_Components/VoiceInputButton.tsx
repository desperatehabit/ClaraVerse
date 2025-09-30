import React, { useState, useCallback } from 'react';
import { Mic, MicOff, Loader2, AlertCircle } from 'lucide-react';
import { useVoiceContext } from '../../contexts/Voice/VoiceContext';

export interface VoiceInputButtonProps {
  /** Callback function called when voice input is transcribed */
  onTranscription?: (text: string) => void;
  /** Callback function called when voice recording starts */
  onRecordingStart?: () => void;
  /** Callback function called when voice recording ends */
  onRecordingEnd?: () => void;
  /** Callback function called when an error occurs */
  onError?: (error: string) => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Size of the button */
  size?: 'sm' | 'md' | 'lg';
  /** Custom className for styling */
  className?: string;
  /** Tooltip text for the button */
  tooltip?: string;
  /** Whether to show visual feedback during recording */
  showVisualFeedback?: boolean;
  /** Whether to automatically stop recording after a period of silence */
  autoStop?: boolean;
  /** Maximum recording duration in milliseconds (0 = no limit) */
  maxDuration?: number;
  /** Language for speech recognition */
  language?: string;
}

/**
 * Reusable voice input button component that integrates with the VoiceContext
 * Provides consistent voice input functionality across all input components
 */
export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscription,
  onRecordingStart,
  onRecordingEnd,
  onError,
  disabled = false,
  size = 'md',
  className = '',
  tooltip = 'Voice input',
  showVisualFeedback = true,
  autoStop = true,
  maxDuration = 0,
  language = 'en'
}) => {
  const {
    isEnabled: voiceEnabled,
    canListen,
    isListening,
    isProcessing,
    error: voiceError,
    startListening,
    stopListening,
    sendAudio
  } = useVoiceContext();

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Size configurations
  const sizeConfig = {
    sm: { icon: 'w-4 h-4', padding: 'p-1.5' },
    md: { icon: 'w-5 h-5', padding: 'p-2' },
    lg: { icon: 'w-6 h-6', padding: 'p-2.5' }
  };

  // Handle voice input recording
  const handleVoiceInput = useCallback(async () => {
    if (disabled || !voiceEnabled || !canListen) {
      if (voiceError && onError) {
        onError(voiceError);
      }
      return;
    }

    try {
      if (isListening) {
        // Stop recording
        await stopListening();
        setIsRecording(false);
        setRecordingDuration(0);
        onRecordingEnd?.();
      } else {
        // Start recording
        setIsRecording(true);
        setRecordingDuration(0);
        onRecordingStart?.();

        // Start duration timer if maxDuration is set
        let durationTimer: NodeJS.Timeout | null = null;
        if (maxDuration > 0) {
          durationTimer = setInterval(() => {
            setRecordingDuration(prev => {
              if (prev >= maxDuration / 1000) {
                // Auto-stop when max duration reached
                stopListening();
                setIsRecording(false);
                if (durationTimer) clearInterval(durationTimer);
                return 0;
              }
              return prev + 0.1;
            });
          }, 100);
        }

        await startListening();

        // Cleanup timer
        if (durationTimer) {
          clearInterval(durationTimer);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Voice input failed';
      console.error('Voice input error:', error);
      setIsRecording(false);
      setRecordingDuration(0);
      onError?.(errorMessage);
    }
  }, [
    disabled,
    voiceEnabled,
    canListen,
    isListening,
    voiceError,
    startListening,
    stopListening,
    onRecordingStart,
    onRecordingEnd,
    onError,
    maxDuration
  ]);

  // Get button styling based on state
  const getButtonStyling = () => {
    const baseClasses = `
      ${sizeConfig[size].padding} rounded-lg transition-all duration-200
      group relative flex items-center justify-center
    `;

    if (disabled || !voiceEnabled) {
      return `${baseClasses} opacity-50 cursor-not-allowed
        bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600`;
    }

    if (isListening || isRecording) {
      return `${baseClasses} bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400
        hover:bg-red-200 dark:hover:bg-red-900/50 animate-pulse`;
    }

    if (isProcessing) {
      return `${baseClasses} bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400
        hover:bg-blue-200 dark:hover:bg-blue-900/50`;
    }

    if (voiceError) {
      return `${baseClasses} bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400
        hover:bg-yellow-200 dark:hover:bg-yellow-900/50`;
    }

    return `${baseClasses} bg-sakura-100 dark:bg-sakura-900/30 text-sakura-600 dark:text-sakura-400
      hover:bg-sakura-200 dark:hover:bg-sakura-900/50 hover:scale-105 active:scale-95`;
  };

  // Get icon based on state
  const getIcon = () => {
    if (isProcessing) {
      return <Loader2 className={`${sizeConfig[size].icon} animate-spin`} />;
    }

    if (voiceError) {
      return <AlertCircle className={sizeConfig[size].icon} />;
    }

    if (isListening || isRecording) {
      return <MicOff className={sizeConfig[size].icon} />;
    }

    return <Mic className={sizeConfig[size].icon} />;
  };

  // Get tooltip text
  const getTooltipText = () => {
    if (disabled) return 'Button disabled';
    if (!voiceEnabled) return 'Voice input not available';
    if (voiceError) return `Voice error: ${voiceError}`;
    if (isListening || isRecording) return 'Click to stop recording';
    if (isProcessing) return 'Processing voice input...';
    return tooltip;
  };

  return (
    <button
      onClick={handleVoiceInput}
      disabled={disabled || !voiceEnabled}
      className={`${getButtonStyling()} ${className}`}
      title={getTooltipText()}
      type="button"
    >
      {getIcon()}

      {/* Visual recording indicator */}
      {showVisualFeedback && (isListening || isRecording) && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
      )}

      {/* Recording duration indicator */}
      {showVisualFeedback && isRecording && recordingDuration > 0 && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {recordingDuration.toFixed(1)}s
        </div>
      )}

      {/* Tooltip */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-0.5
        bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100
        transition-opacity whitespace-nowrap pointer-events-none z-10">
        {getTooltipText()}
      </div>
    </button>
  );
};

export default VoiceInputButton;