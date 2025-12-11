
from domain.models import Task
from domain.repositories import TaskRepository, SkillRepository

task_repo = TaskRepository()
skill_repo = SkillRepository()

def get_task_with_skills (task_id: str) -> Task:
    """
    Get a task along with its skills.
    """
    task = task_repo.get_by_id(task_id)
    task.skills = skill_repo.get_task_skills(task_id)
    
    return task

def get_tasks_with_skills_by_project(project_id: str) -> list[Task]:
    """
    Get tasks along with their associated skills for a given project.
    """
    tasks = task_repo.get_tasks_by_project(project_id)

    for task in tasks:
        task.skills = skill_repo.get_task_skills(task.id)

    return tasks
