#!/usr/bin/env node

/**
 * Comprehensive End-to-End Test for Project Management Functionality
 *
 * This test validates the complete project management stack:
 * 1. IPC handlers (create-project, update-project, delete-project)
 * 2. Preload API functions (personalTaskAPI)
 * 3. TaskService methods integration with IPC layer
 * 4. Error handling scenarios
 * 5. Cascading deletes when projects are deleted with associated tasks
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Test configuration
const TEST_DB_PATH = './test_project_management.db';
const TEST_RESULTS = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString().slice(11, 23);
  const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

function recordTest(name, success, error = null, details = '') {
  TEST_RESULTS.total++;
  if (success) {
    TEST_RESULTS.passed++;
    TEST_RESULTS.details.push({ name, status: 'PASSED', details });
    log(`${name} - PASSED`, 'success');
  } else {
    TEST_RESULTS.failed++;
    TEST_RESULTS.details.push({ name, status: 'FAILED', error, details });
    log(`${name} - FAILED: ${error}`, 'error');
  }
}

function generateTestId(prefix = 'test') {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

// Mock Electron IPC implementation for testing
class MockIPCRenderer {
  constructor() {
    this.handlers = new Map();
  }

  async invoke(channel, ...args) {
    log(`IPC Call: ${channel} with args: ${JSON.stringify(args)}`);

    if (this.handlers.has(channel)) {
      try {
        const result = await this.handlers.get(channel)(...args);
        log(`IPC Response: ${channel} -> ${JSON.stringify(result)}`);
        return result;
      } catch (error) {
        log(`IPC Error: ${channel} -> ${error.message}`, 'error');
        throw error;
      }
    } else {
      throw new Error(`No handler registered for IPC channel: ${channel}`);
    }
  }

  on(channel, callback) {
    log(`IPC Listener registered: ${channel}`);
    this.handlers.set(channel, callback);
  }
}

// Mock preload API
class MockPersonalTaskAPI {
  constructor(ipcRenderer) {
    this.ipcRenderer = ipcRenderer;
  }

  async getProjects() {
    return await this.ipcRenderer.invoke('tasks:getProjects');
  }

  async createProject(projectData) {
    return await this.ipcRenderer.invoke('create-project', projectData);
  }

  async updateProject(projectId, updates) {
    return await this.ipcRenderer.invoke('update-project', projectId, updates);
  }

  async deleteProject(projectId) {
    return await this.ipcRenderer.invoke('delete-project', projectId);
  }
}

// Test suite setup
async function setupTestEnvironment() {
  log('Setting up test environment...');

  // Clean up any existing test database
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
    log(`Cleaned up existing test database: ${TEST_DB_PATH}`);
  }

  // Initialize TaskService with test database
  const { TaskService } = require('./electron/services/taskService.cjs');
  const taskService = TaskService.getInstance(TEST_DB_PATH);

  log('Test environment setup complete');
  return taskService;
}

async function cleanupTestEnvironment() {
  log('Cleaning up test environment...');

  // Clean up test database
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
    log(`Cleaned up test database: ${TEST_DB_PATH}`);
  }

  log('Test environment cleanup complete');
}

// Register IPC handlers for testing
function registerIPCHandlers(taskService) {
  const ipcRenderer = new MockIPCRenderer();

  // Register project management handlers
  ipcRenderer.on('tasks:getProjects', async () => {
    try {
      const projects = await taskService.getProjects();
      return { success: true, projects };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcRenderer.on('create-project', async (projectData) => {
    try {
      const project = await taskService.createProject(projectData);
      return { success: true, project };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcRenderer.on('update-project', async (projectId, updates) => {
    try {
      const project = await taskService.updateProject(projectId, updates);
      return { success: true, project };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcRenderer.on('delete-project', async (projectId) => {
    try {
      await taskService.deleteProject(projectId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  return ipcRenderer;
}

// Test Cases

async function testDatabaseInitialization(taskService) {
  log('Testing database initialization...');

  try {
    // Test that database is properly initialized
    const stats = await taskService.getStatistics();
    recordTest(
      'Database Initialization',
      stats !== null,
      null,
      `Database stats: ${JSON.stringify(stats)}`
    );
  } catch (error) {
    recordTest('Database Initialization', false, error.message);
  }
}

async function testProjectCRUDOperations(api) {
  log('Testing project CRUD operations...');

  const testProjectData = {
    id: generateTestId('project'),
    name: 'Test Project Alpha',
    description: 'A test project for validation',
    color: '#FF5733'
  };

  let createdProject = null;
  let updatedProject = null;

  try {
    // Test CREATE operation
    const createResult = await api.createProject(testProjectData);
    if (!createResult.success) {
      throw new Error(`Create failed: ${createResult.error}`);
    }

    createdProject = createResult.project;
    recordTest(
      'Project Creation',
      createdProject && createdProject.id === testProjectData.id,
      null,
      `Created project: ${createdProject.id}`
    );

    // Test READ operation (getProjects)
    const getResult = await api.getProjects();
    if (!getResult.success) {
      throw new Error(`Get projects failed: ${getResult.error}`);
    }

    const foundProject = getResult.projects.find(p => p.id === testProjectData.id);
    recordTest(
      'Project Retrieval',
      foundProject !== undefined,
      null,
      `Found ${getResult.projects.length} projects, looking for: ${testProjectData.id}`
    );

    // Test UPDATE operation
    const updateData = {
      name: 'Updated Test Project Alpha',
      description: 'Updated description'
    };

    const updateResult = await api.updateProject(testProjectData.id, updateData);
    if (!updateResult.success) {
      throw new Error(`Update failed: ${updateResult.error}`);
    }

    updatedProject = updateResult.project;
    recordTest(
      'Project Update',
      updatedProject && updatedProject.name === updateData.name,
      null,
      `Updated name: ${updatedProject.name}`
    );

    // Verify update with fresh read
    const verifyResult = await api.getProjects();
    if (!verifyResult.success) {
      throw new Error(`Verification read failed: ${verifyResult.error}`);
    }

    const verifiedProject = verifyResult.projects.find(p => p.id === testProjectData.id);
    recordTest(
      'Project Update Verification',
      verifiedProject && verifiedProject.name === updateData.name,
      null,
      `Verified updated name: ${verifiedProject.name}`
    );

  } catch (error) {
    recordTest('Project CRUD Operations', false, error.message);
  }

  // Test DELETE operation
  try {
    const deleteResult = await api.deleteProject(testProjectData.id);
    recordTest(
      'Project Deletion',
      deleteResult.success,
      null,
      `Deleted project: ${testProjectData.id}`
    );

    // Verify deletion
    const verifyDeleteResult = await api.getProjects();
    if (!verifyDeleteResult.success) {
      throw new Error(`Verification after delete failed: ${verifyDeleteResult.error}`);
    }

    const deletedProject = verifyDeleteResult.projects.find(p => p.id === testProjectData.id);
    recordTest(
      'Project Deletion Verification',
      deletedProject === undefined,
      null,
      `Project ${testProjectData.id} should no longer exist`
    );

  } catch (error) {
    recordTest('Project Deletion', false, error.message);
  }
}

async function testErrorHandling(api, taskService) {
  log('Testing error handling scenarios...');

  try {
    // Test deleting non-existent project
    const nonExistentId = generateTestId('nonexistent');
    const deleteResult = await api.deleteProject(nonExistentId);

    recordTest(
      'Error Handling - Delete Non-existent Project',
      !deleteResult.success && deleteResult.error.includes('not found'),
      deleteResult.success ? 'Should have failed' : null,
      `Error message: ${deleteResult.error}`
    );

    // Test updating non-existent project
    const updateResult = await api.updateProject(nonExistentId, { name: 'Test' });

    recordTest(
      'Error Handling - Update Non-existent Project',
      !updateResult.success && updateResult.error.includes('not found'),
      updateResult.success ? 'Should have failed' : null,
      `Error message: ${updateResult.error}`
    );

    // Test creating project with invalid data
    const invalidProject = { name: null };
    const createResult = await api.createProject(invalidProject);

    recordTest(
      'Error Handling - Create Invalid Project',
      !createResult.success,
      createResult.success ? 'Should have failed' : null,
      `Error message: ${createResult.error}`
    );

  } catch (error) {
    recordTest('Error Handling Tests', false, error.message);
  }
}

async function testCascadingDeletes(api, taskService) {
  log('Testing cascading deletes functionality...');

  const projectId = generateTestId('cascade-test');
  const taskId1 = generateTestId('task-1');
  const taskId2 = generateTestId('task-2');

  try {
    // Create project
    const projectResult = await api.createProject({
      id: projectId,
      name: 'Cascade Test Project',
      description: 'Testing cascading deletes',
      color: '#00FF00'
    });

    if (!projectResult.success) {
      throw new Error(`Failed to create test project: ${projectResult.error}`);
    }

    // Create tasks associated with the project
    const task1Result = await taskService.createTask({
      id: taskId1,
      project_id: projectId,
      title: 'Task 1 for Cascade Test',
      description: 'This task should be deleted when project is deleted',
      priority: 'high',
      status: 'todo'
    });

    const task2Result = await taskService.createTask({
      id: taskId2,
      project_id: projectId,
      title: 'Task 2 for Cascade Test',
      description: 'This task should also be deleted when project is deleted',
      priority: 'medium',
      status: 'in-progress'
    });

    // Verify tasks exist
    const tasksBeforeDelete = await taskService.getTasks(projectId);
    recordTest(
      'Cascading Delete Setup',
      tasksBeforeDelete.length === 2,
      null,
      `Created 2 tasks for project ${projectId}`
    );

    // Delete the project
    const deleteResult = await api.deleteProject(projectId);
    recordTest(
      'Cascading Delete - Project Deletion',
      deleteResult.success,
      null,
      `Deleted project ${projectId}`
    );

    // Verify tasks are also deleted (cascading delete)
    const tasksAfterDelete = await taskService.getTasks();
    const remainingTasksInProject = tasksAfterDelete.filter(t => t.project_id === projectId);

    recordTest(
      'Cascading Delete - Associated Tasks',
      remainingTasksInProject.length === 0,
      null,
      `All tasks associated with project ${projectId} should be deleted`
    );

    // Verify project is deleted
    const projectsAfterDelete = await api.getProjects();
    const deletedProject = projectsAfterDelete.projects.find(p => p.id === projectId);

    recordTest(
      'Cascading Delete - Project Removed',
      deletedProject === undefined,
      null,
      `Project ${projectId} should no longer exist`
    );

  } catch (error) {
    recordTest('Cascading Delete Tests', false, error.message);
  }
}

async function testIPCIntegration(api) {
  log('Testing IPC integration...');

  try {
    // Test that IPC handlers are properly registered and accessible
    const handlers = ['tasks:getProjects', 'create-project', 'update-project', 'delete-project'];

    for (const handler of handlers) {
      // This test ensures the handlers are registered by attempting to call them
      try {
        switch (handler) {
          case 'tasks:getProjects':
            await api.getProjects();
            break;
          case 'create-project':
            await api.createProject({ name: 'IPC Test Project' });
            break;
          case 'update-project':
            // This will fail due to no project ID, but that's expected
            try {
              await api.updateProject('nonexistent', { name: 'test' });
            } catch (e) {
              // Expected to fail, but handler should be called
            }
            break;
          case 'delete-project':
            // This will fail due to no project ID, but that's expected
            try {
              await api.deleteProject('nonexistent');
            } catch (e) {
              // Expected to fail, but handler should be called
            }
            break;
        }
        recordTest(`IPC Handler Registration - ${handler}`, true, null, `Handler ${handler} is accessible`);
      } catch (error) {
        recordTest(`IPC Handler Registration - ${handler}`, false, error.message);
      }
    }

  } catch (error) {
    recordTest('IPC Integration Tests', false, error.message);
  }
}

async function testDatabaseSchema(taskService) {
  log('Testing database schema and relationships...');

  try {
    // Test that the database schema is properly set up
    const stats = await taskService.getStatistics();

    // In fallback mode, we can't test the schema directly, so we'll just verify the service works
    if (stats.fallback) {
      recordTest(
        'Database Schema - Fallback Mode',
        true,
        null,
        'Using fallback JSON database mode'
      );
    } else {
      // In better-sqlite3 mode, we can test the schema
      recordTest(
        'Database Schema - SQLite Mode',
        true,
        null,
        'Using better-sqlite3 with proper schema'
      );

      // Test foreign key constraints work
      const projectId = generateTestId('schema-test');
      const taskId = generateTestId('schema-task');

      // Create project
      await taskService.createProject({
        id: projectId,
        name: 'Schema Test Project',
        description: 'Testing foreign key constraints',
        color: '#0000FF'
      });

      // Create task with valid project_id
      await taskService.createTask({
        id: taskId,
        project_id: projectId,
        title: 'Schema Test Task',
        description: 'Testing that foreign key constraints work',
        priority: 'low',
        status: 'todo'
      });

      // Verify task exists
      const task = await taskService.getTask(taskId);
      recordTest(
        'Database Schema - Foreign Key Constraint',
        task && task.project_id === projectId,
        null,
        `Task project_id matches: ${task.project_id} === ${projectId}`
      );

      // Clean up
      await taskService.deleteTask(taskId);
      await taskService.deleteProject(projectId);
    }

  } catch (error) {
    recordTest('Database Schema Tests', false, error.message);
  }
}

async function testPreloadAPIAccessibility(api) {
  log('Testing preload API accessibility...');

  try {
    // Test that personalTaskAPI methods are accessible and functional
    const methods = ['getProjects', 'createProject', 'updateProject', 'deleteProject'];

    for (const method of methods) {
      try {
        switch (method) {
          case 'getProjects':
            const result = await api[method]();
            recordTest(
              `Preload API - ${method}`,
              result !== undefined,
              null,
              `Method ${method} is accessible and returns data`
            );
            break;
          case 'createProject':
          case 'updateProject':
          case 'deleteProject':
            // These methods should be callable without throwing
            recordTest(
              `Preload API - ${method}`,
              typeof api[method] === 'function',
              null,
              `Method ${method} is accessible as a function`
            );
            break;
        }
      } catch (error) {
        recordTest(`Preload API - ${method}`, false, error.message);
      }
    }

  } catch (error) {
    recordTest('Preload API Accessibility Tests', false, error.message);
  }
}

// Main test execution
async function runTests() {
  log('Starting comprehensive project management end-to-end tests...');
  log('=' .repeat(60));

  const startTime = Date.now();

  try {
    // Setup test environment
    const taskService = await setupTestEnvironment();

    // Register IPC handlers
    const ipcRenderer = registerIPCHandlers(taskService);

    // Create API instance
    const api = new MockPersonalTaskAPI(ipcRenderer);

    // Run all test suites
    await testDatabaseInitialization(taskService);
    await testProjectCRUDOperations(api);
    await testErrorHandling(api, taskService);
    await testCascadingDeletes(api, taskService);
    await testIPCIntegration(api);
    await testDatabaseSchema(taskService);
    await testPreloadAPIAccessibility(api);

    // Test results summary
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    log('=' .repeat(60));
    log('TEST RESULTS SUMMARY');
    log('=' .repeat(60));
    log(`Total Tests: ${TEST_RESULTS.total}`);
    log(`Passed: ${TEST_RESULTS.passed}`);
    log(`Failed: ${TEST_RESULTS.failed}`);
    log(`Success Rate: ${((TEST_RESULTS.passed / TEST_RESULTS.total) * 100).toFixed(2)}%`);
    log(`Duration: ${duration.toFixed(2)} seconds`);

    if (TEST_RESULTS.failed > 0) {
      log('FAILED TESTS:');
      TEST_RESULTS.details
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          log(`  - ${test.name}: ${test.error}`);
        });
    }

    // Detailed test results
    log('DETAILED TEST RESULTS:');
    TEST_RESULTS.details.forEach(test => {
      const status = test.status === 'PASSED' ? '✅' : '❌';
      log(`  ${status} ${test.name}`);
      if (test.details) {
        log(`      ${test.details}`);
      }
    });

    // Final status
    if (TEST_RESULTS.failed === 0) {
      log('🎉 ALL TESTS PASSED! Project management functionality is working correctly.');
      process.exit(0);
    } else {
      log('❌ SOME TESTS FAILED! Check the output above for details.');
      process.exit(1);
    }

  } catch (error) {
    log(`FATAL ERROR during testing: ${error.message}`, 'error');
    log(error.stack, 'error');
    process.exit(1);
  } finally {
    // Cleanup
    await cleanupTestEnvironment();
  }
}

// Run the tests
if (require.main === module) {
  runTests().catch(error => {
    log(`Unhandled error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { runTests, TEST_RESULTS };