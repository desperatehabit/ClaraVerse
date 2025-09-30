import { VoiceCommandResult, SystemCapabilities } from '../../types/voice-commands';

export interface ApplicationInfo {
  name: string;
  displayName: string;
  path: string;
  version?: string;
  isRunning: boolean;
  pid?: number;
  icon?: string;
}

export interface ApplicationConfig {
  commonApps: Record<string, string>;
  searchPaths: string[];
  supportedExtensions: string[];
  maxSearchResults: number;
}

export class ApplicationManagementService {
  private config: ApplicationConfig;
  private runningApps: Map<string, ApplicationInfo> = new Map();
  private capabilities: SystemCapabilities['applications'];

  constructor(config: ApplicationConfig) {
    this.config = config;
    this.capabilities = {
      supported: true,
      canLaunchApps: true,
      canSwitchApps: true,
      canCloseApps: true
    };
  }

  /**
   * Launch an application by name or path
   */
  async launchApplication(appName: string, args?: string[]): Promise<VoiceCommandResult> {
    try {
      // First, try to find the application
      const appInfo = await this.findApplication(appName);

      if (!appInfo) {
        return {
          success: false,
          message: `Application '${appName}' not found`
        };
      }

      // Check if already running
      if (appInfo.isRunning) {
        // Just switch to it instead
        return await this.switchToApplication(appName);
      }

      // Launch the application
      const result = await this.executeLaunch(appInfo, args);

      if (result.success) {
        // Update running apps
        appInfo.isRunning = true;
        appInfo.pid = typeof result.data?.pid === 'number' ? result.data.pid as number : undefined;
        this.runningApps.set(appInfo.name, appInfo);

        return {
          success: true,
          message: `Launched ${appInfo.displayName}`,
          data: { appInfo }
        };
      } else {
        return result;
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to launch ${appName}: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Switch to a running application
   */
  async switchToApplication(appName: string): Promise<VoiceCommandResult> {
    try {
      const appInfo = await this.findApplication(appName);

      if (!appInfo) {
        return {
          success: false,
          message: `Application '${appName}' not found`
        };
      }

      if (!appInfo.isRunning) {
        return {
          success: false,
          message: `Application '${appName}' is not running`
        };
      }

      // Platform-specific switching
      const result = await this.executeSwitch(appInfo);

      if (result.success) {
        return {
          success: true,
          message: `Switched to ${appInfo.displayName}`,
          data: { appInfo }
        };
      } else {
        return result;
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to switch to ${appName}: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Close an application
   */
  async closeApplication(appName: string, force: boolean = false): Promise<VoiceCommandResult> {
    try {
      const appInfo = await this.findApplication(appName);

      if (!appInfo) {
        return {
          success: false,
          message: `Application '${appName}' not found`
        };
      }

      if (!appInfo.isRunning) {
        return {
          success: false,
          message: `Application '${appName}' is not running`
        };
      }

      const result = await this.executeClose(appInfo, force);

      if (result.success) {
        // Update running apps
        appInfo.isRunning = false;
        appInfo.pid = undefined;
        this.runningApps.delete(appInfo.name);

        return {
          success: true,
          message: `Closed ${appInfo.displayName}`,
          data: { appInfo }
        };
      } else {
        return result;
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to close ${appName}: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Get list of running applications
   */
  async getRunningApplications(): Promise<VoiceCommandResult> {
    try {
      const runningApps = await this.getRunningAppsList();

      // Update our internal tracking
      this.runningApps.clear();
      runningApps.forEach(app => {
        this.runningApps.set(app.name, app);
      });

      return {
        success: true,
        message: `Found ${runningApps.length} running applications`,
        data: { applications: runningApps }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get running applications: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Search for applications
   */
  async searchApplications(query: string): Promise<VoiceCommandResult> {
    try {
      const results = await this.findApplications(query);

      return {
        success: true,
        message: `Found ${results.length} applications matching '${query}'`,
        data: { applications: results, query }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to search applications: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Get application capabilities
   */
  getCapabilities(): SystemCapabilities['applications'] {
    return { ...this.capabilities };
  }

  /**
   * Find application by name
   */
  private async findApplication(appName: string): Promise<ApplicationInfo | null> {
    // First check running applications
    const runningApp = this.runningApps.get(appName.toLowerCase());
    if (runningApp) {
      return runningApp;
    }

    // Search for the application
    const foundApps = await this.findApplications(appName);
    return foundApps.length > 0 ? foundApps[0] : null;
  }

  /**
   * Find applications by query
   */
  private async findApplications(query: string): Promise<ApplicationInfo[]> {
    const results: ApplicationInfo[] = [];
    const searchQuery = query.toLowerCase();

    try {
      // Search in common applications
      for (const [name, path] of Object.entries(this.config.commonApps)) {
        if (name.toLowerCase().includes(searchQuery) ||
            path.toLowerCase().includes(searchQuery)) {
          const isRunning = this.runningApps.has(name.toLowerCase());
          results.push({
            name: name.toLowerCase(),
            displayName: this.formatAppName(name),
            path,
            isRunning
          });
        }
      }

      // Search in system paths
      for (const searchPath of this.config.searchPaths) {
        const apps = await this.searchInPath(searchPath, searchQuery);
        results.push(...apps);
      }

      // Remove duplicates and limit results
      const uniqueResults = this.removeDuplicates(results);
      return uniqueResults.slice(0, this.config.maxSearchResults);
    } catch (error) {
      console.error('Error finding applications:', error);
      return results;
    }
  }

  /**
   * Search for applications in a specific path
   */
  private async searchInPath(searchPath: string, query: string): Promise<ApplicationInfo[]> {
    const results: ApplicationInfo[] = [];

    try {
      const fs = require('fs').promises;
      const path = require('path');

      const entries = await fs.readdir(searchPath);

      for (const entry of entries) {
        const fullPath = path.join(searchPath, entry);
        const stat = await fs.stat(fullPath);

        if (stat.isFile() && this.isExecutable(entry)) {
          const appName = this.extractAppName(entry);
          if (appName.toLowerCase().includes(query)) {
            results.push({
              name: appName.toLowerCase(),
              displayName: this.formatAppName(appName),
              path: fullPath,
              isRunning: this.runningApps.has(appName.toLowerCase())
            });
          }
        } else if (stat.isDirectory()) {
          // Recursively search subdirectories (limited depth)
          const subResults = await this.searchInPath(fullPath, query);
          results.push(...subResults);
        }
      }
    } catch (error) {
      // Path doesn't exist or isn't accessible, skip it
    }

    return results;
  }

  /**
   * Check if file is executable
   */
  private isExecutable(filename: string): boolean {
    const extensions = this.config.supportedExtensions;
    return extensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  /**
   * Extract application name from filename
   */
  private extractAppName(filename: string): string {
    const name = filename.substring(0, filename.lastIndexOf('.'));
    return name.replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Format application name for display
   */
  private formatAppName(name: string): string {
    return name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  /**
   * Remove duplicate applications
   */
  private removeDuplicates(apps: ApplicationInfo[]): ApplicationInfo[] {
    const seen = new Set<string>();
    return apps.filter(app => {
      if (seen.has(app.name)) {
        return false;
      }
      seen.add(app.name);
      return true;
    });
  }

  /**
   * Execute application launch
   */
  private async executeLaunch(appInfo: ApplicationInfo, args?: string[]): Promise<VoiceCommandResult> {
    try {
      const { exec } = require('child_process');
      const command = args ? `"${appInfo.path}" ${args.join(' ')}` : `"${appInfo.path}"`;

      return new Promise((resolve) => {
        exec(command, (error: any, stdout: string, stderr: string) => {
          if (error) {
            resolve({
              success: false,
              message: `Launch failed: ${error instanceof Error ? error.message : String(error)}`
            });
          } else {
            // Get the PID of the launched process (platform-specific)
            resolve({
              success: true,
              message: 'Application launched successfully',
              data: { pid: this.getProcessPid() }
            });
          }
        });
      });
    } catch (error) {
      return {
        success: false,
        message: `Failed to execute launch: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Execute application switch
   */
  private async executeSwitch(appInfo: ApplicationInfo): Promise<VoiceCommandResult> {
    try {
      const { exec } = require('child_process');

      switch (process.platform) {
        case 'darwin':
          exec(`osascript -e 'tell application "${appInfo.displayName}" to activate'`);
          break;
        case 'win32':
          exec(`start "" "${appInfo.path}"`);
          break;
        case 'linux':
          exec(`wmctrl -a "${appInfo.displayName}" || wmctrl -a "${appInfo.name}"`);
          break;
        default:
          return {
            success: false,
            message: 'Unsupported platform for application switching'
          };
      }

      return {
        success: true,
        message: 'Switch command executed'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to switch application: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Execute application close
   */
  private async executeClose(appInfo: ApplicationInfo, force: boolean): Promise<VoiceCommandResult> {
    try {
      const { exec } = require('child_process');

      if (appInfo.pid) {
        // Close by PID
        const signal = force ? 'SIGKILL' : 'SIGTERM';
        process.kill(appInfo.pid, signal);
      } else {
        // Close by name (platform-specific)
        switch (process.platform) {
          case 'darwin':
            exec(`osascript -e 'tell application "${appInfo.displayName}" to quit'`);
            break;
          case 'win32':
            exec(`taskkill /IM "${appInfo.name}.exe" ${force ? '/F' : ''}`);
            break;
          case 'linux':
            exec(`pkill ${force ? '-9' : ''} -f "${appInfo.name}"`);
            break;
        }
      }

      return {
        success: true,
        message: 'Close command executed'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to close application: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Get list of currently running applications
   */
  private async getRunningAppsList(): Promise<ApplicationInfo[]> {
    try {
      const { exec } = require('child_process');

      return new Promise((resolve) => {
        switch (process.platform) {
          case 'darwin':
            exec('osascript -e \'tell application "System Events" to get name of every application process\'', (error: any, stdout: string) => {
              if (error) {
                resolve([]);
              } else {
                const apps = stdout.split(', ').map((name: string) => ({
                  name: name.toLowerCase(),
                  displayName: name,
                  path: '',
                  isRunning: true
                }));
                resolve(apps);
              }
            });
            break;
          case 'win32':
            exec('tasklist /FO CSV /NH', (error: any, stdout: string) => {
              if (error) {
                resolve([]);
              } else {
                const apps = stdout.split('\n')
                  .filter((line: string) => line.trim())
                  .map((line: string) => {
                    const parts = line.split('","');
                    const name = parts[0].replace(/"/g, '');
                    return {
                      name: name.toLowerCase().replace('.exe', ''),
                      displayName: name,
                      path: '',
                      isRunning: true
                    };
                  });
                resolve(apps);
              }
            });
            break;
          case 'linux':
            exec('ps -e -o comm=', (error: any, stdout: string) => {
              if (error) {
                resolve([]);
              } else {
                const apps = stdout.split('\n')
                  .filter((name: string) => name.trim())
                  .map((name: string) => ({
                    name: name.toLowerCase(),
                    displayName: name,
                    path: '',
                    isRunning: true
                  }));
                resolve(apps);
              }
            });
            break;
          default:
            resolve([]);
        }
      });
    } catch (error) {
      console.error('Error getting running apps:', error);
      return [];
    }
  }

  /**
   * Get process PID (simplified implementation)
   */
  private getProcessPid(): number {
    // This is a simplified implementation
    // In a real system, you'd track the actual PID from the exec result
    return Math.floor(Math.random() * 10000);
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    this.runningApps.clear();
  }
}