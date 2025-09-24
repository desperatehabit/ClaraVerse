[EPIC 1 - Step 8 - Task Detail View Implementation]
1. Primary Task:
   - Create a modal or a dedicated view that allows users to see and edit the full details of a single task. This includes displaying all fields (title, description, priority, etc.) and providing form inputs to modify them. (Source: project_planv2.md, Section 3.2, 7.1)

2. File Locations:
   - To be Created:
     - src/features/tasks/components/TaskDetailModal.tsx: A new component for the modal.
   - To be Modified:
     - src/features/tasks/routes/TaskView.tsx: To manage the state of which task is selected for editing and to render the modal.
     - src/features/tasks/components/TaskList.tsx: To make each task item clickable, which will open the detail modal.
     - src/features/tasks/state/taskStore.ts: To handle the update action.

3. UI/Component Specification:
   - TaskList.tsx:
     - Interaction: Each task item rendered in the list should now be a clickable element (e.g., a button or a div with an onClick handler). Clicking it should call a function passed down from TaskView to set the currently selected task ID for editing.
   - TaskView.tsx:
     - State: It will manage a new piece of local state: editingTaskId: string | null.
     - Logic: It will pass a function to TaskList that sets editingTaskId. It will conditionally render <TaskDetailModal> only when editingTaskId is not null, passing the full task object to it as a prop.
   - TaskDetailModal.tsx:
     - Layout: A modal dialog that overlays the main view. It should have a title bar with the task title and a close button.
     - Content: The modal body should contain a form with input fields for all editable task properties:
       - title:  <input type="text">
       - description: <textarea>
       - priority: <select> with options: Low, Medium, High, Urgent.
       - status: <select> with options: To-do, In Progress, Completed, Cancelled.
       - due_date: <input type="date">
     - Actions: The form should have a "Save" button and a "Cancel" button.
     - User-Facing Text: "Edit Task", "Title", "Description", "Priority", "Status", "Due Date", "Save", "Cancel", "Delete".

4. State Management Logic:
   - taskStore.ts:
     - New Action:
       - updateTask(id: string, updates: Partial<Task>): Promise<void>: Calls window.personalTaskAPI.updateTask(id, updates). On success, it must re-fetch all tasks (fetchTasks()) or intelligently update the single task in the local state to ensure the UI is synchronized.

5. Data Model & Schema:
   - The form will be populated with data from a Task object and will submit an object matching Partial<Task> to the updateTask action.

6. Backend Interaction Logic:
   - The "Save" button in the modal will trigger the updateTask action in the Zustand store, which in turn calls the window.personalTaskAPI.updateTask IPC function implemented in a previous step.

7. Relevant Documentation & Examples:
   - Local State for Modal Control (TaskView.tsx):
     ```tsx
     import React, { useState } from 'react';
     import { useTaskStore } from '../state/taskStore';
     import { TaskDetailModal } from '../components/TaskDetailModal';

     export const TaskView = () => {
       const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
       const tasks = useTaskStore(state => state.tasks);

   const editingTask = tasks.find(t => t.id === editingTaskId);

       return (
         <div>
           {/* ... other components ... */}
           <TaskList onTaskSelect={setEditingTaskId} />

           {editingTask && (
             <TaskDetailModal
               task={editingTask}
               onClose={() => setEditingTaskId(null)}
             />
           )}
         </div>
       );
     };
         - **Form Handling in Modal (`TaskDetailModal.tsx`):**      tsx
     const { updateTask } = useTaskStore();
const [title, setTitle] = useState(task.title);
// ... other form fields state

 const handleSave = async () => {
   await updateTask(task.id, { title /* ... other fields */ });
   onClose();
 };

     ```

8. Error Handling:
   - Update Failure: If the updateTask API call fails (e.g., database error, task not found), the promise will reject.
     - Logic: The component calling the updateTask action (the modal) should wrap the call in a try...catch block.
     - UI Feedback: On failure, the modal should display an inline error message near the "Save" button, e.g., "Failed to save changes. Please try again." The modal should not close automatically.
   - Stale Data: If another client modifies the task while the modal is open, saving will overwrite those changes.
     - Mitigation (Inferred/Advanced): For this implementation, we will accept the "last write wins" strategy. A more advanced implementation could involve checking the updated_at timestamp before saving. This is not required for this step.

9. Coding Standards & Verification:
   - Use controlled components for all form fields in the TaskDetailModal.
   - The modal should be accessible (e.g., handle keyboard focus, close with Escape key).
   - Verification Checklist:
     - 1. The TaskDetailModal.tsx component is created with all the specified form fields.
     - 2. Clicking a task in TaskList opens the modal populated with that task's correct data.
     - 3. The "Cancel" or close button closes the modal without saving any changes.
     - 4. Modifying data in the form fields and clicking "Save" calls the updateTask action.
     - 5. After a successful save, the modal closes, and the TaskList UI updates to show the new data.
     - 6. If saving fails, an error message is displayed within the modal, and the modal remains open.