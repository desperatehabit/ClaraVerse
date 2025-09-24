const { ipcMain } = require('electron');
const log = require('electron-log');

function registerComfyUIHandlers(dockerSetup, serviceConfigManager) {
  ipcMain.handle('comfyui:check-docker-status', async () => {
    try {
      if (!dockerSetup) {
        return { dockerRunning: false, error: 'Docker setup not initialized' };
      }
      
      const dockerRunning = await dockerSetup.isDockerRunning();
      return { dockerRunning };
    } catch (error) {
      log.error('Error checking Docker status:', error);
      return { dockerRunning: false, error: error.message };
    }
  });

  ipcMain.handle('comfyui:check-service-status', async () => {
    try {
      if (!dockerSetup) {
        return { running: false, error: 'Docker setup not initialized' };
      }

      let comfyuiRunning = false;
      let serviceUrl = 'http://localhost:8188';
      
      if (serviceConfigManager && typeof serviceConfigManager.getServiceMode === 'function') {
        try {
          const comfyuiMode = serviceConfigManager.getServiceMode('comfyui');
          if (comfyuiMode === 'manual' && typeof serviceConfigManager.getServiceUrl === 'function') {
            const comfyuiUrl = serviceConfigManager.getServiceUrl('comfyui');
            if (comfyuiUrl) {
              serviceUrl = comfyuiUrl;
              try {
                const { createManualHealthCheck } = require('../serviceDefinitions.cjs');
                const healthCheck = createManualHealthCheck(comfyuiUrl, '/');
                comfyuiRunning = await healthCheck();
              } catch (error) {
                log.debug(`ComfyUI manual health check failed: ${error.message}`);
                comfyuiRunning = false;
              }
            }
          } else {
            const healthResult = await dockerSetup.isComfyUIRunning();
            comfyuiRunning = healthResult;
            if (dockerSetup.ports && dockerSetup.ports.comfyui) {
              serviceUrl = `http://localhost:${dockerSetup.ports.comfyui}`;
            }
          }
        } catch (configError) {
          log.warn('Error getting ComfyUI service config, using default mode:', configError.message);
          const healthResult = await dockerSetup.isComfyUIRunning();
          comfyuiRunning = healthResult;
          if (dockerSetup.ports && dockerSetup.ports.comfyui) {
            serviceUrl = `http://localhost:${dockerSetup.ports.comfyui}`;
          }
        }
      } else {
        const healthResult = await dockerSetup.isComfyUIRunning();
        comfyuiRunning = healthResult;
        if (dockerSetup.ports && dockerSetup.ports.comfyui) {
          serviceUrl = `http://localhost:${dockerSetup.ports.comfyui}`;
        }
      }

      return { running: comfyuiRunning, serviceUrl };
    } catch (error) {
      log.error('Error checking ComfyUI service status:', error);
      return { running: false, error: error.message };
    }
  });

  ipcMain.handle('comfyui:start-container', async () => {
    try {
      if (!dockerSetup) {
        return { success: false, error: 'Docker setup not initialized' };
      }

      const dockerRunning = await dockerSetup.isDockerRunning();
      if (!dockerRunning) {
        return { success: false, error: 'Docker is not running' };
      }

      const { getComfyUIConfig } = require('../utils/helpers');
      const comfyuiConfig = getComfyUIConfig(dockerSetup);

      const comfyuiConfigWithProgress = {
        ...comfyuiConfig,
        statusCallback: (message, type, details) => {
          const { mainWindow } = require('../main/window-manager');
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('comfyui:startup-progress', {
              message: message,
              progress: details?.percentage || 0,
              type: type || 'info',
              stage: 'pulling'
            });
          
            // Add the missing comfyui-status handler that the frontend expects
            ipcMain.handle('comfyui-status', async () => {
              try {
                if (!dockerSetup) {
                  return { running: false, error: 'Docker setup not initialized' };
                }
          
                const result = await dockerSetup.isComfyUIRunning();
                let serviceUrl = 'http://localhost:8188';
          
                if (dockerSetup.ports && dockerSetup.ports.comfyui) {
                  serviceUrl = `http://localhost:${dockerSetup.ports.comfyui}`;
                }
          
                return { running: result, serviceUrl };
              } catch (error) {
                log.error('Error in comfyui-status handler:', error);
                return { running: false, error: error.message };
              }
            });
          }
        }
      };

      log.info('Starting ComfyUI container...');
      await dockerSetup.startContainer(comfyuiConfigWithProgress);
      
      const maxAttempts = 60;
      let attempts = 0;
      let healthResult = { success: false };
      
      while (attempts < maxAttempts && !healthResult.success) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        healthResult = { success: await dockerSetup.isComfyUIRunning() };
        attempts++;
        
        const { mainWindow } = require('../main/window-manager');
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('comfyui:startup-progress', {
            message: `Starting ComfyUI... (${attempts}/${maxAttempts})`,
            progress: Math.round((attempts / maxAttempts) * 100),
            stage: 'starting'
          });
        }
      }

      if (healthResult.success) {
        const serviceUrl = dockerSetup.ports && dockerSetup.ports.comfyui 
          ? `http://localhost:${dockerSetup.ports.comfyui}` 
          : 'http://localhost:8188';
          
        log.info('ComfyUI container started successfully');
        return { success: true, serviceUrl };
      } else {
        log.warn('ComfyUI container started but health check failed');
        return { success: false, error: 'ComfyUI started but is not responding to health checks' };
      }
    } catch (error) {
      log.error('Error starting ComfyUI container:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = {
  registerComfyUIHandlers,
};