import React, { useState } from 'react';
import { useTaskStore } from '../state/taskStore';
import { Plus } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { VoiceInputField } from '../../../components/Clara_Components/VoiceInputField';
import { voiceTaskFeedbackService } from '../../../services/VoiceTaskFeedbackService';

export const QuickAddTask: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const { createTaskFromNLP, loading, error, processVoiceCommand } = useTaskStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    await createTaskFromNLP(inputValue);
    if (!error) {
      setInputValue('');
    }
  };

  const handleVoiceTranscription = async (transcribedText: string) => {
    // For voice input, process with enhanced voice command system
    if (transcribedText.trim()) {
      try {
        // Use the enhanced voice command processor
        const result = await processVoiceCommand(transcribedText);

        if (result.success) {
          // Clear input on successful task creation
          setInputValue('');
        } else {
          // Provide feedback for failed commands
          await voiceTaskFeedbackService.provideImmediateFeedback(
            result.message,
            'error'
          );
        }
      } catch (error) {
        console.error('Voice command processing error:', error);
        await voiceTaskFeedbackService.provideImmediateFeedback(
          'Sorry, I encountered an error processing your voice command.',
          'error'
        );
      }
    }
  };

  return (
    <div className="glassmorphic rounded-xl p-4">
      <form onSubmit={handleSubmit} className="space-y-2">
        <VoiceInputField
          value={inputValue}
          onChange={setInputValue}
          onTranscription={handleVoiceTranscription}
          placeholder="e.g., Review project plan tomorrow at 2pm"
          disabled={loading}
          containerClassName="w-full"
          buttonPosition="right"
          size="md"
          tooltip="Voice input for task creation"
          clearOnTranscription={true}
          inputProps={{
            className: "w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 focus:outline-none focus:border-sakura-300 dark:bg-gray-800/30 dark:border-gray-700/50 dark:text-gray-100 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
          }}
        />

        <div className="flex items-center justify-between gap-2">
          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="glassmorphicButton rounded-lg flex items-center gap-2 px-3 py-2 bg-sakura-500/80 text-white hover:bg-sakura-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <LoadingSpinner size="sm" /> : <Plus className="w-4 h-4" />}
            <span className="text-sm">Add Task</span>
          </button>

          {inputValue.trim() && (
            <button
              type="button"
              onClick={() => setInputValue('')}
              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {error && (
        <p className="mt-2 text-sm text-red-500 dark:text-red-400 bg-red-500/10 p-2 rounded-md">
          {error}
        </p>
      )}
    </div>
  );
};