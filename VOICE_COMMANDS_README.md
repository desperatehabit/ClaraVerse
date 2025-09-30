# ClaraVerse Voice Command System

A comprehensive voice command system that enables natural language control over browsers, applications, and system functions. This system provides a powerful and safe way to interact with your computer using voice commands.

## Overview

The Voice Command System consists of several key components:

- **Voice Command Parser** - Converts natural language to structured commands
- **Service Layer** - Handles browser, application, file system, and system operations
- **Safety System** - Ensures secure execution with permission management
- **UI Components** - Visual feedback and control interfaces
- **Integration Layer** - Seamlessly works with existing ClaraVerse voice services

## Features

### Browser Control
- Open browsers ("Open Chrome", "Launch Firefox")
- Navigate to websites ("Go to google.com", "Visit github.com")
- Control tabs ("Close current tab", "Create new tab")
- Search the web ("Search for machine learning", "Find images of cats")
- Advanced web interaction ("Click login button", "Fill username field")

### System Control
- Adjust volume ("Set volume to 50", "Mute sound")
- Take screenshots ("Take screenshot", "Capture screen")
- Lock screen ("Lock computer", "Lock screen")
- System information ("What's my computer uptime?")

### Application Management
- Launch applications ("Open VS Code", "Start calculator")
- Switch between apps ("Switch to Chrome", "Focus on terminal")
- Close applications ("Close VS Code", "Quit browser")

### File System Operations
- Open files ("Open document.txt", "Edit myfile.docx")
- Create files and folders ("Create new folder", "Make todo.txt")
- Search files ("Find all images", "Search for report")
- File operations ("Copy file to desktop", "Delete old files")

### Web Interaction
- Click elements ("Click the submit button", "Press login")
- Fill forms ("Enter email address", "Type password")
- Navigate pages ("Scroll to bottom", "Go to next section")
- Media control ("Play video", "Pause music")

## Safety & Security

### Permission System
The voice command system includes multiple layers of security:

1. **Command Analysis** - All commands are analyzed for potential risks
2. **Permission Requests** - Dangerous operations require user confirmation
3. **Safety Rules** - Configurable rules to block or warn about risky commands
4. **Audit Logging** - All command executions are logged for review

### Risk Levels
- **Low Risk** - Safe operations like opening browsers or adjusting volume
- **Medium Risk** - Operations that modify user data but are generally safe
- **High Risk** - Operations that could affect system stability
- **Critical Risk** - Operations that could cause data loss or security issues

### Safety Settings
- **Strict Mode** - Requires confirmation for all system commands
- **Moderate Mode** - Confirms sensitive operations only
- **Permissive Mode** - Auto-executes safe commands, confirms others

## Setup & Configuration

### Basic Setup

```typescript
import { VoiceCommandService, VoiceCommandServiceConfig } from './services/voice/VoiceCommandService';
import { VoiceService } from './services/voice/VoiceService';

// Configure the voice command service
const config: VoiceCommandServiceConfig = {
  voiceService: voiceServiceInstance,
  browser: {
    defaultBrowser: 'chrome',
    supportedBrowsers: ['chrome', 'firefox', 'edge', 'safari'],
    headless: false
  },
  application: {
    commonApps: {
      'vscode': '/usr/bin/code',
      'chrome': '/usr/bin/google-chrome',
      'calculator': '/usr/bin/gnome-calculator'
    },
    searchPaths: ['/usr/bin', '/Applications'],
    supportedExtensions: ['.desktop', '.app', '.exe']
  },
  filesystem: {
    allowedPaths: ['~/Documents', '~/Desktop', '~/Downloads'],
    maxFileSize: 50 * 1024 * 1024, // 50MB
    supportedExtensions: ['.txt', '.md', '.pdf', '.docx']
  }
};

// Initialize the service
const voiceCommands = new VoiceCommandService(config);
await voiceCommands.initialize();
```

### Integration with Existing Voice Service

```typescript
// Use with existing VoiceService
const voiceService = new VoiceService(voiceConfig);

// Create voice command service with integration
const voiceCommands = new VoiceCommandService({
  voiceService,
  // ... other config
});

// Process voice input
voiceService.addEventListener('speechEnd', async (audioBlob) => {
  const context = {
    activeApplication: 'chrome',
    systemInfo: { platform: 'linux', version: '20.04' },
    userPermissions: ['read_files', 'open_browsers']
  };

  const result = await voiceCommands.processVoiceInput(audioBlob, context);
  console.log('Command result:', result);
});
```

## Usage Examples

### Basic Commands

```typescript
// Execute text commands directly
const result = await voiceCommands.executeTextCommand("Open Chrome and go to google.com", context);
console.log(result.message); // "Opened Chrome and navigated to google.com"

// Get available commands
const commands = voiceCommands.getAvailableCommands();
console.log(`Available commands: ${commands.length}`);

// Search for specific commands
const browserCommands = voiceCommands.searchCommands("browser");
console.log(`Found ${browserCommands.length} browser-related commands`);
```

### Browser Commands

```typescript
// Open browser
await voiceCommands.executeTextCommand("Open Chrome", context);

// Navigate to website
await voiceCommands.executeTextCommand("Go to github.com", context);

// Search
await voiceCommands.executeTextCommand("Search for React documentation", context);

// Tab control
await voiceCommands.executeTextCommand("Close current tab", context);
await voiceCommands.executeTextCommand("Create new tab", context);
```

### System Commands

```typescript
// Volume control
await voiceCommands.executeTextCommand("Set volume to 75", context);
await voiceCommands.executeTextCommand("Mute sound", context);

// Screenshots
await voiceCommands.executeTextCommand("Take screenshot", context);

// System info
await voiceCommands.executeTextCommand("Lock screen", context);
```

### Application Commands

```typescript
// Launch applications
await voiceCommands.executeTextCommand("Open VS Code", context);
await voiceCommands.executeTextCommand("Start calculator", context);

// Switch applications
await voiceCommands.executeTextCommand("Switch to Chrome", context);
await voiceCommands.executeTextCommand("Focus on terminal", context);
```

### File System Commands

```typescript
// File operations
await voiceCommands.executeTextCommand("Open my document.txt", context);
await voiceCommands.executeTextCommand("Create a new folder on desktop", context);

// Search files
await voiceCommands.executeTextCommand("Find all PDF files", context);
await voiceCommands.executeTextCommand("Search for meeting notes", context);
```

## API Reference

### VoiceCommandService

Main service class that orchestrates all voice command functionality.

#### Methods

- `initialize(): Promise<void>` - Initialize the service
- `processVoiceInput(audioBlob: Blob, context: VoiceCommandContext): Promise<VoiceCommandResult>` - Process voice audio
- `executeTextCommand(text: string, context: VoiceCommandContext): Promise<VoiceCommandResult>` - Execute text command
- `getAvailableCommands(): VoiceCommand[]` - Get all available commands
- `searchCommands(query: string): VoiceCommand[]` - Search commands
- `getCommandHistory(limit?: number): VoiceCommandHistory[]` - Get command history
- `updateSettings(settings: Partial<VoiceCommandSettings>): void` - Update settings
- `isReady(): boolean` - Check if service is ready
- `getStatus(): ServiceStatus` - Get service status
- `destroy(): Promise<void>` - Cleanup resources

### VoiceCommandParser

Handles natural language processing and command parsing.

#### Methods

- `parseCommand(text: string): Promise<ParsedCommand | null>` - Parse text into command
- `registerCommand(command: VoiceCommand): void` - Register new command
- `getCommandsByCategory(category: VoiceCommandCategory): VoiceCommand[]` - Get commands by category
- `searchCommands(query: string): VoiceCommand[]` - Search commands

### SafetyService

Manages command safety and permissions.

#### Methods

- `checkCommandSafety(parsedCommand: ParsedCommand, context: VoiceCommandContext): Promise<VoiceCommandResult>` - Check if command is safe
- `approvePermission(requestId: string, approvedBy?: string): Promise<boolean>` - Approve permission request
- `denyPermission(requestId: string, reason?: string): Promise<boolean>` - Deny permission request
- `getPendingPermissions(): PermissionRequest[]` - Get pending permissions
- `getAuditLog(limit?: number): SafetyAuditLog[]` - Get safety audit log

### BrowserAutomationService

Handles browser automation and control.

#### Methods

- `openBrowser(browserName?: string, url?: string): Promise<VoiceCommandResult>` - Open browser
- `navigateTo(url: string): Promise<VoiceCommandResult>` - Navigate to URL
- `search(query: string, engine?: string): Promise<VoiceCommandResult>` - Search web
- `closeCurrentTab(): Promise<VoiceCommandResult>` - Close current tab
- `createNewTab(url?: string): Promise<VoiceCommandResult>` - Create new tab

### ApplicationManagementService

Manages application launching and switching.

#### Methods

- `launchApplication(appName: string, args?: string[]): Promise<VoiceCommandResult>` - Launch app
- `switchToApplication(appName: string): Promise<VoiceCommandResult>` - Switch to app
- `closeApplication(appName: string, force?: boolean): Promise<VoiceCommandResult>` - Close app
- `getRunningApplications(): Promise<VoiceCommandResult>` - Get running apps
- `searchApplications(query: string): Promise<VoiceCommandResult>` - Search apps

### FileSystemService

Handles file system operations.

#### Methods

- `openFile(filePath: string): Promise<VoiceCommandResult>` - Open file
- `createFile(filePath: string, content?: string): Promise<VoiceCommandResult>` - Create file
- `saveFile(filePath: string, content: string): Promise<VoiceCommandResult>` - Save file
- `readFile(filePath: string): Promise<VoiceCommandResult>` - Read file
- `createFolder(folderPath: string): Promise<VoiceCommandResult>` - Create folder
- `listFiles(dirPath: string): Promise<VoiceCommandResult>` - List directory
- `searchFiles(searchPath: string, query: string): Promise<VoiceCommandResult>` - Search files
- `deletePath(targetPath: string): Promise<VoiceCommandResult>` - Delete file/folder
- `copyPath(sourcePath: string, destPath: string): Promise<VoiceCommandResult>` - Copy file/folder

## Configuration Options

### Browser Configuration

```typescript
interface BrowserConfig {
  defaultBrowser: string;
  supportedBrowsers: string[];
  headless: boolean;
  windowSize?: { width: number; height: number };
  userAgent?: string;
}
```

### Application Configuration

```typescript
interface ApplicationConfig {
  commonApps: Record<string, string>;
  searchPaths: string[];
  supportedExtensions: string[];
  maxSearchResults: number;
}
```

### File System Configuration

```typescript
interface FileSystemConfig {
  allowedPaths: string[];
  maxFileSize: number;
  supportedExtensions: string[];
  dangerousOperations: string[];
  requireConfirmation: string[];
}
```

### Safety Configuration

```typescript
interface VoiceCommandSettings {
  enabledCategories: VoiceCommandCategory[];
  safetyLevel: 'strict' | 'moderate' | 'permissive';
  confirmSensitiveCommands: boolean;
  confirmSystemCommands: boolean;
  autoExecuteSafeCommands: boolean;
  maxCommandHistory: number;
  enableCommandLearning: boolean;
  customCommands: VoiceCommand[];
}
```

## Best Practices

### Security
1. Always use the safety system for production deployments
2. Regularly review audit logs for suspicious activity
3. Keep permission requests visible to users
4. Use strict mode for shared or public systems

### Performance
1. Limit command history size to prevent memory issues
2. Use appropriate timeouts for external operations
3. Cache frequently accessed application paths
4. Implement rate limiting for command execution

### User Experience
1. Provide clear feedback for command execution
2. Show command suggestions and examples
3. Allow easy customization of command vocabulary
4. Include help and tutorial features

### Error Handling
1. Gracefully handle unsupported platforms
2. Provide meaningful error messages
3. Allow fallback to alternative methods
4. Log errors for debugging and monitoring

## Troubleshooting

### Common Issues

**Voice commands not recognized**
- Check microphone permissions
- Verify voice service is connected
- Review command patterns and examples

**Commands fail to execute**
- Check service availability and permissions
- Verify system capabilities
- Review safety settings and permissions

**Performance issues**
- Reduce command history size
- Check for resource-intensive operations
- Monitor memory usage

**Permission requests not showing**
- Verify safety service is initialized
- Check UI component integration
- Review permission request flow

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
// Enable debug logging
console.log('Voice command debug info:', {
  status: voiceCommands.getStatus(),
  availableCommands: voiceCommands.getAvailableCommands().length,
  history: voiceCommands.getCommandHistory(5)
});
```

## Contributing

To extend the voice command system:

1. Add new command types to `voice-commands.ts`
2. Implement service handlers for new functionality
3. Add safety rules for new command categories
4. Update documentation with examples
5. Test thoroughly across different platforms

## License

This voice command system is part of ClaraVerse and follows the same licensing terms.