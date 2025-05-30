from fastapi import APIRouter, Path, Body

from domain.repositories import SkillRepository
skill_repo = SkillRepository()

from domain.models import Skill

router = APIRouter(prefix="/skills", tags=["Skill Endpoints"])

# Skill endpoints
@router.get("/")
async def get_all_skills():
    """
    Get all skills for debugging purposes
    """
    skills = skill_repo.get_all()
    return skills

@router.get("/{name}")
async def get_skill(name: str = Path(..., description="Skill name")):
    """
    Get a specific skill by name
    """
    skill = skill_repo.get_by_id(name)
    return skill

@router.post("/", response_model=Skill, status_code=201)
async def create_skill(skill: Skill = Body(...)):
    """
    Create a new skill
    """
    created_skill = skill_repo.create(skill)
    return created_skill
