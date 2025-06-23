from pydantic import BaseModel, Field
from typing import Annotated
from datetime import datetime

from .task import Task


class Project(BaseModel):
    id: str
    name: str
    description: str
    image_path: str
    created_at: Annotated[datetime, Field(
        examples=["2025-04-21T10:02:58"]
    )]
    business_id: str | None = None
    tasks: list[Task] | None = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda dt: dt.strftime("%Y-%m-%dT%H:%M:%S")
        }

class ProjectCreation(Project):
    supervisor_id: str
    
    class Config:
        from_attributes = True
