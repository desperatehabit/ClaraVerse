import React from 'react';
import { Plus } from 'lucide-react';
import { TaskHeaderProps } from '../types';
import { PersonalProject } from '../types';
import { useTaskStore } from '../state/taskStore';
import VoiceControlButton from '../../../components/common/VoiceControlButton';

interface ExtendedTaskHeaderProps extends TaskHeaderProps {
  selectedProject?: PersonalProject | null;
}

const TaskHeader: React.FC<ExtendedTaskHeaderProps> = ({ selectedProject }) => {
  const openAddTaskModal = useTaskStore((state) => state.openAddTaskModal);
  const getHeaderTitle = () => {
    if (selectedProject) {
      return selectedProject.name;
    }
    return 'All Tasks';
  };

  const getHeaderSubtitle = () => {
    if (selectedProject) {
      return selectedProject.description || `Tasks for ${selectedProject.name}`;
    }
    return 'Manage and organize your personal tasks';
  };

  return (
    <div className="glassmorphic rounded-l-xl p-6 bg-gradient-to-br from-white/20 via-white/10 to-white/5 dark:from-gray-900/40 dark:via-gray-900/30 dark:to-gray-900/20 border border-white/30 dark:border-gray-700/50 shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {getHeaderTitle()}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {getHeaderSubtitle()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <VoiceControlButton
            mode="listen"
            size="md"
            variant="secondary"
            onTranscription={(text) => {
              // Handle voice commands for task management
              const command = text.toLowerCase().trim();
              if (command.includes('new task') || command.includes('create task') || command.includes('add task')) {
                openAddTaskModal();
              } else if (command.includes('show tasks') || command.includes('list tasks') || command.includes('view tasks')) {
                // Could navigate to tasks view or filter
                console.log('Voice command: show tasks');
              }
            }}
            tooltip="Voice commands: 'create task', 'new task', 'show tasks'"
          />

          <button
            className="glassmorphicButton flex items-center gap-2 px-4 py-2 bg-sakura-500/20 dark:bg-sakura-500/30 backdrop-blur-md border border-sakura-300/40 dark:border-sakura-400/50 rounded-lg text-sakura-700 dark:text-sakura-300 font-medium hover:bg-sakura-500/30 dark:hover:bg-sakura-500/40 transition-all duration-300 shadow-sm hover:shadow-md"
            onClick={openAddTaskModal}
            aria-label="Create new task"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskHeader;