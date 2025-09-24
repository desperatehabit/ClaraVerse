const { ipcMain } = require('electron');
const log = require('electron-log');

function registerWatchdogHandlers(watchdogService) {
  ipcMain.handle('watchdog-get-services-status', async () => {
    try {
      if (!watchdogService) {
        return { error: 'Watchdog service not initialized' };
      }
      
      return {
        services: watchdogService.getServicesStatus(),
        overallHealth: watchdogService.getOverallHealth()
      };
    } catch (error) {
      log.error('Error getting services status:', error);
      return { error: error.message };
    }
  });
}

module.exports = {
  registerWatchdogHandlers,
};