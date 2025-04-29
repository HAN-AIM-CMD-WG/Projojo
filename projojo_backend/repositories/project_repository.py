from typing import List, Optional, Dict, Any
from initDatabase import Db
from repositories.base import BaseRepository
from models.project import Project, ProjectCreation, BusinessProjects
import uuid
from datetime import datetime

class ProjectRepository(BaseRepository[Project]):
    def __init__(self):
        super().__init__(Project, "project")
    
    def get_by_id(self, id: str) -> Optional[Project]:
        # Escape any double quotes in the ID
        escaped_id = id.replace('"', '\\"')
        
        query = f"""
            match
                $project isa project,
                has name "{escaped_id}",
                has name $name,
                has description $description,
                has imagePath $imagePath,
                has createdAt $createdAt;
            fetch {{
                'name': $name,
                'description': $description,
                'imagePath': $imagePath,
                'createdAt': $createdAt
            }};
        """
        results = Db.read_transact(query)
        if not results:
            return None
        return self._map_to_model(results[0])
    
    def get_all(self) -> List[Project]:
        query = """
            match
                $p isa project,
                has name $name,
                has description $description,
                has imagePath $imagePath,
                has createdAt $createdAt;
            fetch {
                'name': $name,
                'description': $description,
                'imagePath': $imagePath,
                'createdAt': $createdAt
            };
        """
        results = Db.read_transact(query)
        return [self._map_to_model(result) for result in results]
    
    def get_projects_by_business(self, business_id: str) -> List[Project]:
        query = f"""
            match
                $business isa business, has name "{business_id}";
                $bp isa businessProjects (business: $business, project: $project);
                $project isa project,
                has name $name,
                has description $description,
                has imagePath $imagePath,
                has createdAt $createdAt;
            fetch {{
                'name': $name,
                'description': $description,
                'imagePath': $imagePath,
                'createdAt': $createdAt
            }};
        """
        results = Db.read_transact(query)
        projects = [self._map_to_model(result) for result in results]
        
        # Add business_id to each project
        for project in projects:
            project.business_id = business_id
            
        return projects
    
    def _map_to_model(self, result: Dict[str, Any]) -> Project:
        # Extract relevant information from the query result
        name = result.get("name", "")
        description = result.get("description", "")
        image_path = result.get("imagePath", "")
        created_at_str = result.get("createdAt", "")
        
        # Convert createdAt string to datetime
        created_at = datetime.fromisoformat(created_at_str) if created_at_str else datetime.now()
        
        return Project(
            id=name,  # Using name as the ID
            name=name,
            description=description,
            image_path=image_path,
            created_at=created_at
        )
    
    def get_project_creation(self, project_id: str) -> Optional[ProjectCreation]:
        query = f"""
            match
                $project isa project, has name "{project_id}";
                $pc isa creates,
                    has createdAt $createdAt,
                    (supervisor: $supervisor, project: $project);
                $supervisor isa supervisor, has email $email;
            fetch {{
                'email': $email,
                'createdAt': $createdAt
            }};
        """
        results = Db.read_transact(query)
        if not results:
            return None
            
        result = results[0]
        supervisor_email = result.get("email", "")
        created_at_str = result.get("createdAt", "")
        created_at = datetime.fromisoformat(created_at_str) if created_at_str else datetime.now()
        
        return ProjectCreation(
            project_id=project_id,
            supervisor_id=supervisor_email,
            created_at=created_at
        )
