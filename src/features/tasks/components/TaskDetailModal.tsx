import React, { useState, useEffect } from 'react';
import { Task } from '../../../types/task';
import { formatDateForInput } from '../../../utils/date';
import { X } from 'lucide-react';
import { VoiceInputField } from '../../../components/Clara_Components/VoiceInputField';

interface TaskDetailModalProps {
  task?: Task;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>, id?: string) => void;
  onDelete?: (id: string) => void;
  projectId?: string | null;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose, onSave, onDelete, projectId }) => {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState(task?.priority || 'Medium');
  const [status, setStatus] = useState(task?.status || 'To-do');
  const [dueDate, setDueDate] = useState(task?.due_date ? formatDateForInput(task.due_date) : '');

  useEffect(() => {
    setTitle(task?.title || '');
    setDescription(task?.description || '');
    setPriority(task?.priority || 'Medium');
    setStatus(task?.status || 'To-do');
    if (task?.due_date) {
      setDueDate(formatDateForInput(task.due_date));
    } else {
      setDueDate('');
    }
  }, [task]);

  const handleSave = () => {
    onSave({
      title,
      description,
      priority,
      status,
      due_date: dueDate,
      projectId: task?.projectId || projectId || undefined,
    }, task?.id);
  };

  const handleDelete = () => {
    if (task && onDelete && window.confirm('Are you sure you want to delete this task?')) {
      onDelete(String(task.id));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white/10 dark:bg-gray-900/30 backdrop-blur-lg border border-white/20 dark:border-gray-700/50 shadow-lg rounded-xl p-6 w-full max-w-md text-gray-900 dark:text-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{task ? 'Edit Task' : 'Create Task'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
            <X size={24} />
          </button>
        </div>
        <form>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <VoiceInputField
              value={title}
              onChange={setTitle}
              placeholder="Enter task title..."
              clearOnTranscription={false}
              focusAfterTranscription={true}
              containerClassName="w-full"
              buttonPosition="overlay"
              size="sm"
              tooltip="Voice input for task title"
              inputProps={{
                id: "title",
                className: "w-full px-4 py-2 rounded-lg bg-white/50 border border-gray-200 focus:outline-none focus:border-sakura-300 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-100 transition-colors"
              }}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <VoiceInputField
              value={description || ''}
              onChange={(value) => setDescription(value)}
              placeholder="Enter task description..."
              multiline={true}
              clearOnTranscription={false}
              focusAfterTranscription={true}
              containerClassName="w-full"
              buttonPosition="overlay"
              size="sm"
              tooltip="Voice input for task description"
              textareaProps={{
                id: "description",
                rows: 4,
                className: "w-full px-4 py-2 rounded-lg bg-white/50 border border-gray-200 focus:outline-none focus:border-sakura-300 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-100 transition-colors resize-none"
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task['priority'])}
                className="w-full px-4 py-2 rounded-lg bg-white/50 border border-gray-200 focus:outline-none focus:border-sakura-300 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-100"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as Task['status'])}
                className="w-full px-4 py-2 rounded-lg bg-white/50 border border-gray-200 focus:outline-none focus:border-sakura-300 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-100"
              >
                <option value="To-do">To-do</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="mb-6">
            <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
            <input
              type="date"
              id="due_date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/50 border border-gray-200 focus:outline-none focus:border-sakura-300 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-100 transition-colors"
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">Cancel</button>
            {task && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            )}
            <button type="button" onClick={handleSave} className="px-4 py-2 bg-sakura-500 text-white rounded-lg hover:bg-sakura-600">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskDetailModal;