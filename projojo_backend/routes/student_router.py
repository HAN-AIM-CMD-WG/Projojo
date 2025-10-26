from fastapi import APIRouter, Path, Body, HTTPException, Depends, UploadFile, File, Form
from auth.jwt_utils import get_token_payload

from domain.repositories import SkillRepository, UserRepository
from domain.models.skill import StudentSkill
from domain.models import StudentSkills
from service.image_service import save_image

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


@router.put("/{email}")
async def update_student(
    email: str = Path(..., description="Student email"),
    description: str = Form(None),
    profilePicture: UploadFile = File(None),
    cv: UploadFile = File(None),
    payload: dict = Depends(get_token_payload)
):
    """
    Update student profile information (description, profile picture, CV)
    """
    # Verify the student is updating their own profile
    if payload.get("role") != "student" or payload.get("sub") != email:
        raise HTTPException(status_code=403, detail="Je kunt alleen je eigen profiel aanpassen")

    # Verify student exists
    student = user_repo.get_student_by_id(email)
    if not student:
        raise HTTPException(status_code=404, detail="Student niet gevonden")

    image_filename = None
    cv_filename = None

    try:
        # Handle profile picture upload
        if profilePicture and profilePicture.filename:
            _, image_filename = save_image(profilePicture)

        # Handle CV upload
        if cv and cv.filename:
            _, cv_filename = save_image(cv, "static/pdf")

        # Update student in database
        user_repo.update_student(
            email=email,
            description=description,
            image_path=image_filename,
            cv_path=cv_filename
        )

        return {"message": "Profiel succesvol bijgewerkt"}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Er is een fout opgetreden bij het bijwerken van het profiel: {str(e)}"
        )
