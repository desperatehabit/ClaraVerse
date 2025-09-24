[EPIC 1 - Step 3 - Basic IPC Handlers for Personal Task Operations]
1. Primary Task:
   - Implement the backend logic for basic data operations and expose it to the frontend. This involves creating a database service in the Electron main process to interact with the SQLite database and setting up IPC (Inter-Process Communication) handlers to allow the React UI to request data, such as fetching all projects. (Source: project_planv2.md, Sections 4.1, 7.1)

2. File Locations:
- To be Created:
- electron/services/taskService.ts: A new service class to encapsulate all database queries related to personal tasks.
- To be Modified:
- electron/index.cjs: To initialize the taskService and register the IPC handlers.
- electron/preload.cjs: To expose the new IPC channels to the renderer process in a type-safe way.

3. UI/Component Specification:
   - Not applicable. This step is purely for backend logic and data plumbing.

4. State Management Logic:
   - Not applicable. State management will consume this data in a future step but is not created here.

5. Data Model & Schema:
   - The service will query the data structures defined in the previous step's migration. (Source: project_planv2.md, Section 4.1).
   - The functions should return data that matches the TypeScript interfaces defined in the IPC API Interface.
     typescript      // (This should be in a shared types file, e.g., `types/tasks.ts`)      interface Project {        id: string;        name: string;        description?: string;        color?: string;        created_at: string;        updated_at: string;      }      

6. Backend Interaction Logic:
   - taskService.ts:
     - Initialize a connection to the SQLite database using better-sqlite3.
     - Implement a public method getProjects(): Promise<Project[]>. This method will execute a SELECT * FROM projects query.
     - The service should be a singleton, instantiated once in the main process.
   - index.ts (Main Process):
     - Import ipcMain from Electron.
     - Instantiate taskService.
     - Register an ipcMain.handle('tasks:getProjects', ...) handler that calls taskService.getProjects() and returns the result.
   - preload.ts:
     - Expose the tasks:getProjects channel to the renderer via the contextBridge. This provides a secure way for the frontend to invoke the main process handler.

7. Relevant Documentation & Examples:
- better-sqlite3 Querying:
```typescript
// electron/services/taskService.ts
import Database from 'better-sqlite3';

     export class TaskService {
       private db: Database.Database;

       constructor(dbPath: string) {
         this.db = new Database(dbPath);
       }

       public getProjects(): Project[] {
         const stmt = this.db.prepare('SELECT * FROM projects');
         return stmt.all() as Project[];
       }
     }
- **Electron IPC Handler:**      typescript
// electron/index.ts
import { ipcMain } from 'electron';
     import { TaskService } from './services/taskService';

     const taskService = new TaskService('./clara_tasks.db');

     ipcMain.handle('tasks:getProjects', async () => {
       return taskService.getProjects();
     });
         - **Electron Preload Script:**      typescript
     // electron/preload.ts
     import { contextBridge, ipcRenderer } from 'electron';

     contextBridge.exposeInMainWorld('personalTaskAPI', {
       getProjects: (): Promise<Project[]> => ipcRenderer.invoke('tasks:getProjects'),
     });
     ```

8. Error Handling:
   - Database Error: If the SELECT query fails (e.g., the table doesn't exist), the better-sqlite3 method will throw an exception. This exception should be caught in the IPC handler.
     - Logic: The ipcMain.handle callback should be wrapped in a try...catch block. On error, it should log the error to the main process console and return a structured error object to the frontend.
     - Inferred Response: { success: false, error: 'Failed to fetch projects from the database.' }. The frontend can then check the success flag.
   - Database Connection Failure: If the database file cannot be opened, the better-sqlite3 constructor will throw an error. This is a critical startup failure.
     - Logic: Wrap the TaskService instantiation in a try...catch block. If it fails, log a critical error and consider showing an error dialog to the user before quitting the app.

9. Coding Standards & Verification:
   - Follow existing project standards for services and IPC implementation.
   - The PersonalTaskAPI interface from project_planv2.md, Section 4.1 should be implemented on the preload bridge for type safety.
   - Verification Checklist:
     - 1. The TaskService class is created and connects to the database.
     - 2. The getProjects method correctly queries the database and returns an array.
     - 3. An IPC handler for tasks:getProjects is registered in the main process.
     - 4. The personalTaskAPI.getProjects function is exposed to the renderer process via the context bridge in preload.ts.
     - 5. Calling window.personalTaskAPI.getProjects() from the renderer's DevTools console successfully returns an empty array (since no data has been inserted yet).
     - 6. Manually inserting a row into the projects table and re-running the call in DevTools returns an array with one project object.