from db.initDatabase import Db
from datetime import datetime
import secrets
import string

class InviteRepository:
    def __init__(self):
        pass

    def save_invite_key(self, invite_type: str, business_id: str | None = None) -> dict:
        """
        Create a new invite key for a specific invite type and optional business ID.
        Generates a cryptographically secure unique key automatically.
        Returns a dictionary with the created invite key data.
        """
        # Generate cryptographically secure unique key
        # 32 characters provides ~190 bits of entropy (log2(62^32))
        alphabet = string.ascii_letters + string.digits
        key = ''.join(secrets.choice(alphabet) for _ in range(32))

        created_at = datetime.now()

        if invite_type == "business" and business_id:
            query = f"""
                match
                    $business isa business, has name "{business_id}";
                insert
                    $inviteKey isa inviteKey,
                        has key "{key}",
                        has inviteType "{invite_type}",
                        has isUsed false,
                        has createdAt {created_at.isoformat()};
                    (business: $business, key: $inviteKey) isa businessInvite;
            """
        else:
            query = f"""
                insert
                    $inviteKey isa inviteKey,
                        has key "{key}",
                        has inviteType "{invite_type}",
                        has isUsed false,
                        has createdAt {created_at.isoformat()};
            """

        Db.write_transact(query)

        result = {
            "key": key,
            "inviteType": invite_type,
            "isUsed": False,
            "createdAt": created_at.isoformat() + "+00:00"
        }

        if business_id:
            result["businessId"] = business_id

        return result
