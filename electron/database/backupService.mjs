import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseBackupService {
  constructor(databaseService) {
    this.databaseService = databaseService;
    this.backupInterval = null;
    this.retentionDays = 7;
    this.maxBackups = 10;
    this.backupDir = null;
  }

  /**
   * Initialize backup service
   * @param {Object} options - Backup configuration options
   */
  async initialize(options = {}) {
    this.retentionDays = options.retentionDays || 7;
    this.maxBackups = options.maxBackups || 10;
    this.backupDir = options.backupDir || path.join(__dirname, 'backups');

    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    console.log(`✅ Backup service initialized with backup dir: ${this.backupDir}`);
  }

  /**
   * Start automatic backup scheduling
   * @param {number} intervalMinutes - Interval in minutes (default: 60)
   */
  startAutoBackup(intervalMinutes = 60) {
    if (this.backupInterval) {
      this.stopAutoBackup();
    }

    this.backupInterval = setInterval(async () => {
      try {
        await this.createScheduledBackup();
      } catch (error) {
        console.error('❌ Scheduled backup failed:', error);
      }
    }, intervalMinutes * 60 * 1000);

    console.log(`✅ Auto backup started (every ${intervalMinutes} minutes)`);
  }

  /**
   * Stop automatic backup scheduling
   */
  stopAutoBackup() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
      console.log('✅ Auto backup stopped');
    }
  }

  /**
   * Create a scheduled backup
   * @returns {string} Backup file path
   */
  async createScheduledBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `scheduled_backup_${timestamp}.db`;
    const backupPath = path.join(this.backupDir, backupName);

    try {
      const result = await this.databaseService.createBackup(backupPath);
      console.log(`✅ Scheduled backup created: ${backupName}`);

      // Clean up old backups
      await this.cleanupOldBackups();

      return result;
    } catch (error) {
      console.error('❌ Scheduled backup failed:', error);
      throw error;
    }
  }

  /**
   * Create a manual backup
   * @param {string} name - Optional backup name
   * @returns {string} Backup file path
   */
  async createManualBackup(name = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = name ? `${name}_${timestamp}.db` : `manual_backup_${timestamp}.db`;
    const backupPath = path.join(this.backupDir, backupName);

    try {
      const result = await this.databaseService.createBackup(backupPath);
      console.log(`✅ Manual backup created: ${backupName}`);
      return result;
    } catch (error) {
      console.error('❌ Manual backup failed:', error);
      throw error;
    }
  }

  /**
   * List available backups
   * @returns {Array} List of backup files with metadata
   */
  listBackups() {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.endsWith('.db') && file.includes('backup'))
        .map(file => {
          const filePath = path.join(this.backupDir, file);
          const stats = fs.statSync(filePath);

          return {
            name: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          };
        })
        .sort((a, b) => b.created.getTime() - a.created.getTime());

      return files;
    } catch (error) {
      console.error('❌ Failed to list backups:', error);
      return [];
    }
  }

  /**
   * Clean up old backups based on retention policy
   * @returns {number} Number of backups cleaned up
   */
  async cleanupOldBackups() {
    try {
      const backups = this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

      let cleaned = 0;

      // Remove old backups
      for (const backup of backups) {
        if (backup.created < cutoffDate) {
          fs.unlinkSync(backup.path);
          cleaned++;
        }
      }

      // If we still have too many backups, remove oldest ones
      if (backups.length - cleaned > this.maxBackups) {
        const remainingBackups = this.listBackups();
        const toRemove = remainingBackups.length - this.maxBackups;

        for (let i = 0; i < toRemove; i++) {
          fs.unlinkSync(remainingBackups[remainingBackups.length - 1 - i].path);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.log(`🧹 Cleaned up ${cleaned} old backup files`);
      }

      return cleaned;
    } catch (error) {
      console.error('❌ Failed to cleanup old backups:', error);
      throw error;
    }
  }

  /**
   * Restore from a specific backup
   * @param {string} backupName - Name of backup file
   * @param {boolean} createRestorePoint - Whether to create a backup before restoring
   * @returns {string} Path to restore point backup (if created)
   */
  async restoreFromBackup(backupName, createRestorePoint = true) {
    const backupPath = path.join(this.backupDir, backupName);

    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup not found: ${backupName}`);
    }

    let restorePoint = null;

    try {
      // Create a restore point before restoring
      if (createRestorePoint) {
        restorePoint = await this.createManualBackup('restore_point_before_restore');
        console.log(`📍 Created restore point: ${path.basename(restorePoint)}`);
      }

      // Restore from backup
      await this.databaseService.restoreFromBackup(backupPath);
      console.log(`✅ Database restored from backup: ${backupName}`);

      return restorePoint;
    } catch (error) {
      console.error('❌ Restore failed:', error);

      // If we created a restore point and the restore failed, we can restore back
      if (restorePoint) {
        console.log('🔄 Attempting to restore from restore point...');
        try {
          await this.databaseService.restoreFromBackup(restorePoint);
          console.log('✅ Restored from restore point after failed restore');
        } catch (restoreError) {
          console.error('❌ Failed to restore from restore point:', restoreError);
        }
      }

      throw error;
    }
  }

  /**
   * Get backup statistics
   * @returns {Object} Backup statistics
   */
  getBackupStatistics() {
    const backups = this.listBackups();
    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayBackups = backups.filter(backup => {
      const backupDate = new Date(backup.created.getFullYear(), backup.created.getMonth(), backup.created.getDate());
      return backupDate.getTime() === today.getTime();
    });

    return {
      totalBackups: backups.length,
      totalSize: totalSize,
      todayBackups: todayBackups.length,
      oldestBackup: backups.length > 0 ? backups[backups.length - 1].created : null,
      newestBackup: backups.length > 0 ? backups[0].created : null,
      backupDir: this.backupDir
    };
  }

  /**
   * Verify backup integrity
   * @param {string} backupName - Name of backup file to verify
   * @returns {boolean} Whether backup is valid
   */
  async verifyBackup(backupName) {
    const backupPath = path.join(this.backupDir, backupName);

    if (!fs.existsSync(backupPath)) {
      return false;
    }

    try {
      // Try to open the backup database
      const Database = (await import('better-sqlite3')).default;
      const backupDb = new Database(backupPath, { readonly: true });

      // Check if required tables exist
      const requiredTables = ['projects', 'tasks', 'task_tags', 'task_tag_relations'];
      let tablesExist = true;

      for (const table of requiredTables) {
        try {
          const stmt = backupDb.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`);
          const result = stmt.get(table);
          if (!result) {
            tablesExist = false;
            break;
          }
        } catch (error) {
          tablesExist = false;
          break;
        }
      }

      backupDb.close();
      return tablesExist;

    } catch (error) {
      console.error(`❌ Backup verification failed for ${backupName}:`, error);
      return false;
    }
  }

  /**
   * Create emergency backup
   * @returns {string} Path to emergency backup
   */
  async createEmergencyBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `EMERGENCY_BACKUP_${timestamp}.db`;
    const backupPath = path.join(this.backupDir, backupName);

    try {
      const result = await this.databaseService.createBackup(backupPath);
      console.log(`🚨 Emergency backup created: ${backupName}`);
      return result;
    } catch (error) {
      console.error('❌ Emergency backup failed:', error);
      // Try to save to a different location
      const altPath = path.join(__dirname, backupName);
      try {
        const altResult = await this.databaseService.createBackup(altPath);
        console.log(`🚨 Emergency backup saved to alternative location: ${altPath}`);
        return altResult;
      } catch (altError) {
        console.error('❌ Emergency backup failed at alternative location:', altError);
        throw error;
      }
    }
  }

  /**
   * Export database to different format
   * @param {string} format - Export format (json, csv)
   * @param {string} outputPath - Output file path
   */
  async exportDatabase(format = 'json', outputPath = null) {
    if (!outputPath) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      outputPath = path.join(this.backupDir, `database_export_${timestamp}.${format}`);
    }

    try {
      const projects = await this.databaseService.getProjects();
      const tasks = await this.databaseService.getTasks();
      const tags = await this.databaseService.getTags();

      if (format === 'json') {
        const exportData = {
          exportDate: new Date().toISOString(),
          version: '1.0',
          data: {
            projects,
            tasks,
            tags
          }
        };

        fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
        console.log(`✅ Database exported to JSON: ${outputPath}`);
      } else {
        throw new Error(`Unsupported export format: ${format}`);
      }

      return outputPath;
    } catch (error) {
      console.error('❌ Database export failed:', error);
      throw error;
    }
  }

  /**
   * Get backup service status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      isRunning: this.backupInterval !== null,
      backupInterval: this.backupInterval ? 'active' : 'inactive',
      retentionDays: this.retentionDays,
      maxBackups: this.maxBackups,
      backupDir: this.backupDir,
      statistics: this.getBackupStatistics()
    };
  }
}

export default DatabaseBackupService;