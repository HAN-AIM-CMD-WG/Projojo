from fastapi import APIRouter, Depends, HTTPException

from auth.jwt_utils import get_token_payload
from domain.repositories import UserRepository, ProjectRepository, TaskRepository
from auth.permissions import auth

user_repo = UserRepository()
project_repo = ProjectRepository()
task_repo = TaskRepository()

router = APIRouter(prefix="/supervisors", tags=["Supervisor Endpoints"])

@router.get("/")
@auth(role="authenticated")
async def get_all_supervisors():
    """
    Get all supervisors for debugging purposes
    """
    supervisors = user_repo.get_all_supervisors()
    return supervisors

@router.get("/dashboard")
async def get_supervisor_dashboard(payload: dict = Depends(get_token_payload)):
    """
    Get dashboard data for the authenticated supervisor:
    - Business info
    - Projects with tasks
    - Pending registrations (students waiting for approval)
    - Active students (accepted registrations)
    """
    if payload["role"] != "supervisor":
        raise HTTPException(status_code=403, detail="Alleen supervisors hebben toegang tot dit dashboard")
    
    supervisor_id = payload["sub"]
    
    # Get the business ID for this supervisor
    business_id = user_repo.get_supervisor_business_id(supervisor_id)
    if not business_id:
        raise HTTPException(status_code=404, detail="Geen bedrijf gevonden voor deze supervisor")
    
    # Get projects for this business
    projects = project_repo.get_projects_by_business(business_id)
    
    # Get pending registrations
    pending_registrations = task_repo.get_pending_registrations_by_business(business_id)
    
    # Get active students (accepted registrations)
    active_students = task_repo.get_active_students_by_business(business_id)
    
    # Calculate statistics
    total_tasks = sum(len(project.tasks) if project.tasks else 0 for project in projects)
    
    return {
        "business_id": business_id,
        "projects": [project.model_dump() for project in projects],
        "pending_registrations": pending_registrations,
        "active_students": active_students,
        "stats": {
            "total_projects": len(projects),
            "total_tasks": total_tasks,
            "pending_count": len(pending_registrations),
            "active_students_count": len(active_students)
        }
    }
