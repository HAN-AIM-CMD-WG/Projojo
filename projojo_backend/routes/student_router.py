from fastapi import APIRouter, Path

from domain.repositories import SkillRepository, UserRepository
skill_repo = SkillRepository()
user_repo = UserRepository()

from domain.models import StudentSkills

router = APIRouter(prefix="/test", tags=["Student Endpoints"])

@router.get("/students")
async def get_all_students():
    """
    Get all students for debugging purposes
    """
    students = user_repo.get_all_students()
    return students


@router.get("/students/{email}/skills")
async def get_student_skills(email: str = Path(..., description="Student email")):
    """
    Get all skills for a student
    """
    student = user_repo.get_student_by_id(email)
    skills = skill_repo.get_student_skills(student.email)

    return StudentSkills(
        **student.model_dump(),
        Skills=skills
    )
