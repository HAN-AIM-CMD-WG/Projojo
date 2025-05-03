from domain.models import Business
from domain.repositories import BusinessRepository, ProjectRepository

business_repo = BusinessRepository()
project_repo = ProjectRepository()

def get_business_with_projects(business_id: str) -> Business:
    """
    Get a business along with its projects.
    """
    business = business_repo.get_by_id(business_id)
    projects = project_repo.get_projects_by_business(business_id)

    return Business(
        id=business.id,
        name=business.name,
        description=business.description,
        image_path=business.image_path,
        location=business.location,
        projects=projects
    )