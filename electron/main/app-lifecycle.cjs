const { app, globalShortcut, ipcMain } = require('electron');
const log = require('electron-log');
const { createMainWindow } = require('./window-manager.cjs');
const { initialize } = require('../services/service-initializer.cjs');
const { createTray } = require('./tray.cjs');
const { registerGlobalShortcuts } = require('./shortcuts.cjs');
const { fork } = require('child_process');
const path = require('path');

function setupAppLifecycle() {
  // Single instance lock
  const allowSecondInstance = process.env.NODE_ENV === 'development' && process.env.ELECTRON_ALLOW_SECOND_INSTANCE === 'true';
  let gotTheLock = true;
  if (!allowSecondInstance) {
    gotTheLock = app.requestSingleInstanceLock();
  }

  if (!gotTheLock) {
    log.info('Another instance of ClaraVerse is already running. Exiting this instance.');
    app.quit();
    return;
  }

  app.on('second-instance', (event, commandLine, workingDirectory) => {
    log.info('Second instance attempted to start. Focusing main window.');
    const { mainWindow } = require('./window-manager.cjs');
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
      mainWindow.show();
    } else {
      createMainWindow().catch(error => {
        log.error('Error creating main window from second instance:', error);
      });
    }
  });

  app.whenReady().then(async () => {
    await initialize();

    // Start the LiveKit agent in a separate process
    const agentPath = path.resolve(__dirname, '../services/voice/ClaraVoiceAgent.cjs');
    const roomName = `clara-voice-${Math.random().toString(36).substring(7)}`;
    const token = 'your-dev-token'; // Replace with a valid token
    const agentProcess = fork(agentPath, [JSON.stringify({ roomName, token })], { stdio: 'inherit' });

    ipcMain.handle('voice:get-room-name', () => roomName);

    agentProcess.on('exit', (code) => {
      log.info(`Voice agent process exited with code ${code}`);
    });

    // Create tray
    createTray();
    registerGlobalShortcuts();
    log.info('Application initialization complete with voice service and global shortcuts registered');
  });

  app.on('window-all-closed', async () => {
    const { isQuitting, tray } = require('./tray.cjs');
    if (isQuitting) {
      if (tray) {
        tray.destroy();
      }
      globalShortcut.unregisterAll();
      
      const { watchdogService, schedulerService, widgetService, mcpService, llamaSwapService, dockerSetup } = require('../services/service-initializer.cjs');

      if (watchdogService) {
        try {
          log.info('Stopping watchdog service...');
          watchdogService.stop();
        } catch (error) {
          log.error('Error stopping watchdog service:', error);
        }
      }

      if (schedulerService) {
        try {
          log.info('Stopping scheduler service...');
          await schedulerService.cleanup();
        } catch (error) {
          log.error('Error stopping scheduler service:', error);
        }
      }

      if (widgetService) {
        try {
          log.info('Stopping widget service...');
          await widgetService.cleanup();
        } catch (error) {
          log.error('Error stopping widget service:', error);
        }
      }

      if (mcpService) {
        try {
          log.info('Saving MCP server running state...');
          mcpService.saveRunningState();
        } catch (error) {
          log.error('Error saving MCP server running state:', error);
        }
      }
      
      if (llamaSwapService) {
        try {
          log.info('Stopping llama-swap service...');
          await llamaSwapService.stop();
        } catch (error) {
          log.error('Error stopping llama-swap service:', error);
        }
      }
      
      if (mcpService) {
        try {
          log.info('Stopping all MCP servers...');
          await mcpService.stopAllServers();
        } catch (error) {
          log.error('Error stopping MCP servers:', error);
        }
      }
      
      if (dockerSetup) {
        await dockerSetup.stop();
      }

      // Cleanup voice service
      if (agentProcess) {
        agentProcess.kill();
      }

      if (process.platform !== 'darwin') {
        app.quit();
      }
    } else {
      if (process.platform === 'darwin') {
        // Do nothing
      } else {
        log.info('App minimized to system tray');
      }
    }
  });

  app.on('activate', async () => {
    const { BrowserWindow } = require('electron');
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
}

module.exports = {
  setupAppLifecycle,
};