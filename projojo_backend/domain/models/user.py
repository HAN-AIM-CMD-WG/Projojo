from pydantic import BaseModel

from .skill import StudentSkill


class User(BaseModel):
    id: str
    email: str
    full_name: str
    image_path: str | None = None
    password_hash: str | None = None
    type: str | None = None
    
    # fill the `type` field based on the class name of the inheriting class
    def __init__(self, **data):
        super().__init__(**data)
        if self.__class__.__name__ != "User" and self.type is None:
            self.type = self.__class__.__name__.lower()

    class Config:
        from_attributes = True

class Supervisor(User):
    authentication_ids: list[str] = []
    business_association_id: str | None = None
    created_project_ids: list[str] = []

class Student(User):
    school_account_name: str
    skill_ids: list[str] = []
    registered_task_ids: list[str] = []

class Teacher(User):
    school_account_name: str

class StudentSkills(Student):
    Skills: list[StudentSkill] = []