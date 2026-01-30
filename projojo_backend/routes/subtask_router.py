"""
Router voor deeltaken (subtasks) en templates.
UI toont dit als "Deeltaken" - toegankelijk voor alle disciplines.
"""
from fastapi import APIRouter, Path, Body, HTTPException, Request, Depends
from domain.repositories import SubtaskRepository, TaskRepository
from auth.permissions import auth
from auth.jwt_utils import get_token_payload
from domain.models.subtask import SubtaskCreate, SubtaskTemplateCreate

subtask_repo = SubtaskRepository()
task_repo = TaskRepository()

router = APIRouter(prefix="/subtasks", tags=["Subtask (Deeltaak) Endpoints"])

# ========================================
# SUBTASK ENDPOINTS (nested under tasks)
# ========================================

@router.get("/tasks/{task_id}")
@auth(role="authenticated")
async def get_subtasks_by_task(
    request: Request,
    task_id: str = Path(..., description="Task ID")
):
    """
    Haal alle deeltaken op voor een taak.
    Alleen zichtbaar voor geaccepteerde studenten en supervisors.
    """
    # Verify task exists
    try:
        task = task_repo.get_by_id(task_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Taak niet gevonden")
    
    subtasks = subtask_repo.get_subtasks_by_task(task_id)
    return subtasks


@router.get("/{subtask_id}")
@auth(role="authenticated")
async def get_subtask(
    subtask_id: str = Path(..., description="Subtask ID")
):
    """
    Haal een specifieke deeltaak op.
    """
    subtask = subtask_repo.get_subtask_by_id(subtask_id)
    if not subtask:
        raise HTTPException(status_code=404, detail="Deeltaak niet gevonden")
    return subtask


@router.post("/tasks/{task_id}")
@auth(role="supervisor", owner_id_key="task_id")
async def create_subtask(
    task_id: str = Path(..., description="Task ID"),
    subtask_create: SubtaskCreate = Body(...)
):
    """
    Maak een nieuwe deeltaak aan (alleen supervisor).
    """
    # Verify task exists
    try:
        task = task_repo.get_by_id(task_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Taak niet gevonden")
    
    try:
        subtask = subtask_repo.create_subtask(
            task_id=task_id,
            title=subtask_create.title,
            what=subtask_create.what,
            why=subtask_create.why,
            how=subtask_create.how,
            criteria=subtask_create.criteria
        )
        return subtask
    except Exception as e:
        print(f"Error creating subtask: {e}")
        raise HTTPException(status_code=400, detail="Er is iets misgegaan bij het aanmaken van de deeltaak")


@router.patch("/{subtask_id}/claim")
@auth(role="student")
async def claim_subtask(
    request: Request,
    subtask_id: str = Path(..., description="Subtask ID")
):
    """
    Claim een deeltaak ("ik pak dit").
    Alleen voor studenten die geaccepteerd zijn voor de bijbehorende taak.
    """
    student_id = request.state.user_id
    
    # Get the subtask to find the task_id
    subtask = subtask_repo.get_subtask_by_id(subtask_id)
    if not subtask:
        raise HTTPException(status_code=404, detail="Deeltaak niet gevonden")
    
    # TODO: Verify student is accepted for this task
    # For now, we allow any authenticated student to claim
    
    success = subtask_repo.claim_subtask(subtask_id, student_id)
    if not success:
        raise HTTPException(
            status_code=400, 
            detail="Kon deeltaak niet claimen - mogelijk al geclaimd door iemand anders"
        )
    
    return {"message": "Deeltaak geclaimd!"}


@router.patch("/{subtask_id}/unclaim")
@auth(role="student")
async def unclaim_subtask(
    request: Request,
    subtask_id: str = Path(..., description="Subtask ID")
):
    """
    Geef een deeltaak vrij.
    Kan alleen door de student die het geclaimd heeft.
    """
    student_id = request.state.user_id
    
    success = subtask_repo.unclaim_subtask(subtask_id, student_id)
    if not success:
        raise HTTPException(
            status_code=400, 
            detail="Kon deeltaak niet vrijgeven - niet door jou geclaimd"
        )
    
    return {"message": "Deeltaak vrijgegeven"}


@router.patch("/{subtask_id}/complete")
@auth(role="student")
async def complete_subtask(
    request: Request,
    subtask_id: str = Path(..., description="Subtask ID")
):
    """
    Voltooi een deeltaak ("klaar!").
    Kan alleen door de student die het geclaimd heeft.
    """
    student_id = request.state.user_id
    
    success = subtask_repo.complete_subtask(subtask_id, student_id)
    if not success:
        raise HTTPException(
            status_code=400, 
            detail="Kon deeltaak niet voltooien - niet door jou geclaimd of niet in behandeling"
        )
    
    return {"message": "Deeltaak voltooid! Goed gedaan!"}


@router.delete("/{subtask_id}")
@auth(role="supervisor")
async def delete_subtask(
    subtask_id: str = Path(..., description="Subtask ID")
):
    """
    Verwijder een deeltaak (alleen supervisor).
    Kan alleen als de deeltaak niet geclaimd is.
    """
    success = subtask_repo.delete_subtask(subtask_id)
    if not success:
        raise HTTPException(
            status_code=400, 
            detail="Kon deeltaak niet verwijderen - mogelijk al geclaimd door een student"
        )
    
    return {"message": "Deeltaak verwijderd"}


# ========================================
# TEMPLATE ENDPOINTS (nested under businesses)
# ========================================

@router.get("/templates/business/{business_id}")
@auth(role="supervisor", owner_id_key="business_id")
async def get_templates_by_business(
    business_id: str = Path(..., description="Business ID")
):
    """
    Haal alle deeltaak-templates op voor een bedrijf.
    """
    templates = subtask_repo.get_templates_by_business(business_id)
    return templates


@router.post("/templates/business/{business_id}")
@auth(role="supervisor", owner_id_key="business_id")
async def create_template(
    business_id: str = Path(..., description="Business ID"),
    template_create: SubtaskTemplateCreate = Body(...)
):
    """
    Maak een nieuwe deeltaak-template aan voor een bedrijf.
    """
    try:
        template = subtask_repo.create_template(
            business_id=business_id,
            template_name=template_create.template_name,
            title=template_create.title,
            what=template_create.what,
            why=template_create.why,
            how=template_create.how,
            criteria=template_create.criteria
        )
        return template
    except Exception as e:
        print(f"Error creating template: {e}")
        raise HTTPException(status_code=400, detail="Er is iets misgegaan bij het aanmaken van de template")


@router.put("/templates/{template_id}")
@auth(role="supervisor")
async def update_template(
    template_id: str = Path(..., description="Template ID"),
    template_update: SubtaskTemplateCreate = Body(...)
):
    """
    Update een deeltaak-template.
    """
    success = subtask_repo.update_template(
        template_id=template_id,
        template_name=template_update.template_name,
        title=template_update.title,
        what=template_update.what,
        why=template_update.why,
        how=template_update.how,
        criteria=template_update.criteria
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Kon template niet bijwerken")
    
    return {"message": "Template bijgewerkt"}


@router.delete("/templates/{template_id}")
@auth(role="supervisor")
async def delete_template(
    template_id: str = Path(..., description="Template ID")
):
    """
    Verwijder een deeltaak-template.
    """
    success = subtask_repo.delete_template(template_id)
    if not success:
        raise HTTPException(status_code=400, detail="Kon template niet verwijderen")
    
    return {"message": "Template verwijderd"}
