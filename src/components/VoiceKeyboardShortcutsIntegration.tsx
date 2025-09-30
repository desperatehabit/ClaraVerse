import React, { useEffect } from 'react';
import { KeyboardShortcutsProvider, useKeyboardShortcuts, useKeyboardShortcutsContext } from './KeyboardShortcutsProvider';
import { KeyboardShortcut } from '../types/keyboard';
import { VoiceService } from '../services/voice/VoiceService';

/**
 * Integration component that demonstrates how to use the keyboard shortcuts system
 * with voice features in a React application.
 */

interface VoiceKeyboardShortcutsIntegrationProps {
  voiceService: VoiceService;
  currentView?: 'tasks' | 'chat' | 'settings' | 'main';
  children: React.ReactNode;
}

export const VoiceKeyboardShortcutsIntegration: React.FC<VoiceKeyboardShortcutsIntegrationProps> = ({
  voiceService,
  currentView = 'main',
  children,
}) => {
  return (
    <KeyboardShortcutsProvider
      voiceService={voiceService}
      overlayEnabled={true}
      settingsEnabled={true}
      showCategories={['voice', 'task', 'navigation']}
      overlayPosition="top-right"
    >
      <VoiceKeyboardShortcutsContent currentView={currentView}>
        {children}
      </VoiceKeyboardShortcutsContent>
    </KeyboardShortcutsProvider>
  );
};

interface VoiceKeyboardShortcutsContentProps {
  currentView: 'tasks' | 'chat' | 'settings' | 'main';
  children: React.ReactNode;
}

const VoiceKeyboardShortcutsContent: React.FC<VoiceKeyboardShortcutsContentProps> = ({
  currentView,
  children,
}) => {
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts({ voiceService: null as any });

  useEffect(() => {
    // Register contextual shortcuts based on current view
    const contextualShortcuts = getContextualShortcuts(currentView);

    // Unregister existing contextual shortcuts
    const existingContextual = ['contextual-voice-task-create', 'contextual-voice-task-complete', 'contextual-voice-chat-send'];
    existingContextual.forEach(id => unregisterShortcut(id));

    // Register new contextual shortcuts
    contextualShortcuts.forEach(shortcut => registerShortcut(shortcut));

    return () => {
      // Cleanup contextual shortcuts when view changes
      contextualShortcuts.forEach(shortcut => unregisterShortcut(shortcut.id));
    };
  }, [currentView, registerShortcut, unregisterShortcut]);

  return <>{children}</>;
};

const getContextualShortcuts = (currentView: string): KeyboardShortcut[] => {
  const baseShortcuts: KeyboardShortcut[] = [];

  switch (currentView) {
    case 'tasks':
      baseShortcuts.push(
        {
          id: 'contextual-voice-task-create',
          name: 'Create New Task (Voice)',
          description: 'Create a new task using voice commands',
          combination: { key: 'n', modifiers: ['ctrl', 'shift'] },
          category: 'task',
          action: () => {
            console.log('Voice: Create new task');
            // This would integrate with task creation functionality
          },
        },
        {
          id: 'contextual-voice-task-complete',
          name: 'Complete Selected Task (Voice)',
          description: 'Mark selected task as complete using voice',
          combination: { key: 'Enter', modifiers: ['ctrl'] },
          category: 'task',
          action: () => {
            console.log('Voice: Complete selected task');
            // This would integrate with task completion functionality
          },
        }
      );
      break;

    case 'chat':
      baseShortcuts.push({
        id: 'contextual-voice-chat-send',
        name: 'Send Voice Message',
        description: 'Send a voice message in chat',
        combination: { key: 'Enter', modifiers: ['shift'] },
        category: 'voice',
        action: () => {
          console.log('Voice: Send voice message');
          // This would integrate with chat functionality
        },
      });
      break;

    case 'main':
      // Main view shortcuts are already handled by the default shortcuts
      break;

    default:
      break;
  }

  return baseShortcuts;
};

// Hook for components to easily access voice keyboard shortcuts
export const useVoiceKeyboardShortcuts = () => {
  const context = useKeyboardShortcutsContext();

  return {
    showVoiceSettings: context.showSettings,
    toggleVoiceOverlay: context.toggleOverlay,
  };
};