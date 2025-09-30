import React, { useState, useEffect } from 'react';
import {
  VoiceContextType,
  ContextInfo,
  VoiceContextMode
} from '../../types/context-aware-voice';
import { VoiceCommand } from '../../types/voice-commands';

interface SmartSuggestion {
  id: string;
  command: string;
  description: string;
  confidence: number;
  reason: string;
  context: VoiceContextType;
  category: 'frequent' | 'contextual' | 'time_based' | 'preference' | 'related' | 'new_feature';
  metadata: Record<string, any>;
  expiresAt?: Date;
}

interface ContextAwareCommandDashboardProps {
  isVisible: boolean;
  onClose: () => void;
  currentContext: ContextInfo | null;
  contextMode: VoiceContextMode | null;
  availableCommands: VoiceCommand[];
  smartSuggestions: SmartSuggestion[];
  onExecuteCommand: (command: string, parameters?: Record<string, any>) => Promise<void>;
  onContextSwitch: (contextType: VoiceContextType) => void;
}

export const ContextAwareCommandDashboard: React.FC<ContextAwareCommandDashboardProps> = ({
  isVisible,
  onClose,
  currentContext,
  contextMode,
  availableCommands,
  smartSuggestions,
  onExecuteCommand,
  onContextSwitch
}) => {
  const [activeTab, setActiveTab] = useState<'commands' | 'suggestions' | 'context' | 'history'>('commands');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter commands based on search and context
  const filteredCommands = availableCommands.filter(command => {
    const matchesSearch = command.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         command.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || command.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group commands by category
  const commandsByCategory = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = [];
    }
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, VoiceCommand[]>);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-7xl h-[85vh] flex flex-col">
        {/* Enhanced Header with Context Info */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Voice Commands</h2>

            {/* Context Indicator */}
            {currentContext && contextMode && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <span className="text-lg">{contextMode.icon}</span>
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {contextMode.name}
                </span>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: contextMode.color }}
                />
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Enhanced Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'commands', label: 'Commands', icon: '📋' },
            { id: 'suggestions', label: 'Suggestions', icon: '💡' },
            { id: 'context', label: 'Context', icon: '🎯' },
            { id: 'history', label: 'History', icon: '📚' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 text-sm font-medium flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content with Context-Aware Features */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'commands' && (
            <CommandsTab
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              commandsByCategory={commandsByCategory}
              currentContext={currentContext}
              contextMode={contextMode}
              onExecuteCommand={onExecuteCommand}
            />
          )}

          {activeTab === 'suggestions' && (
            <SuggestionsTab
              smartSuggestions={smartSuggestions}
              currentContext={currentContext}
              onExecuteCommand={onExecuteCommand}
            />
          )}

          {activeTab === 'context' && (
            <ContextTab
              currentContext={currentContext}
              contextMode={contextMode}
              onContextSwitch={onContextSwitch}
            />
          )}

          {activeTab === 'history' && (
            <HistoryTab />
          )}
        </div>
      </div>
    </div>
  );
};

// Enhanced Commands Tab with Context Awareness
const CommandsTab: React.FC<{
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  commandsByCategory: Record<string, VoiceCommand[]>;
  currentContext: ContextInfo | null;
  contextMode: VoiceContextMode | null;
  onExecuteCommand: (command: string, parameters?: Record<string, any>) => Promise<void>;
}> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  commandsByCategory,
  currentContext,
  contextMode,
  onExecuteCommand
}) => {
  const categories = Object.keys(commandsByCategory);

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Enhanced Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search commands..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Context-Aware Command Groups */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(commandsByCategory).map(([category, commands]) => (
          commands.length > 0 && (
            <div key={category} className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {category.charAt(0).toUpperCase() + category.slice(1)} Commands
                </h3>

                {/* Context Relevance Indicator */}
                {currentContext && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Context relevance:
                    </span>
                    <div className="flex space-x-1">
                      {[1, 2, 3].map(level => (
                        <div
                          key={level}
                          className={`w-2 h-2 rounded-full ${
                            level <= 2 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {commands.map((command) => (
                  <ContextAwareCommandCard
                    key={command.id}
                    command={command}
                    currentContext={currentContext}
                    contextMode={contextMode}
                    onExecute={(params) => onExecuteCommand(command.name, params)}
                  />
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

// Context-Aware Command Card
const ContextAwareCommandCard: React.FC<{
  command: VoiceCommand;
  currentContext: ContextInfo | null;
  contextMode: VoiceContextMode | null;
  onExecute: (parameters?: Record<string, any>) => void;
}> = ({ command, currentContext, contextMode, onExecute }) => {
  const [showExamples, setShowExamples] = useState(false);

  const isContextRelevant = currentContext && contextMode?.availableCommands.includes(command.name);
  const contextRelevance = isContextRelevant ? 'high' : 'medium';

  return (
    <div className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 border-l-4 ${
      isContextRelevant ? 'border-l-green-500 bg-green-50 dark:bg-green-900/20' : 'border-l-gray-300'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 dark:text-white">{command.name}</h4>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs rounded-full ${
            isContextRelevant
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
          }`}>
            {contextRelevance} relevance
          </span>
          <span className={`px-2 py-1 text-xs rounded-full ${
            command.sensitive
              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
          }`}>
            {command.category}
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
        {command.description}
      </p>

      {/* Context-Specific Information */}
      {isContextRelevant && (
        <div className="mb-3 p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
          <p className="text-xs text-green-800 dark:text-green-200">
            ✨ Optimized for {contextMode?.name} context
          </p>
        </div>
      )}

      {command.examples.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setShowExamples(!showExamples)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            {showExamples ? 'Hide' : 'Show'} examples ({command.examples.length})
          </button>

          {showExamples && (
            <div className="mt-2 space-y-1">
              {command.examples.slice(0, 2).map((example, index) => (
                <p key={index} className="text-xs text-gray-500 dark:text-gray-400 italic">
                  "{example}"
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => onExecute()}
        className={`w-full px-3 py-2 text-sm rounded-md transition-colors ${
          isContextRelevant
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        Try Command
      </button>
    </div>
  );
};

// Smart Suggestions Tab
const SuggestionsTab: React.FC<{
  smartSuggestions: SmartSuggestion[];
  currentContext: ContextInfo | null;
  onExecuteCommand: (command: string, parameters?: Record<string, any>) => Promise<void>;
}> = ({ smartSuggestions, currentContext, onExecuteCommand }) => {
  const getCategoryIcon = (category: string) => {
    const icons = {
      frequent: '🔥',
      contextual: '🎯',
      time_based: '⏰',
      preference: '❤️',
      related: '🔗',
      new_feature: '✨'
    };
    return icons[category as keyof typeof icons] || '💡';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      frequent: 'border-l-red-500 bg-red-50 dark:bg-red-900/20',
      contextual: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20',
      time_based: 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/20',
      preference: 'border-l-pink-500 bg-pink-50 dark:bg-pink-900/20',
      related: 'border-l-green-500 bg-green-50 dark:bg-green-900/20',
      new_feature: 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
    };
    return colors[category as keyof typeof colors] || 'border-l-gray-500';
  };

  return (
    <div className="p-6 h-full">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Smart Suggestions
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Personalized command recommendations based on your current context and usage patterns.
        </p>
      </div>

      <div className="overflow-y-auto h-full">
        {smartSuggestions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No suggestions available. Try using some commands to get personalized recommendations.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {smartSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`border-l-4 p-4 rounded-r-lg ${getCategoryColor(suggestion.category)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getCategoryIcon(suggestion.category)}</span>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {suggestion.command}
                    </h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                      {Math.round(suggestion.confidence * 100)}%
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  {suggestion.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {suggestion.reason.replace('_', ' ')}
                  </span>

                  <button
                    onClick={() => onExecuteCommand(suggestion.command)}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Try Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Context Management Tab
const ContextTab: React.FC<{
  currentContext: ContextInfo | null;
  contextMode: VoiceContextMode | null;
  onContextSwitch: (contextType: VoiceContextType) => void;
}> = ({ currentContext, contextMode, onContextSwitch }) => {
  const contextTypes = Object.values(VoiceContextType);

  return (
    <div className="p-6 h-full">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Context Management
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Manage voice contexts and see how they adapt to your current activity.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Context Info */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Current Context</h4>

          {currentContext && contextMode ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{contextMode.icon}</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{contextMode.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{contextMode.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Confidence:</span>
                  <p className="font-medium">{Math.round(currentContext.confidence * 100)}%</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Source:</span>
                  <p className="font-medium capitalize">{currentContext.source.replace('_', ' ')}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Detected:</span>
                  <p className="font-medium">{new Date(currentContext.timestamp).toLocaleTimeString()}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Commands:</span>
                  <p className="font-medium">{contextMode.availableCommands.length}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No active context detected</p>
          )}
        </div>

        {/* Context Switcher */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Switch Context</h4>

          <div className="grid grid-cols-2 gap-2">
            {contextTypes.map(contextType => (
              <button
                key={contextType}
                onClick={() => onContextSwitch(contextType)}
                disabled={currentContext?.type === contextType}
                className={`p-3 text-sm rounded-md transition-colors ${
                  currentContext?.type === contextType
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500'
                }`}
              >
                {contextType}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// History Tab (placeholder for now)
const HistoryTab: React.FC = () => {
  return (
    <div className="p-6 h-full">
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          Command history will be displayed here.
        </p>
      </div>
    </div>
  );
};