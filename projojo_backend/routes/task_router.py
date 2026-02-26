from fastapi import APIRouter, Path, Query, Body, HTTPException, Request, Form
from domain.repositories import TaskRepository, UserRepository, SkillRepository
from auth.permissions import auth
from service import task_service
from domain.models.task import RegistrationCreate, RegistrationUpdate, Task, TaskCreate
from service.validation_service import is_valid_length
from datetime import datetime

task_repo = TaskRepository()
user_repo = UserRepository()
skill_repo = SkillRepository()

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

@router.get("/archived")
@auth(role="teacher")
async def get_archived_tasks():
    """
    Get archived tasks (teacher-only)
    """
    return task_repo.get_archived()

@router.post("/{task_id}/archive")
@auth(role="supervisor", owner_id_key="task_id")
async def archive_task(
    request: Request,
    task_id: str = Path(..., description="Task ID")
):
    """
    Archive a single task and its registrations. Teacher and owning supervisor are allowed.
    """
    try:
        task_repo.archive(task_id, request.state.user_id)
        return {"message": "Taak succesvol gearchiveerd"}
    except Exception as e:
        print(f"Error archiving task {task_id}: {e}")
        raise HTTPException(status_code=500, detail="Er is een fout opgetreden bij het archiveren van de taak.")

@router.post("/{task_id}/unarchive")
@auth(role="teacher")
async def unarchive_task(
    task_id: str = Path(..., description="Task ID")
):
    """
    Unarchive a single task and its registrations. Teacher-only.
    """
    try:
        task_repo.unarchive(task_id)
        return {"message": "Taak succesvol hersteld"}
    except Exception as e:
        print(f"Error unarchiving task {task_id}: {e}")
        raise HTTPException(status_code=500, detail="Er is een fout opgetreden bij het herstellen van de taak.")


@router.get("/{task_id}/emails/colleagues")
@auth(role="supervisor", owner_id_key="task_id")
async def get_colleague_email_addresses(request: Request, task_id: str = Path(..., description="Task ID")):
    """
    Get email addresses of supervisors which are colleagues of the requesting supervisor (or teacher) for the business of the task
    """
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
    # Ensure task exists
    try:
        task_repo.get_by_id(task_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Taak niet gevonden")

    skills = skill_repo.get_task_skills(task_id)
    return skills

@router.put("/{task_id}/skills")
@auth(role="supervisor", owner_id_key="task_id")
async def update_task_skills_endpoint(
    task_id: str = Path(..., description="Task ID"),
    body: list[str] = Body(..., description="Array of skill IDs"),
):
    """
    Update required skills for a task (set-based). Allowed for teachers or owning supervisors.
    """
    # Validate task exists
    try:
        task_repo.get_by_id(task_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Taak niet gevonden")

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
        if (hasattr(e, 'status_code')):
            raise HTTPException(status_code=e.status_code, detail=str(e))
        print(f"{type(e)} - {e}")
        raise HTTPException(status_code=400, detail="Er is iets misgegaan bij het registreren.")

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
        if (hasattr(e, 'status_code')):
            raise HTTPException(status_code=e.status_code, detail=str(e))
        print(f"{type(e)} - {e}")
        raise HTTPException(status_code=400, detail="Er is iets misgegaan bij het bijwerken van de registratie.")

@router.post("/{project_id}", response_model=Task, status_code=201)
@auth(role="supervisor", owner_id_key="project_id")
async def create_task(
    project_id: str = Path(..., description="Project ID"),
    task_create: TaskCreate = Body(...)
):
    """
    Create a new task
    """
    if not is_valid_length(task_create.name, 100):
        raise HTTPException(
            status_code=400,
            detail="De lengte van de naam moet tussen de 1 en 100 tekens liggen."
        )

    if not is_valid_length(task_create.description, 4000, strip_md=True):
        raise HTTPException(
            status_code=400,
            detail="De lengte van de beschrijving moet tussen de 1 en 4000 tekens liggen."
        )

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
        if (hasattr(e, 'status_code')):
            raise HTTPException(status_code=e.status_code, detail=str(e))
        print(f"{type(e)} - {e}")
        raise HTTPException(status_code=400, detail="Er is iets misgegaan bij het aanmaken van de taak.")

@router.put("/{task_id}")
@auth(role="supervisor", owner_id_key="task_id")
async def update_task(
    task_id: str = Path(..., description="Task ID to update"),
    name: str = Form(...),
    description: str = Form(...),
    total_needed: int = Form(...),
):
    """
    Update task information.
    """
    if not is_valid_length(name, 100):
        raise HTTPException(
            status_code=400,
            detail="De lengte van de naam moet tussen de 1 en 100 tekens liggen."
        )

    if not is_valid_length(description, 4000, strip_md=True):
        raise HTTPException(
            status_code=400,
            detail="De lengte van de beschrijving moet tussen de 1 en 4000 tekens liggen."
        )

    # Verify task exists
    existing_task = task_repo.get_by_id(task_id)
    if not existing_task:
        raise HTTPException(status_code=404, detail="Taak niet gevonden.")

    try:
        task_repo.update(task_id, name, description, total_needed)
        return {"message": "Taak succesvol bijgewerkt"}
    except Exception as e:
        print(f"Error updating task {task_id}: {e}")
        raise HTTPException(status_code=400, detail="Er is een fout opgetreden bij het bijwerken van de taak.")
