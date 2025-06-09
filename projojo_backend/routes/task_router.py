from fastapi import APIRouter, Path, Query, HTTPException, Request

from domain.repositories import TaskRepository, UserRepository
from auth.jwt_utils import decode_jwt_token
task_repo = TaskRepository()
user_repo = UserRepository()

from service import task_service

router = APIRouter(prefix="/tasks", tags=["Task Endpoints"])

# Task endpoints
@router.get("/")
async def get_all_tasks():
    """
    Get all tasks for debugging purposes
    """
    tasks = task_repo.get_all()
    return tasks


# Specific routes first (more specific paths before generic ones)
@router.get("/emails/colleagues")
async def get_colleague_email_addresses(request: Request):
    """
    Get email addresses of colleague supervisors in the same business
    """
    # Extract JWT token from authorization header
    auth_header = request.headers.get("authorization")

    if not auth_header or not auth_header.startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = auth_header.replace("bearer ", "")

    try:
        # Decode JWT token and extract supervisor email
        payload = decode_jwt_token(token)
        if payload.get("role") != "supervisor":
            raise HTTPException(status_code=403, detail="Supervisor access required")

        supervisor_email = payload["sub"]  # Extract email from JWT sub field

        # Get colleagues for this supervisor
        colleagues = user_repo.get_colleagues(supervisor_email)
        return [colleague.email for colleague in colleagues]

    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("/{name}/student-emails")
async def get_student_email_addresses(
    name: str = Path(..., description="Task name"),
    selection: int = Query(..., description="Bitwise selection: 1=registered, 2=accepted, 4=rejected")
):
    """
    Get student email addresses for a task based on selection criteria
    """
    emails = []

    # Get students based on selection criteria
    if selection & 1:  # registered students
        registered_students = user_repo.get_students_by_task_status(name, "registered")
        emails.extend([student.email for student in registered_students])

    if selection & 2:  # accepted students
        accepted_students = user_repo.get_students_by_task_status(name, "accepted")
        emails.extend([student.email for student in accepted_students])

    if selection & 4:  # rejected students
        rejected_students = user_repo.get_students_by_task_status(name, "rejected")
        emails.extend([student.email for student in rejected_students])

    # Remove duplicates
    unique_emails = list(set(emails))
    return unique_emails

# Generic routes last
@router.get("/{name}")
async def get_task(name: str = Path(..., description="Task name")):
    """
    Get a specific task by name
    """
    task = task_repo.get_by_id(name)
    return task

@router.get("/{name}/skills")
async def get_task_skills(name: str = Path(..., description="Task name")):
    """
    Get all skills required for a task
    """
    task_skills = task_service.get_task_with_skills(name)
    return task_skills