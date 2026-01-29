from typing import Any
from db.initDatabase import Db
from exceptions import ItemRetrievalException
from .base import BaseRepository
from domain.models import Skill
from datetime import datetime
from service.uuid_service import generate_uuid

from ..models.skill import StudentSkill


class SkillRepository(BaseRepository[Skill]):
    def __init__(self):
        super().__init__(Skill, "skill")

    def get_by_id(self, id: str) -> Skill | None:
        query = """
            match
                $skill isa skill,
                has id ~id,
                has name $name,
                has isPending $isPending,
                has createdAt $createdAt;
            fetch {
                'id': $skill.id,
                'name': $name,
                'isPending': $isPending,
                'createdAt': $createdAt
            };
        """
        results = Db.read_transact(query, {"id": id})
        if not results:
            raise ItemRetrievalException(Skill, f"Skill with ID {id} not found.")
        return self._map_to_model(results[0])

    def get_all(self) -> list[Skill]:
        query = """
            match
                $skill isa skill,
                has id $id;
            fetch {
                'id': $id,
                'name': $skill.name,
                'isPending': $skill.isPending,
                'createdAt': $skill.createdAt,
            };
        """
        results = Db.read_transact(query)
        return [self._map_to_model(result) for result in results]

    def get_student_skills(self, student_id: str) -> list[Skill | StudentSkill]:
        query = """
            match
                $student isa student,
                has id ~student_id;
                $hasSkill isa hasSkill( $student, $skill),
                has description $description;
                $skill isa skill,
                has id $skill_id,
                has createdAt $createdAt,
                has name $skill_name;
            fetch {
                'id': $skill_id,
                'name': $skill_name,
                'description': $description,
                'isPending': $skill.isPending,
                'createdAt': $createdAt
            };
        """
        results = Db.read_transact(query, {"student_id": student_id})

        return [self._map_to_model(result) for result in results]

    def update_student_skills(self, student_id: str, updated_skills: list[str]) -> None:
        current_skills = self.get_student_skills(student_id)
        current_skill_ids = {skill.id for skill in current_skills}

        to_add = set(updated_skills) - (current_skill_ids)
        to_remove = (current_skill_ids) - set(updated_skills)

        for skill_id in to_add:
            query = """
                match
                    $student isa student, has id ~student_id;
                    $skill isa skill, has id ~skill_id;
                insert
                    $hasSkill isa hasSkill (student: $student, skill: $skill),
                    has description "";
            """
            Db.write_transact(query, {"student_id": student_id, "skill_id": skill_id})

        for skill_id in to_remove:
            query = """
                match
                    $student isa student, has id ~student_id;
                    $skill isa skill, has id ~skill_id;
                    $hasSkill isa hasSkill (student: $student, skill: $skill);
                delete
                    $hasSkill;
            """
            Db.write_transact(query, {"student_id": student_id, "skill_id": skill_id})

    def update_student_skill_description(self, student_id: str, skill_id: str, description: str):
        query = """
            match
                $student isa student, has id ~student_id;
                $skill isa skill, has id ~skill_id;
                $hasSkill isa hasSkill (student: $student, skill: $skill);
            update
                $hasSkill has description ~description;
        """
        Db.write_transact(query, {
            "student_id": student_id,
            "skill_id": skill_id,
            "description": description
        })

    def create(self, skill: Skill) -> Skill:
        id = generate_uuid()
        # Generate a creation timestamp if not provided
        created_at = datetime.now()

        query = """
            insert
                $skill isa skill,
                has id ~id,
                has name ~name,
                has isPending ~is_pending,
                has createdAt ~created_at;
        """

        Db.write_transact(query, {
            "id": id,
            "name": skill.name,
            "is_pending": skill.is_pending,
            "created_at": created_at
        })

        # Update the created_at in the returned skill if it wasn't provided
        if not skill.created_at:
            skill.created_at = created_at

        return skill

    def _map_to_model(self, result: dict[str, Any]) -> Skill:
        # Extract relevant information from the query result
        id = result.get("id", "")
        name = result.get("name", "")
        is_pending_value = result.get("isPending", True)
        if isinstance(is_pending_value, bool):
            is_pending = is_pending_value
        else:
            is_pending = str(is_pending_value).lower() == "true"
        created_at_str = result.get("createdAt", "")

        # Convert createdAt string to datetime
        created_at = (
            datetime.fromisoformat(created_at_str) if created_at_str else datetime.now()
        )

        description = result.get("description")
        if description:
            return StudentSkill(
                id=id,
                name=name,
                description=description,
                is_pending=is_pending,
                created_at=created_at,
            )

        return Skill(
            id=id,
            name=name,
            is_pending=is_pending,
            created_at=created_at,
        )

    def get_task_skills(self, task_id: str) -> list[Skill]:
        query = """
            match
                $task isa task, has id ~task_id;
                $taskSkill isa requiresSkill (task: $task, skill: $skill);
                $skill isa skill, has id $skill_id, has name $skill_name;
            fetch {
                'id': $skill_id,
                'name': $skill_name,
                'isPending': $skill.isPending
            };
        """
        results = Db.read_transact(query, {"task_id": task_id})

        skills = []
        for result in results:
            skill_id = result.get("id", "")
            skill_name = result.get("name", "")
            is_pending_value = result.get("isPending", True)

            skills.append(
                Skill(
                    id=skill_id,
                    name=skill_name,
                    is_pending=is_pending_value,
                    created_at=datetime.now(),  # Assuming created_at is not needed here
                )
            )
        return skills

    def update_is_pending(self, skill_id: str, is_pending: bool) -> None:
        """
        Update the isPending attribute of a skill.
        """
        query = """
            match
                $skill isa skill, has id ~skill_id;
            update
                $skill has isPending ~is_pending;
        """
        Db.write_transact(query, {"skill_id": skill_id, "is_pending": is_pending})

    def update_name(self, skill_id: str, new_name: str) -> None:
        """
        Update the name of a skill (unique).
        """
        query = """
            match
                $skill isa skill, has id ~skill_id;
            update
                $skill has name ~new_name;
        """
        Db.write_transact(query, {"skill_id": skill_id, "new_name": new_name})

    def delete_by_id(self, skill_id: str) -> None:
        """
        Permanently delete a skill by id. Intended for declining pending skills.
        """
        query = """
            match
                $skill isa skill, has id ~skill_id;
            delete
                $skill;
        """
        Db.write_transact(query, {"skill_id": skill_id})

    def has_task_registrations(self, task_id: str) -> bool:
        """
        Check if a task has any registrations (pending, accepted, or rejected).
        Used to determine if skills can be removed from the task.
        """
        query = """
            match
                $task isa task, has id ~task_id;
                $registration isa registersForTask (task: $task, student: $student);
            fetch {
                'exists': true
            };
        """
        results = Db.read_transact(query, {"task_id": task_id})
        return len(results) > 0

    def update_task_skills(self, task_id: str, skill_ids: list[str]) -> dict:
        """
        Update skills for a task.
        - If registrations exist: skills are completely locked (no add, no remove)
        - If no registrations: full editing allowed
        
        Returns:
            dict with 'success', 'added', 'removed', 'locked', 'has_registrations'
        """
        # Get current skills
        current_skills = self.get_task_skills(task_id)
        current_skill_ids = {skill.id for skill in current_skills}
        new_skill_ids = set(skill_ids)

        to_add = new_skill_ids - current_skill_ids
        to_remove = current_skill_ids - new_skill_ids

        # Check if task has registrations
        has_registrations = self.has_task_registrations(task_id)
        
        # If there are registrations, block ALL skill changes
        if has_registrations:
            return {
                "success": False,
                "added": [],
                "removed": [],
                "locked": True,
                "has_registrations": True,
                "message": "Skills kunnen niet worden gewijzigd omdat er al aanmeldingen zijn voor deze taak."
            }

        # No registrations - allow full editing
        # Add new skills
        for skill_id in to_add:
            add_query = """
                match
                    $task isa task, has id ~task_id;
                    $skill isa skill, has id ~skill_id;
                insert
                    $requiresSkill isa requiresSkill (task: $task, skill: $skill);
            """
            try:
                Db.write_transact(add_query, {"task_id": task_id, "skill_id": skill_id})
            except Exception as e:
                print(f"Error adding skill {skill_id} to task {task_id}: {e}")

        # Remove skills
        for skill_id in to_remove:
            remove_query = """
                match
                    $task isa task, has id ~task_id;
                    $skill isa skill, has id ~skill_id;
                    $requiresSkill isa requiresSkill (task: $task, skill: $skill);
                delete
                    $requiresSkill;
            """
            try:
                Db.write_transact(remove_query, {"task_id": task_id, "skill_id": skill_id})
            except Exception as e:
                print(f"Error removing skill {skill_id} from task {task_id}: {e}")

        return {
            "success": True,
            "added": list(to_add),
            "removed": list(to_remove),
            "locked": False,
            "has_registrations": False
        }