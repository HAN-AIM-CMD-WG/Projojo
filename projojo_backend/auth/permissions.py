from functools import wraps
from fastapi import HTTPException, Request
from contextvars import ContextVar

# Store the current request in a context variable (thread-safe, request-scoped)
_request_context: ContextVar[Request | None] = ContextVar('request', default=None)

def set_request_context(request: Request) -> None:
    """Set the current request in the context variable. Called by middleware."""
    _request_context.set(request)

def get_request_context() -> Request | None:
    """Get the current request from the context variable. Used by decorators."""
    return _request_context.get()


def auth(role: str, owner_id_key: str | None = None):
    """
    Authorization decorator for FastAPI endpoints.

    Usage:
    ```python
    @router.get("/tasks")
    @auth(role="authenticated")
    async def get_tasks():
        ...

    @router.put("/{user_id}")
    @auth(role="student", owner_id_key="user_id")
    async def update_student(user_id: str):
        ...

    @router.get("/login")
    @auth(role="unauthenticated")
    async def login():
        ...
    ```

    Args:
        role: Required role for access. Options:
            - "unauthenticated": Only logged-out users
            - "authenticated": Any logged-in user (student, supervisor, teacher)
            - "student": Only students
            - "supervisor": Supervisors and teachers
            - "teacher": Only teachers

        owner_id_key: Optional path parameter name to check resource ownership. If provided, validates that the current user owns the resource.
            - For students: checks if user_id matches the resource owner
            - For supervisors: checks if the resource belongs to their company
            - For teachers: ownership check is bypassed

            Example: `owner_id_key="task_id"` will extract the same-named parameter from path params e.g. `"/tasks/{task_id}"` and validate ownership.
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract Request from context variable (set by middleware)
            request = get_request_context()
            if not request:
                raise HTTPException(status_code=500, detail="Request context not found")

            # Extract auth info from request state (set by JWT middleware)
            user_id = request.state.user_id
            user_role = request.state.user_role
            user_company_id = request.state.business_id

            # Step 1: Validate role requirements
            if not _check_role_permitted(user_role, role):
                status_code, detail = _get_role_error(user_role, role)
                raise HTTPException(status_code=status_code, detail=detail)

            # Step 2: Check ownership (if required and user is not a teacher)
            if owner_id_key and user_role != "teacher":
                resource_id = kwargs.get(owner_id_key)

                if not resource_id:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Missing required parameter: {owner_id_key}"
                    )

                is_owner = await _validate_ownership(
                    user_id=user_id,
                    user_role=user_role,
                    user_company_id=user_company_id,
                    owner_key=owner_id_key,
                    resource_id=resource_id
                )

                if not is_owner:
                    raise HTTPException(
                        status_code=403,
                        detail=f"You do not have permission to access this {owner_id_key.replace('_id', '')}"
                    )

            # All checks passed, call the endpoint function
            return await func(*args, **kwargs)

        return wrapper
    return decorator


def _check_role_permitted(user_role: str | None, required_role: str) -> bool:
    """
    Check if the user's role satisfies the required role.

    Role hierarchy:
    - "teacher": full access (can do anything a supervisor can do and more)
    - "supervisor": can manage their company and its resources
    - "student": can manage their own profile and registrations
    - None/unauthenticated: can only access public endpoints
    """
    if required_role == "unauthenticated":
        # Only for logged-out users
        return user_role is None

    elif required_role == "authenticated":
        # Any logged-in user
        return user_role in ["student", "supervisor", "teacher"]

    elif required_role == "student":
        # Only students
        return user_role == "student"

    elif required_role == "supervisor":
        # Supervisors and teachers
        return user_role in ["supervisor", "teacher"]

    elif required_role == "teacher":
        # Only teachers
        return user_role == "teacher"

    return False


def _get_role_error(user_role: str | None, required_role: str) -> tuple[int, str]:
    """
    Get appropriate HTTP status code and error message based on auth failure.

    Returns:
        tuple: (status_code, error_message)
    """
    if user_role is None:
        # User is not authenticated
        if required_role == "unauthenticated":
            return (403, "You must be logged out to access this endpoint")
        else:
            return (401, "Authentication required. Please log in.")

    # User is authenticated but doesn't have required role
    role_descriptions = {
        "student": "student access",
        "supervisor": "supervisor or teacher access",
        "teacher": "teacher access",
        "authenticated": "authenticated access",
    }

    required_description = role_descriptions.get(required_role, "access")
    return (403, f"This action requires {required_description}")


async def _validate_ownership(
    user_id: str,
    user_role: str,
    user_company_id: str | None,
    owner_key: str,
    resource_id: str
) -> bool:
    """
    Validate that the user owns the specified resource.

    For students: only own their own user_id
    For supervisors: own resources within their company
    For teachers: always pass (ownership is not restricted)

    Args:
        user_id: The current user's ID
        user_role: The current user's role
        user_company_id: The current user's company ID (if supervisor)
        owner_key: The type of resource being checked (e.g., "user_id", "task_id")
        resource_id: The ID of the resource being accessed

    Returns:
        bool: True if user owns the resource, False otherwise
    """
    if user_role == "student":
        # Students can only access their own profile
        if owner_key in ["user_id", "student_id"]:
            return user_id == resource_id
        else:
            # Students shouldn't be accessing other resource types by ID
            return False

    elif user_role == "supervisor":
        # Supervisors own resources within their company
        # The actual ownership validation depends on the resource type
        return await _check_supervisor_ownership(
            supervisor_company_id=user_company_id,
            resource_key=owner_key,
            resource_id=resource_id
        )

    # If not student or supervisor, return False (shouldn't reach here for teacher)
    return False


async def _check_supervisor_ownership(
    supervisor_company_id: str,
    resource_key: str,
    resource_id: str
) -> bool:
    """
    Check if a resource belongs to a supervisor's company.

    This method uses the resource_key to determine how to validate ownership:
    - "company_id": direct comparison
    - "user_id": fetch user and check their company_id
    - "project_id": fetch project and check its company_id
    - "task_id": fetch task, then project, then check project's company_id
    - "business_id": direct comparison (same as company_id)

    Args:
        supervisor_company_id: The supervisor's company ID
        resource_key: The type of resource (determines validation method)
        resource_id: The ID of the resource to validate

    Returns:
        bool: True if resource belongs to supervisor's company, False otherwise
    """
    # Import here to avoid circular imports
    from domain.repositories import (
        UserRepository,
        ProjectRepository,
        TaskRepository,
    )

    try:
        if resource_key in ["company_id", "business_id"]:
            # Direct comparison: supervisor's company ID must match resource ID
            return supervisor_company_id == resource_id

        elif resource_key in ["user_id", "supervisor_id"]:
            # Check if the user belongs to the supervisor's company
            user_repo = UserRepository()
            user = user_repo.get_by_id(resource_id)
            if not user:
                return False
            user_company_id = user.get("company_id") or user.get("businessId")
            return user_company_id == supervisor_company_id

        elif resource_key == "project_id":
            # Check if the project belongs to the supervisor's company
            project_repo = ProjectRepository()
            project = project_repo.get_by_id(resource_id)
            if not project:
                return False
            return project.business_id == supervisor_company_id

        elif resource_key == "task_id":
            # Check if the task's project belongs to the supervisor's company
            task_repo = TaskRepository()
            task = task_repo.get_by_id(resource_id)
            if not task:
                return False

            project_repo = ProjectRepository()
            project = project_repo.get_by_id(task.project_id)
            if not project:
                return False

            return project.business_id == supervisor_company_id

        elif resource_key == "skill_id":
            # Skills are typically global (managed by teachers)
            # Supervisors don't manage skills, so return False
            # Unless your business model allows supervisors to manage skills
            return False

        # Unknown resource type
        return False

    except Exception as e:
        # If there's an error fetching the resource, deny access
        print(f"Error validating supervisor ownership for {resource_key}={resource_id}: {e}")
        return False
