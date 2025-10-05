from fastapi import APIRouter, Depends, Path, HTTPException
from domain.repositories import UserRepository
from auth.dependencies import get_current_user
from domain.models.user import User

user_repo = UserRepository()

router = APIRouter(prefix="/users", tags=["User Endpoints"])

@router.get("/")
async def get_all_users():
    """
    Get all users for debugging purposes
    """
    users = user_repo.get_all()
    return users

@router.get("/me")
def get_me(user: User | None = Depends(get_current_user)):
    """Get current authenticated user's info"""
    if user:
        return user
    else:
        raise HTTPException(status_code=401, detail="Not authenticated")

@router.get("/{email}")
async def get_user(email: str = Path(..., description="User email")):
    """
    Get a specific user by email
    """
    user = user_repo.get_by_id(email)
    return user
