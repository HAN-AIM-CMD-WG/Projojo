from fastapi import APIRouter, Path, Body, HTTPException

from domain.repositories import SkillRepository, UserRepository
from domain.models import StudentSkills

skill_repo = SkillRepository()
user_repo = UserRepository()


router = APIRouter(prefix="/students", tags=["Student Endpoints"])


@router.get("/")
async def get_all_students():
    """
    Get all students for debugging purposes
    """
    students = user_repo.get_all_students()
    return students


@router.get("/{email}/skills")
async def get_student_skills(email: str = Path(..., description="Student email")):
    """
    Get all skills for a student
    """
    student = user_repo.get_student_by_id(email)
    skills = skill_repo.get_student_skills(student.email)

    return StudentSkills(**student.model_dump(), Skills=skills)


@router.put("/{email}/skills")
async def update_student_skills(
    email: str = Path(..., description="Student email"),
    skills: list[str] = Body(..., description="List of skillnames"),
):
    """
    Update skills for a student
    """
    try:
        skill_repo.update_student_skills(email, skills)
        return {"message": "Skills succesvol bijgewerkt"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Er is iets misgegaan bij het bijwerken van de skills: {str(e)}",
        )
