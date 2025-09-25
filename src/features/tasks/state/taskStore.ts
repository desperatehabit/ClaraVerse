import { create } from 'zustand';
import { PersonalProject, PersonalTask } from '../types';

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
  createTask: (task: { title: string; description: string; projectId: string }) => Promise<void>;
  updateTask: (id: string, updates: Partial<PersonalTask>) => Promise<void>;
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

  createTask: async (task: { title: string; description: string; projectId: string }) => {
    console.log('[taskStore.ts] createTask: Initiating task creation.');
    set({ loading: true, error: null });

    try {
      const response = await window.personalTaskAPI.createTask(task);
      console.log('[taskStore.ts] createTask: Received response', response);
      if (!response.success) {
        throw new Error('Failed to create task');
      }
      // Refresh the task list for the current project
      get().fetchTasks(task.projectId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
      console.error('[taskStore.ts] createTask: Error creating task', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  updateTask: async (id: string, updates: Partial<PersonalTask>) => {
    console.log(`[taskStore.ts] updateTask: Initiating task update for id: ${id}.`);
    try {
      await window.personalTaskAPI.updateTask(id, updates);
      console.log(`[taskStore.ts] updateTask: Successfully updated task on the backend.`);
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? { ...task, ...updates } : task
        ),
      }));
      console.log(`[taskStore.ts] updateTask: Successfully updated local state.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update task';
      console.error('[taskStore.ts] updateTask: Error updating task', errorMessage);
      throw error;
    }
  },

  openAddProjectModal: () => set({ isAddProjectModalOpen: true }),
  closeAddProjectModal: () => set({ isAddProjectModalOpen: false }),
  openAddTaskModal: () => set({ isAddTaskModalOpen: true }),
  closeAddTaskModal: () => set({ isAddTaskModalOpen: false }),
}));