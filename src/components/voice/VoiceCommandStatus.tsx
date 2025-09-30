import React from 'react';
import { VoiceCommandSettings, VoiceCommandHistory } from '../../types/voice-commands';

interface VoiceCommandStatusProps {
  isEnabled: boolean;
  isListening: boolean;
  isProcessing: boolean;
  recentCommands: VoiceCommandHistory[];
  settings: VoiceCommandSettings;
  onToggleListening: () => void;
  onOpenDashboard: () => void;
}

export const VoiceCommandStatus: React.FC<VoiceCommandStatusProps> = ({
  isEnabled,
  isListening,
  isProcessing,
  recentCommands,
  settings,
  onToggleListening,
  onOpenDashboard
}) => {
  const getStatusColor = () => {
    if (!isEnabled) return 'bg-gray-400';
    if (isListening) return 'bg-red-500 animate-pulse';
    if (isProcessing) return 'bg-yellow-500 animate-pulse';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isEnabled) return 'Voice Commands Disabled';
    if (isListening) return 'Listening...';
    if (isProcessing) return 'Processing...';
    return 'Voice Commands Ready';
  };

  const recentSuccessCount = recentCommands.filter(cmd => cmd.result.success).length;
  const recentTotalCount = recentCommands.length;
  const successRate = recentTotalCount > 0 ? Math.round((recentSuccessCount / recentTotalCount) * 100) : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      {/* Status Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
          <span className="font-medium text-gray-900 dark:text-white">
            {getStatusText()}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onToggleListening}
            disabled={!isEnabled}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              isListening
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400'
            }`}
          >
            {isListening ? 'Stop' : 'Start'}
          </button>

          <button
            onClick={onOpenDashboard}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Dashboard
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {recentTotalCount}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Recent Commands
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {successRate}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Success Rate
          </div>
        </div>
      </div>

      {/* Recent Commands */}
      {recentCommands.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recent Commands
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {recentCommands.slice(0, 3).map((command) => (
              <div key={command.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 truncate">
                  {command.command}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  command.result.success
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {command.result.success ? 'Success' : 'Failed'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Safety: {settings.safetyLevel}
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            Categories: {settings.enabledCategories.length} enabled
          </span>
        </div>
      </div>
    </div>
  );
};