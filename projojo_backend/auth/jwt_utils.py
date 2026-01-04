from datetime import datetime, timedelta, timezone
import jwt
from fastapi import HTTPException, Request
from fastapi.security import HTTPBearer
from environs import Env

# Load environment variables
env = Env(expand_vars=True)
env.read_env(".env.preview", recurse=True, override=True)
env.read_env(".env", recurse=True, override=True)

# Security scheme for extracting Bearer tokens
security = HTTPBearer()

# JWT configuration
JWT_SECRET_KEY = env.str("JWT_SECRET_KEY", None)
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_TIME_MINUTES = 60 * 8

if (not JWT_SECRET_KEY) or (JWT_SECRET_KEY.strip() == ""):
    raise Exception("JWT_SECRET_KEY is not set in environment variables")

def create_jwt_token(user_id: str, role: str = "student", business_id: str | None = None) -> str:
    """
    Create a JWT token containing only the user ID (UUID)
    """
    # Calculate expiration time with timezone-aware datetime
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=JWT_EXPIRATION_TIME_MINUTES)

    # Create the payload with only the user ID
    payload = {
        "sub": user_id,  # Subject (user UUID) - only data stored in JWT
        "role": role,
        "exp": expire,  # Expires at
        "iat": now,  # Issued at
        "iss": "projojo"  # Issuer
    }

    if role == "supervisor" and business_id:
        payload["businessId"] = business_id

    # Encode the JWT token
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token

def get_token_payload(request: Request) -> dict:
    """
    FastAPI dependency to extract and validate JWT token
    Returns the decoded payload if valid, raises HTTPException if invalid
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Er is iets fout gegaan met je sessie. Log opnieuw in.")

    token_str = auth_header[7:]

    try:
        return jwt.decode(token_str, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Je sessie is verlopen. Log opnieuw in.")
    except jwt.InvalidTokenError as ite:
        print(f"Invalid JWT token: {ite}")
        raise HTTPException(status_code=401, detail="Er is iets fout gegaan met je sessie. Log opnieuw in.")
    except Exception as e:
        print(f"Unexpected error while decoding JWT token: {e}")
        raise HTTPException(status_code=401, detail="Je moet ingelogd zijn")
