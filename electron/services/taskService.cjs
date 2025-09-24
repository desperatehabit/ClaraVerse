const fs = require('fs');
const crypto = require('crypto');

// Global flag to track if better-sqlite3 is available
let sqliteAvailable = null;
let sqliteLoadError = null;

class TaskService {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
    this.instance = null;
    this.usingFallback = false;
  }

  static getInstance(dbPath) {
    if (!TaskService.instance) {
      if (!dbPath) {
        throw new Error('Database path must be provided for first TaskService instantiation');
      }
      TaskService.instance = new TaskService(dbPath);
    }
    return TaskService.instance;
  }

  initializeDatabase() {
    if (this.db) {
      return; // Already initialized
    }

    try {
      // Try to load better-sqlite3 if we haven't checked yet
      if (sqliteAvailable === null) {
        this.checkSqliteAvailability();
      }

      if (!sqliteAvailable) {
        console.warn('⚠️ better-sqlite3 not available, using fallback mode');
        this.initializeFallbackDatabase();
        return;
      }

      // Create database connection using better-sqlite3
      const Database = require('better-sqlite3');
      this.db = new Database(this.dbPath);

      // Enable foreign keys for data integrity
      this.db.pragma('foreign_keys = ON');

      // Enable WAL mode for better concurrency
      this.db.pragma('journal_mode = WAL');

      // Create tables if they don't exist
      this.createTablesIfNotExist();

      console.log(`✅ TaskService database initialized at: ${this.dbPath}`);
    } catch (error) {
      console.error('❌ Failed to initialize TaskService database with better-sqlite3:', error.message);

      // If better-sqlite3 fails, try fallback
      console.warn('⚠️ Attempting fallback database initialization...');
      this.initializeFallbackDatabase();
    }
  }

  checkSqliteAvailability() {
    try {
      const Database = require('better-sqlite3');
      // Try to create a test database to verify the module works
      const testDb = new Database(':memory:');
      testDb.close();
      sqliteAvailable = true;
      console.log('✅ better-sqlite3 is available and working');
    } catch (error) {
      sqliteAvailable = false;
      sqliteLoadError = error;
      console.error('❌ better-sqlite3 is not available:', error.message);
      console.error('💡 This is typically due to native module version mismatch. Consider running: npm rebuild better-sqlite3');
    }
  }

  initializeFallbackDatabase() {
    try {
      console.warn('⚠️ Initializing fallback database mode (limited functionality)');

      // Create directory if it doesn't exist
      const dbDir = require('path').dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // For fallback, we'll create a simple JSON-based database
      // This is a temporary solution until better-sqlite3 can be properly loaded
      if (!fs.existsSync(this.dbPath)) {
        fs.writeFileSync(this.dbPath, JSON.stringify({
          projects: [],
          tasks: [],
          metadata: {
            created: new Date().toISOString(),
            fallback: true
          }
        }, null, 2));
      }

      this.usingFallback = true;
      this.db = null; // Will be handled by fallback methods

      console.log(`✅ Fallback database initialized at: ${this.dbPath}`);
      console.warn('⚠️ Note: Database operations will be limited in fallback mode');
    } catch (error) {
      console.error('❌ Failed to initialize fallback database:', error);
      throw new Error(`Fallback database initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  createTablesIfNotExist() {
    try {
      // Create projects table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          color TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create tasks table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          priority TEXT DEFAULT 'medium',
          status TEXT DEFAULT 'todo',
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );
      `);

      // Create indexes for better performance
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
        CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
        CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at);
      `);

      console.log('✅ Database tables created/verified successfully');
    } catch (error) {
      console.error('❌ Failed to create database tables:', error);
      throw error;
    }
  }

  getDatabase() {
    if (!this.db) {
      throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return this.db;
  }

  // Fallback database operations using JSON file storage
  loadFallbackData() {
    try {
      if (!fs.existsSync(this.dbPath)) {
        return { projects: [], tasks: [], metadata: { fallback: true } };
      }

      // Check if file is already a JSON file or needs to be created as JSON
      const content = fs.readFileSync(this.dbPath, 'utf8');

      // If the file contains SQLite format data (not JSON), create a new JSON file
      if (content.includes('SQLite format') || !content.trim().startsWith('{')) {
        console.warn('⚠️ Existing database file detected, creating new JSON fallback file');
        const newPath = this.dbPath.replace(/\.db$/, '_fallback.json');
        const fallbackData = { projects: [], tasks: [], metadata: { fallback: true, originalDb: this.dbPath } };
        fs.writeFileSync(newPath, JSON.stringify(fallbackData, null, 2));
        this.dbPath = newPath; // Update to use the JSON file
        return fallbackData;
      }

      const data = JSON.parse(content);
      return data;
    } catch (error) {
      console.error('❌ Failed to load fallback data:', error);
      return { projects: [], tasks: [], metadata: { fallback: true } };
    }
  }

  saveFallbackData(data) {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Failed to save fallback data:', error);
      throw error;
    }
  }

  getProjects() {
    console.log('[taskService.cjs] getProjects: Attempting to retrieve projects.');
    try {
      this.initializeDatabase();

      if (this.usingFallback) {
        const data = this.loadFallbackData();
        console.log(`[taskService.cjs] getProjects: Retrieved ${data.projects.length} projects from fallback database.`);
        return { success: true, data: data.projects };
      } else {
        const db = this.getDatabase();
        const stmt = db.prepare('SELECT * FROM projects ORDER BY updated_at DESC');
        const projects = stmt.all();
        console.log(`[taskService.cjs] getProjects: Retrieved ${projects.length} projects from database.`);
        return { success: true, data: projects };
      }
    } catch (error) {
      console.error('❌ [taskService.cjs] getProjects: Failed to retrieve projects:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  createProject(project) {
    try {
      this.initializeDatabase();

      if (this.usingFallback) {
        // Fallback mode: work with JSON data
        const data = this.loadFallbackData();

        // Use provided ID if valid, otherwise generate one
        const projectId = (project.id && typeof project.id === 'string' && project.id.trim())
          ? project.id
          : crypto.randomUUID();
        const now = new Date().toISOString();

        const newProject = {
          id: projectId,
          name: project.name,
          description: project.description || null,
          color: project.color || null,
          created_at: now,
          updated_at: now
        };

        data.projects.push(newProject);
        this.saveFallbackData(data);

        console.log(`📝 Project created successfully in fallback mode: ${projectId}`);
        return newProject;
      } else {
        // better-sqlite3 mode
        const db = this.getDatabase();

        // Use provided ID if valid, otherwise generate one
        const projectId = (project.id && typeof project.id === 'string' && project.id.trim())
          ? project.id
          : crypto.randomUUID();
        const now = new Date().toISOString();

        const stmt = db.prepare(`
          INSERT INTO projects (id, name, description, color, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(projectId, project.name, project.description || null, project.color || null, now, now);

        if (result.changes === 0) {
          throw new Error('Failed to create project - no rows affected');
        }

        return this.getProject(projectId);
      }
    } catch (error) {
      console.error('❌ Failed to create project:', error);
      throw new Error(`Failed to create project: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getProject(id) {
    try {
      this.initializeDatabase();
      const db = this.getDatabase();

      const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
      return stmt.get(id);
    } catch (error) {
      console.error('❌ Failed to retrieve project:', error);
      throw new Error(`Failed to fetch project: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  updateProject(id, updates) {
    try {
      this.initializeDatabase();

      if (this.usingFallback) {
        // Fallback mode: work with JSON data
        const data = this.loadFallbackData();
        const projectIndex = data.projects.findIndex(p => p.id === id);

        if (projectIndex === -1) {
          throw new Error('Project not found');
        }

        const fields = Object.keys(updates);
        if (fields.length === 0) {
          return data.projects[projectIndex];
        }

        // Update the project with new values
        const updatedProject = {
          ...data.projects[projectIndex],
          ...updates,
          updated_at: new Date().toISOString()
        };

        data.projects[projectIndex] = updatedProject;
        this.saveFallbackData(data);

        console.log(`📝 Project updated successfully in fallback mode: ${id}`);
        return updatedProject;
      } else {
        // better-sqlite3 mode
        const db = this.getDatabase();

        const fields = Object.keys(updates);
        const values = Object.values(updates);

        if (fields.length === 0) {
          const existing = this.getProject(id);
          if (!existing) {
            throw new Error('Project not found');
          }
          return existing;
        }

        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const query = `UPDATE projects SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

        const stmt = db.prepare(query);
        const result = stmt.run(...values, id);

        if (result.changes === 0) {
          throw new Error('Project not found or no changes made');
        }

        return this.getProject(id);
      }
    } catch (error) {
      console.error('❌ Failed to update project:', error);
      throw new Error(`Failed to update project: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  deleteProject(id) {
    try {
      this.initializeDatabase();

      if (this.usingFallback) {
        // Fallback mode: work with JSON data
        const data = this.loadFallbackData();
        const projectIndex = data.projects.findIndex(p => p.id === id);

        if (projectIndex === -1) {
          throw new Error('Project not found');
        }

        // Remove the project from the array
        const deletedProject = data.projects.splice(projectIndex, 1)[0];
        this.saveFallbackData(data);

        console.log(`🗑️ Project deleted successfully in fallback mode: ${id}`);
        return deletedProject;
      } else {
        // better-sqlite3 mode
        const db = this.getDatabase();

        const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
        const result = stmt.run(id);

        if (result.changes === 0) {
          throw new Error('Project not found');
        }

        console.log(`🗑️ Project deleted successfully: ${id}`);
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to delete project:', error);
      throw new Error(`Failed to delete project: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('✅ TaskService database connection closed');
    }
  }

  getStatistics() {
    try {
      this.initializeDatabase();

      if (this.usingFallback) {
        // Fallback mode: read from JSON file
        const data = this.loadFallbackData();
        return {
          projects: data.projects.length,
          tasks: data.tasks.length,
          databasePath: this.dbPath,
          databaseSize: fs.statSync(this.dbPath)?.size || 0,
          fallback: true
        };
      } else {
        // better-sqlite3 mode
        const db = this.getDatabase();
        const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get();
        const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get();

        return {
          projects: projectCount.count,
          tasks: taskCount.count,
          databasePath: this.dbPath,
          databaseSize: fs.statSync(this.dbPath)?.size || 0,
          fallback: false
        };
      }
    } catch (error) {
      console.error('❌ Failed to get database statistics:', error);
      throw new Error(`Failed to get statistics: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Task-related methods
  getTasks(projectId = null) {
    console.log(`[taskService.cjs] getTasks: Attempting to retrieve tasks for projectId: ${projectId}`);
    try {
      this.initializeDatabase();

      if (this.usingFallback) {
        const data = this.loadFallbackData();
        let tasks = data.tasks || [];
        if (projectId) {
          tasks = tasks.filter(task => task.project_id === projectId);
        }
        console.log(`[taskService.cjs] getTasks: Retrieved ${tasks.length} tasks from fallback database.`);
        return { success: true, data: tasks };
      } else {
        const db = this.getDatabase();
        let query = 'SELECT * FROM tasks';
        const params = [];

        if (projectId) {
          query += ' WHERE project_id = ?';
          params.push(projectId);
        }

        query += ' ORDER BY updated_at DESC';

        const stmt = db.prepare(query);
        const tasks = stmt.all(...params);
        console.log(`[taskService.cjs] getTasks: Retrieved ${tasks.length} tasks from database.`);
        return { success: true, data: tasks };
      }
    } catch (error) {
      console.error('❌ [taskService.cjs] getTasks: Failed to retrieve tasks:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  createTask(task) {
    try {
      this.initializeDatabase();
      const db = this.getDatabase();

      // Use provided ID if valid, otherwise generate one
      const taskId = (task.id && typeof task.id === 'string' && task.id.trim())
        ? task.id
        : crypto.randomUUID();
      const now = new Date().toISOString();

      const stmt = db.prepare(`
        INSERT INTO tasks (id, project_id, title, description, priority, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        taskId,
        task.project_id,
        task.title,
        task.description || null,
        task.priority || 'medium',
        task.status || 'todo',
        now,
        now
      );

      if (result.changes === 0) {
        throw new Error('Failed to create task - no rows affected');
      }

      return this.getTask(taskId);
    } catch (error) {
      console.error('❌ Failed to create task:', error);
      throw new Error(`Failed to create task: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getTask(id) {
    try {
      this.initializeDatabase();
      const db = this.getDatabase();

      const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
      return stmt.get(id);
    } catch (error) {
      console.error('❌ Failed to retrieve task:', error);
      throw new Error(`Failed to fetch task: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  updateTask(id, updates) {
    try {
      this.initializeDatabase();
      const db = this.getDatabase();

      const fields = Object.keys(updates);
      const values = Object.values(updates);

      if (fields.length === 0) {
        const existing = this.getTask(id);
        if (!existing) {
          throw new Error('Task not found');
        }
        return existing;
      }

      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const query = `UPDATE tasks SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

      const stmt = db.prepare(query);
      const result = stmt.run(...values, id);

      if (result.changes === 0) {
        throw new Error('Task not found or no changes made');
      }

      return this.getTask(id);
    } catch (error) {
      console.error('❌ Failed to update task:', error);
      throw new Error(`Failed to update task: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  deleteTask(id) {
    try {
      this.initializeDatabase();
      const db = this.getDatabase();

      const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
      const result = stmt.run(id);

      if (result.changes === 0) {
        throw new Error('Task not found');
      }

      console.log(`🗑️ Task deleted successfully: ${id}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete task:', error);
      throw new Error(`Failed to delete task: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

module.exports = { TaskService };