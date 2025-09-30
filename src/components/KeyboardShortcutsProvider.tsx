import React, { createContext, useContext, ReactNode } from 'react';
import { KeyboardShortcutsOverlay } from './KeyboardShortcutsOverlay';
import { KeyboardShortcutSettings } from './KeyboardShortcutSettings';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { VoiceService } from '../services/voice/VoiceService';

interface KeyboardShortcutsContextType {
  showSettings: () => void;
  hideSettings: () => void;
  toggleOverlay: () => void;
  isOverlayVisible: boolean;
  isSettingsVisible: boolean;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | null>(null);

export interface KeyboardShortcutsProviderProps {
  children: ReactNode;
  voiceService: VoiceService;
  overlayEnabled?: boolean;
  settingsEnabled?: boolean;
  showCategories?: string[];
  overlayPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
}

export const KeyboardShortcutsProvider: React.FC<KeyboardShortcutsProviderProps> = ({
  children,
  voiceService,
  overlayEnabled = true,
  settingsEnabled = true,
  showCategories = ['voice', 'task'],
  overlayPosition = 'top-right',
}) => {
  const [isOverlayVisible, setIsOverlayVisible] = React.useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = React.useState(false);

  // Initialize the keyboard shortcuts system
  const keyboardShortcuts = useKeyboardShortcuts({
    voiceService,
    autoStart: true,
    enabled: true,
  });

  const contextValue: KeyboardShortcutsContextType = {
    showSettings: () => setIsSettingsVisible(true),
    hideSettings: () => setIsSettingsVisible(false),
    toggleOverlay: () => setIsOverlayVisible(!isOverlayVisible),
    isOverlayVisible,
    isSettingsVisible,
  };

  return (
    <KeyboardShortcutsContext.Provider value={contextValue}>
      {children}

      {/* Keyboard Shortcuts Overlay */}
      {overlayEnabled && (
        <KeyboardShortcutsOverlay
          voiceService={voiceService}
          visible={isOverlayVisible}
          position={overlayPosition}
          showCategories={showCategories}
        />
      )}

      {/* Keyboard Shortcuts Settings Modal */}
      {settingsEnabled && isSettingsVisible && (
        <KeyboardShortcutSettings
          voiceService={voiceService}
          onClose={() => setIsSettingsVisible(false)}
        />
      )}
    </KeyboardShortcutsContext.Provider>
  );
};

export const useKeyboardShortcutsContext = (): KeyboardShortcutsContextType => {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error('useKeyboardShortcutsContext must be used within a KeyboardShortcutsProvider');
  }
  return context;
};

// Export the hook for direct access to keyboard shortcuts
export { useKeyboardShortcuts };