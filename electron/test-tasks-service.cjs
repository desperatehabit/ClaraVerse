// Test script to verify the tasks service and IPC handlers are working
const { TaskService } = require('./services/taskService.cjs');
const { ipcMain } = require('electron');
const path = require('path');
const os = require('os');

console.log('🧪 Testing TaskService and IPC handlers...');

// Test 1: TaskService initialization and basic functionality
async function testTaskService() {
  console.log('\n📋 Test 1: TaskService basic functionality');
  try {
    const dbPath = path.join(os.homedir(), '.clara-test', 'test_clara_tasks.db');
    const taskService = TaskService.getInstance(dbPath);

    // Test database initialization
    taskService.initializeDatabase();
    console.log('✅ TaskService initialized successfully (no fallback mode)');

    // Test getTasks (should return empty array initially)
    const tasksResult = taskService.getTasks();
    console.log('✅ getTasks result:', tasksResult);

    // Test getProjects (should return empty array initially)
    const projectsResult = taskService.getProjects();
    console.log('✅ getProjects result:', projectsResult);

    // Test creating a project
    const testProject = {
      name: 'Test Project',
      description: 'A test project for debugging',
      color: '#ff0000'
    };
    const newProject = taskService.createProject(testProject);
    console.log('✅ Created project:', newProject);

    // Test creating a task
    const testTask = {
      project_id: newProject.id,
      title: 'Test Task',
      description: 'A test task for debugging',
      priority: 'high',
      status: 'todo'
    };
    const newTask = taskService.createTask(testTask);
    console.log('✅ Created task:', newTask);

    // Test getTasks with projectId
    const tasksWithProject = taskService.getTasks(newProject.id);
    console.log('✅ getTasks with projectId result:', tasksWithProject);

    // Test getProjects
    const projectsAfter = taskService.getProjects();
    console.log('✅ getProjects after creation result:', projectsAfter);

    console.log('✅ All TaskService tests passed!');
    return true;
  } catch (error) {
    console.error('❌ TaskService test failed:', error);
    return false;
  }
}

// Test 2: IPC Handler registration
function testIPCHandlers() {
  console.log('\n🔌 Test 2: IPC Handler registration');
  try {
    // Mock the app object for testing
    global.app = {
      getPath: (type) => {
        if (type === 'userData') {
          return require('os').homedir() + '/.clara-test';
        }
        return require('os').homedir();
      }
    };

    const { registerPersonalTaskHandlers } = require('./ipc/task-handlers.cjs');
    registerPersonalTaskHandlers();

    // Check if handlers are registered
    const tasksGetTasksHandler = ipcMain.eventNames().includes('tasks:getTasks');
    const tasksGetProjectsHandler = ipcMain.eventNames().includes('tasks:getProjects');

    console.log('✅ tasks:getTasks handler registered:', tasksGetTasksHandler);
    console.log('✅ tasks:getProjects handler registered:', tasksGetProjectsHandler);

    if (tasksGetTasksHandler && tasksGetProjectsHandler) {
      console.log('✅ All IPC handlers registered successfully!');
      return true;
    } else {
      console.error('❌ Some IPC handlers not registered');
      return false;
    }
  } catch (error) {
    console.error('❌ IPC handler test failed:', error);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting TaskService and IPC handler tests...\n');

  const taskServiceResult = await testTaskService();
  const ipcHandlerResult = testIPCHandlers();

  if (taskServiceResult && ipcHandlerResult) {
    console.log('\n🎉 All tests passed! The tasks service should be working correctly.');
  } else {
    console.log('\n❌ Some tests failed. Check the output above for details.');
  }

  // Clean up
  process.exit(taskServiceResult && ipcHandlerResult ? 0 : 1);
}

// Run the tests
runTests();