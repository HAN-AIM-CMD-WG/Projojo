from pydantic import BaseModel, Field
from typing import Annotated
from datetime import datetime

class Skill(BaseModel):
    id: str
    name: str
    is_pending: bool
    created_at: Annotated[datetime, Field(
        examples=["2025-04-21T10:02:58"]
    )]

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda dt: dt.strftime("%Y-%m-%dT%H:%M:%S")
        }


class StudentSkill(Skill):
    description: str | None = None

    class Config:
        from_attributes = True
