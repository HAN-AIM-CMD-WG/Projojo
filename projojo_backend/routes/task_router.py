from fastapi import APIRouter, Path, Query, Body, HTTPException, Request
from domain.repositories import TaskRepository, UserRepository
from auth.permissions import auth
from service import task_service
from domain.models.task import RegistrationCreate, RegistrationUpdate, Task, TaskCreate
from datetime import datetime

task_repo = TaskRepository()
user_repo = UserRepository()

router = APIRouter(prefix="/tasks", tags=["Task Endpoints"])

# Task endpoints
@router.get("/")
@auth(role="authenticated")
async def get_all_tasks():
    """
    Get all tasks for debugging purposes
    """
    tasks = task_repo.get_all()
    return tasks


@router.get("/{task_id}/emails/colleagues")
@auth(role="supervisor", owner_id_key="task_id")
async def get_colleague_email_addresses(request: Request, task_id: str = Path(..., description="Task ID")):
    """
    Get email addresses of supervisors which are colleagues of the requesting supervisor (or teacher) for the business of the task
    """
    # Backend supports both supervisors and teachers, but this may be unwanted behavior. For now, return 403 for teachers.
    if request.state.user_role != "supervisor":
        raise HTTPException(status_code=403, detail="Alleen supervisors kunnen collega's opvragen")

    # Get the task to find the project
    task = task_repo.get_by_id(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Taak niet gevonden")

    # Get colleagues in the business of the task
    return user_repo.get_colleagues(task_id, request.state.user_id)

@router.get("/{task_id}/student-emails")
@auth(role="supervisor", owner_id_key="task_id")
async def get_student_email_addresses(
    task_id: str = Path(..., description="Task ID"),
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
            students = user_repo.get_students_by_task_status(task_id, status)
            emails.extend([student.email for student in students])

    # Remove duplicates
    unique_emails = list(set(emails))
    return unique_emails

# Generic routes last
@router.get("/{task_id}")
@auth(role="authenticated")
async def get_task(task_id: str = Path(..., description="Task ID")):
    """
    Get a specific task by ID
    """
    task = task_repo.get_by_id(task_id)
    return task

@router.get("/{task_id}/skills")
@auth(role="authenticated")
async def get_task_skills(task_id: str = Path(..., description="Task ID")):
    """
    Get all skills required for a task
    """
    task_skills = task_service.get_task_with_skills(task_id)
    return task_skills

@router.get("/{task_id}/registrations")
@auth(role="supervisor", owner_id_key="task_id")
async def get_registrations(task_id: str = Path(..., description="Task ID")):
    """
    Get all open registrations for a task with student details and skills
    """
    registrations = task_repo.get_registrations(task_id)
    return registrations

@router.post("/{task_id}/registrations")
@auth(role="student")
async def create_registration(
    request: Request,
    task_id: str = Path(..., description="Task ID"),
    registration: RegistrationCreate = Body(..., description="The motivation for registration")
):
    """
    Create a new registration for a student to a task
    """
    # Check if user is a student
    if request.state.user_role != "student":
        raise HTTPException(status_code=403, detail="Alleen studenten kunnen zich registreren voor taken")

    student_id = request.state.user_id

    task = task_repo.get_by_id(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Taak niet gevonden")

    if task.total_accepted >= task.total_needed:
        raise HTTPException(status_code=400, detail="Deze taak heeft geen beschikbare plekken meer")

    # check if the student is already registered for this task
    existing_registration = user_repo.get_student_registrations(student_id)
    if task_id in existing_registration:
        raise HTTPException(status_code=400, detail="Je bent al geregistreerd voor deze taak")

    try:
        task_repo.create_registration(task_id, student_id, registration.motivation)
        return {"message": "Registratie succesvol aangemaakt"}
    except Exception as e:
        print(e)
        raise HTTPException(status_code=400, detail="Er is iets misgegaan bij het registreren")

@router.put("/{task_id}/registrations/{student_id}")
@auth(role="supervisor", owner_id_key="task_id")
async def update_registration(
    task_id: str = Path(..., description="Task ID"),
    student_id: str = Path(..., description="Student ID"),
    registration: RegistrationUpdate = Body(..., description="Whether the registration is accepted or rejected, and optional response")
):
    """
    Update a registration status (accept/reject) with optional response
    """
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

@router.post("/{project_id}", response_model=Task, status_code=201)
@auth(role="supervisor", owner_id_key="project_id")
async def create_task(
    project_id: str = Path(..., description="Project ID"),
    task_create: TaskCreate = Body(...)
):
    """
    Create a new task
    """
    try:
        task = Task(
            id=None,  # ID will be generated by repository
            name=task_create.name,
            description=task_create.description,
            total_needed=task_create.total_needed,
            project_id=project_id,
            created_at=datetime.now()
        )

        created_task = task_repo.create(task)
        return created_task
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Er is iets misgegaan bij het aanmaken van de taak: {str(e)}")
