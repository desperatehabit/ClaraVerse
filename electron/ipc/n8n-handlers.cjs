const { ipcMain } = require('electron');
const log = require('electron-log');

function registerN8NHandlers(dockerSetup, serviceConfigManager) {
  ipcMain.handle('n8n:check-docker-status', async () => {
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

  ipcMain.handle('n8n:check-service-status', async () => {
    try {
      if (!dockerSetup) {
        return { running: false, error: 'Docker setup not initialized' };
      }

      let n8nRunning = false;
      let serviceUrl = 'http://localhost:5678';
      
      if (serviceConfigManager && typeof serviceConfigManager.getServiceMode === 'function') {
        try {
          const n8nMode = serviceConfigManager.getServiceMode('n8n');
          if (n8nMode === 'manual' && typeof serviceConfigManager.getServiceUrl === 'function') {
            const n8nUrl = serviceConfigManager.getServiceUrl('n8n');
            if (n8nUrl) {
              serviceUrl = n8nUrl;
              try {
                const { createManualHealthCheck } = require('../serviceDefinitions.cjs');
                const healthCheck = createManualHealthCheck(n8nUrl, '/');
                n8nRunning = await healthCheck();
              } catch (error) {
                log.debug(`N8N manual health check failed: ${error.message}`);
                n8nRunning = false;
              }
            }
          } else {
            const healthResult = await dockerSetup.checkN8NHealth();
            n8nRunning = healthResult.success;
            if (dockerSetup.ports && dockerSetup.ports.n8n) {
              serviceUrl = `http://localhost:${dockerSetup.ports.n8n}`;
            }
          }
        } catch (configError) {
          log.warn('Error getting N8N service config, using default mode:', configError.message);
          const healthResult = await dockerSetup.checkN8NHealth();
          n8nRunning = healthResult.success;
          if (dockerSetup.ports && dockerSetup.ports.n8n) {
            serviceUrl = `http://localhost:${dockerSetup.ports.n8n}`;
          }
        }
      } else {
        const healthResult = await dockerSetup.checkN8NHealth();
        n8nRunning = healthResult.success;
        if (dockerSetup.ports && dockerSetup.ports.n8n) {
          serviceUrl = `http://localhost:${dockerSetup.ports.n8n}`;
        }
      }

      return { running: n8nRunning, serviceUrl };
    } catch (error) {
      log.error('Error checking N8N service status:', error);
      return { running: false, error: error.message };
    }
  });

  ipcMain.handle('n8n:start-container', async () => {
    try {
      if (!dockerSetup) {
        return { success: false, error: 'Docker setup not initialized' };
      }

      const dockerRunning = await dockerSetup.isDockerRunning();
      if (!dockerRunning) {
        return { success: false, error: 'Docker is not running' };
      }

      log.info('Starting N8N container...');
      
      const { getN8NConfig } = require('../utils/helpers');
      const n8nConfig = getN8NConfig(dockerSetup);
      
      const n8nConfigWithProgress = {
        ...n8nConfig,
        statusCallback: (message, type, details) => {
          const { mainWindow } = require('../main/window-manager');
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('n8n:startup-progress', {
              message: message,
              progress: details?.percentage || 0,
              type: type || 'info',
              stage: 'pulling'
            });
          }
        }
      };
      
      await dockerSetup.startContainer(n8nConfigWithProgress);
      
      const maxAttempts = 30;
      let attempts = 0;
      let healthResult = { success: false };
      
      while (attempts < maxAttempts && !healthResult.success) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        healthResult = await dockerSetup.checkN8NHealth();
        attempts++;
        
        const { mainWindow } = require('../main/window-manager');
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('n8n:startup-progress', {
            message: `Starting N8N... (${attempts}/${maxAttempts})`,
            progress: Math.round((attempts / maxAttempts) * 100),
            stage: 'starting'
          });
        }
      }

      if (healthResult.success) {
        const serviceUrl = dockerSetup.ports && dockerSetup.ports.n8n 
          ? `http://localhost:${dockerSetup.ports.n8n}` 
          : 'http://localhost:5678';
          
        log.info('N8N container started successfully');
        return { success: true, serviceUrl };
      } else {
        log.warn('N8N container started but health check failed');
        return { success: false, error: 'N8N started but is not responding to health checks' };
      }
    } catch (error) {
      log.error('Error starting N8N container:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = {
  registerN8NHandlers,
};