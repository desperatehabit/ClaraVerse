'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  // Create projects table
  db.createTable('projects', {
    id: { type: 'string', primaryKey: true },
    name: { type: 'string', notNull: true },
    description: { type: 'text', allowNull: true },
    color: { type: 'string', defaultValue: '#6366f1' },
    created_at: {
      type: 'datetime',
      defaultValue: new String('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: 'datetime',
      defaultValue: new String('CURRENT_TIMESTAMP')
    }
  });

  // Create task_tags table
  db.createTable('task_tags', {
    id: { type: 'string', primaryKey: true },
    name: { type: 'string', notNull: true, unique: true }
  });

  // Create tasks table
  db.createTable('tasks', {
    id: { type: 'string', primaryKey: true },
    project_id: {
      type: 'string',
      foreignKey: {
        name: 'tasks_project_id_fk',
        table: 'projects',
        mapping: 'id',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        }
      }
    },
    title: { type: 'string', notNull: true },
    description: { type: 'text', allowNull: true },
    priority: {
      type: 'string',
      defaultValue: 'medium'
    },
    status: {
      type: 'string',
      defaultValue: 'todo'
    },
    due_date: { type: 'datetime', allowNull: true },
    created_at: {
      type: 'datetime',
      defaultValue: new String('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: 'datetime',
      defaultValue: new String('CURRENT_TIMESTAMP')
    },
    completed_at: { type: 'datetime', allowNull: true },
    parent_task_id: {
      type: 'string',
      foreignKey: {
        name: 'tasks_parent_task_id_fk',
        table: 'tasks',
        mapping: 'id',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        }
      }
    }
  });

  // Create task_tag_relations table
  db.createTable('task_tag_relations', {
    task_id: {
      type: 'string',
      foreignKey: {
        name: 'task_tag_relations_task_id_fk',
        table: 'tasks',
        mapping: 'id',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        }
      }
    },
    tag_id: {
      type: 'string',
      foreignKey: {
        name: 'task_tag_relations_tag_id_fk',
        table: 'task_tags',
        mapping: 'id',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        }
      }
    }
  }, { primaryKey: ['task_id', 'tag_id'] });

  // Create indexes for better performance
  db.addIndex('tasks', 'tasks_project_id_idx', ['project_id']);
  db.addIndex('tasks', 'tasks_status_idx', ['status']);
  db.addIndex('tasks', 'tasks_priority_idx', ['priority']);
  db.addIndex('tasks', 'tasks_due_date_idx', ['due_date']);
  db.addIndex('tasks', 'tasks_parent_task_id_idx', ['parent_task_id']);

  // FTS5 virtual tables for full-text search
  db.runSql(`
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
  db.runSql(`
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

  db.runSql(`
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
};

exports.down = function(db) {
  // Drop FTS triggers first
  db.runSql('DROP TRIGGER IF EXISTS tasks_fts_insert;');
  db.runSql('DROP TRIGGER IF EXISTS tasks_fts_delete;');
  db.runSql('DROP TRIGGER IF EXISTS tasks_fts_update;');
  db.runSql('DROP TRIGGER IF EXISTS projects_fts_insert;');
  db.runSql('DROP TRIGGER IF EXISTS projects_fts_delete;');
  db.runSql('DROP TRIGGER IF EXISTS projects_fts_update;');

  // Drop FTS virtual tables
  db.runSql('DROP TABLE IF EXISTS tasks_fts;');
  db.runSql('DROP TABLE IF EXISTS projects_fts;');

  // Drop main tables (foreign key constraints will be handled automatically)
  db.dropTable('task_tag_relations');
  db.dropTable('tasks');
  db.dropTable('task_tags');
  db.dropTable('projects');
};