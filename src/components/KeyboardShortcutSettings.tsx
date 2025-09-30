import React, { useState, useEffect } from 'react';
import { KeyboardShortcut, KeyboardShortcutConfig } from '../types/keyboard';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { VoiceService } from '../services/voice/VoiceService';

interface KeyboardShortcutSettingsProps {
  voiceService: VoiceService;
  onClose?: () => void;
}

export const KeyboardShortcutSettings: React.FC<KeyboardShortcutSettingsProps> = ({
  voiceService,
  onClose,
}) => {
  const { shortcuts, config, updateConfig, registerShortcut, unregisterShortcut } = useKeyboardShortcuts({ voiceService });
  const [editingShortcut, setEditingShortcut] = useState<KeyboardShortcut | null>(null);
  const [newShortcutKeys, setNewShortcutKeys] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  // Group shortcuts by category
  const shortcutsByCategory = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  const formatShortcutDisplay = (shortcut: KeyboardShortcut): string => {
    const parts = [];
    const { combination } = shortcut;

    // Add modifiers
    combination.modifiers.forEach(mod => {
      if (mod === 'ctrl') parts.push('Ctrl');
      else if (mod === 'alt') parts.push('Alt');
      else if (mod === 'shift') parts.push('Shift');
      else if (mod === 'meta') parts.push('Cmd');
      else if (mod === 'cmd') parts.push('Cmd');
    });

    // Add key
    if (combination.key === ' ') parts.push('Space');
    else if (combination.key.length === 1) parts.push(combination.key.toUpperCase());
    else {
      const specialKeys: Record<string, string> = {
        'ArrowUp': '↑',
        'ArrowDown': '↓',
        'ArrowLeft': '←',
        'ArrowRight': '→',
        'Enter': 'Enter',
        'Escape': 'Esc',
        'Tab': 'Tab',
        'Delete': 'Del',
        'Backspace': 'Backspace',
      };
      parts.push(specialKeys[combination.key] || combination.key);
    }

    return parts.join(' + ');
  };

  const handleKeyRecording = (shortcutId: string) => {
    setEditingShortcut(shortcuts.find(s => s.id === shortcutId) || null);
    setIsRecording(true);
    setNewShortcutKeys([]);

    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const keys = [];

      if (event.ctrlKey || event.metaKey) keys.push('ctrl');
      if (event.altKey) keys.push('alt');
      if (event.shiftKey) keys.push('shift');
      if (event.metaKey) keys.push('meta');

      if (event.key && event.key !== 'Control' && event.key !== 'Alt' && event.key !== 'Shift' && event.key !== 'Meta') {
        keys.push(event.key.toLowerCase());
      }

      setNewShortcutKeys(keys);

      // Auto-stop recording after capturing the combination
      if (keys.length > 0) {
        setTimeout(() => {
          setIsRecording(false);
          document.removeEventListener('keydown', handleKeyDown);
          document.removeEventListener('keyup', handleKeyUp);
        }, 500);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
  };

  const saveShortcut = () => {
    if (!editingShortcut || newShortcutKeys.length === 0) return;

    const updatedShortcut: KeyboardShortcut = {
      ...editingShortcut,
      combination: {
        key: newShortcutKeys[newShortcutKeys.length - 1],
        modifiers: newShortcutKeys.slice(0, -1) as any,
      },
    };

    // Remove old shortcut and register new one
    unregisterShortcut(editingShortcut.id);
    registerShortcut(updatedShortcut);

    setEditingShortcut(null);
    setNewShortcutKeys([]);
  };

  const cancelEditing = () => {
    setEditingShortcut(null);
    setNewShortcutKeys([]);
    setIsRecording(false);
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all shortcuts to their defaults?')) {
      // This would need to be implemented in the KeyboardService
      console.log('Reset to defaults requested');
    }
  };

  const toggleShortcut = (shortcutId: string, enabled: boolean) => {
    if (enabled) {
      // Enable would need to be implemented in KeyboardService
      console.log('Enable shortcut:', shortcutId);
    } else {
      // Disable would need to be implemented in KeyboardService
      console.log('Disable shortcut:', shortcutId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {Object.entries(shortcutsByCategory).map(([category, categoryShortcuts]) => (
            <div key={category} className="mb-6">
              <h3 className="text-lg font-medium text-white mb-3 capitalize">
                {category} Shortcuts
              </h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut) => (
                  <div
                    key={shortcut.id}
                    className="flex items-center justify-between p-3 bg-gray-800 rounded"
                  >
                    <div className="flex-1">
                      <div className="text-white font-medium">{shortcut.name}</div>
                      <div className="text-gray-400 text-sm">{shortcut.description}</div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {editingShortcut?.id === shortcut.id ? (
                        <div className="flex items-center space-x-2">
                          {isRecording ? (
                            <span className="text-blue-400 text-sm px-2 py-1 bg-blue-900 rounded">
                              Press keys...
                            </span>
                          ) : (
                            <span className="text-green-400 text-sm px-2 py-1 bg-green-900 rounded font-mono">
                              {newShortcutKeys.join(' + ').toUpperCase()}
                            </span>
                          )}
                          <button
                            onClick={saveShortcut}
                            className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                            disabled={newShortcutKeys.length === 0}
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="text-gray-300 text-sm font-mono px-2 py-1 bg-gray-700 rounded">
                            {formatShortcutDisplay(shortcut)}
                          </span>
                          <button
                            onClick={() => handleKeyRecording(shortcut.id)}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                          >
                            Change
                          </button>
                          <button
                            onClick={() => toggleShortcut(shortcut.id, !shortcut.enabled)}
                            className={`px-2 py-1 text-xs rounded ${
                              shortcut.enabled
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                          >
                            {shortcut.enabled ? 'Disable' : 'Enable'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-700">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded"
          >
            Reset to Defaults
          </button>
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2 text-white">
              <input
                type="checkbox"
                checked={config.globalEnabled}
                onChange={(e) => updateConfig({ globalEnabled: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Enable Global Shortcuts</span>
            </label>
            <label className="flex items-center space-x-2 text-white">
              <input
                type="checkbox"
                checked={config.visualIndicators}
                onChange={(e) => updateConfig({ visualIndicators: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Show Visual Indicators</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};