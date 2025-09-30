const { app, shell, clipboard, screen, globalShortcut, powerMonitor, systemPreferences } = require('electron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const log = require('electron-log');

class SystemControlService {
  constructor() {
    this.platform = process.platform;
    this.initialized = false;
    this.volumeLevel = 50; // Default volume
    this.brightnessLevel = 50; // Default brightness
    this.isLocked = false;
  }

  /**
   * Initialize the system control service
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      log.info('Initializing system control service...');

      // Initialize platform-specific features
      await this.initializePlatformFeatures();

      // Register global shortcuts for common operations
      this.registerGlobalShortcuts();

      // Get initial system state
      await this.getInitialSystemState();

      this.initialized = true;
      log.info('System control service initialized successfully');
    } catch (error) {
      log.error('Failed to initialize system control service:', error);
      throw error;
    }
  }

  /**
   * Initialize platform-specific features
   */
  async initializePlatformFeatures() {
    switch (this.platform) {
      case 'darwin': // macOS
        await this.initializeMacOS();
        break;
      case 'win32': // Windows
        await this.initializeWindows();
        break;
      case 'linux': // Linux
        await this.initializeLinux();
        break;
      default:
        log.warn(`Unsupported platform: ${this.platform}`);
    }
  }

  /**
   * Initialize macOS-specific features
   */
  async initializeMacOS() {
    try {
      // Request screen capture permissions
      const screenCaptureAllowed = await systemPreferences.getMediaAccessStatus('screen');
      if (screenCaptureAllowed !== 'granted') {
        log.info('Requesting screen capture permissions for macOS');
        // Note: This would typically be handled through user interaction
      }

      // Get initial volume
      try {
        const { execSync } = require('child_process');
        const volumeOutput = execSync('osascript -e "get volume settings"').toString();
        const volumeMatch = volumeOutput.match(/output volume:(\d+)/);
        if (volumeMatch) {
          this.volumeLevel = parseInt(volumeMatch[1]);
        }
      } catch (error) {
        log.warn('Could not get initial volume on macOS:', error);
      }
    } catch (error) {
      log.error('Failed to initialize macOS features:', error);
    }
  }

  /**
   * Initialize Windows-specific features
   */
  async initializeWindows() {
    try {
      // Windows-specific initialization
      log.info('Initializing Windows system features...');
    } catch (error) {
      log.error('Failed to initialize Windows features:', error);
    }
  }

  /**
   * Initialize Linux-specific features
   */
  async initializeLinux() {
    try {
      // Linux-specific initialization
      log.info('Initializing Linux system features...');
    } catch (error) {
      log.error('Failed to initialize Linux features:', error);
    }
  }

  /**
   * Register global shortcuts
   */
  registerGlobalShortcuts() {
    try {
      // Register shortcuts for quick actions
      globalShortcut.register('CommandOrControl+Shift+V', () => {
        this.takeScreenshot();
      });

      globalShortcut.register('CommandOrControl+Shift+L', () => {
        this.lockScreen();
      });

      globalShortcut.register('CommandOrControl+Shift+M', () => {
        this.muteVolume();
      });

      log.info('Global shortcuts registered');
    } catch (error) {
      log.error('Failed to register global shortcuts:', error);
    }
  }

  /**
   * Get initial system state
   */
  async getInitialSystemState() {
    try {
      this.volumeLevel = await this.getSystemVolume();
      log.info(`Initial volume level: ${this.volumeLevel}%`);
    } catch (error) {
      log.warn('Could not get initial system state:', error);
    }
  }

  /**
   * Lock the screen
   */
  async lockScreen() {
    if (this.isLocked) {
      return { success: false, message: 'Screen is already locked' };
    }

    try {
      switch (this.platform) {
        case 'darwin':
          exec('osascript -e "tell application \\"System Events\\" to keystroke \\"q\\" using {control down, command down}"');
          break;
        case 'win32':
          exec('rundll32.exe user32.dll,LockWorkStation');
          break;
        case 'linux':
          // Try different Linux lock commands
          exec('gnome-screensaver-command -l || xscreensaver-command -lock || loginctl lock-session');
          break;
        default:
          return { success: false, message: 'Unsupported platform for screen lock' };
      }

      this.isLocked = true;
      log.info('Screen locked successfully');
      return { success: true, message: 'Screen locked successfully' };
    } catch (error) {
      log.error('Failed to lock screen:', error);
      return { success: false, message: `Failed to lock screen: ${error.message}` };
    }
  }

  /**
   * Take a screenshot
   */
  async takeScreenshot(options = {}) {
    try {
      const {
        captureArea = 'screen', // 'screen', 'window', 'area'
        format = 'png',
        savePath = null,
        clipboard = true
      } = options;

      let screenshotPath;

      switch (this.platform) {
        case 'darwin':
          screenshotPath = await this.takeScreenshotMacOS(captureArea, format, savePath);
          break;
        case 'win32':
          screenshotPath = await this.takeScreenshotWindows(captureArea, format, savePath);
          break;
        case 'linux':
          screenshotPath = await this.takeScreenshotLinux(captureArea, format, savePath);
          break;
        default:
          return { success: false, message: 'Unsupported platform for screenshots' };
      }

      // Copy to clipboard if requested
      if (clipboard && screenshotPath) {
        await this.copyImageToClipboard(screenshotPath);
      }

      log.info('Screenshot taken successfully:', screenshotPath);
      return {
        success: true,
        message: 'Screenshot taken successfully',
        path: screenshotPath
      };
    } catch (error) {
      log.error('Failed to take screenshot:', error);
      return { success: false, message: `Failed to take screenshot: ${error.message}` };
    }
  }

  /**
   * Take screenshot on macOS
   */
  async takeScreenshotMacOS(captureArea, format, savePath) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = savePath || `/tmp/claraverse-screenshot-${timestamp}.png`;

    let command;
    switch (captureArea) {
      case 'screen':
        command = `screencapture -x "${filename}"`;
        break;
      case 'window':
        command = `screencapture -x -W "${filename}"`;
        break;
      case 'area':
        command = `screencapture -x -i "${filename}"`;
        break;
      default:
        command = `screencapture -x "${filename}"`;
    }

    return new Promise((resolve, reject) => {
      exec(command, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve(filename);
        }
      });
    });
  }

  /**
   * Take screenshot on Windows
   */
  async takeScreenshotWindows(captureArea, format, savePath) {
    // This would require additional Windows-specific tools
    // For now, return a placeholder
    return new Promise((resolve, reject) => {
      reject(new Error('Windows screenshot not yet implemented'));
    });
  }

  /**
   * Take screenshot on Linux
   */
  async takeScreenshotLinux(captureArea, format, savePath) {
    // This would require tools like scrot, imagemagick, etc.
    // For now, return a placeholder
    return new Promise((resolve, reject) => {
      reject(new Error('Linux screenshot not yet implemented'));
    });
  }

  /**
   * Copy image to clipboard
   */
  async copyImageToClipboard(imagePath) {
    try {
      const { clipboard } = require('electron');
      const nativeImage = require('electron').nativeImage;

      const image = nativeImage.createFromPath(imagePath);
      clipboard.writeImage(image);

      return { success: true, message: 'Image copied to clipboard' };
    } catch (error) {
      log.error('Failed to copy image to clipboard:', error);
      return { success: false, message: 'Failed to copy image to clipboard' };
    }
  }

  /**
   * Set system volume
   */
  async setVolume(level) {
    if (level < 0 || level > 100) {
      return { success: false, message: 'Volume level must be between 0 and 100' };
    }

    try {
      switch (this.platform) {
        case 'darwin':
          exec(`osascript -e "set volume output volume ${level}"`);
          break;
        case 'win32':
          // This would require Windows-specific volume control
          return { success: false, message: 'Windows volume control not yet implemented' };
        case 'linux':
          // This would require Linux-specific volume control (pulseaudio, alsa, etc.)
          return { success: false, message: 'Linux volume control not yet implemented' };
        default:
          return { success: false, message: 'Unsupported platform for volume control' };
      }

      this.volumeLevel = level;
      log.info(`Volume set to ${level}%`);
      return { success: true, message: `Volume set to ${level}%` };
    } catch (error) {
      log.error('Failed to set volume:', error);
      return { success: false, message: `Failed to set volume: ${error.message}` };
    }
  }

  /**
   * Get current system volume
   */
  async getSystemVolume() {
    try {
      switch (this.platform) {
        case 'darwin':
          const { execSync } = require('child_process');
          const output = execSync('osascript -e "get volume settings"').toString();
          const match = output.match(/output volume:(\d+)/);
          return match ? parseInt(match[1]) : this.volumeLevel;
        case 'win32':
          return this.volumeLevel; // Placeholder
        case 'linux':
          return this.volumeLevel; // Placeholder
        default:
          return this.volumeLevel;
      }
    } catch (error) {
      log.warn('Could not get system volume:', error);
      return this.volumeLevel;
    }
  }

  /**
   * Mute system volume
   */
  async muteVolume() {
    return await this.setVolume(0);
  }

  /**
   * Unmute system volume
   */
  async unmuteVolume() {
    return await this.setVolume(this.volumeLevel);
  }

  /**
   * Toggle mute
   */
  async toggleMute() {
    const currentVolume = await this.getSystemVolume();
    if (currentVolume === 0) {
      return await this.unmuteVolume();
    } else {
      return await this.muteVolume();
    }
  }

  /**
   * Adjust screen brightness
   */
  async setBrightness(level) {
    if (level < 0 || level > 100) {
      return { success: false, message: 'Brightness level must be between 0 and 100' };
    }

    try {
      switch (this.platform) {
        case 'darwin':
          exec(`osascript -e "tell application \\"System Events\\" to set brightness to ${level / 100}"`);
          break;
        case 'win32':
          return { success: false, message: 'Windows brightness control not yet implemented' };
        case 'linux':
          return { success: false, message: 'Linux brightness control not yet implemented' };
        default:
          return { success: false, message: 'Unsupported platform for brightness control' };
      }

      this.brightnessLevel = level;
      log.info(`Brightness set to ${level}%`);
      return { success: true, message: `Brightness set to ${level}%` };
    } catch (error) {
      log.error('Failed to set brightness:', error);
      return { success: false, message: `Failed to set brightness: ${error.message}` };
    }
  }

  /**
   * Launch application
   */
  async launchApplication(appName) {
    try {
      switch (this.platform) {
        case 'darwin':
          // Try to launch application by name
          exec(`open -a "${appName}"`);
          break;
        case 'win32':
          exec(`start "" "${appName}"`);
          break;
        case 'linux':
          exec(`${appName}`);
          break;
        default:
          return { success: false, message: 'Unsupported platform for launching applications' };
      }

      log.info(`Launched application: ${appName}`);
      return { success: true, message: `Launched ${appName}` };
    } catch (error) {
      log.error(`Failed to launch application ${appName}:`, error);
      return { success: false, message: `Failed to launch ${appName}: ${error.message}` };
    }
  }

  /**
   * Open file or folder
   */
  async openPath(filePath) {
    try {
      const resolvedPath = path.resolve(filePath);
      await shell.openPath(resolvedPath);
      return { success: true, message: `Opened ${filePath}` };
    } catch (error) {
      log.error(`Failed to open path ${filePath}:`, error);
      return { success: false, message: `Failed to open ${filePath}: ${error.message}` };
    }
  }

  /**
   * Create folder
   */
  async createFolder(folderPath) {
    try {
      const resolvedPath = path.resolve(folderPath);
      await fs.mkdir(resolvedPath, { recursive: true });
      return { success: true, message: `Created folder ${folderPath}` };
    } catch (error) {
      log.error(`Failed to create folder ${folderPath}:`, error);
      return { success: false, message: `Failed to create folder: ${error.message}` };
    }
  }

  /**
   * Get system information
   */
  async getSystemInfo() {
    try {
      const info = {
        platform: this.platform,
        version: os.release(),
        arch: os.arch(),
        hostname: os.hostname(),
        uptime: os.uptime(),
        memory: {
          total: os.totalmem(),
          free: os.freemem()
        },
        cpus: os.cpus().length
      };

      return { success: true, data: info };
    } catch (error) {
      log.error('Failed to get system info:', error);
      return { success: false, message: `Failed to get system info: ${error.message}` };
    }
  }

  /**
   * Execute system command
   */
  async executeCommand(command, options = {}) {
    const {
      timeout = 30000,
      cwd = process.cwd(),
      env = process.env
    } = options;

    return new Promise((resolve) => {
      exec(command, { timeout, cwd, env }, (error, stdout, stderr) => {
        if (error) {
          resolve({
            success: false,
            message: `Command failed: ${error.message}`,
            error: error.message,
            stderr: stderr
          });
        } else {
          resolve({
            success: true,
            message: 'Command executed successfully',
            stdout: stdout,
            stderr: stderr
          });
        }
      });
    });
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown() {
    try {
      // Unregister global shortcuts
      globalShortcut.unregisterAll();

      // Platform-specific cleanup
      switch (this.platform) {
        case 'darwin':
          // macOS cleanup
          break;
        case 'win32':
          // Windows cleanup
          break;
        case 'linux':
          // Linux cleanup
          break;
      }

      this.initialized = false;
      log.info('System control service shutdown complete');
    } catch (error) {
      log.error('Error during system control service shutdown:', error);
    }
  }
}

module.exports = SystemControlService;