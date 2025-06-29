from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone

from domain.repositories import UserRepository
from auth.jwt_utils import get_token_payload
user_repo = UserRepository()

router = APIRouter(prefix="/teachers", tags=["Teacher Endpoints"])

@router.get("/")
async def get_all_teachers():
    """
    Get all teachers for debugging purposes
    """
    teachers = user_repo.get_all_teachers()
    return teachers

@router.post("/invite")
async def create_teacher_invite_key(payload: dict = Depends(get_token_payload)):
    """
    Create an invite key for a teacher
    """
    if payload.get("role") != "teacher":
        raise HTTPException(status_code=403, detail="Alleen docenten kunnen andere docenten uitnodigen")

    # invite_key = user_repo.create_teacher_invite_key(id)
    # return invite_key
    return {
        "key": "example-invite-key",
        "inviteType": "teacher",
        "isUsed": False,
        "createdAt": datetime.now(timezone.utc)
    }
