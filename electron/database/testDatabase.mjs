import personalTaskDatabase from './databaseService.mjs';
import DatabaseBackupService from './backupService.mjs';

async function testDatabaseOperations() {
  console.log('🧪 Starting database tests...\n');

  try {
    // Initialize database
    console.log('1. Initializing database...');
    await personalTaskDatabase.initialize('dev');
    console.log('✅ Database initialized successfully\n');

    // Test project operations
    console.log('2. Testing project operations...');
    const testProject = {
      id: `test-project-${Date.now()}`,
      name: 'Test Project',
      description: 'A test project for database testing',
      color: '#ff6b6b'
    };

    let createdProject = await personalTaskDatabase.createProject(testProject);
    console.log('✅ Project created:', createdProject);

    const projects = await personalTaskDatabase.getProjects();
    console.log(`✅ Found ${projects.length} projects`);

    const updatedProject = await personalTaskDatabase.updateProject(createdProject.id, {
      name: 'Updated Test Project',
      description: 'Updated description'
    });
    console.log('✅ Project updated:', updatedProject);

    const retrievedProject = await personalTaskDatabase.getProject(createdProject.id);
    console.log('✅ Project retrieved:', retrievedProject);

    // Test task operations
    console.log('\n3. Testing task operations...');
    const testTask = {
      id: `test-task-${Date.now()}`,
      project_id: createdProject.id,
      title: 'Test Task',
      description: 'A test task for database testing',
      priority: 'high',
      status: 'in_progress'
    };

    let createdTask = await personalTaskDatabase.createTask(testTask);
    console.log('✅ Task created:', createdTask);

    const tasks = await personalTaskDatabase.getTasks();
    console.log(`✅ Found ${tasks.length} tasks`);

    const projectTasks = await personalTaskDatabase.getTasks({ project_id: createdProject.id });
    console.log(`✅ Found ${projectTasks.length} tasks for project`);

    const updatedTask = await personalTaskDatabase.updateTask(createdTask.id, {
      title: 'Updated Test Task',
      status: 'completed'
    });
    console.log('✅ Task updated:', updatedTask);

    // Test tag operations
    console.log('\n4. Testing tag operations...');
    const testTag = {
      id: `test-tag-${Date.now()}`,
      name: `test-tag-urgent-${Date.now()}`
    };

    let createdTag = await personalTaskDatabase.createTag(testTag);
    console.log('✅ Tag created:', createdTag);

    const tags = await personalTaskDatabase.getTags();
    console.log(`✅ Found ${tags.length} tags`);

    // Test task-tag relations
    console.log('\n5. Testing task-tag relations...');
    await personalTaskDatabase.addTagToTask(createdTask.id, createdTag.id);
    console.log('✅ Tag added to task');

    const taskTags = await personalTaskDatabase.getTaskTags(createdTask.id);
    console.log(`✅ Task has ${taskTags.length} tags`);

    const tasksWithTag = await personalTaskDatabase.getTasksWithTag(createdTag.id);
    console.log(`✅ Found ${tasksWithTag.length} tasks with tag`);

    // Test search operations
    console.log('\n6. Testing search operations...');
    const searchResults = await personalTaskDatabase.searchTasks('test');
    console.log(`✅ Found ${searchResults.length} search results for 'test'`);

    const projectSearchResults = await personalTaskDatabase.searchProjects('test');
    console.log(`✅ Found ${projectSearchResults.length} project search results for 'test'`);

    // Test statistics
    console.log('\n7. Testing statistics...');
    const stats = await personalTaskDatabase.getStatistics();
    console.log('✅ Database statistics:', stats);

    // Test backup service
    console.log('\n8. Testing backup service...');
    const backupService = new DatabaseBackupService(personalTaskDatabase);
    await backupService.initialize();

    const manualBackup = await backupService.createManualBackup('test-backup');
    console.log('✅ Manual backup created:', manualBackup);

    const backups = backupService.listBackups();
    console.log(`✅ Found ${backups.length} backups`);

    const backupStats = backupService.getBackupStatistics();
    console.log('✅ Backup statistics:', backupStats);

    // Test cleanup
    console.log('\n9. Testing cleanup...');
    const cleaned = await backupService.cleanupOldBackups();
    console.log(`✅ Cleaned up ${cleaned} old backups`);

    // Cleanup test data
    console.log('\n10. Cleaning up test data...');
    await personalTaskDatabase.deleteTask(createdTask.id);
    await personalTaskDatabase.deleteTag(createdTag.id);
    await personalTaskDatabase.deleteProject(createdProject.id);
    console.log('✅ Test data cleaned up');

    // Final statistics
    const finalStats = await personalTaskDatabase.getStatistics();
    console.log('✅ Final database statistics:', finalStats);

    console.log('\n🎉 All database tests passed successfully!');
    return true;

  } catch (error) {
    console.error('\n❌ Database test failed:', error);
    return false;
  } finally {
    // Close database connection
    personalTaskDatabase.close();
  }
}

// Error handling test
async function testErrorHandling() {
  console.log('\n🧪 Testing error handling...');

  try {
    // Test with uninitialized database
    const db = new (await import('better-sqlite3')).default(':memory:');
    db.close();

    // Test invalid operations
    await personalTaskDatabase.getProject('nonexistent-id');
    console.log('❌ Should have thrown error for nonexistent project');

  } catch (error) {
    console.log('✅ Error handling works correctly:', error.message);
  }
}

// Run tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive database tests...\n');

  const success = await testDatabaseOperations();

  if (success) {
    await testErrorHandling();
    console.log('\n✅ All tests completed successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Tests failed!');
    process.exit(1);
  }
}

// Export for use in other modules
export { testDatabaseOperations, testErrorHandling };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}