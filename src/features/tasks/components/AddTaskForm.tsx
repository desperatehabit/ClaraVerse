import React, { useState } from 'react';
import { useTaskStore } from '../state/taskStore';
import Modal from '../../../components/Modal';

const AddTaskForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const {
    createTask,
    selectedProjectId,
    isAddTaskModalOpen,
    closeAddTaskModal,
  } = useTaskStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && selectedProjectId) {
      createTask({
        title: title.trim(),
        description: description.trim(),
        projectId: selectedProjectId,
      });
      setTitle('');
      setDescription('');
      closeAddTaskModal();
    }
  };

  return (
    <Modal showModal={isAddTaskModalOpen} setShowModal={closeAddTaskModal}>
      <form onSubmit={handleSubmit}>
        <h2 className="text-lg font-bold mb-4">Add New Task</h2>
        <div className="mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task Title"
            className="border p-2 rounded w-full"
            disabled={!selectedProjectId}
          />
        </div>
        <div className="mb-4">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Task Description"
            className="border p-2 rounded w-full"
            disabled={!selectedProjectId}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={closeAddTaskModal}
            className="bg-gray-300 text-black p-2 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded"
            disabled={!selectedProjectId || !title.trim()}
          >
            Add Task
          </button>
        </div>
        {!selectedProjectId && (
          <p className="text-red-500 text-xs mt-2">
            Please select a project to add a task.
          </p>
        )}
      </form>
    </Modal>
  );
};

export default AddTaskForm;