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
                $projectTask isa containsTask (project: $project, task: $task);
                $project has id $project_id;
            fetch {
                'id': $task.id,
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
        results = Db.read_transact(query, {"id": id})
        if not results:
            raise ItemRetrievalException(Task, f"Task with ID {id} not found.")

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
                $projectTask isa containsTask (project: $project, task: $task);
                $project has id $project_id;
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
            raise ItemRetrievalException("Project", f"Project with ID '{task.project_id}' not found.")

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

    def update(self, id: str, task: Task) -> Task | None:
        # First delete the old task
        delete_query = """
            match
                $task isa task,
                has id ~id;
            delete $task isa task;
        """
        Db.write_transact(delete_query, {"id": id})

        # Then create a new one with updated values
        return self.create(task)

    def delete(self, id: str) -> bool:
        query = """
            match
                $task isa task,
                has id ~id;
            delete $task isa task;
        """
        Db.write_transact(query, {"id": id})
        return True

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
        Create a new registration for a student to a task.
        Sets both createdAt and requestedAt to track the full timeline.
        """
        now = datetime.now()

        query = """
            match
                $task isa task, has id ~task_id;
                $student isa student, has id ~student_id;
            insert
                $registration isa registersForTask (student: $student, task: $task),
                has description ~motivation,
                has createdAt ~created_at,
                has requestedAt ~requested_at;
        """

        Db.write_transact(query, {
            "task_id": task_id,
            "student_id": student_id,
            "motivation": motivation,
            "created_at": now,
            "requested_at": now
        })

    def update_registration(self, task_id: str, student_id: str, accepted: bool, response: str = "") -> None:
        """
        Update a registration status (accept/reject) with optional response.
        Sets acceptedAt timestamp when accepted for timeline tracking.
        """
        accepted_at = datetime.now() if accepted else None
        
        # Base query for updating isAccepted and response
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
        
        # If accepted, also set the acceptedAt timestamp
        if accepted and accepted_at:
            accept_time_query = """
                match
                    $task isa task, has id ~task_id;
                    $student isa student, has id ~student_id;
                    $registration isa registersForTask (student: $student, task: $task);
                update
                    $registration has acceptedAt ~accepted_at;
            """
            try:
                Db.write_transact(accept_time_query, {
                    "task_id": task_id,
                    "student_id": student_id,
                    "accepted_at": accepted_at
                })
            except Exception:
                pass  # Non-critical if timestamp fails

    def delete_registration(self, task_id: str, student_id: str) -> bool:
        """
        Delete a pending registration (only if not yet accepted/rejected).
        Returns True if deleted, False if not found or already processed.
        """
        # First check if a pending registration exists
        check_query = """
            match
                $task isa task, has id ~task_id;
                $student isa student, has id ~student_id;
                $registration isa registersForTask (student: $student, task: $task);
                not { $registration has isAccepted $any; };
            fetch {
                'task_id': $task.id
            };
        """
        
        results = Db.read_transact(check_query, {
            "task_id": task_id,
            "student_id": student_id
        })
        
        if not results:
            return False
        
        # Delete the registration
        delete_query = """
            match
                $task isa task, has id ~task_id;
                $student isa student, has id ~student_id;
                $registration isa registersForTask (student: $student, task: $task);
                not { $registration has isAccepted $any; };
            delete
                $registration;
        """
        
        Db.write_transact(delete_query, {
            "task_id": task_id,
            "student_id": student_id
        })
        
        return True

    def get_pending_registrations_by_business(self, business_id: str) -> list[dict]:
        """
        Get all pending registrations for tasks in projects of a business.
        Returns student info, task info, and registration details.
        """
        query = """
            match
                $business isa business, has id ~business_id;
                $hasProjects isa hasProjects (business: $business, project: $project);
                $project has id $project_id, has name $project_name;
                $containsTask isa containsTask (project: $project, task: $task);
                $task has id $task_id, has name $task_name;
                $registration isa registersForTask (student: $student, task: $task);
                not { $registration has isAccepted $any; };
                $student has id $student_id, 
                    has fullName $student_name,
                    has imagePath $student_image;
            fetch {
                'task_id': $task_id,
                'task_name': $task_name,
                'project_id': $project_id,
                'project_name': $project_name,
                'student_id': $student_id,
                'student_name': $student_name,
                'student_image': $student_image,
                'motivation': $registration.description,
                'created_at': $registration.createdAt,
                'student_skills': [
                    match
                        $hasSkill isa hasSkill (student: $student, skill: $skill);
                        $skill has isPending false;
                    fetch {
                        'id': $skill.id,
                        'name': $skill.name
                    };
                ]
            };
        """
        results = Db.read_transact(query, {"business_id": business_id})
        return results if results else []

    def get_active_students_by_business(self, business_id: str) -> list[dict]:
        """
        Get all students with accepted registrations for tasks in projects of a business.
        """
        query = """
            match
                $business isa business, has id ~business_id;
                $hasProjects isa hasProjects (business: $business, project: $project);
                $project has id $project_id, has name $project_name;
                $containsTask isa containsTask (project: $project, task: $task);
                $task has id $task_id, has name $task_name;
                $registration isa registersForTask (student: $student, task: $task),
                    has isAccepted true;
                $student has id $student_id, 
                    has fullName $student_name,
                    has imagePath $student_image;
            fetch {
                'task_id': $task_id,
                'task_name': $task_name,
                'project_id': $project_id,
                'project_name': $project_name,
                'student_id': $student_id,
                'student_name': $student_name,
                'student_image': $student_image
            };
        """
        results = Db.read_transact(query, {"business_id": business_id})
        return results if results else []

    def mark_registration_started(self, task_id: str, student_id: str) -> None:
        """
        Mark a registration as started (student begins working on the task).
        Sets the startedAt timestamp for timeline tracking.
        """
        started_at = datetime.now()
        
        query = """
            match
                $task isa task, has id ~task_id;
                $student isa student, has id ~student_id;
                $registration isa registersForTask (student: $student, task: $task),
                    has isAccepted true;
            update
                $registration has startedAt ~started_at;
        """
        
        Db.write_transact(query, {
            "task_id": task_id,
            "student_id": student_id,
            "started_at": started_at
        })

    def mark_registration_completed(self, task_id: str, student_id: str) -> None:
        """
        Mark a registration as completed (student finished the task).
        Sets the completedAt timestamp for portfolio and timeline tracking.
        """
        completed_at = datetime.now()
        
        query = """
            match
                $task isa task, has id ~task_id;
                $student isa student, has id ~student_id;
                $registration isa registersForTask (student: $student, task: $task),
                    has isAccepted true;
            update
                $registration has completedAt ~completed_at;
        """
        
        Db.write_transact(query, {
            "task_id": task_id,
            "student_id": student_id,
            "completed_at": completed_at
        })

    def get_registration_timeline(self, task_id: str, student_id: str) -> dict | None:
        """
        Get the full timeline for a registration.
        """
        query = """
            match
                $task isa task, has id ~task_id;
                $student isa student, has id ~student_id;
                $registration isa registersForTask (student: $student, task: $task);
            fetch {
                'requested_at': [$registration.requestedAt],
                'accepted_at': [$registration.acceptedAt],
                'started_at': [$registration.startedAt],
                'completed_at': [$registration.completedAt],
                'is_accepted': [$registration.isAccepted]
            };
        """
        
        results = Db.read_transact(query, {
            "task_id": task_id,
            "student_id": student_id
        })
        
        if not results:
            return None
        
        r = results[0]
        return {
            "requested_at": r.get("requested_at", [None])[0],
            "accepted_at": r.get("accepted_at", [None])[0],
            "started_at": r.get("started_at", [None])[0],
            "completed_at": r.get("completed_at", [None])[0],
            "is_accepted": r.get("is_accepted", [None])[0],
        }
