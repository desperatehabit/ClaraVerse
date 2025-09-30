import React, { useEffect, useState } from 'react';
import ProjectSidebar from '../components/ProjectSidebar';
import TaskHeader from '../components/TaskHeader';
import TaskList from '../components/TaskList';
import { QuickAddTask } from '../components/QuickAddTask';
import { useTaskStore } from '../state/taskStore';
import TaskDetailModal from '../components/TaskDetailModal';
import { Task } from '../../../types/task';
import { PersonalTask } from '../types';

// Helper function to convert PersonalTask to Task
const toTask = (personalTask: PersonalTask): Task => ({
  id: personalTask.id,
  title: personalTask.title,
  description: personalTask.description,
  priority: personalTask.priority.charAt(0).toUpperCase() + personalTask.priority.slice(1) as 'Low' | 'Medium' | 'High' | 'Urgent',
  status: personalTask.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) as 'To-do' | 'In Progress' | 'Completed' | 'Cancelled',
  due_date: personalTask.due_date,
  projectId: personalTask.project_id,
});

// Helper function to convert Task to PersonalTask
const fromTask = (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>, selectedProjectId: string | null): Omit<PersonalTask, 'id' | 'created_at' | 'updated_at'> => ({
  title: task.title,
  description: task.description,
  priority: task.priority.toLowerCase() as 'low' | 'medium' | 'high' | 'urgent',
  status: task.status.replace(' ', '_').toLowerCase() as 'todo' | 'in_progress' | 'completed' | 'cancelled',
  due_date: task.due_date || undefined,
  project_id: task.projectId || selectedProjectId || undefined,
});

export const TaskView: React.FC = () => {
  const {
    tasks,
    projects,
    selectedProjectId,
    loading,
    error: storeError,
    fetchTasks,
    deleteTask,
    createTask,
    updateTask,
    isAddTaskModalOpen,
    closeAddTaskModal,
  } = useTaskStore();
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = selectedProjectId
    ? tasks.filter((task) => task.project_id === selectedProjectId)
    : tasks;

  const selectedProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)
    : null;

  const editingTask = editingTaskId
    ? tasks.find((t) => t.id === editingTaskId)
    : null;

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setEditingTaskId(null);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleCreateTask = async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await createTask(fromTask(task, selectedProjectId));
      setEditingTaskId(null);
      closeAddTaskModal();
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleUpdateTask = async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>, id?: string) => {
    try {
      if (id) {
        await updateTask(id, fromTask(task, selectedProjectId));
      }
      setEditingTaskId(null);
      closeAddTaskModal();
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <ProjectSidebar />
      <div className="flex-1 flex flex-col">
        <TaskHeader
          selectedProject={selectedProject}
        />
        <div className="p-4">
          <QuickAddTask />
        </div>
        <TaskList
          tasks={filteredTasks}
          loading={loading}
          error={storeError}
          selectedProjectId={selectedProjectId}
          onTaskSelect={setEditingTaskId}
        />
      </div>
      {editingTask && (
        <TaskDetailModal
          task={toTask(editingTask)}
          onClose={() => setEditingTaskId(null)}
          onSave={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      )}
      {isAddTaskModalOpen && (
        <TaskDetailModal
          onClose={closeAddTaskModal}
          onSave={handleCreateTask}
          projectId={selectedProjectId}
        />
      )}
    </div>
  );
};