from fastapi import APIRouter, Path, Query, Body, HTTPException, Depends

from domain.repositories import TaskRepository, UserRepository, SkillRepository
from auth.jwt_utils import get_token_payload
from service import task_service
from domain.models.task import RegistrationCreate, RegistrationUpdate, Task, TaskCreate
from datetime import datetime

task_repo = TaskRepository()
user_repo = UserRepository()
skill_repo = SkillRepository()

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
    if payload["role"] != "supervisor":
        raise HTTPException(status_code=403, detail="Alleen supervisors kunnen collega's opvragen")

    supervisor_id = payload["sub"]  # Extract user ID from JWT

    # Get colleagues for this supervisor
    colleagues = user_repo.get_colleagues(supervisor_id)
    return [colleague.email for colleague in colleagues]

@router.get("/{id}/student-emails")
async def get_student_email_addresses(
    id: str = Path(..., description="Task ID"),
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
            students = user_repo.get_students_by_task_status(id, status)
            emails.extend([student.email for student in students])

    # Remove duplicates
    unique_emails = list(set(emails))
    return unique_emails

# Generic routes last
@router.get("/{id}")
async def get_task(id: str = Path(..., description="Task ID")):
    """
    Get a specific task by ID
    """
    task = task_repo.get_by_id(id)
    return task

@router.get("/{id}/skills")
async def get_task_skills(id: str = Path(..., description="Task ID")):
    """
    Get all skills required for a task
    """
    # Ensure task exists
    try:
        task_repo.get_by_id(id)
    except Exception:
        raise HTTPException(status_code=404, detail="Taak niet gevonden")

    skills = skill_repo.get_task_skills(id)
    return skills

@router.put("/{task_id}/skills")
async def update_task_skills_endpoint(
    task_id: str = Path(..., description="Task ID"),
    body: list[str] = Body(..., description="Array of skill IDs"),
    payload: dict = Depends(get_token_payload)
):
    """
    Update required skills for a task (set-based). Allowed for teachers or owning supervisors.
    """
    role = payload.get("role")
    if role not in ["teacher", "supervisor"]:
        raise HTTPException(status_code=403, detail="Je bent niet geautoriseerd om skills te beheren")

    # Validate task exists
    try:
        task_repo.get_by_id(task_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Taak niet gevonden")

    # Ownership check for supervisors
    if role == "supervisor":
        supervisor = user_repo.get_supervisor_by_id(payload.get("sub"))
        if not supervisor:
            raise HTTPException(status_code=403, detail="Je bent niet geautoriseerd om skills te beheren")
        task_business_id = task_repo.get_business_id_by_task(task_id)
        if not task_business_id or str(supervisor.business_association_id) != str(task_business_id):
            raise HTTPException(status_code=403, detail="Je bent niet geautoriseerd om deze taak te beheren")

    # Validate body
    if body is None or not isinstance(body, list):
        raise HTTPException(status_code=400, detail="Ongeldige invoer: verwacht een lijst met skill-IDs")

    # Deduplicate and normalize to string IDs; allow empty list to clear all skills
    try:
        unique_ids = list(dict.fromkeys([str(sid) for sid in body]))
    except Exception:
        raise HTTPException(status_code=400, detail="Ongeldige invoer: kan skill-IDs niet verwerken")

    # Verify that all skill IDs exist
    missing: list[str] = []
    for sid in unique_ids:
        try:
            skill_repo.get_by_id(sid)
        except Exception:
            missing.append(sid)
    if missing:
        raise HTTPException(status_code=404, detail=f"Onbekende skill IDs: {', '.join(missing)}")

    try:
        skill_repo.update_task_skills(task_id, unique_ids)
        return {"message": "Skills bijgewerkt"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Er is een fout opgetreden bij het bijwerken van de skills: " + str(e))

@router.get("/{id}/registrations")
async def get_registrations(id: str = Path(..., description="Task ID")):
    """
    Get all open registrations for a task with student details and skills
    """
    registrations = task_repo.get_registrations(id)
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
    if payload["role"] != "student":
        raise HTTPException(status_code=403, detail="Alleen studenten kunnen zich registreren voor taken")

    student_id = payload["sub"]  # Extract user ID from JWT

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
    if payload["role"] not in ["supervisor", "teacher"]:
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
    if payload["role"] != "supervisor":
        raise HTTPException(status_code=403, detail="Alleen supervisors kunnen taken aanmaken")

    try:
        task = Task(
            id=None,  # ID will be generated by repository
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
