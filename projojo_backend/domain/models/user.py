from pydantic import BaseModel
from typing import Optional, List

class User(BaseModel):
    id: str
    email: str
    full_name: str
    image_path: Optional[str] = None
    password_hash: Optional[str] = None

    class Config:
        from_attributes = True

class Supervisor(User):
    authentication_ids: List[str] = []
    business_association_id: Optional[str] = None
    created_project_ids: List[str] = []

class Student(User):
    school_account_name: str
    skill_ids: List[str] = []
    registered_task_ids: List[str] = []

class Teacher(User):
    school_account_name: str