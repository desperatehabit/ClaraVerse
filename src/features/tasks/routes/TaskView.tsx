import React, { useEffect, useState } from 'react';
import ProjectSidebar from '../components/ProjectSidebar';
import TaskHeader from '../components/TaskHeader';
import TaskList from '../components/TaskList';
import AddTaskForm from '../components/AddTaskForm';
import { useTaskStore } from '../state/taskStore';
import TaskDetailModal from '../components/TaskDetailModal';
import { Task } from '../../../types/task';
import { PersonalTask } from '../types';

// Helper function to convert PersonalTask to Task
const toTask = (personalTask: PersonalTask): Task => ({
  id: Number(personalTask.id), // Convert id to number
  title: personalTask.title,
  description: personalTask.description,
  priority: personalTask.priority.charAt(0).toUpperCase() + personalTask.priority.slice(1) as 'Low' | 'Medium' | 'High' | 'Urgent',
  status: personalTask.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) as 'To-do' | 'In Progress' | 'Completed' | 'Cancelled',
  due_date: personalTask.due_date,
  projectId: personalTask.project_id ? Number(personalTask.project_id) : undefined,
});

// Helper function to convert Task back to Partial<PersonalTask> for updating
const fromTask = (task: Task): Partial<PersonalTask> => ({
  title: task.title,
  description: task.description,
  priority: task.priority.toLowerCase() as 'low' | 'medium' | 'high' | 'urgent',
  status: task.status.toLowerCase().replace(' ', '_') as 'todo' | 'in_progress' | 'completed' | 'cancelled',
  due_date: task.due_date,
});


export const TaskView: React.FC = () => {
  const {
    tasks,
    projects,
    selectedProjectId,
    loading,
    error: storeError,
    fetchTasks,
    updateTask,
  } = useTaskStore();
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleSaveTask = async (updatedTask: Task) => {
    if (!editingTaskId) return;
    setError(null);
    try {
      await updateTask(editingTaskId, fromTask(updatedTask));
      setEditingTaskId(null);
    } catch (err) {
      setError('Failed to save changes.');
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <ProjectSidebar />
      <div className="flex-1 flex flex-col">
        <TaskHeader
          selectedProject={selectedProject}
        />
        <TaskList
          tasks={filteredTasks}
          loading={loading}
          error={storeError}
          selectedProjectId={selectedProjectId}
          onTaskSelect={setEditingTaskId}
        />
        <AddTaskForm />
      </div>
      {editingTask && (
        <TaskDetailModal
          task={toTask(editingTask)}
          onClose={() => {
            setEditingTaskId(null);
            setError(null);
          }}
          onSave={handleSaveTask}
          error={error || undefined}
        />
      )}
    </div>
  );
};