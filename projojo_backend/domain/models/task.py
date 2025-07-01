from pydantic import BaseModel
from datetime import datetime

from .skill import Skill


class Task(BaseModel):
    id: str
    name: str
    description: str
    total_needed: int
    created_at: datetime
    project_id: str | None = None
    skills: list[Skill] | None = None
    total_registered: int | None = None
    total_accepted: int | None = None

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

class RegistrationCreate(BaseModel):
    motivation: str

class RegistrationUpdate(BaseModel):
    accepted: bool
    response: str = ""