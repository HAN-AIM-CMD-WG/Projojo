from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from .skill import Skill


class Task(BaseModel):
    id: str
    name: str
    description: str
    total_needed: int
    created_at: datetime
    project_id: Optional[str] = None
    
    class Config:
        from_attributes = True

class TaskSkill(Task):
    skills: Optional[List[Skill]] = []
    
    class Config:
        from_attributes = True

class TaskRegistration(BaseModel):
    task_id: str
    student_id: str
    description: str
    is_accepted: Optional[bool] = None
    response: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
