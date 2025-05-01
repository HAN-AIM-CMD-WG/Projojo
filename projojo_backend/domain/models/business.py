from pydantic import BaseModel
from typing import List, Optional

class Business(BaseModel):
    id: str
    name: str
    description: str
    image_path: str
    location: List[str]
    
    class Config:
        from_attributes = True

class BusinessAssociation(BaseModel):
    business_id: str
    supervisor_id: str
    location: List[str]
    
    class Config:
        from_attributes = True
from pydantic import BaseModel
from typing import List, Optional
