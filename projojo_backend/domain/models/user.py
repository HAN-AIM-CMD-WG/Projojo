from pydantic import BaseModel

from .skill import StudentSkill
from .authentication import OAuthProvider


class User(BaseModel):
    id: str | None = None
    email: str
    full_name: str
    image_path: str | None = None
    oauth_providers: list[OAuthProvider] | None = None
    type: str | None = None

    # fill the `type` field based on the class name of the inheriting class
    def __init__(self, **data):
        super().__init__(**data)
        if self.__class__.__name__ != "User" and self.type is None:
            self.type = self.__class__.__name__.lower()

    class Config:
        from_attributes = True

class Supervisor(User):
    business_association_id: str | None = None
    created_project_ids: list[str] = []

class Student(User):
    skill_ids: list[str] = []
    registered_task_ids: list[str] = []

class Teacher(User):
    pass

class StudentSkills(Student):
    Skills: list[StudentSkill] = []