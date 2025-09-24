import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PersonalTaskDatabase {
  constructor() {
    this.db = null;
    this.dbPath = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the database connection
   * @param {string} environment - Environment (dev, production, test)
   */
  async initialize(environment = 'dev') {
    if (this.isInitialized) {
      return;
    }

    try {
      // Determine database path based on environment
      const configPath = path.join(__dirname, 'database.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

      const dbConfig = config[environment] || config.dev;
      this.dbPath = path.resolve(__dirname, dbConfig.filename);

      // Ensure the directory exists
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Initialize the database
      this.db = new Database(this.dbPath);

      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');

      // Enable WAL mode for better concurrency
      this.db.pragma('journal_mode = WAL');

      this.isInitialized = true;
      console.log(`✅ Personal Task Database initialized at: ${this.dbPath}`);

    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Get database instance
   * @returns {Database} SQLite database instance
   */
  getDatabase() {
    if (!this.isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
      console.log('✅ Personal Task Database closed');
    }
  }

  /**
   * Run database migration
   */
  async runMigration() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const { runMigration } = await import('db-migrate');
      // This would require proper configuration setup
      console.log('🔄 Running database migrations...');
      // Note: This is a placeholder - actual migration running would need proper setup
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  // ===== PROJECT OPERATIONS =====

  /**
   * Create a new project
   * @param {Object} project - Project data
   * @returns {Object} Created project
   */
  createProject(project) {
    const db = this.getDatabase();
    const stmt = db.prepare(`
      INSERT INTO projects (id, name, description, color)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(project.id, project.name, project.description, project.color);
    return this.getProject(project.id);
  }

  /**
   * Get all projects
   * @returns {Array} List of projects
   */
  getProjects() {
    const db = this.getDatabase();
    const stmt = db.prepare('SELECT * FROM projects ORDER BY updated_at DESC');
    return stmt.all();
  }

  /**
   * Get a specific project by ID
   * @param {string} id - Project ID
   * @returns {Object|null} Project or null if not found
   */
  getProject(id) {
    const db = this.getDatabase();
    const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
    return stmt.get(id);
  }

  /**
   * Update a project
   * @param {string} id - Project ID
   * @param {Object} updates - Updates to apply
   * @returns {Object} Updated project
   */
  updateProject(id, updates) {
    const db = this.getDatabase();
    const fields = Object.keys(updates);
    const values = Object.values(updates);

    if (fields.length === 0) {
      return this.getProject(id);
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const query = `UPDATE projects SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

    const stmt = db.prepare(query);
    stmt.run(...values, id);

    return this.getProject(id);
  }

  /**
   * Delete a project
   * @param {string} id - Project ID
   */
  deleteProject(id) {
    const db = this.getDatabase();
    const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
    stmt.run(id);
  }

  // ===== TASK OPERATIONS =====

  /**
   * Create a new task
   * @param {Object} task - Task data
   * @returns {Object} Created task
   */
  createTask(task) {
    const db = this.getDatabase();
    const stmt = db.prepare(`
      INSERT INTO tasks (id, project_id, title, description, priority, status, due_date, parent_task_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      task.id,
      task.project_id,
      task.title,
      task.description,
      task.priority || 'medium',
      task.status || 'todo',
      task.due_date,
      task.parent_task_id
    );

    return this.getTask(task.id);
  }

  /**
   * Get tasks with optional filtering
   * @param {Object} filters - Filter options
   * @returns {Array} List of tasks
   */
  getTasks(filters = {}) {
    const db = this.getDatabase();
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];

    if (filters.project_id) {
      query += ' AND project_id = ?';
      params.push(filters.project_id);
    }

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.priority) {
      query += ' AND priority = ?';
      params.push(filters.priority);
    }

    if (filters.parent_task_id) {
      query += ' AND parent_task_id = ?';
      params.push(filters.parent_task_id);
    }

    query += ' ORDER BY updated_at DESC';

    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  /**
   * Get a specific task by ID
   * @param {string} id - Task ID
   * @returns {Object|null} Task or null if not found
   */
  getTask(id) {
    const db = this.getDatabase();
    const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
    return stmt.get(id);
  }

  /**
   * Update a task
   * @param {string} id - Task ID
   * @param {Object} updates - Updates to apply
   * @returns {Object} Updated task
   */
  updateTask(id, updates) {
    const db = this.getDatabase();
    const fields = Object.keys(updates);
    const values = Object.values(updates);

    if (fields.length === 0) {
      return this.getTask(id);
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const query = `UPDATE tasks SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

    const stmt = db.prepare(query);
    stmt.run(...values, id);

    return this.getTask(id);
  }

  /**
   * Delete a task
   * @param {string} id - Task ID
   */
  deleteTask(id) {
    const db = this.getDatabase();
    const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
    stmt.run(id);
  }

  /**
   * Get task with subtasks
   * @param {string} id - Task ID
   * @returns {Object} Task with subtasks
   */
  getTaskWithSubtasks(id) {
    const task = this.getTask(id);
    if (!task) {
      return null;
    }

    const subtasks = this.getTasks({ parent_task_id: id });
    return { ...task, subtasks };
  }

  // ===== TAG OPERATIONS =====

  /**
   * Create a new tag
   * @param {Object} tag - Tag data
   * @returns {Object} Created tag
   */
  createTag(tag) {
    const db = this.getDatabase();
    const stmt = db.prepare('INSERT INTO task_tags (id, name) VALUES (?, ?)');
    stmt.run(tag.id, tag.name);
    return this.getTag(tag.id);
  }

  /**
   * Get all tags
   * @returns {Array} List of tags
   */
  getTags() {
    const db = this.getDatabase();
    const stmt = db.prepare('SELECT * FROM task_tags ORDER BY name');
    return stmt.all();
  }

  /**
   * Get a specific tag by ID
   * @param {string} id - Tag ID
   * @returns {Object|null} Tag or null if not found
   */
  getTag(id) {
    const db = this.getDatabase();
    const stmt = db.prepare('SELECT * FROM task_tags WHERE id = ?');
    return stmt.get(id);
  }

  /**
   * Update a tag
   * @param {string} id - Tag ID
   * @param {Object} updates - Updates to apply
   * @returns {Object} Updated tag
   */
  updateTag(id, updates) {
    const db = this.getDatabase();
    const stmt = db.prepare('UPDATE task_tags SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(updates.name, id);
    return this.getTag(id);
  }

  /**
   * Delete a tag
   * @param {string} id - Tag ID
   */
  deleteTag(id) {
    const db = this.getDatabase();
    const stmt = db.prepare('DELETE FROM task_tags WHERE id = ?');
    stmt.run(id);
  }

  // ===== TASK-TAG RELATIONS =====

  /**
   * Add tag to task
   * @param {string} taskId - Task ID
   * @param {string} tagId - Tag ID
   */
  addTagToTask(taskId, tagId) {
    const db = this.getDatabase();
    const stmt = db.prepare('INSERT OR IGNORE INTO task_tag_relations (task_id, tag_id) VALUES (?, ?)');
    stmt.run(taskId, tagId);
  }

  /**
   * Remove tag from task
   * @param {string} taskId - Task ID
   * @param {string} tagId - Tag ID
   */
  removeTagFromTask(taskId, tagId) {
    const db = this.getDatabase();
    const stmt = db.prepare('DELETE FROM task_tag_relations WHERE task_id = ? AND tag_id = ?');
    stmt.run(taskId, tagId);
  }

  /**
   * Get tags for a task
   * @param {string} taskId - Task ID
   * @returns {Array} List of tags
   */
  getTaskTags(taskId) {
    const db = this.getDatabase();
    const stmt = db.prepare(`
      SELECT t.* FROM task_tags t
      INNER JOIN task_tag_relations r ON t.id = r.tag_id
      WHERE r.task_id = ?
      ORDER BY t.name
    `);
    return stmt.all(taskId);
  }

  /**
   * Get tasks with tags
   * @param {string} tagId - Tag ID
   * @returns {Array} List of tasks
   */
  getTasksWithTag(tagId) {
    const db = this.getDatabase();
    const stmt = db.prepare(`
      SELECT t.* FROM tasks t
      INNER JOIN task_tag_relations r ON t.id = r.task_id
      WHERE r.tag_id = ?
      ORDER BY t.updated_at DESC
    `);
    return stmt.all(tagId);
  }

  // ===== SEARCH OPERATIONS =====

  /**
   * Search tasks using FTS5
   * @param {string} query - Search query
   * @returns {Array} List of matching tasks
   */
  searchTasks(query) {
    const db = this.getDatabase();
    const stmt = db.prepare(`
      SELECT t.*, snippet(tasks_fts, 0, '<mark>', '</mark>', '...', 50) as title_snippet,
             snippet(tasks_fts, 1, '<mark>', '</mark>', '...', 100) as description_snippet
      FROM tasks_fts fts
      INNER JOIN tasks t ON t.rowid = fts.rowid
      WHERE tasks_fts MATCH ?
      ORDER BY rank
    `);
    return stmt.all(query);
  }

  /**
   * Search projects using FTS5
   * @param {string} query - Search query
   * @returns {Array} List of matching projects
   */
  searchProjects(query) {
    const db = this.getDatabase();
    const stmt = db.prepare(`
      SELECT p.*, snippet(projects_fts, 0, '<mark>', '</mark>', '...', 50) as name_snippet,
             snippet(projects_fts, 1, '<mark>', '</mark>', '...', 100) as description_snippet
      FROM projects_fts fts
      INNER JOIN projects p ON p.rowid = fts.rowid
      WHERE projects_fts MATCH ?
      ORDER BY rank
    `);
    return stmt.all(query);
  }

  // ===== BACKUP & RECOVERY =====

  /**
   * Create a backup of the database
   * @param {string} backupPath - Path for backup file
   * @returns {string} Backup file path
   */
  createBackup(backupPath = null) {
    if (!this.isInitialized) {
      throw new Error('Database not initialized');
    }

    if (!backupPath) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      backupPath = `${this.dbPath}.backup.${timestamp}`;
    }

    this.db.backup(backupPath);
    console.log(`✅ Database backup created: ${backupPath}`);
    return backupPath;
  }

  /**
   * Restore database from backup
   * @param {string} backupPath - Path to backup file
   */
  restoreFromBackup(backupPath) {
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }

    this.close();

    // Copy backup to main database file
    fs.copyFileSync(backupPath, this.dbPath);

    // Reinitialize database
    this.initialize();

    console.log(`✅ Database restored from backup: ${backupPath}`);
  }

  /**
   * Get database statistics
   * @returns {Object} Database statistics
   */
  getStatistics() {
    const db = this.getDatabase();

    const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get();
    const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get();
    const tagCount = db.prepare('SELECT COUNT(*) as count FROM task_tags').get();
    const completedTasks = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status = ?').get('completed');

    return {
      projects: projectCount.count,
      tasks: taskCount.count,
      tags: tagCount.count,
      completedTasks: completedTasks.count,
      databasePath: this.dbPath,
      databaseSize: fs.existsSync(this.dbPath) ? fs.statSync(this.dbPath).size : 0
    };
  }

  /**
   * Cleanup old backups
   * @param {number} keepDays - Number of days to keep backups (default: 7)
   */
  cleanupOldBackups(keepDays = 7) {
    const backupDir = path.dirname(this.dbPath);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);

    const files = fs.readdirSync(backupDir);
    let cleaned = 0;

    files.forEach(file => {
      if (file.startsWith(path.basename(this.dbPath) + '.backup.')) {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          cleaned++;
        }
      }
    });

    console.log(`🧹 Cleaned up ${cleaned} old backup files`);
    return cleaned;
  }
}

// Export singleton instance
const personalTaskDatabase = new PersonalTaskDatabase();
export default personalTaskDatabase;