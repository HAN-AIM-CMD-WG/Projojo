from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from .skill import Skill


class Task(BaseModel):
    id: str
    name: str
    description: str
    total_needed: int
    created_at: datetime
    project_id: str | None = None
    
    class Config:
        from_attributes = True

class TaskSkill(Task):
    skills: Optional[list[Skill]] = []
    list[Skill] | None = []
    
    class Config:
        from_attributes = True

class TaskRegistration(BaseModel):
    task_id: str
    student_id: str
    description: str
    is_accepted: bool | None = None
    response: str | None = None
    created_at: datetime
    
    class Config:
        from_attributes = True
