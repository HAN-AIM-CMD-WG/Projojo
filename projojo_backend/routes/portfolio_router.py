from fastapi import APIRouter, HTTPException, Request

from auth.permissions import auth
from domain.models.portfolio import PortfolioResponse
from domain.repositories.portfolio_repository import PortfolioRepository


router = APIRouter(tags=["Portfolio Endpoints"])
portfolio_repo = PortfolioRepository()


@router.get(
    "/portfolios/students/{student_id}",
    response_model=PortfolioResponse,
    responses={
        200: {
            "description": "Authenticated canonical portfolio baseline. Includes viewer role, allowed student identity fields, item collection shape, review collection shape, curation fields, visibility reasons, and archived-source metadata.",
            "content": {
                "application/json": {
                    "example": {
                        "viewer_role": "teacher",
                        "student": {
                            "id": "student-id",
                            "full_name": "Student Name",
                            "image_path": "default.svg",
                            "portfolio_summary": "Short portfolio summary",
                            "portfolio_slug": "student-slug",
                            "is_portfolio_world_public": False,
                        },
                        "items": [
                            {
                                "id": "portfolio-item-id",
                                "created_at": "2026-02-20T17:05:00+00:00",
                                "completed_at": "2026-02-20T17:00:00+00:00",
                                "source_registration_id": "registration-id",
                                "source_task_id": "task-id",
                                "source_project_id": "project-id",
                                "source_business_id": "business-id",
                                "task": {"name": "Task", "description": "Copied task description"},
                                "project": {"name": "Project", "description": "Copied project description"},
                                "business": {"name": "Business", "location": "Arnhem"},
                                "skills": ["Skill"],
                                "timeline_start_date": "2026-01-20T09:00:00+00:00",
                                "timeline_end_date": "2026-02-20T17:00:00+00:00",
                                "curation": {
                                    "is_retired": False,
                                    "retired_at": None,
                                    "is_hidden": False,
                                    "hidden_at": None,
                                    "hidden_by_role": None,
                                    "hidden_by_user_id": None,
                                    "display_order": 1,
                                    "is_authenticated_public_retraction": False,
                                    "is_world_visible": False,
                                },
                                "archived_source": {"task": False, "project": False, "business": False},
                                "visibility": {"viewer_can_see": True, "reason": "visible_to_authenticated_viewer"},
                                "reviews": [
                                    {
                                        "id": "portfolio-review-id",
                                        "item_id": "portfolio-item-id",
                                        "review_text": "Constructive portfolio review.",
                                        "rating": 4,
                                        "created_at": "2026-02-20T18:00:00+00:00",
                                        "updated_at": "2026-02-20T18:00:00+00:00",
                                        "is_world_visible": False,
                                        "public_notice_accepted_at": "2026-02-20T18:00:00+00:00",
                                        "author": {"id": "teacher-id", "role": "teacher", "full_name": "Teacher Name"},
                                    }
                                ],
                            }
                        ],
                        "reviews": [
                            {
                                "id": "portfolio-review-id",
                                "item_id": "portfolio-item-id",
                                "review_text": "Constructive portfolio review.",
                                "rating": 4,
                                "created_at": "2026-02-20T18:00:00+00:00",
                                "updated_at": "2026-02-20T18:00:00+00:00",
                                "is_world_visible": False,
                                "public_notice_accepted_at": "2026-02-20T18:00:00+00:00",
                                "author": {"id": "teacher-id", "role": "teacher", "full_name": "Teacher Name"},
                            }
                        ],
                    }
                }
            },
        },
        401: {"description": "Authentication required", "content": {"application/json": {"example": {"detail": "Je moet ingelogd zijn om deze actie uit te kunnen voeren."}}}},
        403: {"description": "No portfolio relationship", "content": {"application/json": {"example": {"detail": "Je hebt hier geen rechten voor."}}}},
        404: {"description": "Student not found", "content": {"application/json": {"example": {"detail": "Portfolio niet gevonden"}}}},
    },
)
@auth(role="authenticated")
async def get_authenticated_student_portfolio(student_id: str, request: Request):
    student = portfolio_repo.get_student_identity(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Portfolio niet gevonden")

    viewer_role = request.state.user_role
    if viewer_role == "student" and request.state.user_id != student_id:
        raise HTTPException(status_code=403, detail="Je hebt hier geen rechten voor.")

    if viewer_role == "supervisor":
        business_id = request.state.business_id
        if not business_id or not portfolio_repo.has_supervisor_relationship(student_id, business_id):
            raise HTTPException(status_code=403, detail="Je hebt hier geen rechten voor.")

    items = portfolio_repo.get_visible_items(student_id)
    reviews = portfolio_repo.get_reviews_for_items([item["id"] for item in items])
    items, reviews = portfolio_repo.filter_items_for_viewer(items, reviews, viewer_role)
    items = portfolio_repo.attach_reviews(items, reviews)

    return {
        "viewer_role": viewer_role,
        "student": student,
        "items": items,
        "reviews": reviews,
    }


@router.get(
    "/portfolio/{slug}",
    responses={
        404: {
            "description": "Public portfolio is private by default or not found. The response intentionally omits item and review collections.",
            "content": {"application/json": {"example": {"detail": "Portfolio niet publiek"}}},
        }
    },
)
async def get_public_portfolio(slug: str):
    raise HTTPException(status_code=404, detail="Portfolio niet publiek")
