import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'clara_tasks.db');

async function createDatabase() {
  console.log('🗃️ Creating personal task database...');

  try {
    // Remove existing database if it exists
    if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
      console.log('🗑️ Removed existing database');
    }

    // Create new database
    const db = new Database(DB_PATH);

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');

    console.log('📋 Creating tables...');

    // Create projects table
    db.exec(`
      CREATE TABLE projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#6366f1',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create task_tags table
    db.exec(`
      CREATE TABLE task_tags (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL
      );
    `);

    // Create tasks table
    db.exec(`
      CREATE TABLE tasks (
        id TEXT PRIMARY KEY,
        project_id TEXT REFERENCES projects(id),
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'todo',
        due_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        parent_task_id TEXT REFERENCES tasks(id)
      );
    `);

    // Create task_tag_relations table
    db.exec(`
      CREATE TABLE task_tag_relations (
        task_id TEXT REFERENCES tasks(id),
        tag_id TEXT REFERENCES task_tags(id),
        PRIMARY KEY (task_id, tag_id)
      );
    `);

    // Create indexes for better performance
    db.exec(`
      CREATE INDEX tasks_project_id_idx ON tasks(project_id);
      CREATE INDEX tasks_status_idx ON tasks(status);
      CREATE INDEX tasks_priority_idx ON tasks(priority);
      CREATE INDEX tasks_due_date_idx ON tasks(due_date);
      CREATE INDEX tasks_parent_task_id_idx ON tasks(parent_task_id);
    `);

    // FTS5 virtual tables for full-text search
    db.exec(`
      CREATE VIRTUAL TABLE tasks_fts USING fts5(
        title,
        description,
        content='tasks',
        content_rowid='rowid'
      );

      CREATE VIRTUAL TABLE projects_fts USING fts5(
        name,
        description,
        content='projects',
        content_rowid='rowid'
      );
    `);

    // Triggers to keep FTS tables in sync with main tables
    db.exec(`
      CREATE TRIGGER tasks_fts_insert AFTER INSERT ON tasks BEGIN
        INSERT INTO tasks_fts(rowid, title, description) VALUES (new.rowid, new.title, new.description);
      END;

      CREATE TRIGGER tasks_fts_delete AFTER DELETE ON tasks BEGIN
        INSERT INTO tasks_fts(tasks_fts, rowid, title, description) VALUES('delete', old.rowid, old.title, old.description);
      END;

      CREATE TRIGGER tasks_fts_update AFTER UPDATE ON tasks BEGIN
        INSERT INTO tasks_fts(tasks_fts, rowid, title, description) VALUES('delete', old.rowid, old.title, old.description);
        INSERT INTO tasks_fts(rowid, title, description) VALUES (new.rowid, new.title, new.description);
      END;
    `);

    db.exec(`
      CREATE TRIGGER projects_fts_insert AFTER INSERT ON projects BEGIN
        INSERT INTO projects_fts(rowid, name, description) VALUES (new.rowid, new.name, new.description);
      END;

      CREATE TRIGGER projects_fts_delete AFTER DELETE ON projects BEGIN
        INSERT INTO projects_fts(projects_fts, rowid, name, description) VALUES('delete', old.rowid, old.name, old.description);
      END;

      CREATE TRIGGER projects_fts_update AFTER UPDATE ON projects BEGIN
        INSERT INTO projects_fts(projects_fts, rowid, name, description) VALUES('delete', old.rowid, old.name, old.description);
        INSERT INTO projects_fts(rowid, name, description) VALUES (new.rowid, new.name, new.description);
      END;
    `);

    // Insert some sample data
    console.log('📝 Inserting sample data...');

    const projectsStmt = db.prepare(`
      INSERT INTO projects (id, name, description, color)
      VALUES (?, ?, ?, ?)
    `);

    const tasksStmt = db.prepare(`
      INSERT INTO tasks (id, project_id, title, description, priority, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const tagsStmt = db.prepare(`
      INSERT INTO task_tags (id, name)
      VALUES (?, ?)
    `);

    // Sample projects
    projectsStmt.run('sample-project-1', 'Personal Tasks', 'Personal tasks and activities', '#6366f1');
    projectsStmt.run('sample-project-2', 'Work Projects', 'Work-related tasks and projects', '#10b981');

    // Sample tasks
    tasksStmt.run('sample-task-1', 'sample-project-1', 'Complete project documentation', 'Write comprehensive documentation for the project', 'high', 'in_progress');
    tasksStmt.run('sample-task-2', 'sample-project-1', 'Review code changes', 'Review and approve pending code changes', 'medium', 'todo');
    tasksStmt.run('sample-task-3', 'sample-project-2', 'Team meeting preparation', 'Prepare agenda and materials for team meeting', 'medium', 'completed');

    // Sample tags
    tagsStmt.run('tag-urgent', 'urgent');
    tagsStmt.run('tag-meeting', 'meeting');
    tagsStmt.run('tag-documentation', 'documentation');

    // Link tags to tasks
    const tagRelationStmt = db.prepare(`
      INSERT INTO task_tag_relations (task_id, tag_id)
      VALUES (?, ?)
    `);

    tagRelationStmt.run('sample-task-1', 'tag-urgent');
    tagRelationStmt.run('sample-task-1', 'tag-documentation');
    tagRelationStmt.run('sample-task-3', 'tag-meeting');

    db.close();

    console.log('✅ Database created successfully!');
    console.log(`📊 Database location: ${DB_PATH}`);
    console.log(`📊 Database size: ${fs.statSync(DB_PATH).size} bytes`);

    return DB_PATH;

  } catch (error) {
    console.error('❌ Failed to create database:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createDatabase().catch(console.error);
}

export default createDatabase;