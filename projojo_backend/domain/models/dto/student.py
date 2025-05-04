from typing import List

from pydantic import BaseModel

from domain.models import Student, StudentSkill


class Student_With_Skills(BaseModel):
    """
    DTO for Student with Skills.
    """
    student: Student
    skills: List[StudentSkill]