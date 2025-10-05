from fastapi import Request, Depends
from domain.models.user import User
from auth.jwt_handler import JWTHandler


def get_current_user(
    request: Request,
    jwt_handler: JWTHandler = Depends(JWTHandler)
) -> User | None:
    """Get current user from JWT token"""
    # Try to get JWT token from Authorization header first, then fallback to cookies
    auth_header = request.headers.get('Authorization')
    token = None

    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.replace('Bearer ', '')
        user = jwt_handler.verify_jwt_token(token)
        return user

    return None