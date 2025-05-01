from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Project(BaseModel):
    id: str
    name: str
    description: str
    image_path: str
    created_at: datetime
    business_id: Optional[str] = None
    
    class Config:
        from_attributes = True

class ProjectCreation(BaseModel):
    project_id: str
    supervisor_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class BusinessProjects(BaseModel):
    business_id: str
    project_ids: List[str]
    
    class Config:
        from_attributes = True