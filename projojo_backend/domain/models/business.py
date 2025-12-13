from pydantic import BaseModel

from .project import Project


class Business(BaseModel):
    id: str | None = None
    name: str
    description: str
    image_path: str
    location: str
    sector: str | None = None
    company_size: str | None = None
    website: str | None = None
    is_archived: bool = False
    projects: list[Project] | None = None

    class Config:
        from_attributes = True


class BusinessAssociation(BaseModel):
    business_id: str
    supervisor_id: str
    location: str

    class Config:
        from_attributes = True
