from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Skill(BaseModel):
    id: str
    name: str
    is_pending: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class StudentSkill(BaseModel):
    student_id: str
    skill_id: str
    description: str
    
    class Config:
        orm_mode = True
