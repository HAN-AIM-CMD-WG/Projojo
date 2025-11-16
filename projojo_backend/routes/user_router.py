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

@router.get("/{id}")
async def get_user(id: str = Path(..., description="User ID")):
    """
    Get a specific user by ID
    """
    user = user_repo.get_by_id(id)
    return user
