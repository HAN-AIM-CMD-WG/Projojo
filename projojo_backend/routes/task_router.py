from fastapi import APIRouter, Path, Query, HTTPException, Depends
from pydantic import BaseModel

from domain.repositories import TaskRepository, UserRepository
from auth.jwt_utils import get_token_payload
from service import task_service

task_repo = TaskRepository()
user_repo = UserRepository()

# Request models
class RegistrationCreate(BaseModel):
    motivation: str

class RegistrationUpdate(BaseModel):
    accepted: bool
    response: str = ""

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
async def get_colleague_email_addresses(payload: dict = Depends(get_token_payload)):
    """
    Get email addresses of colleague supervisors in the same business
    """
    # Check if user is a supervisor
    if payload.get("role") != "supervisor":
        raise HTTPException(status_code=403, detail="Alleen supervisors kunnen collega's opvragen")

    supervisor_email = payload["sub"]  # Extract email from JWT sub field

    # Get colleagues for this supervisor
    colleagues = user_repo.get_colleagues(supervisor_email)
    return [colleague.email for colleague in colleagues]

@router.get("/{name}/student-emails")
async def get_student_email_addresses(
    name: str = Path(..., description="Task name"),
    selection: str = Query(..., description="Comma-separated list: registered,accepted,rejected")
):
    """
    Get student email addresses for a task based on status selection
    Example: ?selection=registered,accepted or ?selection=rejected
    """
    emails = []
    statuses = [status.strip() for status in selection.split(",")]

    # Get students based on selection criteria
    for status in statuses:
        if status in ["registered", "accepted", "rejected"]:
            students = user_repo.get_students_by_task_status(name, status)
            emails.extend([student.email for student in students])

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

@router.get("/{name}/registrations")
async def get_registrations(name: str = Path(..., description="Task name")):
    """
    Get all open registrations for a task with student details and skills
    """
    registrations = task_repo.get_registrations(name)
    return registrations

@router.post("/{name}/registrations")
async def create_registration(
    name: str = Path(..., description="Task name"),
    registration: RegistrationCreate = ...,
    payload: dict = Depends(get_token_payload)
):
    """
    Create a new registration for a student to a task
    """
    # Check if user is a student
    if payload.get("role") != "student":
        raise HTTPException(status_code=403, detail="Alleen studenten kunnen zich registreren voor taken")

    student_email = payload["sub"]  # Extract email from JWT sub field

    try:
        task_repo.create_registration(name, student_email, registration.motivation)
        return {"message": "Registratie succesvol aangemaakt"}
    except Exception:
        raise HTTPException(status_code=400, detail="Er is iets misgegaan bij het registreren")

@router.put("/{task_id}/registrations/{student_id}")
async def update_registration(
    task_id: str = Path(..., description="Task ID"),
    student_id: str = Path(..., description="Student ID"),
    registration: RegistrationUpdate = ...,
    payload: dict = Depends(get_token_payload)
):
    """
    Update a registration status (accept/reject) with optional response
    """
    # Check if user is a supervisor or teacher
    if payload.get("role") not in ["supervisor", "teacher"]:
        raise HTTPException(status_code=403, detail="Alleen supervisors of docenten kunnen registraties bijwerken")

    try:
        task_repo.update_registration(task_id, student_id, registration.accepted, registration.response)
        return {"message": "Registratie succesvol bijgewerkt"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Er is iets misgegaan bij het bijwerken van de registratie." + str(e))

