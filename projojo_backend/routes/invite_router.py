from fastapi import APIRouter, Path, HTTPException, Depends
from auth.jwt_utils import get_token_payload
from domain.repositories import InviteRepository, BusinessRepository

invite_repo = InviteRepository()
business_repo = BusinessRepository()

router = APIRouter(prefix="/invites", tags=["Invite Endpoints"])

@router.post("/teacher")
async def create_teacher_invite_key(payload: dict = Depends(get_token_payload)):
    """
    Create an invite key for a teacher
    """
    if payload.get("role") != "teacher":
        raise HTTPException(status_code=403, detail="Alleen docenten kunnen andere docenten uitnodigen")

    invite_key = invite_repo.save_invite_key("teacher")
    return invite_key

@router.post("/supervisor/{business_id}")
async def create_supervisor_invite_key(business_id: str = Path(..., description="Business ID"), payload: dict = Depends(get_token_payload)):
    """
    Create an invite key for a supervisor
    """
    if payload.get("role") not in ["supervisor", "teacher"]:
        raise HTTPException(status_code=403, detail="Alleen supervisors of docenten kunnen andere supervisors uitnodigen")

    if payload.get("role") == "supervisor" and payload.get("business") != business_id:
        raise HTTPException(status_code=403, detail="Supervisors kunnen alleen andere supervisors uitnodigen binnen hun eigen bedrijf")

    business = business_repo.get_by_id(business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Bedrijf is niet gevonden")

    invite_key = invite_repo.save_invite_key("business", business_id)
    return invite_key