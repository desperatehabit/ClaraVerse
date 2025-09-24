const { globalShortcut } = require('electron');
const log = require('electron-log');

function registerGlobalShortcuts() {
  try {
    globalShortcut.unregisterAll();
    
    const shortcuts = process.platform === 'darwin' 
      ? ['Option+Ctrl+Space'] 
      : ['Ctrl+Alt+Space'];
    
    let lastTriggerTime = 0;
    const debounceDelay = 500;
    
    shortcuts.forEach(shortcut => {
      const ret = globalShortcut.register(shortcut, () => {
        const now = Date.now();
        
        if (now - lastTriggerTime < debounceDelay) {
          log.info(`Global shortcut ${shortcut} debounced - too soon after last trigger`);
          return;
        }
        
        lastTriggerTime = now;
        log.info(`Global shortcut ${shortcut} pressed - bringing Clara to foreground`);
        
        const { mainWindow } = require('./window-manager');
        if (mainWindow) {
          if (mainWindow.isMinimized()) {
            mainWindow.restore();
          }
          
          mainWindow.focus();
          mainWindow.show();
          
          mainWindow.webContents.send('trigger-new-chat');
        } else {
          log.warn('Main window not available for global shortcut');
        }
      });
      
      if (!ret) {
        log.error(`Failed to register global shortcut: ${shortcut}`);
      } else {
        log.info(`Successfully registered global shortcut: ${shortcut}`);
      }
    });
    
    log.info(`Global shortcuts registered for platform: ${process.platform}`);
  } catch (error) {
    log.error('Error registering global shortcuts:', error);
  }
}

module.exports = {
  registerGlobalShortcuts,
};