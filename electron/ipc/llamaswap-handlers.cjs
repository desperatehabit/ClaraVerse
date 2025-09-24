const { ipcMain, app } = require('electron');
const log = require('electron-log');
const path = require('path');
const fsSync = require('fs');
const LlamaSwapService = require('../llamaSwapService.cjs');
const { debugPaths, logDebugInfo } = require('../debug-paths.cjs');

function registerLlamaSwapHandlers(llamaSwapService, ipcLogger) {
  ipcMain.handle('start-llama-swap', async () => {
    try {
      if (!llamaSwapService) {
        llamaSwapService = new LlamaSwapService(ipcLogger);
        setupLlamaSwapProgressCallback(llamaSwapService);
      }
      
      const result = await llamaSwapService.start();
      return { 
        success: result.success, 
        message: result.message,
        error: result.error,
        warning: result.warning,
        diagnostics: result.diagnostics,
        status: llamaSwapService.getStatus() 
      };
    } catch (error) {
      log.error('Error starting llama-swap service:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('stop-llama-swap', async () => {
    try {
      if (llamaSwapService) {
        await llamaSwapService.stop();
      }
      return { success: true };
    } catch (error) {
      log.error('Error stopping llama-swap service:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('restart-llama-swap', async () => {
    try {
      if (!llamaSwapService) {
        llamaSwapService = new LlamaSwapService(ipcLogger);
        setupLlamaSwapProgressCallback(llamaSwapService);
      }
      
      const result = await llamaSwapService.restart();
      return { 
        success: result.success || true,
        message: result.message || 'Service restarted',
        status: llamaSwapService.getStatus() 
      };
    } catch (error) {
      log.error('Error restarting llama-swap service:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-llama-swap-status', async () => {
    try {
      if (!llamaSwapService) {
        return { isRunning: false, port: null, apiUrl: null };
      }
      
      return llamaSwapService.getStatus();
    } catch (error) {
      log.error('Error getting llama-swap status:', error);
      return { isRunning: false, port: null, apiUrl: null, error: error.message };
    }
  });

  ipcMain.handle('get-llama-swap-status-with-health', async () => {
    try {
      if (!llamaSwapService) {
        return { isRunning: false, port: null, apiUrl: null };
      }
      
      return await llamaSwapService.getStatusWithHealthCheck();
    } catch (error) {
      log.error('Error getting llama-swap status with health check:', error);
      return { isRunning: false, port: null, apiUrl: null, error: error.message };
    }
  });

  ipcMain.handle('get-llama-swap-models', async () => {
    try {
      if (!llamaSwapService) {
        return [];
      }
      
      return await llamaSwapService.getModels();
    } catch (error) {
      log.error('Error getting llama-swap models:', error);
      return [];
    }
  });

  ipcMain.handle('get-llama-swap-api-url', async () => {
    try {
      if (llamaSwapService && llamaSwapService.isRunning) {
        return llamaSwapService.getApiUrl();
      }
      return null;
    } catch (error) {
      log.error('Error getting llama-swap API URL:', error);
      return null;
    }
  });

  ipcMain.handle('regenerate-llama-swap-config', async () => {
    try {
      if (!llamaSwapService) {
        llamaSwapService = new LlamaSwapService(ipcLogger);
      }
      
      const result = await llamaSwapService.generateConfig();
      return { success: true, ...result };
    } catch (error) {
      log.error('Error regenerating llama-swap config:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('download-official-llama-swap', async () => {
    try {
      if (!llamaSwapService) {
        llamaSwapService = new LlamaSwapService(ipcLogger);
      }
      
      const result = await llamaSwapService.downloadOfficialLlamaSwap();
      return { success: true, ...result };
    } catch (error) {
      log.error('Error downloading official llama-swap:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('check-llama-swap-updates', async () => {
    try {
      if (!llamaSwapService) {
        llamaSwapService = new LlamaSwapService(ipcLogger);
      }
      
      const result = await llamaSwapService.checkForLlamaSwapUpdates();
      return { success: true, ...result };
    } catch (error) {
      log.error('Error checking llama-swap updates:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-llama-swap', async () => {
    try {
      if (!llamaSwapService) {
        llamaSwapService = new LlamaSwapService(ipcLogger);
      }
      
      const result = await llamaSwapService.updateLlamaSwap();
      return { success: true, ...result };
    } catch (error) {
      log.error('Error updating llama-swap:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-llama-swap-version', async () => {
    try {
      if (!llamaSwapService) {
        llamaSwapService = new LlamaSwapService(ipcLogger);
      }
      
      const version = await llamaSwapService.getLlamaSwapVersion();
      return { success: true, version };
    } catch (error) {
      log.error('Error getting llama-swap version:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('run-llama-optimizer', async (event, preset) => {
    try {
      if (!llamaSwapService) {
        llamaSwapService = new LlamaSwapService(ipcLogger);
      }
      
      const result = await llamaSwapService.runLlamaOptimizer(preset);
      return result;
    } catch (error) {
      log.error('Error running llama optimizer:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('debug-binary-paths', async () => {
    try {
      const debugInfo = debugPaths();
      logDebugInfo();
      return { success: true, debugInfo };
    } catch (error) {
      log.error('Error debugging binary paths:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-gpu-diagnostics', async () => {
    try {
      if (!llamaSwapService) {
        llamaSwapService = new LlamaSwapService(ipcLogger);
      }
      
      const diagnostics = await llamaSwapService.getGPUDiagnostics();
      return { success: true, ...diagnostics };
    } catch (error) {
      log.error('Error getting GPU diagnostics:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-performance-settings', async () => {
    try {
      if (!llamaSwapService) {
        llamaSwapService = new LlamaSwapService(ipcLogger);
      }
      
      const result = await llamaSwapService.getPerformanceSettings();
      return result;
    } catch (error) {
      log.error('Error getting performance settings:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('save-performance-settings', async (event, settings) => {
    try {
      if (!llamaSwapService) {
        llamaSwapService = new LlamaSwapService(ipcLogger);
      }
      
      const result = await llamaSwapService.savePerformanceSettings(settings);
      return result;
    } catch (error) {
      log.error('Error saving performance settings:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('load-performance-settings', async () => {
    try {
      if (!llamaSwapService) {
        llamaSwapService = new LlamaSwapService(ipcLogger);
      }
      
      const result = await llamaSwapService.loadPerformanceSettings();
      return result;
    } catch (error) {
      log.error('Error loading performance settings:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('set-custom-model-path', async (event, customPath) => {
    try {
      if (!llamaSwapService) {
        llamaSwapService = new LlamaSwapService(ipcLogger);
      }
      
      try {
        const settingsPath = path.join(app.getPath('userData'), 'clara-settings.json');
        let settings = {};
        
        if (fsSync.existsSync(settingsPath)) {
          try {
            settings = JSON.parse(fsSync.readFileSync(settingsPath, 'utf8'));
          } catch (parseError) {
            log.warn('Could not parse existing settings file, creating new one:', parseError.message);
            settings = {};
          }
        }
        
        if (customPath) {
          settings.customModelPath = customPath;
          log.info('Saving custom model path to settings:', customPath);
        } else {
          delete settings.customModelPath;
          log.info('Removing custom model path from settings');
        }
        
        fsSync.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
      } catch (settingsError) {
        log.warn('Could not save custom model path to settings:', settingsError.message);
      }
      
      if (customPath) {
        llamaSwapService.setCustomModelPaths([customPath]);
      } else {
        llamaSwapService.setCustomModelPaths([]);
      }
      
      await llamaSwapService.generateConfig();
      
      return { success: true };
    } catch (error) {
      log.error('Error setting custom model path:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-custom-model-paths', async () => {
    try {
      if (!llamaSwapService) {
        llamaSwapService = new LlamaSwapService(ipcLogger);
      }
      
      let paths = llamaSwapService.getCustomModelPaths();
      
      if (paths.length === 0) {
        try {
          const settingsPath = path.join(app.getPath('userData'), 'clara-settings.json');
          if (fsSync.existsSync(settingsPath)) {
            const settings = JSON.parse(fsSync.readFileSync(settingsPath, 'utf8'));
            if (settings.customModelPath) {
              if (fsSync.existsSync(settings.customModelPath)) {
                paths = [settings.customModelPath];
                llamaSwapService.setCustomModelPaths(paths);
              } else {
                log.warn('Custom model path from settings no longer exists:', settings.customModelPath);
              }
            }
          }
        } catch (fileError) {
          log.warn('Could not read custom model path from file storage:', fileError.message);
        }
      }
      
      return paths;
    } catch (error) {
      log.error('Error getting custom model paths:', error);
      return [];
    }
  });

  ipcMain.handle('scan-custom-path-models', async (event, path) => {
    try {
      if (!path) {
        return { success: false, error: 'No path provided' };
      }

      const fs = require('fs').promises;
      const pathModule = require('path');
      
      const models = [];
      
      async function scanDirectoryRecursive(dirPath, maxDepth = 10, currentDepth = 0) {
        if (currentDepth >= maxDepth) {
          log.warn(`Maximum depth (${maxDepth}) reached while scanning ${dirPath}`);
          return;
        }

        try {
          const entries = await fs.readdir(dirPath, { withFileTypes: true });
          
          const ggufFiles = [];
          const subdirectories = [];
          
          for (const entry of entries) {
            const fullPath = pathModule.join(dirPath, entry.name);
            
            if (entry.isDirectory()) {
              subdirectories.push(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.gguf')) {
              ggufFiles.push({ name: entry.name, path: fullPath });
            }
          }
          
          const processedFiles = new Set();
          const multiPartGroups = new Map();
          
          ggufFiles.forEach(file => {
            const multiPartMatch = file.name.match(/^(.+)-(\d+)-of-(\d+)\.gguf$/);
            if (multiPartMatch) {
              const [, baseName, partNum, totalParts] = multiPartMatch;
              const key = `${baseName}-${totalParts}`;
              
              if (!multiPartGroups.has(key)) {
                multiPartGroups.set(key, {
                  baseName,
                  totalParts: parseInt(totalParts),
                  parts: new Map()
                });
              }
              
              multiPartGroups.get(key).parts.set(parseInt(partNum), file);
            }
          });
          
          for (const [key, group] of multiPartGroups) {
            const { baseName, totalParts, parts } = group;
            
            let allPartsPresent = true;
            for (let i = 1; i <= totalParts; i++) {
              if (!parts.has(i)) {
                allPartsPresent = false;
                log.warn(`Multi-part model ${baseName} is incomplete: missing part ${i} of ${totalParts}`);
                break;
              }
            }
            
            if (allPartsPresent) {
              const firstPart = parts.get(1);
              try {
                const stats = await fs.stat(firstPart.path);
                
                const relativePath = pathModule.relative(path, firstPart.path);
                const folderHint = pathModule.dirname(relativePath) === '.' ? '' : `(${pathModule.dirname(relativePath)})`;
                
                models.push({
                  name: firstPart.name.replace('.gguf', ''),
                  file: firstPart.name,
                  path: firstPart.path,
                  relativePath: relativePath,
                  folderHint: folderHint,
                  size: stats.size,
                  source: 'custom',
                  lastModified: stats.mtime,
                  isMultiPart: true,
                  totalParts: totalParts
                });
                
                for (const part of parts.values()) {
                  processedFiles.add(part.name);
                }
                
                log.info(`Added complete multi-part model: ${baseName} (${totalParts} parts)`);
              } catch (error) {
                log.warn(`Error reading stats for multi-part model ${firstPart.path}:`, error);
              }
            } else {
              for (const part of parts.values()) {
                processedFiles.add(part.name);
              }
            }
          }
          
          for (const file of ggufFiles) {
            if (!processedFiles.has(file.name)) {
              try {
                const stats = await fs.stat(file.path);
                
                const relativePath = pathModule.relative(path, file.path);
                const folderHint = pathModule.dirname(relativePath) === '.' ? '' : `(${pathModule.dirname(relativePath)})`;
                
                models.push({
                  name: file.name.replace('.gguf', ''),
                  file: file.name,
                  path: file.path,
                  relativePath: relativePath,
                  folderHint: folderHint,
                  size: stats.size,
                  source: 'custom',
                  lastModified: stats.mtime,
                  isMultiPart: false
                });
              } catch (error) {
                log.warn(`Error reading stats for ${file.path}:`, error);
              }
            }
          }
          
          for (const subdirPath of subdirectories) {
            await scanDirectoryRecursive(subdirPath, maxDepth, currentDepth + 1);
          }
          
        } catch (error) {
          log.warn(`Error reading directory ${dirPath}:`, error);
        }
      }
      
      try {
        if (await fs.access(path).then(() => true).catch(() => false)) {
          await scanDirectoryRecursive(path);
        } else {
          return { success: false, error: 'Directory is not accessible' };
        }
      } catch (error) {
        log.warn(`Error scanning models in ${path}:`, error);
        return { success: false, error: error.message };
      }

      models.sort((a, b) => {
        const folderCompare = (a.folderHint || '').localeCompare(b.folderHint || '');
        if (folderCompare !== 0) return folderCompare;
        return a.file.localeCompare(b.file);
      });

      return { success: true, models };
    } catch (error) {
      log.error('Error scanning custom path models:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = {
  registerLlamaSwapHandlers,
};