from fastapi import APIRouter, Path, HTTPException
from domain.repositories import InviteRepository, BusinessRepository
from auth.permissions import auth

invite_repo = InviteRepository()
business_repo = BusinessRepository()

router = APIRouter(prefix="/invites", tags=["Invite Endpoints"])

@router.get("/validate/{token}")
@auth(role="unauthenticated")
async def validate_invite(token: str = Path(..., description="Invite Token")):
    """
    Validate an invite token and return business details if valid.
    """
    result = invite_repo.validate_invite_key(token)
    if not result:
        raise HTTPException(status_code=404, detail="Ongeldige of verlopen uitnodiging")
    return result

@router.post("/{business_id}")
@auth(role="supervisor", owner_id_key="business_id")
async def create_supervisor_invite_key(business_id: str = Path(..., description="Business ID")):
    """
    Create an invite key for a supervisor
    """
    business = business_repo.get_by_id(business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Bedrijf is niet gevonden")

    invite_key = invite_repo.save_invite_key(business_id)
    return invite_key