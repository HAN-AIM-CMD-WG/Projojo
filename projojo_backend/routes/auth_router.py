from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from domain.repositories.user_repository import UserRepository
from auth.oauth_config import oauth_client
from service.auth_service import AuthService

user_repo = UserRepository()
router = APIRouter(prefix="/auth", tags=["Auth Endpoints"])

# TODO: make sure there are no endpoints returning JSON. All should redirect to frontend, e.g. to {frontendurl}/login?error=... (error handling not implemented yet)
@router.get("/login/{provider}")
async def auth_login(
    request: Request,
    provider: str
):
    """Step 1: Redirect user to OAuth provider"""
    redirect_uri = request.url_for('auth_callback', provider=provider)
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



# def verify_user_credentials(email: str, password: str):
#     # TODO: Remove password-based authentication once OAuth is fully implemented
#     # For now, we'll allow all users with valid email addresses
#     user = user_repo.get_credentials(email)
#     print("verifying... "+str(email))
#     if user:
#         return user
#     return None

# @router.post("/login", response_model=LoginResponse)
# async def login(login_data: LoginRequest):
#     """
#     Authenticate a user and return a JWT token
#     """
#     print("login data: "+str(login_data))
#     user = verify_user_credentials(login_data.email, login_data.password)
#     if not user:
#         raise HTTPException(
#             status_code=401,
#             detail="Invalid email or password"
#         )

#     # Get supervisor data if needed
#     supervisor_data = None
#     if user.type == "supervisor":
#         supervisor = user_repo.get_supervisor_by_id(user.id)
#         supervisor_data = {
#             "business_association_id": supervisor.business_association_id,
#             "created_project_ids": supervisor.created_project_ids
#         }

#     # Create JWT token
#     token = create_jwt_token(user, supervisor_data)

#     # Decode for debug payload
#     debug_payload = decode_jwt_token(token)

#     return LoginResponse(
#         token=token,
#         debug_payload=debug_payload
#     )
