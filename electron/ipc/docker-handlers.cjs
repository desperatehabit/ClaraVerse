const { ipcMain } = require('electron');
const log = require('electron-log');
const { formatBytes } = require('../utils/helpers.cjs');

function registerDockerContainerHandlers(dockerSetup) {
  ipcMain.handle('get-containers', async () => {
    try {
      if (!dockerSetup || !dockerSetup.docker) {
        log.error('Docker setup not initialized');
        return [];
      }
      
      const docker = dockerSetup.docker;
      const containers = await docker.listContainers({ all: true });
      
      return containers.map((container) => {
        const ports = container.Ports.map((p) => 
          p.PublicPort ? `${p.PublicPort}:${p.PrivatePort}` : `${p.PrivatePort}`
        );
        
        return {
          id: container.Id,
          name: container.Names[0].replace(/^\//, ''),
          image: container.Image,
          status: container.Status,
          state: container.State === 'running' ? 'running' : 
                 container.State === 'exited' ? 'stopped' : container.State,
          ports: ports,
          created: new Date(container.Created * 1000).toLocaleString()
        };
      });
    } catch (error) {
      log.error('Error listing containers:', error);
      return [];
    }
  });

  ipcMain.handle('container-action', async (_event, { containerId, action }) => {
    try {
      if (!dockerSetup || !dockerSetup.docker) {
        log.error('Docker setup not initialized');
        throw new Error('Docker setup not initialized');
      }
      
      const docker = dockerSetup.docker;
      const container = docker.getContainer(containerId);
      
      switch (action) {
        case 'start':
          await container.start();
          break;
        case 'stop':
          await container.stop();
          break;
        case 'restart':
          await container.restart();
          break;
        case 'remove':
          await container.remove({ force: true });
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      
      return { success: true };
    } catch (error) {
      log.error(`Error performing action ${action} on container:`, error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('create-container', async (_event, containerConfig) => {
    try {
      if (!dockerSetup || !dockerSetup.docker) {
        log.error('Docker setup not initialized');
        throw new Error('Docker setup not initialized');
      }
      
      const docker = dockerSetup.docker;
      
      const portBindings = {};
      const exposedPorts = {};
      
      containerConfig.ports.forEach((port) => {
        const containerPort = `${port.container}/tcp`;
        exposedPorts[containerPort] = {};
        portBindings[containerPort] = [{ HostPort: port.host.toString() }];
      });
      
      const binds = containerConfig.volumes.map((volume) => 
        `${volume.host}:${volume.container}`
      );
      
      const env = Object.entries(containerConfig.env || {}).map(([key, value]) => `${key}=${value}`);
      
      const container = await docker.createContainer({
        Image: containerConfig.image,
        name: containerConfig.name,
        ExposedPorts: exposedPorts,
        Env: env,
        HostConfig: {
          PortBindings: portBindings,
          Binds: binds,
          NetworkMode: 'clara_network'
        }
      });
      
      await container.start();
      
      return { success: true, id: container.id };
    } catch (error) {
      log.error('Error creating container:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-container-stats', async (_event, containerId) => {
    try {
      if (!dockerSetup || !dockerSetup.docker) {
        log.error('Docker setup not initialized');
        throw new Error('Docker setup not initialized');
      }
      
      const docker = dockerSetup.docker;
      const container = docker.getContainer(containerId);
      
      const stats = await container.stats({ stream: false });
      
      const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
      const systemCpuDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
      const cpuCount = stats.cpu_stats.online_cpus || 1;
      const cpuPercent = (cpuDelta / systemCpuDelta) * cpuCount * 100;
      
      const memoryUsage = stats.memory_stats.usage || 0;
      const memoryLimit = stats.memory_stats.limit || 1;
      const memoryPercent = (memoryUsage / memoryLimit) * 100;
      
      let networkRx = 0;
      let networkTx = 0;
      
      if (stats.networks) {
        Object.keys(stats.networks).forEach(iface => {
          networkRx += stats.networks[iface].rx_bytes || 0;
          networkTx += stats.networks[iface].tx_bytes || 0;
        });
      }
      
      return {
        cpu: `${cpuPercent.toFixed(2)}%`,
        memory: `${formatBytes(memoryUsage)} / ${formatBytes(memoryLimit)} (${memoryPercent.toFixed(2)}%)`,
        network: `↓ ${formatBytes(networkRx)} / ↑ ${formatBytes(networkTx)}`
      };
    } catch (error) {
      log.error('Error getting container stats:', error);
      return { cpu: 'N/A', memory: 'N/A', network: 'N/A' };
    }
  });

  ipcMain.handle('get-container-logs', async (_event, containerId) => {
    try {
      if (!dockerSetup || !dockerSetup.docker) {
        log.error('Docker setup not initialized');
        throw new Error('Docker setup not initialized');
      }
      
      const docker = dockerSetup.docker;
      const container = docker.getContainer(containerId);
      
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail: 100,
        follow: false
      });
      
      return logs.toString();
    } catch (error) {
      log.error('Error getting container logs:', error);
      return '';
    }
  });
}

module.exports = {
  registerDockerContainerHandlers,
};