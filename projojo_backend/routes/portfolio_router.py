from fastapi import APIRouter, HTTPException, Request, status

from auth.permissions import auth
from domain.models.portfolio import (
    PortfolioItemResponse,
    PortfolioItemRetractionUpdate,
    PortfolioResponse,
    PortfolioReviewCreateRequest,
    PortfolioReviewUpdateRequest,
)
from domain.repositories.portfolio_repository import PortfolioRepository
from service.portfolio_policy import can_read_authenticated_student_portfolio


router = APIRouter(tags=["Portfolio Endpoints"])
portfolio_repo = PortfolioRepository()


# --- Authenticated portfolio response contract examples (PF-task-007d) ----------------------
# One explicit, machine-readable contract per authenticated viewer role, so frontend services
# and BDD steps assert against documented field names instead of inferring visibility state.
# The per-item field shape is identical for every role: role differences are expressed by which
# items and reviews are returned, not by redacting fields. get_visible_items already drops
# retired and hidden items for every authenticated viewer, and filter_items_for_viewer
# additionally drops authenticated-public retracted and low-rated items (and their reviews) for
# supervisors. These examples mirror that real behavior against the deterministic E2E seed.
_TEACHER_AUTHOR = {"id": "20000000-0000-4000-8000-000000000001", "role": "teacher", "full_name": "Tessa Testdocent"}
_SUPERVISOR_AUTHOR = {"id": "20000000-0000-4000-8000-000000000003", "role": "supervisor", "full_name": "Sanne Testbegeleider"}
_ENABLED_NAV = {"state": "enabled", "reason": "De bron is beschikbaar."}
_DISABLED_NAV = {"state": "disabled", "reason": "Het bronproject is gearchiveerd. Je voltooide werk blijft zichtbaar."}
_AUTH_VISIBLE = {"viewer_can_see": True, "reason": "visible_to_authenticated_viewer"}
_NO_ARCHIVE = {"task": False, "project": False, "business": False}


def _example_review(review_id: str, item_id: str, rating: int, author: dict) -> dict:
    return {
        "id": review_id,
        "item_id": item_id,
        "review_text": "Voorbeeldreview voor de portfolio-contractdocumentatie.",
        "rating": rating,
        "created_at": "2026-02-21T18:00:00+00:00",
        "updated_at": "2026-02-21T18:00:00+00:00",
        "is_world_visible": False,
        "public_notice_accepted_at": "2026-02-21T18:00:00+00:00",
        "author": author,
    }


def _curation(**overrides) -> dict:
    return {
        "is_retired": False,
        "retired_at": None,
        "is_hidden": False,
        "hidden_at": None,
        "hidden_by_role": None,
        "hidden_by_user_id": None,
        "display_order": 1,
        "is_authenticated_public_retraction": False,
        "is_world_visible": False,
        **overrides,
    }


def _example_item(item_id: str, *, curation: dict, archived_source: dict, source_navigation: dict, reviews: list, **overrides) -> dict:
    # Defaults describe the shared "completed" source; `overrides` lets an item whose source
    # records diverge from that (e.g. the archived-source item) document its own real source
    # ids and display copy so the example stays internally consistent with the live seed.
    return {
        "id": item_id,
        "created_at": "2026-02-21T17:05:00+00:00",
        "completed_at": "2026-02-21T17:00:00+00:00",
        "source_student_id": "20000000-0000-4000-8000-000000000002",
        "source_registration_id": "pf-seed-registration-completed",
        "source_task_id": "50000000-0000-4000-8000-000000000001",
        "source_project_id": "40000000-0000-4000-8000-000000000001",
        "source_business_id": "30000000-0000-4000-8000-000000000001",
        "student": {"full_name": "Tom Teststudent", "image_path": "default.svg"},
        "task": {"name": "Infrastructure Proof Task", "description": "Portfolio seed item."},
        "project": {"name": "E2E Infrastructure Proof Project", "description": "Portfolio seed project display copy."},
        "business": {"name": "E2E Infrastructure Business", "location": "Arnhem"},
        "skills": ["Deterministisch Testen"],
        "timeline_start_date": "2026-01-20T09:00:00+00:00",
        "timeline_end_date": "2026-02-21T17:00:00+00:00",
        "curation": curation,
        "archived_source": archived_source,
        "source_navigation": source_navigation,
        "visibility": _AUTH_VISIBLE,
        "reviews": reviews,
        **overrides,
    }


# Items every authorized viewer (owner, teacher, related supervisor) sees.
_GOOD_ITEM = _example_item(
    "pf-seed-item-all-ratings-good",
    curation=_curation(display_order=2),
    archived_source=_NO_ARCHIVE,
    source_navigation=_ENABLED_NAV,
    reviews=[
        _example_review("pf-seed-review-good-supervisor", "pf-seed-item-all-ratings-good", 5, _SUPERVISOR_AUTHOR),
        _example_review("pf-seed-review-good-teacher", "pf-seed-item-all-ratings-good", 3, _TEACHER_AUTHOR),
    ],
)
_ARCHIVED_ITEM = _example_item(
    "pf-seed-item-archived-source",
    curation=_curation(display_order=7),
    archived_source={"task": False, "project": True, "business": True},
    source_navigation=_DISABLED_NAV,
    reviews=[_example_review("pf-seed-review-archived-source", "pf-seed-item-archived-source", 4, _SUPERVISOR_AUTHOR)],
    # This item's source records really are the archived-source seed set, not the shared
    # "completed" source; document its own ids and copy so archived_source project/business=True
    # is consistent with the source it points at.
    source_registration_id="pf-seed-registration-archived-source",
    source_task_id="50000000-0000-4000-8000-000000000002",
    source_project_id="40000000-0000-4000-8000-000000000002",
    source_business_id="30000000-0000-4000-8000-000000000003",
    task={"name": "Portfolio Archived Source Task", "description": "Archived-source portfolio seed item."},
    project={"name": "Portfolio Archived Source Project", "description": "Portfolio seed project display copy."},
    business={"name": "Portfolio Archived Source Business", "location": "Arnhem"},
)
# Items only the owner and teacher see privately; a related supervisor never does
# (a rating below three, and an authenticated-public retraction, each remove supervisor visibility).
_LOW_RATED_ITEM = _example_item(
    "pf-seed-item-low-rating",
    curation=_curation(display_order=3),
    archived_source=_NO_ARCHIVE,
    source_navigation=_ENABLED_NAV,
    reviews=[_example_review("pf-seed-review-low-rating", "pf-seed-item-low-rating", 2, _TEACHER_AUTHOR)],
)
_RETRACTED_ITEM = _example_item(
    "pf-seed-item-retracted-authenticated-public",
    curation=_curation(display_order=4, is_authenticated_public_retraction=True),
    archived_source=_NO_ARCHIVE,
    source_navigation=_ENABLED_NAV,
    reviews=[_example_review("pf-seed-review-retracted", "pf-seed-item-retracted-authenticated-public", 4, _SUPERVISOR_AUTHOR)],
)

_STUDENT_IDENTITY = {
    "id": "20000000-0000-4000-8000-000000000002",
    "full_name": "Tom Teststudent",
    "image_path": "default.svg",
    "portfolio_summary": "Leert door praktijkprojecten.",
    "portfolio_slug": "portfolio-seed-world-public",
    "is_portfolio_world_public": True,
}


def _portfolio_example(viewer_role: str, item_list: list) -> dict:
    return {
        "viewer_role": viewer_role,
        "student": _STUDENT_IDENTITY,
        "items": item_list,
        "reviews": [review for item in item_list for review in item["reviews"]],
    }


_PRIVATE_ITEMS = [_GOOD_ITEM, _ARCHIVED_ITEM, _LOW_RATED_ITEM, _RETRACTED_ITEM]
_SUPERVISOR_ITEMS = [_GOOD_ITEM, _ARCHIVED_ITEM]

_AUTHENTICATED_PORTFOLIO_EXAMPLES = {
    "student_owner": {
        "summary": "Student owner - full private view",
        "description": (
            "The owner sees every non-retired, non-hidden item with the full curation/moderation "
            "field set, archived-source metadata, source navigation state, and all reviews. "
            "Low-rated and authenticated-public retracted items stay visible to the owner."
        ),
        "value": _portfolio_example("student", _PRIVATE_ITEMS),
    },
    "teacher": {
        "summary": "Teacher - full private view",
        "description": (
            "A teacher reads any student's portfolio with the same field shape and the same item "
            "and review set as the owner; teacher-relevant moderation fields (is_hidden, "
            "hidden_by_role, hidden_by_user_id, is_retired, retired_at) are part of every item's "
            "curation block."
        ),
        "value": _portfolio_example("teacher", _PRIVATE_ITEMS),
    },
    "related_supervisor": {
        "summary": "Relationship-gated supervisor - filtered view",
        "description": (
            "A relationship-gated supervisor receives the identical per-item field shape (no field "
            "is redacted), but the returned set is filtered: hidden, retired, authenticated-public "
            "retracted, and low-rated items are omitted, and no review with a rating below three is "
            "returned. Only reviews of returned items appear."
        ),
        "value": _portfolio_example("supervisor", _SUPERVISOR_ITEMS),
    },
}


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


@router.patch("/portfolio-reviews/{review_id}", status_code=status.HTTP_200_OK)
@auth(role="supervisor")
async def update_portfolio_review(review_id: str, update: PortfolioReviewUpdateRequest, request: Request):
    # Author-or-teacher review editing (Portfolio spec 3.5, 4.4). @auth(role="supervisor") admits
    # supervisors and teachers and blocks students/unauthenticated; the repository then enforces
    # that a supervisor may only edit their own review while any teacher may edit any review.
    # Only fields present in the request body are applied; an explicit null rating removes it.
    fields = update.model_fields_set
    review_text = None
    if "review_text" in fields:
        review_text = (update.review_text or "").strip()
        if not review_text:
            raise HTTPException(status_code=400, detail="Reviewtekst is verplicht.")

    try:
        portfolio_repo.update_review(
            review_id=review_id,
            editor_id=request.state.user_id,
            editor_role=request.state.user_role,
            review_text=review_text,
            set_rating="rating" in fields,
            rating=update.rating,
        )
        return {"id": review_id}
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error))
    except LookupError as error:
        raise HTTPException(status_code=404, detail=str(error))
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
        200: {"content": {"application/json": {"examples": _AUTHENTICATED_PORTFOLIO_EXAMPLES}}},
        401: {"content": {"application/json": {"example": {"detail": "Not authenticated"}}}},
        403: {"content": {"application/json": {"example": {"detail": "Je hebt hier geen rechten voor."}}}},
        404: {"content": {"application/json": {"example": {"detail": "Portfolio niet gevonden"}}}},
    },
)
@auth(role="authenticated")
async def get_authenticated_student_portfolio(student_id: str, request: Request):
    """Read a student's authenticated portfolio for the current viewer role.

    This is the canonical authenticated read model at `GET /portfolios/students/{student_id}`.
    Endpoint-name divergence: the legacy frontend service `services.getStudentPortfolio()` still
    calls `GET /students/{student_id}/portfolio`, a path this backend no longer serves, so that
    call is a dangling reference. The stable field names documented in the response examples belong
    to this canonical path; the frontend service must be pointed here rather than at the dead path.

    The response shape is identical for every authorized viewer role; visibility differences are
    expressed by which items and reviews are returned (see the documented per-role examples), not
    by redacting fields.
    """
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
