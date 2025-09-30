# Global Keyboard Shortcuts System for Voice Features

A comprehensive keyboard shortcuts system that provides instant access to voice features across the entire ClaraVerse application.

## Features Implemented

✅ **Global Keyboard Shortcuts System** - Centralized keyboard shortcut management
✅ **Voice Mode Toggle** - Quick toggle for voice mode (Ctrl+Shift+V)
✅ **Quick Voice Recording** - Instant voice recording (Ctrl+Shift+M)
✅ **Voice Command Mode** - Dedicated voice command mode (Ctrl+Shift+C)
✅ **Task Voice Commands** - Quick access to task voice commands (Ctrl+Shift+T)
✅ **Voice Settings** - Quick access to voice settings (Ctrl+Shift+S)
✅ **Contextual Shortcuts** - Different shortcuts based on current application context
✅ **Keyboard Shortcut Configuration** - User-customizable shortcuts in settings
✅ **Visual Shortcut Indicators** - On-screen display of available shortcuts
✅ **Cross-Platform Support** - Works on Windows, Mac, and Linux

## Quick Start

### 1. Wrap your app with the provider

```tsx
import { VoiceKeyboardShortcutsIntegration } from './components/VoiceKeyboardShortcutsIntegration';
import { voiceService } from './services/voice/VoiceService';

function App() {
  return (
    <VoiceKeyboardShortcutsIntegration
      voiceService={voiceService}
      currentView="main"
    >
      <YourAppContent />
    </VoiceKeyboardShortcutsIntegration>
  );
}
```

### 2. Use the shortcuts in your components

```tsx
import { useVoiceKeyboardShortcuts } from './components/VoiceKeyboardShortcutsIntegration';

function YourComponent() {
  const { showVoiceSettings, toggleVoiceOverlay } = useVoiceKeyboardShortcuts();

  return (
    <div>
      <button onClick={showVoiceSettings}>
        Voice Settings
      </button>
      <button onClick={toggleVoiceOverlay}>
        Toggle Shortcuts
      </button>
    </div>
  );
}
```

## Default Shortcuts

| Shortcut | Action | Description |
|----------|--------|-------------|
| **Ctrl+Shift+V** | Toggle Voice Mode | Enable/disable voice features |
| **Ctrl+Shift+M** | Quick Voice Recording | Start/stop voice recording |
| **Ctrl+Shift+C** | Voice Command Mode | Enter dedicated voice command mode |
| **Ctrl+Shift+T** | Task Voice Commands | Access task-related voice commands |
| **Ctrl+Shift+S** | Voice Settings | Open voice settings |

### Platform-Specific Display

- **Mac**: ⌘⇧V, ⌘⇧M, ⌘⇧C, ⌘⇧T, ⌘⇧S
- **Windows/Linux**: Ctrl+Shift+V, Ctrl+Shift+M, Ctrl+Shift+C, Ctrl+Shift+T, Ctrl+Shift+S

## Advanced Usage

### Custom Shortcuts

```tsx
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function CustomComponent() {
  const { registerShortcut } = useKeyboardShortcuts({ voiceService });

  useEffect(() => {
    registerShortcut({
      id: 'custom-voice-shortcut',
      name: 'Custom Voice Action',
      description: 'Custom voice functionality',
      combination: { key: 'X', modifiers: ['ctrl', 'shift'] },
      category: 'voice',
      action: () => {
        console.log('Custom voice action triggered');
      },
    });
  }, [registerShortcut]);
}
```

### Contextual Shortcuts

The system automatically provides different shortcuts based on the current view:

```tsx
<VoiceKeyboardShortcutsIntegration
  voiceService={voiceService}
  currentView="tasks" // Shows task-related voice shortcuts
>
  <TaskView />
</VoiceKeyboardShortcutsIntegration>
```

Available contexts:
- `main` - Default shortcuts
- `tasks` - Task creation and management shortcuts
- `chat` - Chat and messaging shortcuts
- `settings` - Settings-related shortcuts

### Configuration

```tsx
const { updateConfig } = useKeyboardShortcuts({ voiceService });

updateConfig({
  globalEnabled: true,        // Enable/disable all shortcuts
  visualIndicators: true,     // Show/hide visual indicators
  preventDefault: true,       // Prevent default browser behavior
});
```

## Components

### KeyboardShortcutsOverlay

Shows available shortcuts in a floating overlay.

```tsx
import { KeyboardShortcutsOverlay } from './components/KeyboardShortcutsOverlay';

<KeyboardShortcutsOverlay
  voiceService={voiceService}
  visible={true}
  position="top-right"
  showCategories={['voice', 'task']}
/>
```

### KeyboardShortcutSettings

Provides a modal for users to customize their shortcuts.

```tsx
import { KeyboardShortcutSettings } from './components/KeyboardShortcutSettings';

<KeyboardShortcutSettings
  voiceService={voiceService}
  onClose={() => setShowSettings(false)}
/>
```

## Architecture

### Core Services

- **KeyboardService** - Central keyboard shortcut management
- **VoiceService** - Integration with existing voice functionality
- **useKeyboardShortcuts** - React hook for component integration

### Type Definitions

```tsx
interface KeyboardShortcut {
  id: string;
  name: string;
  description: string;
  combination: KeyCombination;
  category: 'voice' | 'task' | 'navigation' | 'general';
  action: () => void | Promise<void>;
  enabled?: boolean;
  contextual?: boolean;
  context?: string[];
}
```

### Event System

The keyboard service emits events for:
- `shortcutTriggered` - When a shortcut is executed
- `shortcutRegistered` - When a new shortcut is added
- `shortcutUnregistered` - When a shortcut is removed
- `configChanged` - When configuration is updated

## Integration Examples

### With Existing Voice Components

```tsx
import { VoiceSettings } from './components/VoiceSettings';
import { VoiceKeyboardShortcutsIntegration } from './components/VoiceKeyboardShortcutsIntegration';

function VoiceSection() {
  return (
    <VoiceKeyboardShortcutsIntegration voiceService={voiceService}>
      <VoiceSettings />
      <VoiceRecorder />
    </VoiceKeyboardShortcutsIntegration>
  );
}
```

### With Task Management

```tsx
function TaskManager() {
  const { showVoiceSettings } = useVoiceKeyboardShortcuts();

  return (
    <div>
      <TaskList />
      <button onClick={showVoiceSettings}>
        Voice Settings (Ctrl+Shift+S)
      </button>
    </div>
  );
}
```

## Cross-Platform Support

The system automatically handles platform differences:

- **Mac**: Uses ⌘ (Cmd) key, displays shortcuts in Mac format
- **Windows/Linux**: Uses Ctrl key, displays shortcuts in Windows format
- **Key Mapping**: Automatically maps equivalent keys (e.g., Cmd → Ctrl on Windows)

## Best Practices

1. **Wrap at App Level**: Place the `VoiceKeyboardShortcutsIntegration` at the root of your app
2. **Use Contextual Shortcuts**: Leverage the `currentView` prop for context-aware shortcuts
3. **Consistent Categories**: Use the predefined categories (`voice`, `task`, `navigation`, `general`)
4. **Error Handling**: Always wrap shortcut actions in try-catch blocks
5. **User Feedback**: Provide visual feedback when shortcuts are triggered

## Troubleshooting

### Shortcuts Not Working

1. Check if the provider is properly wrapping your component
2. Verify that `globalEnabled` is set to `true`
3. Ensure no other components are capturing the key events first

### Customization Issues

1. Make sure shortcut IDs are unique
2. Test key combinations for conflicts
3. Check browser console for error messages

### Performance

- Shortcuts are efficiently managed with minimal memory footprint
- Event listeners are properly cleaned up
- No performance impact when shortcuts are disabled