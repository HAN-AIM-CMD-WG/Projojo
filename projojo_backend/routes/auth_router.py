from fastapi import APIRouter, HTTPException
from domain.models import LoginRequest, LoginResponse
from domain.repositories import UserRepository
from auth.jwt_utils import create_jwt_token, decode_jwt_token

user_repo = UserRepository()
router = APIRouter(tags=["Auth Endpoints"])

def verify_user_credentials(email: str, password: str):
    user = user_repo.get_credentials(email)
    print("verifying... "+str(email))
    if user and user.password_hash == password:
        return user
    return None

@router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    """
    Authenticate a user and return a JWT token
    """
    print("login data: "+str(login_data))
    user = verify_user_credentials(login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Get supervisor data if needed
    supervisor_data = None
    if user.type == "supervisor":
        supervisor = user_repo.get_supervisor_by_id(user.id)
        supervisor_data = {
            "business_association_id": supervisor.business_association_id,
            "created_project_ids": supervisor.created_project_ids
        }

    # Create JWT token
    token = create_jwt_token(user, supervisor_data)

    # Decode for debug payload
    debug_payload = decode_jwt_token(token)

    return LoginResponse(
        token=token,
        debug_payload=debug_payload
    )
