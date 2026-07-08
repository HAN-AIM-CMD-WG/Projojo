from fastapi import APIRouter, Path, HTTPException, Depends, Body
from pydantic import ValidationError
from auth.permissions import auth, check_supervisor_ownership
from auth.jwt_utils import get_token_payload

from domain.repositories import ThemeRepository
from domain.models import Theme, ThemeCreate, ThemeUpdate
from service.validation_service import (
    THEME_DISPLAY_ORDER_VALIDATION_ERROR,
    THEME_NAME_VALIDATION_ERROR,
    validate_theme,
)

theme_repo = ThemeRepository()


def parse_theme_payload(model, payload: dict):
    try:
        return model(**payload)
    except ValidationError as e:
        for error in e.errors():
            field = error.get("loc", [None])[0]
            if field == "name":
                raise HTTPException(status_code=400, detail=THEME_NAME_VALIDATION_ERROR)
            if field == "display_order":
                raise HTTPException(status_code=400, detail=THEME_DISPLAY_ORDER_VALIDATION_ERROR)
        raise HTTPException(status_code=422, detail=e.errors())


def parse_theme_create_payload(payload: dict) -> ThemeCreate:
    return parse_theme_payload(ThemeCreate, payload)


def parse_theme_update_payload(payload: dict) -> ThemeUpdate:
    return parse_theme_payload(ThemeUpdate, payload)


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
async def create_theme(payload: dict = Body(...)):
    """
    Create a new theme (teacher only).
    """
    theme = parse_theme_create_payload(payload)
    try:
        validate_theme(theme, require_name=True)
        created_theme = theme_repo.create(theme)
        return created_theme
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{theme_id}", response_model=Theme)
@auth(role="teacher")
async def update_theme(
    theme_id: str = Path(..., description="Theme ID"),
    payload: dict = Body(...)
):
    """
    Update a theme (teacher only).
    """
    theme = parse_theme_update_payload(payload)
    try:
        validate_theme(theme)
        updated_theme = theme_repo.update(theme_id, theme)
        return updated_theme
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
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

    if role == "supervisor":
        is_owner = await check_supervisor_ownership(
            supervisor_company_id=payload.get("businessId"),
            resource_key="project_id",
            resource_id=project_id,
        )
        if not is_owner:
            raise HTTPException(status_code=403, detail="Onvoldoende rechten")
    elif role != "teacher":
        raise HTTPException(status_code=403, detail="Onvoldoende rechten")

    try:
        linked_count = theme_repo.link_project_to_themes(project_id, theme_ids)
        return {"message": f"Project gekoppeld aan {linked_count} thema's"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
