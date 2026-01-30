from pydantic import BaseModel, field_validator
from datetime import datetime


class Subtask(BaseModel):
    """
    Deeltaak binnen een taak.
    UI toont dit als "Deeltaak" - toegankelijk voor alle disciplines.
    """
    id: str | None = None
    title: str
    what: str | None = None          # WAT: Wat moet er gebeuren?
    why: str | None = None           # WAAROM: Context en reden
    how: str | None = None           # HOE: Aanpak/stappen
    criteria: str | None = None      # CRITERIA: Waar moet het aan voldoen?
    status: str = "open"             # "open" | "in_progress" | "done"
    created_at: datetime | None = None
    completed_at: datetime | None = None
    task_id: str | None = None       # De taak waar deze deeltaak bij hoort
    claimed_by_id: str | None = None # Student die dit geclaimd heeft
    claimed_by_name: str | None = None # Naam van de student

    # Handle TypeDB returning empty arrays for optional fields
    @field_validator('what', 'why', 'how', 'criteria', 'completed_at', 'claimed_by_id', 'claimed_by_name', mode='before')
    @classmethod
    def extract_from_array(cls, v):
        if isinstance(v, list):
            return v[0] if v else None
        return v

    class Config:
        from_attributes = True


class SubtaskCreate(BaseModel):
    """Model voor het aanmaken van een nieuwe deeltaak."""
    title: str
    what: str | None = None
    why: str | None = None
    how: str | None = None
    criteria: str | None = None


class SubtaskTemplate(BaseModel):
    """
    Template voor veelvoorkomende deeltaken.
    Supervisors kunnen deze hergebruiken bij het aanmaken van deeltaken.
    """
    id: str | None = None
    template_name: str
    title: str | None = None
    what: str | None = None
    why: str | None = None
    how: str | None = None
    criteria: str | None = None
    created_at: datetime | None = None
    business_id: str | None = None

    @field_validator('title', 'what', 'why', 'how', 'criteria', mode='before')
    @classmethod
    def extract_from_array(cls, v):
        if isinstance(v, list):
            return v[0] if v else None
        return v

    class Config:
        from_attributes = True


class SubtaskTemplateCreate(BaseModel):
    """Model voor het aanmaken van een nieuwe template."""
    template_name: str
    title: str | None = None
    what: str | None = None
    why: str | None = None
    how: str | None = None
    criteria: str | None = None
