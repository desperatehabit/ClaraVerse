// Main export file for personal task database functionality
import personalTaskDatabase from './databaseService.mjs';
import DatabaseBackupService from './backupService.mjs';

// Initialize database when module is loaded
async function initializeDatabase(environment = 'dev') {
  try {
    await personalTaskDatabase.initialize(environment);
    console.log('✅ Personal Task Database initialized successfully');
    return personalTaskDatabase;
  } catch (error) {
    console.error('❌ Failed to initialize personal task database:', error);
    throw error;
  }
}

// Create and initialize backup service
function createBackupService(databaseService) {
  const backupService = new DatabaseBackupService(databaseService);
  return backupService;
}

// Export main functionality
export {
  personalTaskDatabase,
  DatabaseBackupService,
  initializeDatabase,
  createBackupService
};

// Export types
export * from './types.ts';

// Default export with full setup
export default {
  database: personalTaskDatabase,
  initialize: initializeDatabase,
  createBackupService,
  DatabaseBackupService
};