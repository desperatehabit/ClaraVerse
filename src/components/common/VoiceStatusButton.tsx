import React from 'react';
import { Mic, MicOff, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useVoiceContext } from '../../contexts/Voice/VoiceContext';

interface VoiceStatusButtonProps {
  onToggleVoice?: () => void;
  showLabel?: boolean;
  compact?: boolean;
}

const VoiceStatusButton: React.FC<VoiceStatusButtonProps> = ({
  onToggleVoice,
  showLabel = false,
  compact = false
}) => {
  const voice = useVoiceContext();

  const handleToggle = async () => {
    try {
      if (voice.isEnabled) {
        await voice.disable();
      } else {
        await voice.enable();
      }
      onToggleVoice?.();
    } catch (error) {
      console.error('Failed to toggle voice:', error);
    }
  };

  const getStatusColor = () => {
    if (voice.error) return 'text-red-500';
    if (voice.isListening) return 'text-green-500';
    if (voice.isSpeaking) return 'text-blue-500';
    if (voice.isEnabled && voice.isConnected) return 'text-purple-500';
    if (voice.isEnabled) return 'text-yellow-500';
    return 'text-gray-400';
  };

  const getStatusIcon = () => {
    if (voice.error) return <AlertTriangle className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />;
    if (voice.isProcessing) return <Loader2 className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} animate-spin`} />;
    if (voice.isListening) return <Mic className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />;
    if (voice.isEnabled) return <CheckCircle className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />;
    return <MicOff className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />;
  };

  const getStatusText = () => {
    if (voice.error) return 'Voice Error';
    if (voice.isProcessing) return 'Processing...';
    if (voice.isListening) return 'Listening';
    if (voice.isSpeaking) return 'Speaking';
    if (voice.isEnabled && voice.isConnected) return 'Voice Ready';
    if (voice.isEnabled) return 'Connecting...';
    return 'Voice Off';
  };

  const getTooltipText = () => {
    if (voice.error) return `Voice Error: ${voice.error}`;
    if (voice.isProcessing) return 'Processing voice input...';
    if (voice.isListening) return 'Listening for speech';
    if (voice.isSpeaking) return 'Speaking response';
    if (voice.isEnabled && voice.isConnected) return 'Voice mode enabled - click to disable';
    if (voice.isEnabled) return 'Connecting to voice service...';
    return 'Enable voice mode';
  };

  return (
    <button
      onClick={handleToggle}
      disabled={voice.isProcessing}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200
        ${voice.isEnabled
          ? 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30'
          : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
        }
        ${voice.isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${voice.error ? 'ring-2 ring-red-200 dark:ring-red-800' : ''}
      `}
      title={getTooltipText()}
      aria-label={getTooltipText()}
    >
      <div className={`flex items-center justify-center ${getStatusColor()}`}>
        {getStatusIcon()}
      </div>

      {showLabel && !compact && (
        <span className={`font-medium text-sm ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      )}

      {/* Activity indicator */}
      {(voice.isListening || voice.isSpeaking) && (
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-current rounded-full animate-pulse"></div>
          <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        </div>
      )}

      {/* Connection indicator */}
      {voice.isEnabled && voice.isConnected && !voice.error && (
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      )}
    </button>
  );
};

export default VoiceStatusButton;