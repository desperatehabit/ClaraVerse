import React, { useState, useEffect } from 'react';
import { ScheduledTask, ScheduledTaskExecution } from '../../types/agent/types';

interface ScheduledTasksViewProps {
  onPageChange: (page: string) => void;
}

const ScheduledTasksView: React.FC<ScheduledTasksViewProps> = ({ onPageChange }) => {
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [executions, setExecutions] = useState<ScheduledTaskExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadScheduledTasks();
    loadExecutions();
  }, []);

  const loadScheduledTasks = async () => {
    try {
      // For now, show placeholder data since we need to integrate with the scheduler
      setScheduledTasks([]);
    } catch (err) {
      console.error('Failed to load scheduled tasks:', err);
      setError('Failed to load scheduled tasks');
    }
  };

  const loadExecutions = async () => {
    try {
      // For now, show placeholder data
      setExecutions([]);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load executions:', err);
      setError('Failed to load executions');
      setLoading(false);
    }
  };

  const handleCreateScheduledTask = () => {
    // TODO: Open modal to create new scheduled task
    console.log('Create scheduled task clicked');
  };

  const handleToggleTask = async (taskId: string, enabled: boolean) => {
    try {
      // TODO: Update task enabled status
      console.log(`Toggle task ${taskId} to ${enabled}`);
      await loadScheduledTasks();
    } catch (err) {
      console.error('Failed to toggle task:', err);
      setError('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      // TODO: Delete scheduled task
      console.log(`Delete task ${taskId}`);
      await loadScheduledTasks();
    } catch (err) {
      console.error('Failed to delete task:', err);
      setError('Failed to delete task');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-white to-sakura-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sakura-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading scheduled tasks...</p>
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
            onClick={() => { loadScheduledTasks(); loadExecutions(); }}
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Scheduled Tasks</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage automated AI agent tasks</p>
          </div>
          <button
            onClick={handleCreateScheduledTask}
            className="px-4 py-2 bg-sakura-500 text-white rounded-lg hover:bg-sakura-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Scheduled Task
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-6">
        {scheduledTasks.length === 0 ? (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="text-6xl mb-4">⏰</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Scheduled Tasks</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first scheduled task to automate AI agent workflows
            </p>
            <button
              onClick={handleCreateScheduledTask}
              className="px-6 py-3 bg-sakura-500 text-white rounded-lg hover:bg-sakura-600 transition-colors"
            >
              Create Your First Scheduled Task
            </button>
          </div>
        ) : (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Active Scheduled Tasks</h2>
              <div className="space-y-4">
                {scheduledTasks.map((task) => (
                  <div key={task.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">{task.agentName}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{task.agentDescription}</p>
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>Next run: {task.schedule.nextRun ? new Date(task.schedule.nextRun).toLocaleString() : 'Not scheduled'}</span>
                          <span className="ml-4">Runs: {task.metadata.totalRuns} (Success: {task.metadata.successRuns})</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleTask(task.id, !task.schedule.enabled)}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            task.schedule.enabled
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {task.schedule.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="px-3 py-1 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Executions */}
        {executions.length > 0 && (
          <div className="mt-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Executions</h2>
              <div className="space-y-2">
                {executions.slice(0, 10).map((execution) => (
                  <div key={execution.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">{execution.taskId}</span>
                      <span className={`ml-3 px-2 py-1 rounded text-xs ${
                        execution.status === 'completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : execution.status === 'error'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {execution.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(execution.startTime).toLocaleString()}
                      {execution.duration && ` • ${execution.duration}ms`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduledTasksView;