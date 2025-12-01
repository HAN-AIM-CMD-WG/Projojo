from fastapi import APIRouter, Path, Body, HTTPException, Depends

from domain.repositories import SkillRepository
from domain.models import Skill
from auth.jwt_utils import get_token_payload

skill_repo = SkillRepository()

router = APIRouter(prefix="/skills", tags=["Skill Endpoints"])

# Skill endpoints
@router.get("/")
async def get_all_skills():
    """
    Get all skills for debugging purposes
    """
    skills = skill_repo.get_all()
    return skills

@router.get("/{id}")
async def get_skill(id: str = Path(..., description="Skill ID")):
    """
    Get a specific skill by ID
    """
    skill = skill_repo.get_by_id(id)
    return skill

@router.post("/", response_model=Skill, status_code=201)
async def create_skill(skill: Skill = Body(...)):
    """
    Create a new skill
    """
    created_skill = skill_repo.create(skill)
    return created_skill

@router.patch("/{id}/acceptance")
async def update_skill_acceptance(
    id: str = Path(..., description="Skill ID"),
    body: dict = Body(...),
    payload: dict = Depends(get_token_payload)
):
    """
    Mark a skill as processed (accepted/declined) by setting isPending to false.
    Teacher-only.
    """
    if payload.get("role") != "teacher":
        raise HTTPException(status_code=403, detail="Je bent niet geautoriseerd om skills te beheren")

    accepted = body.get("accepted", None)
    if accepted is None:
        raise HTTPException(status_code=400, detail="Veld 'accepted' is verplicht")

    # Ensure skill exists
    try:
        skill_repo.get_by_id(id)
    except Exception:
        raise HTTPException(status_code=404, detail="Skill niet gevonden")

    try:
        # For now both accept/decline result in removing from pending
        skill_repo.update_is_pending(id, False)
        return {"message": "Skill bijgewerkt"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Er is een fout opgetreden bij het bijwerken van de skill: " + str(e))

@router.patch("/{id}/name")
async def update_skill_name(
    id: str = Path(..., description="Skill ID"),
    body: dict = Body(...),
    payload: dict = Depends(get_token_payload)
):
    """
    Update a skill's name (unique). Teacher-only.
    """
    if payload.get("role") != "teacher":
        raise HTTPException(status_code=403, detail="Je bent niet geautoriseerd om skills te beheren")

    new_name = body.get("name", "").strip()
    if not new_name:
        raise HTTPException(status_code=400, detail="Veld 'name' is verplicht")

    # Ensure skill exists
    try:
        skill_repo.get_by_id(id)
    except Exception:
        raise HTTPException(status_code=404, detail="Skill niet gevonden")

    try:
        skill_repo.update_name(id, new_name)
        return {"message": "Skillnaam bijgewerkt"}
    except Exception as e:
        # Unique constraint (if enforced by TypeDB schema) could surface here
        if "unique" in str(e).lower() or "key constraint" in str(e).lower():
            raise HTTPException(status_code=409, detail=f"Er bestaat al een skill met de naam '{new_name}'.")
        raise HTTPException(status_code=500, detail="Er is een fout opgetreden bij het bijwerken van de skillnaam: " + str(e))
