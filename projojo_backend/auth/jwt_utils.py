from datetime import datetime, timedelta
import jwt
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer

# Security scheme for extracting Bearer tokens
security = HTTPBearer()

# JWT configuration
SECRET_KEY = "test"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def create_jwt_token(user, supervisor_data=None) -> str:
    """
    Create a JWT token for a user
    """
    payload = {
        "sub": user.email,
        "role": user.type.lower(),
        "exp": datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    }

    # Add supervisor-specific data if provided
    if user.type == "supervisor" and supervisor_data:
        payload["business"] = supervisor_data.get("business_association_id")
        payload["projects"] = supervisor_data.get("created_project_ids", [])

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_jwt_token(token) -> dict:
    """
    Decode and validate a JWT token
    Returns the payload if valid, raises HTTPException if invalid/expired
    """
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_token_payload(token: str = Depends(security)) -> dict:
    """
    FastAPI dependency to extract and validate JWT token
    Returns the decoded payload if valid, raises HTTPException if invalid
    """
    # Remove 'Bearer ' prefix if present (HTTPBearer should handle this, but just in case)
    if token.credentials.startswith("Bearer "):
        token_str = token.credentials[7:]
    else:
        token_str = token.credentials

    # Decode and validate token (this will raise HTTPException if invalid)
    return decode_jwt_token(token_str)
