const { Tray, Menu, nativeImage, app } = require('electron');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');

let tray = null;
let isQuitting = false;

function createTray() {
  if (tray) return;
  
  try {
    const possibleLogoPaths = [
      path.join(__dirname, '../assets', 'tray-icon.png'),
      path.join(__dirname, '../../public/logo.png'),
      path.join(__dirname, '../../src/assets/logo.png'),
      path.join(__dirname, '../../assets/icons/logo.png'),
      path.join(__dirname, '../../assets/icons/png/logo.png')
    ];
    
    let trayIcon;
    let logoFound = false;
    
    for (const logoPath of possibleLogoPaths) {
      if (fs.existsSync(logoPath)) {
        try {
          trayIcon = nativeImage.createFromPath(logoPath);
          
          if (process.platform === 'darwin') {
            trayIcon = trayIcon.resize({ width: 16, height: 16 });
            trayIcon.setTemplateImage(true);
          } else if (process.platform === 'win32') {
            trayIcon = trayIcon.resize({ width: 16, height: 16 });
          } else {
            trayIcon = trayIcon.resize({ width: 22, height: 22 });
          }
          
          logoFound = true;
          log.info(`Using logo from: ${logoPath}`);
          break;
        } catch (error) {
          log.warn(`Failed to load logo from ${logoPath}:`, error);
        }
      }
    }
    
    if (!logoFound) {
      log.info('Logo file not found, creating programmatic icon');
      const iconSize = process.platform === 'darwin' ? 16 : (process.platform === 'win32' ? 16 : 22);
      
      if (process.platform === 'darwin') {
        const canvas = `
          <svg width="${iconSize}" height="${iconSize}" xmlns="http://www.w3.org/2000/svg">
            <circle cx="${iconSize/2}" cy="${iconSize/2}" r="${iconSize/2 - 2}" fill="black" stroke="black" stroke-width="1"/>
            <text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="white" font-size="${iconSize-8}" font-family="Arial" font-weight="bold">C</text>
          </svg>
        `;
        trayIcon = nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(canvas).toString('base64')}`);
        trayIcon.setTemplateImage(true);
      } else {
        const canvas = `
          <svg width="${iconSize}" height="${iconSize}" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#FF1B6B;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#3A3A5C;stop-opacity:1" />
              </linearGradient>
            </defs>
            <circle cx="${iconSize/2}" cy="${iconSize/2}" r="${iconSize/2 - 1}" fill="url(#grad1)" stroke="#FF1B6B" stroke-width="1"/>
            <text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="white" font-size="${iconSize-8}" font-family="Arial" font-weight="bold">C</text>
          </svg>
        `;
        trayIcon = nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(canvas).toString('base64')}`);
      }
    }
    
    tray = new Tray(trayIcon);
    
    tray.setToolTip('ClaraVerse');
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show ClaraVerse',
        click: () => {
          const { mainWindow, createMainWindow } = require('./window-manager');
          if (mainWindow) {
            if (mainWindow.isMinimized()) {
              mainWindow.restore();
            }
            mainWindow.show();
            mainWindow.focus();
          } else {
            createMainWindow();
          }
        }
      },
      {
        label: 'Hide ClaraVerse',
        click: () => {
          const { mainWindow } = require('./window-manager');
          if (mainWindow) {
            mainWindow.hide();
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ]);
    
    tray.setContextMenu(contextMenu);
    
    tray.on('click', () => {
      const { mainWindow, createMainWindow } = require('./window-manager');
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          if (mainWindow.isMinimized()) {
            mainWindow.restore();
          }
          mainWindow.show();
          mainWindow.focus();
        }
      } else {
        createMainWindow();
      }
    });
    
    tray.on('double-click', () => {
      const { mainWindow, createMainWindow } = require('./window-manager');
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.show();
        mainWindow.focus();
      } else {
        createMainWindow();
      }
    });
    
    log.info('System tray created successfully');
  } catch (error) {
    log.error('Error creating system tray:', error);
  }
}

module.exports = {
  createTray,
  get tray() { return tray; },
  get isQuitting() { return isQuitting; },
  set isQuitting(value) { isQuitting = value; },
};