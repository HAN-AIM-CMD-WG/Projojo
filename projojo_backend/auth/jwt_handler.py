import os
from datetime import datetime, timedelta, timezone
import jwt
from domain.models.user import User
from domain.repositories.user_repository import UserRepository
from fastapi import Depends

# JWT settings
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-jwt-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_TIME_MINUTES = 60


class JWTHandler:
    def __init__(self, user_repository: UserRepository = Depends(UserRepository)):
        self.user_repository = user_repository

    def create_jwt_token(self, user_id: str) -> str:
        """Create a JWT token containing only the user ID (UUID)"""
        # Calculate expiration time
        now = datetime.now(timezone.utc)
        expire = now + timedelta(minutes=JWT_EXPIRATION_TIME_MINUTES)

        # Create the payload with only the user ID
        payload = {
            "sub": user_id,  # Subject (user UUID) - only data stored in JWT
            "role": "student",  # Placeholder role, can be expanded if needed
            "exp": expire,  # Expires at
            "iat": now,  # Issued at
            "iss": "projojo"  # Issuer
        }

        # Encode the JWT token
        token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        return token

    def verify_jwt_token(self, token: str) -> User | None:
        """Verify a JWT token and return the user from database if valid"""
        try:
            # Decode the token to get user ID (UUID)
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
            user_id = payload.get("sub")

            if not user_id:
                return None

            # Fetch user data from database using UUID
            user = self.user_repository.get_user_by_id(user_id)
            return user

        except Exception:
            # Token is invalid, expired, or malformed
            return None