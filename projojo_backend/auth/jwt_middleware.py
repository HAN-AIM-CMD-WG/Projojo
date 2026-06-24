from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.routing import Match
from auth.jwt_utils import get_token_payload
from auth.permissions import set_request_context

# Path-only endpoints that should be excluded from JWT validation.
# These are system endpoints or static files that don't use the @auth decorator.
PATH_EXCLUDED_ENDPOINTS = [
    "/",  # Root endpoint
    "/docs",  # Swagger UI
    "/redoc",  # ReDoc
    "/openapi.json",  # OpenAPI schema

    "/pdf/*",  # Public PDF access
    "/image/*",  # Public image access

    # Public discovery endpoints (no authentication required)
    "/projects/public",  # List all public projects
    "/projects/public/*",  # Get specific public project

    # Development
    "/typedb/status",  # TypeDB status check
    "/auth/test/login/*",  # Localhost testing - test login
    "/users/",  # Localhost testing - all users
]

# Theme endpoints are public only for reads; theme writes must validate JWT.
PUBLIC_THEME_READ_ENDPOINTS = ["/themes", "/themes/*"]


class JWTMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        """
        Middleware to validate JWT tokens on each request.
        Excludes specified endpoints from JWT validation.
        Stores request in context variable for auth decorators.
        """
        # Store request in context variable for use by decorators
        set_request_context(request)

        # Allow OPTIONS requests (CORS preflight) without JWT validation
        if request.method == "OPTIONS":
            return await call_next(request)

        # Initialize request state with default values (for unauthenticated requests)
        request.state.user = None
        request.state.user_id = None
        request.state.user_role = None
        request.state.business_id = None

        # Check if the request path should be excluded from JWT validation (System endpoints)
        path = request.url.path
        if self._should_skip_jwt_validation(path, request.method):
            return await call_next(request)

        only_unauthenticated_allowed = True if self._get_route_auth_role(request) == "unauthenticated" else False

        # Validate JWT token and save payload in request state
        try:
            payload = get_token_payload(request)

            if (payload.get("role") == "supervisor"):
                if ("businessId" not in payload):
                    raise HTTPException(
                        status_code=401,
                        detail="Je sessie is ongeldig. Log opnieuw in."
                    )

            request.state.user = payload
            request.state.user_id = payload.get("sub")
            request.state.user_role = payload.get("role")
            request.state.business_id = payload.get("businessId")
        except HTTPException as e:
            # ignore validation errors if the endpoint is for unauthenticated users
            if not only_unauthenticated_allowed:
                print(f"HTTPException during JWT validation: {e.detail}")
                return JSONResponse(status_code=e.status_code, content={"detail": e.detail})
        except Exception as e:
            if not only_unauthenticated_allowed:
                print(f"JWT validation error: {e}")
                if (hasattr(e, 'status_code')):
                    return JSONResponse(status_code=e.status_code, content={"detail": str(e)})
                return JSONResponse(status_code=401, content={"detail": "Er is iets misgegaan bij de authenticatie. Probeer het later opnieuw."})

        # Proceed to the next middleware/route handler
        return await call_next(request)

    def _should_skip_jwt_validation(self, path: str, method: str) -> bool:
        """
        Theme endpoints are public only for reads; theme writes must validate JWT.
        Other excluded endpoints keep their path-only exclusion behavior.
        """
        if method == "GET" and self._matches_excluded_path(path, PUBLIC_THEME_READ_ENDPOINTS):
            return True

        return self._is_excluded_path(path)

    def _is_excluded_path(self, path: str) -> bool:
        """
        Check if the request path should skip JWT validation.
        Supports exact matches and prefix matches (e.g., /auth/*).
        """
        return self._matches_excluded_path(path, PATH_EXCLUDED_ENDPOINTS)

    def _matches_excluded_path(self, path: str, excluded_paths: list[str]) -> bool:
        for excluded in excluded_paths:
            # Exact match
            if path == excluded:
                return True
            # Prefix match (e.g., /auth/* matches /auth/login, /auth/oauth/callback)
            if excluded.endswith("*"):
                prefix = excluded[:-1]
                if path.startswith(prefix):
                    return True
        return False

    def _get_route_auth_role(self, request: Request) -> str | None:
        """
        Inspect the request to find the matching route and check its auth configuration.
        Returns the required role if found (e.g. "unauthenticated"), or None.
        """
        for route in request.app.routes:
            match, _ = route.matches(request.scope)
            if match == Match.FULL:
                # Found the route, check the endpoint for auth_role attribute
                # The endpoint might be wrapped, but we attached auth_role to the wrapper
                return getattr(route.endpoint, "auth_role", None)
        return None
