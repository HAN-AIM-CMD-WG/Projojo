from fastapi import APIRouter, Path, File, UploadFile, Form, HTTPException
from typing import Annotated
from datetime import datetime

from domain.repositories import ProjectRepository
project_repo = ProjectRepository()

from domain.models import ProjectCreation
from service import task_service, save_image

router = APIRouter(prefix="/projects", tags=["Project Endpoints"])

# Project endpoints
@router.get("/")
async def get_all_projects():
    """
    Get all projects for debugging purposes
    """
    projects = project_repo.get_all()
    return projects

@router.get("/{name}")
async def get_project(name: str = Path(..., description="Project name")):
    """
    Get a specific project by name
    """
    project = project_repo.get_by_id(name)
    return project


@router.get("/{name}/complete")
async def get_project_full(name: str = Path(..., description="Project name")):
    """
    Get a specific project by name with all tasks and skills
    """
    project = project_repo.get_by_id(name)
    project.tasks = task_service.get_tasks_with_skills_by_project(name)

    project_dict = project.__dict__
    project_dict["business"] = project_repo.get_business_by_project(name)
    return project_dict


@router.get("/{name}/tasks")
async def get_project_tasks(name: str = Path(..., description="Project name")):
    """
    Get all tasks for a project
    """
    tasks = task_service.get_tasks_with_skills_by_project(name)
    return tasks

@router.post("/", response_model=ProjectCreation, status_code=201)
async def create_project(
    name: Annotated[str, Form(...)],
    description: Annotated[str, Form(...)],
    supervisor_id: Annotated[str, Form(...)],
    business_id: Annotated[str, Form(...)],
    image: UploadFile = File(...)
):
    """
    Create a new project with image upload
    """
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

    # Save the image with a random filename
    _, unique_filename = save_image(image)

    # Create project data
    project_creation = ProjectCreation(
        id=name,
        name=name,
        description=description,
        image_path=unique_filename,  # Use the unique filename
        created_at=datetime.now(),
        supervisor_id=supervisor_id,
        business_id=business_id
    )

    # Create the project in the database
    created_project = project_repo.create(project_creation)
    return created_project
