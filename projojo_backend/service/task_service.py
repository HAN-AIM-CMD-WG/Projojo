from collections import defaultdict

from domain.models import TaskSkill
from domain.repositories import TaskRepository, SkillRepository

task_repo = TaskRepository()
skill_repo = SkillRepository()

def get_task_with_skills (task_id: str) -> TaskSkill:
    """
    Get a task along with its skills.
    """
    task = task_repo.get_by_id(task_id)
    skills = skill_repo.get_task_skills(task_id)

    task_dict = task.model_dump()
    task_dict.pop('skills', None)  # Remove skills key to avoid duplicate

    return TaskSkill(**task_dict, skills=skills)

def get_tasks_with_skills_by_project(project_name: str) -> list[TaskSkill]:
    """
    Get tasks along with their associated skills for a given project.
    """
    tasks = task_repo.get_tasks_by_project(project_name)

    task_skills_list = []
    for task in tasks:
        skills = skill_repo.get_task_skills(task.name)  # task.name == task_id in your current model
        task_data = task.model_dump()
        task_data.pop('skills', None)
        task_skills_list.append(TaskSkill(**task_data, skills=skills))

    return task_skills_list