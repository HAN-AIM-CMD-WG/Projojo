from pydantic import BaseModel
from datetime import datetime

class InviteKey(BaseModel):
	key: str
	invite_type: str
	is_used: bool
	created_at: datetime
	business_id: str | None = None
