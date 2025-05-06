from typing import Optional, Dict, Any

from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    token: str = None
    debug_payload: Optional[Dict[str, Any]] = None