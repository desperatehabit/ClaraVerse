[EPIC 1 - Step 11 - Context-Aware Suggestions]
1. Primary Task:
   - Implement a feature where the AI provides context-aware suggestions for new tasks. This is a passive feature that analyzes the user's current context (e.g., other tasks, project names) and suggests relevant tasks to add. (Source: project_planv2.md, Sections 3.2, 7.1)

2. File Locations:
- To be Modified:
- electron/services/taskService.ts: To add a new getSuggestedTasks method.
- electron/index.ts: To register the 'tasks:getSuggestedTasks' IPC handler.
- electron/preload.ts: To expose the getSuggestedTasks function.
     - src/features/tasks/state/taskStore.ts: To add state and an action for suggestions.
   - To be Created:
     - src/features/tasks/components/SuggestedTasks.tsx: A new component to display the suggestions from the AI.

3. UI/Component Specification:
   - SuggestedTasks.tsx:
     - Layout: A small, non-intrusive panel, perhaps at the bottom of the ProjectSidebar or below the TaskList.
     - Content: It should have a title like "Suggestions ✨". Below the title, it will display a list of suggested task titles. Each suggestion should be a button that, when clicked, adds the task.
     - Interaction:
       - A "Refresh" button to manually request new suggestions.
       - Clicking on a suggested task title should automatically create that task (using the createTask action) and add it to the current project.
       - The suggestion should be removed from the list after it's been added.

4. State Management Logic:
   - taskStore.ts:
     - New State:
       - suggestions: string[]
       - suggestionsLoading: boolean
     - New Action:
       - fetchSuggestions(): Promise<void>: Sets suggestionsLoading to true. It gets the current project and a few recent task titles from the state to use as context, then calls window.personalTaskAPI.getSuggestedTasks(context). On success, it updates the suggestions array.

5. Data Model & Schema:
   - The getSuggestedTasks function will take a context object and return a simple array of strings, where each string is a suggested task title.
     typescript      interface TaskSuggestionContext {        currentProjectName?: string;        recentTaskTitles: string[];      }      

6. Backend Interaction Logic:
   - taskService.ts - getSuggestedTasks(context: TaskSuggestionContext): Promise<string[]>:
     1. Construct Prompt: Create a prompt for the Llama.cpp model that includes the context.
Example Prompt: "You are a productivity assistant. Based on the user's current project and recent tasks, suggest 3 new, relevant tasks they might need to do next. The project is '{currentProjectName}'. Recent tasks include: '{recentTaskTitles}'. Return your suggestions as a JSON array of strings. For example: [\"suggestion 1\", \"suggestion 2\"]"
     2. Call AI Model: Send the prompt to the Llama.cpp service.
     3. Parse and Validate: Parse the JSON array of strings from the AI's response.
     4. Return String Array: Return the array of suggested task titles.

7. Relevant Documentation & Examples:
   - Frontend Component (SuggestedTasks.tsx):
     ```tsx
     import { useTaskStore } from '../state/taskStore';

     export const SuggestedTasks = () => {
       const { suggestions, fetchSuggestions, suggestionsLoading, createTask } = useTaskStore();
const selectedProjectId = useTaskStore(s => s.selectedProjectId);

       const handleAddSuggestion = (title: string) => {
// This assumes createTask is modified to take initial data
         createTask({ title, project_id: selectedProjectId, ... });
       };

       return (
         <div>
           <h3>Suggestions ✨ <button onClick={fetchSuggestions}>Refresh</button></h3>
           {suggestionsLoading ? <p>Loading...</p> : (
             <ul>
               {suggestions.map(s => <li key={s}><button onClick={() => handleAddSuggestion(s)}>{s}</button></li>)}
             </ul>
           )}
         </div>
       );
     };
     ```

8. Error Handling:
   - AI Failure: If the AI call fails, the getSuggestedTasks method should throw an error.
     - UI Feedback: The SuggestedTasks component should catch the error from the store action and display a message like "Could not load suggestions." The loading state should be reset.
   - No Context: If there's no project selected or no recent tasks, the backend can either send an empty context or decide not to call the AI at all.
     - Logic: The getSuggestedTasks method should handle an empty context gracefully, returning an empty array. The UI will then simply show no suggestions.

9. Coding Standards & Verification:
   - The feature should "fail gracefully" by simply not showing suggestions if the AI is unavailable, rather than blocking the user.
   - Verification Checklist:
     - 1. The SuggestedTasks.tsx component is created and integrated into the UI.
     - 2. The fetchSuggestions action is called (e.g., when a project is selected or refresh is clicked).
     - 3. The backend successfully calls the AI with context (project name, task titles).
     - 4. For a project named "Website Redesign" with tasks like "Design mockups", the AI returns relevant suggestions like "Develop landing page" or "Test mobile responsiveness".
     - 5. The suggestions are displayed correctly in the UI.
     - 6. Clicking a suggestion creates a new task in the current project and removes the suggestion from the list.
     - 7. The UI shows a loading state while fetching and an error state on failure.