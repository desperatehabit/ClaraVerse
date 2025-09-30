import React, { useState } from 'react';
import { CheckSquare, Square, Clock, AlertCircle, Loader2, Plus, Mic, MicOff } from 'lucide-react';
import { PersonalTask } from '../types';
import TaskDetailModal from './TaskDetailModal';
import { useTaskStore } from '../state/taskStore';
import { Task } from '../../../types/task';
import { formatDateForInput } from '../../../utils/date';
import { VoiceInputButton } from '../../../components/Clara_Components/VoiceInputButton';
import { voiceTaskProcessor } from '../../../services/VoiceTaskProcessor';
import { voiceTaskFeedbackService } from '../../../services/VoiceTaskFeedbackService';

interface TaskListProps {
  tasks: PersonalTask[];
  loading: boolean;
  error: string | null;
  selectedProjectId: string | null;
  onTaskSelect: (id: string) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<PersonalTask>) => void;
  onTaskDelete?: (taskId: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  loading,
  error,
  selectedProjectId,
  onTaskSelect,
  onTaskUpdate,
  onTaskDelete,
}) => {
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isVoiceCommandMode, setIsVoiceCommandMode] = useState(false);
  const { createTask } = useTaskStore();

  const handleSaveNewTask = async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // @ts-ignore
      await createTask({ ...task, projectId: selectedProjectId });
      setIsCreatingTask(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleVoiceCommand = async (transcription: string) => {
    if (!transcription.trim()) return;

    try {
      const result = await voiceTaskProcessor.processVoiceCommand(transcription);

      // Provide visual feedback
      if (result.success) {
        // Refresh tasks if needed
        if (result.action === 'create' || result.action === 'complete' || result.action === 'delete' || result.action === 'update') {
          // The task store will automatically update, but we can trigger a refresh if needed
        }
      }

      // The voiceTaskProcessor will handle audio feedback through the feedback service

    } catch (error) {
      console.error('Voice command processing error:', error);
      await voiceTaskFeedbackService.provideImmediateFeedback(
        'Sorry, I encountered an error processing your voice command.',
        'error'
      );
    }
  };

  // Show loading state
  if (loading) {
  return (
    <div className="flex-1 glassmorphic rounded-r-xl p-8 bg-gradient-to-br from-white/20 via-white/10 to-white/5 dark:from-gray-900/40 dark:via-gray-900/30 dark:to-gray-900/20 border border-white/30 dark:border-gray-700/50 shadow-xl">
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-sakura-500 dark:text-sakura-400 mr-3" />
        <span className="text-gray-700 dark:text-gray-300">Loading tasks...</span>
      </div>
    </div>
  );
}

// Show error state
if (error) {
  return (
    <div className="flex-1 glassmorphic rounded-r-xl p-8 bg-gradient-to-br from-white/20 via-white/10 to-white/5 dark:from-gray-900/40 dark:via-gray-900/30 dark:to-gray-900/20 border border-white/30 dark:border-gray-700/50 shadow-xl">
      <div className="flex items-center justify-center py-12">
        <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400 mr-3" />
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Error Loading Tasks
          </h3>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    </div>
  );
}

const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="w-4 h-4 text-sakura-500 dark:text-sakura-400" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-sakura-400 dark:text-sakura-300" />;
      case 'low':
        return <Clock className="w-4 h-4 text-sakura-300 dark:text-sakura-200" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckSquare className="w-5 h-5 text-sakura-500 dark:text-sakura-400" />;
      case 'in_progress':
        return <Square className="w-5 h-5 text-sakura-400 dark:text-sakura-300" />;
      default:
        return <Square className="w-5 h-5 text-gray-400 dark:text-gray-500" />;
    }
  };

  if (tasks.length === 0) {
    return (
      <>
        <div className="flex-1 glassmorphic rounded-r-xl p-8 bg-gradient-to-br from-white/20 via-white/10 to-white/5 dark:from-gray-900/40 dark:via-gray-900/30 dark:to-gray-900/20 border border-white/30 dark:border-gray-700/50 shadow-xl">
          <div className="text-center py-12">
            <CheckSquare className="w-16 h-16 text-sakura-400/60 dark:text-sakura-300/60 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              {selectedProjectId
                ? 'No tasks found'
                : 'Select a project to get started'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {selectedProjectId
                ? "This project doesn't have any tasks yet. Create your first task to get started!"
                : 'Choose a project from the sidebar to view and manage its tasks, or select "All Tasks" to see everything.'}
            </p>
            {selectedProjectId && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setIsCreatingTask(true)}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-sakura-500 hover:bg-sakura-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sakura-500"
                >
                  <Plus className="-ml-1 mr-3 h-5 w-5" />
                  New Task
                </button>
              </div>
            )}
          </div>
        </div>
        {isCreatingTask && (
          <TaskDetailModal
            onClose={() => setIsCreatingTask(false)}
            onSave={handleSaveNewTask}
            projectId={selectedProjectId}
          />
        )}
      </>
    );
  }

  return (
    <div className="flex-1 glassmorphic rounded-r-xl p-6 bg-gradient-to-br from-white/15 via-white/10 to-white/5 dark:from-gray-900/35 dark:via-gray-900/25 dark:to-gray-900/15 border border-white/25 dark:border-gray-700/40 shadow-lg">
      {/* Voice Command Section */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tasks</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {isVoiceCommandMode ? 'Voice commands enabled' : 'Voice commands available'}
          </span>
          <VoiceInputButton
            onTranscription={handleVoiceCommand}
            onRecordingStart={() => setIsVoiceCommandMode(true)}
            onRecordingEnd={() => setIsVoiceCommandMode(false)}
            size="sm"
            tooltip="Voice commands for task management"
            className="bg-sakura-100 dark:bg-sakura-900/30 text-sakura-600 dark:text-sakura-400 hover:bg-sakura-200 dark:hover:bg-sakura-900/50"
          />
        </div>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="glassmorphic rounded-lg p-4 border border-white/30 dark:border-gray-600/40 hover:border-sakura-300/50 dark:hover:border-sakura-400/30 bg-white/20 dark:bg-gray-800/25 hover:bg-white/30 dark:hover:bg-gray-800/35 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
            onClick={() => onTaskSelect(task.id)}
          >
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskUpdate?.(task.id, {
                      status: task.status === 'completed' ? 'todo' : 'completed'
                    });
                  }}
                  className="mt-0.5"
                >
                  {getStatusIcon(task.status)}
                </button>

                {/* Voice command button for individual task */}
                <VoiceInputButton
                  onTranscription={async (command) => {
                    if (!command.trim()) return;
                    const fullCommand = `${task.status === 'completed' ? 'reopen' : 'complete'} ${task.title}`;
                    await handleVoiceCommand(fullCommand);
                  }}
                  size="sm"
                  tooltip={`Voice commands for "${task.title}"`}
                  className="opacity-60 hover:opacity-100 transition-opacity"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-medium text-gray-900 dark:text-white ${
                    task.status === 'completed' ? 'line-through text-gray-500' : ''
                  }`}>
                    {task.title}
                  </h3>
                  {getPriorityIcon(task.priority)}
                </div>

                {task.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {task.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="capitalize">{task.status.replace('_', ' ')}</span>
                  <span>Priority: {task.priority}</span>
                  <span>
                    {task.due_date ? formatDateForInput(task.due_date) : 'No due date'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskList;