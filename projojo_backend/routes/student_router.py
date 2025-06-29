from fastapi import APIRouter, Path, Depends, HTTPException
from auth.jwt_utils import get_token_payload

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

    return StudentSkills(
        **student.model_dump(),
        Skills=skills
    )

@router.get("/registrations")
async def get_student_registrations(payload: dict = Depends(get_token_payload)) -> list[str]:
    """
    Get all student registrations for debugging purposes
    """
    if payload.get("role") != "student":
        raise HTTPException(status_code=403, detail="Alleen studenten kunnen hun registraties bekijken")

    student_email = payload.get("sub")
    registrations = user_repo.get_student_registrations(student_email)
    return registrations