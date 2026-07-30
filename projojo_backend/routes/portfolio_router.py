from fastapi import APIRouter, HTTPException, Request, status

import re

from auth.permissions import auth
from domain.models.portfolio import (
    PortfolioItemCurationUpdate,
    PortfolioItemResponse,
    PortfolioResponse,
    PortfolioReviewCreateRequest,
    PortfolioReviewMutationResponse,
    PortfolioReviewResponse,
    PortfolioReviewUpdateRequest,
    PortfolioReviewWorldVisibleUpdate,
    PortfolioSettingsResponse,
    PortfolioSettingsUpdateRequest,
    PublicPortfolioResponse,
)
from domain.repositories.portfolio_repository import PortfolioRepository
from exceptions import ConflictException
from service.portfolio_policy import can_read_authenticated_student_portfolio


router = APIRouter(tags=["Portfolio Endpoints"])
portfolio_repo = PortfolioRepository()

# Slug contract (PF-task-010): lowercase a-z/0-9 with single hyphens between segments, length
# 3-50. Input is trimmed before validation and must already be lowercase (uppercase is rejected
# rather than silently rewritten). Summary is capped at 2000 characters, matching the review
# text limit.
_SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
_SLUG_MIN_LENGTH = 3
_SLUG_MAX_LENGTH = 50
_SUMMARY_MAX_LENGTH = 2000


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
        "is_student_hidden": False,
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


@router.post(
    "/portfolio-items/{item_id}/reviews",
    status_code=status.HTTP_201_CREATED,
    response_model=PortfolioReviewMutationResponse,
)
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
    "/portfolio-reviews/{review_id}",
    status_code=status.HTTP_200_OK,
    response_model=PortfolioReviewMutationResponse,
)
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
async def set_portfolio_item_curation(item_id: str, update: PortfolioItemCurationUpdate, request: Request):
    # Owner-only item curation (PF-task-011a display order / student hide-show / world-visible
    # selection, plus the PF-task-007c authenticated-public retraction). @auth(role="student")
    # already blocks teachers, supervisors, and unauthenticated callers; ownership is enforced here
    # so a student may only mutate their own item, and a non-owned or unknown item is reported as
    # not found without disclosing existence. Only fields present in the request body are applied.
    owner_id = request.state.user_id
    if portfolio_repo.get_owned_item(item_id, owner_id) is None:
        raise HTTPException(status_code=404, detail="Portfolio-item niet gevonden")

    # model_fields_set only ever contains declared fields (Pydantic ignores unknown body keys), so
    # it needs no further filtering: it is exactly the set of curation fields the caller sent.
    updates = {name: getattr(update, name) for name in update.model_fields_set}
    if updates:
        portfolio_repo.set_item_curation(item_id, owner_id, updates)

    # The returned item is owner-scoped: the owner always sees their own item (including when it is
    # teacher-hidden), so the response reflects the full post-mutation curation state. Reviews are
    # the owner's full review set for the item, matching the shape the owner sees in their read model.
    item = portfolio_repo.get_owned_item(item_id, owner_id)
    reviews = portfolio_repo.get_reviews_for_items([item_id])
    return portfolio_repo.attach_reviews([item], reviews)[0]


@router.patch(
    "/portfolios/me/items/{item_id}/reviews/{review_id}",
    response_model=PortfolioReviewResponse,
    responses={
        401: {"content": {"application/json": {"example": {"detail": "Not authenticated"}}}},
        403: {"content": {"application/json": {"example": {"detail": "Deze actie kan je alleen uitvoeren als je een student bent."}}}},
        404: {"content": {"application/json": {"example": {"detail": "Portfolio-review niet gevonden"}}}},
    },
)
@auth(role="student")
async def set_portfolio_review_world_visible(
    item_id: str, review_id: str, update: PortfolioReviewWorldVisibleUpdate, request: Request
):
    # Owner-only review world-public selection (PF-task-012a). @auth(role="student") already blocks
    # teachers, supervisors, and unauthenticated callers; ownership (the review must belong to an
    # item the caller owns) is enforced in the repository, so a non-owned or unknown review is
    # reported as not found without disclosing existence (AC-4). Marking a review world-visible only
    # makes it eligible: it is exposed publicly only when its associated item and the portfolio page
    # are world-public, which the world-public read (get_world_public_items) gates (AC-1, AC-3).
    # Clearing the flag retracts it from world-public output without touching authenticated views,
    # which never filter on this flag (AC-2). Every review carries a persisted public-use notice
    # acceptance (schema @card(1)), so an exposed review is always under the reviewer notice
    # contract (AC-5). The response is the persisted post-write review.
    review = portfolio_repo.set_review_world_visible(item_id, review_id, request.state.user_id, update.is_world_visible)
    if review is None:
        raise HTTPException(status_code=404, detail="Portfolio-review niet gevonden")
    return review


@router.patch(
    "/portfolios/students/{student_id}/items/{item_id}/hide",
    response_model=PortfolioItemResponse,
    responses={
        401: {"content": {"application/json": {"example": {"detail": "Not authenticated"}}}},
        403: {"content": {"application/json": {"example": {"detail": "Deze actie kan je alleen uitvoeren als je een leraar bent."}}}},
        404: {"content": {"application/json": {"example": {"detail": "Portfolio-item niet gevonden"}}}},
    },
)
@auth(role="teacher")
async def teacher_hide_portfolio_item(student_id: str, item_id: str, request: Request):
    # Teacher moderation soft-hide (PF-task-011b). @auth(role="teacher") admits only teachers, so a
    # student, supervisor, or unauthenticated caller is rejected before any state change (AC-4). The
    # item must belong to the named student; a non-owned or unknown item is reported as not found
    # without disclosing existence (404). The hide is a soft-hide that records who/when moderation
    # metadata and leaves the item stored (AC-5): get_visible_items already drops isHidden items from
    # every normal view (AC-2), and the student curation endpoint only ever clears studentHidden, so
    # a student can never lift this teacher hide (AC-3). The response is the persisted post-hide item
    # (owner-scoped read shape), so callers can confirm the recorded moderation state.
    if portfolio_repo.get_owned_item(item_id, student_id) is None:
        raise HTTPException(status_code=404, detail="Portfolio-item niet gevonden")

    portfolio_repo.set_teacher_hidden(item_id, student_id, request.state.user_id)

    item = portfolio_repo.get_owned_item(item_id, student_id)
    reviews = portfolio_repo.get_reviews_for_items([item_id])
    return portfolio_repo.attach_reviews([item], reviews)[0]


@router.get(
    "/portfolios/me",
    response_model=PortfolioSettingsResponse,
    responses={
        401: {"content": {"application/json": {"example": {"detail": "Not authenticated"}}}},
        403: {"content": {"application/json": {"example": {"detail": "Deze actie kan je alleen uitvoeren als je een student bent."}}}},
    },
)
@auth(role="student")
async def get_my_portfolio_settings(request: Request):
    # Owner-only settings read. @auth(role="student") blocks teachers, supervisors, and
    # unauthenticated callers. The slug is assigned at account creation, so this read is normally
    # side-effect free; a legacy student created before slugs existed is self-healed once by
    # get_settings (a stable slug is generated and persisted). is_world_public stays false until
    # the student enables it.
    settings = portfolio_repo.get_settings(request.state.user_id)
    if settings is None:
        raise HTTPException(status_code=404, detail="Portfolio niet gevonden")
    return settings


@router.patch(
    "/portfolios/me",
    response_model=PortfolioSettingsResponse,
    responses={
        400: {"content": {"application/json": {"example": {"detail": "Ongeldige portfolio-slug."}}}},
        401: {"content": {"application/json": {"example": {"detail": "Not authenticated"}}}},
        403: {"content": {"application/json": {"example": {"detail": "Deze actie kan je alleen uitvoeren als je een student bent."}}}},
        409: {"content": {"application/json": {"example": {"detail": "Deze portfolio-slug is al in gebruik."}}}},
    },
)
@auth(role="student")
async def update_my_portfolio_settings(update: PortfolioSettingsUpdateRequest, request: Request):
    # Owner-only settings update. Because the resource is the caller's own portfolio (/me), a
    # student can never change another student's settings; @auth(role="student") blocks the other
    # roles. Only fields present in the request body are applied.
    # Clearing semantics: an explicit null (or empty-string) summary clears the stored summary, and
    # an explicit null is_world_public resets it to the world-private default. slug cannot be
    # cleared: an absent/blank slug fails the length check below, and the settings response always
    # carries a non-empty slug.
    student_id = request.state.user_id
    fields = update.model_fields_set

    set_summary = "summary" in fields
    summary = update.summary
    if set_summary and summary is not None and len(summary) > _SUMMARY_MAX_LENGTH:
        raise HTTPException(
            status_code=400, detail=f"De samenvatting mag maximaal {_SUMMARY_MAX_LENGTH} tekens bevatten."
        )

    set_slug = "slug" in fields
    slug = None
    if set_slug:
        slug = (update.slug or "").strip()
        if not (_SLUG_MIN_LENGTH <= len(slug) <= _SLUG_MAX_LENGTH and _SLUG_PATTERN.fullmatch(slug)):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Ongeldige portfolio-slug. Gebruik {_SLUG_MIN_LENGTH} tot {_SLUG_MAX_LENGTH} tekens: "
                    "kleine letters, cijfers en koppeltekens tussen woorden."
                ),
            )
        owner = portfolio_repo.get_slug_owner(slug)
        if owner is not None and owner != student_id:
            raise HTTPException(status_code=409, detail="Deze portfolio-slug is al in gebruik.")

    set_world_public = "is_world_public" in fields

    try:
        portfolio_repo.update_settings(
            student_id,
            set_summary=set_summary,
            summary=summary,
            set_slug=set_slug,
            slug=slug,
            set_world_public=set_world_public,
            world_public=update.is_world_public,
        )
    except ConflictException as exc:
        # A concurrent claim of the same slug can pass the pre-check above and only fail at the
        # unique-constraint commit; the repository confirms that race and raises ConflictException,
        # which maps to the same documented 409 as the pre-check.
        raise HTTPException(status_code=409, detail=exc.message)
    return portfolio_repo.get_settings(student_id)


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


# --- Public portfolio response contract examples (PF-task-013) -----------------------------
# GET /portfolio/{slug} is the unauthenticated world-public read. It returns a deliberately
# reduced, student-safe shape: compared with the authenticated PortfolioResponse it omits every
# authenticated-only field. Dropped fields are the top-level viewer_role; the student id and
# is_portfolio_world_public flag; per item the source_* ids, the curation/moderation block,
# source_navigation, archived_source and the denormalized student; and per review the author id
# plus the is_world_visible/updated_at fields. Only world-visible, non-hidden, non-retired items
# and their world-visible reviews are ever returned. These examples mirror that reduced shape
# against the deterministic E2E content seed (slug "portfolio-seed-013-content").
_PUBLIC_REVIEW_EXAMPLE = {
    "id": "pf-seed-review-013-included",
    "item_id": "pf-seed-item-013-included",
    "review_text": "PF-task-013 world-visible review on the selected item (low rating, still public).",
    "rating": 2,
    "created_at": "2026-04-01T18:00:00+00:00",
    "public_notice_accepted_at": "2026-04-01T18:00:00+00:00",
    "author": {"role": "teacher", "full_name": "Tessa Testdocent"},
}
_PUBLIC_ITEM_EXAMPLE = {
    "id": "pf-seed-item-013-included",
    "completed_at": "2026-04-01T17:00:00+00:00",
    "task": {"name": "Infrastructure Proof Task", "description": "PF-task-013 world-public selected item (retracted, low-rated, still public)."},
    "project": {"name": "E2E Infrastructure Proof Project", "description": "Portfolio seed project display copy."},
    "business": {"name": "E2E Infrastructure Business", "location": "Arnhem"},
    "skills": ["Deterministisch Testen"],
    "timeline_start_date": "2026-01-20T09:00:00+00:00",
    "timeline_end_date": "2026-04-01T17:00:00+00:00",
    "visibility": {"viewer_can_see": True, "reason": "visible_to_world_public"},
    "reviews": [_PUBLIC_REVIEW_EXAMPLE],
}
_PUBLIC_CONTENT_STUDENT = {
    "full_name": "Cato Contentpubliek",
    "image_path": "default.svg",
    "portfolio_summary": "PF-task-013 world-public read contract fixtures.",
    "portfolio_slug": "portfolio-seed-013-content",
}
_PUBLIC_SUMMARY_ONLY_STUDENT = {
    "full_name": "Sami Samenvatting",
    "image_path": "default.svg",
    "portfolio_summary": "PF-task-013 summary-only world-public portfolio.",
    "portfolio_slug": "portfolio-seed-013-summary-only",
}

_PUBLIC_PORTFOLIO_EXAMPLES = {
    "summary_only": {
        "summary": "World-public student with no completed items",
        "description": (
            "A world-public portfolio whose owner has published a summary but has no world-visible "
            "completed items yet. The reduced student block still carries the summary and slug; the "
            "items and reviews arrays are empty."
        ),
        "value": {"student": _PUBLIC_SUMMARY_ONLY_STUDENT, "items": [], "reviews": []},
    },
    "selected_items": {
        "summary": "World-public student with a selected item",
        "description": (
            "The reduced per-item field shape returned for a world-visible, non-hidden, non-retired "
            "item. No authenticated-only field (source_* ids, curation, source_navigation, "
            "archived_source, the denormalized student) appears, and the review author id is omitted."
        ),
        "value": {"student": _PUBLIC_CONTENT_STUDENT, "items": [_PUBLIC_ITEM_EXAMPLE], "reviews": [_PUBLIC_REVIEW_EXAMPLE]},
    },
    "selected_reviews": {
        "summary": "World-visible reviews mirrored at the top level",
        "description": (
            "World-visible reviews of returned items appear both nested under their item and in the "
            "flat top-level reviews array. A review whose item is not world-visible is never "
            "returned, even when its own world-visible flag is set."
        ),
        "value": {"student": _PUBLIC_CONTENT_STUDENT, "items": [_PUBLIC_ITEM_EXAMPLE], "reviews": [_PUBLIC_REVIEW_EXAMPLE]},
    },
}


@router.get(
    "/portfolio/{slug}",
    response_model=PublicPortfolioResponse,
    responses={
        200: {"content": {"application/json": {"examples": _PUBLIC_PORTFOLIO_EXAMPLES}}},
        404: {"content": {"application/json": {"example": {"detail": "Portfolio niet publiek"}}}},
    },
)
async def get_public_portfolio(slug: str):
    """Read a world-public student portfolio without authentication.

    This is the public read model at `GET /portfolio/{slug}`. It returns a reduced, student-safe
    shape (PublicPortfolioResponse) that strips every authenticated-only field from the
    authenticated PortfolioResponse: the top-level viewer_role; the student id and
    is_portfolio_world_public flag; each item's source_* ids, curation moderation block,
    source_navigation, archived_source and denormalized student; and each review author id plus
    its is_world_visible/updated_at fields. Only world-visible, non-hidden, non-retired items and
    their world-visible reviews are returned; a non-world-public or unknown slug yields a 404.
    """
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
