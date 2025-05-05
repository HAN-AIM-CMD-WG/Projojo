from typing import List, Optional, Dict, Any
from db.initDatabase import Db
from exceptions import ItemRetrievalException
from .base import BaseRepository
from domain.models import Project, ProjectCreation, BusinessProjects
import uuid
from datetime import datetime

class ProjectRepository(BaseRepository[Project]):
    def __init__(self):
        super().__init__(Project, "project")
    
    def get_by_id(self, id: str) -> Optional[Project]:
        # Escape any double quotes in the ID
        
        query = f"""
            match
                $project isa project,
                has name "{id}",
                has name $name,
                has description $description,
                has imagePath $imagePath,
                has createdAt $createdAt;
            fetch {{
                'name': $name,
                'description': $description,
                'imagePath': $imagePath,
                'createdAt': $createdAt,
            }};
        """
        results = Db.read_transact(query)
        if not results:
            raise ItemRetrievalException(Project, f"Project with ID {id} not found.")
        return self._map_to_model(results[0])
    
    def get_all(self) -> List[Project]:
        query = """
            match
                $project isa project,
                has name $name,
                has description $description,
                has imagePath $imagePath,
                has createdAt $createdAt;
                $hasProjects isa hasProjects(business: $business, project: $project);
            fetch {
                'name': $name,
                'description': $description,
                'imagePath': $imagePath,
                'createdAt': $createdAt,
                'business': $business.name
            };
        """
        results = Db.read_transact(query)
        return [self._map_to_model(result) for result in results]
    
    def get_projects_by_business(self, business_id: str) -> List[Project]:
        query = f"""
            match
                $business isa business, has name "{business_id}";
                $hasProjects isa hasProjects (business: $business, project: $project);
                $project isa project,
                has name $name,
                has description $description,
                has imagePath $imagePath,
                has createdAt $createdAt;
            fetch {{
                'name': $name,
                'description': $description,
                'imagePath': $imagePath,
                'createdAt': $createdAt,
                'business': $business.name
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
        business = result.get("business", "")
        
        # Convert createdAt string to datetime
        created_at = datetime.fromisoformat(created_at_str) if created_at_str else datetime.now()
        
        return Project(
            id=name,  # Using name as the ID
            name=name,
            description=description,
            image_path=image_path,
            created_at=created_at,
            business_id=business
        )

    # Is not used
    def get_project_creation(self, project_id: str) -> Optional[ProjectCreation]:
        query = f"""
            match
                $project isa project, 
                has name "{project_id}";
                $creates isa creates( $supervisor, $project ),
                has createdAt $createdAt;
                $supervisor isa supervisor,
                has email $email;
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
    def create(self, project: ProjectCreation) -> ProjectCreation:
        print(project)
        project.created_at = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
        query = f"""
            match
                $business isa business,
                has name "{project.business_id}";
            insert 
                $project isa project,
                has name "{project.name}",
                has description "{project.description}",
                has imagePath "{project.image_path}",
                has createdAt {project.created_at};
                $hasProjects isa hasProjects($business, $project);
        """
        Db.write_transact(query)

        # Create the relationship with the supervisor
        query = f"""
            match
                $supervisor isa supervisor,
                has email "{project.supervisor_id}";
                $project isa project,
                has name "{project.name}";
            insert $creates isa creates($supervisor, $project),
                has createdAt {project.created_at};
        """
        Db.write_transact(query)

        return ProjectCreation(
            id=project.name,  # Using name as the ID
            name=project.name,
            description=project.description,
            image_path=project.image_path,
            created_at=project.created_at,
            business_id=project.business_id,
            supervisor_id=project.supervisor_id
        )