[EPIC 1 - Step 12 - Performance Optimization]
1. Primary Task:
   - Review and optimize the performance of the personal task system. This involves implementing database indexing, optimizing state management to reduce re-renders, and ensuring the UI remains responsive even with a large number of tasks and projects. (Source: project_planv2.md, Sections 4.1, 7.1)

2. File Locations:
- To be Modified:
- electron/database/migrations/: A new migration file will be created to add database indexes.
- electron/services/taskService.ts: Queries may be slightly adjusted to leverage indexes.
- src/features/tasks/state/taskStore.ts: To optimize selectors and actions.
     - All React components in src/features/tasks/: To use memoization and optimized selectors where appropriate.

3. UI/Component Specification:
   - No visual UI changes. The goal is to improve the responsiveness and speed of the existing UI, which will be noticeable to the user but does not involve new components.

4. State Management Logic (Optimization):
   - Zustand Selectors: Instead of subscribing to the entire store object in components, use selectors to subscribe to only the specific pieces of state that the component needs. This prevents re-renders when unrelated state changes.
     - Example: const tasks = useTaskStore(state => state.tasks);
   - Batching Updates: Actions that result in multiple state changes (like breakdownTask) should be reviewed to ensure they update the state efficiently. Instead of re-fetching the entire list of tasks after adding multiple subtasks, the action could optimistically add the new subtasks directly to the local state array.

5. Data Model & Schema (Optimization):
   - Database Indexing: Create indexes on frequently queried columns to speed up SELECT operations.
     - tasks(project_id): Crucial for quickly filtering tasks by project.
     - tasks(status): For potential future filtering by status.
     - tasks(parent_task_id): For quickly retrieving subtasks.

6. Backend Interaction Logic (Optimization):
   - Paginate getTasks (Inferred/Future-proofing): Modify the getTasks method and IPC handler to accept optional limit and offset parameters. While not strictly required for the UI yet, this prepares the backend for handling thousands of tasks without sending a huge payload to the frontend at once. The current implementation can default to a high limit (e.g., 500).

7. Relevant Documentation & Examples:
   - SQL CREATE INDEX Statement:
     - A new migration file ({timestamp}-add-task-indexes.sql) should be created.
       ```sql
       -- UP MIGRATION
       CREATE INDEX idx_tasks_project_id ON tasks(project_id);
       CREATE INDEX idx_tasks_status ON tasks(status);
       CREATE INDEX idx_tasks_parent_task_id ON tasks(parent_task_id);

       -- DOWN MIGRATION
       DROP INDEX idx_tasks_parent_task_id;
       DROP INDEX idx_tasks_status;
       DROP INDEX idx_tasks_project_id;
           - **React Memoization (`TaskList.tsx`):**      - Wrap the `TaskList` component and its list items in `React.memo` to prevent re-rendering if their props haven't changed.        tsx
       import React from 'react';

       const TaskItem = React.memo(({ task }) => {
         // ... render task
       });

       export const TaskList = React.memo(({ tasks, onTaskSelect }) => {
         // ... render list of TaskItem
       });
       ```

8. Error Handling:
   - Migration Failure: If the CREATE INDEX migration fails (e.g., syntax error), the standard migration error handling applies.
   - Performance Degradation: The primary "error" is the system feeling slow.
     - Mitigation: Use profiling tools (React DevTools Profiler, Chrome Performance tab) to identify performance bottlenecks, such as components re-rendering unnecessarily or long-running JavaScript functions.

9. Coding Standards & Verification:
   - Any component that renders a list should have its list items wrapped in React.memo.
   - Selectors should be used for all Zustand store access in components.
   - Verification Checklist:
     - 1. A new database migration is created and successfully run to add the specified indexes on the tasks table.
     - 2. Manually add a large number of tasks (e.g., 500+) to the database using a script.
     - 3. Verify that filtering tasks by project remains fast and responsive (<100ms UI update).
     - 4. Use the React DevTools Profiler to confirm that changing the selected project only re-renders the TaskList and not the entire TaskView or other unrelated components.
     - 5. Confirm that updating a single task's details in the modal does not cause the entire TaskList to re-render, only the single updated TaskItem (if optimistic updates are implemented).
     - 6. Application's memory and CPU usage remain reasonable when interacting with a large dataset.