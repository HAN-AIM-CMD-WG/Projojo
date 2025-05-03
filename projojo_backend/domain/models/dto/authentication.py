from typing import Optional, Dict, Any

from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    status: str
    message: str
    token: str = None
    debug_payload: Optional[Dict[str, Any]] = None