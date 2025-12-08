from typing import Any

from pydantic import BaseModel


class OAuthProvider(BaseModel):
    """Represents an OAuth provider with its unique subject ID for a user"""
    provider_name: str  # e.g., "Microsoft", "Google"
    oauth_sub: str      # The unique subject ID from the OAuth provider


class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    token: str = None
    debug_payload: dict[str, Any] | None = None