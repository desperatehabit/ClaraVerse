const { ipcMain } = require('electron');
const log = require('electron-log');
const { VoiceCommandService } = require('../../dist-electron/services/voice/VoiceCommandService.cjs');

let voiceCommandService;

function registerVoiceHandlers(voiceAgent) {
  if (!voiceAgent) {
    log.error('Voice agent is not initialized, cannot register voice handlers.');
    return;
  }

  // Instantiate the service
  voiceCommandService = new VoiceCommandService({
    voiceService: voiceAgent,
  });
  voiceCommandService.initialize().catch(log.error);

  ipcMain.handle('voice:generate-token', async (event, { identity, roomName }) => {
    try {
      log.info(`Generating LiveKit token for identity: ${identity}, room: ${roomName}`);
      const token = await voiceAgent.generateToken(identity, roomName);
      return token;
    } catch (error) {
      log.error('Error generating LiveKit token:', error);
      throw new Error('Failed to generate token');
    }
  });

  ipcMain.handle('voice:process-task-command', async (event, command) => {
    try {
      log.info(`Processing voice task command: "${command}"`);
      if (!voiceCommandService) {
        throw new Error('VoiceCommandService not initialized');
      }
      const result = await voiceCommandService.executeTextCommand(command, {});
      return result;
    } catch (error) {
      log.error('Error processing voice task command:', error);
      throw new Error('Failed to process voice task command');
    }
  });
}

module.exports = {
  registerVoiceHandlers,
};