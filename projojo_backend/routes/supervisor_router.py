from fastapi import APIRouter

from domain.repositories import UserRepository
user_repo = UserRepository()

router = APIRouter(prefix="/test", tags=["Supervisor Endpoints"])

@router.get("/supervisors")
async def get_all_supervisors():
    """
    Get all supervisors for debugging purposes
    """
    supervisors = user_repo.get_all_supervisors()
    return supervisors
