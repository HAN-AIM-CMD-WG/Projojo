from pydantic import BaseModel, field_validator
from datetime import datetime

from .skill import Skill


class Task(BaseModel):
    id: str | None = None
    name: str
    description: str
    total_needed: int
    created_at: datetime
    project_id: str | None = None
    skills: list[Skill] | None = None
    total_registered: int | None = None
    total_accepted: int | None = None
    total_started: int | None = None
    total_completed: int | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None

    # Handle TypeDB returning empty arrays for optional fields
    @field_validator('start_date', 'end_date', mode='before')
    @classmethod
    def extract_from_array(cls, v):
        if isinstance(v, list):
            return v[0] if v else None
        return v

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

class TaskCreate(BaseModel):
    name: str
    description: str
    total_needed: int
    start_date: datetime | None = None
    end_date: datetime | None = None