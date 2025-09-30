import {
  VoiceContextType,
  ContextInfo,
  ContextDetectionRule,
  ContextCondition,
  ContextHistoryEntry
} from '../../types/context-aware-voice';

export class ContextDetectionService {
  private currentContext: ContextInfo | null = null;
  private contextHistory: ContextHistoryEntry[] = [];
  private detectionRules: ContextDetectionRule[] = [];
  private contextChangeListeners: Set<(context: ContextInfo) => void> = new Set();
  private isMonitoring = false;
  private monitorInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeDefaultRules();
    this.startMonitoring();
  }

  private initializeDefaultRules(): void {
    this.detectionRules = [
      // Tasks context
      {
        id: 'route-tasks',
        name: 'Tasks Route Detection',
        description: 'Detect when user is in tasks section',
        priority: 10,
        conditions: [
          {
            type: 'route',
            operator: 'contains',
            value: '/tasks'
          }
        ],
        action: {
          setContext: VoiceContextType.TASKS,
          confidence: 0.9
        },
        enabled: true
      },
      {
        id: 'route-task-view',
        name: 'Task View Detection',
        description: 'Detect when viewing specific tasks',
        priority: 15,
        conditions: [
          {
            type: 'route',
            operator: 'contains',
            value: '/task/'
          }
        ],
        action: {
          setContext: VoiceContextType.TASKS,
          confidence: 0.95,
          metadata: { subContext: 'task_detail' }
        },
        enabled: true
      },

      // Chat/Communication context
      {
        id: 'route-chat',
        name: 'Chat Route Detection',
        description: 'Detect when user is in chat/communication areas',
        priority: 10,
        conditions: [
          {
            type: 'route',
            operator: 'contains',
            value: '/chat'
          },
          {
            type: 'route',
            operator: 'contains',
            value: '/assistant'
          },
          {
            type: 'route',
            operator: 'contains',
            value: '/clara'
          }
        ],
        action: {
          setContext: VoiceContextType.CHAT,
          confidence: 0.9
        },
        enabled: true
      },

      // Settings context
      {
        id: 'route-settings',
        name: 'Settings Route Detection',
        description: 'Detect when user is in settings',
        priority: 10,
        conditions: [
          {
            type: 'route',
            operator: 'contains',
            value: '/settings'
          }
        ],
        action: {
          setContext: VoiceContextType.SETTINGS,
          confidence: 0.9
        },
        enabled: true
      },

      // Dashboard context
      {
        id: 'route-dashboard',
        name: 'Dashboard Route Detection',
        description: 'Detect when user is on dashboard',
        priority: 5,
        conditions: [
          {
            type: 'route',
            operator: 'equals',
            value: '/'
          },
          {
            type: 'route',
            operator: 'equals',
            value: '/dashboard'
          }
        ],
        action: {
          setContext: VoiceContextType.DASHBOARD,
          confidence: 0.85
        },
        enabled: true
      },

      // Browser/System context
      {
        id: 'active-element-browser',
        name: 'Browser Detection',
        description: 'Detect when browser is active',
        priority: 8,
        conditions: [
          {
            type: 'active_element',
            operator: 'contains',
            value: 'browser'
          }
        ],
        action: {
          setContext: VoiceContextType.BROWSER,
          confidence: 0.7
        },
        enabled: true
      },

      // Development context
      {
        id: 'active-element-code',
        name: 'Code Editor Detection',
        description: 'Detect when in development environment',
        priority: 7,
        conditions: [
          {
            type: 'active_element',
            operator: 'contains',
            value: 'editor'
          },
          {
            type: 'active_element',
            operator: 'contains',
            value: 'vscode'
          }
        ],
        action: {
          setContext: VoiceContextType.DEVELOPMENT,
          confidence: 0.75
        },
        enabled: true
      },

      // Media context
      {
        id: 'active-element-media',
        name: 'Media Application Detection',
        description: 'Detect when using media applications',
        priority: 6,
        conditions: [
          {
            type: 'active_element',
            operator: 'contains',
            value: 'spotify'
          },
          {
            type: 'active_element',
            operator: 'contains',
            value: 'vlc'
          },
          {
            type: 'active_element',
            operator: 'contains',
            value: 'media'
          }
        ],
        action: {
          setContext: VoiceContextType.MEDIA,
          confidence: 0.7
        },
        enabled: true
      }
    ];
  }

  public startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Monitor route changes
    this.monitorRouteChanges();

    // Monitor active element changes
    this.monitorActiveElement();

    // Monitor user activity patterns
    this.monitorUserActivity();

    // Periodic context validation
    this.monitorInterval = setInterval(() => {
      this.validateCurrentContext();
    }, 5000);
  }

  public stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  private monitorRouteChanges(): void {
    // Listen for route changes from the app
    if (typeof window !== 'undefined') {
      // Monitor URL changes for SPA routing
      let currentUrl = window.location.pathname;

      const observer = new MutationObserver(() => {
        const newUrl = window.location.pathname;
        if (newUrl !== currentUrl) {
          currentUrl = newUrl;
          this.detectContextFromRoute(newUrl);
        }
      });

      // Observe body for SPA route changes
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Also listen for popstate events
      window.addEventListener('popstate', () => {
        this.detectContextFromRoute(window.location.pathname);
      });
    }
  }

  private monitorActiveElement(): void {
    if (typeof window === 'undefined') return;

    // Monitor active element changes
    let lastActiveElement = document.activeElement;

    const observer = new MutationObserver(() => {
      const currentActiveElement = document.activeElement;
      if (currentActiveElement !== lastActiveElement && currentActiveElement) {
        lastActiveElement = currentActiveElement;
        this.detectContextFromActiveElement(currentActiveElement);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-context']
    });

    // Also check periodically for focus changes
    setInterval(() => {
      const currentActiveElement = document.activeElement;
      if (currentActiveElement !== lastActiveElement && currentActiveElement) {
        lastActiveElement = currentActiveElement;
        this.detectContextFromActiveElement(currentActiveElement);
      }
    }, 1000);
  }

  private monitorUserActivity(): void {
    if (typeof window === 'undefined') return;

    let lastActivity = Date.now();
    let activityPatterns: string[] = [];

    const updateActivity = () => {
      lastActivity = Date.now();
      const activeElement = document.activeElement;
      if (activeElement) {
        const elementInfo = this.getElementContextInfo(activeElement);
        activityPatterns.push(elementInfo);
        // Keep only last 10 activities
        if (activityPatterns.length > 10) {
          activityPatterns = activityPatterns.slice(-10);
        }
      }
    };

    // Track various user activities
    ['click', 'keydown', 'scroll', 'focus'].forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Periodic activity pattern analysis
    setInterval(() => {
      if (activityPatterns.length > 0) {
        this.analyzeActivityPatterns(activityPatterns);
        activityPatterns = [];
      }
    }, 10000);
  }

  private detectContextFromRoute(route: string): void {
    const matchingRules = this.detectionRules
      .filter(rule => rule.enabled && this.evaluateRule(rule, { route }))
      .sort((a, b) => b.priority - a.priority);

    if (matchingRules.length > 0) {
      const bestRule = matchingRules[0];
      const contextInfo: ContextInfo = {
        type: bestRule.action.setContext,
        confidence: bestRule.action.confidence,
        metadata: {
          ...bestRule.action.metadata,
          route,
          detectionMethod: 'route'
        },
        timestamp: new Date(),
        source: 'route'
      };

      this.setCurrentContext(contextInfo);
    }
  }

  private detectContextFromActiveElement(element: Element): void {
    const elementInfo = this.getElementContextInfo(element);

    const matchingRules = this.detectionRules
      .filter(rule => rule.enabled && this.evaluateRule(rule, { activeElement: elementInfo }))
      .sort((a, b) => b.priority - a.priority);

    if (matchingRules.length > 0) {
      const bestRule = matchingRules[0];
      const contextInfo: ContextInfo = {
        type: bestRule.action.setContext,
        confidence: bestRule.action.confidence,
        metadata: {
          ...bestRule.action.metadata,
          elementInfo,
          detectionMethod: 'active_element'
        },
        timestamp: new Date(),
        source: 'active_element'
      };

      this.setCurrentContext(contextInfo);
    }
  }

  private getElementContextInfo(element: Element): any {
    return {
      tagName: element.tagName,
      id: element.id,
      className: element.className,
      dataAttributes: this.getDataAttributes(element),
      textContent: element.textContent?.substring(0, 100),
      role: element.getAttribute('role'),
      ariaLabel: element.getAttribute('aria-label')
    };
  }

  private getDataAttributes(element: Element): Record<string, string> {
    const dataAttrs: Record<string, string> = {};
    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('data-')) {
        dataAttrs[attr.name] = attr.value;
      }
    });
    return dataAttrs;
  }

  private analyzeActivityPatterns(patterns: string[]): void {
    // Analyze patterns to detect context
    const contextHints = patterns.join(' ').toLowerCase();

    if (contextHints.includes('task') && contextHints.includes('todo')) {
      this.detectContextFromActivity(VoiceContextType.TASKS, 0.6);
    } else if (contextHints.includes('chat') || contextHints.includes('message')) {
      this.detectContextFromActivity(VoiceContextType.CHAT, 0.6);
    } else if (contextHints.includes('setting') || contextHints.includes('config')) {
      this.detectContextFromActivity(VoiceContextType.SETTINGS, 0.6);
    }
  }

  private detectContextFromActivity(contextType: VoiceContextType, confidence: number): void {
    const contextInfo: ContextInfo = {
      type: contextType,
      confidence,
      metadata: {
        detectionMethod: 'user_activity'
      },
      timestamp: new Date(),
      source: 'user_activity'
    };

    this.setCurrentContext(contextInfo);
  }

  private evaluateRule(rule: ContextDetectionRule, contextData: any): boolean {
    return rule.conditions.every(condition => this.evaluateCondition(condition, contextData));
  }

  private evaluateCondition(condition: ContextCondition, contextData: any): boolean {
    let value: any;

    // Get the value based on condition type
    switch (condition.type) {
      case 'route':
        value = contextData.route || '';
        break;
      case 'active_element':
        value = contextData.activeElement || '';
        break;
      case 'url':
        value = typeof window !== 'undefined' ? window.location.href : '';
        break;
      case 'time':
        value = new Date().getHours();
        break;
      default:
        value = '';
    }

    // Apply operator
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'contains':
        return String(value).includes(String(condition.value));
      case 'starts_with':
        return String(value).startsWith(String(condition.value));
      case 'regex':
        try {
          const regex = new RegExp(String(condition.value));
          return regex.test(String(value));
        } catch {
          return false;
        }
      case 'exists':
        return value != null && value !== '';
      case 'greater_than':
        return Number(value) > Number(condition.value);
      case 'less_than':
        return Number(value) < Number(condition.value);
      default:
        return false;
    }
  }

  private setCurrentContext(contextInfo: ContextInfo): void {
    const previousContext = this.currentContext;

    // Only update if context changed or confidence is higher
    if (!previousContext ||
        previousContext.type !== contextInfo.type ||
        contextInfo.confidence > previousContext.confidence) {

      this.currentContext = contextInfo;

      // Add to history
      this.addToContextHistory(contextInfo);

      // Notify listeners
      this.notifyContextChange(contextInfo);

      console.log(`Context changed to: ${contextInfo.type} (confidence: ${contextInfo.confidence})`);
    }
  }

  private addToContextHistory(contextInfo: ContextInfo): void {
    const historyEntry: ContextHistoryEntry = {
      id: `context_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      context: contextInfo,
      commandsUsed: [],
      successRate: 0,
      sessionDuration: 0
    };

    this.contextHistory.push(historyEntry);

    // Keep only last 100 entries
    if (this.contextHistory.length > 100) {
      this.contextHistory = this.contextHistory.slice(-100);
    }
  }

  private validateCurrentContext(): void {
    if (!this.currentContext) return;

    // Check if context is still valid
    const timeSinceLastUpdate = Date.now() - this.currentContext.timestamp.getTime();
    const maxContextAge = 30000; // 30 seconds

    if (timeSinceLastUpdate > maxContextAge) {
      // Context might be stale, try to re-detect
      this.detectContextFromRoute(window.location.pathname);
    }
  }

  private notifyContextChange(contextInfo: ContextInfo): void {
    this.contextChangeListeners.forEach(listener => {
      try {
        listener(contextInfo);
      } catch (error) {
        console.error('Error in context change listener:', error);
      }
    });
  }

  // Public API
  public getCurrentContext(): ContextInfo | null {
    return this.currentContext ? { ...this.currentContext } : null;
  }

  public getContextHistory(): ContextHistoryEntry[] {
    return [...this.contextHistory];
  }

  public onContextChange(listener: (context: ContextInfo) => void): () => void {
    this.contextChangeListeners.add(listener);
    return () => this.contextChangeListeners.delete(listener);
  }

  public manuallySetContext(contextType: VoiceContextType, confidence = 1.0, metadata?: Record<string, any>): void {
    const contextInfo: ContextInfo = {
      type: contextType,
      confidence,
      metadata: {
        ...metadata,
        manualOverride: true
      },
      timestamp: new Date(),
      source: 'manual'
    };

    this.setCurrentContext(contextInfo);
  }

  public addDetectionRule(rule: ContextDetectionRule): void {
    this.detectionRules.push(rule);
    // Sort by priority
    this.detectionRules.sort((a, b) => b.priority - a.priority);
  }

  public removeDetectionRule(ruleId: string): void {
    this.detectionRules = this.detectionRules.filter(rule => rule.id !== ruleId);
  }

  public getDetectionRules(): ContextDetectionRule[] {
    return [...this.detectionRules];
  }

  public destroy(): void {
    this.stopMonitoring();
    this.contextChangeListeners.clear();
    this.contextHistory = [];
    this.currentContext = null;
  }
}