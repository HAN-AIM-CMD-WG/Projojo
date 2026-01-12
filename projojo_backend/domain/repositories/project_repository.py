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
        # Escape any double quotes in the ID

        query = f"""
            match
                $project isa project,
                has id "{id}",
                has name $name,
                has description $description,
                has imagePath $imagePath,
                has createdAt $createdAt;
                $hasProjects isa hasProjects(business: $business, project: $project);
                $business has id $business_id;
            fetch {{
                'id': "{id}",
                'name': $name,
                'description': $description,
                'imagePath': $imagePath,
                'location': $project.location,
                'createdAt': $createdAt,
                'business': $business_id
            }};
        """
        results = Db.read_transact(query)
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
        query = f"""
            match
                $business isa business, has id "{business_id}";
                $hasProjects isa hasProjects (business: $business, project: $project);
                $project isa project,
                has id $id,
                has name $name,
                has description $description,
                has imagePath $imagePath,
                has createdAt $createdAt;
            fetch {{
                'id': $id,
                'name': $name,
                'description': $description,
                'imagePath': $imagePath,
                'location': $project.location,
                'createdAt': $createdAt,
                'business': "{business_id}"
            }};
        """
        results = Db.read_transact(query)
        projects = [self._map_to_model(result) for result in results]

        # Add business_id to each project
        for project in projects:
            project.business_id = business_id

        return projects

    def get_business_by_project(self, project_id: str) -> dict | None:
        query = f"""
            match
                $project isa project,
                has id "{project_id}";
                $hasProjects isa hasProjects(business: $business, project: $project);
                $business has id $business_id;
            fetch {{
                'id': $business_id,
                'name': $business.name,
                'description': $business.description,
                'image_path': $business.imagePath,
                'location': $business.location,
            }};
        """
        results = Db.read_transact(query)
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
        query = f"""
            match
                $business isa business, has id "{business_id}";
                $project isa project, has name "{project_name}";
                $hasProjects isa hasProjects (business: $business, project: $project);
            fetch {{
                'name': $project.name
            }};
        """
        results = Db.read_transact(query)
        return len(results) > 0

    # Is not used
    def get_project_creation(self, project_id: str) -> ProjectCreation | None:
        query = f"""
            match
                $project isa project,
                has id "{project_id}";
                $creates isa creates( $supervisor, $project ),
                has createdAt $createdAt;
                $supervisor isa supervisor,
                has id $supervisor_id;
            fetch {{
                'id': $supervisor_id,
                'createdAt': $createdAt
            }};
        """
        results = Db.read_transact(query)
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
        created_at = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")

        # Escape strings
        escaped_name = project.name.replace('"', '\\"')
        escaped_description = project.description.replace('"', '\\"')
        escaped_image_path = project.image_path.replace('"', '\\"')
        escaped_business_id = project.business_id.replace('"', '\\"')
        escaped_location = (project.location.replace('"', '\\"') if getattr(project, "location", None) else "")

        location_clause = f',\n                has location "{escaped_location}"' if escaped_location != "" else ""

        query = f"""
            match
                $business isa business,
                has id "{escaped_business_id}";
            insert
                $project isa project,
                has id "{id}",
                has name "{escaped_name}",
                has description "{escaped_description}",
                has imagePath "{escaped_image_path}"{location_clause},
                has createdAt {created_at};
                $hasProjects isa hasProjects($business, $project);
        """
        Db.write_transact(query)

        # Create the relationship with the supervisor
        escaped_supervisor_id = project.supervisor_id.replace('"', '\\"')

        query = f"""
            match
                $supervisor isa supervisor,
                has id "{escaped_supervisor_id}";
                $project isa project,
                has id "{id}";
            insert $creates isa creates($supervisor, $project),
                has createdAt {created_at};
        """
        Db.write_transact(query)

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

    def update(self, project_id: str, name: str, description: str, location: str | None, image_filename: str = None) -> None:
        """
        Update project attributes. image_filename is optional.
        """
        escaped_project_id = project_id.replace('"', '\\"')
        escaped_name = name.replace('"', '\\"')
        escaped_description = description.replace('"', '\\"')
        escaped_location = (location.replace('"', '\\"') if location is not None else None)

        update_clauses = [
            f'$project has name "{escaped_name}";',
            f'$project has description "{escaped_description}";',
        ]

        if escaped_location is not None:
            update_clauses.append(f'$project has location "{escaped_location}";')

        if image_filename is not None:
            update_clauses.append(f'$project has imagePath "{image_filename}";')

        query = f"""
            match
                $project isa project, has id "{escaped_project_id}";
            update
                {' '.join(update_clauses)}
        """
        Db.write_transact(query)
