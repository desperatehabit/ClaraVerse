import { create } from 'zustand';
import { PersonalProject, PersonalTask } from '../types';

// API response types
interface APIResponse<T> {
  success: boolean;
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
}

// Store interface with actions
interface TaskActions {
  fetchProjects: () => Promise<void>;
  fetchTasks: () => Promise<void>;
  selectProject: (projectId: string | null) => void;
  clearError: () => void;
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

  // Actions
  fetchProjects: async () => {
    console.log('[taskStore.ts] fetchProjects: Initiating project fetch.');
    set({ loading: true, error: null });

    try {
      const response: APIResponse<PersonalProject> = await window.personalTaskAPI.getProjects();
      console.log('[taskStore.ts] fetchProjects: Received response', response);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch projects');
      }
      set({ projects: response.projects || [], loading: false });
      console.log('[taskStore.ts] fetchProjects: Successfully updated state with projects.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch projects';
      console.error('[taskStore.ts] fetchProjects: Error fetching projects', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  fetchTasks: async () => {
    console.log('[taskStore.ts] fetchTasks: Initiating task fetch.');
    set({ loading: true, error: null });

    try {
      const response: APIResponse<PersonalTask> = await window.personalTaskAPI.getTasks();
      console.log('[taskStore.ts] fetchTasks: Received response', response);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch tasks');
      }
      set({ tasks: response.tasks || [], loading: false });
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
}));