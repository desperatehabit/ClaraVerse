const { ipcMain } = require('electron');
const log = require('electron-log');
const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');
const os = require('os');

function registerModelManagerHandlers(llamaSwapService, mainWindow, activeDownloads) {
  function isVisionModel(model) {
    const visionKeywords = ['vl', 'vision', 'multimodal', 'mm', 'clip', 'siglip'];
    const modelText = `${model.modelId} ${model.description || ''}`.toLowerCase();
    return visionKeywords.some(keyword => modelText.includes(keyword));
  }

  function findRequiredMmprojFiles(siblings) {
    return siblings.filter(file => 
      file.rfilename.toLowerCase().includes('mmproj') ||
      file.rfilename.toLowerCase().includes('mm-proj') ||
      file.rfilename.toLowerCase().includes('projection')
    );
  }

  function isVisionModelByName(fileName) {
    const visionKeywords = ['vl', 'vision', 'multimodal', 'mm', 'clip', 'siglip'];
    return visionKeywords.some(keyword => fileName.toLowerCase().includes(keyword));
  }

  function findBestMmprojMatch(modelFileName, mmprojFiles) {
    const modelBaseName = modelFileName
      .replace('.gguf', '')
      .replace(/-(q4_k_m|q4_k_s|q8_0|f16|instruct).*$/i, '')
      .toLowerCase();
    
    for (const mmproj of mmprojFiles) {
      const mmprojBaseName = mmproj.rfilename
        .replace(/-(mmproj|mm-proj|projection).*$/i, '')
        .toLowerCase();
      
      if (modelBaseName.includes(mmprojBaseName) || mmprojBaseName.includes(modelBaseName)) {
        return mmproj;
      }
    }
    
    return mmprojFiles[0];
  }

  async function downloadSingleFile(modelId, fileName, modelsDir) {
    return downloadSingleFileWithRename(modelId, fileName, fileName, modelsDir);
  }

  async function downloadSingleFileWithRename(modelId, sourceFileName, targetFileName, modelsDir) {
    const flattenedFileName = path.basename(targetFileName);
    const filePath = path.join(modelsDir, flattenedFileName);
    
    if (!fs.existsSync(modelsDir)) {
      try {
        fs.mkdirSync(modelsDir, { recursive: true });
        log.info(`Created models directory: ${modelsDir}`);
      } catch (dirError) {
        log.error(`Failed to create models directory ${modelsDir}:`, dirError);
        return { success: false, error: `Failed to create directory: ${dirError.message}` };
      }
    }
    
    if (fs.existsSync(filePath)) {
      return { success: false, error: 'File already exists' };
    }
    
    const downloadUrl = `https://huggingface.co/${modelId}/resolve/main/${sourceFileName}`;
    log.info(`Starting download: ${downloadUrl} -> ${filePath}`);
    
    return new Promise((resolve) => {
      const protocol = downloadUrl.startsWith('https:') ? https : http;
      const file = fs.createWriteStream(filePath);
      
      const downloadInfo = {
        request: null,
        file,
        filePath,
        stopped: false
      };
      activeDownloads.set(flattenedFileName, downloadInfo);
      
      const cleanup = () => {
        activeDownloads.delete(flattenedFileName);
        if (file && !file.destroyed) {
          file.close();
        }
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (cleanupError) {
            log.warn('Error cleaning up file:', cleanupError);
          }
        }
      };
      
      const request = protocol.get(downloadUrl, (response) => {
        downloadInfo.request = request;
        
        if (downloadInfo.stopped) {
          cleanup();
          resolve({ success: false, error: 'Download stopped by user' });
          return;
        }
        
        if (response.statusCode === 302 || response.statusCode === 301) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            const redirectProtocol = redirectUrl.startsWith('https:') ? https : http;
            const redirectRequest = redirectProtocol.get(redirectUrl, (redirectResponse) => {
              downloadInfo.request = redirectRequest;
              
              if (downloadInfo.stopped) {
                cleanup();
                resolve({ success: false, error: 'Download stopped by user' });
                return;
              }
              
              if (redirectResponse.statusCode !== 200) {
                cleanup();
                resolve({ success: false, error: `HTTP ${redirectResponse.statusCode}` });
                return;
              }
              
              const totalSize = parseInt(redirectResponse.headers['content-length'] || '0');
              let downloadedSize = 0;
              
              redirectResponse.pipe(file);
              
              redirectResponse.on('data', (chunk) => {
                if (downloadInfo.stopped) {
                  redirectResponse.destroy();
                  cleanup();
                  resolve({ success: false, error: 'Download stopped by user' });
                  return;
                }
                
                downloadedSize += chunk.length;
                const progress = totalSize > 0 ? (downloadedSize / totalSize) * 100 : 0;
                
                if (mainWindow) {
                  mainWindow.webContents.send('download-progress', {
                    fileName: targetFileName,
                    progress: Math.round(progress),
                    downloadedSize,
                    totalSize
                  });
                }
              });
              
              file.on('finish', () => {
                if (downloadInfo.stopped) {
                  cleanup();
                  resolve({ success: false, error: 'Download stopped by user' });
                  return;
                }
                
                file.close(() => {
                  activeDownloads.delete(targetFileName);
                  log.info(`Download completed: ${filePath}`);
                  
                  if (mainWindow) {
                    mainWindow.webContents.send('download-progress', {
                      fileName: targetFileName,
                      progress: 100,
                      downloadedSize: totalSize,
                      totalSize
                    });
                  }
                  
                  resolve({ success: true, filePath });
                });
              });
              
              file.on('error', (error) => {
                cleanup();
                resolve({ success: false, error: error.message });
              });
            });
            
            redirectRequest.on('error', (error) => {
              cleanup();
              resolve({ success: false, error: error.message });
            });
          } else {
            cleanup();
            resolve({ success: false, error: 'Redirect without location header' });
          }
        } else if (response.statusCode !== 200) {
          cleanup();
          resolve({ success: false, error: `HTTP ${response.statusCode}` });
        } else {
          const totalSize = parseInt(response.headers['content-length'] || '0');
          let downloadedSize = 0;
          
          response.pipe(file);
          
          response.on('data', (chunk) => {
            if (downloadInfo.stopped) {
              response.destroy();
              cleanup();
              resolve({ success: false, error: 'Download stopped by user' });
              return;
            }
            
            downloadedSize += chunk.length;
            const progress = totalSize > 0 ? (downloadedSize / totalSize) * 100 : 0;
            
            if (mainWindow) {
              mainWindow.webContents.send('download-progress', {
                fileName: targetFileName,
                progress: Math.round(progress),
                downloadedSize,
                totalSize
              });
            }
          });
          
          file.on('finish', () => {
            if (downloadInfo.stopped) {
              cleanup();
              resolve({ success: false, error: 'Download stopped by user' });
              return;
            }
            
            file.close(() => {
              activeDownloads.delete(targetFileName);
              log.info(`Download completed: ${filePath}`);
              
              if (mainWindow) {
                mainWindow.webContents.send('download-progress', {
                  fileName: targetFileName,
                  progress: 100,
                  downloadedSize: totalSize,
                  totalSize
                });
              }
              
              resolve({ success: true, filePath });
            });
          });
          
          file.on('error', (error) => {
            cleanup();
            resolve({ success: false, error: error.message });
          });
        }
      });
      
      downloadInfo.request = request;
      
      request.on('error', (error) => {
        cleanup();
        resolve({ success: false, error: error.message });
      });
    });
  }

  ipcMain.handle('search-huggingface-models', async (_event, { query, limit = 20, sort = 'lastModified' }) => {
    try {
      let fetch;
      try {
        fetch = global.fetch || (await import('node-fetch')).default;
      } catch (importError) {
        const nodeFetch = require('node-fetch');
        fetch = nodeFetch.default || nodeFetch;
      }
      
      const sortOptions = {
        'lastModified': 'lastModified',
        'createdAt': 'createdAt', 
        'trending': 'downloads',
        'downloads': 'downloads',
        'likes': 'likes'
      };
      
      const sortParam = sortOptions[sort] || 'lastModified';
      const url = `https://huggingface.co/api/models?search=${encodeURIComponent(query)}&filter=gguf&limit=${limit}&sort=${sortParam}&full=true`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HuggingFace API error: ${response.status}`);
      }
      
      const models = await response.json();
      
      const ggufModels = models.filter(model => 
        model.tags && model.tags.includes('gguf') || 
        model.modelId.toLowerCase().includes('gguf') ||
        (model.siblings && model.siblings.some(file => file.rfilename.endsWith('.gguf')))
      ).map(model => ({
        id: model.modelId || model.id,
        name: model.modelId || model.id,
        downloads: model.downloads || 0,
        likes: model.likes || 0,
        tags: model.tags || [],
        description: model.description || '',
        author: model.author || model.modelId?.split('/')[0] || '',
        createdAt: model.createdAt || null,
        lastModified: model.lastModified || null,
        files: model.siblings || [],
        isVisionModel: isVisionModel(model),
        requiredMmprojFiles: findRequiredMmprojFiles(model.siblings || [])
      }));
      
      return { success: true, models: ggufModels };
    } catch (error) {
      log.error('Error searching HuggingFace models:', error);
      return { success: false, error: error.message, models: [] };
    }
  });

  ipcMain.handle('download-model-with-dependencies', async (_event, { modelId, fileName, allFiles, downloadPath }) => {
    try {
      const modelsDir = downloadPath || path.join(os.homedir(), '.clara', 'llama-models');
      if (!fs.existsSync(modelsDir)) {
        fs.mkdirSync(modelsDir, { recursive: true });
      }

      const isVision = isVisionModelByName(fileName);
      
      const mmprojFiles = allFiles.filter(file => 
        file.rfilename.toLowerCase().includes('mmproj') ||
        file.rfilename.toLowerCase().includes('mm-proj') ||
        file.rfilename.toLowerCase().includes('projection')
      );
      
      log.info(`🔍 Vision detection - isVision: ${isVision}, mmproj files found: ${mmprojFiles.length}`);
      if (mmprojFiles.length > 0) {
        log.info(`📁 Available mmproj files:`, mmprojFiles.map(f => f.rfilename));
      }
      
      const filesToDownload = [fileName];
      
      const splitFiles = allFiles.filter(file => {
        const filename = file.rfilename.toLowerCase();
        if (filename.match(/\d+-of-\d+\.gguf$/)) {
          const mainFileBase = fileName.toLowerCase().replace(/\.gguf$/, '').replace(/-\d+-of-\d+$/, '');
          const splitFileBase = filename.replace(/\.gguf$/, '').replace(/-\d+-of-\d+$/, '');
          
          return splitFileBase.includes(mainFileBase) || mainFileBase.includes(splitFileBase);
        }
        return false;
      });
      
      if (splitFiles.length > 0) {
        filesToDownload.splice(0, 1);
        splitFiles.forEach(splitFile => {
          filesToDownload.push(splitFile.rfilename);
          log.info(`🧩 Adding split file to download queue: ${splitFile.rfilename}`);
        });
        log.info(`📦 Split model detected: ${splitFiles.length} parts to download`);
      }
      
      if (mmprojFiles.length > 0) {
        mmprojFiles.forEach(mmprojFile => {
          filesToDownload.push(mmprojFile.rfilename);
          log.info(`👁️ Adding mmproj file to download queue: ${mmprojFile.rfilename}`);
        });
        
        const modelFileCount = splitFiles.length > 0 ? splitFiles.length : 1;
        log.info(`🎯 Total files to download: ${filesToDownload.length} (${modelFileCount} model + ${mmprojFiles.length} mmproj)`);
      } else if (isVision) {
        log.warn(`⚠️ Vision model detected by name but no mmproj files found in repository`);
      } else if (splitFiles.length > 0) {
        log.info(`🎯 Total split files to download: ${splitFiles.length}`);
      }
      
      const results = [];
      for (const file of filesToDownload) {
        try {
          log.info(`📥 Starting download: ${file}`);
          
          if (mainWindow) {
            mainWindow.webContents.send('download-started', {
              fileName: file,
              modelId,
              isVisionFile: file.toLowerCase().includes('mmproj')
            });
          }
          
          const result = await downloadSingleFile(modelId, file, modelsDir);
          results.push({ file, success: result.success, error: result.error });
          
          if (mainWindow) {
            mainWindow.webContents.send('download-completed', {
              fileName: file,
              modelId,
              success: result.success,
              error: result.error,
              isVisionFile: file.toLowerCase().includes('mmproj')
            });
          }
          
          log.info(`📥 Download ${result.success ? 'completed' : 'failed'}: ${file}${result.error ? ` (${result.error})` : ''}`);
        } catch (error) {
          log.error('Error in download loop for file:', file, error);
          results.push({ file, success: false, error: error.message });
          
          if (mainWindow) {
            mainWindow.webContents.send('download-completed', {
              fileName: file,
              modelId,
              success: false,
              error: error.message,
              isVisionFile: file.toLowerCase().includes('mmproj')
            });
          }
        }
      }
      
      const mainResult = results.find(r => r.file === fileName);
      log.info(`Main result check: looking for ${fileName} in results:`, results.map(r => r.file));
      log.info(`Main result found:`, mainResult);
      
      if (mainResult?.success) {
        try {
          if (llamaSwapService && llamaSwapService.getStatus().isRunning) {
            log.info('Restarting llama-swap service to load new models...');
            await llamaSwapService.restart();
            log.info('llama-swap service restarted successfully');
          }
        } catch (restartError) {
          log.warn('Failed to restart llama-swap service after download:', restartError);
        }
      }
      
      const returnValue = { 
        success: mainResult?.success || false, 
        results,
        downloadedFiles: results.filter(r => r.success).map(r => r.file)
      };
      
      log.info(`Returning from download-model-with-dependencies:`, returnValue);
      return returnValue;
      
    } catch (error) {
      log.error('Error downloading model with dependencies:', error);
      log.error('Error stack:', error.stack);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  });

  ipcMain.handle('download-huggingface-model', async (_event, { modelId, fileName, downloadPath }) => {
    try {
      const modelsDir = downloadPath || path.join(os.homedir(), '.clara', 'llama-models');
      if (!fs.existsSync(modelsDir)) {
        fs.mkdirSync(modelsDir, { recursive: true });
      }
      
      const flattenedFileName = path.basename(fileName);
      const filePath = path.join(modelsDir, flattenedFileName);
      
      if (fs.existsSync(filePath)) {
        return { success: false, error: 'File already exists' };
      }
      
      const downloadUrl = `https://huggingface.co/${modelId}/resolve/main/${fileName}`;
      log.info(`Starting download: ${downloadUrl} -> ${filePath}`);
      
      return new Promise((resolve) => {
        const protocol = downloadUrl.startsWith('https:') ? https : http;
        const file = fs.createWriteStream(filePath);
        let request;
        
        const downloadInfo = {
          request: null,
          file,
          filePath,
          stopped: false
        };
        activeDownloads.set(flattenedFileName, downloadInfo);
        
        const cleanup = () => {
          activeDownloads.delete(flattenedFileName);
          if (file && !file.destroyed) {
            file.close();
          }
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
            } catch (cleanupError) {
              log.warn('Error cleaning up file:', cleanupError);
            }
          }
        };
        
        request = protocol.get(downloadUrl, (response) => {
          downloadInfo.request = request;
          
          if (downloadInfo.stopped) {
            cleanup();
            resolve({ success: false, error: 'Download stopped by user' });
            return;
          }
          
          if (response.statusCode === 302 || response.statusCode === 301) {
            const redirectUrl = response.headers.location;
            if (redirectUrl) {
              const redirectProtocol = redirectUrl.startsWith('https:') ? https : http;
              const redirectRequest = redirectProtocol.get(redirectUrl, (redirectResponse) => {
                downloadInfo.request = redirectRequest;
                
                if (downloadInfo.stopped) {
                  cleanup();
                  resolve({ success: false, error: 'Download stopped by user' });
                  return;
                }
                
                if (redirectResponse.statusCode !== 200) {
                  cleanup();
                  resolve({ success: false, error: `HTTP ${redirectResponse.statusCode}` });
                  return;
                }
                
                const totalSize = parseInt(redirectResponse.headers['content-length'] || '0');
                let downloadedSize = 0;
                
                redirectResponse.pipe(file);
                
                redirectResponse.on('data', (chunk) => {
                  if (downloadInfo.stopped) {
                    redirectResponse.destroy();
                    cleanup();
                    resolve({ success: false, error: 'Download stopped by user' });
                    return;
                  }
                  
                  downloadedSize += chunk.length;
                  const progress = totalSize > 0 ? (downloadedSize / totalSize) * 100 : 0;
                  
                  if (mainWindow) {
                    mainWindow.webContents.send('download-progress', {
                      fileName,
                      progress: Math.round(progress),
                      downloadedSize,
                      totalSize
                    });
                  }
                });
                
                file.on('finish', () => {
                  if (downloadInfo.stopped) {
                    cleanup();
                    resolve({ success: false, error: 'Download stopped by user' });
                    return;
                  }
                  
                  file.close(async () => {
                    activeDownloads.delete(fileName);
                    log.info(`Download completed: ${filePath}`);
                    
                    try {
                      if (llamaSwapService && llamaSwapService.getStatus().isRunning) {
                        log.info('Restarting llama-swap service to load new models...');
                        await llamaSwapService.restart();
                        log.info('llama-swap service restarted successfully');
                      }
                    } catch (restartError) {
                      log.warn('Failed to restart llama-swap service after download:', restartError);
                    }
                    
                    resolve({ success: true, filePath });
                  });
                });
              });
              
              redirectRequest.on('error', (error) => {
                cleanup();
                resolve({ success: false, error: error.message });
              });
            } else {
              cleanup();
              resolve({ success: false, error: 'Redirect without location header' });
            }
          } else if (response.statusCode !== 200) {
            cleanup();
            resolve({ success: false, error: `HTTP ${response.statusCode}` });
          } else {
            const totalSize = parseInt(response.headers['content-length'] || '0');
            let downloadedSize = 0;
            
            response.pipe(file);
            
            response.on('data', (chunk) => {
              if (downloadInfo.stopped) {
                response.destroy();
                cleanup();
                resolve({ success: false, error: 'Download stopped by user' });
                return;
              }
              
              downloadedSize += chunk.length;
              const progress = totalSize > 0 ? (downloadedSize / totalSize) * 100 : 0;
              
              if (mainWindow) {
                mainWindow.webContents.send('download-progress', {
                  fileName,
                  progress: Math.round(progress),
                  downloadedSize,
                  totalSize
                });
              }
            });
            
            file.on('finish', () => {
              if (downloadInfo.stopped) {
                cleanup();
                resolve({ success: false, error: 'Download stopped by user' });
                return;
              }
              
              file.close(async () => {
                activeDownloads.delete(fileName);
                log.info(`Download completed: ${filePath}`);
                
                try {
                  if (llamaSwapService && llamaSwapService.getStatus().isRunning) {
                    log.info('Restarting llama-swap service to load new models...');
                    await llamaSwapService.restart();
                    log.info('llama-swap service restarted successfully');
                  }
                } catch (restartError) {
                  log.warn('Failed to restart llama-swap service after download:', restartError);
                }
                
                resolve({ success: true, filePath });
              });
            });
          }
        });
        
        downloadInfo.request = request;
        
        request.on('error', (error) => {
          cleanup();
          resolve({ success: false, error: error.message });
        });
      });
    } catch (error) {
      log.error('Error downloading model:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('download-huggingface-model-with-custom-name', async (_event, { modelId, fileName, customSaveName, downloadPath }) => {
    try {
      const modelsDir = downloadPath || path.join(os.homedir(), '.clara', 'llama-models');
      if (!fs.existsSync(modelsDir)) {
        fs.mkdirSync(modelsDir, { recursive: true });
      }

      log.info(`🎯 Starting custom name download: ${fileName} → ${customSaveName}`);
      
      const result = await downloadSingleFileWithRename(modelId, fileName, customSaveName, modelsDir);
      
      if (result.success) {
        log.info(`✅ Custom name download completed: ${customSaveName}`);
        
        try {
          if (llamaSwapService && llamaSwapService.getStatus().isRunning) {
            log.info('Restarting llama-swap service to load new models...');
            await llamaSwapService.restart();
            log.info('llama-swap service restarted successfully');
          }
        } catch (restartError) {
          log.warn('Failed to restart llama-swap service after download:', restartError);
        }
      }
      
      return result;
    } catch (error) {
      log.error('Error downloading model with custom name:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('stop-download', async (_event, { fileName }) => {
    try {
      const downloadInfo = activeDownloads.get(fileName);
      
      if (!downloadInfo) {
        return { success: false, error: 'Download not found or already completed' };
      }
      
      downloadInfo.stopped = true;
      
      if (downloadInfo.request) {
        downloadInfo.request.destroy();
      }
      
      if (downloadInfo.file && !downloadInfo.file.destroyed) {
        downloadInfo.file.close();
      }
      
      if (downloadInfo.filePath && require('fs').existsSync(downloadInfo.filePath)) {
        try {
          require('fs').unlinkSync(downloadInfo.filePath);
          log.info(`Removed partial download: ${downloadInfo.filePath}`);
        } catch (cleanupError) {
          log.warn('Error removing partial download:', cleanupError);
        }
      }
      
      activeDownloads.delete(fileName);
      log.info(`Download stopped: ${fileName}`);
      
      return { success: true };
    } catch (error) {
      log.error('Error stopping download:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-local-models', async () => {
    try {
      if (!llamaSwapService) {
        llamaSwapService = new LlamaSwapService(ipcLogger);
      }
      
      const models = await llamaSwapService.scanModels();
      return { success: true, models };
    } catch (error) {
      log.error('Error getting local models:', error);
      return { success: false, error: error.message, models: [] };
    }
  });

  ipcMain.handle('delete-local-model', async (_event, { filePath }) => {
    try {
      const defaultModelsDir = path.join(os.homedir(), '.clara', 'llama-models');
      const normalizedPath = path.resolve(filePath);
      const normalizedDefaultDir = path.resolve(defaultModelsDir);
      
      let isValidPath = normalizedPath.startsWith(normalizedDefaultDir);
      
      if (!isValidPath && llamaSwapService) {
        const customPaths = llamaSwapService.getCustomModelPaths();
        for (const customPath of customPaths) {
          if (customPath) {
            const normalizedCustomDir = path.resolve(customPath);
            if (normalizedPath.startsWith(normalizedCustomDir)) {
              isValidPath = true;
              break;
            }
          }
        }
      }
      
      if (!isValidPath) {
        throw new Error('Invalid file path - security violation');
      }
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        log.info(`Deleted model: ${filePath}`);
        
        try {
          if (llamaSwapService && llamaSwapService.getStatus().isRunning) {
            log.info('Restarting llama-swap service to reload models after deletion...');
            await llamaSwapService.restart();
            log.info('llama-swap service restarted successfully after model deletion');
          }
        } catch (restartError) {
          log.warn('Failed to restart llama-swap service after model deletion:', restartError);
        }
        
        return { success: true };
      } else {
        return { success: false, error: 'File not found' };
      }
    } catch (error) {
      log.error('Error deleting model:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = {
  registerModelManagerHandlers,
};