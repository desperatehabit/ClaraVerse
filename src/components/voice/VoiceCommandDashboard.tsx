import React, { useState, useEffect } from 'react';
import { VoiceCommand, VoiceCommandHistory, VoiceCommandCategory, VoiceCommandSettings } from '../../types/voice-commands';

interface VoiceCommandDashboardProps {
  isVisible: boolean;
  onClose: () => void;
  availableCommands: VoiceCommand[];
  commandHistory: VoiceCommandHistory[];
  settings: VoiceCommandSettings;
  onSettingsChange: (settings: Partial<VoiceCommandSettings>) => void;
  onExecuteCommand: (command: string) => Promise<void>;
}

export const VoiceCommandDashboard: React.FC<VoiceCommandDashboardProps> = ({
  isVisible,
  onClose,
  availableCommands,
  commandHistory,
  settings,
  onSettingsChange,
  onExecuteCommand
}) => {
  const [activeTab, setActiveTab] = useState<'commands' | 'history' | 'settings' | 'safety'>('commands');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<VoiceCommandCategory | 'all'>('all');

  // Filter commands based on search and category
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
  }, {} as Record<VoiceCommandCategory, VoiceCommand[]>);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Voice Commands</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'commands', label: 'Commands' },
            { id: 'history', label: 'History' },
            { id: 'settings', label: 'Settings' },
            { id: 'safety', label: 'Safety' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'commands' && (
            <CommandsTab
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              commandsByCategory={commandsByCategory}
              onExecuteCommand={onExecuteCommand}
            />
          )}

          {activeTab === 'history' && (
            <HistoryTab
              commandHistory={commandHistory}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              settings={settings}
              onSettingsChange={onSettingsChange}
            />
          )}

          {activeTab === 'safety' && (
            <SafetyTab
              settings={settings}
              onSettingsChange={onSettingsChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Commands Tab Component
const CommandsTab: React.FC<{
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: VoiceCommandCategory | 'all';
  onCategoryChange: (category: VoiceCommandCategory | 'all') => void;
  commandsByCategory: Record<VoiceCommandCategory, VoiceCommand[]>;
  onExecuteCommand: (command: string) => Promise<void>;
}> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  commandsByCategory,
  onExecuteCommand
}) => {
  return (
    <div className="p-6 h-full flex flex-col">
      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search commands..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />

        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value as VoiceCommandCategory | 'all')}
          className="px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Categories</option>
          {Object.values(VoiceCommandCategory).map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Commands List */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(commandsByCategory).map(([category, commands]) => (
          commands.length > 0 && (
            <div key={category} className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {category.charAt(0).toUpperCase() + category.slice(1)} Commands
              </h3>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {commands.map((command) => (
                  <CommandCard
                    key={command.id}
                    command={command}
                    onExecute={() => onExecuteCommand(command.name)}
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

// Command Card Component
const CommandCard: React.FC<{
  command: VoiceCommand;
  onExecute: () => void;
}> = ({ command, onExecute }) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 dark:text-white">{command.name}</h4>
        <span className={`px-2 py-1 text-xs rounded-full ${
          command.sensitive
            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        }`}>
          {command.category}
        </span>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
        {command.description}
      </p>

      {command.examples.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Examples:</p>
          <div className="space-y-1">
            {command.examples.slice(0, 2).map((example, index) => (
              <p key={index} className="text-xs text-gray-500 dark:text-gray-400 italic">
                "{example}"
              </p>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onExecute}
        className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Try Command
      </button>
    </div>
  );
};

// History Tab Component
const HistoryTab: React.FC<{
  commandHistory: VoiceCommandHistory[];
}> = ({ commandHistory }) => {
  return (
    <div className="p-6 h-full">
      <div className="overflow-y-auto h-full">
        {commandHistory.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No command history available
          </p>
        ) : (
          <div className="space-y-4">
            {commandHistory.map((entry) => (
              <div key={entry.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {entry.command}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      entry.result.success
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {entry.result.success ? 'Success' : 'Failed'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {entry.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {entry.parsedCommand && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    Command: {entry.parsedCommand.command.name} ({Math.round(entry.parsedCommand.confidence * 100)}% confidence)
                  </p>
                )}

                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {entry.result.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Settings Tab Component
const SettingsTab: React.FC<{
  settings: VoiceCommandSettings;
  onSettingsChange: (settings: Partial<VoiceCommandSettings>) => void;
}> = ({ settings, onSettingsChange }) => {
  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="space-y-6">
        {/* Safety Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Safety Level
          </label>
          <select
            value={settings.safetyLevel}
            onChange={(e) => onSettingsChange({ safetyLevel: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="strict">Strict</option>
            <option value="moderate">Moderate</option>
            <option value="permissive">Permissive</option>
          </select>
        </div>

        {/* Enabled Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Enabled Command Categories
          </label>
          <div className="space-y-2">
            {Object.values(VoiceCommandCategory).map(category => (
              <label key={category} className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.enabledCategories.includes(category)}
                  onChange={(e) => {
                    const newCategories = e.target.checked
                      ? [...settings.enabledCategories, category]
                      : settings.enabledCategories.filter(c => c !== category);
                    onSettingsChange({ enabledCategories: newCategories });
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Command Confirmation Settings */}
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.confirmSensitiveCommands}
              onChange={(e) => onSettingsChange({ confirmSensitiveCommands: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Confirm sensitive commands
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.confirmSystemCommands}
              onChange={(e) => onSettingsChange({ confirmSystemCommands: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Confirm system commands
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.autoExecuteSafeCommands}
              onChange={(e) => onSettingsChange({ autoExecuteSafeCommands: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Auto-execute safe commands
            </span>
          </label>
        </div>

        {/* History Settings */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Maximum Command History
          </label>
          <input
            type="number"
            value={settings.maxCommandHistory}
            onChange={(e) => onSettingsChange({ maxCommandHistory: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            min="10"
            max="1000"
          />
        </div>
      </div>
    </div>
  );
};

// Safety Tab Component
const SafetyTab: React.FC<{
  settings: VoiceCommandSettings;
  onSettingsChange: (settings: Partial<VoiceCommandSettings>) => void;
}> = ({ settings, onSettingsChange }) => {
  return (
    <div className="p-6 h-full">
      <div className="space-y-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            Safety Information
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Voice commands include built-in safety features to prevent accidental execution of dangerous operations.
            Commands are analyzed for potential risks and may require confirmation before execution.
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Current Safety Settings</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Safety Level</h5>
              <p className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                {settings.safetyLevel}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Sensitive Commands</h5>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {settings.confirmSensitiveCommands ? 'Require confirmation' : 'Auto-execute'}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">System Commands</h5>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {settings.confirmSystemCommands ? 'Require confirmation' : 'Auto-execute'}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Safe Commands</h5>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {settings.autoExecuteSafeCommands ? 'Auto-execute' : 'Require confirmation'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Protected Operations</h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• System file modifications</li>
            <li>• Drive formatting operations</li>
            <li>• Network configuration changes</li>
            <li>• Application uninstallation</li>
            <li>• System shutdown/restart</li>
          </ul>
        </div>
      </div>
    </div>
  );
};