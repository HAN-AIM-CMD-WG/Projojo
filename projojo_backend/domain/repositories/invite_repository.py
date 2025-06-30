from db.initDatabase import Db
from .base import BaseRepository
from domain.models import InviteKey
from datetime import datetime
import secrets
import string

class InviteRepository(BaseRepository[InviteKey]):
    def __init__(self):
        super().__init__(InviteKey, "inviteKey")

    def save_invite_key(self, invite_type: str, business_id: str | None = None) -> InviteKey:
        """
        Create a new invite key for a specific invite type and optional business ID.
        Generates a cryptographically secure unique key automatically.
        """
        # Generate cryptographically secure unique key
        # 32 characters provides ~190 bits of entropy (log2(62^32))
        alphabet = string.ascii_letters + string.digits
        key = ''.join(secrets.choice(alphabet) for _ in range(32))

        invite_key = InviteKey(
            key=key,
            invite_type=invite_type,
            is_used=False,
            created_at=datetime.now(),
            business_id=business_id
        )

        if invite_type == "business" and business_id:
            # Insert invite key and create relation with business
            query = f"""
                match
                    $business isa business, has name "{business_id}";
                insert
                    $inviteKey isa inviteKey,
                        has key "{key}",
                        has inviteType "{invite_type}",
                        has isUsed false,
                        has createdAt {invite_key.created_at.isoformat()};
                    (business: $business, key: $inviteKey) isa businessInvite;
            """
        else:
            # Insert invite key only (for teacher invites)
            query = f"""
                insert
                    $inviteKey isa inviteKey,
                        has key "{key}",
                        has inviteType "{invite_type}",
                        has isUsed false,
                        has createdAt {invite_key.created_at.isoformat()};
            """

        Db.write_transact(query)
        return invite_key
