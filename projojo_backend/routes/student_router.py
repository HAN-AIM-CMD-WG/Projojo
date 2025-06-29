from fastapi import APIRouter, Path, Body, HTTPException, Depends
from auth.jwt_utils import get_token_payload

from domain.repositories import SkillRepository, UserRepository
from domain.models.skill import StudentSkill

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

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


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
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Er is iets misgegaan bij het bijwerken van de skills",
        )


@router.patch("/{student_id}/skills/{skill_id}")
async def update_student_skill_description(
    student_id: str = Path(..., description="Student ID"),
    skill_id: str = Path(..., description="Skill ID"),
    skill: StudentSkill = Body(..., description="Skill object with updated description"),
    payload: dict = Depends(get_token_payload)
):
    """
    Update a specific skill's description for a student
    """
    if payload.get("role") != "student" or payload.get("sub") != student_id:
        raise HTTPException(status_code=403, detail="Studenten kunnen alleen hun eigen skills bijwerken")

    user = user_repo.get_student_by_id(student_id)
    if not user:
        raise HTTPException(status_code=404, detail="Student bestaat niet")

    skill_ids = [skill.get("id") for skill in user.get("Skills")]
    if skill_id not in skill_ids:
        raise HTTPException(status_code=404, detail="De skill die je probeert te updaten staat niet in jouw profiel")

    try:
        skill_repo.update_student_skill_description(student_id, skill_id, skill.description)
        return {"message": "Skill description successfully updated"}
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Er is iets misgegaan bij het opslaan van de beschrijving",
        )
