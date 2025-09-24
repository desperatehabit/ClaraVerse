const { ipcMain, app } = require('electron');
const { TaskService } = require('../services/taskService.cjs');
const path = require('path');

function registerPersonalTaskHandlers() {
  const dbPath = path.join(app.getPath('userData'), 'clara_tasks.db');
  const taskService = TaskService.getInstance(dbPath);

  ipcMain.handle('tasks:getProjects', async () => {
    try {
      const projects = await taskService.getProjects();
      return { success: true, data: projects };
    } catch (error) {
      console.error('Failed to get projects:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('tasks:getTasks', async (event, projectId) => {
    try {
      const tasks = await taskService.getTasks(projectId);
      return { success: true, data: tasks };
    } catch (error) {
      console.error('Failed to get tasks:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('tasks:createTask', async (event, taskData) => {
    try {
      const newTask = await taskService.createTask(taskData);
      return { success: true, data: newTask };
    } catch (error) {
      console.error('Failed to create task:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('tasks:updateTask', async (event, { id, updates }) => {
    try {
      const updatedTask = await taskService.updateTask(id, updates);
      return { success: true, data: updatedTask };
    } catch (error) {
      console.error('Failed to update task:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('tasks:deleteTask', async (event, id) => {
    try {
      const result = await taskService.deleteTask(id);
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to delete task:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('tasks:createProject', async (event, projectData) => {
    try {
      const newProject = await taskService.createProject(projectData);
      return { success: true, data: newProject };
    } catch (error) {
      console.error('Failed to create project:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('tasks:updateProject', async (event, { id, updates }) => {
    try {
      const updatedProject = await taskService.updateProject(id, updates);
      return { success: true, data: updatedProject };
    } catch (error) {
      console.error('Failed to update project:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('tasks:deleteProject', async (event, id) => {
    try {
      const result = await taskService.deleteProject(id);
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to delete project:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = {
  registerPersonalTaskHandlers,
};