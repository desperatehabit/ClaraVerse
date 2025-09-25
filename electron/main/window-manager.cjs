const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');
const { createAppMenu } = require('../menu.cjs');
const { setupAutoUpdater } = require('../updateService.cjs');

let mainWindow;

async function createMainWindow() {
  if (mainWindow) return;
  
  let shouldStartFullscreen = false;
  let shouldStartMinimized = false;
  
  try {
    const settingsPath = path.join(app.getPath('userData'), 'clara-settings.json');
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      shouldStartFullscreen = settings.startup?.startFullscreen ?? settings.fullscreen_startup ?? false;
      shouldStartMinimized = settings.startup?.startMinimized ?? false;
    }
  } catch (error) {
    log.error('Error reading startup preferences:', error);
    shouldStartFullscreen = false;
    shouldStartMinimized = false;
  }
  
  log.info(`Creating main window with fullscreen: ${shouldStartFullscreen}, minimized: ${shouldStartMinimized}`);
  
  mainWindow = new BrowserWindow({
    fullscreen: shouldStartFullscreen,
    width: shouldStartFullscreen ? undefined : 1200,
    height: shouldStartFullscreen ? undefined : 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      sandbox: false,
      webSecurity: false,
      experimentalFeatures: true
    },
    show: false,
    backgroundColor: '#0f0f23',
    frame: true
  });

  if (shouldStartMinimized) {
    mainWindow.minimize();
  }

  mainWindow.on('minimize', (event) => {
    if (process.platform !== 'darwin') {
      event.preventDefault();
      mainWindow.hide();
      const { tray } = require('./tray.cjs');
      if (tray && process.platform === 'win32') {
        try {
          tray.displayBalloon({
            iconType: 'info',
            title: 'ClaraVerse',
            content: 'ClaraVerse is still running in the background. Click the tray icon to restore.'
          });
        } catch (error) {
          log.warn('Failed to show balloon notification:', error);
        }
      }
    }
  });

  mainWindow.on('close', (event) => {
    const { isQuitting, tray } = require('./tray.cjs');
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      if (tray && process.platform === 'win32') {
        try {
          tray.displayBalloon({
            iconType: 'info',
            title: 'ClaraVerse',
            content: 'ClaraVerse is still running in the background. Click the tray icon to restore.'
          });
        } catch (error) {
          log.warn('Failed to show balloon notification:', error);
        }
      }
    }
  });

  createAppMenu(mainWindow);

  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const url = webContents.getURL();
    const { dockerSetup } = require('../services/service-initializer');
    const n8nPort = dockerSetup?.ports?.n8n;
    
    if (url.startsWith('http://localhost:5173') || url.startsWith('file://')) {
      log.info(`Granted '${permission}' permission for Clara app URL: ${url}`);
      callback(true);
      return;
    }
    
    if (n8nPort && url.startsWith(`http://localhost:${n8nPort}`)) { 
      log.info(`Granted '${permission}' permission for n8n URL: ${url}`);
      callback(true);
    } else {
      log.warn(`Blocked permission request '${permission}' for URL: ${url} (n8n port: ${n8nPort})`);
      callback(false);
    }
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    log.error(`did-fail-load: code=${errorCode}, desc=${errorDescription}, url=${validatedURL}, main=${isMainFrame}`);
  });
  mainWindow.webContents.on('render-process-gone', (_e, details) => {
    log.error('render-process-gone:', details);
  });
  mainWindow.webContents.on('console-message', (_e, level, message, line, sourceId) => {
    log.info(`[renderer console:${level}] ${message} (${sourceId}:${line})`);
  });

  if (process.env.NODE_ENV === 'development') {
    if (process.env.ELECTRON_HOT_RELOAD === 'true') {
      const devServerUrl = process.env.ELECTRON_START_URL || 'http://127.0.0.1:5173';
      log.info(`Dev env: ELECTRON_HOT_RELOAD=${process.env.ELECTRON_HOT_RELOAD}, ELECTRON_START_URL=${process.env.ELECTRON_START_URL || '(not set)'} -> using ${devServerUrl}`);

      const loadDevServer = (url, retries = 10, delay = 2000) => {
        mainWindow.loadURL(url).catch(err => {
          const attempt = (retriesMax, left) => (retriesMax - left + 1);
          const max = 10;
          log.error(`Failed to load dev server (attempt ${attempt(max, retries)}/${max}): ${err?.message || err}`);
          if (retries > 0 && mainWindow && !mainWindow.isDestroyed()) {
            log.info(`Retrying in ${delay / 1000}s... URL=${url}`);
            setTimeout(() => loadDevServer(url, retries - 1, delay), delay);
          } else if (mainWindow && !mainWindow.isDestroyed()) {
            log.error('All retries failed. Falling back to local file.');
            mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
          }
        });
      };

      loadDevServer(devServerUrl);
    } else {
      log.info('Loading development build from dist directory');
      mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
    }

    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.webContents.once('dom-ready', () => {
    log.info('Main window DOM ready, showing immediately (fast startup mode)');
    
    if (mainWindow && !mainWindow.isDestroyed()) {
      log.info('Showing main window (fast startup)');
      mainWindow.show();
    }
    
    setupAutoUpdater(mainWindow);
  });

  mainWindow.once('ready-to-show', () => {
    log.info('Main window ready-to-show event fired');
    if (mainWindow && !mainWindow.isVisible()) {
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
          log.info('Fallback: Showing main window via ready-to-show');
          mainWindow.show();
        }
      }, 3000);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

module.exports = {
  createMainWindow,
  get mainWindow() { return mainWindow; },
};