export {};

declare global {
  interface Window {
    electron: {
      voice: {
        generateToken(identity: string, roomName: string): Promise<string>;
        getRoomName(): Promise<string>;
        processTaskCommand(command: string): Promise<{ success: boolean; message: string }>;
      };
      // Add other electron APIs here as needed
    };
  }
}