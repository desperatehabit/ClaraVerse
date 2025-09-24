const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

/**
 * Create the personal tasks schema
 * @param {Database} db - The database instance
 */
function createPersonalTasksSchema(db) {
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create projects table
  db.exec(`
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
  db.exec(`
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
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
    CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at);
  `);

  console.log('✅ Personal tasks schema created successfully');
}

/**
 * Migration function to set up the database schema
 * @param {string} dbPath - Path to the database file
 */
function migrate(dbPath) {
  try {
    // Ensure the database directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Open database
    const db = new Database(dbPath);

    // Create schema
    createPersonalTasksSchema(db);

    // Close database
    db.close();

    console.log(`✅ Database schema migration completed for: ${dbPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Migration failed for ${dbPath}:`, error);
    return false;
  }
}

module.exports = { migrate, createPersonalTasksSchema };