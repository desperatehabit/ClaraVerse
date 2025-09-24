const { ipcMain } = require('electron');
const log = require('electron-log');
const { getPlatformCompatibility } = require('../serviceDefinitions.cjs');

function registerServiceConfigurationHandlers(serviceConfigManager, centralServiceManager) {
  console.log('[main] Registering service configuration IPC handlers...');
  
  ipcMain.handle('service-config:get-platform-compatibility', async () => {
    try {
      return getPlatformCompatibility();
    } catch (error) {
      log.error('Error getting platform compatibility:', error);
      return {};
    }
  });
  
  ipcMain.handle('service-config:get-all-configs', async () => {
    try {
      if (!serviceConfigManager || typeof serviceConfigManager.getConfigSummary !== 'function') {
        return {};
      }
      return serviceConfigManager.getConfigSummary();
    } catch (error) {
      log.error('Error getting service configurations:', error);
      return {};
    }
  });
  
  ipcMain.handle('service-config:set-config', async (event, serviceName, mode, url = null) => {
    try {
      if (!serviceConfigManager || typeof serviceConfigManager.setServiceConfig !== 'function') {
        throw new Error('Service configuration manager not initialized or setServiceConfig method not available');
      }
      
      serviceConfigManager.setServiceConfig(serviceName, mode, url);
      log.info(`Service ${serviceName} configured: mode=${mode}${url ? `, url=${url}` : ''}`);
      
      return { success: true };
    } catch (error) {
      log.error(`Error setting service configuration for ${serviceName}:`, error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('service-config:set-manual-url', async (event, serviceName, url) => {
    try {
      if (!serviceConfigManager || typeof serviceConfigManager.setServiceConfig !== 'function') {
        throw new Error('Service configuration manager not initialized or setServiceConfig method not available');
      }
      
      serviceConfigManager.setServiceConfig(serviceName, 'manual', url);
      log.info(`Service ${serviceName} configured with manual URL: ${url}`);
      
      return { success: true };
    } catch (error) {
      log.error(`Error setting manual URL for ${serviceName}:`, error);
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle('service-config:test-manual-service', async (event, serviceName, url, healthEndpoint = '/') => {
    try {
      if (!serviceConfigManager || typeof serviceConfigManager.testManualService !== 'function') {
        throw new Error('Service configuration manager not initialized or testManualService method not available');
      }
      
      const result = await serviceConfigManager.testManualService(serviceName, url, healthEndpoint);
      return result;
    } catch (error) {
      log.error(`Error testing manual service ${serviceName}:`, error);
      return { 
        success: false, 
        error: error.message, 
        timestamp: Date.now() 
      };
    }
  });
  
  ipcMain.handle('service-config:get-supported-modes', async (event, serviceName) => {
    try {
      if (!serviceConfigManager || typeof serviceConfigManager.getSupportedModes !== 'function') {
        return ['docker'];
      }
      
      return serviceConfigManager.getSupportedModes(serviceName);
    } catch (error) {
      log.error(`Error getting supported modes for ${serviceName}:`, error);
      return ['docker'];
    }
  });
  
  ipcMain.handle('service-config:reset-config', async (event, serviceName) => {
    try {
      if (!serviceConfigManager || typeof serviceConfigManager.removeServiceConfig !== 'function') {
        throw new Error('Service configuration manager not initialized or removeServiceConfig method not available');
      }
      
      serviceConfigManager.removeServiceConfig(serviceName);
      log.info(`Service ${serviceName} configuration reset to defaults`);
      
      return { success: true };
    } catch (error) {
      log.error(`Error resetting service configuration for ${serviceName}:`, error);
      return { success: false, error: error.message };
    }
  });
  
  let lastLoggedServiceStatus = '';
  ipcMain.handle('service-config:get-enhanced-status', async () => {
    try {
      if (!centralServiceManager) {
        log.warn('⚠️  Central service manager not available, returning empty status');
        return {};
      }
      
      const status = centralServiceManager.getServicesStatus();
      
      const stableStatus = {};
      for (const [serviceName, serviceStatus] of Object.entries(status)) {
        stableStatus[serviceName] = {
          state: serviceStatus.state,
          deploymentMode: serviceStatus.deploymentMode,
          restartAttempts: serviceStatus.restartAttempts,
          serviceUrl: serviceStatus.serviceUrl,
          isManual: serviceStatus.isManual,
          canRestart: serviceStatus.canRestart,
          supportedModes: serviceStatus.supportedModes,
          lastError: serviceStatus.lastError
        };
      }
      
      const stableStatusString = JSON.stringify(stableStatus);
      if (stableStatusString !== lastLoggedServiceStatus) {
        log.info('📊 Enhanced service status changed:', stableStatus);
        lastLoggedServiceStatus = stableStatusString;
      }
      
      return status;
    } catch (error) {
      log.error('Error getting enhanced service status:', error);
      return {};
    }
  });
  
  console.log('[main] Service configuration IPC handlers registered successfully');
}

module.exports = {
  registerServiceConfigurationHandlers,
};