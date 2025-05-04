from typing import List

from domain.models.dto.student import Student_With_Skills
from domain.repositories import SkillRepository, UserRepository
from domain.models.dto import Student_With_Skills

user_repo = UserRepository()
skill_repo = SkillRepository()

def get_student_with_skills(email: str) -> Student_With_Skills:
    """
    Get a student along with their skills.
    """
    student = user_repo.get_student_by_id(email)
    skills = skill_repo.get_student_skills(student.email)

    return Student_With_Skills(
        student=student,
        skills=skills
    )


