import { create } from 'zustand';
import { PersonalProject, PersonalTask } from '../types';
import { voiceTaskProcessor, VoiceTaskResult } from '../../../services/VoiceTaskProcessor';
import { voiceTaskFeedbackService } from '../../../services/VoiceTaskFeedbackService';

// API response types
interface APIResponse<T> {
  success: boolean;
  data?: T[];
  projects?: PersonalProject[];
  tasks?: PersonalTask[];
  error?: string;
}

// State interface
interface TaskState {
  projects: PersonalProject[];
  tasks: PersonalTask[];
  loading: boolean;
  error: string | null;
  selectedProjectId: string | null;
  isAddProjectModalOpen: boolean;
  isAddTaskModalOpen: boolean;
}

// Store interface with actions
interface TaskActions {
  fetchProjects: () => Promise<void>;
  fetchTasks: (projectId?: string) => Promise<void>;
  selectProject: (projectId: string | null) => void;
  clearError: () => void;
  createProject: (name: string) => Promise<void>;
  createTask: (task: Omit<PersonalTask, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<PersonalTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  createTaskFromNLP: (input: string) => Promise<void>;
  processVoiceCommand: (command: string) => Promise<VoiceTaskResult>;
  announceTaskChange: (action: 'created' | 'updated' | 'completed' | 'deleted', task: PersonalTask, project?: PersonalProject) => Promise<void>;
  announceProjectChange: (action: 'created' | 'selected' | 'changed', project: PersonalProject) => Promise<void>;
  openAddProjectModal: () => void;
  closeAddProjectModal: () => void;
  openAddTaskModal: () => void;
  closeAddTaskModal: () => void;
}

// Combined store type
type TaskStore = TaskState & TaskActions;

// Create the Zustand store
export const useTaskStore = create<TaskStore>((set, get) => ({
  // Initial state
  projects: [],
  tasks: [],
  loading: false,
  error: null,
  selectedProjectId: null,
  isAddProjectModalOpen: false,
  isAddTaskModalOpen: false,

  // Actions
  fetchProjects: async () => {
    console.log('[taskStore.ts] fetchProjects: Initiating project fetch.');
    set({ loading: true, error: null });

    try {
      const response = await window.taskManager.getProjects();
      console.log('[taskStore.ts] fetchProjects: Received response', response);
      if (!response.success) {
        throw new Error('Failed to fetch projects');
      }
      set({ projects: Array.isArray(response.data) ? response.data : [], loading: false });
      console.log('[taskStore.ts] fetchProjects: Successfully updated state with projects.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch projects';
      console.error('[taskStore.ts] fetchProjects: Error fetching projects', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  fetchTasks: async (projectId?: string) => {
    console.log('[taskStore.ts] fetchTasks: Initiating task fetch.');
    set({ loading: true, error: null });

    try {
      const response = await window.taskManager.getTasks(projectId);
      console.log('[taskStore.ts] fetchTasks: Received response', response);
      if (!response.success) {
        throw new Error('Failed to fetch tasks');
      }
      set({ tasks: Array.isArray(response.data) ? response.data : [], loading: false });
      console.log('[taskStore.ts] fetchTasks: Successfully updated state with tasks.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tasks';
      console.error('[taskStore.ts] fetchTasks: Error fetching tasks', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  selectProject: (projectId: string | null) => {
    set({ selectedProjectId: projectId });
  },

  clearError: () => {
    set({ error: null });
  },

  createProject: async (name: string) => {
    console.log('[taskStore.ts] createProject: Initiating project creation.');
    set({ loading: true, error: null });

    try {
      const response = await window.personalTaskAPI.createProject({ name });
      console.log('[taskStore.ts] createProject: Received response', response);
      if (!response.success) {
        throw new Error('Failed to create project');
      }
      // Refresh the project list
      get().fetchProjects();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
      console.error('[taskStore.ts] createProject: Error creating project', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  createTask: async (task: Omit<PersonalTask, 'id' | 'created_at' | 'updated_at'>) => {
    console.log('[taskStore.ts] createTask: Initiating task creation.');
    set({ loading: true, error: null });

    try {
      // @ts-ignore
      const response = await window.personalTaskAPI.createTask(task);
      console.log('[taskStore.ts] createTask: Received response', response);
      if (!response.success) {
        throw new Error('Failed to create task');
      }
      // Refresh the task list for the current project
      get().fetchTasks(task.project_id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
      console.error('[taskStore.ts] createTask: Error creating task', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  updateTask: async (id: string, updates: Partial<PersonalTask>) => {
    console.log(`[taskStore.ts] updateTask: Initiating task update for id: ${id}.`);
    try {
      const response = await window.personalTaskAPI.updateTask(id, updates);
      console.log(`[taskStore.ts] updateTask: Successfully updated task on the backend.`);
      if (response.success) {
        const projectId = get().selectedProjectId;
        get().fetchTasks(projectId ? projectId : undefined);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update task';
      console.error('[taskStore.ts] updateTask: Error updating task', errorMessage);
      throw error;
    }
  },

  deleteTask: async (id: string) => {
    console.log(`[taskStore.ts] deleteTask: Initiating task deletion for id: ${id}.`);
    try {
      await window.personalTaskAPI.deleteTask(id);
      console.log(`[taskStore.ts] deleteTask: Successfully deleted task on the backend.`);
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
      }));
      console.log(`[taskStore.ts] deleteTask: Successfully removed task from local state.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
      console.error('[taskStore.ts] deleteTask: Error deleting task', errorMessage);
      throw error;
    }
  },

  createTaskFromNLP: async (input: string) => {
    console.log('[taskStore.ts] createTaskFromNLP: Processing natural language input.');
    set({ loading: true, error: null });

    try {
      // @ts-ignore
      const nlpResponse = await window.personalTaskAPI.processNaturalLanguageTask(input);
      console.log('[taskStore.ts] createTaskFromNLP: Received NLP response', nlpResponse);

      if (!nlpResponse || !nlpResponse.title) {
        throw new Error('Failed to parse task from input.');
      }

      const selectedProjectId = get().selectedProjectId;
      const taskToCreate = {
        ...nlpResponse,
        project_id: selectedProjectId,
      };

      // @ts-ignore
      await get().createTask(taskToCreate);
      console.log('[taskStore.ts] createTaskFromNLP: Task created successfully from NLP input.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create task from natural language';
      console.error('[taskStore.ts] createTaskFromNLP: Error', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  processVoiceCommand: async (command: string): Promise<VoiceTaskResult> => {
    console.log('[taskStore.ts] processVoiceCommand: Processing voice command:', command);

    try {
      const result = await voiceTaskProcessor.processVoiceCommand(command);

      // Announce the result if successful
      if (result.success && result.task) {
        await get().announceTaskChange(
          result.action === 'create' ? 'created' :
          result.action === 'complete' ? 'completed' :
          result.action === 'delete' ? 'deleted' : 'updated',
          result.task,
          result.project
        );
      } else if (result.success && result.project) {
        await get().announceProjectChange(
          result.action === 'create_project' ? 'created' : 'selected',
          result.project
        );
      }

      // Refresh tasks after successful operations
      if (result.success && (result.action === 'create' || result.action === 'complete' || result.action === 'delete' || result.action === 'update')) {
        const selectedProjectId = get().selectedProjectId;
        get().fetchTasks(selectedProjectId ? selectedProjectId : undefined);
      }

      // Refresh projects after project operations
      if (result.success && (result.action === 'create_project' || result.action === 'show_project')) {
        get().fetchProjects();
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Voice command processing failed';
      console.error('[taskStore.ts] processVoiceCommand: Error', errorMessage);

      const errorResult: VoiceTaskResult = {
        success: false,
        message: errorMessage,
        error: errorMessage,
      };

      return errorResult;
    }
  },

  announceTaskChange: async (action: 'created' | 'updated' | 'completed' | 'deleted', task: PersonalTask, project?: PersonalProject) => {
    console.log('[taskStore.ts] announceTaskChange:', action, task.title);

    try {
      // Find the project if not provided
      let targetProject = project;
      if (!targetProject) {
        targetProject = get().projects.find(p => p.id === task.project_id);
      }

      // Announce the change
      await voiceTaskFeedbackService.announceTaskChange(action, task, targetProject);
    } catch (error) {
      console.error('[taskStore.ts] announceTaskChange: Error', error);
    }
  },

  announceProjectChange: async (action: 'created' | 'selected' | 'changed', project: PersonalProject) => {
    console.log('[taskStore.ts] announceProjectChange:', action, project.name);

    try {
      await voiceTaskFeedbackService.announceProjectChange(action, project);
    } catch (error) {
      console.error('[taskStore.ts] announceProjectChange: Error', error);
    }
  },

  openAddProjectModal: () => set({ isAddProjectModalOpen: true }),
  closeAddProjectModal: () => set({ isAddProjectModalOpen: false }),
  openAddTaskModal: () => set({ isAddTaskModalOpen: true }),
  closeAddTaskModal: () => set({ isAddTaskModalOpen: false }),
}));