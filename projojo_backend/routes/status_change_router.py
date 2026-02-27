"""
API endpoints for task-level status change consensus mechanism.

Endpoints:
- POST   /tasks/{task_id}/registrations/{student_id}/status-request
- GET    /tasks/{task_id}/registrations/{student_id}/status-request
- PATCH  /status-requests/{request_id}/respond
- GET    /users/{user_id}/pending-status-requests
"""
from fastapi import APIRouter, Path, Body, HTTPException, Request, Depends
from pydantic import BaseModel
from typing import Optional
from auth.permissions import auth
from auth.jwt_utils import get_token_payload
from domain.repositories.status_change_repository import StatusChangeRepository

status_change_repo = StatusChangeRepository()

router = APIRouter(tags=["Status Change Endpoints"])


# ============================================================================
# Request/Response Models
# ============================================================================

class StatusChangeRequestCreate(BaseModel):
    """Body for creating a status change request."""
    request_type: str  # "completion" | "cancellation"
    reason: str


class StatusChangeResponseBody(BaseModel):
    """Body for responding to a status change request."""
    approved: bool
    response_message: Optional[str] = ""


# ============================================================================
# Endpoints
# ============================================================================

@router.post("/tasks/{task_id}/registrations/{student_id}/status-request")
@auth(role="authenticated")
async def create_status_request(
    request: Request,
    task_id: str = Path(..., description="Task ID"),
    student_id: str = Path(..., description="Student ID"),
    body: StatusChangeRequestCreate = Body(...),
):
    """
    Create a status change request for a task registration.
    
    Can be initiated by:
    - The student themselves (for their own registration)
    - The supervisor of the business that owns the project
    """
    user_id = request.state.user_id
    user_role = request.state.user_role

    # Validate request type
    if body.request_type not in ("completion", "cancellation"):
        raise HTTPException(
            status_code=400,
            detail="request_type moet 'completion' of 'cancellation' zijn"
        )

    # Authorization: student can only create for themselves
    if user_role == "student" and user_id != student_id:
        raise HTTPException(
            status_code=403,
            detail="Je kunt alleen een verzoek indienen voor je eigen registratie"
        )

    # Check if there's already a pending request
    existing = status_change_repo.get_pending_request(task_id, student_id)
    if existing:
        raise HTTPException(
            status_code=409,
            detail="Er is al een lopend statusverzoek voor deze registratie"
        )

    try:
        result = status_change_repo.create_request(
            task_id=task_id,
            student_id=student_id,
            requester_id=user_id,
            request_type=body.request_type,
            reason=body.reason,
        )
        return result
    except Exception as e:
        print(f"Error creating status request: {e}")
        raise HTTPException(
            status_code=400,
            detail="Er is iets misgegaan bij het aanmaken van het statusverzoek"
        )


@router.get("/tasks/{task_id}/registrations/{student_id}/status-request")
@auth(role="authenticated")
async def get_status_request(
    task_id: str = Path(..., description="Task ID"),
    student_id: str = Path(..., description="Student ID"),
):
    """
    Get the current pending status change request for a registration.
    Also triggers lazy checks for auto-reviews and auto-approvals.
    """
    # Lazy trigger: check for expired tasks and auto-approve
    try:
        status_change_repo.check_and_create_end_reviews()
        status_change_repo.auto_approve_expired()
    except Exception as e:
        print(f"Lazy check error (non-critical): {e}")

    pending = status_change_repo.get_pending_request(task_id, student_id)
    if not pending:
        # Return registration status even without a pending request
        reg_status = status_change_repo.get_registration_status(task_id, student_id)
        return {
            "pending_request": None,
            "registration_status": reg_status,
        }

    return {
        "pending_request": pending,
        "registration_status": "in_beoordeling",
    }


@router.patch("/status-requests/{request_id}/respond")
@auth(role="authenticated")
async def respond_to_status_request(
    request: Request,
    request_id: str = Path(..., description="Status Change Request ID"),
    body: StatusChangeResponseBody = Body(...),
):
    """
    Respond to a pending status change request (approve or deny).
    
    Can be responded to by:
    - If requester was student -> supervisor responds
    - If requester was supervisor -> student responds
    - For end_review -> either party can respond
    """
    user_id = request.state.user_id

    try:
        result = status_change_repo.respond_to_request(
            request_id=request_id,
            responder_id=user_id,
            approved=body.approved,
            response_message=body.response_message or "",
        )
        return result
    except Exception as e:
        print(f"Error responding to status request: {e}")
        raise HTTPException(
            status_code=400,
            detail="Er is iets misgegaan bij het reageren op het statusverzoek"
        )


@router.get("/users/{user_id}/pending-status-requests")
@auth(role="authenticated")
async def get_pending_requests(
    request: Request,
    user_id: str = Path(..., description="User ID"),
):
    """
    Get all pending status change requests for a user.
    Used for the notification badge in the navbar.
    
    Also triggers lazy checks for auto-reviews and auto-approvals.
    """
    # Verify the user is requesting their own data (or is a teacher)
    if request.state.user_id != user_id and request.state.user_role != "teacher":
        raise HTTPException(
            status_code=403,
            detail="Je kunt alleen je eigen verzoeken bekijken"
        )

    # Lazy trigger: check for expired tasks and auto-approve
    try:
        status_change_repo.check_and_create_end_reviews()
        status_change_repo.auto_approve_expired()
    except Exception as e:
        print(f"Lazy check error (non-critical): {e}")

    try:
        results = status_change_repo.get_pending_requests_for_user(user_id)
        return {
            "pending_requests": results,
            "count": len(results),
        }
    except Exception as e:
        print(f"Error getting pending requests: {e}")
        raise HTTPException(
            status_code=400,
            detail="Er is iets misgegaan bij het ophalen van de statusverzoeken"
        )
