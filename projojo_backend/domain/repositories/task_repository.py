from db.initDatabase import Db
from exceptions import ItemRetrievalException
from .base import BaseRepository
from domain.models import Task
from datetime import datetime
from service.uuid_service import generate_uuid

class TaskRepository(BaseRepository[Task]):
    def __init__(self):
        super().__init__(Task, "task")

    def get_by_id(self, id: str) -> Task | None:
        query = """
            match
                $task isa task,
                has id ~id,
                has name $name,
                has description $description,
                has totalNeeded $totalNeeded,
                has createdAt $createdAt;
            fetch {
                'id': $task.id,
                'name': $name,
                'description': $description,
                'total_needed': $totalNeeded,
                'created_at': $createdAt,
                'total_registered': (
                    match
                        $registration isa registersForTask (task: $task, student: $student);
                    not { $registration has isAccepted $any_value; };
                    return count;
                ),
                'total_accepted': (
                    match
                        $registration isa registersForTask (task: $task, student: $student),
                        has isAccepted true;
                    return count;
                )
            };
        """
        results = Db.read_transact(query, {"id": id})
        if not results:
            raise ItemRetrievalException(Task, f"Taak met ID {id} niet gevonden")

        # Convert to Task using Pydantic's model_validate
        return Task.model_validate(results[0])

    def get_all(self) -> list[Task]:
        query = """
            match
                $task isa task,
                has id $id,
                has name $name,
                has description $description,
                has totalNeeded $totalNeeded,
                has createdAt $createdAt;
            fetch {
                'id': $id,
                'name': $name,
                'description': $description,
                'total_needed': $totalNeeded,
                'created_at': $createdAt,
                'total_registered': (
                    match
                        $registration isa registersForTask (task: $task, student: $student);
                    not { $registration has isAccepted $any_value; };
                    return count;
                ),
                'total_accepted': (
                    match
                        $registration isa registersForTask (task: $task, student: $student),
                        has isAccepted true;
                    return count;
                )
            };
        """
        results = Db.read_transact(query)
        return [Task.model_validate(result) for result in results]

    def get_tasks_by_project(self, project_id: str) -> list[Task]:
        query = """
            match
                $project isa project,
                has id ~project_id,
                has id $project_id;
                $projectTask isa containsTask (project: $project, task: $task);
                $task isa task,
                has id $id,
                has name $name,
                has description $description,
                has totalNeeded $totalNeeded,
                has createdAt $createdAt;
            fetch {
                'id': $id,
                'name': $name,
                'description': $description,
                'total_needed': $totalNeeded,
                'created_at': $createdAt,
                'project_id': $project_id,
                'total_registered': (
                    match
                        $registration isa registersForTask (task: $task, student: $student);
                    not { $registration has isAccepted $any_value; };
                    return count;
                ),
                'total_accepted': (
                    match
                        $registration isa registersForTask (task: $task, student: $student),
                        has isAccepted true;
                    return count;
                )
            };
        """
        results = Db.read_transact(query, {"project_id": project_id})
        tasks = [Task.model_validate(result) for result in results]

        return tasks

    def create(self, task: Task) -> Task:
        if not task.project_id:
            raise ValueError("De taak moet bij een bestaand project horen.")

        id = generate_uuid()
        # Generate a creation timestamp
        created_at = datetime.now()

        validation_query = """
            match
                $project isa project, has id ~project_id, has name $project_name;
            fetch {
                'exists': true,
                'project_name': $project_name,
                'duplicate_tasks': [
                    match
                        $existingTask isa task, has name ~task_name;
                        $projectTask isa containsTask (project: $project, task: $existingTask);
                    fetch { 'exists': true };
                ]
            };
        """
        validation_results = Db.read_transact(validation_query, {
            "project_id": task.project_id,
            "task_name": task.name
        })

        if not validation_results:
            raise ItemRetrievalException("Project", f"Project met ID '{task.project_id}' niet gevonden.")

        # Check if duplicate tasks were found
        if validation_results[0].get('duplicate_tasks'):
            project_name = validation_results[0].get('project_name')
            raise ValueError(f"Er bestaat al een taak met de naam '{task.name}' in project '{project_name}'.")

        query = """
            match
                $project isa project, has id ~project_id;
            insert
                $task isa task,
                has id ~id,
                has name ~name,
                has description ~description,
                has totalNeeded ~total_needed,
                has createdAt ~created_at;
                $projectTask isa containsTask (project: $project, task: $task);
        """
        Db.write_transact(query, {
            "project_id": task.project_id,
            "id": id,
            "name": task.name,
            "description": task.description,
            "total_needed": task.total_needed,
            "created_at": created_at
        })

        # Update the task with the generated ID and created_at
        task.id = id
        task.created_at = created_at
        return task

    def get_registrations(self, task_id: str) -> list[dict]:
        """
        Get all registrations for a task with student details and skills
        """
        query = """
            match
                $task isa task, has id ~task_id;
                $student isa student, has id $student_id;
                $registration isa registersForTask (student: $student, task: $task);
            not { $registration has isAccepted $any_value; };
            fetch {
                'reason': $registration.description,
                'student': {
                    'id': $student_id,
                    'full_name': $student.fullName,
                    'skills': [
                        match
                            $hasSkill isa hasSkill (student: $student, skill: $skill);
                        fetch {
                            'id': $skill.id,
                            'name': $skill.name,
                            'is_pending': $skill.isPending,
                            'created_at': $skill.createdAt,
                            'description': $hasSkill.description
                        };
                    ]
                }
            };
        """

        results = Db.read_transact(query, {"task_id": task_id})
        return results

    def create_registration(self, task_id: str, student_id: str, motivation: str) -> None:
        """
        Create a new registration for a student to a task
        """
        created_at = datetime.now()

        query = """
            match
                $task isa task, has id ~task_id;
                $student isa student, has id ~student_id;
            insert
                $registration isa registersForTask (student: $student, task: $task),
                has description ~motivation,
                has createdAt ~created_at;
        """

        Db.write_transact(query, {
            "task_id": task_id,
            "student_id": student_id,
            "motivation": motivation,
            "created_at": created_at
        })

    def update_registration(self, task_id: str, student_id: str, accepted: bool, response: str = "") -> None:
        """
        Update a registration status (accept/reject) with optional response
        """
        query = """
            match
                $task isa task, has id ~task_id;
                $student isa student, has id ~student_id;
                $registration isa registersForTask (student: $student, task: $task);
            update
                $registration has isAccepted ~accepted;
                $registration has response ~response;
        """

        Db.write_transact(query, {
            "task_id": task_id,
            "student_id": student_id,
            "accepted": accepted,
            "response": response
        })

    def update(self, task_id: str, name: str, description: str, total_needed: int) -> Task:
        # First, get the project info for the current task
        project_query = """
            match
                $currentTask isa task, has id ~task_id;
                $projectTask isa containsTask (project: $project, task: $currentTask);
                $project isa project, has name $project_name, has id $project_id;
            fetch {
                'project_name': $project_name,
                'project_id': $project_id
            };
        """
        project_results = Db.read_transact(project_query, {"task_id": task_id})
        
        if not project_results:
            raise ItemRetrievalException("Task", f"Taak met ID '{task_id}' niet gevonden.")
            
        project_id = project_results[0]['project_id']
        project_name = project_results[0]['project_name']
        
        # Then check for duplicates
        duplicate_query = """
            match
                $project isa project, has id ~project_id;
                $existingTask isa task, has name ~task_name;
                $projectTask isa containsTask (project: $project, task: $existingTask);
            fetch {
                'task_id': $existingTask.id
            };
        """
        duplicate_results = Db.read_transact(duplicate_query, {
            "project_id": project_id,
            "task_name": name
        })
        
        # Check if any duplicates found that are NOT the current task
        for duplicate in duplicate_results:
            if duplicate['task_id'] != task_id:
                raise ValueError(f"Er bestaat al een taak met de naam '{name}' in project '{project_name}'.")

        # Build the update query dynamically based on what needs to be updated
        update_clauses = [
            '$task has name ~name;',
            '$task has description ~description;',
            '$task has totalNeeded ~total_needed;',
        ]
        update_params = {
            "task_id": task_id,
            "name": name,
            "description": description,
            "total_needed": total_needed,
        }

        query = f"""
            match
                $task isa task, has id ~task_id;
            update
                {' '.join(update_clauses)}
        """

        Db.write_transact(query, update_params)

