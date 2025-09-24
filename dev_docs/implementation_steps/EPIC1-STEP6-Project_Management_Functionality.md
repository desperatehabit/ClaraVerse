[EPIC 1 - Step 6 - Project Management Functionality]
1. Primary Task:
   - Implement the complete backend CRUD (Create, Read, Update, Delete) functionality for projects. This involves expanding the TaskService and IPC API to allow the frontend to create, modify, and delete project records in the database. (Source: project_planv2.md, Sections 4.1, 7.1)

2. File Locations:
- To be Modified:
- electron/services/taskService.ts: To add new methods for project CRUD (createProject, updateProject, deleteProject).
- electron/index.cjs: To register the new IPC handlers for each project operation.
- electron/preload.cjs: To expose the new project-related functions on the personalTaskAPI.

3. UI/Component Specification:
   - Not applicable. This is a backend implementation step.

4. State Management Logic:
   - Not applicable for this step.

5. Data Model & Schema:
   - This implementation will directly interact with the projects table in the database. The data models must align with the Project interface. (Source: project_planv2.md, Section 4.1)
   - The Project interface is already defined (from Step 3).

6. Backend Interaction Logic:
   - taskService.ts:
     - createProject(projectData: Omit<Project, 'id'>): Project: Inserts a new project into the projects table. It must generate a unique ID and return the full, newly created project object.
     - updateProject(id: string, updates: Partial<Project>): Project: Updates an existing project by its id. It must dynamically build the UPDATE statement and update the updated_at timestamp. Returns the updated project.
     - deleteProject(id: string): void: Deletes a project from the projects table.
       - Critical Logic: When a project is deleted, all associated tasks in the tasks table must also be deleted to prevent orphaned records. This requires a transaction to ensure atomicity.
- index.cjs (Main Process):
  - Register IPC handlers for the three new service methods:
    - 'tasks:createProject'
    - 'tasks:updateProject'
    - 'tasks:deleteProject'
- preload.cjs:
  - Expose the three new functions on the personalTaskAPI object.

7. Relevant Documentation & Examples:
   - better-sqlite3 Transactions:
     ```typescript
     // In TaskService
     public deleteProject(id: string): { changes: number } {
       const deleteTransaction = this.db.transaction(() => {
         // First, delete all tasks associated with the project
         this.db.prepare('DELETE FROM tasks WHERE project_id = ?').run(id);
         // Then, delete the project itself
         const info = this.db.prepare('DELETE FROM projects WHERE id = ?').run(id);
if (info.changes === 0) {
throw new Error('Project not found'); // This will roll back the transaction
}
       });

   try {
     deleteTransaction();
     return { changes: 1 }; // Indicate success
   } catch (err) {
     console.error('Transaction failed for deleteProject:', err);
     return { changes: 0 };
   }

     }
     ```

8. Error Handling:
   - Cascading Delete Failure: If the deletion of tasks fails within the transaction for deleteProject, the entire transaction should be rolled back, and the project itself should not be deleted.
     - Logic: The better-sqlite3 transaction API automatically handles rollback on error. The IPC handler should catch the error from the service and return an appropriate failure response.
     - Inferred Response: { success: false, error: 'Failed to delete project and its associated tasks.' }
   - Not Found on Update/Delete: Similar to tasks, if an update or delete operation targets a non-existent project ID, the service method should detect this (via info.changes === 0) and throw an error.
     - Inferred Response: { success: false, error: 'Project with the specified ID was not found.' }
   - Missing name on Create: The name field is NOT NULL. Attempting to create a project without a name should be caught by the database.
     - Inferred Response: { success: false, error: 'Project name is a required field.' }

9. Coding Standards & Verification:
   - Transactions must be used for operations that modify multiple related tables, like the cascading delete.
   - The IPC API Interface from project_planv2.md, Section 4.1 should be fully implemented for projects.
   - Verification Checklist:
     - 1. The createProject, updateProject, and deleteProject methods are implemented in TaskService.
     - 2. Corresponding IPC handlers and preload exposures are created.
     - 3. Create: Calling window.personalTaskAPI.createProject from DevTools successfully adds a project to the projects table.
     - 4. Update: Calling window.personalTaskAPI.updateProject successfully modifies the new project's data.
     - 5. Delete:
       - First, create a project and then create a task associated with that project's ID.
       - Calling window.personalTaskAPI.deleteProject with the project's ID successfully removes both the project from the projects table AND the associated task from the tasks table.
     - 6. The deleteProject transaction correctly rolls back if the project ID does not exist.