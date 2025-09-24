import React, { useEffect } from 'react';
import { FolderOpen, Loader2, AlertCircle } from 'lucide-react';
import { useTaskStore } from '../state/taskStore';
import { PersonalProject } from '../types';

interface ProjectSidebarProps {
  projects?: PersonalProject[];
  selectedProjectId?: string;
  onProjectSelect?: (projectId: string) => void;
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  projects: propProjects,
  selectedProjectId: propSelectedProjectId,
  onProjectSelect
}) => {
  console.log('ProjectSidebar: Component rendered');

  const {
    projects: storeProjects,
    selectedProjectId: storeSelectedProjectId,
    fetchProjects,
    selectProject,
    loading,
    error
  } = useTaskStore();

  // Use prop values if provided, otherwise use store values
  const projects = propProjects || storeProjects;
  const selectedProjectId = propSelectedProjectId !== undefined ? propSelectedProjectId : storeSelectedProjectId;

  console.log('ProjectSidebar: Props', { propProjects, propSelectedProjectId });
  console.log('ProjectSidebar: Store state', { storeProjects, storeSelectedProjectId, loading, error });
  console.log('ProjectSidebar: Derived state', { projects, selectedProjectId });

  // Fetch projects on component mount
  useEffect(() => {
    console.log('ProjectSidebar: useEffect triggered, calling fetchProjects');
    fetchProjects();
  }, []);

  const handleProjectSelect = (projectId: string | null) => {
    if (onProjectSelect) {
      onProjectSelect(projectId || '');
    } else {
      selectProject(projectId);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="w-64 bg-white/10 dark:bg-gray-900/30 backdrop-blur-lg border-r border-white/20 dark:border-gray-700/50 rounded-l-xl">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Projects
          </h2>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">Loading projects...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="w-64 bg-white/10 dark:bg-gray-900/30 backdrop-blur-lg border-r border-white/20 dark:border-gray-700/50 rounded-l-xl">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Projects
          </h2>
          <div className="flex items-center gap-2 py-4 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">Error: {error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white/10 dark:bg-gray-900/30 backdrop-blur-lg border-r border-white/20 dark:border-gray-700/50 rounded-l-xl">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Projects
        </h2>

        <div className="space-y-2">
          {/* All Tasks option */}
          <div
            className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
              selectedProjectId === null
                ? 'bg-lightblue/60 text-blue-700 dark:bg-lightblue/30 dark:text-blue-300 shadow-lg shadow-blue-200/30 dark:shadow-blue-900/20'
                : 'hover:bg-white/20 dark:hover:bg-gray-800/30 text-gray-700 dark:text-gray-300 hover:shadow-md hover:shadow-white/10'
            }`}
            onClick={() => handleProjectSelect(null)}
          >
            <div className={`p-1 rounded-md transition-colors ${
              selectedProjectId === null
                ? 'bg-blue-200/60 dark:bg-blue-800/40'
                : 'bg-white/30 dark:bg-gray-700/30 group-hover:bg-white/40 dark:group-hover:bg-gray-700/40'
            }`}>
              <FolderOpen className="w-5 h-5 flex-shrink-0" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-medium block truncate">
                All Tasks
              </span>
              {selectedProjectId === null && (
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  Showing All
                </span>
              )}
            </div>
          </div>

          {/* Dynamic projects list */}
          {projects.map((project: PersonalProject) => (
            <div
              key={project.id}
              className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                selectedProjectId === project.id
                  ? 'bg-lightblue/60 text-blue-700 dark:bg-lightblue/30 dark:text-blue-300 shadow-lg shadow-blue-200/30 dark:shadow-blue-900/20'
                  : 'hover:bg-white/20 dark:hover:bg-gray-800/30 text-gray-700 dark:text-gray-300 hover:shadow-md hover:shadow-white/10'
              }`}
              onClick={() => handleProjectSelect(project.id)}
            >
              <div className={`p-1 rounded-md transition-colors ${
                selectedProjectId === project.id
                  ? 'bg-blue-200/60 dark:bg-blue-800/40'
                  : 'bg-white/30 dark:bg-gray-700/30 group-hover:bg-white/40 dark:group-hover:bg-gray-700/40'
              }`}>
                <FolderOpen className="w-5 h-5 flex-shrink-0" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium block truncate">
                  {project.name}
                </span>
                {selectedProjectId === project.id && (
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    Active Project
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectSidebar;