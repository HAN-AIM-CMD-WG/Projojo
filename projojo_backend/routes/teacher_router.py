from fastapi import APIRouter

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
