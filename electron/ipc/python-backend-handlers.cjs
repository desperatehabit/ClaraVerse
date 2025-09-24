const { ipcMain } = require('electron');
const log = require('electron-log');

function registerPythonBackendHandlers(dockerSetup, serviceConfigManager) {
  ipcMain.handle('check-docker-status', async () => {
    try {
      if (!dockerSetup) {
        return { isRunning: false, error: 'Docker setup not initialized' };
      }
      
      const isRunning = await dockerSetup.isDockerRunning();
      return { isRunning };
    } catch (error) {
      log.error('Error checking Docker status:', error);
      return { isRunning: false, error: error.message };
    }
  });

  ipcMain.handle('check-python-status', async () => {
    try {
      if (!dockerSetup) {
        return { isHealthy: false, serviceUrl: null, mode: 'docker', error: 'Docker setup not initialized' };
      }

      let config = null;
      let mode = 'docker';
      
      if (serviceConfigManager && typeof serviceConfigManager.getServiceConfig === 'function') {
        try {
          config = await serviceConfigManager.getServiceConfig('notebooks');
          mode = config?.deploymentMode || 'docker';
        } catch (configError) {
          log.warn('Error getting service config, using default mode:', configError.message);
        }
      } else {
        log.warn('Service config manager not available or getServiceConfig method not found, using default mode');
      }
      
      let serviceUrl = null;

      if (mode === 'docker') {
        const dockerRunning = await dockerSetup.isDockerRunning();
        if (dockerRunning) {
          const healthResult = await dockerSetup.isPythonRunning();
          if (dockerSetup.ports && dockerSetup.ports.python) {
            serviceUrl = `http://localhost:${dockerSetup.ports.python}`;
          }
          return { isHealthy: healthResult, serviceUrl, mode };
        } else {
          return { isHealthy: false, serviceUrl: null, mode, error: 'Docker is not running' };
        }
      } else {
        const manualUrl = config?.manualUrl;
        if (manualUrl) {
          serviceUrl = manualUrl;
          const healthResult = await dockerSetup.isPythonRunning();
          return { isHealthy: healthResult, serviceUrl, mode };
        } else {
          return { isHealthy: false, serviceUrl: null, mode, error: 'No manual URL configured' };
        }
      }
    } catch (error) {
      log.error('Error checking Python backend status:', error);
      return { isHealthy: false, serviceUrl: null, mode: 'docker', error: error.message };
    }
  });

  ipcMain.handle('start-python-container', async () => {
    try {
      if (!dockerSetup) {
        return { success: false, error: 'Docker setup not initialized' };
      }

      const dockerRunning = await dockerSetup.isDockerRunning();
      if (!dockerRunning) {
        return { success: false, error: 'Docker is not running. Please start Docker first.' };
      }

      const { getPythonConfig } = require('../utils/helpers');
      const pythonConfig = getPythonConfig(dockerSetup);
      
      const pythonConfigWithProgress = {
        ...pythonConfig,
        statusCallback: (message, type, details) => {
          const { mainWindow } = require('../main/window-manager');
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('python:startup-progress', {
              message: message,
              progress: details?.percentage || 0,
              type: type || 'info',
              stage: 'pulling'
            });
          }
        }
      };

      log.info('Starting Python backend container...');
      await dockerSetup.startContainer(pythonConfigWithProgress);

      const maxAttempts = 30;
      let attempts = 0;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { mainWindow } = require('../main/window-manager');
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('python:startup-progress', {
            message: `Health check ${attempts + 1}/${maxAttempts} for Python backend...`,
            progress: Math.round(((attempts + 1) / maxAttempts) * 100),
            stage: 'starting'
          });
        }
        
        const isHealthy = await dockerSetup.isPythonRunning();
        
        if (isHealthy) {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('python:startup-progress', {
              message: 'Python backend is healthy and ready!',
              progress: 100,
              stage: 'ready'
            });
          }
          log.info('Python backend container started and is healthy');
          return { success: true };
        }
        
        attempts++;
      }

      return { success: false, error: 'Python backend started but is not responding to health checks' };
    } catch (error) {
      log.error('Error starting Python backend container:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = {
  registerPythonBackendHandlers,
};