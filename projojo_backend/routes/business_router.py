from fastapi import APIRouter, Path, Body, HTTPException

from domain.repositories import (
    BusinessRepository,
    ProjectRepository,
    TaskRepository,
    SkillRepository,
)

from domain.models import Business
from datetime import datetime, timezone

business_repo = BusinessRepository()
project_repo = ProjectRepository()
task_repo = TaskRepository()
skill_repo = SkillRepository()


router = APIRouter(prefix="/businesses", tags=["Business Endpoints"])


# Business endpoints
@router.get("/")
async def get_all_businesses_with_projects():
    """
    Get all businesses for debugging purposes
    """
    businesses = business_repo.get_all()
    for business in businesses:
        business.projects = project_repo.get_projects_by_business(business.name)

    return businesses


@router.get("/basic", response_model=list[Business])
async def get_all_businesses_basic():
    """
    Get all businesses without projects
    """
    return business_repo.get_all()


@router.get("/complete")
async def get_all_businesses_with_full_nesting():
    """
    Get all businesses with projects, tasks, and skills nested.
    """
    return business_repo.get_all_with_full_nesting()


@router.get("/{name}")
async def get_business(name: str = Path(..., description="Business name")):
    """
    Get a specific business by name
    """
    business = business_repo.get_by_id(name)
    return business


@router.get("/{name}/projects")
async def get_business_projects(name: str = Path(..., description="Business name")):
    """
    Get all projects for a business
    """
    projects = project_repo.get_projects_by_business(name)
    return projects


@router.post("/{id}/invite")
async def create_supervisor_invite_key(id: str = Path(..., description="Business ID")):
    """
    Create an invite key for a supervisor
    """
    # TODO: check if user is authorized to create invite keys (supervisor or teacher, and in case of supervisor same business id)

    # invite_key = business_repo.create_supervisor_invite_key(id)
    # return invite_key
    return {
        "key": "example-invite-key",
        "inviteType": "business",
        "isUsed": False,
        "createdAt": datetime.now(timezone.utc),
        "businessId": id
    }


@router.post("/", response_model=Business)
async def create_business(name: str = Body(...)):
    """
    Create a new business with the given name.
    """
    try:
        created_business = business_repo.create(name)
        return created_business
    except Exception as e:
        if "has a key constraint violation" in str(e):
            raise HTTPException(
                status_code=409,
                detail=f"Er bestaat al een bedrijf met de naam '{name}'.",
            )
        raise HTTPException(
            status_code=500,
            detail="Er is een fout opgetreden bij het aanmaken van het bedrijf",
        )
