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
        business.projects = project_repo.get_projects_by_business(business.id)

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


@router.get("/archived", response_model=list[Business])
async def get_archived_businesses(payload: dict = Depends(get_token_payload)):
    """
    Get all archived businesses. Only accessible by teachers.
    """
    if payload.get("role") != "teacher":
        raise HTTPException(status_code=403, detail="Alleen docenten mogen gearchiveerde bedrijven bekijken")
    
    return business_repo.get_archived()


@router.get("/{id}")
async def get_business(id: str = Path(..., description="Business ID")):
    """
    Get a specific business by ID
    """
    business = business_repo.get_by_id(id)
    return business

@router.get("/{id}/projects")
async def get_business_projects(id: str = Path(..., description="Business ID")):
    """
    Get all projects for a business
    """
    projects = project_repo.get_projects_by_business(id)
    return projects


@router.post("/", response_model=Business)
async def create_business(name: str = Body(...), as_draft: bool = Body(False)):
    """
    Create a new business with the given name.
    Set as_draft=True to create as archived (hidden from students).
    """
    try:
        created_business = business_repo.create(name, as_draft=as_draft)
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
    business_id: str = Path(..., description="Business ID to update"),
    name: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    image: Optional[UploadFile] = File(None),
    country: Optional[str] = Form(None),
    sector: Optional[str] = Form(None),
    company_size: Optional[str] = Form(None),
    website: Optional[str] = Form(None),
    payload: dict = Depends(get_token_payload)
):
    """
    Update business information with optional photo upload.
    """
    allowed = (
        payload.get("role") == "teacher"
        or (payload.get("role") == "supervisor" and payload.get("businessId") == business_id)
        )
    if not allowed:
        raise HTTPException(status_code=403, detail="Je bent niet bevoegd om de bedrijfspagina bij te werken")
    
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
        except Exception as e:
            raise HTTPException(status_code=500, detail="Er is een fout opgetreden bij het opslaan van de afbeelding" + str(e))

    try:        
        business_repo.update(business_id, name, description, location, image_filename, country, sector, company_size, website)
        return {"message": "Bedrijf succesvol bijgewerkt"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Er is een fout opgetreden bij het bijwerken van het bedrijf." + str(e)
        )


@router.patch("/{business_id}/archive")
async def archive_business(
    business_id: str = Path(..., description="Business ID to archive"),
    payload: dict = Depends(get_token_payload)
):
    """
    Archive a business. Only accessible by teachers.
    Archived businesses are hidden from students and supervisors.
    """
    if payload.get("role") != "teacher":
        raise HTTPException(status_code=403, detail="Alleen docenten mogen bedrijven archiveren")
    
    # Verify business exists
    existing_business = business_repo.get_by_id(business_id)
    if not existing_business:
        raise HTTPException(status_code=404, detail="Bedrijf niet gevonden")
    
    try:
        business_repo.archive_business(business_id)
        return {"message": "Bedrijf succesvol gearchiveerd"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Er is een fout opgetreden bij het archiveren van het bedrijf: " + str(e)
        )


@router.patch("/{business_id}/restore")
async def restore_business(
    business_id: str = Path(..., description="Business ID to restore"),
    payload: dict = Depends(get_token_payload)
):
    """
    Restore an archived business. Only accessible by teachers.
    """
    if payload.get("role") != "teacher":
        raise HTTPException(status_code=403, detail="Alleen docenten mogen bedrijven herstellen")
    
    # Verify business exists
    existing_business = business_repo.get_by_id(business_id)
    if not existing_business:
        raise HTTPException(status_code=404, detail="Bedrijf niet gevonden")
    
    try:
        business_repo.restore_business(business_id)
        return {"message": "Bedrijf succesvol hersteld"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Er is een fout opgetreden bij het herstellen van het bedrijf: " + str(e)
        )
