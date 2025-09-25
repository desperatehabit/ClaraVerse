import { ElectronAPI } from './electron';

export interface TaskManagerAPI {
  getProjects: () => Promise<{ success: boolean; data: any[] }>;
  createProject: (projectData: any) => Promise<{ success: boolean; data: any }>;
  updateProject: (projectId: string, updates: any) => Promise<{ success: boolean; data: any }>;
  deleteProject: (projectId: string) => Promise<{ success: boolean; data: any }>;
  getTasks: (projectId?: string) => Promise<{ success: boolean; data: any[] }>;
  getAllTasks: () => Promise<{ success: boolean; data: any[] }>;
  createTask: (taskData: any) => Promise<{ success: boolean; data: any }>;
  updateTask: (taskId: string, updates: any) => Promise<{ success: boolean; data: any }>;
  deleteTask: (taskId: string) => Promise<{ success: boolean; data: any }>;
  getTaskById: (taskId: string) => Promise<{ success: boolean; data: any }>;
  processNaturalLanguageTask: (text: string, projectId?: string) => Promise<any>;
  breakdownTask: (taskId: string, options: any) => Promise<any>;
  onTaskCreated: (callback: (data: any) => void) => void;
  onTaskUpdated: (callback: (data: any) => void) => void;
  onTaskDeleted: (callback: (data: any) => void) => void;
  onProjectCreated: (callback: (data: any) => void) => void;
  onProjectUpdated: (callback: (data: any) => void) => void;
  onProjectDeleted: (callback: (data: any) => void) => void;
  onAITaskProcessed: (callback: (data: any) => void) => void;
  onTaskBreakdownComplete: (callback: (data: any) => void) => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    taskManager: TaskManagerAPI;
    personalTaskAPI: TaskManagerAPI; // deprecated but kept for backward compatibility
  }
}

export {}; 