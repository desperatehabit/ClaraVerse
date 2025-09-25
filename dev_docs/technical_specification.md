# ClaraVerse Technical Specification

**Project Name:** ClaraVerse

## 1. Application Overview

**Core Purpose:** ClaraVerse is a privacy-first, client-side AI assistant WebUI that consolidates multiple AI tools into a single desktop application, enabling users to run AI models locally without subscriptions, telemetry, or data leaks.

**High-Level Architecture:** Electron-based desktop application with a React TypeScript frontend, multi-language backend services (Python FastAPI + Go microservices), and integrated AI engines. The application follows a modular architecture with clear separation between UI, business logic, and external service integrations.

**Key Dependencies:** React 18.2.0, TypeScript 5.0.0, Electron 32.3.3, Ollama SDK 0.5.14, OpenAI SDK 4.0.0, ComfyUI SDK 0.2.45, LangChain 0.3.19, and Model Context Protocol SDK 1.13.2.

## 2. Repository File Structure Map

**Root Level:**
- `/src/`: Primary frontend React application with TypeScript components and services
- `/electron/`: Electron main process code, IPC handlers, and desktop application logic
- `/py_backend/`: Python FastAPI server for document processing and AI integration
- `/clara-mcp/`: Go-based Model Context Protocol server implementation
- `/clara-core-optimiser/`: Go service for AI model optimization
- `/widgets_service_app/`: Go service for system monitoring widgets
- `/sdk/`: ClaraVerse SDK for external integrations with examples, tests, and documentation
- `/sdk_examples/`: SDK usage examples demonstrating integration patterns
- `/supabase/`: Supabase database configuration and migration files
- `/test-configs/`: Model testing and performance analysis tools with dashboard
- `/tools/`: Utility scripts for Ollama integration and system management
- `/troubleshoot/`: Docker troubleshooting and system recovery scripts
- `/workflows/`: N8N workflow definitions and templates
- `/example-flows/`: Example workflow files for testing and demonstration
- `/gguf-debug/`: GGUF model debugging and analysis utilities
- `/dev_docs/`: Developer documentation and technical specifications
- `/docs/`: User-facing documentation and guides
- `/public/`: Static assets served by the frontend
- `/assets/`: Application assets including icons, images, and resources

**Frontend Structure (`/src/`):**
- `/components/`: React components organized by feature (AgentBuilder, ClaraAssistant, LumaUI, ComfyUI, N8N, etc.)
- `/services/`: Business logic services for API calls, data management, and external integrations
- `/contexts/`: React context providers for state management across components
- `/types/`: TypeScript type definitions for the application
- `/utils/`: Utility functions and helper methods
- `/db/`: Database configuration and schema definitions
- `/hooks/`: Custom React hooks for component logic
- `/lib/`: Core library functions and configurations

**SDK Structure (`/sdk/`):**
- `/src/`: Core SDK source code with validators, widgets, and utilities
- `/examples/`: SDK usage examples and demonstrations
- `/tests/`: Comprehensive test suite for SDK functionality
- `/widgets/`: Reusable widget components for external integrations
- `/container/`: Containerization configurations for SDK deployment
- `/agent_exported/`: Exported agent definitions and templates
- `/templates/`: Project templates for SDK-based applications

**Backend Services Structure (`/py_backend/`):**
- `/requirements*.txt`: Python dependency files for different environments
- `/main.py`: FastAPI server entry point for document processing and AI integration
- `/Text2Speech.py`: Text-to-speech functionality implementation
- `/Speech2Text.py`: Speech-to-text functionality implementation
- `/server.md`: Backend API documentation and endpoints
- `/test_ollama.py`: Ollama integration testing utilities

**MCP Implementation (`/clara-mcp/`):**
- `/go.mod`, `/go.sum`: Go module dependencies and version management
- `/python-mcp-server.go`: Core MCP server implementation in Go
- `/playwright-manager.go`: Playwright browser automation management
- `/test-*.json`: Test configurations for MCP functionality

**Testing & Analysis (`/test-configs/`):**
- `/config_test_results*.csv`: Performance test results and analysis data
- `/llama_config_tester*.py`: LLaMA model configuration testing tools
- `/smart_config_tester.py`: Intelligent configuration testing system
- `/dashboard*.py/html`: Performance monitoring dashboard
- `/requirements*.txt`: Python dependencies for testing environment
- `/focused_first_token_tests.py`: Model performance optimization tests

**Utility Tools (`/tools/`):**
- `/test.js`: General testing utilities and scripts
- `/tools_ollama.js**: Ollama-specific integration and management tools

**Troubleshooting (`/troubleshoot/`):**
- `/dockertroubleshoot.sh`: Docker container troubleshooting scripts
- `/quick-docker-recovery.sh`: Fast recovery procedures for Docker issues
- `/diagnose-docker-hang.cjs`: Docker hang diagnosis utilities

**Workflow Management (`/workflows/`):**
- `/n8n_workflows_full.json`: Complete N8N workflow definitions and templates
- `/example-flows/`: Example workflow files for testing and demonstration
- `/gguf-debug/`: GGUF model debugging and analysis utilities

**Database & Infrastructure (`/supabase/`):**
- `/config.toml`: Supabase configuration and environment settings
- `/migrations/`: Database schema migrations and version control
- `/.gitignore`: Supabase-specific files to exclude from version control

**Electron Structure (`/electron/`):**
- `/main/`: Main process entry point and application lifecycle management
- `/services/`: Electron service definitions and handlers
- `/ipc/`: Inter-process communication handlers
- `/llamacpp-binaries/`: Pre-built binaries for local AI inference
- `/utils/`: Utility functions for the main process

## 3. Core Feature Analysis

### Feature: Clara AI Assistant
**Functionality:** Provides multi-provider LLM chat supporting Ollama, OpenAI, and Claude with voice input/output capabilities, file processing for documents/images/code, and context-aware conversations with memory persistence.

**Technology & Pattern:** Implemented in TypeScript using React functional components with hooks. State managed via React Context API and custom hooks. Asynchronous operations handled with async/await and Promise-based APIs. Real-time communication through WebSocket connections for streaming responses.

**Key Files & Entry Points:**
- `/src/components/ClaraAssistant.tsx`: Main chat interface component
- `/src/services/claraApiService.ts`: API service for LLM provider communication
- `/src/contexts/ClaraAssistantContext.tsx`: Context provider for assistant state
- `/src/components/Clara_Components/`: Reusable chat UI components
- `/py_backend/Text2Speech.py`: Text-to-speech functionality
- `/py_backend/Speech2Text.py`: Speech-to-text functionality

**How to Extend:**
To add support for a new LLM provider:
1. Update provider configuration in `/src/types/clara_assistant_types.ts`
2. Add provider-specific API service methods in `/src/services/claraApiService.ts`
3. Implement provider selection UI in `/src/components/Clara_Components/provider_selector.tsx`
4. Add authentication handling in `/src/contexts/ClaraAssistantContext.tsx`

### Feature: Agent Builder Studio
**Functionality:** Visual programming environment for creating autonomous AI agents with drag-and-drop interface, real-time execution, debugging capabilities, and template library.

**Technology & Pattern:** Built with React Flow for visual programming. State managed through custom hooks and context providers. Agent execution handled via service layer with error handling and progress tracking.

**Key Files & Entry Points:**
- `/src/components/AgentStudio.tsx`: Main studio interface
- `/src/components/AgentBuilder/`: Complete agent building toolkit
- `/src/contexts/AgentBuilderContext.tsx`: Agent state management
- `/src/services/agentWorkflowStorage.ts`: Agent persistence layer
- `/src/services/claraAgentExecutionService.ts`: Agent execution engine
- `/src/types/agent/types.ts`: Agent data structures and interfaces

**How to Extend:**
To add a new agent node type:
1. Define node interface in `/src/types/agent/types.ts`
2. Create node component in `/src/components/AgentBuilder/Nodes/`
3. Implement node logic in `/src/services/FlowEngine/NodeRegistry.ts`
4. Add node to execution engine in `/src/services/claraAgentExecutionService.ts`

### Feature: LumaUI Code Builder
**Functionality:** WebContainer-powered development environment with live preview, Monaco editor integration, AI-assisted code generation, and project templates for React/Vue/Vanilla JS.

**Technology & Pattern:** Uses WebContainer API for in-browser development. Monaco Editor for code editing with TypeScript support. File system abstraction layer for project management.

**Key Files & Entry Points:**
- `/src/components/Lumaui.tsx`: Main LumaUI component
- `/src/components/lumaui_components/`: LumaUI-specific components
- `/src/components/lumaui_components/services/LumaUILiteAPIClient.ts`: API client
- `/src/components/lumaui_components/MonacoEditor.tsx`: Code editor integration
- `/src/components/lumaui_components/WebContainer.tsx`: Container management

**How to Extend:**
To add support for a new framework template:
1. Create template files in `/src/components/scaffolding_templates/`
2. Add template configuration in `/src/types/lumaui_types.ts`
3. Implement template loader in `/src/components/lumaui_components/TemplateManager.tsx`
4. Update template selection UI in `/src/components/lumaui_components/CreateProjectModal.tsx`

### Feature: ComfyUI Image Generation
**Functionality:** Local Stable Diffusion integration with SDXL, SD 1.5, and Flux support, LoRA & ControlNet integration, model management with download tracking, and batch generation capabilities.

**Technology & Pattern:** HTTP API integration with ComfyUI backend. Progress tracking through WebSocket connections. Model management with caching and dependency resolution.

**Key Files & Entry Points:**
- `/src/components/ImageGen.tsx`: Main image generation interface
- `/src/services/comfyUIImageGenService.ts`: ComfyUI API integration
- `/src/components/ComfyUIManager.tsx`: Model and settings management
- `/src/components/ModelManager/`: Model management components
- `/src/components/imagegen_components/`: Image generation UI components

**How to Extend:**
To add a new image model:
1. Add model definition in `/src/types/model_types.ts`
2. Create model card component in `/src/components/ModelManager/`
3. Implement download logic in `/src/services/modelDownloadService.ts`
4. Add model to ComfyUI workflow templates in `/src/components/imagegen_components/`

### Feature: N8N Workflow Automation
**Functionality:** Visual workflow automation with 1000+ API integrations, drag-and-drop builder, scheduling capabilities, and data pipeline creation without external N8N setup.

**Technology & Pattern:** Embedded N8N instance management through Electron. Workflow persistence in local database. Execution tracking with progress monitoring.

**Key Files & Entry Points:**
- `/src/components/N8N.tsx`: Main N8N interface component
- `/src/components/n8n_components/`: N8N-specific UI components
- `/src/services/n8nWorkflowService.ts`: Workflow management service
- `/electron/n8nService.cjs`: Electron service for N8N backend
- `/src/components/n8n_components/workflows/`: Workflow templates

**How to Extend:**
To add a new workflow template:
1. Create workflow JSON in `/src/components/n8n_components/workflows/`
2. Add template metadata in `/src/types/n8n_types.ts`
3. Implement template loader in `/src/components/n8n_components/TemplateBrowser.tsx`
4. Add template to category in `/src/components/n8n_components/WorkflowTemplates.tsx`

### Feature: Model Context Protocol (MCP)
**Functionality:** Seamless integration between different AI tools and services with 20+ MCP servers, desktop automation, browser control, and file system access capabilities.

**Technology & Pattern:** Go-based MCP server implementation. JavaScript client SDK integration. Tool discovery and execution through standardized protocol.

**Key Files & Entry Points:**
- `/clara-mcp/python-mcp-server.go`: Go MCP server implementation
- `/src/components/MCPSettings.tsx`: MCP configuration UI
- `/src/services/claraMCPService.ts`: MCP client service
- `/src/services/structuredToolCallService.ts`: Tool execution service
- `/src/types/clara_assistant_types.ts`: MCP data structures

**How to Extend:**
To add a new MCP server:
1. Implement server in `/clara-mcp/` following MCP specification
2. Add server configuration in `/src/types/mcp_types.ts`
3. Create server management UI in `/src/components/MCPSettings.tsx`
4. Implement server integration in `/src/services/claraMCPService.ts`

### Feature: Personal Task Management System
**Functionality:** Complete task and project management system with priority levels, due dates, status tracking, and team collaboration features. Integrated with AI agents for intelligent task suggestions and automated scheduling.

**Technology & Pattern:** Built with React Context API for state management, IndexedDB for persistence, and Electron IPC for backend integration. Real-time updates through WebSocket connections and optimistic UI updates.

**Key Files & Entry Points:**
- `/src/features/tasks/routes/TaskView.tsx`: Main task interface component
- `/src/features/tasks/state/taskStore.ts`: Task state management with persistence
- `/src/features/personal-tasks/`: Complete personal task management system
- `/electron/services/taskService.cjs`: Electron service for task persistence
- `/electron/ipc/task-handlers.cjs`: IPC handlers for task operations

**Components:**
- `TaskStore`: Centralized task state management with real-time updates
- `TaskView`: Main task interface with Kanban and list views
- `ProjectSidebar`: Project navigation and organization
- `TaskList`: Sortable task lists with filtering and search
- `TaskDetailView`: Detailed task editing and management

**Backend Integration:**
- SQLite database for task persistence with full-text search
- Electron IPC handlers for CRUD operations
- Real-time synchronization across application instances
- Export capabilities to CSV, JSON, and project management tools

**How to Extend:**
To add a new task type:
1. Define task type interface in `/src/features/tasks/types.ts`
2. Create task component in `/src/features/tasks/components/`
3. Add task type to store in `/src/features/tasks/state/taskStore.ts`
4. Implement backend handler in `/electron/ipc/task-handlers.cjs`

### Feature: Advanced Notebooks System
**Functionality:** Sophisticated notebook system with Monaco editor integration, 3D graph visualization, document upload, and export capabilities. Supports interactive notebooks with AI assistance and real-time collaboration.

**Technology & Pattern:** Monaco Editor for code editing, Three.js for 3D visualization, React Flow for graph management, and WebSocket connections for real-time updates.

**Key Files & Entry Points:**
- `/src/components/Notebooks/index.tsx`: Main notebooks interface
- `/src/components/Notebooks/NotebookCanvas.tsx`: Canvas-based notebook editor
- `/src/components/Notebooks/ThreeJSGraph.tsx`: 3D graph visualization
- `/src/components/Notebooks/MonacoEditor.tsx`: Code editor integration
- `/src/services/claraNotebookService.ts`: Notebook backend service

**Components:**
- `NotebookCanvas`: Interactive canvas for note organization
- `ThreeJSGraph`: 3D graph visualization with interactive nodes
- `MonacoEditor`: Full-featured code editor with AI assistance
- `GraphViewer`: Graph visualization and manipulation
- `DocumentUpload`: Multi-format document upload and processing
- `ExportModal`: Export to PDF, HTML, and other formats

**Features:**
- Interactive notebooks with live code execution
- File viewing and annotation capabilities
- Graph visualization with force-directed layouts
- Document processing and text extraction
- Export to multiple formats with styling

**How to Extend:**
To add a new notebook cell type:
1. Define cell type in `/src/components/Notebooks/types.ts`
2. Create cell component in `/src/components/Notebooks/cells/`
3. Add cell renderer to `/src/components/Notebooks/NotebookCanvas.tsx`
4. Implement cell execution in `/src/services/claraNotebookService.ts`

### Feature: Widget System Architecture
**Functionality:** Extensible widget system with 14+ widget types including GPU monitoring, system resources, email, webhooks, and custom widgets. Dashboard-based widget management with drag-and-drop functionality.

**Technology & Pattern:** React Context for widget state management, WebSocket connections for real-time data, and modular architecture for extensibility.

**Key Files & Entry Points:**
- `/src/components/Dashboard.tsx`: Main dashboard with widget management
- `/src/components/widget-components/`: Complete widget component library
- `/src/services/widgetServiceClient.ts`: Widget service integration
- `/widgets_service_app/`: Backend widget service implementation

**Widget Types:**
- `GPUMonitorWidget`: Real-time GPU utilization and diagnostics
- `SystemResourcesGraphWidget`: System resource monitoring
- `EmailWidget`: Email integration and notifications
- `QuickChatWidget`: Instant chat functionality
- `CapabilitiesWidget`: System capabilities overview
- `WhatsNewWidget`: Update notifications and news
- `PrivacyWidget`: Privacy and security status
- `WebhookWidget`: Webhook integration and testing

**Backend Services:**
- WebSocket-based widget service for real-time updates
- Widget configuration persistence
- Cross-platform widget compatibility
- Performance-optimized data streaming

**How to Extend:**
To create a new widget:
1. Define widget type in `/src/components/widget-components/types.ts`
2. Create widget component in `/src/components/widget-components/`
3. Add widget to registry in `/src/services/widgetServiceClient.ts`
4. Implement backend service in `/widgets_service_app/`

### Feature: Advanced GPU & System Monitoring
**Functionality:** Real-time GPU monitoring, system diagnostics, and performance analysis with detailed metrics, historical data, and alerting capabilities.

**Technology & Pattern:** WebSocket connections for real-time data, chart libraries for visualization, and Electron IPC for system-level monitoring.

**Key Files & Entry Points:**
- `/src/components/GPUDiagnostics.tsx`: Main GPU diagnostics interface
- `/src/services/claraCoreClient.ts`: System monitoring service
- `/electron/main/window-manager.cjs`: System monitoring integration
- `/widgets_service_app/`: GPU monitoring backend service

**Components:**
- `GPUDiagnostics`: Comprehensive GPU monitoring dashboard
- `SystemMonitor`: System resource monitoring and alerts
- `WatchdogStatus`: Service health monitoring
- `PerformanceMetrics`: Detailed performance analysis
- `ResourceAlerts`: Configurable alerting system

**Monitoring Capabilities:**
- Real-time GPU utilization, temperature, and memory usage
- System resource monitoring (CPU, RAM, disk, network)
- Historical data collection and trend analysis
- Performance benchmarking and comparison
- Alert configuration and notification system

**Backend Integration:**
- Direct GPU API integration for accurate metrics
- System monitoring service with WebSocket updates
- Historical data persistence and analysis
- Cross-platform compatibility (Windows, macOS, Linux)

**How to Extend:**
To add a new monitoring metric:
1. Define metric interface in `/src/types/monitoring.ts`
2. Create metric component in `/src/components/monitoring/`
3. Add metric collector in `/widgets_service_app/`
4. Update dashboard in `/src/components/GPUDiagnostics.tsx`

### Feature: Memory Management System
**Functionality:** Advanced memory management with persistence, context awareness, and intelligent memory handling across all application features.

**Technology & Pattern:** React Context for memory state, IndexedDB for persistence, and AI-powered memory management with automatic cleanup and optimization.

**Key Files & Entry Points:**
- `/src/services/ClaraMemoryManager.ts`: Core memory management service
- `/src/services/claraMemoryService.ts`: Memory operations service
- `/src/services/ClaraMemoryIntegration.ts`: Memory integration layer
- `/src/components/Clara_Components/ClaraMemoryToast.tsx`: Memory UI component

**Components:**
- `useMemoryManager`: React hook for memory operations
- `claraMemoryService`: Memory persistence and retrieval
- `MemoryToast`: User notifications for memory events
- `MemoryIntegration`: Cross-service memory coordination
- `MemoryAnalytics`: Memory usage analysis and optimization

**Features:**
- Intelligent memory extraction from conversations
- Context-aware memory retrieval and application
- Automatic memory cleanup and optimization
- Cross-session memory persistence
- Memory analytics and performance monitoring

**Backend Integration:**
- IndexedDB for efficient memory storage
- Memory indexing and search capabilities
- Automatic backup and restoration
- Memory compression and optimization

**How to Extend:**
To add memory integration to a new feature:
1. Import memory manager in your component
2. Use memory hooks for context management
3. Implement memory extraction logic
4. Add memory persistence to your service

## 4. System Architecture Details

**Frontend Architecture:**
- React 18.2.0 with TypeScript for type safety
- Vite 5.4.2 for fast development and optimized builds
- Tailwind CSS for styling with custom design system
- IndexedDB for client-side data persistence
- Electron Store for configuration management

**Backend Services:**
- Python FastAPI for document processing and AI integration
- Go microservices for MCP implementation and system optimization
- ClaraVerse SDK for external integrations and widget development
- Llama.cpp for local AI model inference
- ComfyUI for image generation backend
- N8N for workflow automation backend

**Data Flow:**
- Frontend communicates with backend services via HTTP APIs
- Electron main process handles system-level operations
- MCP enables tool integration across different services
- Real-time updates through WebSocket connections
- Local file system and IndexedDB for data persistence

**Security & Privacy:**
- 100% local processing with no external data transmission
- No telemetry or analytics collection
- Open source codebase under MIT license
- Self-hosted architecture with full user control
- Optional encryption for sensitive data

## 5. Services Layer Architecture

ClaraVerse implements a comprehensive services layer with 25+ specialized services for different aspects of functionality. Each service follows a consistent pattern with error handling, logging, and extensibility.

### Core AI Services
1. **claraAgentApiService.ts** - LLM provider integration and management
2. **claraAgentExecutionService.ts** - Agent workflow execution engine
3. **claraAgentService.ts** - Autonomous agent management and execution
4. **claraApiService.ts** - Primary chat API service with provider switching
5. **claraChatService.ts** - Chat session management and persistence
6. **claraCoreClient.ts** - Core system integration and IPC adapter

### Memory & Context Services
7. **ClaraMemoryManager.ts** - Advanced memory management with AI integration
8. **claraMemoryService.ts** - Memory persistence and retrieval operations
9. **claraMemoryToastService.ts** - Memory event notifications and UI feedback
10. **ClaraMemoryIntegration.ts** - Cross-service memory coordination
11. **claraAttachmentService.ts** - File attachment processing and management

### Notebook & Document Services
12. **claraNotebookService.ts** - Advanced notebook system with document processing
13. **notebookFileStorage.ts** - Notebook file persistence and management
14. **artifactDetectionService.ts** - Content artifact detection and extraction

### System Integration Services
15. **claraMCPService.ts** - Model Context Protocol server management
16. **structuredToolCallService.ts** - Structured tool calling and execution
17. **claraToolService.ts** - Tool management and execution coordination
18. **claraProviderService.ts** - LLM provider configuration and management
19. **claraModelService.ts** - Model selection and optimization

### Specialized Services
20. **claraTTSService.ts** - Text-to-speech synthesis and audio management
21. **claraVoiceService.ts** - Voice transcription and speech processing
22. **comfyUIImageGenService.ts** - ComfyUI image generation integration
23. **claraBackgroundService.ts** - Background task management and notifications
24. **notificationService.ts** - System-wide notification management

### Infrastructure Services
25. **claraDatabase.ts** - Database operations and data persistence
26. **claraScheduler.ts** - Task scheduling and automation
27. **claraImageExtractionService.ts** - Image extraction and processing
28. **FlowCodeGenerator.ts** - Flow-to-code generation service
29. **tokenEstimationService.ts** - Token counting and limit management
30. **tokenLimitRecoveryService.ts** - Token limit recovery and optimization

### Additional Services
31. **agentUIStorage.ts** - Agent UI configuration persistence
32. **agentWorkflowStorage.ts** - Agent workflow storage and versioning
33. **indexedDB.ts** - IndexedDB abstraction and utilities
34. **localContentService.ts** - Local content detection and management
35. **lumaTools.ts** - LumaUI development tools and utilities
36. **lumauiProjectStorage.ts** - LumaUI project persistence
37. **modelMmprojMappingService.ts** - Model mapping and configuration
38. **startupService.ts** - Application startup and initialization
39. **toolSuccessRegistry.ts** - Tool success tracking and blacklisting
40. **webContainerManager.ts** - WebContainer management and lifecycle
41. **widgetServiceClient.ts** - Widget service integration and management

### Service Architecture Patterns

**Service Initialization Pattern:**
```typescript
class ClaraService {
  private static instance: ClaraService;
  private initialized = false;

  static getInstance(): ClaraService {
    if (!ClaraService.instance) {
      ClaraService.instance = new ClaraService();
    }
    return ClaraService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    // Service-specific initialization
    this.initialized = true;
  }
}
```

**Error Handling Pattern:**
- Consistent error logging across all services
- Graceful degradation for non-critical failures
- User-friendly error messages with technical details
- Recovery mechanisms for transient failures

**Extensibility Pattern:**
- Plugin architecture for custom service extensions
- Configuration-driven service behavior
- Event-driven service communication
- Service dependency injection and management

## 6. UI Components Architecture

ClaraVerse features a comprehensive component library with 50+ specialized components organized by feature domains and functionality.

### Core Application Components
1. **ClaraAssistant.tsx** - Main AI assistant interface with memory integration
2. **AgentStudio.tsx** - Visual agent building and management interface
3. **Dashboard.tsx** - Widget-based dashboard with real-time monitoring
4. **ImageGen.tsx** - Advanced image generation interface with ComfyUI
5. **N8N.tsx** - Workflow automation interface with N8N integration
6. **Lumaui.tsx** - WebContainer-based development environment
7. **Community.tsx** - Community features and resource sharing
8. **Settings.tsx** - Comprehensive settings and configuration panel

### Specialized Feature Components
9. **BackendConfigurationPanel.tsx** - Backend service configuration
10. **ChatWindow.tsx** - Chat interface with provider switching
11. **ComfyUIManager.tsx** - ComfyUI model and settings management
12. **Debug.tsx** - Debugging and development tools interface
13. **ErrorBoundary.tsx** - Error boundary component for graceful error handling
14. **ErrorHandlingDemo.tsx** - Error handling demonstration
15. **ErrorTester.tsx** - Error testing and validation tools
16. **FirstTimeSetupModal.tsx** - First-time user setup experience
17. **Gallery.tsx** - Generated content gallery and management
18. **GPUDiagnostics.tsx** - GPU diagnostics and system monitoring
19. **Help.tsx** - Integrated help and documentation system
20. **ImageModelManager.tsx** - Model management and downloading
21. **Layout.tsx** - Main application layout component
22. **LLaMAOptimizerPanel.tsx** - LLaMA model optimization interface
23. **MCPSettings.tsx** - MCP server configuration and management
24. **ModelManager.tsx** - Model management and configuration
25. **Onboarding.tsx** - User onboarding and setup flow
26. **PipelineManager.tsx** - Pipeline management interface
27. **Servers.tsx** - Server management and container control

### Modal and Overlay Components
28. **ComfyUIStartupModal.tsx** - ComfyUI startup and configuration
29. **N8NStartupModal.tsx** - N8N startup and initialization
30. **PythonStartupModal.tsx** - Python backend startup management
31. **ResourceDetailModal.tsx** - Resource detail viewing and management
32. **ScheduleModal.tsx** - Task scheduling and automation
33. **SecurityScanModal.tsx** - Security scanning and validation
34. **UserSetupModal.tsx** - User setup and configuration
35. **TourModal.tsx** - Application tour and guidance
36. **CreateProjectModal.tsx** - Project creation and templates
37. **CreateNotebookModal.tsx** - Notebook creation interface
38. **ExportModal.tsx** - Export functionality for various formats
39. **ImportWidgetModal.tsx** - Widget import and management

### Notebook System Components
40. **NotebookCanvas.tsx** - Interactive notebook canvas
41. **ThreeJSGraph.tsx** - 3D graph visualization component
42. **MonacoEditor.tsx** - Monaco editor integration
43. **GraphViewer.tsx** - Graph viewing and manipulation
44. **DocumentUpload.tsx** - Document upload and processing
45. **FileViewerModal.tsx** - File viewing and annotation
46. **NotebookChat.tsx** - Notebook-integrated chat interface
47. **NotebookCard.tsx** - Notebook preview and management
48. **NotebookWorkspace.tsx** - Notebook workspace management
49. **OrbitControls.ts** - 3D camera controls for visualization

### Widget System Components
50. **AddWidgetModal.tsx** - Widget addition and configuration
51. **CapabilitiesWidget.tsx** - System capabilities overview
52. **CustomWidgetRenderer.tsx** - Custom widget rendering
53. **GPUMonitorWidget.tsx** - GPU monitoring widget
54. **ImportWidgetModal.tsx** - Widget import functionality
55. **PrivacyWidget.tsx** - Privacy status and controls
56. **QuickChatWidget.tsx** - Quick chat functionality
57. **ResizableWidget.tsx** - Resizable widget container
58. **SystemResourcesGraphWidget.tsx** - System resources visualization
59. **WhatsNewWidget.tsx** - Update notifications widget
60. **WidgetContextMenu.tsx** - Widget context menu

### Task Management Components
61. **TaskView.tsx** - Main task management interface
62. **AgentsView.tsx** - Agent-based task management
63. **TaskExecutionHistory.tsx** - Task execution history
64. **BulkActionBar.tsx** - Bulk task operations
65. **FilterBar.tsx** - Task filtering and search
66. **GalleryGrid.tsx** - Task gallery view
67. **GalleryImageCard.tsx** - Individual gallery items
68. **ImagePreviewModal.tsx** - Image preview and management
69. **ToastNotification.tsx** - Toast notification system

### Clara Components (Core UI Library)
70. **AutonomousAgentStatusPanel.tsx** - Agent status monitoring
71. **ClaraBrainDashboard.tsx** - Brain dashboard interface
72. **ClaraInput.tsx** - Enhanced input components
73. **ClaraMemoryToast.tsx** - Memory notification system
74. **ClaraSidebar.tsx** - Main application sidebar
75. **ExecutionDetailsModal.tsx** - Execution details viewer
76. **ExtractedImagesRenderer.tsx** - Image extraction and display
77. **TTSControlPanel.tsx** - Text-to-speech controls

### LumaUILite Components
78. **AISettingsModal.tsx** - AI settings configuration
79. **LumaUILiteChatPersistence.ts** - Chat persistence layer
80. **LumaUILiteChatWindow.tsx** - Chat interface
81. **LumaUILiteEditor.tsx** - Code editor interface
82. **LumaUILiteProjectModal.tsx** - Project management
83. **ResponsiveChatWindow.tsx** - Responsive chat interface
84. **useLumaUILiteCheckpoints.ts** - Checkpoint management

### Component Architecture Patterns

**Component Structure Pattern:**
```typescript
interface ComponentProps {
  // Common props
  className?: string;
  children?: React.ReactNode;
  // Feature-specific props
}

const FeatureComponent: React.FC<ComponentProps> = ({
  className = '',
  children,
  ...featureProps
}) => {
  // Component logic
  return (
    <div className={`feature-component ${className}`}>
      {/* Component JSX */}
    </div>
  );
};
```

**State Management Pattern:**
- React Context API for global state
- Custom hooks for complex state logic
- IndexedDB for persistence
- Real-time updates via WebSocket

**Styling Pattern:**
- Tailwind CSS for utility-first styling
- CSS-in-JS for dynamic styles
- Design system with consistent theming
- Dark/light mode support

## 7. Custom Hooks Architecture

ClaraVerse implements 15+ custom React hooks for reusable logic across components.

### Core Application Hooks
1. **useAssistantChat.ts** - Chat functionality and message handling
2. **useAutonomousAgentStatus** - Agent status monitoring and control
3. **useClaraCoreAutostart** - Automatic service startup management
4. **useNetworkResiliency** - Network error handling and retry logic
5. **useThreeJSGraph** - 3D graph interaction and manipulation
6. **useWidgetService** - Widget management and lifecycle

### Memory Management Hooks
7. **useMemoryManager** - Memory operations and context management
8. **useClaraMemoryIntegration** - Memory integration across services

### UI State Hooks
9. **useModalState** - Modal and overlay state management
10. **useNotificationState** - Notification system state
11. **useThemeState** - Theme and appearance management
12. **useLayoutState** - Layout and responsive design state

### Data Management Hooks
13. **useTaskStore** - Task state management and persistence
14. **useNotebookStore** - Notebook state and operations
15. **useAgentStore** - Agent configuration and execution state

### Hook Implementation Pattern:
```typescript
function useFeatureLogic(initialState, dependencies) {
  const [state, setState] = useState(initialState);

  const featureFunction = useCallback(async (params) => {
    // Feature logic implementation
    setState(newState);
  }, [dependencies]);

  return {
    state,
    featureFunction,
    // Additional exports
  };
}
```

## 8. Backend Services Architecture

ClaraVerse integrates multiple backend services for comprehensive functionality.

### Go Backend Services
1. **python-mcp-server-linux** - MCP server implementation for Linux
2. **llama-optimizer-linux** - LLaMA model optimization service
3. **widgets-service-linux** - Widget service for system monitoring

### Python Backend Services
4. **FastAPI Server** - Document processing and AI integration
5. **Text-to-Speech Service** - TTS functionality with multiple providers
6. **Speech-to-Text Service** - STT functionality with voice recognition

### Electron Backend Services
7. **Task Service** - Task persistence and management
8. **IPC Handlers** - Inter-process communication management
9. **Window Manager** - Application window lifecycle
10. **Service Initializer** - Backend service orchestration

### Backend Architecture Patterns

**Service Communication:**
- WebSocket connections for real-time data
- HTTP APIs for request/response patterns
- IPC channels for Electron integration
- Message queues for async processing

**Error Handling:**
- Graceful service degradation
- Automatic retry mechanisms
- Health check endpoints
- Logging and monitoring integration

## 9. Architecture Diagrams

```
┌─────────────────────────────────────────────────────────────────┐
│                    ClaraVerse System Architecture               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Frontend      │  │   Backend       │  │   External      │  │
│  │   (React TS)    │  │   Services      │  │   Services      │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│          │                    │                    │            │
│  ┌───────▼────────┐  ┌─────────▼─────────┐  ┌───────▼─────────┐  │
│  │  Components     │  │  Services Layer   │  │  AI Providers   │  │
│  │  (50+)          │  │  (25+)            │  │  (Ollama,       │  │
│  │                 │  │                   │  │   OpenAI, etc)  │  │
│  │  • Dashboard    │  │  • claraAgent*    │  │                 │  │
│  │  • Notebooks    │  │  • claraMemory*   │  │  ┌─────────────┐ │  │
│  │  • Widgets      │  │  • claraChat*     │  │  │  Local      │ │  │
│  │  • Tasks        │  │  • claraMCP*      │  │  │  Models     │ │  │
│  │  • Agents       │  │  • claraTool*     │  │  │  (GGUF)     │ │  │
│  └──────────────┬──┘  └─────────┬─────────┘  └─────┬───────────┘ │  │
│                 │               │                   │             │
│  ┌──────────────▼───────────────▼───────────────────▼─────────────┐ │
│  │                    Data Persistence Layer                     │ │
│  │  • IndexedDB (Browser)  • SQLite (Electron)  • File System   │ │
│  │  • Memory Storage       • Configuration        • Assets       │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    Infrastructure & DevOps                     │ │
│  │  • Docker Containers    • Service Monitoring   • Auto-scaling  │ │
│  │  • Health Checks        • Logging & Metrics    • CI/CD         │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Input    │───▶│   React         │───▶│   Services      │
│   (UI Events)   │    │   Components    │    │   Layer         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   State         │    │   Business      │    │   Backend       │
│   Management    │    │   Logic         │    │   Services      │
│   (Context/Hooks)│    │   (API Calls)   │    │   (Go/Python)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Data          │    │   External      │    │   AI Models     │
│   Persistence   │    │   APIs          │    │   (Local/Remote)│
│   (IndexedDB)   │    │   (REST/WebSocket)│   │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Service Interaction Patterns

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Widget        │◀───│   Widget        │───▶│   System        │
│   Components    │    │   Service       │    │   Monitoring    │
│                 │    │   Client        │    │   Service       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Memory        │    │   Task          │    │   Notebook      │
│   Manager       │    │   Manager       │    │   Service       │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

This specification provides a comprehensive overview of the ClaraVerse system architecture, core features, and extension points for developers to understand, navigate, and effectively extend the application.