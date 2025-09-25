const { TaskService } = require('./electron/services/taskService.cjs');
const path = require('path');
const os = require('os');

const dbPath = path.join(os.homedir(), '.config', 'clara-verse', 'clara_tasks.db');
const taskService = TaskService.getInstance(dbPath);

function populateTestData() {
  try {
    taskService.initializeDatabase();
    console.log('Database initialized for test data population.');

    const projects = taskService.getProjects();
    if (projects.data.length > 0) {
      console.log('Database already contains data. Skipping population.');
      return;
    }

    console.log('Populating test data...');

    const project1 = taskService.createProject({
      name: 'Personal Errands',
      description: 'Tasks for personal life management.',
      color: '#FF6B6B'
    });
    console.log('Created project:', project1);

    const project2 = taskService.createProject({
      name: 'Work Projects',
      description: 'All tasks related to my job.',
      color: '#4ECDC4'
    });
    console.log('Created project:', project2);

    taskService.createTask({
      project_id: project1.id,
      title: 'Buy groceries',
      description: 'Milk, bread, cheese, and eggs.',
      priority: 'high'
    });

    taskService.createTask({
      project_id: project1.id,
      title: 'Schedule dentist appointment',
      status: 'completed'
    });

    taskService.createTask({
      project_id: project2.id,
      title: 'Finish Q3 report',
      description: 'Complete the financial report for the third quarter.',
      priority: 'high',
      status: 'in-progress'
    });

    taskService.createTask({
      project_id: project2.id,
      title: 'Prepare for team meeting',
      description: 'Create a presentation for the weekly sync.',
      priority: 'medium'
    });

    console.log('✅ Test data populated successfully.');
  } catch (error) {
    console.error('❌ Error populating test data:', error);
  } finally {
    taskService.close();
  }
}

populateTestData();