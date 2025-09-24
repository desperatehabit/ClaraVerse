const { ipcMain } = require('electron');
const { TaskService } = require('./electron/services/taskService.cjs');

// Mock ipcMain for testing purposes
const ipcMainMock = {
  handlers: new Map(),
  handle(channel, listener) {
    this.handlers.set(channel, listener);
  },
  async invoke(channel, ...args) {
    const handler = this.handlers.get(channel);
    if (handler) {
      // The first argument to the handler is the event object, which we can mock.
      return handler({}, ...args);
    }
    throw new Error(`No handler registered for channel '${channel}'`);
  }
};

// Initialize TaskService with a test database
const taskService = TaskService.getInstance('./clara_tasks.db');

// Register IPC handlers with the mock ipcMain
ipcMainMock.handle('tasks:getTasks', async () => {
  return taskService.getTasks();
});

ipcMainMock.handle('tasks:getProjects', async () => {
  return taskService.getProjects();
});

async function runTest() {
  try {
    console.log('--- Running Backend Test Script ---');

    // Test tasks:getProjects
    console.log('Fetching projects...');
    const projects = await ipcMainMock.invoke('tasks:getProjects');
    console.log('Projects received:', projects);
    if (Array.isArray(projects)) {
      console.log(`✅ Successfully fetched ${projects.length} projects.`);
    } else {
      console.error('❌ Failed to fetch projects. Expected an array.');
    }

    // Test tasks:getTasks
    console.log('\nFetching tasks...');
    const tasks = await ipcMainMock.invoke('tasks:getTasks');
    console.log('Tasks received:', tasks);
    if (Array.isArray(tasks)) {
      console.log(`✅ Successfully fetched ${tasks.length} tasks.`);
    } else {
      console.error('❌ Failed to fetch tasks. Expected an array.');
    }

    console.log('\n--- Test Script Finished ---');
  } catch (error) {
    console.error('An error occurred during the test:', error);
  }
}

runTest();