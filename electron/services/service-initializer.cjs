const { app } = require('electron');
const path = require('path');
const log = require('electron-log');
const fs = require('fs');
const DockerSetup = require('../dockerSetup.cjs');
const FeatureSelectionScreen = require('../featureSelection.cjs');
const LlamaSwapService = require('../llamaSwapService.cjs');
const MCPService = require('../mcpService.cjs');
const WatchdogService = require('../watchdogService.cjs');
const ComfyUIModelService = require('../comfyUIModelService.cjs');
const PlatformManager = require('../platformManager.cjs');
const { platformUpdateService } = require('../updateService.cjs');
const IPCLogger = require('../ipcLogger.cjs');
const WidgetService = require('../widgetService.cjs');
const { SchedulerElectronService } = require('../schedulerElectronService.cjs');
const CentralServiceManager = require('../centralServiceManager.cjs');
const ServiceConfigurationManager = require('../serviceConfiguration.cjs');
const { registerAllHandlers } = require('../ipc/index.cjs');
const { createMainWindow } = require('../main/window-manager.cjs');
const { askToStartDockerDesktop } = require('../utils/helpers.cjs');

function resolveTasksDbPath(app, isProd) {
  const envPath = process.env.CLARA_DB_PATH ? path.resolve(process.env.CLARA_DB_PATH) : null;
  const defaultPath = path.join(app.getPath('userData'), 'clara_tasks.db');

  if (envPath) {
    console.log('[tasks][db] Using CLARA_DB_PATH:', envPath);
    return envPath;
  }

  if (!isProd) {
    if (!fs.existsSync(defaultPath)) {
      const repoRoot = path.resolve('clara_tasks.db');
      const electronDb = path.resolve(__dirname, '../database/clara_tasks.db');
      try {
        const seed = fs.existsSync(repoRoot) ? repoRoot : (fs.existsSync(electronDb) ? electronDb : null);
        if (seed) {
          fs.mkdirSync(path.dirname(defaultPath), { recursive: true });
          fs.copyFileSync(seed, defaultPath);
          console.log('[tasks][db] Seeded userData DB from:', seed, '->', defaultPath);
        } else {
          console.log('[tasks][db] No seed DB found; creating empty at:', defaultPath);
        }
      } catch (e) {
        console.warn('[tasks][db] Failed seeding DB:', (e && e.message) ? e.message : e);
      }
    }
  }

  console.log('[tasks][db] Using DB at:', defaultPath);
  return defaultPath;
}

let dockerSetup;
let llamaSwapService;
let mcpService;
let watchdogService;
let updateService;
let comfyUIModelService;
let widgetService;
let schedulerService;
let initializationInProgress = false;
let initializationComplete = false;
let serviceConfigManager;
let centralServiceManager;
let ipcLogger;

async function initialize() {
  try {
    console.log('🚀 Starting application initialization (fast mode)');
    
    const featureSelection = new FeatureSelectionScreen();
    let selectedFeatures = null;
    
    if (featureSelection.isFirstTimeLaunch()) {
      console.log('🎯 First time launch detected - will show onboarding in main app');
      selectedFeatures = {
        comfyUI: false,
        n8n: false,
        ragAndTts: false,
        claraCore: true
      };
      global.needsFeatureSelection = true;
    } else {
      selectedFeatures = FeatureSelectionScreen.getCurrentConfig();
      console.log('📋 Loaded existing feature configuration:', selectedFeatures);
      global.needsFeatureSelection = false;
    }
    
    global.selectedFeatures = selectedFeatures;
    
    console.log('⚡ Fast startup mode - skipping splash screen');

    // Initialize TaskService early so it's available for handler registration
    let taskService;
    try {
      const { TaskService } = require('./taskService.cjs');
      const isProd = app.isPackaged || process.env.NODE_ENV === 'production';
      const dbPath = resolveTasksDbPath(app, isProd);
      taskService = TaskService.getInstance(dbPath);
      console.log('✅ Task Service initialized early for handler registration');
    } catch (error) {
      console.warn('⚠️ Task Service initialization failed, will retry later:', error.message);
    }

    if (!global.handlersRegistered) {
        console.log('🚀 Registering all IPC handlers through service initializer...');
        console.log('📊 Global state before registration:', {
          handlersRegistered: global.handlersRegistered,
          needsFeatureSelection: global.needsFeatureSelection,
          selectedFeatures: global.selectedFeatures,
          taskServiceInitialized: !!taskService
        });

        registerAllHandlers({
          dockerSetup,
          llamaSwapService,
          mcpService,
          watchdogService,
          serviceConfigManager,
          centralServiceManager,
          ipcLogger,
          mainWindow: require('../main/window-manager.cjs').mainWindow,
          activeDownloads: new Map(),
          widgetService,
          taskService,
        });

        global.handlersRegistered = true;
        console.log('📊 Global state after registration:', {
          handlersRegistered: global.handlersRegistered,
          needsFeatureSelection: global.needsFeatureSelection,
          selectedFeatures: global.selectedFeatures,
          taskServiceInitialized: !!taskService
        });
        console.log('✅ IPC handlers registration completed');
      } else {
        console.log('⚠️ Handlers already registered, skipping registration');
      }
    
    console.log('📱 Creating main window immediately...');
    await createMainWindow();
    
    const { mainWindow } = require('../main/window-manager.cjs');
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow.webContents.send('app-initialization-state', {
        needsFeatureSelection: global.needsFeatureSelection,
        selectedFeatures: selectedFeatures,
        status: 'initializing'
      });
    });
    
    initializeInBackground(selectedFeatures);
    
  } catch (error) {
    log.error(`Initialization error: ${error.message}`, error);
    if (!require('../main/window-manager.cjs').mainWindow) {
          await createMainWindow();
        }
        require('../main/window-manager.cjs').mainWindow.webContents.send('app-initialization-state', {
      status: 'error',
      error: error.message
    });
  }
}

async function initializeInBackground(selectedFeatures) {
  initializationInProgress = true;
  
  try {
    const { mainWindow } = require('../main/window-manager.cjs');
    const sendStatusUpdate = (status, details = {}) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('service-status-update', { status, ...details });
      }
    };
    
    sendStatusUpdate('validating', { message: 'Validating system resources...' });
    let systemConfig;
    try {
      const platformManager = new PlatformManager(path.join(__dirname, 'llamacpp-binaries'));
      systemConfig = await platformManager.validateSystemResources();
      
      if (systemConfig.osCompatibility && !systemConfig.osCompatibility.isSupported) {
        log.error('🚨 Critical OS compatibility issue detected');
        systemConfig.performanceMode = 'core-only';
        systemConfig.enabledFeatures = {
          claraCore: true,
          dockerServices: false,
          comfyUI: false,
          advancedFeatures: false
        };
        sendStatusUpdate('warning', { 
          message: 'OS compatibility issue - Limited functionality',
          osCompatibility: systemConfig.osCompatibility
        });
      }
    } catch (error) {
      log.error('System resource validation failed:', error);
      systemConfig = null;
    }
    
    global.systemConfig = systemConfig;
    
    sendStatusUpdate('initializing', { message: 'Initializing service configuration...' });
    try {
      serviceConfigManager = new ServiceConfigurationManager();
      centralServiceManager = new CentralServiceManager(serviceConfigManager);
      
      const { SERVICE_DEFINITIONS } = require('../serviceDefinitions.cjs');
      Object.keys(SERVICE_DEFINITIONS).forEach(serviceName => {
        const serviceDefinition = SERVICE_DEFINITIONS[serviceName];
        centralServiceManager.registerService(serviceName, serviceDefinition);
      });
    } catch (error) {
      log.warn('Service configuration managers initialization failed:', error);
    }
    
    sendStatusUpdate('checking-docker', { message: 'Checking Docker availability...' });
    dockerSetup = new DockerSetup();
    let isDockerAvailable = false;
    
    if (!systemConfig || systemConfig.enabledFeatures.dockerServices !== false) {
      isDockerAvailable = await dockerSetup.isDockerRunning();
    }
    
    sendStatusUpdate('downloading-binaries', { message: 'Ensuring core binaries are available...' });
    try {
      if (!llamaSwapService) {
        llamaSwapService = new LlamaSwapService(ipcLogger);
      }
      
      await llamaSwapService.validateBinaries();
      sendStatusUpdate('binaries-ready', { message: 'Core binaries ready' });
      console.log('✅ Core binaries validated and ready');
    } catch (binaryError) {
      log.error('❌ Failed to ensure core binaries:', binaryError);
      sendStatusUpdate('binaries-error', { 
        message: 'Failed to download core binaries - some features may not work',
        error: binaryError.message 
      });
    }
    
    const hasUserConsent = !global.needsFeatureSelection;
    
    if (hasUserConsent) {
      let shouldAutoStartServices = false;
      try {
        shouldAutoStartServices = false;
      } catch (error) {
        log.warn('Could not check auto-start preference, defaulting to false:', error);
        shouldAutoStartServices = false;
      }
      
      if (shouldAutoStartServices) {
        console.log('✅ User consent obtained and auto-start enabled - initializing selected services');
        if (isDockerAvailable) {
          sendStatusUpdate('docker-available', { message: 'Docker detected - Setting up services...' });
          await initializeServicesWithDocker(selectedFeatures, sendStatusUpdate);
        } else {
          sendStatusUpdate('docker-not-available', { message: 'Docker not available - Running in lightweight mode...' });
          await initializeServicesWithoutDocker(selectedFeatures, sendStatusUpdate);
        }
      } else {
        console.log('✅ User consent obtained but auto-start disabled - services available on demand');
        sendStatusUpdate('consent-no-autostart', { 
          message: 'Services available - start them manually when needed',
          dockerAvailable: isDockerAvailable 
        });
      }
    } else {
      console.log('⏳ First time launch - waiting for user consent before starting services');
      sendStatusUpdate('waiting-for-consent', { 
        message: 'Waiting for user to complete onboarding before starting services...',
        dockerAvailable: isDockerAvailable 
      });
    }
    
    sendStatusUpdate('initializing-scheduler', { message: 'Initializing task scheduler...' });

    // TaskService should already be initialized from the main initialization
    if (taskService) {
      if (!schedulerService) {
        schedulerService = new SchedulerElectronService(mainWindow, taskService);
        log.info('✅ ClaraVerse Scheduler initialized successfully');
      }
    } else {
      // Fallback: try to initialize TaskService if it wasn't done earlier
      try {
        const { TaskService } = require('./taskService.cjs');
        const isProd = app.isPackaged || process.env.NODE_ENV === 'production';
        const dbPath = resolveTasksDbPath(app, isProd);
        taskService = TaskService.getInstance(dbPath);
        log.info('✅ Task Service initialized in background (fallback)');

        if (!schedulerService) {
          schedulerService = new SchedulerElectronService(mainWindow, taskService);
          log.info('✅ ClaraVerse Scheduler initialized successfully');
        }
      } catch (error) {
        log.error('❌ Failed to initialize Task Service or Scheduler:', error);
      }
    }
    
    sendStatusUpdate('ready', { message: 'All services initialized' });
    
    initializationComplete = true;
    initializationInProgress = false;
    
  } catch (error) {
    log.error('Background initialization error:', error);
    initializationInProgress = false;
    const { mainWindow } = require('../main/window-manager.cjs');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('service-status-update', { 
        status: 'error', 
        error: error.message 
      });
    }
  }
}

async function initializeServicesWithDocker(selectedFeatures, sendStatusUpdate) {
  try {
    llamaSwapService = new LlamaSwapService(ipcLogger);
    updateService = platformUpdateService;
    
    if (selectedFeatures.ragAndTts) {
      mcpService = new MCPService();
    }
    
    sendStatusUpdate('docker-initializing', { message: 'Setting up Docker containers...' });
    await dockerSetup.setup(selectedFeatures, (status) => {
      sendStatusUpdate('docker-setup', { message: status });
    });
    
    sendStatusUpdate('starting-services', { message: 'Starting background services...' });
    await initializeServicesInBackground();
    
    watchdogService = new WatchdogService(dockerSetup, llamaSwapService, mcpService);
    watchdogService.start();
    
  } catch (error) {
    log.error('Error initializing services with Docker:', error);
    throw error;
  }
}

async function initializeServicesWithoutDocker(selectedFeatures, sendStatusUpdate) {
  try {
    llamaSwapService = new LlamaSwapService(ipcLogger);
    updateService = platformUpdateService;
    
    if (selectedFeatures.ragAndTts) {
      mcpService = new MCPService();
    }
    
    sendStatusUpdate('starting-services', { message: 'Starting services...' });
    await initializeServicesInBackground();
    
  } catch (error) {
    log.error('Error initializing services without Docker:', error);
    throw error;
  }
}

// TaskService will be initialized in the initialize() function
let taskService;

module.exports = {
  initialize,
  dockerSetup,
  llamaSwapService,
  mcpService,
  watchdogService,
  updateService,
  comfyUIModelService,
  widgetService,
  schedulerService,
  serviceConfigManager,
  centralServiceManager,
  ipcLogger,
  taskService, // Export taskService instance
};