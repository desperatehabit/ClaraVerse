import {
  VoiceCommand,
  ParsedCommand,
  VoiceCommandResult,
  VoiceCommandContext,
  SafetyRule,
  VoiceCommandSettings
} from '../../types/voice-commands';

export interface PermissionRequest {
  id: string;
  command: string;
  action: string;
  parameters: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  timestamp: Date;
  approved?: boolean;
  approvedBy?: string;
  expiresAt?: Date;
}

export interface SafetyAuditLog {
  id: string;
  timestamp: Date;
  command: string;
  action: string;
  riskLevel: string;
  result: 'allowed' | 'blocked' | 'requires_confirmation';
  reason: string;
  userId?: string;
  sessionId?: string;
}

export class SafetyService {
  private safetyRules: SafetyRule[] = [];
  private pendingPermissions: Map<string, PermissionRequest> = new Map();
  private auditLog: SafetyAuditLog[] = [];
  private settings: VoiceCommandSettings;

  constructor(settings: VoiceCommandSettings) {
    this.settings = settings;
    this.initializeDefaultSafetyRules();
  }

  /**
   * Check if a command is safe to execute
   */
  async checkCommandSafety(
    parsedCommand: ParsedCommand,
    context: VoiceCommandContext
  ): Promise<VoiceCommandResult> {
    const command = parsedCommand.command;


    // Check if command category is enabled
    if (!this.settings.enabledCategories.includes(command.category)) {
      return {
        success: false,
        message: `Command category '${command.category}' is disabled`,
        requiresConfirmation: false
      };
    }

    // Check safety rules
    const safetyResult = await this.evaluateSafetyRules(parsedCommand, context);

    if (!safetyResult.allowed) {
      // Log blocked command
      this.logSafetyCheck(parsedCommand, 'blocked', safetyResult.reason);

      return {
        success: false,
        message: safetyResult.reason,
        requiresConfirmation: safetyResult.requiresConfirmation,
        confirmationType: safetyResult.severity === 'critical' ? 'danger' : 'warning'
      };
    }

    // Check if command requires confirmation
    if (command.requiresConfirmation || safetyResult.requiresConfirmation) {
      const permissionRequest = this.createPermissionRequest(parsedCommand, safetyResult.riskLevel);

      return {
        success: false,
        message: safetyResult.reason,
        requiresConfirmation: true,
        confirmationType: safetyResult.severity === 'critical' ? 'danger' : 'warning',
        data: { permissionRequest }
      };
    }

    // Command is safe to execute
    this.logSafetyCheck(parsedCommand, 'allowed', 'Command passed safety checks');
    return {
      success: true,
      message: 'Command is safe to execute'
    };
  }

  /**
   * Approve a pending permission request
   */
  async approvePermission(requestId: string, approvedBy: string = 'user'): Promise<boolean> {
    const request = this.pendingPermissions.get(requestId);

    if (!request) {
      return false;
    }

    request.approved = true;
    request.approvedBy = approvedBy;
    request.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    this.pendingPermissions.delete(requestId);

    // Log approval
    this.logAudit({
      id: `audit_${Date.now()}`,
      timestamp: new Date(),
      command: request.command,
      action: request.action,
      riskLevel: request.riskLevel,
      result: 'allowed',
      reason: `Approved by ${approvedBy}`,
      sessionId: 'current_session'
    });

    return true;
  }

  /**
   * Deny a pending permission request
   */
  async denyPermission(requestId: string, reason: string = 'User denied'): Promise<boolean> {
    const request = this.pendingPermissions.get(requestId);

    if (!request) {
      return false;
    }

    // Log denial
    this.logAudit({
      id: `audit_${Date.now()}`,
      timestamp: new Date(),
      command: request.command,
      action: request.action,
      riskLevel: request.riskLevel,
      result: 'blocked',
      reason: reason,
      sessionId: 'current_session'
    });

    this.pendingPermissions.delete(requestId);
    return true;
  }

  /**
   * Get pending permission requests
   */
  getPendingPermissions(): PermissionRequest[] {
    return Array.from(this.pendingPermissions.values());
  }

  /**
   * Get safety audit log
   */
  getAuditLog(limit: number = 100): SafetyAuditLog[] {
    return this.auditLog.slice(-limit);
  }

  /**
   * Update safety settings
   */
  updateSafetySettings(settings: Partial<VoiceCommandSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  /**
   * Add custom safety rule
   */
  addSafetyRule(rule: SafetyRule): void {
    this.safetyRules.push(rule);
  }

  /**
   * Remove safety rule
   */
  removeSafetyRule(ruleId: string): void {
    this.safetyRules = this.safetyRules.filter(rule => rule.id !== ruleId);
  }

  /**
   * Evaluate safety rules for a command
   */
  private async evaluateSafetyRules(
    parsedCommand: ParsedCommand,
    context: VoiceCommandContext
  ): Promise<{
    allowed: boolean;
    reason: string;
    requiresConfirmation: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  }> {
    const command = parsedCommand.command;
    const commandText = parsedCommand.rawText.toLowerCase();

    // Check each safety rule
    for (const rule of this.safetyRules) {
      if (this.matchesRule(commandText, rule)) {
        switch (rule.action) {
          case 'block':
            return {
              allowed: false,
              reason: rule.description,
              requiresConfirmation: false,
              severity: rule.severity,
              riskLevel: rule.severity
            };

          case 'require_confirmation':
            return {
              allowed: false,
              reason: rule.description,
              requiresConfirmation: true,
              severity: rule.severity,
              riskLevel: rule.severity
            };

          case 'warn':
            // For warnings, we still allow but with a warning message
            break;
        }
      }
    }

    // Check for sensitive commands
    if (command.sensitive) {
      if (this.settings.confirmSensitiveCommands) {
        return {
          allowed: false,
          reason: 'This is a sensitive command that requires confirmation',
          requiresConfirmation: true,
          severity: 'high',
          riskLevel: 'high'
        };
      }
    }

    // Check system command safety level
    if (command.category === 'system' && this.settings.safetyLevel === 'strict') {
      return {
        allowed: false,
        reason: 'System commands require confirmation in strict safety mode',
        requiresConfirmation: true,
        severity: 'medium',
        riskLevel: 'medium'
      };
    }

    // Check for dangerous parameter values
    const dangerousParams = this.checkDangerousParameters(parsedCommand.parameters);
    if (dangerousParams.length > 0) {
      return {
        allowed: false,
        reason: `Dangerous parameter values detected: ${dangerousParams.join(', ')}`,
        requiresConfirmation: true,
        severity: 'high',
        riskLevel: 'high'
      };
    }

    return {
      allowed: true,
      reason: 'Command passed all safety checks',
      requiresConfirmation: false,
      severity: 'low',
      riskLevel: 'low'
    };
  }

  /**
   * Check if command text matches a safety rule
   */
  private matchesRule(commandText: string, rule: SafetyRule): boolean {
    return rule.patterns.some(pattern => {
      const regex = new RegExp(pattern, 'i');
      return regex.test(commandText);
    });
  }

  /**
   * Check for dangerous parameter values
   */
  private checkDangerousParameters(parameters: Record<string, any>): string[] {
    const dangerous: string[] = [];

    for (const [key, value] of Object.entries(parameters)) {
      if (typeof value === 'string') {
        const lowerValue = value.toLowerCase();

        // Check for dangerous paths
        if (lowerValue.includes('system32') || lowerValue.includes('/etc/') || lowerValue.includes('c:\\windows')) {
          dangerous.push(`${key}: ${value}`);
        }

        // Check for dangerous commands
        if (lowerValue.includes('rm -rf') || lowerValue.includes('del /f') || lowerValue.includes('format')) {
          dangerous.push(`${key}: ${value}`);
        }

        // Check for suspicious URLs
        if (lowerValue.includes('file://') || lowerValue.includes('data:')) {
          dangerous.push(`${key}: ${value}`);
        }
      }
    }

    return dangerous;
  }

  /**
   * Create permission request
   */
  private createPermissionRequest(
    parsedCommand: ParsedCommand,
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
  ): PermissionRequest {
    const request: PermissionRequest = {
      id: `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      command: parsedCommand.rawText,
      action: parsedCommand.command.name,
      parameters: parsedCommand.parameters,
      riskLevel,
      reason: `This ${riskLevel} risk command requires your approval`,
      timestamp: new Date()
    };

    this.pendingPermissions.set(request.id, request);
    return request;
  }

  /**
   * Log safety check
   */
  private logSafetyCheck(
    parsedCommand: ParsedCommand,
    result: 'allowed' | 'blocked' | 'requires_confirmation',
    reason: string
  ): void {
    this.logAudit({
      id: `audit_${Date.now()}`,
      timestamp: new Date(),
      command: parsedCommand.rawText,
      action: parsedCommand.command.name,
      riskLevel: 'low',
      result,
      reason,
      sessionId: 'current_session'
    });
  }

  /**
   * Log audit entry
   */
  private logAudit(entry: SafetyAuditLog): void {
    this.auditLog.push(entry);

    // Keep only recent entries
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-500);
    }
  }

  /**
   * Initialize default safety rules
   */
  private initializeDefaultSafetyRules(): void {
    this.safetyRules = [
      {
        id: 'block_system_delete',
        name: 'Block System File Deletion',
        description: 'Prevent deletion of critical system files',
        patterns: [
          'delete.*system32',
          'delete.*/etc/',
          'rm.*-rf.*/',
          'del.*/f.*windows'
        ],
        action: 'block',
        severity: 'critical'
      },
      {
        id: 'block_format_drives',
        name: 'Block Drive Formatting',
        description: 'Prevent formatting of drives',
        patterns: [
          'format.*drive',
          'format.*disk',
          'mkfs'
        ],
        action: 'block',
        severity: 'critical'
      },
      {
        id: 'warn_file_overwrite',
        name: 'Warn on File Overwrite',
        description: 'Warn when overwriting important files',
        patterns: [
          'save.*document',
          'write.*file',
          'create.*document'
        ],
        action: 'warn',
        severity: 'medium'
      },
      {
        id: 'block_shutdown',
        name: 'Block System Shutdown',
        description: 'Prevent system shutdown commands',
        patterns: [
          'shutdown.*computer',
          'restart.*system',
          'power.*off'
        ],
        action: 'require_confirmation',
        severity: 'high'
      },
      {
        id: 'warn_external_access',
        name: 'Warn on External Access',
        description: 'Warn when accessing external resources',
        patterns: [
          'download.*file',
          'upload.*file',
          'send.*data'
        ],
        action: 'warn',
        severity: 'medium'
      }
    ];
  }

  /**
   * Cleanup expired permissions
   */
  cleanupExpiredPermissions(): void {
    const now = new Date();

    for (const [id, request] of this.pendingPermissions.entries()) {
      if (request.expiresAt && request.expiresAt < now) {
        this.pendingPermissions.delete(id);
      }
    }
  }

  /**
   * Get safety statistics
   */
  getSafetyStatistics(): {
    totalChecks: number;
    blockedCommands: number;
    allowedCommands: number;
    pendingApprovals: number;
    riskDistribution: Record<string, number>;
  } {
    const stats = {
      totalChecks: this.auditLog.length,
      blockedCommands: this.auditLog.filter(log => log.result === 'blocked').length,
      allowedCommands: this.auditLog.filter(log => log.result === 'allowed').length,
      pendingApprovals: this.pendingPermissions.size,
      riskDistribution: {} as Record<string, number>
    };

    // Calculate risk distribution
    this.auditLog.forEach(log => {
      stats.riskDistribution[log.riskLevel] = (stats.riskDistribution[log.riskLevel] || 0) + 1;
    });

    return stats;
  }
}