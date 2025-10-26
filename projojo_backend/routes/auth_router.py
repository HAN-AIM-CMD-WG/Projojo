from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import RedirectResponse
from domain.repositories.user_repository import UserRepository
from auth.oauth_config import oauth_client
from auth.jwt_utils import create_jwt_token
from service.auth_service import AuthService

user_repo = UserRepository()
router = APIRouter(prefix="/auth", tags=["Auth Endpoints"])

# TODO: make sure there are no endpoints returning JSON. All should redirect to frontend, e.g. to {frontendurl}/login?error=... (error handling not implemented yet)
#       And remove debug prints throughout oauth flow
@router.get("/login/{provider}")
async def auth_login(
    request: Request,
    provider: str
):
    """Step 1: Redirect user to OAuth provider"""
    redirect_uri = request.url_for('auth_callback', provider=provider)
    # TODO: remove debug prints throughout oauth flow
    print(f"Redirect URI: {redirect_uri}")

    # Get the OAuth client for the specified provider
    client = getattr(oauth_client, provider, None)
    if not client:
        return {"error": f"Het is niet mogelijk om in te loggen met {provider}"}

    return await client.authorize_redirect(request, redirect_uri)


@router.get("/callback/{provider}")
async def auth_callback(
    request: Request,
    provider: str,
    auth_service: AuthService = Depends(AuthService)
):
    """Step 2: Handle callback from OAuth provider with authorization code"""
    try:
        # All complex logic moved to service
        jwt_token = await auth_service.handle_oauth_callback(request, provider)
        # TODO: also return if the user is new, to show an "account created" message in frontend

        # Simple redirect with token
        redirect_url = f"http://localhost:5173/auth/callback?access_token={jwt_token}"
        return RedirectResponse(url=redirect_url)

    except ValueError as e:
        return {"error": str(e)}
    except Exception as e:
        return {"error": f"OAuth failed: {str(e)}"}


@router.post("/test/login/{user_id}")
async def test_login(user_id: str, request: Request):
    """
    LOCALHOST ONLY: Generate a JWT token for any user ID for testing purposes.
    This endpoint should only be used in development environments.
    """
    # Check if the server itself is running on localhost
    server_host = request.url.hostname
    if server_host not in ["127.0.0.1", "localhost", "::1"]:
        raise HTTPException(
            status_code=403,
            detail="This endpoint is only available when the server is running on localhost"
        )

    # Get user from database
    user = user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
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