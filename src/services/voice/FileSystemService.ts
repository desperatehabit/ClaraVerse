import { VoiceCommandResult, SystemCapabilities } from '../../types/voice-commands';

export interface FileSystemConfig {
  allowedPaths: string[];
  maxFileSize: number;
  supportedExtensions: string[];
  dangerousOperations: string[];
  requireConfirmation: string[];
}

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
  isFile: boolean;
  extension: string;
  created: Date;
  modified: Date;
  permissions: string;
}

export class FileSystemService {
  private config: FileSystemConfig;
  private capabilities: SystemCapabilities['filesystem'];

  constructor(config: FileSystemConfig) {
    this.config = config;
    this.capabilities = {
      supported: true,
      canReadFiles: true,
      canWriteFiles: true,
      canCreateFolders: true
    };
  }

  /**
   * Open a file with default application
   */
  async openFile(filePath: string): Promise<VoiceCommandResult> {
    try {
      // Validate path
      if (!this.isPathAllowed(filePath)) {
        return {
          success: false,
          message: `Access to path '${filePath}' is not allowed`,
          requiresConfirmation: true,
          confirmationType: 'warning'
        };
      }

      // Check if file exists
      const fileExists = await this.fileExists(filePath);
      if (!fileExists) {
        return {
          success: false,
          message: `File '${filePath}' does not exist`
        };
      }

      // Get file info
      const fileInfo = await this.getFileInfo(filePath);
      if (!fileInfo) {
        return {
          success: false,
          message: `Cannot access file '${filePath}'`
        };
      }

      // Open the file
      const { shell } = require('electron');
      await shell.openPath(filePath);

      return {
        success: true,
        message: `Opened ${fileInfo.name}`,
        data: { fileInfo }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to open file: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Create a new file
   */
  async createFile(filePath: string, content: string = ''): Promise<VoiceCommandResult> {
    try {
      // Validate path
      if (!this.isPathAllowed(filePath)) {
        return {
          success: false,
          message: `Access to path '${filePath}' is not allowed`,
          requiresConfirmation: true,
          confirmationType: 'warning'
        };
      }

      const fs = require('fs').promises;

      // Create directory if it doesn't exist
      const dir = require('path').dirname(filePath);
      await fs.mkdir(dir, { recursive: true });

      // Write file
      await fs.writeFile(filePath, content, 'utf8');

      const fileInfo = await this.getFileInfo(filePath);

      return {
        success: true,
        message: `Created file '${require('path').basename(filePath)}'`,
        data: { fileInfo }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create file: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Save content to a file
   */
  async saveFile(filePath: string, content: string): Promise<VoiceCommandResult> {
    try {
      // Validate path
      if (!this.isPathAllowed(filePath)) {
        return {
          success: false,
          message: `Access to path '${filePath}' is not allowed`,
          requiresConfirmation: true,
          confirmationType: 'warning'
        };
      }

      const fs = require('fs').promises;

      // Ensure directory exists
      const dir = require('path').dirname(filePath);
      await fs.mkdir(dir, { recursive: true });

      // Write file
      await fs.writeFile(filePath, content, 'utf8');

      const fileInfo = await this.getFileInfo(filePath);

      return {
        success: true,
        message: `Saved file '${require('path').basename(filePath)}'`,
        data: { fileInfo }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to save file: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Read file content
   */
  async readFile(filePath: string): Promise<VoiceCommandResult> {
    try {
      // Validate path
      if (!this.isPathAllowed(filePath)) {
        return {
          success: false,
          message: `Access to path '${filePath}' is not allowed`,
          requiresConfirmation: true,
          confirmationType: 'warning'
        };
      }

      const fs = require('fs').promises;

      // Check file size
      const stats = await fs.stat(filePath);
      if (stats.size > this.config.maxFileSize) {
        return {
          success: false,
          message: `File is too large to read (${Math.round(stats.size / 1024)}KB > ${Math.round(this.config.maxFileSize / 1024)}KB)`
        };
      }

      const content = await fs.readFile(filePath, 'utf8');

      return {
        success: true,
        message: `Read file '${require('path').basename(filePath)}'`,
        data: { content, fileInfo: await this.getFileInfo(filePath) }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Create a folder
   */
  async createFolder(folderPath: string): Promise<VoiceCommandResult> {
    try {
      // Validate path
      if (!this.isPathAllowed(folderPath)) {
        return {
          success: false,
          message: `Access to path '${folderPath}' is not allowed`,
          requiresConfirmation: true,
          confirmationType: 'warning'
        };
      }

      const fs = require('fs').promises;
      await fs.mkdir(folderPath, { recursive: true });

      const folderInfo = await this.getFileInfo(folderPath);

      return {
        success: true,
        message: `Created folder '${require('path').basename(folderPath)}'`,
        data: { folderInfo }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create folder: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(dirPath: string): Promise<VoiceCommandResult> {
    try {
      // Validate path
      if (!this.isPathAllowed(dirPath)) {
        return {
          success: false,
          message: `Access to path '${dirPath}' is not allowed`,
          requiresConfirmation: true,
          confirmationType: 'warning'
        };
      }

      const fs = require('fs').promises;
      const path = require('path');

      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const fileInfos: FileInfo[] = [];

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const info = await this.getFileInfo(fullPath);
        if (info) {
          fileInfos.push(info);
        }
      }

      return {
        success: true,
        message: `Listed ${fileInfos.length} items in '${path.basename(dirPath)}'`,
        data: { files: fileInfos, path: dirPath }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to list files: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Search for files
   */
  async searchFiles(searchPath: string, query: string): Promise<VoiceCommandResult> {
    try {
      // Validate path
      if (!this.isPathAllowed(searchPath)) {
        return {
          success: false,
          message: `Access to path '${searchPath}' is not allowed`,
          requiresConfirmation: true,
          confirmationType: 'warning'
        };
      }

      const results = await this.recursiveSearch(searchPath, query);

      return {
        success: true,
        message: `Found ${results.length} files matching '${query}'`,
        data: { files: results, query, searchPath }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to search files: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Delete a file or folder
   */
  async deletePath(targetPath: string): Promise<VoiceCommandResult> {
    try {
      // Validate path
      if (!this.isPathAllowed(targetPath)) {
        return {
          success: false,
          message: `Access to path '${targetPath}' is not allowed`,
          requiresConfirmation: true,
          confirmationType: 'danger'
        };
      }

      // Check if it's a dangerous operation
      const operation = this.getOperationType(targetPath);
      if (this.config.dangerousOperations.includes(operation)) {
        return {
          success: false,
          message: `Operation '${operation}' requires confirmation`,
          requiresConfirmation: true,
          confirmationType: 'danger'
        };
      }

      const fs = require('fs').promises;
      const path = require('path');

      const stats = await fs.stat(targetPath);
      const isDirectory = stats.isDirectory();

      if (isDirectory) {
        await fs.rmdir(targetPath, { recursive: true });
      } else {
        await fs.unlink(targetPath);
      }

      return {
        success: true,
        message: `Deleted ${isDirectory ? 'folder' : 'file'} '${path.basename(targetPath)}'`,
        data: { path: targetPath, type: isDirectory ? 'directory' : 'file' }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to delete: ${error instanceof Error ? error.message : String(error)}`,
        requiresConfirmation: true,
        confirmationType: 'danger'
      };
    }
  }

  /**
   * Copy file or folder
   */
  async copyPath(sourcePath: string, destPath: string): Promise<VoiceCommandResult> {
    try {
      // Validate paths
      if (!this.isPathAllowed(sourcePath) || !this.isPathAllowed(destPath)) {
        return {
          success: false,
          message: 'Access to source or destination path is not allowed',
          requiresConfirmation: true,
          confirmationType: 'warning'
        };
      }

      const fs = require('fs').promises;
      const path = require('path');

      // Ensure destination directory exists
      const destDir = path.dirname(destPath);
      await fs.mkdir(destDir, { recursive: true });

      const stats = await fs.stat(sourcePath);
      const isDirectory = stats.isDirectory();

      if (isDirectory) {
        await fs.cp(sourcePath, destPath, { recursive: true });
      } else {
        await fs.copyFile(sourcePath, destPath);
      }

      return {
        success: true,
        message: `Copied ${isDirectory ? 'folder' : 'file'} to '${path.basename(destPath)}'`,
        data: { source: sourcePath, destination: destPath, type: isDirectory ? 'directory' : 'file' }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to copy: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Get file system capabilities
   */
  getCapabilities(): SystemCapabilities['filesystem'] {
    return { ...this.capabilities };
  }

  /**
   * Check if path is allowed
   */
  private isPathAllowed(filePath: string): boolean {
    const normalizedPath = require('path').normalize(filePath);

    return this.config.allowedPaths.some(allowedPath => {
      const relativePath = require('path').relative(allowedPath, normalizedPath);
      return relativePath && !relativePath.startsWith('..') && !require('path').isAbsolute(relativePath);
    });
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      const fs = require('fs').promises;
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file information
   */
  private async getFileInfo(filePath: string): Promise<FileInfo | null> {
    try {
      const fs = require('fs').promises;
      const path = require('path');

      const stats = await fs.stat(filePath);

      return {
        name: path.basename(filePath),
        path: filePath,
        size: stats.size,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        extension: path.extname(filePath),
        created: stats.birthtime,
        modified: stats.mtime,
        permissions: this.formatPermissions(stats.mode)
      };
    } catch {
      return null;
    }
  }

  /**
   * Format file permissions
   */
  private formatPermissions(mode: number): string {
    const permissions = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];
    const octal = (mode & 0o777).toString(8);
    return octal.split('').map(digit => permissions[parseInt(digit)]).join('');
  }

  /**
   * Recursive file search
   */
  private async recursiveSearch(dirPath: string, query: string): Promise<FileInfo[]> {
    const results: FileInfo[] = [];

    try {
      const fs = require('fs').promises;
      const path = require('path');

      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        // Check if file/directory name matches query
        if (entry.name.toLowerCase().includes(query.toLowerCase())) {
          const info = await this.getFileInfo(fullPath);
          if (info) {
            results.push(info);
          }
        }

        // Recurse into subdirectories
        if (entry.isDirectory()) {
          const subResults = await this.recursiveSearch(fullPath, query);
          results.push(...subResults);
        }
      }
    } catch (error) {
      // Skip directories we can't access
    }

    return results;
  }

  /**
   * Get operation type for security check
   */
  private getOperationType(filePath: string): string {
    const path = require('path');
    const basename = path.basename(filePath).toLowerCase();

    if (basename === 'system' || basename === 'windows' || basename === 'usr') {
      return 'system_directory';
    }

    if (basename.startsWith('.') || basename.includes('config')) {
      return 'hidden_or_config';
    }

    return 'normal';
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    // File system service doesn't hold resources that need cleanup
  }
}