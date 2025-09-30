import { voiceTaskCommandService, VoiceCommandResult } from './VoiceTaskCommandService';
import { useTaskStore } from '../features/tasks/state/taskStore';
import { PersonalTask, PersonalProject } from '../features/tasks/types';

export interface VoiceTaskResult {
  success: boolean;
  message: string;
  action?: string;
  task?: PersonalTask;
  project?: PersonalProject;
  error?: string;
}

export interface VoiceTaskProcessorOptions {
  announceResults?: boolean;
  autoCreateProject?: boolean;
}

/**
 * Voice command processor that executes parsed voice commands
 * Handles all task operations through voice commands
 */
export class VoiceTaskProcessor {
  private options: VoiceTaskProcessorOptions;

  constructor(options: VoiceTaskProcessorOptions = {}) {
    this.options = {
      announceResults: true,
      autoCreateProject: true,
      ...options,
    };
  }

  /**
   * Get the current task store state (lazy initialization to avoid circular dependency)
   */
  private get taskStore() {
    return useTaskStore.getState();
  }

  /**
   * Subscribe to store changes
   */
  private subscribeToStoreChanges(): void {
    useTaskStore.subscribe((state) => {
      // Store subscription active - this ensures the store is available
    });
  }

  /**
   * Initialize store subscription (call this when the processor is first used)
   */
  private initializeStoreSubscription(): void {
    // Subscribe to store changes to ensure the store is properly initialized
    this.subscribeToStoreChanges();
  }

  /**
    * Process a voice command and execute the appropriate action
    */
   async processVoiceCommand(command: string): Promise<VoiceTaskResult> {
     try {
       // Initialize store subscription on first use to avoid circular dependency
       this.initializeStoreSubscription();

       // Parse the command
       const parsedCommand = voiceTaskCommandService.parseCommand(command);

      if (parsedCommand.confidence < 0.4) {
        return {
          success: false,
          message: "I'm sorry, I didn't understand that command. Try saying 'help' for voice command examples.",
          error: 'Low confidence parsing',
        };
      }

      // Execute the action
      const result = await this.executeCommand(parsedCommand);

      // Announce the result if enabled
      if (this.options.announceResults && result.success) {
        this.announceResult(result);
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Sorry, there was an error processing your command: ${errorMessage}`,
        error: errorMessage,
      };
    }
  }

  /**
   * Execute a parsed voice command
   */
  private async executeCommand(parsedCommand: VoiceCommandResult): Promise<VoiceTaskResult> {
    const { action, parameters } = parsedCommand;

    switch (action) {
      case 'create':
        return await this.handleCreateTask(parameters);

      case 'complete':
        return await this.handleCompleteTask(parameters);

      case 'update':
        return await this.handleUpdateTask(parameters);

      case 'delete':
        return await this.handleDeleteTask(parameters);

      case 'create_project':
        return await this.handleCreateProject(parameters);

      case 'show_project':
        return await this.handleShowProject(parameters);

      case 'move_task':
        return await this.handleMoveTask(parameters);

      case 'help':
        return {
          success: true,
          message: voiceTaskCommandService.getHelpText(),
        };

      default:
        return {
          success: false,
          message: "I don't recognize that action. Please try again or say 'help' for available commands.",
          error: 'Unknown action',
        };
    }
  }

  /**
   * Handle task creation
   */
  private async handleCreateTask(parameters: VoiceCommandResult['parameters']): Promise<VoiceTaskResult> {
    if (!parameters.title) {
      return {
        success: false,
        message: "I need a title for the task. Please try again with a clear task description.",
      };
    }

    try {
      // Handle project creation if specified
      let projectId = this.taskStore.selectedProjectId;

      if (parameters.project_name && this.options.autoCreateProject) {
        const projectResult = await this.findOrCreateProject(parameters.project_name);
        if (projectResult.project) {
          projectId = projectResult.project.id;
        }
      }

      // Parse due date if provided
      let dueDate: string | undefined;
      if (parameters.due_date) {
        dueDate = new Date(parameters.due_date).toISOString();
      }

      // Create the task
      const taskData = {
        title: parameters.title,
        description: parameters.description,
        priority: (parameters.priority || 'medium') as PersonalTask['priority'],
        status: 'todo' as const,
        due_date: dueDate,
        project_id: projectId || undefined,
      };

      await this.taskStore.createTask(taskData);

      return {
        success: true,
        message: `Task "${parameters.title}" has been created successfully.`,
        action: 'create',
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
      return {
        success: false,
        message: `Sorry, I couldn't create the task: ${errorMessage}`,
        error: errorMessage,
      };
    }
  }

  /**
   * Handle task completion
   */
  private async handleCompleteTask(parameters: VoiceCommandResult['parameters']): Promise<VoiceTaskResult> {
    if (!parameters.title) {
      return {
        success: false,
        message: "Please specify which task you'd like to complete.",
      };
    }

    try {
      // Find the task by title (partial match)
      const task = this.findTaskByTitle(parameters.title);

      if (!task) {
        return {
          success: false,
          message: `I couldn't find a task matching "${parameters.title}". Please be more specific.`,
        };
      }

      // Update task status to completed
      await this.taskStore.updateTask(task.id, { status: 'completed' });

      return {
        success: true,
        message: `Task "${task.title}" has been marked as completed.`,
        action: 'complete',
        task,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete task';
      return {
        success: false,
        message: `Sorry, I couldn't complete the task: ${errorMessage}`,
        error: errorMessage,
      };
    }
  }

  /**
   * Handle task updates
   */
  private async handleUpdateTask(parameters: VoiceCommandResult['parameters']): Promise<VoiceTaskResult> {
    if (!parameters.title) {
      return {
        success: false,
        message: "Please specify which task you'd like to update.",
      };
    }

    try {
      // Find the task by title
      const task = this.findTaskByTitle(parameters.title);

      if (!task) {
        return {
          success: false,
          message: `I couldn't find a task matching "${parameters.title}".`,
        };
      }

      // Prepare update data
      const updates: Partial<PersonalTask> = {};

      if (parameters.priority) {
        updates.priority = parameters.priority;
      }

      if (parameters.description) {
        updates.description = parameters.description;
      }

      if (parameters.due_date) {
        updates.due_date = new Date(parameters.due_date).toISOString();
      }

      // Only update if there are actual changes
      if (Object.keys(updates).length === 0) {
        return {
          success: false,
          message: "No valid updates specified for the task.",
        };
      }

      await this.taskStore.updateTask(task.id, updates);

      return {
        success: true,
        message: `Task "${task.title}" has been updated successfully.`,
        action: 'update',
        task,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update task';
      return {
        success: false,
        message: `Sorry, I couldn't update the task: ${errorMessage}`,
        error: errorMessage,
      };
    }
  }

  /**
   * Handle task deletion
   */
  private async handleDeleteTask(parameters: VoiceCommandResult['parameters']): Promise<VoiceTaskResult> {
    if (!parameters.title) {
      return {
        success: false,
        message: "Please specify which task you'd like to delete.",
      };
    }

    try {
      // Find the task by title
      const task = this.findTaskByTitle(parameters.title);

      if (!task) {
        return {
          success: false,
          message: `I couldn't find a task matching "${parameters.title}".`,
        };
      }

      await this.taskStore.deleteTask(task.id);

      return {
        success: true,
        message: `Task "${task.title}" has been deleted.`,
        action: 'delete',
        task,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
      return {
        success: false,
        message: `Sorry, I couldn't delete the task: ${errorMessage}`,
        error: errorMessage,
      };
    }
  }

  /**
   * Handle project creation
   */
  private async handleCreateProject(parameters: VoiceCommandResult['parameters']): Promise<VoiceTaskResult> {
    if (!parameters.project_name) {
      return {
        success: false,
        message: "Please specify a name for the project.",
      };
    }

    try {
      await this.taskStore.createProject(parameters.project_name);

      return {
        success: true,
        message: `Project "${parameters.project_name}" has been created successfully.`,
        action: 'create_project',
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
      return {
        success: false,
        message: `Sorry, I couldn't create the project: ${errorMessage}`,
        error: errorMessage,
      };
    }
  }

  /**
   * Handle showing project tasks
   */
  private async handleShowProject(parameters: VoiceCommandResult['parameters']): Promise<VoiceTaskResult> {
    if (!parameters.project_name) {
      return {
        success: false,
        message: "Please specify which project's tasks you'd like to see.",
      };
    }

    try {
      // Find the project by name
      const project = this.findProjectByName(parameters.project_name);

      if (!project) {
        return {
          success: false,
          message: `I couldn't find a project named "${parameters.project_name}".`,
        };
      }

      // Select the project
      this.taskStore.selectProject(project.id);

      return {
        success: true,
        message: `Now showing tasks for project "${project.name}".`,
        action: 'show_project',
        project,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to show project';
      return {
        success: false,
        message: `Sorry, I couldn't show the project: ${errorMessage}`,
        error: errorMessage,
      };
    }
  }

  /**
   * Handle moving tasks between projects
   */
  private async handleMoveTask(parameters: VoiceCommandResult['parameters']): Promise<VoiceTaskResult> {
    if (!parameters.title || !parameters.project_name) {
      return {
        success: false,
        message: "Please specify both the task and the project to move it to.",
      };
    }

    try {
      // Find the task
      const task = this.findTaskByTitle(parameters.title);
      if (!task) {
        return {
          success: false,
          message: `I couldn't find a task matching "${parameters.title}".`,
        };
      }

      // Find the target project
      const targetProject = this.findProjectByName(parameters.project_name);
      if (!targetProject) {
        return {
          success: false,
          message: `I couldn't find a project named "${parameters.project_name}".`,
        };
      }

      // Move the task
      await this.taskStore.updateTask(task.id, { project_id: targetProject.id });

      return {
        success: true,
        message: `Task "${task.title}" has been moved to project "${targetProject.name}".`,
        action: 'move_task',
        task,
        project: targetProject,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to move task';
      return {
        success: false,
        message: `Sorry, I couldn't move the task: ${errorMessage}`,
        error: errorMessage,
      };
    }
  }

  /**
   * Find a task by title (partial match)
   */
  private findTaskByTitle(title: string): PersonalTask | undefined {
    const searchTitle = title.toLowerCase();

    return this.taskStore.tasks.find(task =>
      task.title.toLowerCase().includes(searchTitle) ||
      searchTitle.includes(task.title.toLowerCase())
    );
  }

  /**
   * Find a project by name (partial match)
   */
  private findProjectByName(name: string): PersonalProject | undefined {
    const searchName = name.toLowerCase();

    return this.taskStore.projects.find(project =>
      project.name.toLowerCase().includes(searchName) ||
      searchName.includes(project.name.toLowerCase())
    );
  }

  /**
   * Find an existing project or create a new one
   */
  private async findOrCreateProject(projectName: string): Promise<VoiceTaskResult> {
    // First try to find existing project
    const existingProject = this.findProjectByName(projectName);

    if (existingProject) {
      return {
        success: true,
        message: `Using existing project "${existingProject.name}".`,
        project: existingProject,
      };
    }

    // Create new project if auto-creation is enabled
    if (this.options.autoCreateProject) {
      return await this.handleCreateProject({ project_name: projectName });
    }

    return {
      success: false,
      message: `Project "${projectName}" doesn't exist. Please create it first or enable auto-creation.`,
    };
  }

  /**
   * Announce a result using text-to-speech if available
   */
  private announceResult(result: VoiceTaskResult): void {
    // This would integrate with the TTS service
    // For now, we'll just log it
    console.log('Voice Task Result:', result.message);

    // TODO: Integrate with TTS service when available
    // if (window.ttsService) {
    //   window.ttsService.speak(result.message);
    // }
  }

  /**
   * Get available voice commands help
   */
  getVoiceCommandsHelp(): string {
    return voiceTaskCommandService.getHelpText();
  }
}

// Export singleton instance
export const voiceTaskProcessor = new VoiceTaskProcessor();