from fastapi import APIRouter, Path
from datetime import datetime, timezone

from domain.repositories import UserRepository
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
async def create_teacher_invite_key():
    """
    Create an invite key for a teacher
    """
    # TODO: check if user is authorized to create invite keys (teacher)

    # invite_key = user_repo.create_teacher_invite_key(id)
    # return invite_key
    return {
        "key": "example-invite-key",
        "inviteType": "teacher",
        "isUsed": False,
        "createdAt": datetime.now(timezone.utc)
    }
