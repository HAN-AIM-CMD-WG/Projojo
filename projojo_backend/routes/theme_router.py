from fastapi import APIRouter, Path, HTTPException, Depends, Body
from auth.permissions import auth
from auth.jwt_utils import get_token_payload

from domain.repositories import ThemeRepository
from domain.models import Theme, ThemeCreate, ThemeUpdate

theme_repo = ThemeRepository()

router = APIRouter(prefix="/themes", tags=["Theme Endpoints"])


# Public endpoint - no auth required
@router.get("/")
async def get_all_themes():
    """
    Get all themes (public endpoint).
    Returns themes sorted by display_order and name.
    """
    themes = theme_repo.get_all()
    return themes


# Public endpoint - no auth required
@router.get("/{theme_id}")
async def get_theme(theme_id: str = Path(..., description="Theme ID")):
    """
    Get a specific theme by ID (public endpoint).
    """
    try:
        theme = theme_repo.get_by_id(theme_id)
        return theme
    except Exception as e:
        raise HTTPException(status_code=404, detail="Theme niet gevonden")


# Admin endpoints - teacher only
@router.post("/", response_model=Theme, status_code=201)
@auth(role="teacher")
async def create_theme(theme: ThemeCreate):
    """
    Create a new theme (teacher only).
    """
    created_theme = theme_repo.create(theme)
    return created_theme


@router.put("/{theme_id}", response_model=Theme)
@auth(role="teacher")
async def update_theme(
    theme_id: str = Path(..., description="Theme ID"),
    theme: ThemeUpdate = Body(...)
):
    """
    Update a theme (teacher only).
    """
    try:
        updated_theme = theme_repo.update(theme_id, theme)
        return updated_theme
    except Exception as e:
        raise HTTPException(status_code=404, detail="Theme niet gevonden")


@router.delete("/{theme_id}")
@auth(role="teacher")
async def delete_theme(theme_id: str = Path(..., description="Theme ID")):
    """
    Delete a theme (teacher only).
    """
    try:
        theme_repo.delete(theme_id)
        return {"message": "Theme succesvol verwijderd"}
    except Exception as e:
        raise HTTPException(status_code=404, detail="Theme niet gevonden")


# Project-theme linking endpoints
@router.get("/project/{project_id}")
async def get_project_themes(project_id: str = Path(..., description="Project ID")):
    """
    Get all themes linked to a project (public endpoint).
    """
    themes = theme_repo.get_themes_by_project(project_id)
    return themes


@router.put("/project/{project_id}")
async def link_project_themes(
    project_id: str = Path(..., description="Project ID"),
    theme_ids: list[str] = Body(..., embed=True),
    payload: dict = Depends(get_token_payload)
):
    """
    Link a project to themes (replaces existing links).
    Only supervisors who own the project or teachers can do this.
    """
    role = payload.get("role")
    
    if role == "student":
        raise HTTPException(status_code=403, detail="Studenten kunnen geen thema's koppelen")
    
    # Note: For full authorization, we'd need to check project ownership
    # For now, allow all supervisors and teachers
    if role not in ["supervisor", "teacher"]:
        raise HTTPException(status_code=403, detail="Onvoldoende rechten")
    
    try:
        theme_repo.link_project_to_themes(project_id, theme_ids)
        return {"message": f"Project gekoppeld aan {len(theme_ids)} thema's"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
