from fastapi import APIRouter, Path

from domain.repositories import BusinessRepository, ProjectRepository
business_repo = BusinessRepository()
project_repo = ProjectRepository()

from domain.models import BusinessProjects

router = APIRouter(prefix="/businesses", tags=["Business Endpoints"])

# Business endpoints
@router.get("/")
async def get_all_businesses_with_projects():
    """
    Get all businesses for debugging purposes
    """
    businesses_with_projects = []
    for business in business_repo.get_all():
        projects = project_repo.get_projects_by_business(business.name)

        businesses_with_projects.append(
            BusinessProjects(**business.model_dump(), projects=projects)
        )

    return businesses_with_projects

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
