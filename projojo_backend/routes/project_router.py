from fastapi import APIRouter, Path, File, UploadFile, Form, HTTPException, Depends, Query
from typing import Annotated, Optional
from datetime import datetime
from pydantic import BaseModel
from auth.permissions import auth

from domain.repositories import ProjectRepository
from domain.repositories.archive_repository import ArchiveRepository
from domain.models import (
    ProjectCreation,
    ArchiveRequest,
    RestoreRequest,
    ArchivedProjectItem,
    ArchivePreviewResponse,
    RestorePreviewResponse,
    ArchiveActionResponse,
)
from service import task_service, save_image
from auth.jwt_utils import get_token_payload
from service.validation_service import is_valid_length

project_repo = ProjectRepository()
archive_repo = ArchiveRepository()


router = APIRouter(prefix="/projects", tags=["Project Endpoints"])

# Public endpoints (no authentication required)
@router.get("/public")
async def get_public_projects():
    """
    Get all public projects for the discovery page.
    No authentication required.
    """
    projects = project_repo.get_public_projects()
    return projects


@router.get("/public/{project_id}")
async def get_public_project(project_id: str = Path(..., description="Project ID")):
    """
    Get a specific public project by ID.
    No authentication required.
    Returns 404 if project is not public or doesn't exist.
    """
    projects = project_repo.get_public_projects()
    for p in projects:
        if p.get("id") == project_id:
            return p
    raise HTTPException(status_code=404, detail="Project niet gevonden of niet publiek beschikbaar")


# Authenticated project endpoints
@router.get("/")
@auth(role="authenticated")
async def get_all_projects():
    """
    Get all projects for debugging purposes
    """
    projects = project_repo.get_all()
    return projects


@router.get("/archived", response_model=list[ArchivedProjectItem])
async def get_archived_projects(payload: dict = Depends(get_token_payload)):
    if payload.get("role") != "teacher":
        raise HTTPException(status_code=403, detail="Alleen docenten mogen gearchiveerde projecten bekijken")
    return project_repo.get_archived()

@router.get("/{project_id}")
@auth(role="authenticated")
async def get_project(project_id: str = Path(..., description="Project ID")):
    """
    Get a specific project by ID
    """
    project = project_repo.get_by_id(project_id)
    return project


@router.get("/{project_id}/complete")
@auth(role="authenticated")
async def get_project_full(project_id: str = Path(..., description="Project ID")):
    """
    Get a specific project by ID with all tasks and skills
    """
    project = project_repo.get_by_id(project_id)
    project.tasks = task_service.get_tasks_with_skills_by_project(project_id)

    project_dict = project.__dict__
    project_dict["business"] = project_repo.get_business_by_project(project_id)
    return project_dict


@router.get("/{project_id}/tasks")
@auth(role="authenticated")
async def get_project_tasks(project_id: str = Path(..., description="Project ID")):
    """
    Get all tasks for a project
    """
    tasks = task_service.get_tasks_with_skills_by_project(project_id)
    return tasks

@router.post("/", response_model=ProjectCreation, status_code=201)
@auth(role="supervisor", owner_id_key="business_id")
async def create_project(
    name: Annotated[str, Form(...)],
    description: Annotated[str, Form(...)],
    supervisor_id: Annotated[str, Form(...)],
    business_id: Annotated[str, Form(...)],
    location: str | None = Form(None),
    start_date: str | None = Form(None),
    end_date: str | None = Form(None),
    image: UploadFile = File(...)
):
    """
    Create a new project with image upload
    """
    if not is_valid_length(name, 100):
        raise HTTPException(
            status_code=400,
            detail="De lengte van de naam moet tussen de 1 en 100 tekens liggen."
        )

    if location and not is_valid_length(location, 255):
        raise HTTPException(
            status_code=400,
            detail="De lengte van de locatie moet tussen de 1 en 255 tekens liggen."
        )

    if not is_valid_length(description, 4000, strip_md=True):
        raise HTTPException(
            status_code=400,
            detail="De lengte van de beschrijving moet tussen de 1 en 4000 tekens liggen."
        )

    # Validate required fields
    if not image or not image.filename:
        raise HTTPException(
            status_code=400,
            detail="Een projectafbeelding is verplicht."
        )

    if project_repo.check_project_exists(name, business_id):
        raise HTTPException(
            status_code=400,
            detail=f"Project met de naam '{name}' bestaat al binnen dit bedrijf."
        )

    # Parse optional date fields
    parsed_start_date = datetime.fromisoformat(start_date) if start_date else None
    parsed_end_date = datetime.fromisoformat(end_date) if end_date else None

    # Validate dates if both provided
    if parsed_start_date and parsed_end_date and parsed_start_date > parsed_end_date:
        raise HTTPException(
            status_code=400,
            detail="De startdatum mag niet na de einddatum liggen."
        )

    # Save the image with a random filename
    unique_filename = save_image(image)

    # Create project data
    project_creation = ProjectCreation(
        id=None,  # ID will be generated by repository
        name=name,
        description=description,
        image_path=unique_filename,  # Use the unique filename
        created_at=datetime.now(),
        business_id=business_id,
        location=location,
        supervisor_id=supervisor_id,
        start_date=parsed_start_date,
        end_date=parsed_end_date
    )

    # Create the project in the database
    created_project = project_repo.create(project_creation)
    return created_project

@router.put("/{project_id}")
@auth(role="supervisor", owner_id_key="project_id")
async def update_project(
    project_id: str = Path(..., description="Project ID to update"),
    name: str = Form(...),
    description: str = Form(...),
    location: str | None = Form(None),
    start_date: str | None = Form(None),
    end_date: str | None = Form(None),
    image: UploadFile | None = File(None),
):
    """
    Update project information with optional photo upload.
    Only a teacher or a supervisor of the same business may update the project.
    """
    # Parse optional date fields
    parsed_start_date = datetime.fromisoformat(start_date) if start_date else None
    parsed_end_date = datetime.fromisoformat(end_date) if end_date else None

    # Validate dates if both provided
    if parsed_start_date and parsed_end_date and parsed_start_date > parsed_end_date:
        raise HTTPException(
            status_code=400,
            detail="De startdatum mag niet na de einddatum liggen."
        )

    if not is_valid_length(name, 100):
        raise HTTPException(
            status_code=400,
            detail="De lengte van de naam moet tussen de 1 en 100 tekens liggen."
        )

    if location and not is_valid_length(location, 255):
        raise HTTPException(
            status_code=400,
            detail="De lengte van de locatie moet tussen de 1 en 255 tekens liggen."
        )

    if not is_valid_length(description, 4000, strip_md=True):
        raise HTTPException(
            status_code=400,
            detail="De lengte van de beschrijving moet tussen de 1 en 4000 tekens liggen."
        )

    # Handle photo upload if provided
    image_filename = None
    if image and image.filename:
        try:
            image_filename = save_image(image)
        except Exception as e:
            if hasattr(e, 'status_code'):
                raise HTTPException(status_code=e.status_code, detail=e.detail)
            print(f"Error saving image: {e}")
            raise HTTPException(status_code=500, detail="Er is een fout opgetreden bij het opslaan van de afbeelding")

    try:
        project_repo.update(project_id, name, description, location, image_filename, parsed_start_date, parsed_end_date)
        return {"message": "Project succesvol bijgewerkt"}
    except Exception as e:
        if hasattr(e, 'status_code'):
            raise HTTPException(status_code=e.status_code, detail=e.detail)
        print(f"Error updating project: {e}")
        raise HTTPException(status_code=500, detail="Er is een fout opgetreden bij het bijwerken van het project")


@router.get("/{project_id}/students")
async def get_project_students(
    project_id: str = Path(..., description="Project ID"),
    payload: dict = Depends(get_token_payload)
):
    """
    Get all students with registrations for tasks of this project.
    Accessible by teachers and the project's supervisor.
    """
    role = payload.get("role")
    user_id = payload.get("sub")

    # Check authorization
    if role == "student":
        raise HTTPException(status_code=403, detail="Studenten hebben geen toegang tot deze informatie")

    if role == "supervisor" and not project_repo.check_project_owner(project_id, user_id):
        raise HTTPException(status_code=403, detail="Je hebt alleen toegang tot je eigen projecten")

    students = project_repo.get_students_by_project(project_id)
    return students


@router.patch("/{project_id}/archive", response_model=ArchivePreviewResponse | ArchiveActionResponse)
async def archive_project(
    project_id: str = Path(..., description="Project ID"),
    archive_request: ArchiveRequest = None,
    payload: dict = Depends(get_token_payload)
):
    """
    Archive a project.
    Only teachers may archive projects.
    """
    role = payload.get("role")

    if archive_request is None:
        raise HTTPException(status_code=422, detail="Archive request body is verplicht")

    if role != "teacher":
        raise HTTPException(status_code=403, detail="Alleen docenten mogen projecten archiveren")

    project = project_repo.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project niet gevonden")

    preview = archive_repo.preview_project_archive(project_id)
    if preview is None:
        raise HTTPException(status_code=404, detail="Project niet gevonden")

    if not archive_request.confirm:
        return preview

    archive_repo.archive_project(project_id, payload.get("sub"), archive_request.archived_reason)
    return ArchiveActionResponse(message="Project succesvol gearchiveerd")


@router.patch("/{project_id}/visibility")
async def set_project_visibility(
    project_id: str = Path(..., description="Project ID"),
    is_public: bool = Query(..., description="Whether the project should be publicly visible"),
    payload: dict = Depends(get_token_payload)
):
    """
    Set the public visibility of a project.
    - Supervisor: only their own projects
    - Teacher: all projects
    """
    role = payload.get("role")
    user_id = payload.get("sub")

    # Check authorization
    if role == "student":
        raise HTTPException(status_code=403, detail="Studenten kunnen de zichtbaarheid niet wijzigen")

    if role == "supervisor":
        if not project_repo.check_project_owner(project_id, user_id):
            raise HTTPException(status_code=403, detail="Je kunt alleen je eigen projecten aanpassen")
    elif role != "teacher":
        raise HTTPException(status_code=403, detail="Alleen supervisors en docenten kunnen de zichtbaarheid wijzigen")

    project_repo.set_public(project_id, is_public)

    return {"message": f"Project is nu {'publiek zichtbaar' if is_public else 'niet meer publiek zichtbaar'}"}


class ImpactSummaryUpdate(BaseModel):
    """Request model for updating impact summary."""
    impact_summary: str | None = None


@router.patch("/{project_id}/impact")
async def set_project_impact(
    project_id: str = Path(..., description="Project ID"),
    update: ImpactSummaryUpdate = None,
    payload: dict = Depends(get_token_payload)
):
    """
    Set the impact summary of a project.
    Typically used for completed projects to showcase their results.
    - Supervisor: only their own projects
    - Teacher: all projects
    """
    role = payload.get("role")
    user_id = payload.get("sub")

    # Check authorization
    if role == "student":
        raise HTTPException(status_code=403, detail="Studenten kunnen de impact niet wijzigen")

    if role == "supervisor":
        if not project_repo.check_project_owner(project_id, user_id):
            raise HTTPException(status_code=403, detail="Je kunt alleen je eigen projecten aanpassen")
    elif role != "teacher":
        raise HTTPException(status_code=403, detail="Alleen supervisors en docenten kunnen de impact wijzigen")

    impact_summary = update.impact_summary if update else None
    project_repo.set_impact_summary(project_id, impact_summary)

    return {"message": "Impact samenvatting bijgewerkt"}


@router.patch("/{project_id}/restore", response_model=RestorePreviewResponse | ArchiveActionResponse)
async def restore_project(
    project_id: str = Path(..., description="Project ID"),
    restore_request: RestoreRequest | None = None,
    payload: dict = Depends(get_token_payload)
):
    """
    Restore an archived project.
    Only teachers may restore archived projects.
    """
    role = payload.get("role")

    if role != "teacher":
        raise HTTPException(status_code=403, detail="Alleen docenten mogen projecten herstellen")

    preview = archive_repo.preview_project_restore(project_id)
    if preview is None:
        try:
            project_repo.get_by_id(project_id)
        except Exception:
            raise HTTPException(status_code=404, detail="Project niet gevonden")
        raise HTTPException(status_code=409, detail="Dit project is niet gearchiveerd")

    if not restore_request or not restore_request.confirm:
        return preview

    if preview.blocked:
        raise HTTPException(status_code=409, detail=preview.blocked_reason or "Project kan niet worden hersteld")

    if not restore_request.selected and (preview.candidates.tasks or preview.candidates.registrations):
        raise HTTPException(
            status_code=422,
            detail="Selecteer welke onderliggende items hersteld moeten worden",
        )

    result = archive_repo.restore_project(project_id, restore_request.selected)
    if result == "blocked":
        raise HTTPException(status_code=409, detail="Bovenliggend bedrijf is nog gearchiveerd")
    if result == "active":
        raise HTTPException(status_code=409, detail="Dit project is niet gearchiveerd")
    if result == "missing":
        raise HTTPException(status_code=404, detail="Project niet gevonden")

    return ArchiveActionResponse(message="Project succesvol hersteld")
