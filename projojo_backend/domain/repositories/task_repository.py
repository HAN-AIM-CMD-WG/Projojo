from typing import Dict, Any
from db.initDatabase import Db
from exceptions import ItemRetrievalException
from .base import BaseRepository
from domain.models import Task, TaskSkill, TaskRegistration
import uuid
from datetime import datetime

class TaskRepository(BaseRepository[Task]):
    def __init__(self):
        super().__init__(Task, "task")
    
    def get_by_id(self, id: str) -> Task | None:
        # Escape any double quotes in the ID
        escaped_id = id.replace('"', '\\"')
        
        query = f"""
            match
                $task isa task,
                has name "{escaped_id}",
                has name $name,
                has description $description,
                has totalNeeded $totalNeeded,
                has createdAt $createdAt;
            fetch {{
                'name': $name,
                'description': $description,
                'totalNeeded': $totalNeeded,
                'createdAt': $createdAt
            }};
        """
        results = Db.read_transact(query)
        if not results:
            raise ItemRetrievalException(Task, f"Task with ID {id} not found.")
        return self._map_to_model(results[0])
    
    def get_all(self) -> list[Task]:
        query = """
            match
                $task isa task,
                has name $name,
                has description $description,
                has totalNeeded $totalNeeded,
                has createdAt $createdAt;
            fetch {
                'name': $name,
                'description': $description,
                'totalNeeded': $totalNeeded,
                'createdAt': $createdAt
            };
        """
        results = Db.read_transact(query)
        return [self._map_to_model(result) for result in results]
    
    def get_tasks_by_project(self, project_id: str) -> list[Task]:
        query = f"""
            match
                $project isa project, has name "{project_id}";
                $projectTask isa containsTask (project: $project, task: $task);
                $task isa task,
                has name $name,
                has description $description,
                has totalNeeded $totalNeeded,
                has createdAt $createdAt;
            fetch {{
                'name': $name,
                'description': $description,
                'totalNeeded': $totalNeeded,
                'createdAt': $createdAt
            }};
        """
        results = Db.read_transact(query)
        tasks = [self._map_to_model(result) for result in results]
        
        # Add project_id to each task
        for task in tasks:
            task.project_id = project_id
            
        return tasks
    
    def create(self, task: Task) -> Task:
        # Generate a creation timestamp
        created_at = datetime.now().isoformat()
        
        # Escape any double quotes in strings
        escaped_name = task.name.replace('"', '\\"')
        escaped_description = task.description.replace('"', '\\"')
        
        # Create the task
        task_query = f"""
            insert
                $task isa task,
                has name "{escaped_name}",
                has description "{escaped_description}",
                has totalNeeded {task.total_needed},
                has createdAt {created_at};
        """
        Db.write_transact(task_query)
        
        # If project_id is provided, create project-task relation
        if task.project_id:
            escaped_project_id = task.project_id.replace('"', '\\"')
            
            project_task_query = f"""
                match
                    $project isa project, has name "{escaped_project_id}";
                    $task isa task, has name "{escaped_name}";
                insert
                    $projectTask isa containsTask (project: $project, task: $task);
            """
            Db.write_transact(project_task_query)
        
        # Update the created_at in the returned task
        task.created_at = datetime.fromisoformat(created_at)
        return task
    
    def update(self, id: str, task: Task) -> Task | None:
        # First delete the old task
        # Escape any double quotes in the ID
        escaped_id = id.replace('"', '\\"')
        
        delete_query = f"""
            match
                $task isa task,
                has name "{escaped_id}";
            delete $task isa task;
        """
        Db.write_transact(delete_query)
        
        # Then create a new one with updated values
        return self.create(task)
    
    def delete(self, id: str) -> bool:
        # Escape any double quotes in the ID
        escaped_id = id.replace('"', '\\"')
        
        query = f"""
            match
                $task isa task,
                has name "{escaped_id}";
            delete $task isa task;
        """
        Db.write_transact(query)
        return True
    
    def _map_to_model(self, result: Dict[str, Any]) -> Task:
        # Extract relevant information from the query result
        name = result.get("name", "")
        description = result.get("description", "")
        total_needed = int(result.get("totalNeeded", 0))
        created_at_str = result.get("createdAt", "")
        
        # Convert createdAt string to datetime
        created_at = datetime.fromisoformat(created_at_str) if created_at_str else datetime.now()
        
        return Task(
            id=name,  # Using name as the ID
            name=name,
            description=description,
            total_needed=total_needed,
            created_at=created_at
        )
    

