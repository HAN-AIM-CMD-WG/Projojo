import os
from fastapi import APIRouter, HTTPException, Path
from auth.permissions import auth
from domain.repositories import UserRepository

user_repo = UserRepository()

router = APIRouter(prefix="/users", tags=["User Endpoints"])

@router.get("/")
@auth(role="unauthenticated")
async def get_all_users():
    """
    Get all users for debugging purposes
    """
    if not os.getenv("ENVIRONMENT", "none").lower() == "development":
        raise HTTPException(
            status_code=403,
            detail="Dit kan alleen in de test-omgeving"
        )

    users = user_repo.get_all()
    return users

@router.get("/{user_id}")
@auth(role="authenticated")
async def get_user(user_id: str = Path(..., description="User ID")):
    """
    Get a specific user by ID
    """
    user = user_repo.get_by_id(user_id)
    return user
