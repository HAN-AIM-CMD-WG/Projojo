from pydantic import BaseModel

from .project import Project


class Business(BaseModel):
    id: str
    name: str
    description: str
    image_path: str
    location: list[str]
    projects: list[Project] | None = None

    class Config:
        from_attributes = True


class BusinessAssociation(BaseModel):
    business_id: str
    supervisor_id: str
    location: list[str]

    class Config:
        from_attributes = True
