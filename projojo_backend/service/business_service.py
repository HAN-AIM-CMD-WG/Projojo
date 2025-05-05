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

    business_dict = business.model_dump()
    business_dict.pop('projects', None)  # Remove projects key to avoid duplicate

    return Business(**business_dict, projects=projects)