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
                'business': $business_id,
                'start_date': [$project.startDate],
                'end_date': [$project.endDate]
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
                'business': $business_id,
                'start_date': [$project.startDate],
                'end_date': [$project.endDate]
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
                'business': $business_id,
                'start_date': [$project.startDate],
                'end_date': [$project.endDate],
                'tasks': [
                    match
                        $containsTask isa containsTask (project: $project, task: $task);
                        $task has id $task_id, has name $task_name;
                    fetch {
                        'id': $task_id,
                        'name': $task_name
                    };
                ]
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
        tasks_data = result.get("tasks", [])
        
        # Extract optional date fields (returned as arrays)
        start_date_list = result.get("start_date", [])
        end_date_list = result.get("end_date", [])
        start_date = start_date_list[0] if start_date_list else None
        end_date = end_date_list[0] if end_date_list else None

        # Convert createdAt string to datetime
        created_at = (
            datetime.fromisoformat(created_at_str) if created_at_str else datetime.now()
        )

        # Map tasks if present (simplified Task objects with just id and name)
        tasks = None
        if tasks_data:
            from domain.models import Task
            tasks = [
                Task(
                    id=t.get("id", ""),
                    name=t.get("name", ""),
                    description="",
                    total_needed=0,
                    project_id=id,
                    created_at=created_at  # Use project's created_at as fallback
                )
                for t in tasks_data
            ]

        return Project(
            id=id,
            name=name,
            description=description,
            image_path=image_path,
            location=location,
            created_at=created_at,
            business_id=business,
            tasks=tasks,
            start_date=start_date,
            end_date=end_date,
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
        start_date = getattr(project, "start_date", None)
        end_date = getattr(project, "end_date", None)

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
                has createdAt ~created_at,
                has startDate ~start_date,
                has endDate ~end_date;
                $hasProjects isa hasProjects($business, $project);
        """
        Db.write_transact(query, {
            "business_id": project.business_id,
            "id": id,
            "name": project.name,
            "description": project.description,
            "image_path": project.image_path,
            "location": location_value,
            "created_at": created_at,
            "start_date": start_date,
            "end_date": end_date
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
            start_date=start_date,
            end_date=end_date,
        )
    def update(self, project_id: str, name: str, description: str, location: str | None, image_filename: str | None = None, start_date: datetime | None = None, end_date: datetime | None = None) -> None:
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
        
        # Handle optional date fields
        if start_date is not None:
            update_clauses.append('$project has startDate ~start_date;')
            params['start_date'] = start_date
            
        if end_date is not None:
            update_clauses.append('$project has endDate ~end_date;')
            params['end_date'] = end_date
            
        query = f'''
            match
                $project isa project, has id ~project_id;
            update
                {' '.join(update_clauses)}
        '''

        Db.write_transact(query, params)

    def check_project_owner(self, project_id: str, supervisor_id: str) -> bool:
        """Check if a supervisor owns (created) a project."""
        query = """
            match
                $project isa project, has id ~project_id;
                $supervisor isa supervisor, has id ~supervisor_id;
                $creates isa creates($supervisor, $project);
            fetch {
                'exists': true
            };
        """
        results = Db.read_transact(query, {"project_id": project_id, "supervisor_id": supervisor_id})
        return len(results) > 0

    def get_students_by_project(self, project_id: str) -> list[dict]:
        """Get all students with registrations for tasks of this project."""
        query = """
            match
                $project isa project, has id ~project_id;
                $containsTask isa containsTask(project: $project, task: $task);
                $task has id $task_id, has name $task_name;
                $registration isa registersForTask(student: $student, task: $task);
                $student has id $student_id, 
                    has fullName $student_name,
                    has email $student_email;
            fetch {
                'student_id': $student_id,
                'student_name': $student_name,
                'student_email': $student_email,
                'task_id': $task_id,
                'task_name': $task_name,
                'is_accepted': [$registration.isAccepted],
                'completed_at': [$registration.completedAt]
            };
        """
        results = Db.read_transact(query, {"project_id": project_id})
        
        students = []
        for r in results:
            is_accepted_list = r.get("is_accepted", [])
            completed_at_list = r.get("completed_at", [])
            students.append({
                "student_id": r.get("student_id", ""),
                "student_name": r.get("student_name", ""),
                "student_email": r.get("student_email", ""),
                "task_id": r.get("task_id", ""),
                "task_name": r.get("task_name", ""),
                "is_accepted": is_accepted_list[0] if is_accepted_list else None,
                "is_completed": len(completed_at_list) > 0 and completed_at_list[0] is not None
            })
        return students

    def get_completed_tasks_by_project(self, project_id: str) -> list[dict]:
        """Get all completed task registrations for a project with full details for portfolio snapshots."""
        query = """
            match
                $project isa project, has id ~project_id,
                    has name $project_name,
                    has description $project_description;
                $hasProjects isa hasProjects(business: $business, project: $project);
                $business has id $business_id,
                    has name $business_name,
                    has description $business_description,
                    has location $business_location;
                $containsTask isa containsTask(project: $project, task: $task);
                $task has id $task_id, 
                    has name $task_name,
                    has description $task_description;
                $registration isa registersForTask(student: $student, task: $task),
                    has completedAt $completed_at;
                $student has id $student_id,
                    has fullName $student_name,
                    has email $student_email;
            fetch {
                'student_id': $student_id,
                'student_name': $student_name,
                'student_email': $student_email,
                'task_id': $task_id,
                'task_name': $task_name,
                'task_description': $task_description,
                'project_id': ~project_id,
                'project_name': $project_name,
                'project_description': $project_description,
                'business_id': $business_id,
                'business_name': $business_name,
                'business_description': $business_description,
                'business_location': $business_location,
                'completed_at': $completed_at,
                'requested_at': [$registration.requestedAt],
                'accepted_at': [$registration.acceptedAt],
                'started_at': [$registration.startedAt],
                'skills': [
                    match
                        $requiresSkill isa requiresSkill(task: $task, skill: $skill);
                        $skill has name $skill_name;
                    fetch {
                        'name': $skill_name
                    };
                ]
            };
        """
        results = Db.read_transact(query, {"project_id": project_id})
        
        completed_tasks = []
        for r in results:
            skills = [s.get("name", "") for s in r.get("skills", [])]
            requested_at = r.get("requested_at", [])
            accepted_at = r.get("accepted_at", [])
            started_at = r.get("started_at", [])
            
            completed_tasks.append({
                "student_id": r.get("student_id", ""),
                "student_name": r.get("student_name", ""),
                "student_email": r.get("student_email", ""),
                "task_id": r.get("task_id", ""),
                "task_name": r.get("task_name", ""),
                "task_description": r.get("task_description", ""),
                "project_id": r.get("project_id", ""),
                "project_name": r.get("project_name", ""),
                "project_description": r.get("project_description", ""),
                "business_id": r.get("business_id", ""),
                "business_name": r.get("business_name", ""),
                "business_description": r.get("business_description", ""),
                "business_location": r.get("business_location", ""),
                "completed_at": r.get("completed_at", ""),
                "requested_at": requested_at[0] if requested_at else None,
                "accepted_at": accepted_at[0] if accepted_at else None,
                "started_at": started_at[0] if started_at else None,
                "skills": skills
            })
        return completed_tasks

    def archive_project(self, project_id: str) -> None:
        """Archive a project (set isArchived to true)."""
        # First check if isArchived already exists and delete it
        delete_query = """
            match
                $project isa project, has id ~project_id, has isArchived $val;
            delete
                $project has $val;
        """
        try:
            Db.write_transact(delete_query, {"project_id": project_id})
        except Exception:
            pass  # No existing isArchived attribute

        # Now insert isArchived = true
        insert_query = """
            match
                $project isa project, has id ~project_id;
            insert
                $project has isArchived true;
        """
        Db.write_transact(insert_query, {"project_id": project_id})

    def restore_project(self, project_id: str) -> None:
        """Restore an archived project (remove isArchived attribute)."""
        delete_query = """
            match
                $project isa project, has id ~project_id, has isArchived $val;
            delete
                $project has $val;
        """
        Db.write_transact(delete_query, {"project_id": project_id})

    def delete_project(self, project_id: str) -> None:
        """
        Hard delete a project and all its associated data.
        Order: registrations -> tasks -> creates relation -> hasProjects relation -> project
        """
        # 1. Delete all registrations for tasks in this project
        delete_registrations = """
            match
                $project isa project, has id ~project_id;
                $containsTask isa containsTask(project: $project, task: $task);
                $registration isa registersForTask(task: $task);
            delete
                $registration isa registersForTask;
        """
        try:
            Db.write_transact(delete_registrations, {"project_id": project_id})
        except Exception:
            pass  # No registrations

        # 2. Delete all requiresSkill relations for tasks
        delete_requires_skill = """
            match
                $project isa project, has id ~project_id;
                $containsTask isa containsTask(project: $project, task: $task);
                $requiresSkill isa requiresSkill(task: $task);
            delete
                $requiresSkill isa requiresSkill;
        """
        try:
            Db.write_transact(delete_requires_skill, {"project_id": project_id})
        except Exception:
            pass  # No skills

        # 3. Delete containsTask relations and tasks
        delete_contains_task = """
            match
                $project isa project, has id ~project_id;
                $containsTask isa containsTask(project: $project, task: $task);
            delete
                $containsTask isa containsTask;
        """
        try:
            Db.write_transact(delete_contains_task, {"project_id": project_id})
        except Exception:
            pass  # No tasks

        # 4. Delete tasks themselves
        delete_tasks = """
            match
                $project isa project, has id ~project_id;
                $containsTask isa containsTask(project: $project, task: $task);
            delete
                $task isa task;
        """
        try:
            Db.write_transact(delete_tasks, {"project_id": project_id})
        except Exception:
            pass  # No tasks

        # 5. Delete creates relation
        delete_creates = """
            match
                $project isa project, has id ~project_id;
                $creates isa creates(project: $project);
            delete
                $creates isa creates;
        """
        try:
            Db.write_transact(delete_creates, {"project_id": project_id})
        except Exception:
            pass  # No creates relation

        # 6. Delete hasProjects relation
        delete_has_projects = """
            match
                $project isa project, has id ~project_id;
                $hasProjects isa hasProjects(project: $project);
            delete
                $hasProjects isa hasProjects;
        """
        Db.write_transact(delete_has_projects, {"project_id": project_id})

        # 7. Finally delete the project itself
        delete_project = """
            match
                $project isa project, has id ~project_id;
            delete
                $project isa project;
        """
        Db.write_transact(delete_project, {"project_id": project_id})

    def is_archived(self, project_id: str) -> bool:
        """Check if a project is archived."""
        query = """
            match
                $project isa project, has id ~project_id, has isArchived true;
            fetch {
                'archived': true
            };
        """
        results = Db.read_transact(query, {"project_id": project_id})
        return len(results) > 0
