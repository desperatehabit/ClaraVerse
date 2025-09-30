 const Database = require('better-sqlite3');
const crypto = require('crypto');
const { llamaService } = require('../centralServiceManager.cjs');

class TaskService {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
    this.dbInitialized = false;
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
    if (this.dbInitialized) {
      return;
    }

    try {
      console.log(`[taskService.cjs] Initializing database at path: ${this.dbPath}`);
      this.db = new Database(this.dbPath);
      this.db.pragma('foreign_keys = ON');
      this.db.pragma('journal_mode = WAL');
      this.createTablesIfNotExist();
      this.runMigrations();
      this.dbInitialized = true;
      console.log(`✅ TaskService database initialized successfully.`);
    } catch (error) {
      console.error('❌ Failed to initialize TaskService database:', error.message);
      this.dbInitialized = false;
      throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  runMigrations() {
    try {
      const version = this.db.pragma('user_version', { simple: true });
      if (version < 1) {
        // this.db.exec('ALTER TABLE tasks ADD COLUMN due_date TEXT');
        this.db.pragma('user_version = 1');
        console.log('✅ Database migration to version 1 completed successfully');
      }
    } catch (error) {
      console.error('❌ Failed to run database migrations:', error);
      throw error;
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
          project_id TEXT,
          title TEXT NOT NULL,
          description TEXT,
          priority TEXT DEFAULT 'medium',
          status TEXT DEFAULT 'todo',
          due_date TEXT,
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

  getProjects() {
    console.log('[taskService.cjs] getProjects: Attempting to retrieve projects.');
    try {
      this.initializeDatabase();

      const db = this.getDatabase();
      const stmt = db.prepare('SELECT * FROM projects ORDER BY updated_at DESC');
      const projects = stmt.all();
      console.log(`[taskService.cjs] getProjects: Retrieved ${projects.length} projects from database.`);
      return { success: true, data: projects };
    } catch (error) {
      console.error('❌ [taskService.cjs] getProjects: Failed to retrieve projects:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  createProject(project) {
    try {
      this.initializeDatabase();
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
    } catch (error) {
      console.error('❌ Failed to update project:', error);
      throw new Error(`Failed to update project: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  deleteProject(id) {
    try {
      this.initializeDatabase();
      const db = this.getDatabase();

      const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
      const result = stmt.run(id);

      if (result.changes === 0) {
        throw new Error('Project not found');
      }

      console.log(`🗑️ Project deleted successfully: ${id}`);
      return true;
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
      const db = this.getDatabase();
      const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get();
      const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get();

      return {
        projects: projectCount.count,
        tasks: taskCount.count,
        databasePath: this.dbPath,
        databaseSize: require('fs').statSync(this.dbPath)?.size || 0
      };
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
      const db = this.getDatabase();
      let query = 'SELECT * FROM tasks';
      const params = [];

      if (projectId) {
        query += ' WHERE project_id = ?';
        params.push(projectId);
      } else {
        query += ' WHERE project_id IS NULL';
      }

      query += ' ORDER BY updated_at DESC';

      const stmt = db.prepare(query);
      const tasks = stmt.all(...params);
      console.log(`[taskService.cjs] getTasks: Retrieved ${tasks.length} tasks from database.`);
      return { success: true, data: tasks };
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
        INSERT INTO tasks (id, project_id, title, description, priority, status, due_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        taskId,
        task.project_id,
        task.title,
        task.description || null,
        task.priority || 'medium',
        task.status || 'todo',
        task.due_date || null,
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

  async processNaturalLanguageTask(input) {
    console.log(`[taskService.cjs] processNaturalLanguageTask: Processing input: "${input}"`);
    if (!llamaService) {
      console.error('❌ LlamaService is not available.');
      throw new Error('The AI service is not available. Please check the application setup.');
    }

    const prompt = `
      You are an intelligent task parser. Analyze the following user input and extract the task details.
      Return a JSON object with the following fields: "title", "description", "due_date", and "priority".
      The "due_date" should be in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ).
      The "priority" can be "low", "medium", or "high".
      If a value is not present in the input, set it to null.
      Current date for reference: ${new Date().toISOString()}

      User input: "${input}"

      JSON output:
    `;

    try {
      const aiResponse = await llamaService.generate(prompt);
      console.log('[taskService.cjs] processNaturalLanguageTask: Received AI response.');

      // Extract the JSON part of the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('❌ [taskService.cjs] processNaturalLanguageTask: No valid JSON object found in AI response.');
        throw new Error('Failed to parse task from AI response: Invalid format.');
      }

      const parsedJson = JSON.parse(jsonMatch);
      console.log('[taskService.cjs] processNaturalLanguageTask: Parsed JSON from AI response:', parsedJson);

      // Basic validation
      if (!parsedJson.title) {
        throw new Error('Failed to parse task: "title" is a required field.');
      }

      const taskData = {
        title: parsedJson.title,
        description: parsedJson.description || null,
        due_date: parsedJson.due_date || null,
        priority: parsedJson.priority || 'medium',
      };

      console.log('[taskService.cjs] processNaturalLanguageTask: Successfully processed NLP task.', taskData);
      return taskData;
    } catch (error) {
      console.error('❌ [taskService.cjs] processNaturalLanguageTask: Error processing NLP task:', error);
      if (error.message.includes('title')) {
        throw error;
      }
      throw new Error(`Failed to process task with AI: ${error.message}`);
    }
  }
}

module.exports = { TaskService };