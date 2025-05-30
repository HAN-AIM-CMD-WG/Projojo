from fastapi import APIRouter, Path

from domain.repositories import TaskRepository
task_repo = TaskRepository()

from service import task_service

router = APIRouter(prefix="/test", tags=["Task Endpoints"])

# Task endpoints
@router.get("/tasks")
async def get_all_tasks():
    """
    Get all tasks for debugging purposes
    """
    tasks = task_repo.get_all()
    return tasks


@router.get("/tasks/{name}")
async def get_task(name: str = Path(..., description="Task name")):
    """
    Get a specific task by name
    """
    task = task_repo.get_by_id(name)
    return task

@router.get("/tasks/{name}/skills")
async def get_task_skills(name: str = Path(..., description="Task name")):
    """
    Get all skills required for a task
    """
    task_skills = task_service.get_task_with_skills(name)
    return task_skills