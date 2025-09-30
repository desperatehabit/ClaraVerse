"""
Clara Task Processor - Voice Command Integration

This module handles voice command processing and integrates with the existing
ClaraVerse backend services for task management, file operations, and more.
"""

import asyncio
import logging
import json
import re
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from datetime import datetime
import uuid

logger = logging.getLogger("clara-task-processor")

@dataclass
class VoiceCommand:
    """Represents a parsed voice command"""
    action: str
    entity: str
    parameters: Dict[str, Any]
    confidence: float = 1.0
    raw_text: str = ""

@dataclass
class TaskCommand:
    """Represents a task-related command"""
    operation: str  # create, update, complete, delete, list
    task_data: Dict[str, Any]
    priority: str = "medium"
    due_date: Optional[datetime] = None

class VoiceCommandParser:
    """Parse voice commands into structured actions"""

    def __init__(self):
        # Command patterns for natural language understanding
        self.task_patterns = {
            'create': [
                r'(?:create|add|make|new)\s+(?:a\s+)?task\s+(?:to\s+)?(.+)',
                r'(?:i\s+)?(?:need\s+to|want\s+to|have\s+to)\s+(.+)',
                r'(?:remind\s+me\s+to\s+)?(.+)',
                r'(?:schedule|plan)\s+(?:to\s+)?(.+)'
            ],
            'complete': [
                r'(?:complete|finish|done|finished)\s+(?:task\s+)?(.+)',
                r'(?:mark\s+)?(.+)\s+(?:as\s+)?(?:complete|done|finished)',
                r'i(?:\'ve|\s+have)\s+(?:completed|finished|done)\s+(.+)'
            ],
            'list': [
                r'(?:show|list|display|get)\s+(?:my\s+)?tasks?',
                r'what\s+(?:do\s+i\s+)?(?:need\s+to\s+)?(?:do|complete)',
                r'(?:what\s+are\s+)?my\s+(?:pending|active|current)\s+tasks?'
            ],
            'delete': [
                r'(?:delete|remove|cancel)\s+(?:task\s+)?(.+)',
                r'(?:get\s+rid\s+of|eliminate)\s+(.+)'
            ],
            'update': [
                r'(?:update|modify|change)\s+(?:task\s+)?(.+)',
                r'(?:set|make)\s+(.+)\s+(?:to\s+)?(.+)'
            ]
        }

        self.time_patterns = [
            r'(?:by|before|until)\s+(tomorrow|next\s+week|friday|end\s+of\s+day)',
            r'(?:in|within)\s+(\d+)\s+(hours?|days?|weeks?|months?)',
            r'(?:at|on)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)',
        ]

    def parse_command(self, text: str) -> VoiceCommand:
        """Parse voice command text into structured command"""
        text = text.lower().strip()
        original_text = text

        # Try to match task patterns
        for operation, patterns in self.task_patterns.items():
            for pattern in patterns:
                match = re.search(pattern, text)
                if match:
                    entity = match.group(1) if len(match.groups()) >= 1 else ""
                    entity = entity.strip()

                    # Extract additional parameters
                    parameters = self._extract_parameters(text, operation, entity)

                    return VoiceCommand(
                        action=operation,
                        entity="task",
                        parameters={
                            "operation": operation,
                            "description": entity,
                            **parameters
                        },
                        raw_text=original_text
                    )

        # Default fallback
        return VoiceCommand(
            action="unknown",
            entity="unknown",
            parameters={"raw_text": original_text},
            raw_text=original_text
        )

    def _extract_parameters(self, text: str, operation: str, entity: str) -> Dict[str, Any]:
        """Extract additional parameters from command text"""
        parameters = {}

        # Extract time references
        for pattern in self.time_patterns:
            match = re.search(pattern, text)
            if match:
                parameters["time_reference"] = match.group(0)

        # Extract priority indicators
        if any(word in text for word in ['urgent', 'asap', 'immediately', 'high priority']):
            parameters["priority"] = "high"
        elif any(word in text for word in ['low', 'whenever', 'someday']):
            parameters["priority"] = "low"
        else:
            parameters["priority"] = "medium"

        # Extract context clues
        if "work" in text or "job" in text:
            parameters["context"] = "work"
        elif "personal" in text:
            parameters["context"] = "personal"

        return parameters

class TaskManager:
    """Interface to ClaraVerse task management system"""

    def __init__(self):
        # This would integrate with the existing task database
        self.tasks_db = {}  # Placeholder for actual database integration

    async def create_task(self, description: str, priority: str = "medium",
                         due_date: Optional[datetime] = None) -> str:
        """Create a new task"""
        task_id = str(uuid.uuid4())

        task = {
            "id": task_id,
            "description": description,
            "priority": priority,
            "status": "pending",
            "created_at": datetime.now(),
            "due_date": due_date,
            "voice_created": True
        }

        self.tasks_db[task_id] = task

        # In real implementation, save to actual database
        logger.info(f"Created task: {task_id} - {description}")

        return f"Task created: {description}"

    async def complete_task(self, task_identifier: str) -> str:
        """Mark a task as completed"""
        # Find task by ID or description
        task = self._find_task(task_identifier)

        if not task:
            return f"Task not found: {task_identifier}"

        task["status"] = "completed"
        task["completed_at"] = datetime.now()

        logger.info(f"Completed task: {task['id']} - {task['description']}")
        return f"Marked as completed: {task['description']}"

    async def list_tasks(self, status_filter: Optional[str] = None) -> str:
        """List tasks with optional status filter"""
        tasks = list(self.tasks_db.values())

        if status_filter:
            tasks = [t for t in tasks if t["status"] == status_filter]

        if not tasks:
            return "No tasks found."

        # Sort by priority and creation date
        priority_order = {"high": 0, "medium": 1, "low": 2}
        tasks.sort(key=lambda t: (priority_order.get(t["priority"], 1), t["created_at"]))

        task_list = []
        for task in tasks:
            status_icon = "✅" if task["status"] == "completed" else "⏳"
            task_list.append(f"{status_icon} {task['description']} ({task['priority']} priority)")

        return f"You have {len(tasks)} tasks:\n" + "\n".join(task_list)

    async def delete_task(self, task_identifier: str) -> str:
        """Delete a task"""
        task = self._find_task(task_identifier)

        if not task:
            return f"Task not found: {task_identifier}"

        task_id = task["id"]
        del self.tasks_db[task_id]

        logger.info(f"Deleted task: {task_id} - {task['description']}")
        return f"Deleted task: {task['description']}"

    def _find_task(self, identifier: str) -> Optional[Dict[str, Any]]:
        """Find task by ID or description"""
        # Try exact ID match first
        if identifier in self.tasks_db:
            return self.tasks_db[identifier]

        # Try partial description match
        for task in self.tasks_db.values():
            if identifier.lower() in task["description"].lower():
                return task

        return None

class ClaraTaskProcessor:
    """Main task processor for voice commands"""

    def __init__(self):
        self.parser = VoiceCommandParser()
        self.task_manager = TaskManager()

    async def process_voice_command(self, command_text: str) -> str:
        """Process a voice command and return response"""
        try:
            # Parse the command
            command = self.parser.parse_command(command_text)

            if command.action == "unknown":
                return self._handle_unknown_command(command_text)

            # Process based on action
            if command.entity == "task":
                return await self._process_task_command(command)

            return f"I understand you want to {command.action} {command.entity}, but that feature isn't fully implemented yet."

        except Exception as e:
            logger.error(f"Error processing voice command '{command_text}': {e}")
            return f"Sorry, I encountered an error processing your request: {str(e)}"

    async def _process_task_command(self, command: VoiceCommand) -> str:
        """Process task-related commands"""
        operation = command.parameters.get("operation")
        description = command.parameters.get("description", "")

        if not description:
            return "I need more details about what task you'd like me to create or manage."

        if operation == "create":
            priority = command.parameters.get("priority", "medium")
            return await self.task_manager.create_task(description, priority)

        elif operation == "complete":
            return await self.task_manager.complete_task(description)

        elif operation == "list":
            return await self.task_manager.list_tasks()

        elif operation == "delete":
            return await self.task_manager.delete_task(description)

        elif operation == "update":
            return f"Task updates aren't implemented yet. I can create, complete, list, and delete tasks."

        return f"Unknown task operation: {operation}"

    def _handle_unknown_command(self, command_text: str) -> str:
        """Handle commands that couldn't be parsed"""
        # Try to provide helpful suggestions
        if any(word in command_text.lower() for word in ["task", "todo", "remind"]):
            return "I can help you manage tasks. Try saying 'create a task to [description]' or 'show my tasks'."

        if any(word in command_text.lower() for word in ["file", "document", "open", "read"]):
            return "I can help with file operations. Try saying 'open [filename]' or 'read [document]'."

        if any(word in command_text.lower() for word in ["browser", "web", "search", "google"]):
            return "I can help with web browsing. Try saying 'open [website]' or 'search for [topic]'."

        return "I'm not sure what you'd like me to do. I can help with tasks, files, browsing, and applications. Try being more specific!"

    def get_available_commands(self) -> List[str]:
        """Get list of available voice commands"""
        return [
            "Task Management:",
            "  • 'create a task to [description]' - Create new task",
            "  • 'complete [task description]' - Mark task as done",
            "  • 'show my tasks' - List all tasks",
            "  • 'delete [task description]' - Remove task",
            "",
            "File Operations:",
            "  • 'read [filename]' - Read file contents",
            "  • 'write [content] to [filename]' - Create/modify file",
            "  • 'list files' - Show files in directory",
            "",
            "Web Browsing:",
            "  • 'open [website]' - Navigate to website",
            "  • 'search for [topic]' - Search the web",
            "",
            "Applications:",
            "  • 'launch [app name]' - Start application",
            "  • 'close [app name]' - Close application"
        ]

# Integration with existing backend services
class VoiceServiceIntegrator:
    """Integrate voice commands with existing ClaraVerse services"""

    def __init__(self):
        self.task_processor = ClaraTaskProcessor()

    async def process_voice_request(self, request_text: str) -> str:
        """Process voice request and return response"""
        return await self.task_processor.process_voice_command(request_text)

    def get_service_status(self) -> Dict[str, Any]:
        """Get status of integrated services"""
        return {
            "task_management": True,
            "file_operations": False,  # Not implemented yet
            "browser_automation": False,  # Not implemented yet
            "memory_integration": False,  # Not implemented yet
        }

# Standalone functions for FastAPI integration
async def process_voice_command_standalone(command: str) -> str:
    """Standalone function to process voice commands"""
    processor = ClaraTaskProcessor()
    return await processor.process_voice_command(command)

def get_voice_help() -> str:
    """Get help text for voice commands"""
    processor = ClaraTaskProcessor()
    commands = processor.get_available_commands()
    return "\n".join(commands)