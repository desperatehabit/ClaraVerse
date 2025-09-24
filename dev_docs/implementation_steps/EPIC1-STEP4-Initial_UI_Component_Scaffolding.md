[EPIC 1 - Step 4 - Initial UI Component Scaffolding]
1. Primary Task:
   - Create the basic, non-functional React components that will form the user interface for the personal task management system. This includes creating placeholder files for the main view, the project sidebar, and the task list, and integrating them into the application's navigation structure. (Source: project_planv2.md, Sections 3.2, 7.1)

2. File Locations:
   - To be Created (Inferred React Component Structure):
     - src/features/tasks/: A new directory for the personal tasks feature.
     - src/features/tasks/routes/TaskView.tsx: The main container component for the entire tasks screen.
     - src/features/tasks/components/ProjectSidebar.tsx: A component to list user projects.
     - src/features/tasks/components/TaskList.tsx: A component to display a list of tasks.
- src/features/tasks/components/TaskHeader.tsx: A component for the header of the task view, containing title and action buttons.
   - To be Modified:
     - src/routes.tsx (or equivalent navigation/routing file): To add a new route (e.g., /tasks) that renders the TaskView component.
     - src/components/Sidebar.tsx (or main navigation component): To add a new navigation link (e.g., an icon for "Tasks") that links to the new /tasks route.

3. UI/Component Specification:
   - TaskView.tsx:
     - Layout: Should use a two-column layout. A fixed-width left column for the ProjectSidebar and a flexible main content area on the right.
- Composition:
- Renders <ProjectSidebar /> on the left.
- The right column contains <TaskHeader /> at the top and <TaskList /> below it.
   - ProjectSidebar.tsx:
     - Content: Display a static title: "Projects". Below the title, render a placeholder list item with the text "My First Project". This will be made dynamic later.
   - User-Facing Text: "Projects", "My First Project".
   - TaskList.tsx:
     - Content: Display a placeholder message indicating no tasks are present, e.g., "Select a project to see its tasks." or "No tasks yet."
   - User-Facing Text: "No tasks yet."

TaskHeader.tsx:

Content: Display a static title: "All Tasks". Include a placeholder button with the text "New Task". The button should be non-functional for now.

User-Facing Text: "All Tasks", "New Task".

4. State Management Logic:
   - Not applicable. This step is for creating static, non-interactive UI components. State will be introduced in subsequent steps.

5. Data Model & Schema:
   - Not applicable. The components will use static, hardcoded data for placeholder content.

6. Backend Interaction Logic:
   - The components will not interact with the backend in this step. The goal is to establish the visual structure.

7. Relevant Documentation & Examples:
   - React Component Example (TaskView.tsx):
     ```tsx
     import React from 'react';
     import { ProjectSidebar } from '../components/ProjectSidebar';
     import { TaskList } from '../components/TaskList';
import { TaskHeader } from '../components/TaskHeader';

     export const TaskView = () => {
       return (
         <div style={{ display: 'flex', height: '100vh' }}>
           <div style={{ width: '250px', borderRight: '1px solid #ccc' }}>
             <ProjectSidebar />
           </div>
           <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
             <TaskHeader />
<TaskList />
           </div>
         </div>
       );
     };
     ```

8. Error Handling:
   - Routing Errors: If the new /tasks route is not configured correctly, navigating to it will result in a 404 or a blank page.
     - Mitigation: Ensure the route is properly defined in the application's router configuration file, linking the path to the TaskView component.
   - Component Import/Export Errors: Incorrect file paths or missing export statements in the new component files will cause compilation errors.
     - Mitigation: Double-check all import and export statements to ensure they are correct.

9. Coding Standards & Verification:
   - Components should be functional components using React Hooks.
   - Follow the project's existing styling conventions (e.g., CSS-in-JS, Tailwind CSS, etc.).
   - Verification Checklist:
     - 1. All new component files (TaskView.tsx, ProjectSidebar.tsx, TaskList.tsx, TaskHeader.tsx) are created in the specified locations.
     - 2. A navigation link to the "Tasks" page is added to the main application navigation.
     - 3. Clicking the "Tasks" link successfully navigates the user to the /tasks route.
     - 4. The TaskView component renders, displaying the two-column layout.
     - 5. ProjectSidebar is visible on the left with its placeholder title and list item.
     - 6. TaskHeader and TaskList are visible in the main content area with their placeholder text and button.
     - 7. The "New Task" button is visible but has no action attached to its onClick handler yet.