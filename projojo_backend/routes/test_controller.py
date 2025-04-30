from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, Path, Body
from pydantic import BaseModel
import jwt;
from exceptions import ItemRetrievalException, UnauthorizedException

# Import repositories
from domain.repositories import BusinessRepository, ProjectRepository, TaskRepository, SkillRepository, UserRepository

# Import models
from domain.models import User, Business, Project, Task, Skill

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
@router.get("/users")
async def get_all_users():
    """
    Get all users for debugging purposes
    """
   # users = user_repo.get_all()
    raise ItemRetrievalException(User)


@router.get("/users/{email}")
async def get_user(email: str = Path(..., description="User email")):
    """
    Get a specific user by email
    """
    user = user_repo.get_by_id(email)
    return user


@router.get("/supervisors")
async def get_all_supervisors():
    """
    Get all supervisors for debugging purposes
    """
    supervisors = user_repo.get_all_supervisors()
    return supervisors


@router.get("/students")
async def get_all_students():
    """
    Get all students for debugging purposes
    """
    students = user_repo.get_all_students()
    return students

@router.get("/teachers")
async def get_all_teachers():
    """
    Get all teachers for debugging purposes
    """
    teachers = user_repo.get_all_teachers()
    return teachers

# Business endpoints
@router.get("/businesses")
async def get_all_businesses():
    """
    Get all businesses for debugging purposes
    """
    businesses = business_repo.get_all()
    return businesses

@router.get("/businesses/{name}")
async def get_business(name: str = Path(..., description="Business name")):
    """
    Get a specific business by name
    """
    business = business_repo.get_by_id(name)
    return business

# Project endpoints
@router.get("/projects")
async def get_all_projects():
    """
    Get all projects for debugging purposes
    """
    projects = project_repo.get_all()
    return projects

@router.get("/projects/{name}")
async def get_project(name: str = Path(..., description="Project name")):
    """
    Get a specific project by name
    """
    project = project_repo.get_by_id(name)
    return project


@router.get("/businesses/{name}/projects")
async def get_business_projects(name: str = Path(..., description="Business name")):
    """
    Get all projects for a business
    """
    projects = project_repo.get_projects_by_business(name)
    return projects

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

@router.get("/projects/{name}/tasks")
async def get_project_tasks(name: str = Path(..., description="Project name")):
    """
    Get all tasks for a project
    """
    tasks = task_repo.get_tasks_by_project(name)
    return tasks

@router.get("/tasks/{name}/skills")
async def get_task_skills(name: str = Path(..., description="Task name")):
    """
    Get all skills required for a task
    """
    taskSkills = task_repo.get_task_skills(name)
    return taskSkills
# Skill endpoints
@router.get("/skills")
async def get_all_skills():
    """
    Get all skills for debugging purposes
    """
    skills = skill_repo.get_all()
    return skills

@router.get("/skills/{name}")
async def get_skill(name: str = Path(..., description="Skill name")):
    """
    Get a specific skill by name
    """
    skill = skill_repo.get_by_id(name)
    return skill

@router.get("/students/{email}/skills")
async def get_student_skills(email: str = Path(..., description="Student email")):
    """
    Get all skills for a student
    """
    skills = skill_repo.get_student_skills(email)
    return skills

#POST endpoints

@router.post("/skills", response_model=Skill, status_code=201)
async def create_skill(skill: Skill = Body(...)):
    """
    Create a new skill
    """
    created_skill = skill_repo.create(skill)
    return created_skill


# Models
class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    status: str
    message: str
    token: str = None
    debug_payload: Optional[Dict[str, Any]] = None

SECRET_KEY = "test"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # e.g., 1 hour

def verify_user_credentials(email: str, password: str):
    user = user_repo.get_by_id(email)
    print("verifying..."+str(user))
    if user and user.password_hash == password:
        return user
    return None

@router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    """
    Authenticate a user and return a JWT token
    """
    user = verify_user_credentials(login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Prepare token payload
    payload = {
        "sub": user.email,
        "password_hash": user.password_hash,
        "role": type(user).__name__.lower(),
        "exp": datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    }

    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return LoginResponse(
        status="success",
        message="Login successful",
        token=token,
        debug_payload=payload
    )