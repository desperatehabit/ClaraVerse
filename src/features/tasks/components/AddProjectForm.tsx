import React, { useState } from 'react';
import { useTaskStore } from '../state/taskStore';
import Modal from '../../../components/Modal';

const AddProjectForm: React.FC = () => {
  const [name, setName] = useState('');
  const { createProject, isAddProjectModalOpen, closeAddProjectModal } = useTaskStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      createProject(name.trim());
      setName('');
      closeAddProjectModal();
    }
  };

  return (
    <Modal showModal={isAddProjectModalOpen} setShowModal={closeAddProjectModal}>
      <form onSubmit={handleSubmit}>
        <h2 className="text-lg font-bold mb-4">Add New Project</h2>
        <div className="mb-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Project Name"
            className="border p-2 rounded w-full"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={closeAddProjectModal}
            className="bg-gray-300 text-black p-2 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded"
            disabled={!name.trim()}
          >
            Create Project
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddProjectForm;