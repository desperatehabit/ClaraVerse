import React, { useState } from 'react';
import { TaskView } from '../features/tasks/routes/TaskView';
import ScheduledTasksView from '../features/personal-tasks/ScheduledTasksView';
import AgentsView from '../features/personal-tasks/AgentsView';

interface TasksProps {
  onPageChange: (page: string) => void;
}

type TabType = 'personal' | 'scheduled' | 'agents';

const Tasks: React.FC<TasksProps> = ({ onPageChange }) => {
  const [activeTab, setActiveTab] = useState<TabType>('personal');

  const tabs = [
    { id: 'personal' as TabType, label: 'Personal Tasks', icon: '📝' },
    { id: 'scheduled' as TabType, label: 'Scheduled Tasks', icon: '⏰' },
    { id: 'agents' as TabType, label: 'Agents', icon: '🤖' }
  ];

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-white to-sakura-50 dark:from-gray-900 dark:to-gray-800">
      {/* Tab Navigation */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center gap-2
                  ${
                    activeTab === tab.id
                      ? 'border-sakura-500 text-sakura-600 dark:text-sakura-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === 'personal' && (
          <div className="h-full">
            <TaskView onPageChange={onPageChange} />
          </div>
        )}

        {activeTab === 'scheduled' && (
          <div className="h-full">
            <ScheduledTasksView onPageChange={onPageChange} />
          </div>
        )}

        {activeTab === 'agents' && (
          <div className="h-full">
            <AgentsView onPageChange={onPageChange} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;
