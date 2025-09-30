const { registerDockerContainerHandlers } = require('./docker-handlers.cjs');
const { registerLlamaSwapHandlers } = require('./llamaswap-handlers.cjs');
const { registerMCPHandlers } = require('./mcp-handlers.cjs');
const { registerModelManagerHandlers } = require('./model-manager-handlers.cjs');
const { registerComfyUIHandlers } = require('./comfyui-handlers.cjs');
const { registerN8NHandlers } = require('./n8n-handlers.cjs');
const { registerPythonBackendHandlers } = require('./python-backend-handlers.cjs');
const { registerWidgetServiceHandlers } = require('./widget-service-handlers.cjs');
const { registerServiceConfigurationHandlers } = require('./service-config-handlers.cjs');
const { registerAppHandlers } = require('./app-handlers.cjs');
const { registerWatchdogHandlers } = require('./watchdog-handlers.cjs');
const { registerPersonalTaskHandlers } = require('./task-handlers.cjs');
const { registerVoiceHandlers } = require('./voice-handlers.cjs');

function registerAllHandlers(services) {
   console.log('🔧 Registering all IPC handlers...');
   console.log('📋 Services received for handler registration:', {
     hasServices: !!services,
     dockerSetup: !!services?.dockerSetup,
     llamaSwapService: !!services?.llamaSwapService,
     mcpService: !!services?.mcpService,
     watchdogService: !!services?.watchdogService,
     serviceConfigManager: !!services?.serviceConfigManager,
     centralServiceManager: !!services?.centralServiceManager,
     ipcLogger: !!services?.ipcLogger,
     mainWindow: !!services?.mainWindow,
     activeDownloads: !!services?.activeDownloads,
     widgetService: !!services?.widgetService,
     voiceAgent: !!services?.voiceAgent
   });

   const { dockerSetup, llamaSwapService, mcpService, watchdogService, serviceConfigManager, centralServiceManager, ipcLogger, mainWindow, activeDownloads, taskService, voiceAgent } = services;

   try {
    registerAppHandlers(ipcLogger, dockerSetup, llamaSwapService, mcpService, watchdogService, taskService);
    registerDockerContainerHandlers(dockerSetup);
    registerLlamaSwapHandlers(llamaSwapService, ipcLogger);
    registerMCPHandlers(mcpService, serviceConfigManager, centralServiceManager);
    registerModelManagerHandlers(llamaSwapService, mainWindow, activeDownloads);
    registerComfyUIHandlers(dockerSetup, serviceConfigManager);
    registerN8NHandlers(dockerSetup, serviceConfigManager);
    registerPythonBackendHandlers(dockerSetup, serviceConfigManager);
    registerWidgetServiceHandlers(services.widgetService);
    registerServiceConfigurationHandlers(serviceConfigManager, centralServiceManager);
    registerWatchdogHandlers(watchdogService);

    console.log('📋 Registering personal task handlers...');
    registerPersonalTaskHandlers(taskService);

    console.log('🎤 Registering voice handlers...');
    registerVoiceHandlers(voiceAgent);
    console.log('✅ All IPC handlers registered successfully');
  } catch (error) {
    console.error('❌ Error registering IPC handlers:', error);
  }
}

module.exports = {
  registerAllHandlers,
};