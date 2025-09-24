import React from 'react';
import ProjectSidebar from '../components/ProjectSidebar';
import TaskHeader from '../components/TaskHeader';
import TaskList from '../components/TaskList';
import { PersonalProject, PersonalTask } from '../types';

interface TaskViewProps {
  onPageChange?: (page: string) => void;
}

export const TaskView: React.FC<TaskViewProps> = ({ onPageChange }) => {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '250px', borderRight: '1px solid #ccc' }}>
        <ProjectSidebar />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TaskHeader onNewTask={() => {}} />
        <TaskList />
      </div>
    </div>
  );
};