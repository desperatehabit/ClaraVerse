import React from 'react';
import { X } from 'lucide-react';
import VoiceControlButton from './common/VoiceControlButton';

interface ModalProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  children: React.ReactNode;
  title?: string;
  showVoiceControls?: boolean;
  onVoiceCommand?: (command: string) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  showModal,
  setShowModal,
  children,
  title,
  showVoiceControls = false,
  onVoiceCommand,
  size = 'md',
  showCloseButton = true
}) => {
  if (!showModal) {
    return null;
  }

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  const handleVoiceCommand = (transcription: string) => {
    // Common voice commands for modals
    const command = transcription.toLowerCase().trim();

    if (command.includes('close') || command.includes('cancel') || command.includes('exit')) {
      setShowModal(false);
      return;
    }

    if (command.includes('save') || command.includes('confirm') || command.includes('yes')) {
      // Try to find and click a primary button (save/confirm/submit)
      const primaryButton = document.querySelector('button[type="submit"], button[class*="save"], button[class*="confirm"]') as HTMLButtonElement;
      if (primaryButton && !primaryButton.disabled) {
        primaryButton.click();
        return;
      }
    }

    onVoiceCommand?.(transcription);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => setShowModal(false)}
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with title and controls */}
        {(title || showCloseButton || showVoiceControls) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {title && (
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {title}
                </h2>
              )}
              {showVoiceControls && (
                <VoiceControlButton
                  mode="listen"
                  size="sm"
                  variant="ghost"
                  onTranscription={handleVoiceCommand}
                  tooltip="Voice control - say 'close' to exit, 'save' to confirm"
                />
              )}
            </div>

            {showCloseButton && (
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {children}
        </div>

        {/* Footer with voice hint */}
        {showVoiceControls && (
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>
                💡 Voice commands: "close" to exit, "save" to confirm
              </span>
              <div className="flex items-center gap-2">
                <span>Voice</span>
                <VoiceControlButton
                  mode="listen"
                  size="sm"
                  variant="ghost"
                  onTranscription={handleVoiceCommand}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;