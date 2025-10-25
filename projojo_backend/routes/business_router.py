from fastapi import APIRouter, Path, Body, HTTPException, File, UploadFile, Form, Depends
from typing import Optional
from auth.jwt_utils import get_token_payload

from domain.repositories import (
    BusinessRepository,
    ProjectRepository,
    TaskRepository,
    SkillRepository,
)

from domain.models import Business
from service import save_image

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

@router.put("/{business_id}")
async def update_business(
    business_id: str = Path(..., description="Business ID/name to update"),
    name: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    photos: Optional[UploadFile] = File(None),
    payload: dict = Depends(get_token_payload)
):
    """
    Update business information with optional photo upload.
    """
    allowed = (
        payload.get("role") == "teacher"
        or (payload.get("role") == "supervisor" and payload.get("business") == business_id)
        )
    if not allowed:
        raise HTTPException(status_code=403, detail="Je bent niet bevoegd om de bedrijfspagina bij te werken")
    
    # Verify business exists
    existing_business = business_repo.get_by_id(business_id)
    if not existing_business:
        raise HTTPException(status_code=404, detail="Bedrijf niet gevonden")

    # Handle photo upload if provided
    image_filename = None
    if photos and photos.filename:
        try:
        # Save the image with a random filename
            _, image_filename = save_image(photos)
        except Exception as e:
            raise HTTPException(status_code=500, detail="Er is een fout opgetreden bij het opslaan van de afbeelding" + str(e))

    try:        
        business_repo.update(business_id, name, description, location, image_filename)
        return {"message": "Bedrijf succesvol bijgewerkt"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Er is een fout opgetreden bij het bijwerken van het bedrijf." + str(e)
        )
