# Clara UI Style Guide

## Overview

This style guide documents the UI patterns, components, and design system used throughout the ClaraVerse application. The codebase demonstrates a sophisticated React-based architecture with consistent design patterns, advanced state management, and a cohesive visual design system.

## Technology Stack

### Core Technologies
- **React 18+** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Custom CSS classes** for specialized effects

### Framework Features
- **Dark Mode Support**: Comprehensive theme switching with `dark:` prefixes
- **Glassmorphic Design**: Consistent backdrop blur effects throughout
- **Responsive Design**: Mobile-first approach with flexible layouts
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support

## Design System

### Color Palette

#### Primary Colors
- **Sakura Theme**: Custom pink/sakura color scheme (`sakura-50` through `sakura-900`)
- **Semantic Colors**: Standard Tailwind color palette for UI states
- **Status Colors**:
  - Success: `green-500`, `emerald-500`
  - Error: `red-500`, `red-600`
  - Warning: `yellow-500`, `amber-500`
  - Info: `blue-500`, `purple-500`

#### Custom Color Usage
```css
/* Primary brand color */
bg-sakura-500 text-white
/* Secondary states */
bg-sakura-100 text-sakura-500
/* Hover states */
hover:bg-sakura-600
/* Dark mode variants */
dark:bg-sakura-900/30 dark:text-sakura-400
```

### Glassmorphic Design Pattern

#### Reusable Classes
```tsx
// Card containers
className="glassmorphic rounded-xl p-6"

// Button variants
className="glassmorphicButton p-2 bg-white/20 dark:bg-gray-800/30"

// Constants defined in components
const glassmorphicCard = "bg-white/10 dark:bg-gray-900/30 backdrop-blur-lg border border-white/20 dark:border-gray-700/50 shadow-lg";
const glassmorphicButton = "p-2 bg-white/20 dark:bg-gray-800/30 backdrop-blur-md border border-white/30 dark:border-gray-700/50 rounded-lg transition-all duration-300 shadow-sm";
```

#### Usage Guidelines
- Use for main content containers
- Apply consistently across similar UI elements
- Ensure proper contrast for readability
- Combine with backdrop-blur for optimal effect

### Typography System

#### Font Hierarchy
- **Headings**: `text-lg font-semibold` to `text-2xl font-bold`
- **Body Text**: `text-sm` for secondary information
- **Labels**: `text-sm font-medium` for form labels
- **Monospace**: `font-mono` for technical information (URLs, file names)

#### Advanced Typography Features
```tsx
// Font scaling system
fontSize: `${((font_scale * 16))}px`
fontWeight: font_weight === 'light' ? '300' : '400'
lineHeight: line_height === 'tight' ? '1.25' : '1.5'
letterSpacing: letter_spacing === 'tight' ? '-0.025em' : '0'

// Font family with fallbacks
fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
```

#### Font Presets System
- **AI Interface**: Modern, clean fonts for chat interfaces
- **Professional**: Traditional fonts for business contexts
- **Reading**: Serif fonts for long-form content
- **Code**: Monospace fonts for technical content

### Icon System

#### Icon Library
- **Lucide React**: Primary icon system
- **Consistent Sizing**: `w-4 h-4`, `w-5 h-5`, `w-6 h-6`
- **Semantic Usage**: Each icon represents a specific action or concept

#### Icon Categories
```tsx
// Navigation
Home, Settings, HelpCircle, Users
// Actions
Download, Upload, Edit3, Trash2, Save
// Status
CheckCircle, AlertTriangle, Info, X
// Content Types
Bot, Brain, Image, FileText, Video
// Hardware
Cpu, HardDrive, Zap, Monitor
```

## Component Architecture

### Component Structure Patterns

#### 1. Layout Components
```tsx
interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Context Menu System */}
      {/* Global Event Handlers */}
      {children}
    </div>
  );
};
```

#### 2. Feature Components
```tsx
interface FeatureComponentProps {
  data: DataType;
  onAction: (id: string) => void;
  isLoading?: boolean;
  error?: string;
}

const FeatureComponent = ({ data, onAction, isLoading, error }: FeatureComponentProps) => {
  // Loading state
  // Error handling
  // Main functionality
  // Event handlers
};
```

#### 3. Modal Components
```tsx
const ModalComponent = () => {
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<'select' | 'configure'>('select');

  return (
    <>
      {/* Trigger Button */}
      <button onClick={() => setShowModal(true)} />

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
          <div className="flex items-center justify-center min-h-screen p-4">
            {/* Modal Content */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
              {/* Multi-step content based on step state */}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
```

### State Management Patterns

#### Complex State Management
```tsx
const [complexState, setComplexState] = useState({
  primary: initialValue,
  secondary: initialValue,
  tertiary: initialValue
});

// Multiple related states
const [activeTab, setActiveTab] = useState('main');
const [subTab, setSubTab] = useState('details');
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

#### Real-time Data Management
```tsx
useEffect(() => {
  // Real-time service status monitoring
  const handleServiceStatusUpdate = (event: CustomEvent) => {
    setServiceStatus(prev => ({
      ...prev,
      [event.detail.serviceName]: event.detail.status
    }));
  };

  window.addEventListener('service-status-update', handleServiceStatusUpdate);
  return () => window.removeEventListener('service-status-update', handleServiceStatusUpdate);
}, []);
```

#### Async Data Loading
```tsx
useEffect(() => {
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchData();
      setData(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  loadData();
}, [dependencies]);
```

### Event Handling Patterns

#### Global Event Listeners
```tsx
useEffect(() => {
  const handleGlobalEvent = (event: CustomEvent) => {
    // Handle cross-component communication
  };

  const handleKeyboardShortcuts = (event: KeyboardEvent) => {
    if (event.ctrlKey && event.key === 's') {
      event.preventDefault();
      handleSave();
    }
  };

  window.addEventListener('custom-event', handleGlobalEvent);
  document.addEventListener('keydown', handleKeyboardShortcuts);

  return () => {
    window.removeEventListener('custom-event', handleGlobalEvent);
    document.removeEventListener('keydown', handleKeyboardShortcuts);
  };
}, []);
```

#### Form Event Handling
```tsx
const handleFormSubmit = async (event: React.FormEvent) => {
  event.preventDefault();
  setIsSubmitting(true);

  try {
    await submitForm(formData);
    setSuccess(true);
  } catch (error) {
    setError(error.message);
  } finally {
    setIsSubmitting(false);
  }
};
```

### Error Handling Patterns

#### Try-Catch with User Feedback
```tsx
const handleAsyncOperation = async () => {
  try {
    const result = await riskyOperation();
    return result;
  } catch (error) {
    console.error('Operation failed:', error);

    // User-friendly error handling
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        // Add to queue
        addToQueue();
      } else {
        // Show error message
        setError('An unexpected error occurred. Please try again.');
      }
    }
  }
};
```

#### Progressive Error Recovery
```tsx
const handleDownload = async () => {
  try {
    await downloadFile();
  } catch (error) {
    if (error.message.includes('429')) {
      // Rate limited - add to queue
      addToQueue();
    } else {
      // Fallback to browser download
      window.open(downloadUrl, '_blank');
    }
  }
};
```

## UI Patterns

### Navigation Patterns

#### Sidebar Navigation
```tsx
const Sidebar = ({ activePage, onPageChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`glassmorphic h-full transition-all duration-300 ${
        isExpanded ? 'w-64' : 'w-20'
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Expandable navigation items */}
      <nav className="flex-1">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                className={`w-full flex items-center rounded-lg transition-colors h-10 ${
                  activePage === item.id
                    ? 'bg-sakura-100 text-sakura-500 dark:bg-sakura-100/10'
                    : 'hover:bg-sakura-50 hover:text-sakura-500'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className={`transition-all duration-300 ${
                  isExpanded ? 'opacity-100 w-auto ml-3' : 'opacity-0 w-0'
                }`}>
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};
```

#### Tab Navigation
```tsx
const TabNavigation = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === tab.id
              ? 'bg-sakura-500 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
```

### Card Patterns

#### Data Display Cards
```tsx
const DataCard = ({ title, value, icon, trend }) => {
  return (
    <div className="glassmorphic rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {trend && (
            <p className={`text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
            </p>
          )}
        </div>
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
          <icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    </div>
  );
};
```

#### Interactive Cards
```tsx
const InteractiveCard = ({ item, onSelect, isSelected }) => {
  return (
    <div
      className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
        isSelected
          ? 'border-sakura-300 bg-sakura-50/60 dark:bg-sakura-500/10'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => onSelect(item.id)}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <CheckCircle className="w-5 h-5 text-sakura-500" />
        </div>
      )}

      {/* Content */}
      <div className="space-y-2">
        <h3 className="font-medium text-gray-900 dark:text-white">
          {item.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {item.description}
        </p>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors rounded-xl" />
    </div>
  );
};
```

### Form Patterns

#### Input Components
```tsx
const FormInput = ({ label, value, onChange, placeholder, type = 'text' }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-2 rounded-lg bg-white/50 border border-gray-200 focus:outline-none focus:border-sakura-300 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-100 transition-colors"
      />
    </div>
  );
};
```

#### Select Components
```tsx
const FormSelect = ({ label, value, onChange, options }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={onChange}
        className="w-full px-4 py-2 rounded-lg bg-white/50 border border-gray-200 focus:outline-none focus:border-sakura-300 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
```

#### Checkbox and Radio Groups
```tsx
const CheckboxGroup = ({ options, selected, onChange }) => {
  return (
    <div className="space-y-2">
      {options.map((option) => (
        <label key={option.id} className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.includes(option.id)}
            onChange={() => onChange(option.id)}
            className="w-4 h-4 text-sakura-500 rounded border-gray-300 focus:ring-sakura-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );
};
```

### Progress Indicators

#### Loading States
```tsx
const LoadingSpinner = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`animate-spin rounded-full border-t-2 border-b-2 border-sakura-500 ${sizeClasses[size]}`} />
  );
};
```

#### Progress Bars
```tsx
const ProgressBar = ({ progress, showLabel = true }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Progress
        </span>
        {showLabel && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {Math.round(progress * 100)}%
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-sakura-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
};
```

### Notification Patterns

#### Toast Notifications
```tsx
const ToastNotification = ({ type, message, onClose }) => {
  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
  };

  return (
    <div className={`p-4 rounded-lg border ${typeStyles[type]}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{message}</p>
        <button onClick={onClose}>
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
```

#### Inline Status Messages
```tsx
const StatusMessage = ({ status, message }) => {
  const statusConfig = {
    loading: { icon: LoadingSpinner, color: 'text-blue-500' },
    success: { icon: CheckCircle, color: 'text-green-500' },
    error: { icon: AlertTriangle, color: 'text-red-500' },
    warning: { icon: AlertTriangle, color: 'text-yellow-500' }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
      <Icon className={`w-4 h-4 ${config.color}`} />
      <span className="text-sm text-gray-700 dark:text-gray-300">
        {message}
      </span>
    </div>
  );
};
```

## Advanced Patterns

### Multi-step Workflows

#### Step-by-step Modals
```tsx
const MultiStepModal = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const steps = [
    { id: 1, title: 'Select Provider', component: Step1 },
    { id: 2, title: 'Configure Settings', component: Step2 },
    { id: 3, title: 'Review & Save', component: Step3 }
  ];

  const CurrentStepComponent = steps.find(s => s.id === currentStep)?.component;

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step.id === currentStep
                ? 'bg-sakura-500 text-white'
                : step.id < currentStep
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}>
              {step.id < currentStep ? '✓' : step.id}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-12 h-0.5 mx-2 ${
                step.id < currentStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <CurrentStepComponent onNext={() => setCurrentStep(prev => prev + 1)} />

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(prev => prev - 1)}
          disabled={currentStep === 1}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => setCurrentStep(prev => prev + 1)}
          disabled={currentStep === totalSteps}
          className="px-4 py-2 bg-sakura-500 text-white rounded-lg"
        >
          Next
        </button>
      </div>
    </div>
  );
};
```

### Real-time Data Display

#### Live Status Indicators
```tsx
const LiveStatusIndicator = ({ serviceName, status }) => {
  const statusConfig = {
    running: { color: 'bg-green-500', label: 'Running' },
    stopped: { color: 'bg-gray-500', label: 'Stopped' },
    error: { color: 'bg-red-500', label: 'Error' },
    starting: { color: 'bg-yellow-500', label: 'Starting' }
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${config.color} animate-pulse`} />
      <span className="text-sm text-gray-700 dark:text-gray-300">
        {serviceName}: {config.label}
      </span>
    </div>
  );
};
```

#### Activity Monitoring
```tsx
const ActivityMonitor = ({ activities }) => {
  return (
    <div className="space-y-2">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              activity.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`} />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {activity.name}
            </span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {activity.lastUpdate}
          </span>
        </div>
      ))}
    </div>
  );
};
```

### File Upload Patterns

#### Drag and Drop Upload
```tsx
const FileUploadZone = ({ onUpload, accept, maxSize }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(file =>
      accept.includes(file.type) && file.size <= maxSize
    );

    setFiles(validFiles);
    onUpload(validFiles);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging
          ? 'border-sakura-300 bg-sakura-50/50 dark:bg-sakura-900/20'
          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="space-y-4">
        <div className="w-12 h-12 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <Upload className="w-6 h-6 text-gray-400" />
        </div>
        <div>
          <p className="text-lg font-medium text-gray-900 dark:text-white">
            Drop files here or click to browse
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Supports {accept.join(', ')} up to {formatBytes(maxSize)}
          </p>
        </div>
      </div>
    </div>
  );
};
```

#### Upload Progress
```tsx
const UploadProgress = ({ file, progress }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {file.name}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {formatBytes(file.size)}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
        <div
          className="bg-sakura-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Uploading...</span>
        <span>{progress}%</span>
      </div>
    </div>
  );
};
```

### Real-time Service Monitoring

#### Service Health Dashboard
```tsx
const ServiceHealthDashboard = ({ services }) => {
  const [serviceMetrics, setServiceMetrics] = useState({});
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const metrics = await fetchServiceMetrics();
        setServiceMetrics(metrics);

        // Check for alerts
        const newAlerts = checkForServiceAlerts(metrics);
        setAlerts(prev => [...prev, ...newAlerts]);
      } catch (error) {
        console.error('Failed to fetch service metrics:', error);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Service grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            metrics={serviceMetrics[service.id]}
          />
        ))}
      </div>

      {/* System overview */}
      <div className="glassmorphic rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">System Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Total Services"
            value={services.length}
            icon={Server}
            trend="stable"
          />
          <MetricCard
            title="Healthy Services"
            value={services.filter(s => serviceMetrics[s.id]?.status === 'healthy').length}
            icon={CheckCircle}
            trend="up"
          />
          <MetricCard
            title="Active Alerts"
            value={alerts.filter(a => a.status === 'active').length}
            icon={AlertTriangle}
            trend="down"
          />
          <MetricCard
            title="Avg Response Time"
            value={`${serviceMetrics.avgResponseTime || 0}ms`}
            icon={Clock}
            trend="down"
          />
        </div>
      </div>

      {/* Alert feed */}
      <div className="glassmorphic rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Alerts</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {alerts.slice(-10).map((alert) => (
            <AlertItem key={alert.id} alert={alert} />
          ))}
        </div>
      </div>
    </div>
  );
};

const ServiceCard = ({ service, metrics }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-500 bg-green-100 dark:bg-green-900/30';
      case 'warning': return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30';
      case 'error': return 'text-red-500 bg-red-100 dark:bg-red-900/30';
      default: return 'text-gray-500 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  return (
    <div className="glassmorphic rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            metrics?.status === 'healthy' ? 'bg-green-500 animate-pulse' :
            metrics?.status === 'warning' ? 'bg-yellow-500' :
            metrics?.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
          }`} />
          <h4 className="font-medium text-gray-900 dark:text-white">
            {service.name}
          </h4>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(metrics?.status)}`}>
          {metrics?.status || 'unknown'}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Uptime</span>
          <span className="text-gray-900 dark:text-white">
            {metrics?.uptime ? `${Math.round(metrics.uptime * 100)}%` : 'N/A'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Response Time</span>
          <span className="text-gray-900 dark:text-white">
            {metrics?.responseTime ? `${metrics.responseTime}ms` : 'N/A'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">CPU Usage</span>
          <span className="text-gray-900 dark:text-white">
            {metrics?.cpu ? `${metrics.cpu}%` : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
};
```

#### Service Metrics Collection
```tsx
const useServiceMetrics = (serviceIds) => {
  const [metrics, setMetrics] = useState({});
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket('wss://api.example.com/metrics');

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onerror = (error) => console.error('WebSocket error:', error);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMetrics(prev => ({
          ...prev,
          [data.serviceId]: {
            ...data.metrics,
            lastUpdated: Date.now()
          }
        }));
      } catch (error) {
        console.error('Failed to parse metrics:', error);
      }
    };

    return () => ws.close();
  }, [serviceIds]);

  const refreshMetrics = async () => {
    try {
      const updatedMetrics = await Promise.all(
        serviceIds.map(id => fetch(`/api/services/${id}/metrics`).then(r => r.json()))
      );

      const metricsMap = {};
      updatedMetrics.forEach((metric, index) => {
        metricsMap[serviceIds[index]] = {
          ...metric,
          lastUpdated: Date.now()
        };
      });

      setMetrics(metricsMap);
    } catch (error) {
      console.error('Failed to refresh metrics:', error);
    }
  };

  return { metrics, isConnected, refreshMetrics };
};
```

### Hierarchical Tab Systems

#### Nested Tab Navigation
```tsx
const HierarchicalTabs = ({ tabs, onTabChange, onSubTabChange }) => {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '');
  const [activeSubTab, setActiveSubTab] = useState('');

  const currentTab = tabs.find(tab => tab.id === activeTab);
  const subTabs = currentTab?.subTabs || [];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setActiveSubTab(''); // Reset sub-tab when changing main tab
    onTabChange(tabId);
  };

  const handleSubTabChange = (subTabId) => {
    setActiveSubTab(subTabId);
    onSubTabChange(subTabId);
  };

  return (
    <div className="w-full">
      {/* Main tab navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-sakura-500 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </div>
          </button>
        ))}
      </div>

      {/* Sub-tab navigation */}
      {subTabs.length > 0 && (
        <div className="flex space-x-1 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-1 mb-6">
          {subTabs.map((subTab) => (
            <button
              key={subTab.id}
              onClick={() => handleSubTabChange(subTab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                activeSubTab === subTab.id
                  ? 'bg-sakura-100 text-sakura-700 dark:bg-sakura-900/30 dark:text-sakura-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {subTab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab content area */}
      <div className="min-h-96">
        {currentTab && (
          <currentTab.component
            activeSubTab={activeSubTab}
            onSubTabChange={handleSubTabChange}
          />
        )}
      </div>
    </div>
  );
};

// Usage example
const tabs = [
  {
    id: 'models',
    label: 'Models',
    icon: Brain,
    component: ModelManagement,
    subTabs: [
      { id: 'installed', label: 'Installed' },
      { id: 'available', label: 'Available' },
      { id: 'custom', label: 'Custom' }
    ]
  },
  {
    id: 'services',
    label: 'Services',
    icon: Server,
    component: ServiceManagement,
    subTabs: [
      { id: 'running', label: 'Running' },
      { id: 'stopped', label: 'Stopped' },
      { id: 'failed', label: 'Failed' }
    ]
  }
];
```

#### Breadcrumb Navigation
```tsx
const BreadcrumbNavigation = ({ path, onNavigate }) => {
  return (
    <nav className="flex items-center space-x-2 text-sm mb-4" aria-label="Breadcrumb">
      <button
        onClick={() => onNavigate('root')}
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <Home className="w-4 h-4" />
      </button>

      {path.map((crumb, index) => (
        <React.Fragment key={crumb.id}>
          <span className="text-gray-400 dark:text-gray-500">/</span>
          {index === path.length - 1 ? (
            <span className="font-medium text-gray-900 dark:text-white">
              {crumb.label}
            </span>
          ) : (
            <button
              onClick={() => onNavigate(crumb.id)}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {crumb.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
```

### Provider Management

#### Context Provider Architecture
```tsx
// Theme Provider
const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {}
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Service Provider
const ServiceContext = createContext({
  services: [],
  isLoading: false,
  error: null,
  refreshServices: () => {}
});

export const ServiceProvider = ({ children }) => {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshServices = async () => {
    setIsLoading(true);
    try {
      const data = await fetchServices();
      setServices(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshServices();
  }, []);

  return (
    <ServiceContext.Provider value={{
      services,
      isLoading,
      error,
      refreshServices
    }}>
      {children}
    </ServiceContext.Provider>
  );
};

// Combined Provider
export const AppProviders = ({ children }) => {
  return (
    <ThemeProvider>
      <ServiceProvider>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </ServiceProvider>
    </ThemeProvider>
  );
};
```

#### Service Injection Pattern
```tsx
const useServices = () => {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useServices must be used within ServiceProvider');
  }
  return context;
};

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// Usage in components
const ServiceManager = () => {
  const { services, isLoading, error, refreshServices } = useServices();
  const { theme, toggleTheme } = useTheme();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} onRetry={refreshServices} />;

  return (
    <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Service Management</h2>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </div>
  );
};
```

### Responsive Grid Layouts

#### Advanced Grid Systems
```tsx
const ResponsiveGrid = ({ items, breakpoints = {
  xs: 1, sm: 2, md: 3, lg: 4, xl: 5, '2xl': 6
} }) => {
  const getGridCols = () => {
    const screenSizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    let cols = 'grid-cols-1';

    for (const size of screenSizes) {
      if (window.innerWidth >= getBreakpointValue(size)) {
        cols = `md:grid-cols-${breakpoints[size]}`;
      }
    }
    return cols;
  };

  const [gridCols, setGridCols] = useState(getGridCols());

  useEffect(() => {
    const handleResize = () => {
      setGridCols(getGridCols());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoints]);

  return (
    <div className={`grid gap-4 ${gridCols}`}>
      {items.map((item) => (
        <GridItem key={item.id} item={item} />
      ))}
    </div>
  );
};

// Utility function for breakpoint values
const getBreakpointValue = (breakpoint) => {
  const values = {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  };
  return values[breakpoint] || 0;
};
```

#### Masonry Grid Layout
```tsx
const MasonryGrid = ({ items, columnWidth = 300, gap = 16 }) => {
  const [columns, setColumns] = useState(1);
  const containerRef = useRef(null);

  useEffect(() => {
    const updateColumns = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const newColumns = Math.floor((containerWidth + gap) / (columnWidth + gap));
        setColumns(Math.max(1, newColumns));
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [columnWidth, gap]);

  // Group items into columns
  const columnizedItems = useMemo(() => {
    const cols = Array.from({ length: columns }, () => []);
    items.forEach((item, index) => {
      cols[index % columns].push(item);
    });
    return cols;
  }, [items, columns]);

  return (
    <div ref={containerRef} className="flex gap-4">
      {columnizedItems.map((columnItems, columnIndex) => (
        <div key={columnIndex} className="flex-1 space-y-4">
          {columnItems.map((item) => (
            <MasonryItem key={item.id} item={item} />
          ))}
        </div>
      ))}
    </div>
  );
};
```

#### Auto-fit Grid with Minmax
```tsx
const AutoFitGrid = ({ items, minItemWidth = '300px', gap = '1rem' }) => {
  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`,
        gap: gap
      }}
    >
      {items.map((item) => (
        <div key={item.id} className="min-h-0">
          <GridItem item={item} />
        </div>
      ))}
    </div>
  );
};

// Usage examples
const galleryItems = [
  { id: 1, image: 'image1.jpg', height: 200 },
  { id: 2, image: 'image2.jpg', height: 300 },
  { id: 3, image: 'image3.jpg', height: 250 },
  // ... more items
];

// Different grid configurations
<ResponsiveGrid items={galleryItems} breakpoints={{ sm: 1, md: 2, lg: 3, xl: 4 }} />
<MasonryGrid items={galleryItems} columnWidth={280} gap={20} />
<AutoFitGrid items={galleryItems} minItemWidth="250px" gap="1.5rem" />
```

### Multi-panel Architectures

#### Resizable Split Panels
```tsx
const ResizablePanels = ({
  children,
  orientation = 'horizontal',
  defaultSizes = [50, 50],
  minSizes = [200, 200]
}) => {
  const [sizes, setSizes] = useState(defaultSizes);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  const handleMouseDown = (index) => {
    setIsResizing(true);
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const totalSize = orientation === 'horizontal' ? rect.width : rect.height;
      const position = orientation === 'horizontal' ? e.clientX - rect.left : e.clientY - rect.top;
      const percentage = (position / totalSize) * 100;

      const newSizes = [...sizes];
      newSizes[index] = Math.max(minSizes[index] / totalSize * 100, percentage);
      newSizes[index + 1] = 100 - newSizes[index];

      setSizes(newSizes);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={containerRef}
      className={`flex ${orientation === 'vertical' ? 'flex-col' : 'flex-row'} h-full w-full`}
    >
      {children.map((child, index) => (
        <React.Fragment key={index}>
          <div
            className="overflow-hidden"
            style={{
              [orientation === 'horizontal' ? 'width' : 'height']: `${sizes[index]}%`
            }}
          >
            {child}
          </div>
          {index < children.length - 1 && (
            <div
              className={`bg-gray-200 dark:bg-gray-700 transition-colors ${
                isResizing ? 'bg-sakura-300 dark:bg-sakura-600' : ''
              } ${
                orientation === 'horizontal'
                  ? 'w-1 cursor-col-resize hover:bg-sakura-200 dark:hover:bg-sakura-700'
                  : 'h-1 cursor-row-resize hover:bg-sakura-200 dark:hover:bg-sakura-700'
              }`}
              onMouseDown={() => handleMouseDown(index)}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// Usage
const MultiPanelLayout = () => {
  return (
    <div className="h-screen">
      <ResizablePanels
        orientation="horizontal"
        defaultSizes={[20, 80]}
        minSizes={[150, 400]}
      >
        <SidebarPanel />
        <ResizablePanels
          orientation="vertical"
          defaultSizes={[60, 40]}
          minSizes={[200, 150]}
        >
          <MainContentPanel />
          <BottomPanel />
        </ResizablePanels>
      </ResizablePanels>
    </div>
  );
};
```

#### Panel State Management
```tsx
const usePanelState = (initialPanels = []) => {
  const [panels, setPanels] = useState(initialPanels);
  const [activePanel, setActivePanel] = useState(null);

  const addPanel = (panel) => {
    setPanels(prev => [...prev, { ...panel, id: Date.now() }]);
  };

  const removePanel = (panelId) => {
    setPanels(prev => prev.filter(p => p.id !== panelId));
    if (activePanel === panelId) {
      setActivePanel(null);
    }
  };

  const togglePanel = (panelId) => {
    setActivePanel(prev => prev === panelId ? null : panelId);
  };

  const updatePanel = (panelId, updates) => {
    setPanels(prev => prev.map(p =>
      p.id === panelId ? { ...p, ...updates } : p
    ));
  };

  return {
    panels,
    activePanel,
    addPanel,
    removePanel,
    togglePanel,
    updatePanel
  };
};
```

## Responsive Design

### Mobile-First Approach
```tsx
// Base styles for mobile
<div className="p-4 space-y-4">

  // Tablet and up
  <div className="md:grid md:grid-cols-2 md:gap-6 md:space-y-0">

    // Desktop and up
    <div className="lg:grid-cols-3 xl:grid-cols-4">

      // Large screens
      <div className="2xl:max-w-7xl 2xl:mx-auto">
```

### Flexible Layouts
```tsx
// Responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

// Responsive flexbox
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

// Responsive spacing
<div className="p-4 sm:p-6 lg:p-8">

// Responsive text
<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
```

## Accessibility Guidelines

### ARIA Labels and Roles
```tsx
// Navigation landmarks
<nav role="navigation" aria-label="Main navigation">

// Form elements
<label htmlFor="input-id">Label text</label>
<input
  id="input-id"
  aria-describedby="help-text"
  aria-invalid={error ? 'true' : 'false'}
/>

// Status announcements
<div role="status" aria-live="polite">
  {statusMessage}
</div>
```

### Keyboard Navigation
```tsx
// Focus management
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleClick();
  }
  if (e.key === 'Escape') {
    onClose();
  }
};

// Skip links
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

### Color Contrast
```tsx
// Ensure sufficient contrast ratios
// Light mode: text-gray-900 (#111827) on white (#ffffff) = 16.1:1
// Dark mode: text-gray-100 (#f3f4f6) on gray-900 (#111827) = 15.8:1

// Use semantic colors for states
text-red-600 // 7:1 contrast ratio on white
text-green-600 // 4.5:1 contrast ratio on white
```

## Performance Optimizations

### Component Optimization
```tsx
// Memoize expensive computations
const expensiveValue = useMemo(() => {
  return heavyComputation(data);
}, [data]);

// Memoize event handlers
const handleClick = useCallback(() => {
  doSomething();
}, [dependencies]);

// Lazy load components
const LazyComponent = lazy(() => import('./Component'));

<Suspense fallback={<LoadingSpinner />}>
  <LazyComponent />
</Suspense>
```

### List Virtualization
```tsx
// For large lists, use virtualization
import { FixedSizeList as List } from 'react-window';

const VirtualizedList = ({ items }) => (
  <List
    height={400}
    itemCount={items.length}
    itemSize={50}
    itemData={items}
  >
    {({ index, data }) => <ListItem item={data[index]} />}
  </List>
);
```

### Image Optimization
```tsx
// Lazy loading with blur placeholder
<img
  src={imageUrl}
  alt={altText}
  loading="lazy"
  className="transition-opacity duration-300"
  onLoad={(e) => e.target.classList.add('opacity-100')}
/>

// Responsive images
<picture>
  <source media="(min-width: 768px)" srcSet={largeImage} />
  <img src={smallImage} alt={altText} />
</picture>
```

## Best Practices

### Code Organization
1. **Group related functionality** in custom hooks
2. **Separate concerns** between UI and business logic
3. **Use consistent naming** conventions
4. **Document complex logic** with comments
5. **Keep components focused** on single responsibilities

### State Management
1. **Use local state** for component-specific data
2. **Implement proper loading states** for async operations
3. **Handle errors gracefully** with user feedback
4. **Clean up subscriptions** in useEffect cleanup functions

### Styling Guidelines
1. **Use Tailwind utilities** consistently
2. **Apply glassmorphic effects** sparingly and purposefully
3. **Maintain dark mode compatibility** throughout
4. **Use semantic color classes** for better maintainability
5. **Implement responsive design** from mobile-first perspective

This style guide serves as a comprehensive reference for maintaining consistency across the ClaraVerse UI components and ensuring a cohesive user experience.