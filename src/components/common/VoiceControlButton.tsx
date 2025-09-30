import React, { useState } from 'react';
import { Mic, MicOff, Loader2, Volume2, VolumeX, Settings } from 'lucide-react';
import { useVoiceContext } from '../../contexts/Voice/VoiceContext';

interface VoiceControlButtonProps {
  mode?: 'toggle' | 'listen' | 'speak' | 'settings';
  onTranscription?: (text: string) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  showLabel?: boolean;
  label?: string;
  tooltip?: string;
}

const VoiceControlButton: React.FC<VoiceControlButtonProps> = ({
  mode = 'toggle',
  onTranscription,
  onSpeechStart,
  onSpeechEnd,
  disabled = false,
  size = 'md',
  variant = 'primary',
  className = '',
  showLabel = false,
  label,
  tooltip
}) => {
  const voice = useVoiceContext();
  const [isProcessing, setIsProcessing] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const variantClasses = {
    primary: voice.isEnabled
      ? 'bg-purple-500 hover:bg-purple-600 text-white'
      : 'bg-gray-200 hover:bg-gray-300 text-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300',
    secondary: voice.isEnabled
      ? 'bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/30 dark:hover:bg-purple-900/50'
      : 'bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300',
    ghost: voice.isEnabled
      ? 'text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20'
      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
  };

  const handleClick = async () => {
    if (disabled || isProcessing) return;

    try {
      setIsProcessing(true);

      switch (mode) {
        case 'toggle':
          if (voice.isEnabled) {
            await voice.disable();
          } else {
            await voice.enable();
          }
          break;

        case 'listen':
          if (voice.canListen && !voice.isListening) {
            await voice.startListening();
            onSpeechStart?.();
          } else if (voice.isListening) {
            await voice.stopListening();
            onSpeechEnd?.();
          }
          break;

        case 'speak':
          // This would typically be triggered by text input
          break;

        case 'settings':
          // This could open voice settings
          break;
      }
    } catch (error) {
      console.error('Voice control error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getIcon = () => {
    if (isProcessing) {
      return <Loader2 className={`${iconSizeClasses[size]} animate-spin`} />;
    }

    switch (mode) {
      case 'listen':
        return voice.isListening
          ? <Mic className={`${iconSizeClasses[size]} text-green-500`} />
          : <MicOff className={iconSizeClasses[size]} />;

      case 'speak':
        return voice.isSpeaking
          ? <Volume2 className={`${iconSizeClasses[size]} text-blue-500`} />
          : <VolumeX className={iconSizeClasses[size]} />;

      case 'settings':
        return <Settings className={iconSizeClasses[size]} />;

      case 'toggle':
      default:
        if (voice.error) {
          return <MicOff className={`${iconSizeClasses[size]} text-red-500`} />;
        }
        if (voice.isListening) {
          return <Mic className={`${iconSizeClasses[size]} text-green-500`} />;
        }
        if (voice.isSpeaking) {
          return <Volume2 className={`${iconSizeClasses[size]} text-blue-500`} />;
        }
        if (voice.isEnabled) {
          return <Mic className={`${iconSizeClasses[size]} text-purple-500`} />;
        }
        return <MicOff className={iconSizeClasses[size]} />;
    }
  };

  const getTooltipText = () => {
    if (tooltip) return tooltip;

    if (isProcessing) return 'Processing...';

    switch (mode) {
      case 'listen':
        return voice.isListening
          ? 'Stop listening'
          : 'Start voice input';

      case 'speak':
        return voice.isSpeaking
          ? 'Speaking...'
          : 'Speak text';

      case 'settings':
        return 'Voice settings';

      case 'toggle':
      default:
        if (voice.error) return `Voice error: ${voice.error}`;
        if (voice.isListening) return 'Listening for input';
        if (voice.isSpeaking) return 'Speaking response';
        if (voice.isEnabled) return 'Voice mode enabled';
        return 'Enable voice mode';
    }
  };

  const getButtonLabel = () => {
    if (label) return label;

    if (isProcessing) return 'Processing...';

    switch (mode) {
      case 'listen':
        return voice.isListening ? 'Listening' : 'Voice Input';

      case 'speak':
        return voice.isSpeaking ? 'Speaking' : 'Speak';

      case 'settings':
        return 'Voice Settings';

      case 'toggle':
      default:
        if (voice.isListening) return 'Listening';
        if (voice.isSpeaking) return 'Speaking';
        if (voice.isEnabled) return 'Voice On';
        return 'Voice Off';
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isProcessing || voice.isProcessing}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${disabled || isProcessing || voice.isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        rounded-lg
        transition-all
        duration-200
        flex
        items-center
        justify-center
        gap-2
        border
        border-transparent
        hover:shadow-md
        focus:outline-none
        focus:ring-2
        focus:ring-purple-300
        focus:ring-offset-2
        dark:focus:ring-offset-gray-800
        ${className}
      `}
      title={getTooltipText()}
      aria-label={getTooltipText()}
    >
      {getIcon()}

      {showLabel && (
        <span className="text-sm font-medium">
          {getButtonLabel()}
        </span>
      )}

      {/* Activity indicator */}
      {(voice.isListening || voice.isSpeaking) && mode === 'toggle' && (
        <div className="absolute -top-1 -right-1 flex space-x-0.5">
          <div className="w-1 h-1 bg-current rounded-full animate-pulse"></div>
          <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        </div>
      )}
    </button>
  );
};

export default VoiceControlButton;