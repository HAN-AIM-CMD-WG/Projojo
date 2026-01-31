from fastapi import APIRouter, Path, Query, Body, HTTPException, Request, Form, Depends
from domain.repositories import TaskRepository, UserRepository, SkillRepository, ProjectRepository
from auth.permissions import auth
from auth.jwt_utils import get_token_payload
from exceptions import ItemRetrievalException
from service import task_service
from domain.models.task import RegistrationCreate, RegistrationUpdate, Task, TaskCreate
from datetime import datetime
from typing import List, Optional

def normalize_datetime(dt):
    """Remove timezone info from datetime to allow comparison with naive datetimes."""
    if dt is None:
        return None
    if hasattr(dt, 'tzinfo') and dt.tzinfo is not None:
        return dt.replace(tzinfo=None)
    return dt

task_repo = TaskRepository()
user_repo = UserRepository()
skill_repo = SkillRepository()
project_repo = ProjectRepository()

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

@router.put("/{task_id}/skills")
@auth(role="supervisor", owner_id_key="task_id")
async def update_task_skills(
    task_id: str = Path(..., description="Task ID"),
    skill_ids: List[str] = Body(..., description="List of skill IDs to set for this task")
):
    """
    Update skills for a task.
    
    - Adding skills: always allowed
    - Removing skills: only allowed if no students have registered for the task
    
    Returns information about what was added, removed, and any locked skills.
    """
    try:
        # Verify task exists
        task = task_repo.get_by_id(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Taak niet gevonden")
        
        result = skill_repo.update_task_skills(task_id, skill_ids)
        
        # If some skills were locked, include a warning message
        if result.get("locked"):
            result["message"] = "Sommige skills konden niet worden verwijderd omdat er al aanmeldingen zijn voor deze taak."
        else:
            result["message"] = "Skills succesvol bijgewerkt"
        
        return result
    except ItemRetrievalException:
        raise HTTPException(status_code=404, detail="Taak niet gevonden")
    except Exception as e:
        print(f"Error updating skills for task {task_id}: {e}")
        raise HTTPException(status_code=400, detail="Er is iets misgegaan bij het bijwerken van de skills")

@router.get("/{task_id}/registrations")
@auth(role="supervisor", owner_id_key="task_id")
async def get_registrations(task_id: str = Path(..., description="Task ID")):
    """
    Get all open registrations for a task with student details and skills
    """
    registrations = task_repo.get_registrations(task_id)
    return registrations

@router.get("/{task_id}/registrations/all")
@auth(role="supervisor", owner_id_key="task_id")
async def get_all_registrations(task_id: str = Path(..., description="Task ID")):
    """
    Get all registrations for a task (pending and accepted) with full timeline.
    Used for the task progress management UI.
    Returns:
        - pending: list of pending registrations awaiting decision
        - accepted: list of accepted registrations with started_at/completed_at status
    """
    registrations = task_repo.get_all_registrations(task_id)
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
    # Check if user is a student (already enforced by @auth decorator, but double-check)
    if request.state.user_role != "student":
        raise HTTPException(status_code=403, detail="Alleen studenten kunnen zich registreren voor taken")

    student_id = request.state.user_id  # Extract user ID from request state

    try:
        task = task_repo.get_by_id(task_id)
    except ItemRetrievalException:
        raise HTTPException(status_code=404, detail="Taak niet gevonden")

    if task.total_accepted >= task.total_needed:
        raise HTTPException(status_code=400, detail="Deze taak heeft geen beschikbare plekken meer")

    # check if the student is already registered for this task
    existing_registrations = user_repo.get_student_registrations(student_id)
    existing_task_ids = [reg.get('id') for reg in existing_registrations]
    if task_id in existing_task_ids:
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
    try:
        task = task_repo.get_by_id(task_id)
    except ItemRetrievalException:
        raise HTTPException(status_code=404, detail="Taak niet gevonden")

    if registration.accepted and task.total_accepted >= task.total_needed:
        raise HTTPException(status_code=400, detail="Deze taak heeft geen beschikbare plekken meer")

    try:
        task_repo.update_registration(task_id, student_id, registration.accepted, registration.response)
        return {"message": "Registratie succesvol bijgewerkt"}
    except Exception as e:
        print(f"Error updating registration for task {task_id} and student {student_id}: {e}")
        raise HTTPException(status_code=400, detail="Er is iets misgegaan bij het bijwerken van de registratie.")

@router.delete("/{task_id}/registrations")
async def cancel_registration(
    task_id: str = Path(..., description="Task ID"),
    payload: dict = Depends(get_token_payload)
):
    """
    Cancel a pending registration for a task (only if not yet accepted/rejected)
    """
    # Check if user is a student
    if payload["role"] != "student":
        raise HTTPException(status_code=403, detail="Alleen studenten kunnen hun aanmelding annuleren")

    student_id = payload["sub"]  # Extract user ID from JWT

    try:
        deleted = task_repo.delete_registration(task_id, student_id)
        if not deleted:
            raise HTTPException(
                status_code=404, 
                detail="Aanmelding niet gevonden of al verwerkt (geaccepteerd/afgewezen)"
            )
        return {"message": "Aanmelding succesvol geannuleerd"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail="Er is iets misgegaan bij het annuleren van de aanmelding")

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
        # Get project to validate dates and potentially inherit them
        project = project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project niet gevonden.")
        
        # Use provided dates or inherit from project
        # Normalize all dates to naive datetimes to avoid comparison issues
        start_date = normalize_datetime(task_create.start_date) or normalize_datetime(project.start_date)
        end_date = normalize_datetime(task_create.end_date) or normalize_datetime(project.end_date)
        project_start = normalize_datetime(project.start_date)
        project_end = normalize_datetime(project.end_date)
        
        # Validate task dates are within project period
        if start_date and project_start and start_date < project_start:
            raise HTTPException(
                status_code=400, 
                detail=f"Taak startdatum ({start_date.strftime('%d-%m-%Y')}) kan niet voor de project startdatum ({project_start.strftime('%d-%m-%Y')}) liggen."
            )
        if end_date and project_end and end_date > project_end:
            raise HTTPException(
                status_code=400,
                detail=f"Taak einddatum ({end_date.strftime('%d-%m-%Y')}) kan niet na de project einddatum ({project_end.strftime('%d-%m-%Y')}) liggen."
            )
        if start_date and end_date and start_date > end_date:
            raise HTTPException(
                status_code=400,
                detail="Startdatum kan niet na de einddatum liggen."
            )
        
        task = Task(
            id=None,  # ID will be generated by repository
            name=task_create.name,
            description=task_create.description,
            total_needed=task_create.total_needed,
            project_id=project_id,
            created_at=datetime.now(),
            start_date=start_date,
            end_date=end_date
        )

        created_task = task_repo.create(task)
        return created_task
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating task for project {project_id}: {e}")
        raise HTTPException(status_code=400, detail="Er is iets misgegaan bij het aanmaken van de taak.")

@router.put("/{task_id}")
@auth(role="supervisor", owner_id_key="task_id")
async def update_task(
    task_id: str = Path(..., description="Task ID to update"),
    name: str = Form(...),
    description: str = Form(...),
    total_needed: int = Form(...),
    start_date: Optional[str] = Form(None),
    end_date: Optional[str] = Form(None),
):
    """
    Update task information.
    """
    # Verify task exists
    existing_task = task_repo.get_by_id(task_id)
    if not existing_task:
        raise HTTPException(status_code=404, detail="Taak niet gevonden.")
    
    # Parse dates if provided
    parsed_start = None
    parsed_end = None
    
    if start_date and start_date.strip():
        try:
            parsed_start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Ongeldige startdatum formaat.")
    
    if end_date and end_date.strip():
        try:
            parsed_end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Ongeldige einddatum formaat.")
    
    # Normalize parsed dates
    parsed_start = normalize_datetime(parsed_start)
    parsed_end = normalize_datetime(parsed_end)
    
    # Get project for date validation
    if existing_task.project_id:
        project = project_repo.get_by_id(existing_task.project_id)
        if project:
            project_start = normalize_datetime(project.start_date)
            project_end = normalize_datetime(project.end_date)
            # Validate dates are within project period
            if parsed_start and project_start and parsed_start < project_start:
                raise HTTPException(
                    status_code=400,
                    detail=f"Taak startdatum kan niet voor de project startdatum ({project_start.strftime('%d-%m-%Y')}) liggen."
                )
            if parsed_end and project_end and parsed_end > project_end:
                raise HTTPException(
                    status_code=400,
                    detail=f"Taak einddatum kan niet na de project einddatum ({project_end.strftime('%d-%m-%Y')}) liggen."
                )
    
    # Validate start before end
    if parsed_start and parsed_end and parsed_start > parsed_end:
        raise HTTPException(status_code=400, detail="Startdatum kan niet na de einddatum liggen.")

    try:        
        task_repo.update(task_id, name, description, total_needed, parsed_start, parsed_end)
        return {"message": "Taak succesvol bijgewerkt"}
    except Exception as e:
        print(f"Error updating task {task_id}: {e}")
        raise HTTPException(status_code=400, detail="Er is een fout opgetreden bij het bijwerken van de taak.")


@router.patch("/{task_id}/registrations/{student_id}/start")
async def mark_registration_started(
    task_id: str = Path(..., description="Task ID"),
    student_id: str = Path(..., description="Student ID"),
    payload: dict = Depends(get_token_payload)
):
    """
    Mark a registration as started (student begins working on the task).
    
    Can be called by:
    - The student themselves
    - A supervisor (for their business's tasks)
    - A teacher
    """
    role = payload["role"]
    user_id = payload["sub"]
    
    # Authorization: student can mark their own, supervisor/teacher can mark any
    if role == "student" and user_id != student_id:
        raise HTTPException(status_code=403, detail="Je kunt alleen je eigen taak als gestart markeren")
    
    if role not in ["student", "supervisor", "teacher"]:
        raise HTTPException(status_code=403, detail="Geen toegang tot deze actie")
    
    try:
        task_repo.mark_registration_started(task_id, student_id)
        return {"message": "Taak gemarkeerd als gestart"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Kon taak niet als gestart markeren: {str(e)}")


@router.patch("/{task_id}/registrations/{student_id}/complete")
async def mark_registration_completed(
    task_id: str = Path(..., description="Task ID"),
    student_id: str = Path(..., description="Student ID"),
    payload: dict = Depends(get_token_payload)
):
    """
    Mark a registration as completed (student finished the task).
    This adds the task to the student's portfolio.
    
    Can be called by:
    - A supervisor (for their business's tasks)
    - A teacher
    
    Note: Students cannot mark their own tasks as completed - must be verified by supervisor/teacher.
    """
    role = payload["role"]
    
    # Only supervisor or teacher can mark as completed
    if role not in ["supervisor", "teacher"]:
        raise HTTPException(
            status_code=403, 
            detail="Alleen supervisors of docenten kunnen taken als voltooid markeren"
        )
    
    try:
        task_repo.mark_registration_completed(task_id, student_id)
        return {"message": "Taak gemarkeerd als voltooid en toegevoegd aan portfolio"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Kon taak niet als voltooid markeren: {str(e)}")


@router.get("/{task_id}/registrations/{student_id}/timeline")
async def get_registration_timeline(
    task_id: str = Path(..., description="Task ID"),
    student_id: str = Path(..., description="Student ID"),
    payload: dict = Depends(get_token_payload)
):
    """
    Get the full timeline for a registration.
    
    Returns timestamps for:
    - requested_at: When student applied
    - accepted_at: When supervisor accepted
    - started_at: When student started working
    - completed_at: When task was marked complete
    """
    timeline = task_repo.get_registration_timeline(task_id, student_id)
    
    if not timeline:
        raise HTTPException(status_code=404, detail="Registratie niet gevonden")
    
    return timeline
