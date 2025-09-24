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

function registerAllHandlers(services) {
  const { dockerSetup, llamaSwapService, mcpService, watchdogService, serviceConfigManager, centralServiceManager, ipcLogger, mainWindow, activeDownloads } = services;

  registerDockerContainerHandlers(dockerSetup);
  registerLlamaSwapHandlers(llamaSwapService, ipcLogger);
  registerMCPHandlers(mcpService, serviceConfigManager, centralServiceManager);
  registerModelManagerHandlers(llamaSwapService, mainWindow, activeDownloads);
  registerComfyUIHandlers(dockerSetup, serviceConfigManager);
  registerN8NHandlers(dockerSetup, serviceConfigManager);
  registerPythonBackendHandlers(dockerSetup, serviceConfigManager);
  registerWidgetServiceHandlers(services.widgetService);
  registerServiceConfigurationHandlers(serviceConfigManager, centralServiceManager);
  registerAppHandlers(ipcLogger, dockerSetup, llamaSwapService, mcpService, watchdogService);
    registerWatchdogHandlers(watchdogService);
  registerPersonalTaskHandlers();
}

module.exports = {
  registerAllHandlers,
};