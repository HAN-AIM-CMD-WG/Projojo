from fastapi import APIRouter, Path, Body, HTTPException, File, UploadFile, Form
from typing import Optional
from auth.permissions import auth

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
@auth(role="authenticated")
async def get_all_businesses_with_projects():
    """
    Get all businesses for debugging purposes
    """
    businesses = business_repo.get_all()
    for business in businesses:
        business.projects = project_repo.get_projects_by_business(business.id)

    return businesses


@router.get("/basic", response_model=list[Business])
@auth(role="authenticated")
async def get_all_businesses_basic():
    """
    Get all businesses without projects
    """
    return business_repo.get_all()


@router.get("/complete")
@auth(role="authenticated")
async def get_all_businesses_with_full_nesting():
    """
    Get all businesses with projects, tasks, and skills nested.
    """
    return business_repo.get_all_with_full_nesting()

@router.get("/{business_id}")
@auth(role="authenticated")
async def get_business(business_id: str = Path(..., description="Business ID")):
    """
    Get a specific business by ID
    """
    business = business_repo.get_by_id(business_id)
    return business

@router.get("/{business_id}/projects")
@auth(role="authenticated")
async def get_business_projects(business_id: str = Path(..., description="Business ID")):
    """
    Get all projects for a business
    """
    projects = project_repo.get_projects_by_business(business_id)
    return projects


@router.post("/", response_model=Business)
@auth(role="teacher")
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
@auth(role="supervisor", owner_id_key="business_id")
async def update_business(
    business_id: str = Path(..., description="Business ID to update"),
    name: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    image: Optional[UploadFile] = File(None)
):
    """
    Update business information with optional photo upload.
    """
    # Verify business exists
    existing_business = business_repo.get_by_id(business_id)
    if not existing_business:
        raise HTTPException(status_code=404, detail="Bedrijf niet gevonden")

    # Handle photo upload if provided
    image_filename = None
    if image and image.filename:
        try:
            # Save the image with a random filename
            image_filename = save_image(image)
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error saving image for business {business_id}: {e}")
            raise HTTPException(status_code=500, detail="Er is een fout opgetreden bij het opslaan van de afbeelding")

    try:
        business_repo.update(business_id, name, description, location, image_filename)
        return {"message": "Bedrijf succesvol bijgewerkt"}
    except Exception as e:
        print(f"Error updating business {business_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Er is een fout opgetreden bij het bijwerken van het bedrijf."
        )
