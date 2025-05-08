from pydantic import BaseModel
from typing import List, Optional

from .project import Project


class Business(BaseModel):
    id: str
    name: str
    description: str
    image_path: str
    location: List[str]

    class Config:
        from_attributes = True



class BusinessProjects(Business):
    projects: Optional[List[Project]] = None

class BusinessAssociation(BaseModel):
    business_id: str
    supervisor_id: str
    location: List[str]

    class Config:
        from_attributes = True
