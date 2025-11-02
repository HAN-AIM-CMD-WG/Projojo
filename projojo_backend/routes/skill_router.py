from fastapi import APIRouter, Path, Body

from domain.repositories import SkillRepository
from domain.models import Skill

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
