import React, { useState, useEffect } from 'react';
import { VoiceContextType, ContextInfo, VoiceContextMode } from '../../types/context-aware-voice';

interface ContextAwareVoiceStatusProps {
  currentContext: ContextInfo | null;
  contextMode: VoiceContextMode | null;
  isListening: boolean;
  isProcessing: boolean;
  onContextSwitch?: (contextType: VoiceContextType) => void;
  className?: string;
}

export const ContextAwareVoiceStatus: React.FC<ContextAwareVoiceStatusProps> = ({
  currentContext,
  contextMode,
  isListening,
  isProcessing,
  onContextSwitch,
  className = ''
}) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextTransition, setContextTransition] = useState<string | null>(null);

  useEffect(() => {
    if (contextTransition) {
      const timer = setTimeout(() => setContextTransition(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [contextTransition]);

  const getContextDisplayInfo = (context: ContextInfo | null, mode: VoiceContextMode | null) => {
    if (!context || !mode) {
      return {
        name: 'Unknown',
        icon: '❓',
        color: '#6B7280',
        description: 'No active context'
      };
    }

    return {
      name: mode.name,
      icon: mode.icon,
      color: mode.color,
      description: mode.description
    };
  };

  const contextInfo = getContextDisplayInfo(currentContext, contextMode);

  const handleContextSwitch = (contextType: VoiceContextType) => {
    onContextSwitch?.(contextType);
    setShowContextMenu(false);
    setContextTransition(`Switching to ${contextType}...`);
  };

  const getStatusIndicator = () => {
    if (isProcessing) {
      return (
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-yellow-600 dark:text-yellow-400">Processing</span>
        </div>
      );
    }

    if (isListening) {
      return (
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-red-600 dark:text-red-400">Listening</span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm text-green-600 dark:text-green-400">Ready</span>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Context Transition Banner */}
      {contextTransition && (
        <div className="absolute -top-8 left-0 right-0 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs text-center py-1 rounded-t-md border border-blue-200 dark:border-blue-800">
          {contextTransition}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
        {/* Header with Context Info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
              style={{ backgroundColor: `${contextInfo.color}20`, color: contextInfo.color }}
            >
              {contextInfo.icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {contextInfo.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {contextInfo.description}
              </p>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex flex-col items-end space-y-1">
            {getStatusIndicator()}

            {/* Context Confidence */}
            {currentContext && (
              <div className="text-xs text-gray-400 dark:text-gray-500">
                {Math.round(currentContext.confidence * 100)}% confidence
              </div>
            )}
          </div>
        </div>

        {/* Context Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Quick Context Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowContextMenu(!showContextMenu)}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Switch Context
              </button>

              {showContextMenu && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                  {Object.values(VoiceContextType).map(contextType => (
                    <button
                      key={contextType}
                      onClick={() => handleContextSwitch(contextType)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-md last:rounded-b-md transition-colors"
                      disabled={currentContext?.type === contextType}
                    >
                      {contextType === currentContext?.type ? `✓ ${contextType}` : contextType}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Context Info */}
            <button className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors">
              Info
            </button>
          </div>

          {/* Context Timestamp */}
          {currentContext && (
            <div className="text-xs text-gray-400 dark:text-gray-500">
              {new Date(currentContext.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Context Detection Source */}
        {currentContext && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Detected via: <span className="capitalize">{currentContext.source.replace('_', ' ')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Context Menu Overlay */}
      {showContextMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowContextMenu(false)}
        />
      )}
    </div>
  );
};