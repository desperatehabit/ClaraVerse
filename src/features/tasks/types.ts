// TypeScript interfaces for tasks feature

export interface PersonalTask {
  id: string;
  project_id?: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  parent_task_id?: string;
}

export interface PersonalProject {
  id: string;
  name: string;
  description?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskViewProps {
  onPageChange: (page: string) => void;
}

export interface TaskHeaderProps {
  onNewTask?: () => void;
}

export interface ProjectSidebarProps {
  projects: PersonalProject[];
  selectedProjectId?: string;
  onProjectSelect?: (projectId: string) => void;
}

export interface TaskListProps {
  tasks: PersonalTask[];
  onTaskSelect?: (taskId: string) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<PersonalTask>) => void;
  onTaskDelete?: (taskId: string) => void;
}

export interface TaskViewState {
  projects: PersonalProject[];
  tasks: PersonalTask[];
  selectedProjectId?: string;
  loading: boolean;
  error?: string;
}