from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, Path, Body
from pydantic import BaseModel

# Import repositories
from repositories.business_repository import BusinessRepository
from repositories.project_repository import ProjectRepository
from repositories.task_repository import TaskRepository
from repositories.skill_repository import SkillRepository
from repositories.user_repository import UserRepository

# Import models
from models.user import User, Supervisor, Student, Teacher
from models.business import Business, BusinessAssociation
from models.project import Project, ProjectCreation, BusinessProjects
from models.task import Task, TaskSkill, TaskRegistration
from models.skill import Skill, StudentSkill

router = APIRouter(prefix="/test", tags=["Test Endpoints"])

# Initialize repositories
business_repo = BusinessRepository()
project_repo = ProjectRepository()
task_repo = TaskRepository()
skill_repo = SkillRepository()
user_repo = UserRepository()

# Debug response model
class DebugResponse(BaseModel):
    status: str
    message: str
    data: Optional[Any] = None

# User endpoints
@router.get("/users", response_model=DebugResponse)
async def get_all_users():
    """
    Get all users for debugging purposes
    """
    try:
        users = user_repo.get_all()
        return DebugResponse(
            status="success",
            message=f"Found {len(users)} users",
            data=users
        )
    except Exception as e:
        return DebugResponse(
            status="error",
            message=f"Error retrieving users: {str(e)}"
        )

@router.get("/users/{email}", response_model=DebugResponse)
async def get_user(email: str = Path(..., description="User email")):
    """
    Get a specific user by email
    """
    try:
        user = user_repo.get_by_id(email)
        if not user:
            return DebugResponse(
                status="error",
                message=f"User with email {email} not found"
            )
        return DebugResponse(
            status="success",
            message=f"User found",
            data=user
        )
    except Exception as e:
        return DebugResponse(
            status="error",
            message=f"Error retrieving user: {str(e)}"
        )

@router.get("/supervisors", response_model=DebugResponse)
async def get_all_supervisors():
    """
    Get all supervisors for debugging purposes
    """
    try:
        supervisors = user_repo.get_all_supervisors()
        return DebugResponse(
            status="success",
            message=f"Found {len(supervisors)} supervisors",
            data=supervisors
        )
    except Exception as e:
        return DebugResponse(
            status="error",
            message=f"Error retrieving supervisors: {str(e)}"
        )

@router.get("/students", response_model=DebugResponse)
async def get_all_students():
    """
    Get all students for debugging purposes
    """
    try:
        students = user_repo.get_all_students()
        return DebugResponse(
            status="success",
            message=f"Found {len(students)} students",
            data=students
        )
    except Exception as e:
        return DebugResponse(
            status="error",
            message=f"Error retrieving students: {str(e)}"
        )

@router.get("/teachers", response_model=DebugResponse)
async def get_all_teachers():
    """
    Get all teachers for debugging purposes
    """
    try:
        teachers = user_repo.get_all_teachers()
        return DebugResponse(
            status="success",
            message=f"Found {len(teachers)} teachers",
            data=teachers
        )
    except Exception as e:
        return DebugResponse(
            status="error",
            message=f"Error retrieving teachers: {str(e)}"
        )


# Business endpoints
@router.get("/businesses", response_model=DebugResponse)
async def get_all_businesses():
    """
    Get all businesses for debugging purposes
    """
    try:
        businesses = business_repo.get_all()
        return DebugResponse(
            status="success",
            message=f"Found {len(businesses)} businesses",
            data=businesses
        )
    except Exception as e:
        return DebugResponse(
            status="error",
            message=f"Error retrieving businesses: {str(e)}"
        )

@router.get("/businesses/{name}", response_model=DebugResponse)
async def get_business(name: str = Path(..., description="Business name")):
    """
    Get a specific business by name
    """
    try:
        business = business_repo.get_by_id(name)
        if not business:
            return DebugResponse(
                status="error",
                message=f"Business with name {name} not found"
            )
        return DebugResponse(
            status="success",
            message=f"Business found",
            data=business
        )
    except Exception as e:
        return DebugResponse(
            status="error",
            message=f"Error retrieving business: {str(e)}"
        )
@router.get("/businesses/{name}/associations", response_model=DebugResponse)
async def get_business_associations(name: str = Path(..., description="Business name")):
    """
    Get all supervisor associations for a business
    """
    try:
        associations = business_repo.get_business_associations(name)
        return DebugResponse(
            status="success",
            message=f"Found {len(associations)} associations for business {name}",
            data=associations
        )
    except Exception as e:
        return DebugResponse(
            status="error",
            message=f"Error retrieving business associations: {str(e)}"
        )

# Project endpoints
@router.get("/projects", response_model=DebugResponse)
async def get_all_projects():
    """
    Get all projects for debugging purposes
    """
    try:
        projects = project_repo.get_all()
        return DebugResponse(
            status="success",
            message=f"Found {len(projects)} projects",
            data=projects
        )
    except Exception as e:
        return DebugResponse(
            status="error",
            message=f"Error retrieving projects: {str(e)}"
        )

@router.get("/projects/{name}", response_model=DebugResponse)
async def get_project(name: str = Path(..., description="Project name")):
    """
    Get a specific project by name
    """
    try:
        project = project_repo.get_by_id(name)
        if not project:
            return DebugResponse(
                status="error",
                message=f"Project with name {name} not found"
            )
        return DebugResponse(
            status="success",
            message=f"Project found",
            data=project
        )
    except Exception as e:
        return DebugResponse(
            status="error",
            message=f"Error retrieving project: {str(e)}"
        )


@router.get("/businesses/{name}/projects", response_model=DebugResponse)
async def get_business_projects(name: str = Path(..., description="Business name")):
    """
    Get all projects for a business
    """
    try:
        projects = project_repo.get_projects_by_business(name)
        return DebugResponse(
            status="success",
            message=f"Found {len(projects)} projects for business {name}",
            data=projects
        )
    except Exception as e:
        return DebugResponse(
            status="error",
            message=f"Error retrieving business projects: {str(e)}"
        )

# Task endpoints
@router.get("/tasks", response_model=DebugResponse)
async def get_all_tasks():
    """
    Get all tasks for debugging purposes
    """
    try:
        tasks = task_repo.get_all()
        return DebugResponse(
            status="success",
            message=f"Found {len(tasks)} tasks",
            data=tasks
        )
    except Exception as e:
        return DebugResponse(
            status="error",
            message=f"Error retrieving tasks: {str(e)}"
        )

@router.get("/tasks/{name}", response_model=DebugResponse)
async def get_task(name: str = Path(..., description="Task name")):
    """
    Get a specific task by name
    """
    try:
        task = task_repo.get_by_id(name)
        if not task:
            return DebugResponse(
                status="error",
                message=f"Task with name {name} not found"
            )
        return DebugResponse(
            status="success",
            message=f"Task found",
            data=task
        )
    except Exception as e:
        return DebugResponse(
            status="error",
            message=f"Error retrieving task: {str(e)}"
        )

@router.get("/projects/{name}/tasks", response_model=DebugResponse)
async def get_project_tasks(name: str = Path(..., description="Project name")):
    """
    Get all tasks for a project
    """
    try:
        tasks = task_repo.get_tasks_by_project(name)
        return DebugResponse(
            status="success",
            message=f"Found {len(tasks)} tasks for project {name}",
            data=tasks
        )
    except Exception as e:
        return DebugResponse(
            status="error",
            message=f"Error retrieving project tasks: {str(e)}"
        )

@router.get("/tasks/{name}/skills", response_model=DebugResponse)
async def get_task_skills(name: str = Path(..., description="Task name")):
    """
    Get all skills required for a task
    """
    try:
        skills = task_repo.get_task_skills(name)
        return DebugResponse(
            status="success",
            message=f"Found {len(skills)} skills for task {name}",
            data=skills
        )
    except Exception as e:
        return DebugResponse(
            status="error",
            message=f"Error retrieving task skills: {str(e)}"
        )
# Skill endpoints
@router.get("/skills", response_model=DebugResponse)
async def get_all_skills():
    """
    Get all skills for debugging purposes
    """
    try:
        skills = skill_repo.get_all()
        return DebugResponse(
            status="success",
            message=f"Found {len(skills)} skills",
            data=skills
        )
    except Exception as e:
        return DebugResponse(
            status="error",
            message=f"Error retrieving skills: {str(e)}"
        )

@router.get("/skills/{name}", response_model=DebugResponse)
async def get_skill(name: str = Path(..., description="Skill name")):
    """
    Get a specific skill by name
    """
    try:
        skill = skill_repo.get_by_id(name)
        if not skill:
            return DebugResponse(
                status="error",
                message=f"Skill with name {name} not found"
            )
        return DebugResponse(
            status="success",
            message=f"Skill found",
            data=skill
        )
    except Exception as e:
        return DebugResponse(
            status="error",
            message=f"Error retrieving skill: {str(e)}"
        )

@router.get("/students/{email}/skills", response_model=DebugResponse)
async def get_student_skills(email: str = Path(..., description="Student email")):
    """
    Get all skills for a student
    """
    try:
        skills = skill_repo.get_student_skills(email)
        return DebugResponse(
            status="success",
            message=f"Found {len(skills)} skills for student {email}",
            data=skills
        )
    except Exception as e:
        return DebugResponse(
            status="error",
            message=f"Error retrieving student skills: {str(e)}"
        )