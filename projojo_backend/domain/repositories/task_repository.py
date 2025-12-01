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
        # Escape any double quotes in the ID
        escaped_id = id.replace('"', '\\"')

        query = f"""
            match
                $task isa task,
                has id "{escaped_id}",
                has name $name,
                has description $description,
                has totalNeeded $totalNeeded,
                has createdAt $createdAt;
            fetch {{
                'id': $task.id,
                'name': $name,
                'description': $description,
                'total_needed': $totalNeeded,
                'created_at': $createdAt,
                'total_registered': (
                    match
                        $registration isa registersForTask (task: $task, student: $student);
                    not {{ $registration has isAccepted $any_value; }};
                    return count;
                ),
                'total_accepted': (
                    match
                        $registration isa registersForTask (task: $task, student: $student),
                        has isAccepted true;
                    return count;
                )
            }};
        """
        results = Db.read_transact(query)
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
        query = f"""
            match
                $project isa project, has id "{project_id}";
                $projectTask isa containsTask (project: $project, task: $task);
                $task isa task,
                has id $id,
                has name $name,
                has description $description,
                has totalNeeded $totalNeeded,
                has createdAt $createdAt;
            fetch {{
                'id': $id,
                'name': $name,
                'description': $description,
                'total_needed': $totalNeeded,
                'created_at': $createdAt,
                'project_id': "{project_id}",
                'total_registered': (
                    match
                        $registration isa registersForTask (task: $task, student: $student);
                    not {{ $registration has isAccepted $any_value; }};
                    return count;
                ),
                'total_accepted': (
                    match
                        $registration isa registersForTask (task: $task, student: $student),
                        has isAccepted true;
                    return count;
                )
            }};
        """
        results = Db.read_transact(query)
        tasks = [Task.model_validate(result) for result in results]

        return tasks

    def get_business_id_by_task(self, task_id: str) -> str | None:
        escaped_task_id = task_id.replace('"', '\\"')

        query = f"""
            match
                $task isa task, has id "{escaped_task_id}";
                $contains isa containsTask (project: $project, task: $task);
                $hasProjects isa hasProjects (business: $business, project: $project);
            fetch {{
                'business_id': $business.id
            }};
        """
        results = Db.read_transact(query)
        if not results:
            return None
        return results[0].get("business_id")

    def create(self, task: Task) -> Task:
        if not task.project_id:
            raise ValueError("De taak moet bij een bestaand project horen.")

        id = generate_uuid()
        # Generate a creation timestamp
        created_at = datetime.now().isoformat()

        # Escape any double quotes in strings
        escaped_name = task.name.replace('"', '\\"')
        escaped_description = task.description.replace('"', '\\"')
        escaped_project_id = task.project_id.replace('"', '\\"')

        validation_query = f"""
            match
                $project isa project, has id "{escaped_project_id}", has name $project_name;
            fetch {{
                'exists': true,
                'project_name': $project_name,
                'duplicate_tasks': [
                    match
                        $existingTask isa task, has name "{escaped_name}";
                        $projectTask isa containsTask (project: $project, task: $existingTask);
                    fetch {{ 'exists': true }};
                ]
            }};
        """
        validation_results = Db.read_transact(validation_query)

        if not validation_results:
            raise ItemRetrievalException("Project", f"Project with ID '{task.project_id}' not found.")

        # Check if duplicate tasks were found
        if validation_results[0].get('duplicate_tasks'):
            project_name = validation_results[0].get('project_name')
            raise ValueError(f"Er bestaat al een taak met de naam '{task.name}' in project '{project_name}'.")

        query = f"""
            match
                $project isa project, has id "{escaped_project_id}";
            insert
                $task isa task,
                has id "{id}",
                has name "{escaped_name}",
                has description "{escaped_description}",
                has totalNeeded {task.total_needed},
                has createdAt {created_at};
                $projectTask isa containsTask (project: $project, task: $task);
        """
        Db.write_transact(query)

        # Update the task with the generated ID and created_at
        task.id = id
        task.created_at = datetime.fromisoformat(created_at)
        return task

    def update(self, id: str, task: Task) -> Task | None:
        # First delete the old task
        # Escape any double quotes in the ID
        escaped_id = id.replace('"', '\\"')
        delete_query = f"""
            match
                $task isa task,
                has id "{escaped_id}";
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
                has id "{escaped_id}";
            delete $task isa task;
        """
        Db.write_transact(query)
        return True

    def get_registrations(self, task_id: str) -> list[dict]:
        """
        Get all registrations for a task with student details and skills
        """
        escaped_task_id = task_id.replace('"', '\\"')

        query = f"""
            match
                $task isa task, has id "{escaped_task_id}";
                $student isa student, has id $student_id;
                $registration isa registersForTask (student: $student, task: $task);
            not {{ $registration has isAccepted $any_value; }};
            fetch {{
                'reason': $registration.description,
                'student': {{
                    'id': $student_id,
                    'full_name': $student.fullName,
                    'skills': [
                        match
                            $hasSkill isa hasSkill (student: $student, skill: $skill);
                        fetch {{
                            'id': $skill.id,
                            'name': $skill.name,
                            'is_pending': $skill.isPending,
                            'created_at': $skill.createdAt,
                            'description': $hasSkill.description
                        }};
                    ]
                }}
            }};
        """

        results = Db.read_transact(query)
        return results

    def create_registration(self, task_id: str, student_id: str, motivation: str) -> None:
        """
        Create a new registration for a student to a task
        """
        escaped_task_id = task_id.replace('"', '\\"')
        escaped_student_id = student_id.replace('"', '\\"')
        escaped_motivation = motivation.replace('"', '\\"')
        created_at = datetime.now().isoformat()

        query = f"""
            match
                $task isa task, has id "{escaped_task_id}";
                $student isa student, has id "{escaped_student_id}";
            insert
                $registration isa registersForTask (student: $student, task: $task),
                has description "{escaped_motivation}",
                has createdAt {created_at};
        """

        Db.write_transact(query)

    def update_registration(self, task_id: str, student_id: str, accepted: bool, response: str = "") -> None:
        """
        Update a registration status (accept/reject) with optional response
        """
        escaped_task_id = task_id.replace('"', '\\"')
        escaped_student_id = student_id.replace('"', '\\"')
        escaped_response = response.replace('"', '\\"')

        query = f"""
            match
                $task isa task, has id "{escaped_task_id}";
                $student isa student, has id "{escaped_student_id}";
                $registration isa registersForTask (student: $student, task: $task);
            update
                $registration has isAccepted {str(accepted).lower()};
                $registration has response "{escaped_response}";
        """

        Db.write_transact(query)
