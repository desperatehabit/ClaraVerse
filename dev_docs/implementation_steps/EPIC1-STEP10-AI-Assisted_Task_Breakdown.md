[EPIC 1 - Step 10 - AI-Assisted Task Breakdown]
1. Primary Task:
   - Implement a feature that allows the user to select an existing task and have the AI automatically break it down into smaller, actionable subtasks. This requires a new backend method to interface with the AI and frontend UI elements to trigger and display the results. (Source: project_planv2.md, Sections 3.2, 4.1, 7.1)

2. File Locations:
- To be Modified:
- electron/services/taskService.ts: To add a new breakdownTask method.
- electron/index.cjs: To register the new 'tasks:breakdownTask' IPC handler.
- electron/preload.cjs: To expose the new breakdownTask function.
     - src/features/tasks/components/TaskDetailModal.tsx: To add a button that triggers the breakdown feature.
     - src/features/tasks/state/taskStore.ts: To add actions for breaking down a task and adding the resulting subtasks.

3. UI/Component Specification:
   - TaskDetailModal.tsx:
     - New UI Element: Add a new button next to the task title or in the modal's action bar, labeled "Break Down with AI ✨".
     - Interaction: When this button is clicked, it should become disabled, and a loading indicator should appear. It will trigger the AI breakdown process for the current task.
   - Displaying Subtasks: The modal should be updated to include a section for "Subtasks". After the breakdown is complete, this section should be populated with the list of new subtasks. Initially, the modal should also display subtasks if they already exist for a task.

4. State Management Logic:
   - taskStore.ts:
     - New Action:
       - breakdownTask(taskId: string): Promise<void>:
         1. Finds the full task object from the current state using taskId.
         2. Calls window.personalTaskAPI.breakdownTask(taskId).
         3. The API will return an array of Subtask[] (which are essentially Partial<Task>[]).
         4. The action will then loop through the returned array and call createTask for each subtask, setting the parent_task_id to the original taskId.
         5. Finally, it must re-fetch all tasks to update the UI with the newly created subtasks.

5. Data Model & Schema:
   - The breakdownTask method will return an array of subtask objects. The interface for a subtask is effectively Omit<Task, 'id' | 'parent_task_id'>. The parent_task_id will be set by the client-side logic after the AI returns the breakdown. (Source: project_planv2.md, Section 4.1)

6. Backend Interaction Logic:
   - taskService.ts - breakdownTask(taskId: string): Promise<Partial<Task>[]>:
     1. Fetch Task: First, retrieve the full details of the task with taskId from the database to get its title and description.
     2. Construct Prompt: Create a prompt for Llama.cpp.
Example Prompt: "You are a project manager. Break down the following complex task into a series of smaller, simple subtasks. Return the subtasks as a JSON array of objects, where each object has a 'title' (string) and an optional 'description' (string). Do not nest the subtasks. Task Title: '{TASK_TITLE}'. Task Description: '{TASK_DESCRIPTION}'"
     3. Call AI Model: Send the prompt to the Llama.cpp service.
     4. Parse and Validate: Parse the JSON array from the AI's response. Validate that it's an array and that each object contains a title.
     5. Return Subtask Array: Return the sanitized array of subtask objects.

7. Relevant Documentation & Examples:
   - AI Prompt Engineering: The prompt is critical. It must explicitly ask for a JSON array and define the structure of the objects within it to ensure a parsable response.
   - Frontend Logic (TaskDetailModal.tsx):
     ```tsx
     const { breakdownTask, tasks } = useTaskStore();
     const [isBreakingDown, setIsBreakingDown] = useState(false);

 const subtasks = tasks.filter(t => t.parent_task_id === task.id);

     const handleBreakdown = async () => {
       setIsBreakingDown(true);
       try {
         await breakdownTask(task.id);
       } catch (error) {
         // Display an error message
       } finally {
         setIsBreakingDown(false);
       }
     };
// ... render button with onClick={handleBreakdown} and disabled={isBreakingDown}
// ... render the list of subtasks
     ```

8. Error Handling:
   - AI Failure: If the AI service is unavailable or returns a non-JSON response, the backend method should throw an error.
     - UI Feedback: The TaskDetailModal should catch this error and display a message like, "AI assistant failed to break down the task. Please try again." The loading state should be reset.
   - Empty Breakdown: If the AI returns an empty array (or no valid subtasks), no new tasks should be created.
     - UI Feedback: The modal could show a message saying, "This task is simple enough and doesn't require further breakdown."

9. Coding Standards & Verification:
   - Ensure the UI provides clear feedback to the user during the AI processing (loading state) and after completion (success or failure).
   - Verification Checklist:
     - 1. A "Break Down with AI" button is present in the TaskDetailModal.
     - 2. Clicking the button calls the breakdownTask backend method with the correct task ID.
     - 3. The backend method successfully queries the AI and parses the resulting JSON array of subtasks.
     - 4. For a task like "Plan company offsite", the AI returns a list of subtasks (e.g., "Book venue", "Arrange catering", "Send invitations").
     - 5. The frontend state management action successfully creates these new tasks in the database, each with the parent_task_id set to the original task's ID.
     - 6. The UI updates to show the new subtasks under a "Subtasks" heading in the TaskDetailModal.
     - 7. Error states (AI unavailable, bad response) are handled gracefully with user-facing messages.