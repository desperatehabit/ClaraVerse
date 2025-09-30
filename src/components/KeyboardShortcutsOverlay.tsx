import React, { useEffect, useState } from 'react';
import { KeyboardShortcut, KeyboardShortcutDisplay } from '../types/keyboard';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { VoiceService } from '../services/voice/VoiceService';

interface KeyboardShortcutsOverlayProps {
  voiceService: VoiceService;
  visible?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  showCategories?: string[];
}

export const KeyboardShortcutsOverlay: React.FC<KeyboardShortcutsOverlayProps> = ({
  voiceService,
  visible = true,
  position = 'top-right',
  showCategories = ['voice', 'task'],
}) => {
  const { shortcuts, config } = useKeyboardShortcuts({ voiceService });
  const [displayShortcuts, setDisplayShortcuts] = useState<KeyboardShortcutDisplay[]>([]);
  const [showOverlay, setShowOverlay] = useState(false);

  // Filter shortcuts by categories and create display data
  useEffect(() => {
    if (!visible || !config.visualIndicators) return;

    const filteredShortcuts = shortcuts.filter(shortcut =>
      showCategories.includes(shortcut.category)
    );

    const displayData: KeyboardShortcutDisplay[] = filteredShortcuts.map(shortcut => ({
      shortcut,
      displayText: formatShortcutText(shortcut),
      isActive: false,
    }));

    setDisplayShortcuts(displayData);
  }, [shortcuts, showCategories, visible, config.visualIndicators]);

  const formatShortcutText = (shortcut: KeyboardShortcut): string => {
    const { combination } = shortcut;
    const parts = [];

    // Add modifiers in a consistent order
    const modifierOrder = ['ctrl', 'alt', 'shift', 'meta', 'cmd'];
    const displayModifiers = combination.modifiers.map((mod: string) => {
      if (mod === 'cmd') return '⌘';
      if (mod === 'ctrl') return 'Ctrl';
      if (mod === 'alt') return 'Alt';
      if (mod === 'shift') return '⇧';
      if (mod === 'meta') return '⌘';
      return mod.toUpperCase();
    });

    parts.push(...displayModifiers);

    // Add the main key
    const keyDisplay = combination.key.toUpperCase();
    if (keyDisplay === ' ') parts.push('Space');
    else if (keyDisplay.length === 1) parts.push(keyDisplay);
    else {
      // Handle special keys
      const specialKeys: Record<string, string> = {
        'ARROWUP': '↑',
        'ARROWDOWN': '↓',
        'ARROWLEFT': '←',
        'ARROWRIGHT': '→',
        'ENTER': '↵',
        'ESCAPE': 'Esc',
        'TAB': 'Tab',
        'DELETE': 'Del',
        'BACKSPACE': '⌫',
      };
      parts.push(specialKeys[keyDisplay] || keyDisplay);
    }

    return parts.join(' + ');
  };

  const handleShortcutClick = (shortcut: KeyboardShortcut) => {
    // Execute the shortcut action
    shortcut.action();
  };

  const toggleOverlay = () => {
    setShowOverlay(!showOverlay);
  };

  if (!visible || !config.visualIndicators || displayShortcuts.length === 0) {
    return null;
  }

  const getPositionClasses = () => {
    const positions = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
    };
    return positions[position];
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={toggleOverlay}
        className={`fixed ${getPositionClasses()} z-50 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm shadow-lg transition-all duration-200 flex items-center space-x-2`}
        title="Toggle Keyboard Shortcuts"
      >
        <span className="text-xs">⌨️</span>
        <span>Shortcuts</span>
      </button>

      {/* Overlay */}
      {showOverlay && (
        <div className={`fixed ${getPositionClasses()} z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-4 min-w-80 max-w-md`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-semibold text-sm">Keyboard Shortcuts</h3>
            <button
              onClick={toggleOverlay}
              className="text-gray-400 hover:text-white text-lg leading-none"
              title="Close"
            >
              ×
            </button>
          </div>

          <div className="space-y-2">
            {displayShortcuts.map((displayShortcut, index) => (
              <div
                key={displayShortcut.shortcut.id}
                className="flex items-center justify-between py-2 px-3 bg-gray-800 rounded hover:bg-gray-700 transition-colors"
              >
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">
                    {displayShortcut.shortcut.name}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {displayShortcut.shortcut.description}
                  </div>
                </div>
                <button
                  onClick={() => handleShortcutClick(displayShortcut.shortcut)}
                  className="ml-3 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded font-mono transition-colors"
                  title="Execute shortcut"
                >
                  {displayShortcut.displayText}
                </button>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-3 border-t border-gray-700">
            <div className="text-gray-400 text-xs space-y-1">
              <div className="flex items-center space-x-4">
                <span>⌘ = Cmd (Mac) / Ctrl (Win/Linux)</span>
              </div>
              <div className="flex items-center space-x-4">
                <span>⇧ = Shift</span>
                <span>⌥ = Alt</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Shortcut Indicator */}
      <div id="active-shortcut-indicator" className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none">
        {/* This will be populated by the keyboard service when shortcuts are triggered */}
      </div>
    </>
  );
};