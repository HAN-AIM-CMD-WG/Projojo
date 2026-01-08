from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import RedirectResponse
from domain.repositories.user_repository import UserRepository
from auth.oauth_config import oauth_client
from auth.jwt_utils import create_jwt_token
from auth.permissions import auth
from service.auth_service import AuthService
from config.settings import FRONTEND_URL, IS_DEVELOPMENT
from urllib.parse import urlparse

user_repo = UserRepository()
router = APIRouter(prefix="/auth", tags=["Auth Endpoints"])

# Default frontend URL as fallback
DEFAULT_FRONTEND_URL = FRONTEND_URL


def get_frontend_url_from_login(request: Request) -> str:
    """
    Extract frontend URL from the initial login request.
    This is called when user initiates login from the frontend.
    """
    # Try to get from Referer header (user coming from frontend)
    referer = request.headers.get("referer")
    if referer:
        parsed = urlparse(referer)
        return f"{parsed.scheme}://{parsed.netloc}"

    # Try Origin header as fallback
    origin = request.headers.get("origin")
    if origin:
        return origin

    # Fallback to configured/default URL
    return DEFAULT_FRONTEND_URL


@router.get("/login/{provider}")
@auth(role="unauthenticated")
async def auth_login(
    request: Request,
    provider: str
):
    """Step 1: Redirect user to OAuth provider"""
    redirect_uri = request.url_for('auth_callback', provider=provider)
    
    # Force HTTPS when behind reverse proxy (non-development environments)
    if not IS_DEVELOPMENT:
        redirect_uri = str(redirect_uri).replace('http://', 'https://')

    # Get frontend URL from the request and store it in the session
    frontend_url = get_frontend_url_from_login(request)
    request.session['frontend_url'] = frontend_url

    # Get the OAuth client for the specified provider
    client = getattr(oauth_client, provider, None)
    if not client:
        print(f"Unsupported OAuth provider: {provider}")
        # Redirect to frontend auth callback with error
        return RedirectResponse(url=f"{frontend_url}/auth/callback?error=unsupported_provider")

    # Authlib will handle the state parameter for CSRF protection
    return await client.authorize_redirect(request, redirect_uri)


@router.get("/callback/{provider}")
@auth(role="unauthenticated")
async def auth_callback(
    request: Request,
    provider: str,
    auth_service: AuthService = Depends(AuthService)
):
    """Step 2: Handle callback from OAuth provider with authorization code"""
    # Retrieve frontend URL from session (stored during login)
    frontend_url = request.session.get('frontend_url', DEFAULT_FRONTEND_URL)

    try:
        jwt_token, is_new_user = await auth_service.handle_oauth_callback(request, provider)

        # Redirect with token and new user flag
        redirect_url = f"{frontend_url}/auth/callback?access_token={jwt_token}&is_new_user={str(is_new_user).lower()}"
        return RedirectResponse(url=redirect_url)

    except ValueError as e:
        # Redirect to frontend auth callback with error
        print(f"ValueError - OAuth callback handling failed for {provider}: {e}")
        return RedirectResponse(url=f"{frontend_url}/auth/callback?error=auth_failed")
    except Exception as e:
        # Redirect to frontend auth callback with error for any other exception
        print(f"Exception - OAuth callback handling failed for {provider}: {e}")
        return RedirectResponse(url=f"{frontend_url}/auth/callback?error=auth_failed")

@router.post("/test/login/{user_id}")
@auth(role="unauthenticated")
async def test_login(user_id: str, request: Request):
    """
    LOCALHOST ONLY: Generate a JWT token for any user ID for testing purposes.
    This endpoint should only be used in development environments.
    """
    # Check if the request is from localhost
    if not IS_DEVELOPMENT:
        raise HTTPException(status_code=403, detail="Dit kan alleen in de test-omgeving")

    # Get user from database
    user = user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="Gebruiker niet gevonden"
        )

    # Handle both dict and object responses from repository
    if isinstance(user, dict):
        user_type = user.get("type")
        user_email = user.get("email")
        user_full_name = user.get("full_name")
        user_id_value = user.get("id")
    else:
        user_type = user.type
        user_email = user.email
        user_full_name = user.full_name
        user_id_value = user.id

    # Get business_id if user is a supervisor
    business_id = None
    if user_type == "supervisor":
        supervisor = user_repo.get_supervisor_by_id(user_id_value)
        if supervisor:
            business_id = supervisor.business_association_id

    # Create JWT token
    token = create_jwt_token(user_id=user_id_value, role=user_type, business_id=business_id)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id_value,
            "email": user_email,
            "full_name": user_full_name,
            "type": user_type
        }
    }