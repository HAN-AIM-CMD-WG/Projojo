from pydantic import BaseModel
from typing import Optional, List

from .skill import StudentSkill


class User(BaseModel):
    id: str
    email: str
    full_name: str
    image_path: Optional[str] = None
    password_hash: Optional[str] = None
    type: Optional[str] = None
    
    # fill the `type` field based on the class name of the inheriting class
    def __init__(self, **data):
        super().__init__(**data)
        if self.__class__.__name__ != "User" and self.type is None:
            self.type = self.__class__.__name__.lower()

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

class StudentSkills(Student):
    Skills: List[StudentSkill] = []