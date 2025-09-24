import React, { useState, useEffect } from 'react';

interface AgentsViewProps {
  onPageChange: (page: string) => void;
}

const AgentsView: React.FC<AgentsViewProps> = ({ onPageChange }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleCreateAgent = () => {
    // TODO: Navigate to agent builder
    console.log('Create agent clicked');
    onPageChange('agent-builder');
  };

  const handleManageAgents = () => {
    // TODO: Navigate to agent management
    console.log('Manage agents clicked');
    onPageChange('agent-studio');
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-white to-sakura-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sakura-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading agents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-white to-sakura-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-sakura-500 text-white rounded-lg hover:bg-sakura-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-white to-sakura-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Agents</h1>
            <p className="text-gray-600 dark:text-gray-400">Create and manage intelligent AI agents</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleManageAgents}
              className="px-4 py-2 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Agent Studio
            </button>
            <button
              onClick={handleCreateAgent}
              className="px-4 py-2 bg-sakura-500 text-white rounded-lg hover:bg-sakura-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Agent
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-6">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">AI Agents Coming Soon</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create intelligent agents to automate workflows and assist with complex tasks
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={handleCreateAgent}
              className="px-6 py-3 bg-sakura-500 text-white rounded-lg hover:bg-sakura-600 transition-colors"
            >
              Create Your First Agent
            </button>
            <button
              onClick={handleManageAgents}
              className="px-6 py-3 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Explore Agent Studio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentsView;