const { ipcMain } = require('electron');
const log = require('electron-log');
const MCPService = require('../mcpService.cjs');
const ServiceConfigurationManager = require('../serviceConfiguration.cjs');
const CentralServiceManager = require('../centralServiceManager.cjs');

function registerMCPHandlers(mcpService, serviceConfigManager, centralServiceManager) {
  function ensureMCPService() {
    if (!mcpService) {
      log.info('MCP service not initialized, creating new instance...');
      mcpService = new MCPService();
    }
    return mcpService;
  }

  function ensureServiceConfigManager() {
    if (!serviceConfigManager) {
      log.info('Service config manager not initialized, creating new instance...');
      try {
        serviceConfigManager = new ServiceConfigurationManager();
        if (!centralServiceManager) {
          centralServiceManager = new CentralServiceManager(serviceConfigManager);
          
          const { SERVICE_DEFINITIONS } = require('../serviceDefinitions.cjs');
          Object.keys(SERVICE_DEFINITIONS).forEach(serviceName => {
            const serviceDefinition = SERVICE_DEFINITIONS[serviceName];
            centralServiceManager.registerService(serviceName, serviceDefinition);
          });
        }
      } catch (error) {
        log.warn('Failed to initialize service config manager:', error);
        return null;
      }
    }
    return serviceConfigManager;
  }

  ipcMain.handle('mcp-get-servers', async () => {
    try {
      const service = ensureMCPService();
      return service.getAllServers();
    } catch (error) {
      log.error('Error getting MCP servers:', error);
      return [];
    }
  });

  ipcMain.handle('mcp-add-server', async (event, serverConfig) => {
    try {
      const service = ensureMCPService();
      const result = await service.addServer(serverConfig);
      
      if (result === true && serverConfig.name) {
        try {
          log.info(`Auto-starting newly added MCP server: ${serverConfig.name}`);
          await service.startServer(serverConfig.name);
          log.info(`Successfully auto-started MCP server: ${serverConfig.name}`);
        } catch (startError) {
          log.warn(`Failed to auto-start newly added MCP server ${serverConfig.name}:`, startError);
        }
      }
      
      return result;
    } catch (error) {
      log.error('Error adding MCP server:', error);
      throw error;
    }
  });

  ipcMain.handle('mcp-remove-server', async (event, name) => {
    try {
      const service = ensureMCPService();
      return await service.removeServer(name);
    } catch (error) {
      log.error('Error removing MCP server:', error);
      throw error;
    }
  });

  ipcMain.handle('mcp-update-server', async (event, name, updates) => {
    try {
      const service = ensureMCPService();
      return await service.updateServer(name, updates);
    } catch (error) {
      log.error('Error updating MCP server:', error);
      throw error;
    }
  });

  ipcMain.handle('mcp-start-server', async (event, name) => {
    try {
      const service = ensureMCPService();
      const serverInfo = await service.startServer(name);
      
      return {
        name: serverInfo.name,
        config: serverInfo.config,
        startedAt: serverInfo.startedAt,
        status: serverInfo.status,
        pid: serverInfo.process?.pid
      };
    } catch (error) {
      log.error('Error starting MCP server:', error);
      throw error;
    }
  });

  ipcMain.handle('mcp-stop-server', async (event, name) => {
    try {
      const service = ensureMCPService();
      return await service.stopServer(name);
    } catch (error) {
      log.error('Error stopping MCP server:', error);
      throw error;
    }
  });

  ipcMain.handle('mcp-restart-server', async (event, name) => {
    try {
      const service = ensureMCPService();
      const serverInfo = await service.restartServer(name);
      
      return {
        name: serverInfo.name,
        config: serverInfo.config,
        startedAt: serverInfo.startedAt,
        status: serverInfo.status,
        pid: serverInfo.process?.pid
      };
    } catch (error) {
      log.error('Error restarting MCP server:', error);
      throw error;
    }
  });

  ipcMain.handle('mcp-get-server-status', async (event, name) => {
    try {
      const service = ensureMCPService();
      return service.getServerStatus(name);
    } catch (error) {
      log.error('Error getting MCP server status:', error);
      return null;
    }
  });

  ipcMain.handle('mcp-test-server', async (event, name) => {
    try {
      const service = ensureMCPService();
      return await service.testServer(name);
    } catch (error) {
      log.error('Error testing MCP server:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('mcp-get-templates', async () => {
    try {
      const service = ensureMCPService();
      return service.getServerTemplates();
    } catch (error) {
      log.error('Error getting MCP templates:', error);
      return [];
    }
  });

  ipcMain.handle('mcp-start-all-enabled', async () => {
    try {
      const service = ensureMCPService();
      return await service.startAllEnabledServers();
    } catch (error) {
      log.error('Error starting all enabled MCP servers:', error);
      throw error;
    }
  });

  ipcMain.handle('mcp-stop-all', async () => {
    try {
      const service = ensureMCPService();
      return await service.stopAllServers();
    } catch (error) {
      log.error('Error stopping all MCP servers:', error);
      throw error;
    }
  });

  ipcMain.handle('mcp-import-claude-config', async (event, configPath) => {
    try {
      const service = ensureMCPService();
      const result = await service.importFromClaudeConfig(configPath);
      
      if (result && result.imported > 0) {
        log.info(`Auto-starting ${result.imported} imported MCP servers`);
        
        const allServers = await service.getServers();
        const recentlyImported = Object.keys(allServers).filter(name => {
          const server = allServers[name];
          return server.description && server.description.includes('Imported from Claude Desktop');
        });
        
        for (const serverName of recentlyImported) {
          try {
            await service.startServer(serverName);
            log.info(`Successfully auto-started imported MCP server: ${serverName}`);
          } catch (startError) {
            log.warn(`Failed to auto-start imported MCP server ${serverName}:`, startError);
          }
        }
      }
      
      return result;
    } catch (error) {
      log.error('Error importing Claude config:', error);
      throw error;
    }
  });

  ipcMain.handle('mcp-start-previously-running', async () => {
    try {
      const service = ensureMCPService();
      return await service.startPreviouslyRunningServers();
    } catch (error) {
      log.error('Error starting previously running MCP servers:', error);
      throw error;
    }
  });

  ipcMain.handle('mcp-save-running-state', async () => {
    try {
      const service = ensureMCPService();
      service.saveRunningState();
      return true;
    } catch (error) {
      log.error('Error saving MCP server running state:', error);
      throw error;
    }
  });

  ipcMain.handle('mcp-execute-tool', async (event, toolCall) => {
    try {
      const service = ensureMCPService();
      return await service.executeToolCall(toolCall);
    } catch (error) {
      log.error('Error executing MCP tool call:', error);
      throw error;
    }
  });

  ipcMain.handle('mcp-diagnose-node', async () => {
    try {
      const service = ensureMCPService();
      return await service.diagnoseNodeInstallation();
    } catch (error) {
      log.error('Error diagnosing Node.js installation:', error);
      return {
        nodeAvailable: false,
        npmAvailable: false,
        npxAvailable: false,
        suggestions: ['Error occurred while diagnosing Node.js installation: ' + error.message]
      };
    }
  });
}

module.exports = {
  registerMCPHandlers,
};