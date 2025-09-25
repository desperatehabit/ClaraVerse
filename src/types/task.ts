export interface Task {
  id: number;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'To-do' | 'In Progress' | 'Completed' | 'Cancelled';
  due_date?: string;
  projectId?: number;
}