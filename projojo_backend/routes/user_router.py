from fastapi import APIRouter, Path
from domain.repositories import UserRepository

user_repo = UserRepository()

router = APIRouter(prefix="/users", tags=["User Endpoints"])

@router.get("/")
async def get_all_users():
    """
    Get all users for debugging purposes
    """
    users = user_repo.get_all()
    return users

@router.get("/{email}")
async def get_user(email: str = Path(..., description="User email")):
    """
    Get a specific user by email
    """
    user = user_repo.get_by_id(email)
    return user
