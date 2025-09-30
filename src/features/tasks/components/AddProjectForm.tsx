import React, { useState } from 'react';
import { useTaskStore } from '../state/taskStore';
import Modal from '../../../components/Modal';
import { VoiceInputField } from '../../../components/Clara_Components/VoiceInputField';

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

  const handleVoiceTranscription = (transcribedText: string) => {
    // For voice input, automatically create the project
    if (transcribedText.trim()) {
      createProject(transcribedText.trim());
      setName('');
      closeAddProjectModal();
    }
  };

  return (
    <Modal showModal={isAddProjectModalOpen} setShowModal={closeAddProjectModal}>
      <form onSubmit={handleSubmit}>
        <h2 className="text-lg font-bold mb-4">Add New Project</h2>

        <div className="mb-4">
          <VoiceInputField
            value={name}
            onChange={setName}
            onTranscription={handleVoiceTranscription}
            placeholder="Project Name"
            clearOnTranscription={true}
            containerClassName="w-full"
            buttonPosition="overlay"
            size="md"
            tooltip="Voice input for project name"
            inputProps={{
              className: "border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            }}
          />
        </div>

        <div className="flex justify-between items-center gap-2">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {name.trim() ? (
              <span className="text-green-600 dark:text-green-400">Ready to create project</span>
            ) : (
              <span>Say or type a project name</span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={closeAddProjectModal}
              className="bg-gray-300 dark:bg-gray-700 text-black dark:text-gray-200 p-2 rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={!name.trim()}
            >
              Create Project
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AddProjectForm;