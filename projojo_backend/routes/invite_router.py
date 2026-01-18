from fastapi import APIRouter, Path, HTTPException
from domain.repositories import InviteRepository, BusinessRepository
from auth.permissions import auth

invite_repo = InviteRepository()
business_repo = BusinessRepository()

router = APIRouter(prefix="/invites", tags=["Invite Endpoints"])

@router.post("/teacher")
@auth(role="teacher")
async def create_teacher_invite_key():
    """
    Create an invite key for a teacher
    """
    invite_key = invite_repo.save_invite_key("teacher")
    return invite_key

@router.post("/supervisor/{business_id}")
@auth(role="supervisor", owner_id_key="business_id")
async def create_supervisor_invite_key(business_id: str = Path(..., description="Business ID")):
    """
    Create an invite key for a supervisor
    """
    business = business_repo.get_by_id(business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Bedrijf is niet gevonden")

    invite_key = invite_repo.save_invite_key("business", business_id)
    return invite_key