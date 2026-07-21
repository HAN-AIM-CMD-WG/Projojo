from fastapi import APIRouter, HTTPException, Request, status

from auth.permissions import auth
from domain.models.portfolio import (
    PortfolioItemResponse,
    PortfolioItemRetractionUpdate,
    PortfolioResponse,
    PortfolioReviewCreateRequest,
)
from domain.repositories.portfolio_repository import PortfolioRepository
from service.portfolio_policy import can_read_authenticated_student_portfolio


router = APIRouter(tags=["Portfolio Endpoints"])
portfolio_repo = PortfolioRepository()


@router.post("/portfolio-items/{item_id}/reviews", status_code=status.HTTP_201_CREATED)
@auth(role="supervisor")
async def create_portfolio_review(item_id: str, review: PortfolioReviewCreateRequest, request: Request):
    review_text = review.review_text.strip()
    if not review_text:
        raise HTTPException(status_code=400, detail="Reviewtekst is verplicht.")
    if review.public_review_notice_accepted is not True:
        raise HTTPException(
            status_code=400, detail="Je moet de publieke reviewmelding accepteren voordat je reviewtekst indient."
        )

    try:
        review_id = portfolio_repo.create_review(
            item_id=item_id,
            author_id=request.state.user_id,
            author_role=request.state.user_role,
            business_id=request.state.business_id,
            review_text=review_text,
            public_review_notice_accepted=review.public_review_notice_accepted,
            rating=review.rating,
        )
        return {"id": review_id}
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error))
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.patch(
    "/portfolios/me/items/{item_id}",
    response_model=PortfolioItemResponse,
    responses={
        401: {"content": {"application/json": {"example": {"detail": "Not authenticated"}}}},
        403: {"content": {"application/json": {"example": {"detail": "Deze actie kan je alleen uitvoeren als je een student bent."}}}},
        404: {"content": {"application/json": {"example": {"detail": "Portfolio-item niet gevonden"}}}},
    },
)
@auth(role="student")
async def set_portfolio_item_authenticated_public_retraction(
    item_id: str, update: PortfolioItemRetractionUpdate, request: Request
):
    # Owner-only curation: @auth(role="student") already blocks teachers, supervisors, and
    # unauthenticated callers; ownership is enforced here so a student may only mutate their own
    # item, and a non-owned or unknown item is reported as not found without disclosing existence.
    owner_id = request.state.user_id
    if portfolio_repo.get_owned_item(item_id, owner_id) is None:
        raise HTTPException(status_code=404, detail="Portfolio-item niet gevonden")

    portfolio_repo.set_authenticated_public_retraction(item_id, owner_id, update.is_authenticated_public_retraction)

    # The returned item is owner-scoped: the owner can always see their own item, so
    # visibility.reason is always the authenticated-viewer reason here and does not reflect the
    # supervisor-facing effect of the flag. That effect is conveyed by
    # curation.is_authenticated_public_retraction. Reviews are the owner's full review set for the
    # item, so the response matches the shape the owner sees in their portfolio read model.
    item = portfolio_repo.get_owned_item(item_id, owner_id)
    reviews = portfolio_repo.get_reviews_for_items([item_id])
    return portfolio_repo.attach_reviews([item], reviews)[0]


@router.get(
    "/portfolios/students/{student_id}",
    response_model=PortfolioResponse,
    responses={
        200: {
            "content": {
                "application/json": {
                    "example": {
                        "viewer_role": "teacher",
                        "student": {
                            "id": "20000000-0000-4000-8000-000000000002",
                            "full_name": "Tom Teststudent",
                            "image_path": "/images/students/tom-teststudent.png",
                            "portfolio_summary": "Leert door praktijkprojecten.",
                            "portfolio_slug": "portfolio-seed-world-public",
                            "is_portfolio_world_public": True,
                        },
                        "items": [
                            {
                                "id": "pf-seed-item-no-ratings",
                                "created_at": "2026-02-20T17:05:00+00:00",
                                "completed_at": "2026-02-20T17:00:00+00:00",
                                "source_student_id": "20000000-0000-4000-8000-000000000002",
                                "source_registration_id": "pf-seed-registration-completed",
                                "source_task_id": "50000000-0000-4000-8000-000000000001",
                                "source_project_id": "40000000-0000-4000-8000-000000000001",
                                "source_business_id": "30000000-0000-4000-8000-000000000001",
                                "student": {"full_name": "Tom Teststudent", "image_path": "/images/students/tom-teststudent.png"},
                                "task": {"name": "Infrastructure Proof Task", "description": "Task evidence copied at completion."},
                                "project": {"name": "E2E Infrastructure Proof Project", "description": "Project evidence copied at completion."},
                                "business": {"name": "E2E Infrastructure Business", "location": "Arnhem"},
                                "skills": ["Samenwerken"],
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
                                "source_navigation": {"state": "enabled", "reason": "De bron is beschikbaar."},
                                "visibility": {"viewer_can_see": True, "reason": "visible_to_authenticated_viewer"},
                                "reviews": [],
                            }
                        ],
                        "reviews": [
                            {
                                "id": "pf-seed-review-good-teacher",
                                "item_id": "pf-seed-item-all-ratings-good",
                                "review_text": "Sterke afronding met duidelijke reflectie.",
                                "rating": 5,
                                "created_at": "2026-02-20T17:10:00+00:00",
                                "updated_at": "2026-02-20T17:10:00+00:00",
                                "is_world_visible": False,
                                "public_notice_accepted_at": "2026-02-20T17:09:00+00:00",
                                "author": {
                                    "id": "20000000-0000-4000-8000-000000000001",
                                    "role": "teacher",
                                    "full_name": "Tessa Testdocent",
                                },
                            }
                        ],
                    }
                }
            }
        },
        401: {"content": {"application/json": {"example": {"detail": "Not authenticated"}}}},
        403: {"content": {"application/json": {"example": {"detail": "Je hebt hier geen rechten voor."}}}},
        404: {"content": {"application/json": {"example": {"detail": "Portfolio niet gevonden"}}}},
    },
)
@auth(role="authenticated")
async def get_authenticated_student_portfolio(student_id: str, request: Request):
    student = portfolio_repo.get_student_identity(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Portfolio niet gevonden")

    viewer_role = request.state.user_role
    if not can_read_authenticated_student_portfolio(
        student_id=student_id,
        viewer_id=request.state.user_id,
        viewer_role=viewer_role,
        viewer_business_id=request.state.business_id,
        portfolio_repo=portfolio_repo,
    ):
        raise HTTPException(status_code=403, detail="Je hebt hier geen rechten voor.")

    items = portfolio_repo.get_visible_items(student_id, viewer_role)
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
    response_model=PortfolioResponse,
    responses={404: {"content": {"application/json": {"example": {"detail": "Portfolio niet publiek"}}}}},
)
async def get_public_portfolio(slug: str):
    student = portfolio_repo.get_world_public_student_identity_by_slug(slug)
    if not student:
        raise HTTPException(status_code=404, detail="Portfolio niet publiek")

    items = portfolio_repo.get_world_public_items(student["id"])
    reviews = [review for review in portfolio_repo.get_reviews_for_items([item["id"] for item in items]) if review["is_world_visible"]]
    items = portfolio_repo.attach_reviews(items, reviews)

    return {
        "viewer_role": "public",
        "student": student,
        "items": items,
        "reviews": reviews,
    }
