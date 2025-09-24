[EPIC 1 - Step 7 - Basic Task List UI with Filtering]
1. Primary Task:
- Connect the frontend UI components to the backend to display a dynamic list of projects and tasks. Implement state management to fetch, store, and display the data, and add basic client-side filtering logic to show tasks for a selected project. (Source: project_planv2.md, Section 7.1)

2. File Locations:
- To be Modified:
- src/features/tasks/routes/TaskView.tsx: To manage the application state for the selected project.
- src/features/tasks/components/ProjectSidebar.tsx: To fetch and display the list of projects from the backend and handle project selection.
- src/features/tasks/components/TaskList.tsx: To receive and display a list of tasks based on the selected project.
- To be Created:
- src/features/tasks/state/taskStore.ts (Inferred): A new state management file (using Zustand, as per project_planv2.md, Section 4.2) to handle fetching and storing projects and tasks.

3. UI/Component Specification:
- ProjectSidebar.tsx:
- Logic: On component mount, it should trigger a fetch to get all projects via the state management store.
- Display: It should map over the list of projects from the store and render a clickable list item for each one.
- Interaction: Clicking a project item should update the global state with the selected project's ID. The currently selected project should have a visual distinction (e.g., a different background color).
- TaskList.tsx:
- Logic: It should receive a list of tasks as a prop from its parent (TaskView).
- Display: It should map over the tasks and display the title of each task. If the list is empty, it should show the "No tasks yet" message.
- TaskView.tsx:
- Logic: This component will now manage the central state. It will hold the selectedProjectId. It will fetch all tasks and then filter them based on the selectedProjectId before passing them to TaskList.

4. State Management Logic:
- taskStore.ts (Zustand):
- State:
- projects: Project[]
- tasks: Task[]
- loading: boolean
- error: string | null
- selectedProjectId: string | null
- Actions:
- fetchProjects(): Promise<void>: Calls window.personalTaskAPI.getProjects(), updates the projects state, and handles loading/error states.
- fetchTasks(): Promise<void>: Calls window.personalTaskAPI.getTasks(), updates the tasks state.
- selectProject(projectId: string | null): void: Updates the selectedProjectId.

5. Data Model & Schema:
- The UI will consume the Project and Task interfaces that are returned by the IPC API.

6. Backend Interaction Logic:
- The frontend will now actively call the IPC functions exposed in the preload script, which were implemented in previous steps:
- window.personalTaskAPI.getProjects()
- window.personalTaskAPI.getTasks()

7. Relevant Documentation & Examples:
- Zustand Store (taskStore.ts):
```typescript
import create from 'zustand';
// Import Project and Task types

  interface TaskState {
    projects: Project[];
    tasks: Task[];
    selectedProjectId: string | null;
    fetchProjects: () => Promise<void>;
    fetchTasks: () => Promise<void>;
    selectProject: (projectId: string | null) => void;
  }

  export const useTaskStore = create<TaskState>((set) => ({
    projects: [],
    tasks: [],
    selectedProjectId: null,
    fetchProjects: async () => {
      const projects = await window.personalTaskAPI.getProjects();
      set({ projects });
    },
    fetchTasks: async () => {
      const tasks = await window.personalTaskAPI.getTasks();
      set({ tasks });
    },
    selectProject: (projectId) => set({ selectedProjectId: projectId }),
  }));
  ```
- **Component Usage (`ProjectSidebar.tsx`):**
  ```tsx
  import React, { useEffect } from 'react';
  import { useTaskStore } from '../state/taskStore';

  export const ProjectSidebar = () => {
    const { projects, fetchProjects, selectProject, selectedProjectId } = useTaskStore();

    useEffect(() => {
      fetchProjects();
    }, []);

    return (
      <div>
        <h2>Projects</h2>
        <ul>
          {projects.map(project => (
            <li
              key={project.id}
              onClick={() => selectProject(project.id)}
              style={{ backgroundColor: selectedProjectId === project.id ? 'lightblue' : 'transparent' }}
            >
              {project.name}
            </li>
          ))}
        </ul>
      </div>
    );
  };
  ```

8. Error Handling:
- Data Fetching Failure: If the window.personalTaskAPI calls fail, the promise will reject.
- Logic: The fetchProjects and fetchTasks actions in the Zustand store should wrap the API calls in a try...catch block. If an error occurs, it should be stored in the error state variable.
- UI Feedback: Components should check the error state. If it's not null, they should display a user-friendly error message, such as "Could not load projects. Please try restarting the application."

9. Coding Standards & Verification:
- State management logic should be contained within the Zustand store. Components should only call actions and select data from the store.
- Verification Checklist:
- 1. A Zustand store is created with the specified state and actions.
- 2. On application load, the ProjectSidebar calls fetchProjects and displays a list of all projects retrieved from the database.
- 3. The TaskView calls fetchTasks and holds the full task list.
- 4. Clicking a project in the sidebar updates the selectedProjectId in the store and visually highlights the selected project.
- 5. The TaskList component correctly receives and displays only the tasks that belong to the currently selected project.
- 6. If no project is selected, the TaskList shows all tasks (or a prompt to select a project).
- 7. If an error occurs during fetching, a visible error message is displayed in the UI.