from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from auth.jwt_utils import get_token_payload

# List of endpoints that should be excluded from JWT validation
# These can be exact paths or prefixes ending with '*'
# Paths are relative to the root of the API and should start with a '/'. For example, "/auth/login/*"
EXCLUDED_ENDPOINTS = [
    "/",  # Root endpoint
    "/docs",  # Swagger UI
    "/redoc",  # ReDoc
    "/openapi.json",  # OpenAPI schema
    "/auth/login/*",  # Login endpoint
    "/auth/oauth/callback/*",  # OAuth callback
    "/pdf/*",  # Public PDF access
    "/image/*",  # Public image access

    "/typedb/status",  # TypeDB status check
    "/auth/test/login/*",  # Localhost testing - test login
    "/users/",  # Localhost testing - all users
]


class JWTMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        """
        Middleware to validate JWT tokens on each request.
        Excludes specified endpoints from JWT validation.
        """
        # Allow OPTIONS requests (CORS preflight) without JWT validation
        if request.method == "OPTIONS":
            return await call_next(request)

        # Check if the request path should be excluded from JWT validation
        if self._should_skip_jwt_validation(request.url.path):
            return await call_next(request)

        # Validate JWT token and save payload in request state
        try:
            payload = get_token_payload(request)

            request.state.user = payload
            request.state.user_id = payload.get("sub")
            request.state.user_role = payload.get("role")
            request.state.business_id = payload.get("businessId") if "businessId" in payload else None
        except HTTPException as e:
            return JSONResponse(status_code=e.status_code, content={"detail": e.detail})
        except Exception as e:
            print(f"JWT validation error: {e}")
            return JSONResponse(
                status_code=401,
                content={"detail": "Authentication failed"}
            )

        # Proceed to the next middleware/route handler
        return await call_next(request)

    def _should_skip_jwt_validation(self, path: str) -> bool:
        """
        Check if the request path should skip JWT validation.
        Supports exact matches and prefix matches (e.g., /auth/*).
        """
        for excluded in EXCLUDED_ENDPOINTS:
            # Exact match
            if path == excluded:
                return True
            # Prefix match (e.g., /auth/* matches /auth/login, /auth/oauth/callback)
            if excluded.endswith("*"):
                prefix = excluded[:-1]
                if path.startswith(prefix):
                    return True
        return False
