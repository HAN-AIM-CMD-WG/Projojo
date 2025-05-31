from typing import Any
from db.initDatabase import Db
from exceptions import ItemRetrievalException
from .base import BaseRepository
from domain.models import Skill
from datetime import datetime

from ..models.skill import StudentSkill


class SkillRepository(BaseRepository[Skill]):
    def __init__(self):
        super().__init__(Skill, "skill")

    def get_by_id(self, id: str) -> Skill | None:
        escaped_id = id.replace('"', '\\"')
        query = f"""
            match
                $skill isa skill,
                has name "{escaped_id}",
                has name $name,
                has isPending $isPending,
                has createdAt $createdAt;
            fetch {{
                'name': $name,
                'isPending': $isPending,
                'createdAt': $createdAt
            }};
        """
        results = Db.read_transact(query)
        if not results:
            raise ItemRetrievalException(Skill, f"Skill with ID {id} not found.")
        return self._map_to_model(results[0])

    def get_all(self) -> list[Skill]:
        query = """
            match 
                $skill isa skill;
            fetch { 
                'name': $skill.name,	
                'isPending': $skill.isPending,
                'createdAt': $skill.createdAt,
            };
        """
        results = Db.read_transact(query)
        return [self._map_to_model(result) for result in results]

    def get_student_skills(self, student_id: str) -> list[Skill | StudentSkill]:
        # Escape the student_id to prevent injection
        escaped_student_id = student_id.replace('"', '\\"')
        query = f"""
            match
                $student isa student, 
                has email "{escaped_student_id}";
                $hasSkill isa hasSkill( $student, $skill),
                has description $description;
                $skill isa skill,
                has createdAt $createdAt,
                has name $skill_name;
            fetch {{
                'name': $skill_name,
                'description': $description,
                'isPending': $skill.isPending,
                'createdAt': $createdAt
            }};
        """
        results = Db.read_transact(query)

        return [self._map_to_model(result) for result in results]

    def update_student_skills(self, student_id: str, skill_ids: list[str]) -> None:
        escaped_student_id = student_id.replace('"', '\\"')

        # get the current skills of the student

        # check which skills are removed from original skills

        # check which skills are added to original skills

        # remove the removed skills

        # add the added skills

    def create(self, skill: Skill) -> Skill:
        # Generate a creation timestamp if not provided
        created_at = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
        # Convert boolean to string for TypeDB query
        is_pending_value = "true" if skill.is_pending else "false"

        # Escape any double quotes in the name
        escaped_name = skill.name.replace('"', '\\"')

        query = f"""
            insert
                $skill isa skill,
                has name "{escaped_name}",
                has isPending {is_pending_value},
                has createdAt {created_at};
        """

        Db.write_transact(query)

        # Update the created_at in the returned skill if it wasn't provided
        if not skill.created_at:
            skill.created_at = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")

        # Set the ID to match the name (since you're using name as the ID)
        skill.id = skill.name

        return skill

    def _map_to_model(self, result: dict[str, Any]) -> Skill:
        # Extract relevant information from the query result
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
                id=name,  # Using name as the ID since it's marked as @key
                name=name,
                description=description,
                is_pending=is_pending,
                created_at=created_at,
            )

        return Skill(
            id=name,  # Using name as the ID since it's marked as @key
            name=name,
            is_pending=is_pending,
            created_at=created_at,
        )

    def get_task_skills(self, task_id: str) -> list[Skill]:
        query = f"""
            match
                $task isa task, has name "{task_id}";
                $taskSkill isa requiresSkill (task: $task, skill: $skill);
                $skill isa skill, has name $skill_name;
            fetch {{
                'skill_name': $skill_name,
                'isPending': $skill.isPending
            }};
        """
        results = Db.read_transact(query)

        skills = []
        for result in results:
            skill_name = result.get("skill_name", "")
            is_pending_value = result.get("isPending", True)

            skills.append(
                Skill(
                    id=skill_name,  # Using name as the ID since it's marked as @key
                    name=skill_name,
                    is_pending=is_pending_value,
                    created_at=datetime.now(),  # Assuming created_at is not needed here
                )
            )
        return skills
