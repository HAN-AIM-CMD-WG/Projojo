from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
import jwt
from domain.models import LoginRequest, LoginResponse

from domain.repositories import UserRepository
user_repo = UserRepository()

router = APIRouter(tags=["Auth Endpoints"])

SECRET_KEY = "test"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

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

    # Prepare token payload
    payload = {
        "sub": user.email,
        "password_hash": user.password_hash,
        "role": user.type.lower(),
        "exp": datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    }
    if user.type == "supervisor":
        supervisor = user_repo.get_supervisor_by_id(user.id)
        payload["business"] = supervisor.business_association_id
        payload["projects"] = supervisor.created_project_ids
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return LoginResponse(
        token=token,
        debug_payload=payload
    )
