from db.initDatabase import Db
from datetime import datetime, timedelta
import secrets
import string

class InviteRepository:
    def __init__(self):
        pass

    def save_invite_key(self, business_id: str) -> dict:
        """
        Create a new invite key for a specific business ID.
        Generates a cryptographically secure unique key automatically.
        Returns a dictionary with the created invite key data.
        """
        # Generate cryptographically secure unique key
        # 32 characters provides ~190 bits of entropy (log2(62^32))
        alphabet = string.ascii_letters + string.digits
        key = ''.join(secrets.choice(alphabet) for _ in range(32))

        created_at = datetime.now()
        expires_at = created_at + timedelta(weeks=1)

        query = """
            match
                $business isa business, has id ~business_id;
            insert
                $inviteKey isa inviteKey,
                    has key ~key,
                    has expiresAt ~expires_at,
                    has createdAt ~created_at;
                (business: $business, key: $inviteKey) isa businessInvite;
        """
        Db.write_transact(query, {
            "business_id": business_id,
            "key": key,
            "expires_at": expires_at,
            "created_at": created_at
        })

        result = {
            "key": key,
            "expiresAt": expires_at.isoformat() + "+00:00",
            "createdAt": created_at.isoformat() + "+00:00",
            "businessId": business_id
        }

        return result

    def validate_invite_key(self, key: str) -> dict | None:
        """
        Validate an invite key.
        Checks if it exists, is not used, and is not expired.
        Returns business details if valid, None otherwise.
        """
        query = """
            match
                $inviteKey isa inviteKey, has key ~key, has expiresAt $expiresAt;
                not { $inviteKey has usedAt $usedAt; };
                $business isa business;
                $invite isa businessInvite(business: $business, key: $inviteKey);
            fetch {
                'expiresAt': $expiresAt,
                'businessId': $business.id,
                'businessName': $business.name,
                'businessImage': $business.imagePath,
            };
        """
        result = Db.read_transact(query, {"key": key})

        if not result:
            return None

        invite_data = result[0]
        expires_at = invite_data.get('expiresAt')

        # Parse expires_at if it is a string
        if isinstance(expires_at, str):
            try:
                expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
            except ValueError:
                print(f"Error parsing expiresAt: {expires_at}")
                return None

        # Check expiration
        if expires_at and expires_at.replace(tzinfo=None) < datetime.now():
            return None

        return {
            "valid": True,
            "business": {
                "id": invite_data.get('businessId'),
                "name": invite_data.get('businessName'),
                "imagePath": invite_data.get('businessImage')
            }
        }

    def mark_invite_as_used(self, key: str) -> bool:
        """
        Mark an invite key as used.
        """
        query = """
            match
                $inviteKey isa inviteKey, has key ~key;
            insert
                $inviteKey has usedAt ~used_at;
        """
        try:
            Db.write_transact(query, {
                "key": key,
                "used_at": datetime.now()
            })
            return True
        except Exception as e:
            print(f"Error marking invite as used: {e}")
            return False
