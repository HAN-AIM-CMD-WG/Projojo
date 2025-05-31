from fastapi import APIRouter, Path, Body

from domain.repositories import ProjectRepository
project_repo = ProjectRepository()

from domain.models import ProjectCreation
from service import task_service

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


@router.get("/{name}/tasks")
async def get_project_tasks(name: str = Path(..., description="Project name")):
    """
    Get all tasks for a project
    """
    tasks = task_service.get_tasks_with_skills_by_project(name)
    return tasks

@router.post("/", response_model=ProjectCreation, status_code=201)
async def create_project(project_creation: ProjectCreation = Body(...)):
    """
    Create a new project
    """
    created_project = project_repo.create(project_creation)
    return created_project
