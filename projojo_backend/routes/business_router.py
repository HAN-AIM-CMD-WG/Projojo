from fastapi import APIRouter, Path

from domain.repositories import (
    BusinessRepository,
    ProjectRepository,
    TaskRepository,
    SkillRepository,
)

business_repo = BusinessRepository()
project_repo = ProjectRepository()
task_repo = TaskRepository()
skill_repo = SkillRepository()

from domain.models import Business

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


@router.get("/complete")
async def get_all_businesses_with_full_nesting():
    """
    Get all businesses with projects, tasks, and skills nested.
    """
    businesses = business_repo.get_all()
    for business in businesses:
        business.projects = project_repo.get_projects_by_business(business.name)
        for project in business.projects:
            project.tasks = task_repo.get_tasks_by_project(project.name)
            for task in project.tasks:
                task.skills = skill_repo.get_task_skills(task.name)
    return businesses

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
