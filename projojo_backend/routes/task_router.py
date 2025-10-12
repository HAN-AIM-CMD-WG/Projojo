from fastapi import APIRouter, Path, Query, Body, HTTPException, Depends

from domain.repositories import TaskRepository, UserRepository
from auth.jwt_utils import get_token_payload
from service import task_service
from domain.models.task import RegistrationCreate, RegistrationUpdate, Task, TaskCreate
from datetime import datetime

task_repo = TaskRepository()
user_repo = UserRepository()

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

@router.post("/{task_id}/registrations")
async def create_registration(
    task_id: str = Path(..., description="Task ID"),
    registration: RegistrationCreate = Body(..., description="The motivation for registration"),
    payload: dict = Depends(get_token_payload)
):
    """
    Create a new registration for a student to a task
    """
    # Check if user is a student
    if payload.get("role") != "student":
        raise HTTPException(status_code=403, detail="Alleen studenten kunnen zich registreren voor taken")

    student_email = payload["sub"]

    task = task_repo.get_by_id(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Taak niet gevonden")

    if task.total_accepted >= task.total_needed:
        raise HTTPException(status_code=400, detail="Deze taak heeft geen beschikbare plekken meer")

    # check if the student is already registered for this task
    existing_registration = user_repo.get_student_registrations(student_email)
    if task_id in existing_registration:
        raise HTTPException(status_code=400, detail="Je bent al geregistreerd voor deze taak")

    try:
        task_repo.create_registration(task_id, student_email, registration.motivation)
        return {"message": "Registratie succesvol aangemaakt"}
    except Exception:
        raise HTTPException(status_code=400, detail="Er is iets misgegaan bij het registreren")

@router.put("/{task_id}/registrations/{student_id}")
async def update_registration(
    task_id: str = Path(..., description="Task ID"),
    student_id: str = Path(..., description="Student ID"),
    registration: RegistrationUpdate = Body(..., description="Whether the registration is accepted or rejected, and optional response"),
    payload: dict = Depends(get_token_payload)
):
    """
    Update a registration status (accept/reject) with optional response
    """
    # Check if user is a supervisor or teacher
    if payload.get("role") not in ["supervisor", "teacher"]:
        raise HTTPException(status_code=403, detail="Alleen supervisors of docenten kunnen registraties bijwerken")

    task = task_repo.get_by_id(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Taak niet gevonden")

    if registration.accepted and task.total_accepted >= task.total_needed:
        raise HTTPException(status_code=400, detail="Deze taak heeft geen beschikbare plekken meer")

    try:
        task_repo.update_registration(task_id, student_id, registration.accepted, registration.response)
        return {"message": "Registratie succesvol bijgewerkt"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Er is iets misgegaan bij het bijwerken van de registratie." + str(e))
    
@router.post("/", response_model=Task, status_code=201)
async def create_task(
    task_create: TaskCreate = Body(...),
    payload: dict = Depends(get_token_payload)
):
    """
    Create a new task
    """
    # Check if user is a supervisor
    if payload.get("role") != "supervisor":
        raise HTTPException(status_code=403, detail="Alleen supervisors kunnen taken aanmaken")

    try:
        task = Task(
            id=task_create.name,
            name=task_create.name,
            description=task_create.description,
            total_needed=task_create.total_needed,
            project_id=task_create.project_id,
            created_at=datetime.now()
        )
        
        created_task = task_repo.create(task)
        return created_task
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Er is iets misgegaan bij het aanmaken van de taak: {str(e)}")
