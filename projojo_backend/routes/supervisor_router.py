from fastapi import APIRouter
from auth.permissions import auth
from domain.repositories import UserRepository

user_repo = UserRepository()

router = APIRouter(prefix="/supervisors", tags=["Supervisor Endpoints"])

@router.get("/")
@auth(role="authenticated")
async def get_all_supervisors():
    """
    Get all supervisors for debugging purposes
    """
    supervisors = user_repo.get_all_supervisors()
    return supervisors
