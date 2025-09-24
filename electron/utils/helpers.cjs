const { dialog } = require('electron');
const log = require('electron-log');

// Helper function to get or create ComfyUI configuration
const getComfyUIConfig = (dockerSetup) => {
  if (!dockerSetup) {
    throw new Error('Docker setup not initialized');
  }

  // Check if ComfyUI is supported on this platform
  if (process.platform !== 'win32') {
    throw new Error(`ComfyUI is not supported on ${process.platform}. It requires Windows with NVIDIA GPU support.`);
  }

  // Get ComfyUI configuration
  let comfyuiConfig = dockerSetup.containers.comfyui;
  
  // If ComfyUI config is not available (was filtered out during setup), create it
  if (!comfyuiConfig) {
    log.info('ComfyUI configuration not found in enabled containers, creating configuration...');
    comfyuiConfig = {
      name: 'clara_comfyui',
      image: dockerSetup.getArchSpecificImage('clara17verse/clara-comfyui', 'with-custom-nodes'),
      port: 8188,
      internalPort: 8188,
      healthCheck: dockerSetup.isComfyUIRunning.bind(dockerSetup),
      volumes: dockerSetup.getComfyUIVolumes(),
      environment: [
        'NVIDIA_VISIBLE_DEVICES=all',
        'CUDA_VISIBLE_DEVICES=0',
        'PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:2048,expandable_segments:True',
        'CUDA_LAUNCH_BLOCKING=0',
        'TORCH_CUDNN_V8_API_ENABLED=1',
        'CUDA_MODULE_LOADING=LAZY',
        'XFORMERS_MORE_DETAILS=0',
        'COMFYUI_FORCE_FP16=1',
        'COMFYUI_DISABLE_XFORMERS_WARNING=1',
        'COMFYUI_HIGHVRAM=1',
        'COMFYUI_DISABLE_MODEL_OFFLOAD=1',
        'COMFYUI_VRAM_USAGE=gpu-only'
      ],
      runtime: 'nvidia',
      restartPolicy: 'unless-stopped'
    };
    
    // Add the ComfyUI config back to the containers object
    dockerSetup.containers.comfyui = comfyuiConfig;
  }

  return comfyuiConfig;
};

// Helper function to get or create N8N configuration
const getN8NConfig = (dockerSetup) => {
  if (!dockerSetup) {
    throw new Error('Docker setup not initialized');
  }

  // Get N8N configuration
  let n8nConfig = dockerSetup.containers.n8n;
  
  // If N8N config is not available (was filtered out during setup), create it
  if (!n8nConfig) {
    log.info('N8N configuration not found in enabled containers, creating configuration...');
    n8nConfig = {
      name: 'clara_n8n',
      image: dockerSetup.getArchSpecificImage('n8nio/n8n', 'latest'),
      port: 5678,
      internalPort: 5678,
      healthCheck: dockerSetup.checkN8NHealth.bind(dockerSetup),
      volumes: [
        `${require('path').join(require('os').homedir(), '.clara', 'n8n')}:/home/node/.n8n`
      ]
    };
    
    // Add the N8N config back to the containers object
    dockerSetup.containers.n8n = n8nConfig;
  }

  return n8nConfig;
};

// Helper function to get or create Python backend configuration
const getPythonConfig = (dockerSetup) => {
  if (!dockerSetup) {
    throw new Error('Docker setup not initialized');
  }

  // Get Python configuration
  let pythonConfig = dockerSetup.containers.python;
  
  // If Python config is not available (was filtered out during setup), create it
  if (!pythonConfig) {
    log.info('Python backend configuration not found in enabled containers, creating configuration...');
    pythonConfig = {
      name: 'clara_python',
      image: dockerSetup.getArchSpecificImage('clara17verse/clara-backend', 'latest'),
      port: 5001,
      internalPort: 5000,
      healthCheck: dockerSetup.isPythonRunning.bind(dockerSetup),
      volumes: [
        // Mount the python_backend_data folder as the clara user's home directory
        `${dockerSetup.pythonBackendDataPath}:/home/clara`,
        // Keep backward compatibility for existing data paths
        'clara_python_models:/app/models'
      ],
      volumeNames: ['clara_python_models']
    };
    
    // Add the Python config back to the containers object
    dockerSetup.containers.python = pythonConfig;
  }

  return pythonConfig;
};

/**
 * Helper function to show dialogs properly during startup when loading screen is active
 * Temporarily disables alwaysOnTop to allow dialogs to appear above loading screen
 */
async function showStartupDialog(loadingScreen, dialogType, title, message, buttons = ['OK']) {
  // Temporarily disable alwaysOnTop for loading screen
  if (loadingScreen) {
    loadingScreen.setAlwaysOnTop(false);
  }
  
  try {
    // Show dialog with proper window options
    const result = await dialog.showMessageBox(loadingScreen ? loadingScreen.window : null, {
      type: dialogType,
      title: title,
      message: message,
      buttons: buttons,
      alwaysOnTop: true,
      modal: true
    });
    return result;
  } finally {
    // Re-enable alwaysOnTop for loading screen
    if (loadingScreen) {
      loadingScreen.setAlwaysOnTop(true);
    }
  }
}

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

module.exports = {
  getComfyUIConfig,
  getN8NConfig,
  getPythonConfig,
  showStartupDialog,
  formatBytes,
};