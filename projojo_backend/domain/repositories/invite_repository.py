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
            query = """
                match
                    $business isa business, has id ~business_id;
                insert
                    $inviteKey isa inviteKey,
                        has key ~key,
                        has inviteType ~invite_type,
                        has isUsed ~is_used,
                        has createdAt ~created_at;
                    (business: $business, key: $inviteKey) isa businessInvite;
            """
            Db.write_transact(query, {
                "business_id": business_id,
                "key": key,
                "invite_type": invite_type,
                "is_used": False,
                "created_at": created_at
            })
        else:
            query = """
                insert
                    $inviteKey isa inviteKey,
                        has key ~key,
                        has inviteType ~invite_type,
                        has isUsed ~is_used,
                        has createdAt ~created_at;
            """
            Db.write_transact(query, {
                "key": key,
                "invite_type": invite_type,
                "is_used": False,
                "created_at": created_at
            })

        result = {
            "key": key,
            "inviteType": invite_type,
            "isUsed": False,
            "createdAt": created_at.isoformat() + "+00:00"
        }

        if business_id:
            result["businessId"] = business_id

        return result
