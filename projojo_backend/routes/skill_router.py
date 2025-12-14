from fastapi import APIRouter, Path, Body, HTTPException
from auth.permissions import auth

from domain.repositories import SkillRepository
from domain.models import Skill

skill_repo = SkillRepository()

router = APIRouter(prefix="/skills", tags=["Skill Endpoints"])

# Skill endpoints
@router.get("/")
@auth(role="authenticated")
async def get_all_skills():
    """
    Get all skills for debugging purposes
    """
    skills = skill_repo.get_all()
    return skills

@router.get("/{skill_id}")
@auth(role="authenticated")
async def get_skill(skill_id: str = Path(..., description="Skill ID")):
    """
    Get a specific skill by ID
    """
    skill = skill_repo.get_by_id(skill_id)
    return skill

@router.post("/", response_model=Skill, status_code=201)
@auth(role="supervisor")
async def create_skill(skill: Skill = Body(...)):
    """
    Create a new skill
    """
    created_skill = skill_repo.create(skill)
    return created_skill

@router.patch("/{skill_id}/acceptance")
@auth(role="teacher")
async def update_skill_acceptance(
    skill_id: str = Path(..., description="Skill ID"),
    body: dict = Body(...)
):
    """
    Mark a skill as processed (accepted/declined) by setting isPending to false.
    Teacher-only.
    """
    accepted = body.get("accepted", None)
    if accepted is None:
        raise HTTPException(status_code=400, detail="Veld 'accepted' is verplicht")

    # Ensure skill exists
    try:
        skill_repo.get_by_id(skill_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Skill niet gevonden")

    try:
        if bool(accepted):
            # Accept: mark as approved (isPending -> false)
            skill_repo.update_is_pending(skill_id, False)
            return {"message": "Skill geaccepteerd"}
        else:
            # Decline: remove the pending skill entirely
            skill_repo.delete_by_id(skill_id)
            return {"message": "Skill afgewezen en verwijderd"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Er is een fout opgetreden bij het bijwerken/verwijderen van de skill: " + str(e))

@router.patch("/{skill_id}/name")
@auth(role="teacher")
async def update_skill_name(
    skill_id: str = Path(..., description="Skill ID"),
    body: dict = Body(...)
):
    """
    Update a skill's name (unique). Teacher-only.
    """
    new_name = body.get("name", "").strip()
    if not new_name:
        raise HTTPException(status_code=400, detail="Veld 'name' is verplicht")

    # Ensure skill exists
    try:
        skill_repo.get_by_id(skill_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Skill niet gevonden")

    try:
        skill_repo.update_name(skill_id, new_name)
        return {"message": "Skillnaam bijgewerkt"}
    except Exception as e:
        # Unique constraint (if enforced by TypeDB schema) could surface here
        if "unique" in str(e).lower() or "key constraint" in str(e).lower():
            raise HTTPException(status_code=409, detail=f"Er bestaat al een skill met de naam '{new_name}'.")
        raise HTTPException(status_code=500, detail="Er is een fout opgetreden bij het bijwerken van de skillnaam: " + str(e))
