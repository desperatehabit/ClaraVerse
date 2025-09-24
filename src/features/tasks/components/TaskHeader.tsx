import React from 'react';
import { Plus } from 'lucide-react';
import { TaskHeaderProps } from '../types';

const TaskHeader: React.FC<TaskHeaderProps> = ({ onNewTask }) => {
  return (
    <div className="glassmorphic rounded-l-xl p-6 bg-gradient-to-br from-white/20 via-white/10 to-white/5 dark:from-gray-900/40 dark:via-gray-900/30 dark:to-gray-900/20 border border-white/30 dark:border-gray-700/50 shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            All Tasks
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage and organize your personal tasks
          </p>
        </div>

        <button
          className="glassmorphicButton flex items-center gap-2 px-4 py-2 bg-sakura-500/20 dark:bg-sakura-500/30 backdrop-blur-md border border-sakura-300/40 dark:border-sakura-400/50 rounded-lg text-sakura-700 dark:text-sakura-300 font-medium hover:bg-sakura-500/30 dark:hover:bg-sakura-500/40 transition-all duration-300 shadow-sm hover:shadow-md"
          onClick={onNewTask}
          aria-label="Create new task"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>
    </div>
  );
};

export default TaskHeader;