[EPIC 1 - Step 9 - Natural Language Task Processing]
1. Primary Task:
   - Integrate with the existing Llama.cpp infrastructure to enable task creation from a single string of natural language text. This involves creating a new backend service method and IPC handler that takes a text input, sends it to the local AI model for parsing, and returns a structured task object. (Source: project_planv2.md, Sections 3.2, 4.1, 7.1)

2. File Locations:
- To be Modified:
- electron/services/taskService.ts: To add a new processNaturalLanguageTask method.
- electron/index.ts: To register the IPC handler for the new method.
- electron/preload.ts: To expose the new function on the personalTaskAPI.
   - To be Created (or Modified if existing):
     - src/features/tasks/components/QuickAddTask.tsx: A new UI component with a single text input for natural language task entry.

3. UI/Component Specification:
   - QuickAddTask.tsx:
     - Layout: A simple form, likely displayed at the bottom of the TaskList or in the TaskHeader.
     - Content: An <input type="text"> field with a placeholder like "e.g., Review project plan tomorrow at 2pm" and an "Add Task" button.
     - Interaction: Typing in the input and clicking "Add Task" (or pressing Enter) will trigger the call to the new natural language processing API. While processing, the input and button should be disabled, and a loading indicator (spinner) should be shown.

4. State Management Logic:
   - taskStore.ts:
     - New Action:
       - createTaskFromNLP(input: string): Promise<void>: This action will call window.personalTaskAPI.processNaturalLanguageTask(input). If the API returns a structured task object, it will then call window.personalTaskAPI.createTask with that data. After creation, it must re-fetch the task list to update the UI.

5. Data Model & Schema:
   - The processNaturalLanguageTask method is expected to return a TaskCreationResult, which is defined as Partial<Task> or a similar structure that can be used to create a new task. (Source: project_planv2.md, Section 4.1, IPC API Interface)

Inferred AI Prompt: The backend service will construct a prompt for Llama.cpp to instruct it to parse the user's text. The prompt must ask the AI to extract entities like title, description, due date, and priority, and to format the output as a JSON object.

6. Backend Interaction Logic:
   - taskService.ts - processNaturalLanguageTask(input: string): Promise<Partial<Task>>:
     1. Construct Prompt: Create a detailed prompt for the Llama.cpp model.
Example Prompt: "You are a task management assistant. Analyze the following user request and extract the task details into a JSON object. The JSON object should have keys: 'title' (string), 'description' (string, optional), 'due_date' (ISO 8601 string, optional), and 'priority' ('low', 'medium', 'high', 'urgent', optional). User request: '{INPUT_TEXT}'"
     2. Call AI Model: Send this prompt to the existing Llama.cpp integration service.
     3. Parse Response: Receive the raw text response from the AI.
     4. Validate and Sanitize: Parse the JSON string from the AI's response. Validate that the fields are correct and the data types are as expected. Discard any extraneous fields.
     5. Return Structured Object: Return the sanitized Partial<Task> object.
   - index.ts / preload.ts: Wire up this new service method via IPC as 'tasks:processNaturalLanguageTask'.

7. Relevant Documentation & Examples:
   - AI Integration (Conceptual):
     typescript      // In TaskService      // Assume 'llamaService.generate' is the existing method to call the AI            public async processNaturalLanguageTask(input: string): Promise<Partial<Task>> {        const prompt = `...`; // Construct the prompt as described above        const aiResponse = await this.llamaService.generate(prompt);                try {          // It's crucial to find the JSON within the AI's potentially conversational response          const jsonMatch = aiResponse.match(/\{.*\}/s);          if (!jsonMatch) {            throw new Error('AI did not return valid JSON.');          }          const parsedData = JSON.parse(jsonMatch[0]);                    // TODO: Add validation logic here (e.g., with Zod)                    return parsedData as Partial<Task>;        } catch (error) {          console.error('Failed to parse AI response:', error);          throw new Error('Could not understand the task details.');        }      }      

8. Error Handling:
   - AI Service Unavailable: If the Llama.cpp service is not running or fails to respond, the call to it will fail.
     - Logic: The processNaturalLanguageTask method must have a try...catch around the AI call.
     - UI Feedback: The frontend should display an error message: "AI assistant is currently unavailable. Please add tasks manually."
   - AI Fails to Parse: If the AI returns text that is not valid JSON or does not contain the required fields, the parsing logic will fail.
     - Logic: The JSON parsing and validation block is critical. If it fails, it should throw a specific error.
     - UI Feedback: Display an error message in the QuickAddTask component: "Sorry, I couldn't understand that. Please try rephrasing your request."

9. Coding Standards & Verification:
   - The prompt sent to the AI must be carefully engineered to reliably produce JSON output.
   - Robust parsing and validation of the AI's response is mandatory to prevent malformed data from entering the database.
   - Verification Checklist:
     - 1. The QuickAddTask UI component is created and visible.
     - 2. Entering text (e.g., "Finish report by Friday") and submitting calls the createTaskFromNLP store action.
     - 3. The taskService correctly calls the Llama.cpp service with a well-formed prompt.
     - 4. The backend successfully parses the JSON response from the AI.
     - 5. A new task is created in the database with the title "Finish report" and a due_date corresponding to the upcoming Friday.
     - 6. The task list in the UI automatically updates to show the new task.
     - 7. If the AI returns malformed data or is unavailable, the UI displays the appropriate error message, and no task is created.