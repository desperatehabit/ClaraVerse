const { ipcMain, dialog, app, systemPreferences, shell, desktopCapturer } = require('electron');
const log = require('electron-log');
const path = require('path');
const fs = require('fs');
const { checkForUpdates, getUpdateInfo, checkLlamacppUpdates, updateLlamacppBinaries } = require('../updateService.cjs');
const FeatureSelectionScreen = require('../featureSelection.cjs');
const PlatformManager = require('../platformManager.cjs');

function registerAppHandlers(ipcLogger, dockerSetup, llamaSwapService, mcpService, watchdogService) {
  const { TaskService } = require('../services/taskService.cjs');
  const dbPath = path.join(app.getPath('userData'), 'clara_tasks.db');
  const taskService = TaskService.getInstance(dbPath);
  ipcMain.handle('new-chat', async () => {
    log.info('New chat requested via IPC');
    return { success: true };
  });
  
  ipcMain.handle('show-open-dialog', async (_event, options) => {
    console.log('[main] show-open-dialog handler called with options:', options);
    try {
      return await dialog.showOpenDialog(options);
    } catch (error) {
      log.error('Error showing open dialog:', error);
      return { canceled: true, filePaths: [] };
    }
  });

  ipcMain.handle('get-app-path', () => app.getPath('userData'));
  ipcMain.handle('getWorkflowsPath', () => {
    return path.join(app.getAppPath(), 'workflows', 'n8n_workflows_full.json');
  });

  ipcMain.handle('developer-logs:read', async (event, lines = 1000) => {
    try {
      if (!ipcLogger) {
        return 'IPC Logger not initialized';
      }
      return await ipcLogger.readLogs(lines);
    } catch (error) {
      log.error('Error reading developer logs:', error);
      return `Error reading logs: ${error.message}`;
    }
  });

  ipcMain.handle('developer-logs:get-files', async () => {
    try {
      if (!ipcLogger) {
        return [];
      }
      return await ipcLogger.getLogFiles();
    } catch (error) {
      log.error('Error getting log files:', error);
      return [];
    }
  });

  ipcMain.handle('developer-logs:clear', async () => {
    try {
      if (!ipcLogger) {
        return { success: false, error: 'IPC Logger not initialized' };
      }
      return await ipcLogger.clearLogs();
    } catch (error) {
      log.error('Error clearing logs:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-initialization-state', async () => {
    return {
      needsFeatureSelection: global.needsFeatureSelection || false,
      selectedFeatures: global.selectedFeatures || null,
      systemConfig: global.systemConfig || null,
      dockerAvailable: dockerSetup ? await dockerSetup.isDockerRunning() : false,
      servicesStatus: {
        llamaSwap: llamaSwapService ? llamaSwapService.isRunning : false,
        mcp: mcpService ? true : false,
        docker: dockerSetup ? true : false,
        watchdog: watchdogService ? watchdogService.isRunning : false
      }
    };
  });
  
  ipcMain.handle('save-feature-selection', async (event, features) => {
    try {
      const featureSelection = new FeatureSelectionScreen();
      featureSelection.saveConfig(features);
      global.selectedFeatures = features;
      global.needsFeatureSelection = false;
      return { success: true };
    } catch (error) {
      log.error('Error saving feature selection:', error);
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle('initialize-service', async (event, serviceName) => {
    try {
      const sendUpdate = (status, message) => {
        event.sender.send('service-init-progress', { service: serviceName, status, message });
      };
      
      switch(serviceName) {
        case 'docker':
          if (!dockerSetup) dockerSetup = new DockerSetup();
          const dockerAvailable = await dockerSetup.isDockerRunning();
          if (!dockerAvailable) {
            throw new Error('Docker is not running');
          }
          await dockerSetup.setup(global.selectedFeatures, (status) => {
            sendUpdate('progress', status);
          });
          break;
          
        case 'llamaSwap':
          if (!llamaSwapService) llamaSwapService = new LlamaSwapService(ipcLogger);
          await llamaSwapService.start();
          break;
          
        case 'mcp':
          if (!mcpService) mcpService = new MCPService();
          await mcpService.startAllEnabledServers();
          break;
          
        case 'watchdog':
          if (!watchdogService && dockerSetup?.docker) {
            watchdogService = new WatchdogService(dockerSetup, llamaSwapService, mcpService);
            watchdogService.start();
          }
          break;
      }
      
      return { success: true };
    } catch (error) {
      log.error(`Error initializing service ${serviceName}:`, error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('check-for-updates', () => {
    return checkForUpdates();
  });

  ipcMain.handle('get-update-info', () => {
    return getUpdateInfo();
  });

  ipcMain.handle('check-llamacpp-updates', () => {
    return checkLlamacppUpdates();
  });

  ipcMain.handle('update-llamacpp-binaries', () => {
    return updateLlamacppBinaries();
  });

  ipcMain.handle('start-in-app-download', async (event, updateInfo) => {
    try {
      const { enhancedPlatformUpdateService } = require('../updateService.cjs');
      
      if (!enhancedPlatformUpdateService) {
        throw new Error('Enhanced update service not available');
      }

      const result = await enhancedPlatformUpdateService.startInAppDownload(updateInfo);
      
      const { mainWindow } = require('../main/window-manager');
      if (result.success && result.filePath) {
        mainWindow.webContents.send('update-download-completed', {
          filePath: result.filePath,
          fileName: result.fileName
        });

        const response = await dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: '✅ Download Complete!',
          message: `Clara ${updateInfo.latestVersion} has been downloaded`,
          detail: `The installer has been saved to:\n${result.filePath}\n\nWould you like to open it now?`,
          buttons: ['Open Installer', 'Open Downloads Folder', 'Later'],
          defaultId: 0
        });

        if (response.response === 0) {
          shell.openPath(result.filePath);
        } else if (response.response === 1) {
          shell.showItemInFolder(result.filePath);
        }
      } else if (!result.success) {
        mainWindow.webContents.send('update-download-error', {
          error: result.error
        });
      }
      
      return result;
    } catch (error) {
      log.error('Error starting in-app download:', error);
      
      const { mainWindow } = require('../main/window-manager');
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('update-download-error', {
          error: error.message
        });
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  });

  ipcMain.handle('request-microphone-permission', async () => {
    if (process.platform === 'darwin') {
      const status = await systemPreferences.getMediaAccessStatus('microphone');
      if (status === 'not-determined') {
        return await systemPreferences.askForMediaAccess('microphone');
      }
      return status === 'granted';
    }
    return true;
  });

  ipcMain.handle('get-service-ports', () => {
    if (dockerSetup && dockerSetup.ports) {
      return dockerSetup.ports;
    }
    return null;
  });

  ipcMain.handle('get-python-port', () => {
    if (dockerSetup && dockerSetup.ports && dockerSetup.ports.python) {
      return dockerSetup.ports.python;
    }
    return null;
  });

  ipcMain.handle('check-python-backend', async () => {
    try {
      if (!dockerSetup || !dockerSetup.ports || !dockerSetup.ports.python) {
        return { status: 'error', message: 'Python backend not configured' };
      }

      const isRunning = await dockerSetup.isPythonRunning();
      if (!isRunning) {
        return { status: 'error', message: 'Python backend container not running' };
      }

      return {
        status: 'running',
        port: dockerSetup.ports.python
      };
    } catch (error) {
      log.error('Error checking Python backend:', error);
      return { status: 'error', message: error.message };
    }
  });

  ipcMain.handle('check-docker-services', async () => {
    try {
      if (!dockerSetup) {
        return { 
          dockerAvailable: false, 
          n8nAvailable: false,
          pythonAvailable: false,
          comfyuiAvailable: false,
          message: 'Docker setup not initialized' 
        };
      }

      const dockerRunning = await dockerSetup.isDockerRunning();
      if (!dockerRunning) {
        return { 
          dockerAvailable: false, 
          n8nAvailable: false,
          pythonAvailable: false,
          comfyuiAvailable: false,
          message: 'Docker is not running' 
        };
      }

      let n8nRunning = false;
      let comfyuiRunning = false;
      
      const { serviceConfigManager } = require('../services/service-initializer.cjs');
      if (serviceConfigManager && typeof serviceConfigManager.getServiceMode === 'function') {
        try {
          const n8nMode = serviceConfigManager.getServiceMode('n8n');
          if (n8nMode === 'manual' && typeof serviceConfigManager.getServiceUrl === 'function') {
            const n8nUrl = serviceConfigManager.getServiceUrl('n8n');
            if (n8nUrl) {
              try {
                const { createManualHealthCheck } = require('../serviceDefinitions.cjs');
                const healthCheck = createManualHealthCheck(n8nUrl, '/');
                n8nRunning = await healthCheck();
                log.debug(`🔗 N8N manual service health: ${n8nRunning}`);
              } catch (error) {
                log.debug(`N8N manual health check failed: ${error.message}`);
                n8nRunning = false;
              }
            }
          } else {
            n8nRunning = await dockerSetup.checkN8NHealth().then(result => result.success).catch(() => false);
          }
          
          const comfyuiMode = serviceConfigManager.getServiceMode('comfyui');
          if (comfyuiMode === 'manual' && typeof serviceConfigManager.getServiceUrl === 'function') {
            const comfyuiUrl = serviceConfigManager.getServiceUrl('comfyui');
            if (comfyuiUrl) {
              try {
                const { createManualHealthCheck } = require('../serviceDefinitions.cjs');
                const healthCheck = createManualHealthCheck(comfyuiUrl, '/');
                comfyuiRunning = await healthCheck();
                log.debug(`🔗 ComfyUI manual service health: ${comfyuiRunning}`);
              } catch (error) {
                log.debug(`ComfyUI manual health check failed: ${error.message}`);
                comfyuiRunning = false;
              }
            }
          } else {
            comfyuiRunning = await dockerSetup.isComfyUIRunning().catch(() => false);
          }
        } catch (configError) {
          log.warn('Error getting service configs, using Docker fallback:', configError.message);
          n8nRunning = await dockerSetup.checkN8NHealth().then(result => result.success).catch(() => false);
          comfyuiRunning = await dockerSetup.isComfyUIRunning().catch(() => false);
        }
      } else {
        n8nRunning = await dockerSetup.checkN8NHealth().then(result => result.success).catch(() => false);
        comfyuiRunning = await dockerSetup.isComfyUIRunning().catch(() => false);
      }
      
      const pythonRunning = await dockerSetup.isPythonRunning().catch(() => false);

      return {
        dockerAvailable: true,
        n8nAvailable: n8nRunning,
        pythonAvailable: pythonRunning,
        comfyuiAvailable: comfyuiRunning,
        ports: dockerSetup.ports
      };
    } catch (error) {
      log.error('Error checking Docker services:', error);
      return { 
        dockerAvailable: false, 
        n8nAvailable: false,
        pythonAvailable: false,
        comfyuiAvailable: false,
        message: error.message 
      };
    }
  });

  ipcMain.handle('get-python-backend-info', async () => {
    try {
      if (!dockerSetup) {
        throw new Error('Docker setup not initialized');
      }
      
      return dockerSetup.getPythonBackendInfo();
    } catch (error) {
      log.error('Error getting Python backend info:', error);
      return { error: error.message };
    }
  });

  ipcMain.handle('docker-check-updates', async () => {
    try {
      if (!dockerSetup) {
        throw new Error('Docker not initialized');
      }
      
      return await dockerSetup.checkForUpdates((status) => {
        log.info('Update check:', status);
      });
    } catch (error) {
      log.error('Error checking for updates:', error);
      throw error;
    }
  });

  ipcMain.handle('get-system-info', async () => {
    try {
      const os = require('os');
      return {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        hostname: os.hostname(),
        release: os.release(),
        type: os.type()
      };
    } catch (error) {
      log.error('Error getting system info:', error);
      return { error: error.message };
    }
  });

  ipcMain.handle('get-system-config', async () => {
    try {
      if (global.systemConfig) {
        log.info('✅ Returning cached system configuration');
        return global.systemConfig;
      }
      
      const platformManager = new PlatformManager(path.join(__dirname, 'llamacpp-binaries'));
      const config = await platformManager.getSystemConfiguration();
      
      global.systemConfig = config;
      
      return config;
    } catch (error) {
      log.error('❌ Error getting system configuration:', error);
      return { error: error.message };
    }
  });

  ipcMain.handle('refresh-system-config', async () => {
    try {
      log.info('🔄 Refreshing system configuration...');
      
      const platformManager = new PlatformManager(path.join(__dirname, 'llamacpp-binaries'));
      const config = await platformManager.getSystemConfiguration(true);
      
      global.systemConfig = config;
      
      log.info('✅ System configuration refreshed successfully');
      return config;
    } catch (error) {
      log.error('❌ Error refreshing system configuration:', error);
      return { error: error.message };
    }
  });

  ipcMain.handle('check-feature-requirements', async (event, featureName) => {
    try {
      const platformManager = new PlatformManager(path.join(__dirname, 'llamacpp-binaries'));
      const requirements = await platformManager.checkFeatureRequirements(featureName);
      
      log.info(`🔍 Feature requirements check for '${featureName}':`, requirements);
      return requirements;
    } catch (error) {
      log.error(`❌ Error checking requirements for feature '${featureName}':`, error);
      return { supported: false, reason: error.message };
    }
  });

  ipcMain.handle('get-performance-mode', async () => {
    try {
      if (global.systemConfig) {
        return {
          performanceMode: global.systemConfig.performanceMode,
          enabledFeatures: global.systemConfig.enabledFeatures,
          resourceLimitations: global.systemConfig.resourceLimitations
        };
      }
      
      return { performanceMode: 'unknown', enabledFeatures: {}, resourceLimitations: {} };
    } catch (error) {
      log.error('❌ Error getting performance mode:', error);
      return { error: error.message };
    }
  });

  ipcMain.handle('get-os-compatibility', async () => {
    try {
      if (global.systemConfig && global.systemConfig.osCompatibility) {
        return global.systemConfig.osCompatibility;
      } else {
        const platformManager = new PlatformManager(path.join(__dirname, 'llamacpp-binaries'));
        const osCompatibility = await platformManager.validateOSCompatibility();
        return osCompatibility;
      }
    } catch (error) {
      log.error('Error getting OS compatibility info:', error);
      return { error: error.message };
    }
  });

  ipcMain.handle('get-detailed-os-info', async () => {
    try {
      const platformManager = new PlatformManager(path.join(__dirname, 'llamacpp-binaries'));
      const osInfo = await platformManager.getDetailedOSInfo();
      return osInfo;
    } catch (error) {
      log.error('Error getting detailed OS info:', error);
      return { error: error.message };
    }
  });

  ipcMain.handle('validate-os-compatibility', async () => {
    try {
      const platformManager = new PlatformManager(path.join(__dirname, 'llamacpp-binaries'));
      const compatibility = await platformManager.validateOSCompatibility();
      return compatibility;
    } catch (error) {
      log.error('Error validating OS compatibility:', error);
      return { error: error.message };
    }
  });

  ipcMain.handle('save-comfyui-consent', async (event, hasConsented) => {
    try {
      const userDataPath = app.getPath('userData');
      const consentFile = path.join(userDataPath, 'comfyui-consent.json');
      
      const consentData = {
        hasConsented,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      
      fs.writeFileSync(consentFile, JSON.stringify(consentData, null, 2));
      log.info(`ComfyUI consent saved: ${hasConsented}`);
      
      if (watchdogService) {
        watchdogService.setComfyUIMonitoring(hasConsented);
      }

      return { success: true };
    } catch (error) {
      log.error('Error saving ComfyUI consent:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-comfyui-consent', async () => {
    try {
      const userDataPath = app.getPath('userData');
      const consentFile = path.join(userDataPath, 'comfyui-consent.json');
      
      if (fs.existsSync(consentFile)) {
        const consentData = JSON.parse(fs.readFileSync(consentFile, 'utf8'));
        return consentData;
      }
      
      return null;
    } catch (error) {
      log.error('Error reading ComfyUI consent:', error);
      return null;
    }
  });

  ipcMain.handle('get-gpu-info', async () => {
    try {
      const { spawnSync } = require('child_process');
      const os = require('os');
      
      let hasNvidiaGPU = false;
      let gpuName = '';
      let isAMD = false;
      let gpuMemoryMB = 0;
      
      try {
        const nvidiaSmi = spawnSync('nvidia-smi', [
          '--query-gpu=name,memory.total',
          '--format=csv,noheader,nounits'
        ], { encoding: 'utf8', timeout: 5000 });

        if (nvidiaSmi.status === 0 && nvidiaSmi.stdout) {
          const lines = nvidiaSmi.stdout.trim().split('\n');
          if (lines.length > 0 && lines[0].trim()) {
            const parts = lines[0].split(',');
            if (parts.length >= 2) {
              gpuName = parts[0].trim();
              gpuMemoryMB = parseInt(parts[1].trim()) || 0;
              hasNvidiaGPU = true;
              
              log.info(`NVIDIA GPU detected via nvidia-smi: ${gpuName} (${gpuMemoryMB}MB)`);
            }
          }
        }
      } catch (error) {
        log.debug('nvidia-smi not available or failed:', error.message);
      }

      if (!hasNvidiaGPU && os.platform() === 'win32') {
        try {
          const wmic = spawnSync('wmic', [
            'path', 'win32_VideoController', 
            'get', 'name,AdapterRAM', 
            '/format:csv'
          ], { encoding: 'utf8', timeout: 10000 });

          if (wmic.status === 0 && wmic.stdout) {
            const lines = wmic.stdout.split('\n').filter(line => line.trim() && !line.startsWith('Node'));
            
            for (const line of lines) {
              const parts = line.split(',');
              if (parts.length >= 3) {
                const ramStr = parts[1]?.trim();
                const nameStr = parts[2]?.trim();

                if (nameStr && ramStr && !isNaN(parseInt(ramStr))) {
                  const ramBytes = parseInt(ramStr);
                  const ramMB = Math.round(ramBytes / (1024 * 1024));
                  
                  if (ramMB > gpuMemoryMB) {
                    gpuName = nameStr;
                    gpuMemoryMB = ramMB;
                    
                    const lowerName = nameStr.toLowerCase();
                    hasNvidiaGPU = lowerName.includes('nvidia') || 
                                  lowerName.includes('geforce') || 
                                  lowerName.includes('rtx') || 
                                  lowerName.includes('gtx');
                    isAMD = lowerName.includes('amd') || lowerName.includes('radeon');
                    
                    log.info(`GPU detected via WMIC: ${gpuName} (${gpuMemoryMB}MB)`);
                  }
                }
              }
            }
          }
        } catch (error) {
          log.debug('WMIC GPU detection failed:', error.message);
        }
      }

      if (!hasNvidiaGPU && !gpuName && os.platform() === 'win32') {
        try {
          const powershell = spawnSync('powershell', [
            '-Command',
            'Get-WmiObject -Class Win32_VideoController | Select-Object Name, AdapterRAM | ConvertTo-Json'
          ], { encoding: 'utf8', timeout: 10000 });

          if (powershell.status === 0 && powershell.stdout) {
            const gpuData = JSON.parse(powershell.stdout);
            const gpus = Array.isArray(gpuData) ? gpuData : [gpuData];
            
            for (const gpu of gpus) {
              if (gpu.Name && gpu.AdapterRAM) {
                const ramMB = Math.round(gpu.AdapterRAM / (1024 * 1024));
                
                if (ramMB > gpuMemoryMB) {
                  gpuName = gpu.Name;
                  gpuMemoryMB = ramMB;
                  
                  const lowerName = gpu.Name.toLowerCase();
                  hasNvidiaGPU = lowerName.includes('nvidia') || 
                                lowerName.includes('geforce') || 
                                lowerName.includes('rtx') || 
                                lowerName.includes('gtx');
                  isAMD = lowerName.includes('amd') || lowerName.includes('radeon');
                  
                  log.info(`GPU detected via PowerShell: ${gpuName} (${gpuMemoryMB}MB)`);
                }
              }
            }
          }
        } catch (error) {
          log.debug('PowerShell GPU detection failed:', error.message);
        }
      }

      return {
        success: true,
        gpuInfo: {
          hasNvidiaGPU,
          gpuName,
          isAMD,
          gpuMemoryMB,
          gpuMemoryGB: Math.round(gpuMemoryMB / 1024 * 10) / 10,
          platform: os.platform()
        }
      };
    } catch (error) {
      log.error('Error getting GPU info:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  ipcMain.handle('get-services-status', async () => {
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

  ipcMain.handle('docker-update-containers', async (event, containerNames) => {
    try {
      if (!dockerSetup) {
        throw new Error('Docker not initialized');
      }
      
      return await dockerSetup.updateContainers(containerNames, (status, type = 'info') => {
        log.info('Container update:', status);
        const { mainWindow } = require('../main/window-manager');
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('docker-update-progress', { status, type });
        }
      });
    } catch (error) {
      log.error('Error updating containers:', error);
      throw error;
    }
  });

  ipcMain.handle('docker-get-system-info', async () => {
    try {
      if (!dockerSetup) {
        throw new Error('Docker not initialized');
      }
      
      return {
        architecture: dockerSetup.systemArch,
        platform: process.platform,
        arch: process.arch
      };
    } catch (error) {
      log.error('Error getting system info:', error);
      throw error;
    }
  });

  ipcMain.handle('docker-detect-installations', async () => {
    try {
      if (!dockerSetup) {
        throw new Error('Docker not initialized');
      }
      
      const installations = await dockerSetup.detectDockerInstallations();
      return installations.map(install => ({
        type: install.type,
        method: install.method,
        priority: install.priority,
        path: install.path,
        host: install.host,
        port: install.port,
        contextName: install.contextName,
        machineName: install.machineName,
        isPodman: install.isPodman || false,
        isNamedPipe: install.isNamedPipe || false
      }));
    } catch (error) {
      log.error('Error detecting Docker installations:', error);
      throw error;
    }
  });

  ipcMain.handle('docker-get-detection-report', async () => {
    try {
      if (!dockerSetup) {
        throw new Error('Docker not initialized');
      }
      
      return await dockerSetup.getDockerDetectionReport();
    } catch (error) {
      log.error('Error getting Docker detection report:', error);
      throw error;
    }
  });

  ipcMain.handle('docker-test-all-installations', async () => {
    try {
      if (!dockerSetup) {
        throw new Error('Docker not initialized');
      }
      
      return await dockerSetup.testAllDockerInstallations();
    } catch (error) {
      log.error('Error testing Docker installations:', error);
      throw error;
    }
  });

  ipcMain.on('backend-status', (event, status) => {
    const { mainWindow } = require('../main/window-manager');
    if (mainWindow) {
      mainWindow.webContents.send('backend-status', status);
    }
  });

  ipcMain.on('python-status', (event, status) => {
    const { mainWindow } = require('../main/window-manager');
    if (mainWindow) {
      mainWindow.webContents.send('python-status', status);
    }
  });

  ipcMain.on('loading-complete', () => {
    log.info('Loading screen fade-out complete');
    const { loadingScreen } = require('../services/service-initializer.cjs');
    if (loadingScreen) {
      loadingScreen.close();
    }
  });

  ipcMain.on('react-app-ready', async () => {
    log.info('React app fully initialized and ready');
    const { loadingScreen } = require('../services/service-initializer.cjs');
    if (loadingScreen && loadingScreen.isValid()) {
      loadingScreen.notifyMainWindowReady();
    }
    
    if (mcpService && !global.mcpServersRestored) {
      try {
        log.info('React app ready - checking MCP auto-start setting...');
        
        let shouldAutoStartMCP = true;
        
        try {
          const settingsPath = path.join(app.getPath('userData'), 'clara-settings.json');
          if (fs.existsSync(settingsPath)) {
            const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            const startupSettings = settings.startup || {};
            shouldAutoStartMCP = startupSettings.autoStartMCP !== false;
          }
        } catch (settingsError) {
          log.warn('Error reading startup settings for MCP auto-start:', settingsError);
        }

        if (shouldAutoStartMCP) {
          log.info('React app ready - attempting to restore previously running MCP servers...');
          const restoreResults = await mcpService.startPreviouslyRunningServers();
          const successCount = restoreResults.filter(r => r.success).length;
          const totalCount = restoreResults.length;
          
          if (totalCount > 0) {
            log.info(`MCP restoration on app ready: ${successCount}/${totalCount} servers restored`);
          } else {
            log.info('MCP restoration on app ready: No servers to restore');
          }
        } else {
          log.info('MCP auto-start disabled in settings - skipping server restoration');
        }
        global.mcpServersRestored = true;
      } catch (error) {
        log.error('Error auto-restoring MCP servers on app ready:', error);
      }
    }
  });

  ipcMain.on('app-close', async () => {
    log.info('App close requested from renderer');
    const { isQuitting } = require('../main/tray');
    isQuitting = true;
    app.quit();
  });

  ipcMain.on('hide-to-tray', () => {
    const { mainWindow } = require('../main/window-manager');
    if (mainWindow) {
      mainWindow.hide();
    }
  });

  ipcMain.on('show-from-tray', () => {
    const { mainWindow, createMainWindow } = require('../main/window-manager');
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

  ipcMain.handle('get-fullscreen-startup-preference', async () => {
    try {
      const userDataPath = app.getPath('userData');
      const settingsPath = path.join(userDataPath, 'settings.json');
      
      if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        return settings.fullscreen_startup !== false;
      }
      return true;
    } catch (error) {
      log.error('Error reading fullscreen startup preference:', error);
      return true;
    }
  });

  ipcMain.handle('set-fullscreen-startup-preference', async (event, enabled) => {
    try {
      const userDataPath = app.getPath('userData');
      const settingsPath = path.join(userDataPath, 'settings.json');
      
      let settings = {};
      if (fs.existsSync(settingsPath)) {
        settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      }
      
      settings.fullscreen_startup = enabled;
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      
      log.info(`Fullscreen startup preference set to: ${enabled}`);
      return true;
    } catch (error) {
      log.error('Error saving fullscreen startup preference:', error);
      return false;
    }
  });

  ipcMain.handle('toggle-fullscreen', async () => {
    const { mainWindow } = require('../main/window-manager');
    if (mainWindow && !mainWindow.isDestroyed()) {
      const isFullscreen = mainWindow.isFullScreen();
      mainWindow.setFullScreen(!isFullscreen);
      log.info(`Window fullscreen toggled to: ${!isFullscreen}`);
      return !isFullscreen;
    }
    return false;
  });

  ipcMain.handle('get-fullscreen-status', async () => {
    const { mainWindow } = require('../main/window-manager');
    if (mainWindow && !mainWindow.isDestroyed()) {
      return mainWindow.isFullScreen();
    }
    return false;
  });

  ipcMain.handle('start-docker-desktop', async () => {
    try {
      log.info('Received request to start Docker Desktop from onboarding');
      
      const { checkDockerDesktopInstalled, startDockerDesktop } = require('../utils/helpers');
      const dockerPath = await checkDockerDesktopInstalled();
      if (!dockerPath) {
        return { 
          success: false, 
          error: 'Docker Desktop not found on system' 
        };
      }
      
      const isRunning = dockerSetup ? await dockerSetup.isDockerRunning() : false;
      if (isRunning) {
        return { 
          success: true, 
          message: 'Docker Desktop is already running' 
        };
      }
      
      const startSuccess = await startDockerDesktop(dockerPath);
      
      if (startSuccess) {
        return { 
          success: true, 
          message: 'Docker Desktop startup initiated' 
        };
      } else {
        return { 
          success: false, 
          error: 'Failed to start Docker Desktop' 
        };
      }
    } catch (error) {
      log.error('Error starting Docker Desktop:', error);
      return { 
        success: false, 
        error: error.message || 'Unknown error starting Docker Desktop' 
      };
    }
  });

  ipcMain.handle('start-docker-service', async (event, serviceName) => {
    try {
      if (!dockerSetup) {
        throw new Error('Docker setup not initialized');
      }

      const { getN8NConfig, getPythonConfig, getComfyUIConfig } = require('../utils/helpers');
      switch (serviceName) {
        case 'n8n':
          const n8nConfig = getN8NConfig(dockerSetup);
          await dockerSetup.startContainer(n8nConfig);
          break;
        case 'python':
          const pythonConfig = getPythonConfig(dockerSetup);
          await dockerSetup.startContainer(pythonConfig);
          break;
        case 'comfyui':
          const comfyuiConfig = getComfyUIConfig(dockerSetup);
          await dockerSetup.startContainer(comfyuiConfig);
          break;
        default:
          throw new Error(`Unknown service: ${serviceName}`);
      }

      return { success: true };
    } catch (error) {
      log.error(`Error starting ${serviceName} service:`, error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('stop-docker-service', async (event, serviceName) => {
    try {
      if (!dockerSetup) {
        throw new Error('Docker setup not initialized');
      }

      const containerName = `clara_${serviceName}`;
      const container = await dockerSetup.docker.getContainer(containerName);
      await container.stop();

      return { success: true };
    } catch (error) {
      log.error(`Error stopping ${serviceName} service:`, error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('restart-docker-service', async (event, serviceName) => {
    try {
      if (!dockerSetup) {
        throw new Error('Docker setup not initialized');
      }

      const containerName = `clara_${serviceName}`;
      const container = await dockerSetup.docker.getContainer(containerName);
      await container.restart();

      return { success: true };
    } catch (error) {
      log.error(`Error restarting ${serviceName} service:`, error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-desktop-sources', async () => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen', 'window'],
        thumbnailSize: { width: 300, height: 200 }
      });
      
      return sources.map(source => ({
        id: source.id,
        name: source.name,
        thumbnail: source.thumbnail.toDataURL()
      }));
    } catch (error) {
      log.error('Error getting desktop sources:', error);
      return { error: error.message };
    }
  });

  ipcMain.handle('get-screen-access-status', async () => {
    try {
      if (process.platform === 'darwin') {
        const status = systemPreferences.getMediaAccessStatus('screen');
        return { status };
      }
      return { status: 'granted' };
    } catch (error) {
      log.error('Error checking screen access:', error);
      return { status: 'unknown', error: error.message };
    }
  });

  ipcMain.handle('request-screen-access', async () => {
    try {
      if (process.platform === 'darwin') {
        const granted = await systemPreferences.askForMediaAccess('screen');
        return { granted };
      }
      return { granted: true };
    } catch (error) {
      log.error('Error requesting screen access:', error);
      return { granted: false, error: error.message };
    }
  });
  ipcMain.handle('get-feature-config', async () => {
    const featureSelection = new FeatureSelectionScreen();
    return featureSelection.isFirstTimeLaunch() ? null : FeatureSelectionScreen.getCurrentConfig();
  });

  ipcMain.handle('set-startup-settings', async (event, settings) => {
    try {
      const settingsPath = path.join(app.getPath('userData'), 'clara-settings.json');
      let currentSettings = {};
      if (fs.existsSync(settingsPath)) {
        currentSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      }
      currentSettings.startup = { ...currentSettings.startup, ...settings };
      fs.writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 2));
      return { success: true };
    } catch (error) {
      log.error('Error saving startup settings:', error);
      return { success: false, error: error.message };
    }
  });
  
  // Task and Project IPC Handlers
  ipcMain.handle('get-tasks', async (event, projectId) => {
    console.log(`[app-handlers.cjs] Handling "get-tasks" for projectId: ${projectId}`);
    try {
      const result = await taskService.getTasks(projectId);
      console.log('[app-handlers.cjs] "get-tasks" result:', result);
      if (!result.success) {
        throw new Error(result.error);
      }
      return { success: true, tasks: result.tasks };
    } catch (error) {
      log.error('Error getting tasks:', error);
      console.error('[app-handlers.cjs] "get-tasks" error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('create-task', async (event, task) => {
    try {
      return await taskService.createTask(task);
    } catch (error) {
      log.error('Error creating task:', error);
      throw error;
    }
  });

  ipcMain.handle('update-task', async (event, { id, updates }) => {
    try {
      return await taskService.updateTask(id, updates);
    } catch (error) {
      log.error('Error updating task:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-task', async (event, id) => {
    try {
      return await taskService.deleteTask(id);
    } catch (error) {
      log.error('Error deleting task:', error);
      throw error;
    }
  });

  ipcMain.handle('tasks:getProjects', async () => {
    console.log('[app-handlers.cjs] Handling "tasks:getProjects"');
    try {
      const result = await taskService.getProjects();
      console.log('[app-handlers.cjs] "tasks:getProjects" result:', result);
      if (!result.success) {
        throw new Error(result.error);
      }
      return { success: true, projects: result.projects };
    } catch (error) {
      log.error('Error getting projects:', error);
      console.error('[app-handlers.cjs] "tasks:getProjects" error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('create-project', async (event, project) => {
    try {
      return await taskService.createProject(project);
    } catch (error) {
      log.error('Error creating project:', error);
      throw error;
    }
  });

  ipcMain.handle('update-project', async (event, { id, updates }) => {
    try {
      return await taskService.updateProject(id, updates);
    } catch (error) {
      log.error('Error updating project:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-project', async (event, id) => {
    try {
      return await taskService.deleteProject(id);
    } catch (error) {
      log.error('Error deleting project:', error);
      throw error;
    }
  });
}

module.exports = {
  registerAppHandlers,
};