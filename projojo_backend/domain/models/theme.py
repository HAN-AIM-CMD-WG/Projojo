from pydantic import BaseModel


class Theme(BaseModel):
    """Theme entity for project classification (e.g., SDGs)"""
    id: str | None = None
    name: str
    sdg_code: str | None = None  # e.g., "SDG3", "SDG13"
    icon: str | None = None  # Material icon name
    description: str | None = None
    color: str | None = None  # Color code e.g. "#4CAF50"
    display_order: int | None = None
    project_count: int = 0  # Projects linked via hasTheme; drives the delete impact warning

    class Config:
        from_attributes = True


class ThemeCreate(BaseModel):
    """Model for creating a new theme"""
    name: str
    sdg_code: str | None = None
    icon: str | None = None
    description: str | None = None
    color: str | None = None
    display_order: int | None = None


class ThemeUpdate(BaseModel):
    """Model for updating a theme"""
    name: str | None = None
    sdg_code: str | None = None
    icon: str | None = None
    description: str | None = None
    color: str | None = None
    display_order: int | None = None
