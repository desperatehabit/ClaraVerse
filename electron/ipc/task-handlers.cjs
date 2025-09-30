const { ipcMain } = require('electron');

console.log('🚀 task-handlers.cjs file loaded');

// TaskService will be passed in via registerPersonalTaskHandlers function
let taskService;

function registerPersonalTaskHandlers(taskServiceInstance) {
    console.log('🔧 Registering personal task handlers...');

    // Use the TaskService instance passed from service-initializer
    taskService = taskServiceInstance;

    // Log TaskService status before registration
    console.log('📊 TaskService status check:', {
      taskServiceExists: !!taskService,
      taskServiceType: typeof taskService,
      taskServiceIsInstance: taskService ? taskService.constructor.name : 'null'
    });

    if (!taskService) {
      console.error('❌ CRITICAL: TaskService is not initialized! Cannot register task handlers.');
      return;
    }

   try {
    // Projects handlers
    ipcMain.handle('tasks:getProjects', async () => {
      try {
        console.log('📋 Getting projects via TaskService...');
        const result = taskService.getProjects();
        return result;
      } catch (error) {
        console.error('❌ Error in tasks:getProjects:', error);
        return { success: false, error: error.message, data: [] };
      }
    });

    ipcMain.handle('tasks:createProject', async (event, project) => {
      try {
        console.log('📋 Creating project via TaskService...', project);
        const result = taskService.createProject(project);
        return { success: true, data: result };
      } catch (error) {
        console.error('❌ Error in tasks:createProject:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('tasks:updateProject', async (event, { id, updates }) => {
      try {
        console.log('📋 Updating project via TaskService...', { id, updates });
        const result = taskService.updateProject(id, updates);
        return { success: true, data: result };
      } catch (error) {
        console.error('❌ Error in tasks:updateProject:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('tasks:deleteProject', async (event, id) => {
      try {
        console.log('📋 Deleting project via TaskService...', id);
        taskService.deleteProject(id);
        return { success: true, data: true };
      } catch (error) {
        console.error('❌ Error in tasks:deleteProject:', error);
        return { success: false, error: error.message };
      }
    });

    // Tasks handlers
     console.log('📝 Registering tasks:getTasks handler...');
     ipcMain.handle('tasks:getTasks', async (event, projectId) => {
       try {
         console.log('📋 Getting tasks via TaskService...', projectId ? `for project ${projectId}` : 'all tasks');
         console.log('📊 Handler call details:', {
           handlerName: 'tasks:getTasks',
           projectId,
           taskServiceExists: !!taskService
         });
         const result = taskService.getTasks(projectId);
         console.log('📋 TaskService.getTasks result:', result);
         return result;
       } catch (error) {
         console.error('❌ Error in tasks:getTasks:', error);
         console.error('❌ Error details:', {
           errorMessage: error.message,
           errorStack: error.stack,
           taskServiceExists: !!taskService,
           handlerName: 'tasks:getTasks'
         });
         return { success: false, error: error.message, data: [] };
       }
     });

     ipcMain.handle('tasks:getTask', async (event, taskId) => {
       try {
         console.log('📋 Getting single task via TaskService...', taskId);
         console.log('📊 Handler call details:', {
           handlerName: 'tasks:getTask',
           taskId,
           taskServiceExists: !!taskService
         });
         const result = taskService.getTask(taskId);
         console.log('📋 TaskService.getTask result:', result);
         return { success: true, data: result };
       } catch (error) {
         console.error('❌ Error in tasks:getTask:', error);
         console.error('❌ Error details:', {
           errorMessage: error.message,
           errorStack: error.stack,
           taskServiceExists: !!taskService,
           handlerName: 'tasks:getTask'
         });
         return { success: false, error: error.message, data: null };
       }
     });

    ipcMain.handle('tasks:createTask', async (event, task) => {
      try {
        console.log('📋 Creating task via TaskService...', task);
        const result = taskService.createTask(task);
        return { success: true, data: result };
      } catch (error) {
        console.error('❌ Error in tasks:createTask:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('tasks:updateTask', async (event, { id, updates }) => {
      try {
        console.log('📋 Updating task via TaskService...', { id, updates });
        const result = taskService.updateTask(id, updates);
        return { success: true, data: result };
      } catch (error) {
        console.error('❌ Error in tasks:updateTask:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('tasks:deleteTask', async (event, id) => {
      try {
        console.log('📋 Deleting task via TaskService...', id);
        taskService.deleteTask(id);
        return { success: true, data: true };
      } catch (error) {
        console.error('❌ Error in tasks:deleteTask:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('tasks:processNaturalLanguageTask', async (event, text) => {
      try {
        console.log('📋 Processing natural language task via TaskService...', text);
        const result = await taskService.processNaturalLanguageTask(text);
        return { success: true, data: result };
      } catch (error) {
        console.error('❌ Error in tasks:processNaturalLanguageTask:', error);
        return { success: false, error: error.message };
      }
    });

    console.log('✅ All personal task handlers registered successfully');
  } catch (error) {
    console.error('❌ Failed to register personal task handlers:', error);
  }
}

module.exports = {
  registerPersonalTaskHandlers,
};