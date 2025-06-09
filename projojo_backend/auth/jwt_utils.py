from datetime import datetime, timedelta
import jwt

# JWT configuration
SECRET_KEY = "test"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def create_jwt_token(user, supervisor_data=None):
    """
    Create a JWT token for a user
    """
    payload = {
        "sub": user.email,
        "password_hash": user.password_hash,
        "role": user.type.lower(),
        "exp": datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    }

    # Add supervisor-specific data if provided
    if user.type == "supervisor" and supervisor_data:
        payload["business"] = supervisor_data.get("business_association_id")
        payload["projects"] = supervisor_data.get("created_project_ids", [])

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_jwt_token(token):
    """
    Decode and validate a JWT token
    Returns the payload if valid, raises exception if invalid/expired
    """
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
