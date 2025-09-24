const { ipcMain } = require('electron');
const log = require('electron-log');
const WidgetService = require('../widgetService.cjs');

function registerWidgetServiceHandlers(widgetService) {
  ipcMain.handle('widget-service:init', async () => {
    try {
      if (!widgetService) {
        widgetService = new WidgetService();
        log.info('Widget service initialized');
      }
      return { success: true };
    } catch (error) {
      log.error('Error initializing widget service:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('widget-service:register-widget', async (event, widgetType) => {
    try {
      if (!widgetService) {
        widgetService = new WidgetService();
      }
      
      widgetService.registerWidget(widgetType);
      const status = await widgetService.getStatus();
      return { success: true, status };
    } catch (error) {
      log.error('Error registering widget:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('widget-service:unregister-widget', async (event, widgetType) => {
    try {
      if (!widgetService) {
        return { success: true, status: { running: false, activeWidgets: [] } };
      }
      
      widgetService.unregisterWidget(widgetType);
      const status = await widgetService.getStatus();
      return { success: true, status };
    } catch (error) {
      log.error('Error unregistering widget:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('widget-service:get-status', async () => {
    try {
      if (!widgetService) {
        return { 
          success: true, 
          status: { 
            running: false, 
            port: 8765, 
            activeWidgets: [], 
            shouldRun: false 
          } 
        };
      }
      
      const status = await widgetService.getStatus();
      return { success: true, status };
    } catch (error) {
      log.error('Error getting widget service status:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('widget-service:start', async () => {
    try {
      if (!widgetService) {
        widgetService = new WidgetService();
      }
      
      const result = await widgetService.startService();
      return result;
    } catch (error) {
      log.error('Error starting widget service:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('widget-service:stop', async () => {
    try {
      if (!widgetService) {
        return { success: true, message: 'Service not running' };
      }
      
      const result = await widgetService.stopService();
      return result;
    } catch (error) {
      log.error('Error stopping widget service:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('widget-service:restart', async () => {
    try {
      if (!widgetService) {
        widgetService = new WidgetService();
      }
      
      const result = await widgetService.restartService();
      return result;
    } catch (error) {
      log.error('Error restarting widget service:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('widget-service:manage', async () => {
    try {
      if (!widgetService) {
        widgetService = new WidgetService();
      }
      
      const result = await widgetService.manageService();
      return { success: true, status: result };
    } catch (error) {
      log.error('Error managing widget service:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('widget-service:health', async () => {
    try {
      if (!widgetService) {
        return { success: true, healthy: false };
      }
      
      const healthy = await widgetService.isServiceRunning();
      return { success: true, healthy };
    } catch (error) {
      log.error('Error checking widget service health:', error);
      return { success: false, error: error.message, healthy: false };
    }
  });

  ipcMain.handle('widget-service:enable-autostart', async () => {
    try {
      if (!widgetService) {
        widgetService = new WidgetService();
      }
      
      widgetService.enableAutoStart();
      const status = await widgetService.getStatus();
      return { success: true, status };
    } catch (error) {
      log.error('Error enabling widget service auto-start:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('widget-service:disable-autostart', async () => {
    try {
      if (!widgetService) {
        widgetService = new WidgetService();
      }
      
      widgetService.disableAutoStart();
      const status = await widgetService.getStatus();
      return { success: true, status };
    } catch (error) {
      log.error('Error disabling widget service auto-start:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = {
  registerWidgetServiceHandlers,
};