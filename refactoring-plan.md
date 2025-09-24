# Refactoring Plan for `electron/main.cjs`

This document outlines the plan to refactor the monolithic `electron/main.cjs` file into smaller, more manageable modules.

## 1. Proposed Directory Structure

The following directory structure will be created within the `electron/` directory:

```
electron/
├── main/
│   ├── app-lifecycle.cjs
│   ├── window-manager.cjs
│   ├── tray.cjs
│   ├── shortcuts.cjs
│   └── index.cjs
├── ipc/
│   ├── docker-handlers.cjs
│   ├── llamaswap-handlers.cjs
│   ├── mcp-handlers.cjs
│   ├── model-manager-handlers.cjs
│   ├── comfyui-handlers.cjs
│   ├── n8n-handlers.cjs
│   ├── python-backend-handlers.cjs
│   ├── widget-service-handlers.cjs
│   ├── service-config-handlers.cjs
│   ├── app-handlers.cjs
│   └── index.cjs
├── services/
│   ├── service-initializer.cjs
│   └── ... (existing services)
└── utils/
    └── helpers.cjs
```

## 2. Code Migration Plan

The code from `electron/main.cjs` will be migrated to the new files as follows:

### `electron/main/app-lifecycle.cjs`
- Manages the application's lifecycle events.
- **Code to move:**
  - Single instance lock code (`app.requestSingleInstanceLock`).
  - `app.on('second-instance', ...)` handler.
  - `app.on('window-all-closed', ...)` handler.
  - `app.on('activate', ...)` handler.
  - `app.whenReady()` block.

### `electron/main/window-manager.cjs`
- Responsible for creating and managing the main browser window.
- **Code to move:**
  - `createMainWindow` function.
  - Global `mainWindow` variable.
  - Window event handlers (`minimize`, `close`).

### `electron/main/tray.cjs`
- Handles the creation and management of the system tray icon.
- **Code to move:**
  - `createTray` function.
  - Global `tray` and `isQuitting` variables.
  - Tray event handlers.

### `electron/main/shortcuts.cjs`
- Manages global keyboard shortcuts.
- **Code to move:**
  - `registerGlobalShortcuts` function.

### `electron/main/index.cjs`
- The new main entry point for the Electron application.
- Will import and coordinate the other modules in the `main/` directory.

### `electron/ipc/` Directory
- This directory will contain all IPC handlers, separated by functionality.
- **`docker-handlers.cjs`**: `registerDockerContainerHandlers` function.
- **`llamaswap-handlers.cjs`**: `registerLlamaSwapHandlers` function.
- **`mcp-handlers.cjs`**: `registerMCPHandlers` function.
- **`model-manager-handlers.cjs`**: `registerModelManagerHandlers` function.
- **`comfyui-handlers.cjs`**: `registerComfyUIHandlers` function.
- **`n8n-handlers.cjs`**: `registerN8NHandlers` function.
- **`python-backend-handlers.cjs`**: `registerPythonBackendHandlers` function.
- **`widget-service-handlers.cjs`**: `registerWidgetServiceHandlers` function.
- **`service-config-handlers.cjs`**: `registerServiceConfigurationHandlers` function.
- **`app-handlers.cjs`**: General app-related handlers.
- **`index.cjs`**: A file to import all other handler modules and provide a single registration function.

### `electron/services/service-initializer.cjs`
- Contains the main `initialize` function and its helpers.
- **Code to move:**
  - `initialize`
  - `initializeInBackground`
  - `initializeServicesWithDocker`
  - `initializeServicesWithoutDocker`

### `electron/utils/helpers.cjs`
- Contains various helper functions.
- **Code to move:**
  - `formatBytes`
  - `showStartupDialog`
  - `checkDockerDesktopInstalled`
  - `startDockerDesktop`
  - `askToStartDockerDesktop`
  - `getComfyUIConfig`
  - `getN8NConfig`
  - `getPythonConfig`

This plan will serve as the blueprint for the refactoring work.