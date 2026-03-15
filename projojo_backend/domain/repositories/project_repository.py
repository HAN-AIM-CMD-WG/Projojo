from typing import Any
from db.initDatabase import Db
from exceptions import ItemRetrievalException
from .base import BaseRepository
from domain.models import Project, ProjectCreation
from datetime import datetime
from service.uuid_service import generate_uuid


class ProjectRepository(BaseRepository[Project]):
    def __init__(self):
        super().__init__(Project, "project")

    def get_by_id(self, id: str) -> Project | None:
        query = """
            match
                $project isa project,
                has id ~id,
                has id $id,
                has name $name,
                has description $description,
                has imagePath $imagePath,
                has createdAt $createdAt;
                $hasProjects isa hasProjects(business: $business, project: $project);
                $business has id $business_id;
            fetch {
                'id': $id,
                'name': $name,
                'description': $description,
                'imagePath': $imagePath,
                'location': $project.location,
                'createdAt': $createdAt,
                'business': $business_id
            };
        """
        results = Db.read_transact(query, {"id": id})
        if not results:
            raise ItemRetrievalException(Project, f"Project with ID {id} not found.")
        return self._map_to_model(results[0])

    def get_all(self) -> list[Project]:
        query = """
            match
                $project isa project,
                has id $id,
                has name $name,
                has description $description,
                has imagePath $imagePath,
                has createdAt $createdAt;
                $hasProjects isa hasProjects(business: $business, project: $project);
                $business has id $business_id;
            fetch {
                'id': $id,
                'name': $name,
                'description': $description,
                'imagePath': $imagePath,
                'location': $project.location,
                'createdAt': $createdAt,
                'business': $business_id
            };
        """
        results = Db.read_transact(query)
        return [self._map_to_model(result) for result in results]

    def get_projects_by_business(self, business_id: str) -> list[Project]:
        query = """
            match
                $business isa business,
                has id ~business_id,
                has id $business_id;
                $hasProjects isa hasProjects (business: $business, project: $project);
                $project isa project,
                has id $id,
                has name $name,
                has description $description,
                has imagePath $imagePath,
                has createdAt $createdAt;
            fetch {
                'id': $id,
                'name': $name,
                'description': $description,
                'imagePath': $imagePath,
                'location': $project.location,
                'createdAt': $createdAt,
                'business': $business_id
            };
        """
        results = Db.read_transact(query, {"business_id": business_id})
        projects = [self._map_to_model(result) for result in results]

        # Add business_id to each project
        for project in projects:
            project.business_id = business_id

        return projects

    def get_business_by_project(self, project_id: str) -> dict | None:
        query = """
            match
                $project isa project,
                has id ~project_id;
                $hasProjects isa hasProjects(business: $business, project: $project);
                $business has id $business_id;
            fetch {
                'id': $business_id,
                'name': $business.name,
                'description': $business.description,
                'image_path': $business.imagePath,
                'location': $business.location,
            };
        """
        results = Db.read_transact(query, {"project_id": project_id})
        if not results:
            return None
        return results[0]

    def _map_to_model(self, result: dict[str, Any]) -> Project:
        # Extract relevant information from the query result
        id = result.get("id", "")
        name = result.get("name", "")
        description = result.get("description", "")
        image_path = result.get("imagePath", "")
        location = result.get("location", "")
        created_at_str = result.get("createdAt", "")
        business = result.get("business", "")

        # Convert createdAt string to datetime
        created_at = (
            datetime.fromisoformat(created_at_str) if created_at_str else datetime.now()
        )

        return Project(
            id=id,
            name=name,
            description=description,
            image_path=image_path,
            location=location,
            created_at=created_at,
            business_id=business,
        )

    def check_project_exists(self, project_name: str, business_id: str) -> bool:
        query = """
            match
                $business isa business, has id ~business_id;
                $project isa project, has name ~project_name;
                $hasProjects isa hasProjects (business: $business, project: $project);
            fetch {
                'name': $project.name
            };
        """
        results = Db.read_transact(query, {"business_id": business_id, "project_name": project_name})
        return len(results) > 0

    # Is not used
    def get_project_creation(self, project_id: str) -> ProjectCreation | None:
        query = """
            match
                $project isa project,
                has id ~project_id;
                $creates isa creates( $supervisor, $project ),
                has createdAt $createdAt;
                $supervisor isa supervisor,
                has id $supervisor_id;
            fetch {
                'id': $supervisor_id,
                'createdAt': $createdAt
            };
        """
        results = Db.read_transact(query, {"project_id": project_id})
        if not results:
            return None

        result = results[0]
        supervisor_id = result.get("id", "")
        created_at_str = result.get("createdAt", "")
        created_at = (
            datetime.fromisoformat(created_at_str) if created_at_str else datetime.now()
        )

        return ProjectCreation(
            project_id=project_id, supervisor_id=supervisor_id, created_at=created_at
        )

    def create(self, project: ProjectCreation) -> ProjectCreation:
        id = generate_uuid()
        created_at = datetime.now()
        # Optional location: None removes clause via build_query
        location_value = project.location.strip() if getattr(project, "location", None) else None

        query = """
            match
                $business isa business,
                has id ~business_id;
            insert
                $project isa project,
                has id ~id,
                has name ~name,
                has description ~description,
                has imagePath ~image_path,
                has location ~location,
                has createdAt ~created_at;
                $hasProjects isa hasProjects($business, $project);
        """
        Db.write_transact(query, {
            "business_id": project.business_id,
            "id": id,
            "name": project.name,
            "description": project.description,
            "image_path": project.image_path,
            "location": location_value,
            "created_at": created_at
        })

        # Create the relationship with the supervisor
        query = """
            match
                $supervisor isa supervisor,
                has id ~supervisor_id;
                $project isa project,
                has id ~project_id;
            insert $creates isa creates($supervisor, $project),
                has createdAt ~created_at;
        """
        Db.write_transact(query, {
            "supervisor_id": project.supervisor_id,
            "project_id": id,
            "created_at": created_at
        })

        return ProjectCreation(
            id=id,
            name=project.name,
            description=project.description,
            image_path=project.image_path,
            created_at=created_at,
            business_id=project.business_id,
            location=project.location,
            supervisor_id=project.supervisor_id,
        )
    def update(self, project_id: str, name: str, description: str, location: str | None, image_filename: str | None = None) -> None:
        update_clauses = [
            '$project has name ~name;',
            '$project has description ~description;',
            '$project has location ~location;',
        ]

        params = {
            'project_id': project_id,
            'name': name,
            'description': description,
            'location': location,
        }

        if image_filename:
            update_clauses.append('$project has imagePath ~image_filename;')
            params['image_filename'] = image_filename

        query = f'''
            match
                $project isa project, has id ~project_id;
            update
                {' '.join(update_clauses)}
        '''

        Db.write_transact(query, params)
