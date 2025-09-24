// Database model types for personal task management system

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id?: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  parent_task_id?: string;
  subtasks?: Task[];
}

export interface TaskTag {
  id: string;
  name: string;
}

export interface TaskTagRelation {
  task_id: string;
  tag_id: string;
}

// Enums
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';

// Search result types
export interface TaskSearchResult extends Task {
  title_snippet?: string;
  description_snippet?: string;
}

export interface ProjectSearchResult extends Project {
  name_snippet?: string;
  description_snippet?: string;
}

// Filter types
export interface TaskFilters {
  project_id?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  parent_task_id?: string;
}

// Database service interface
export interface PersonalTaskAPI {
  // Project operations
  getProjects(): Promise<Project[]>;
  createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project>;
  deleteProject(id: string): Promise<void>;

  // Task operations
  getTasks(filters?: TaskFilters): Promise<Task[]>;
  createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task>;
  deleteTask(id: string): Promise<void>;

  // Tag operations
  getTags(): Promise<TaskTag[]>;
  createTag(tag: Omit<TaskTag, 'id'>): Promise<TaskTag>;
  updateTag(id: string, updates: Partial<TaskTag>): Promise<TaskTag>;
  deleteTag(id: string): Promise<void>;

  // Task-tag relations
  addTagToTask(taskId: string, tagId: string): Promise<void>;
  removeTagFromTask(taskId: string, tagId: string): Promise<void>;
  getTaskTags(taskId: string): Promise<TaskTag[]>;
  getTasksWithTag(tagId: string): Promise<Task[]>;

  // Search operations
  searchTasks(query: string): Promise<TaskSearchResult[]>;
  searchProjects(query: string): Promise<ProjectSearchResult[]>;

  // Utility operations
  getTaskWithSubtasks(id: string): Promise<Task | null>;
  getStatistics(): Promise<DatabaseStatistics>;
  createBackup(backupPath?: string): Promise<string>;
  restoreFromBackup(backupPath: string): Promise<void>;
  cleanupOldBackups(keepDays?: number): Promise<number>;
}

export interface DatabaseStatistics {
  projects: number;
  tasks: number;
  tags: number;
  completedTasks: number;
  databasePath: string;
  databaseSize: number;
}

// Configuration types
export interface DatabaseConfig {
  dev: DatabaseEnvironmentConfig;
  production: DatabaseEnvironmentConfig;
  test: DatabaseEnvironmentConfig;
}

export interface DatabaseEnvironmentConfig {
  driver: string;
  filename: string;
}

// Error types
export class DatabaseError extends Error {
  public code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
  }
}

export class NotFoundError extends DatabaseError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends DatabaseError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

// Migration types
export interface Migration {
  id: string;
  name: string;
  up: (db: any) => void;
  down: (db: any) => void;
}

// IPC event types (for renderer process)
export interface TaskIPCEvents {
  'tasks:created': (task: Task) => void;
  'tasks:updated': (task: Task) => void;
  'tasks:deleted': (taskId: string) => void;
  'projects:created': (project: Project) => void;
  'projects:updated': (project: Project) => void;
  'projects:deleted': (projectId: string) => void;
  'tags:created': (tag: TaskTag) => void;
  'tags:updated': (tag: TaskTag) => void;
  'tags:deleted': (tagId: string) => void;
}

// AI integration types
export interface TaskCreationResult {
  task: Task;
  subtasks?: Task[];
  confidence: number;
  suggestions?: string[];
}

export interface AIProcessingContext {
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  userPreferences: {
    priority?: TaskPriority;
    project_id?: string;
    tags?: string[];
  };
  systemContext: {
    currentTime: Date;
    activeProjects: Project[];
    recentTasks: Task[];
  };
}

// Export utility functions for type guards
export const isTaskPriority = (value: any): value is TaskPriority => {
  return ['low', 'medium', 'high', 'urgent'].includes(value);
};

export const isTaskStatus = (value: any): value is TaskStatus => {
  return ['todo', 'in_progress', 'completed', 'cancelled'].includes(value);
};

export const validateTask = (task: Partial<Task>): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!task.title || task.title.trim().length === 0) {
    errors.push(new ValidationError('Task title is required', 'title'));
  }

  if (task.priority && !isTaskPriority(task.priority)) {
    errors.push(new ValidationError('Invalid task priority', 'priority'));
  }

  if (task.status && !isTaskStatus(task.status)) {
    errors.push(new ValidationError('Invalid task status', 'status'));
  }

  return errors;
};

export const validateProject = (project: Partial<Project>): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!project.name || project.name.trim().length === 0) {
    errors.push(new ValidationError('Project name is required', 'name'));
  }

  if (project.color && !/^#[0-9A-F]{6}$/i.test(project.color)) {
    errors.push(new ValidationError('Invalid color format (use hex color)', 'color'));
  }

  return errors;
};