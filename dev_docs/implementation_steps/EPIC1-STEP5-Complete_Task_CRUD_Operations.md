[EPIC 1 - Step 5 - Complete Task CRUD Operations]
1. Primary Task:
   - Implement the full set of Create, Read, Update, and Delete (CRUD) operations for tasks in the backend. This involves extending the TaskService and the IPC API to handle creating, fetching, modifying, and deleting tasks. (Source: project_planv2.md, Sections 4.1, 7.1)

2. File Locations:
- To be Modified:
- electron/services/taskService.ts: To add new methods for task CRUD.
- electron/index.cjs: To register the new IPC handlers for each CRUD operation.
- electron/preload.cjs: To expose the new task-related IPC channels.
     - types/tasks.ts (or equivalent shared types file): To add/update the Task interface.

3. UI/Component Specification:
   - Not applicable. This is a backend-only implementation step.

4. State Management Logic:
   - Not applicable for this step.

5. Data Model & Schema:
   - This implementation will directly manipulate the tasks table in the SQLite database. The data models used in the functions must align with the Task schema. (Source: project_planv2.md, Section 4.1)
   - Task Interface (types/tasks.ts):
     typescript      interface Task {        id: string;        project_id?: string;        title: string;        description?: string;        priority: 'low' | 'medium' | 'high' | 'urgent';        status: 'todo' | 'in_progress' | 'completed' | 'cancelled';        due_date?: string;        created_at: string;        updated_at: string;        completed_at?: string;        parent_task_id?: string;      }      

6. Backend Interaction Logic:
   - taskService.ts:
     - getTasks(projectId?: string): Task[]: Fetches tasks. If projectId is provided, it should add a WHERE project_id = ? clause.
     - createTask(taskData: Omit<Task, 'id'>): Task: Inserts a new task into the tasks table. It must generate a unique ID (e.g., using uuid or similar library). It should return the newly created task.
     - updateTask(id: string, updates: Partial<Task>): Task: Updates an existing task using its id. It should dynamically build the UPDATE statement based on the updates object to only change the provided fields. Must also update the updated_at timestamp.
     - deleteTask(id: string): void: Deletes a task from the tasks table using its id.
   - index.ts (Main Process):
     - Register IPC handlers (ipcMain.handle) for each of the four new service methods:
       - 'tasks:getTasks'
       - 'tasks:createTask'
       - 'tasks:updateTask'
       - 'tasks:deleteTask'
   - preload.ts:
     - Expose the four new functions on the personalTaskAPI object via the contextBridge.

7. Relevant Documentation & Examples:
   - better-sqlite3 Prepared Statements for CUD:
     ```typescript
     // In TaskService
     import { v4 as uuidv4 } from 'uuid';

     public createTask(taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Task {
       const newId = uuidv4();
       const stmt = this.db.prepare(
         'INSERT INTO tasks (id, title, project_id, ...) VALUES (@id, @title, @project_id, ...)'
       );
       stmt.run({ id: newId, ...taskData });
// After inserting, fetch the full task object to return it
return this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(newId) as Task;
     }

     public deleteTask(id: string): { changes: number } {
       const stmt = this.db.prepare('DELETE FROM tasks WHERE id = ?');
       const info = stmt.run(id);
return { changes: info.changes }; // Return number of rows affected
     }
     ```

8. Error Handling:
   - Foreign Key Violation: Attempting to create a task with a project_id that does not exist in the projects table will cause a SQLITE_CONSTRAINT_FOREIGNKEY error.
     - Logic: The try...catch block in the IPC handler should catch this specific constraint error and return a meaningful error message.
     - Inferred Response: { success: false, error: 'Invalid project ID. The specified project does not exist.' }
   - Not Found on Update/Delete: Attempting to update or delete a task with an ID that does not exist will not throw an error but will result in 0 changes.
     - Logic: The service method should check the info.changes property from the run() result. If it's 0, it means the ID was not found.
     - Inferred Response: The service method should throw a "Not Found" error, which the IPC handler catches and returns as { success: false, error: 'Task with the specified ID was not found.' }
   - Invalid Input: Passing invalid data (e.g., a priority value not in the allowed set) will not cause a database error unless there's a CHECK constraint.
     - Logic: Add input validation (e.g., using a library like Zod or manually) at the beginning of each service method to ensure data integrity before it reaches the database.

9. Coding Standards & Verification:
   - Use parameterized queries (prepare) exclusively to prevent SQL injection vulnerabilities.
   - Ensure all new methods in TaskService are fully typed.
   - Verification Checklist:
     - 1. All four methods (getTasks, createTask, updateTask, deleteTask) are implemented in TaskService.
     - 2. Corresponding IPC handlers and preload exposures are created for all four methods.
     - 3. Create: Calling window.personalTaskAPI.createTask from DevTools successfully adds a new row to the tasks table and returns the new task object.
     - 4. Read: Calling window.personalTaskAPI.getTasks returns an array containing the newly created task.
     - 5. Update: Calling window.personalTaskAPI.updateTask with the new task's ID and updated data modifies the corresponding row in the database.
     - 6. Delete: Calling window.personalTaskAPI.deleteTask with the task's ID removes the row from the database.
     - 7. Error handling for invalid IDs and foreign key constraints is working as specified.