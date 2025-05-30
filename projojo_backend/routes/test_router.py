import os
import shutil
from fastapi import APIRouter, UploadFile, File, Path

from domain.repositories import BusinessRepository, ProjectRepository, SkillRepository, UserRepository
business_repo = BusinessRepository()
project_repo = ProjectRepository()
skill_repo = SkillRepository()
user_repo = UserRepository()

from domain.models import BusinessProjects, Skill

router = APIRouter(prefix="/test", tags=["Test Endpoints"])

@router.post("/upload", status_code=201)
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a file to the server
    """
    # Create the static/images directory if it doesn't exist
    os.makedirs("static/images", exist_ok=True)

    # Save the file to the static/images directory
    file_path = os.path.join("static/images", file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"filename": file.filename, "path": file_path}


    # student = user_repo.get_student_by_id(email)
    # skills = skill_repo.get_student_skills(student.email)
    #
    # return Student_With_Skills(
    #     student=student,
    #     skills=skills
    # )

    # businesses_with_projects = []
    # for business in business_repo.get_all():
    #     projects = project_repo.get_projects_by_business(business.name)
    #
    #     businesses_with_projects.append(
    #         BusinessProjects(**business.model_dump(), projects=projects)
    #     )
