from pydantic import BaseModel
from datetime import datetime

from .project import Project


class Business(BaseModel):
    id: str | None = None
    name: str
    description: str
    image_path: str
    location: str
    projects: list[Project] | None = None
    archived_at: datetime | None = None
    archived_by: str | None = None

    class Config:
        from_attributes = True


class BusinessAssociation(BaseModel):
    business_id: str
    supervisor_id: str
    location: str

    class Config:
        from_attributes = True
