from datetime import datetime, timedelta
import os
import shutil
from fastapi import APIRouter, HTTPException, Query, Path, Body, UploadFile, File
import jwt
from domain.models.dto import LoginRequest, LoginResponse

# Import repositories
from domain.repositories import BusinessRepository, ProjectRepository, TaskRepository, SkillRepository, UserRepository

# Import models
from domain.models import User, Business, Project, Task, Skill, ProjectCreation
from service import business_service, student_service

router = APIRouter(prefix="/test", tags=["Test Endpoints"])

# Initialize repositories
business_repo = BusinessRepository()
project_repo = ProjectRepository()
task_repo = TaskRepository()
skill_repo = SkillRepository()
user_repo = UserRepository()

# User endpoints
@router.get("/users")
async def get_all_users():
    """
    Get all users for debugging purposes
    """
    users = user_repo.get_all()
    return users

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
async def get_all_businesses_with_projects():
    """
    Get all businesses for debugging purposes
    """
    businesses_with_projects = []
    for business in business_repo.get_all():
        businesses_with_projects.append(
            business_service.get_business_with_projects(business.id)
        )

    return businesses_with_projects

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
    student_with_skills = student_service.get_student_with_skills(email)
    return student_with_skills

#POST endpoints

@router.post("/skills", response_model=Skill, status_code=201)
async def create_skill(skill: Skill = Body(...)):
    """
    Create a new skill
    """
    created_skill = skill_repo.create(skill)
    return created_skill

@router.post("/projects", response_model=ProjectCreation, status_code=201)
async def create_project(project_creation: ProjectCreation = Body(...)):
    """
    Create a new project
    """
    created_project = project_repo.create(project_creation)
    return created_project

SECRET_KEY = "test"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def verify_user_credentials(email: str, password: str):
    user = user_repo.get_credentials(email)
    print("verifying... "+str(email))
    if user and user.password_hash == password:
        return user
    return None

@router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    """
    Authenticate a user and return a JWT token
    """
    print("login data: "+str(login_data))
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
        "role": user.type.lower(),
        "exp": datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    }
    if user.type == "supervisor":
        supervisor = user_repo.get_supervisor_by_id(user.id)
        payload["business"] = supervisor.business_association_id
        payload["projects"] = supervisor.created_project_ids
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return LoginResponse(
        status="success",
        message="Login successful",
        token=token,
        debug_payload=payload
    )

@router.post("/upload", status_code=201)
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a file to the server
    """
    # Create the static/images directory if it doesn't exist
    os.makedirs("projojo_backend/static/images", exist_ok=True)
    
    # Save the file to the static/images directory
    file_path = os.path.join("projojo_backend/static/images", file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"filename": file.filename, "path": file_path}
