from fastapi import APIRouter, Path, Body, HTTPException, Request, UploadFile, File, Form, Depends
from auth.permissions import auth
from auth.jwt_utils import get_token_payload

from domain.repositories import SkillRepository, UserRepository, PortfolioRepository
from domain.models.skill import StudentSkill
from service.image_service import save_image, delete_image

skill_repo = SkillRepository()
user_repo = UserRepository()
portfolio_repo = PortfolioRepository()

router = APIRouter(prefix="/students", tags=["Student Endpoints"])


@router.get("/")
@auth(role="authenticated")
async def get_all_students():
    """
    Get all students for debugging purposes
    """
    students = user_repo.get_all_students()
    return students


@router.get("/{student_id}/skills")
@auth(role="authenticated")
async def get_student_skills(student_id: str = Path(..., description="Student ID")):
    """
    Get all skills for a student
    """
    student = user_repo.get_student_by_id(student_id)

    if not student:
        raise HTTPException(status_code=404, detail="Student niet gevonden")
    return student


@router.put("/{student_id}/skills")
@auth(role="student", owner_id_key="student_id")
async def update_student_skills(
    student_id: str = Path(..., description="Student ID"),
    skills: list[str] = Body(..., description="List of skill IDs"),
):
    """
    Update skills for a student
    """
    try:
        skill_repo.update_student_skills(student_id, skills)
        return {"message": "Skills succesvol bijgewerkt"}
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Er is iets misgegaan bij het bijwerken van de skills",
        )


@router.patch("/{student_id}/skills/{skill_id}")
@auth(role="student", owner_id_key="student_id")
async def update_student_skill_description(
    student_id: str = Path(..., description="Student ID"),
    skill_id: str = Path(..., description="Skill ID"),
    skill: StudentSkill = Body(..., description="Skill object with updated description")
):
    """
    Update a specific skill's description for a student
    """
    user = user_repo.get_student_by_id(student_id)
    if not user:
        raise HTTPException(status_code=404, detail="Student bestaat niet")

    skill_ids = [skill.get("id") for skill in user.get("Skills")]
    if skill_id not in skill_ids:
        raise HTTPException(status_code=404, detail="De skill die je probeert te updaten staat niet in jouw profiel")

    try:
        skill_repo.update_student_skill_description(student_id, skill_id, skill.description)
        return {"message": "Skillbeschrijving succesvol bijgewerkt"}
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Er is iets misgegaan bij het opslaan van de beschrijving",
        )

@router.get("/registrations")
@auth(role="student")
async def get_student_registrations(request: Request) -> list[dict]:
    """
    Get all task registrations for the current student with task details and acceptance status
    """
    student_id = request.state.user_id
    registrations = user_repo.get_student_registrations(student_id)
    return registrations


@router.put("/{student_id}")
@auth(role="student", owner_id_key="student_id")
async def update_student(
    student_id: str = Path(..., description="Student ID"),
    description: str = Form(None),
    profilePicture: UploadFile = File(None),
    cv: UploadFile = File(None),
    cv_deleted: str = Form(None)
):
    """
    Update student profile information (description, profile picture, CV)
    """
    # Verify student exists
    student = user_repo.get_student_by_id(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student niet gevonden")

    # Store old file paths for deletion after successful update
    old_image_path = student.get("image_path")
    old_cv_path = student.get("cv_path")

    image_filename = None
    cv_filename = None

    try:
        # Handle profile picture upload
        if profilePicture and profilePicture.filename:
            image_filename = save_image(profilePicture)

        # Handle CV upload or deletion
        if cv and cv.filename:
            cv_filename = save_image(cv, "static/pdf")
        elif cv_deleted == "true":
            # User explicitly deleted the CV
            cv_filename = ""

        # Update student in database
        user_repo.update_student(
            id=student_id,
            description=description,
            image_path=image_filename,
            cv_path=cv_filename
        )

        # Delete old files after successful database update
        if image_filename and old_image_path:
            delete_image(old_image_path)

        if cv_filename is not None and old_cv_path:
            # Delete old CV if we uploaded a new one or explicitly deleted it
            delete_image(old_cv_path, "static/pdf")

        return {"message": "Profiel succesvol bijgewerkt"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating student {student_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Er is een fout opgetreden bij het bijwerken van het profiel: {str(e)}"
        )


@router.get("/{student_id}/portfolio")
async def get_student_portfolio(
    student_id: str = Path(..., description="Student ID"),
    payload: dict = Depends(get_token_payload)
):
    """
    Get the portfolio for a student.
    
    Returns a unified list combining:
    - Live items: completed tasks from existing (including archived) projects
    - Snapshot items: preserved data from deleted projects
    
    Each item contains:
    - source_type: "live" | "snapshot"
    - is_archived: bool (for live items, indicates if project is archived)
    - Full project, business, task, and skills data
    - Timeline data for Gantt visualization
    
    Accessible by:
    - The student themselves
    - Teachers (all portfolios)
    - Supervisors (students working on their projects)
    """
    role = payload.get("role")
    user_id = payload.get("sub")
    
    # Authorization: students can only view their own portfolio
    if role == "student" and user_id != student_id:
        raise HTTPException(
            status_code=403, 
            detail="Je kunt alleen je eigen portfolio bekijken"
        )
    
    # Verify student exists
    student = user_repo.get_student_by_id(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student niet gevonden")
    
    # Get the unified portfolio
    portfolio = portfolio_repo.get_student_portfolio(student_id)
    
    return {
        "student_id": student_id,
        "student_name": student.get("full_name", ""),
        "items": portfolio,
        "total_count": len(portfolio),
        "live_count": sum(1 for item in portfolio if item.get("source_type") == "live"),
        "snapshot_count": sum(1 for item in portfolio if item.get("source_type") == "snapshot"),
    }


@router.delete("/{student_id}/portfolio/{portfolio_id}")
async def delete_portfolio_item(
    student_id: str = Path(..., description="Student ID"),
    portfolio_id: str = Path(..., description="Portfolio Item ID"),
    payload: dict = Depends(get_token_payload)
):
    """
    Delete a portfolio snapshot (for GDPR/privacy requests).
    Only snapshot items can be deleted, not live items.
    
    Accessible by:
    - The student themselves
    - Teachers
    """
    role = payload.get("role")
    user_id = payload.get("sub")
    
    # Authorization
    if role == "student" and user_id != student_id:
        raise HTTPException(
            status_code=403, 
            detail="Je kunt alleen je eigen portfolio items verwijderen"
        )
    
    if role not in ["student", "teacher"]:
        raise HTTPException(
            status_code=403, 
            detail="Alleen studenten en docenten kunnen portfolio items verwijderen"
        )
    
    # Only allow deleting snapshots (live items can't be deleted this way)
    if portfolio_id.startswith("live-"):
        raise HTTPException(
            status_code=400,
            detail="Live portfolio items kunnen niet verwijderd worden. Neem contact op met de docent."
        )
    
    # Delete the snapshot
    success = portfolio_repo.delete_snapshot(portfolio_id)
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail="Portfolio item niet gevonden"
        )
    
    return {"message": "Portfolio item succesvol verwijderd"}
