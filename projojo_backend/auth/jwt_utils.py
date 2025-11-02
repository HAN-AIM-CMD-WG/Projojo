from datetime import datetime, timedelta, timezone
import os
import jwt
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer

# Security scheme for extracting Bearer tokens
security = HTTPBearer()

# JWT configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-jwt-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_TIME_MINUTES = 60

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

    try:
        return jwt.decode(token_str, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    # Token could be expired or invalid (tampered with)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
