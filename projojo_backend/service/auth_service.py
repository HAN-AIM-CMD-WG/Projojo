from fastapi import Request, Depends
from domain.models.user import User
from domain.repositories.user_repository import UserRepository
from auth.jwt_handler import JWTHandler
from auth.oauth_config import oauth_client
from domain.models.authentication import OAuthProvider

class AuthService:
    def __init__(self, user_repo: UserRepository = Depends(UserRepository), jwt_handler: JWTHandler = Depends(JWTHandler)):
        self.user_repo = user_repo
        self.jwt_handler = jwt_handler

    async def handle_oauth_callback(self, request: Request, provider: str) -> str:
        """Handle OAuth callback and return JWT token"""
        # Get OAuth client
        client = getattr(oauth_client, provider, None)
        if not client:
            raise ValueError(f"Provider '{provider}' not configured")

        # Exchange authorization code for access token
        token = await client.authorize_access_token(request)

        # Extract user info based on provider
        extracted_user = await self._extract_user_from_token(provider, client, token)

        # Get or create user in database
        existing_user = self._get_or_create_user(extracted_user)

        # Create JWT token
        jwt_token = self.jwt_handler.create_jwt_token(existing_user.id)

        return jwt_token

    async def _extract_user_from_token(self, provider: str, client, token) -> User:
        """Extract user information from OAuth token based on provider"""
        if provider == 'google':
            return await self._extract_google_user(token)
        elif provider == 'github':
            return await self._extract_github_user(client, token)
        else:
            raise ValueError(f"Provider '{provider}' not supported")

    async def _extract_google_user(self, token) -> User:
        """Extract user info from Google OAuth token"""
        user_info = token.get('userinfo')
        print(f"User info received from Google: {user_info}")

        if not user_info:
            raise ValueError("Failed to get user info from Google")

        oauth_provider = OAuthProvider(
            provider_name='google',
            oauth_sub=user_info['sub']
        )

        return User(
            email=user_info['email'],
            full_name=user_info['name'],
            image_path=user_info.get('picture', ''),
            oauth_providers=[oauth_provider]
        )

    async def _extract_github_user(self, client, token) -> User:
        """Extract user info from GitHub OAuth token"""
        # Get basic user profile
        user_resp = await client.get('user', token=token)
        user_info = user_resp.json()
        print(f"User info received from GitHub: {user_info}")

        # Get user's emails
        emails_resp = await client.get('user/emails', token=token)
        emails = emails_resp.json()
        print(f"Email info received from GitHub: {emails}")

        if not user_info:
            raise ValueError("Failed to get user info from GitHub")

        # Find primary email
        primary_email = self._find_primary_email(emails)

        oauth_provider = OAuthProvider(
            provider_name='github',
            oauth_sub=str(user_info['id'])
        )

        return User(
            email=primary_email,
            full_name=user_info.get('name') or user_info.get('login'),
            image_path=user_info.get('avatar_url', ''),
            oauth_providers=[oauth_provider]
        )

    def _find_primary_email(self, emails: list) -> str:
        """Find primary email from GitHub emails list"""
        for email in emails:
            if email.get('primary', False):
                return email['email']

        # Fallback to first email if no primary found
        if emails:
            return emails[0]['email']

        raise ValueError("No email found for GitHub user")

    def _get_or_create_user(self, extracted_user: User) -> User:
        """Get existing user or create new one"""
        if not extracted_user.oauth_providers or len(extracted_user.oauth_providers) == 0:
            raise ValueError("No OAuth provider information found")

        oauth_provider = extracted_user.oauth_providers[0]

        existing_user = self.user_repo.get_user_by_sub_and_provider(
            oauth_provider.oauth_sub,
            oauth_provider.provider_name
        )

        if not existing_user:
            existing_user = self.user_repo.create_user(extracted_user)

        return existing_user