from datetime import datetime

from pydantic import BaseModel

from .project import Project


class Business(BaseModel):
    id: str | None = None
    name: str
    description: str
    image_path: str
    location: str
    country: str | None = None
    sector: str | None = None
    company_size: str | None = None
    website: str | None = None
    archived_at: datetime | None = None
    archived_by: str | None = None
    archived_reason: str | None = None
    projects: list[Project] | None = None

    class Config:
        from_attributes = True


class BusinessAssociation(BaseModel):
    business_id: str
    supervisor_id: str
    location: str

    class Config:
        from_attributes = True
