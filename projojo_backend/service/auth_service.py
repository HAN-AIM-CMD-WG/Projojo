import asyncio
from fastapi import Request, Depends
from domain.models.user import User
from domain.repositories.user_repository import UserRepository
from auth.jwt_utils import create_jwt_token
from auth.oauth_config import oauth_client
from domain.models.authentication import OAuthProvider
from service.image_service import save_image_from_bytes

class AuthService:
    def __init__(self, user_repo: UserRepository = Depends(UserRepository)):
        self.user_repo = user_repo

    async def handle_oauth_callback(self, request: Request, provider: str) -> tuple[str, bool]:
        """Handle OAuth callback and return JWT token and is_new_user flag"""
        # Get OAuth client
        client = getattr(oauth_client, provider, None)
        if not client:
            raise ValueError(f"We ondersteunen '{provider}' nog niet")

        # Exchange authorization code for access token
        token = await client.authorize_access_token(request)

        # Extract user info based on provider
        extracted_user = await self._extract_user_from_token(provider, client, token)

        # Get or create user in database
        final_user, is_new_user = self._get_or_create_user(extracted_user)

        # Create JWT token
        jwt_token = create_jwt_token(final_user.id)

        return jwt_token, is_new_user

    async def _extract_user_from_token(self, provider: str, client, token) -> User:
        """Extract user information from OAuth token based on provider"""
        if provider == 'google':
            return await self._extract_google_user(token)
        elif provider == 'github':
            return await self._extract_github_user(client, token)
        elif provider == 'microsoft':
            return await self._extract_microsoft_user(client, token)
        else:
            raise ValueError(f"'{provider}' is geen ondersteunde OAuth-provider")

    async def _extract_google_user(self, token) -> User:
        """Extract user info from Google OAuth token"""
        user_info = token.get('userinfo')

        if not user_info:
            raise ValueError("We kunnen je Google-gegevens niet ophalen")

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
        # Get basic user profile and emails in parallel
        user_resp, emails_resp = await asyncio.gather(
            client.get('user', token=token),
            client.get('user/emails', token=token)
        )

        user_info = user_resp.json()
        emails = emails_resp.json()

        if not user_info:
            raise ValueError("We kunnen je GitHub-gegevens niet ophalen")

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

        raise ValueError("Je GitHub-account heeft geen e-mailadres")

    async def _extract_microsoft_user(self, client, token) -> User:
        """Extract user info from Microsoft OAuth token"""
        user_info = token.get('userinfo')

        if not user_info:
            raise ValueError("We kunnen je Microsoft-gegevens niet ophalen")

        oauth_provider = OAuthProvider(
            provider_name='microsoft',
            oauth_sub=user_info['sub']
        )

        # Check if user already exists
        existing_user = self.user_repo.get_by_sub_and_provider(
            oauth_provider.oauth_sub,
            oauth_provider.provider_name
        )

        # Only download profile picture for new users
        image_filename = ""
        if not existing_user:
            image_filename = await self._download_microsoft_picture(client, token)

        return User(
            email=user_info['email'],
            full_name=user_info.get('name', ''),
            image_path=image_filename,
            oauth_providers=[oauth_provider]
        )

    async def _download_microsoft_picture(self, client, token) -> str:
        """Download Microsoft profile picture and return the filename"""
        image_filename = ""
        try:
            picture_resp = await client.get('me/photo/$value', token=token)

            if picture_resp.status_code == 200:
                # Determine file extension from Content-Type header
                content_type = picture_resp.headers.get('Content-Type', '')
                file_extension = '.jpg'  # Default
                if 'jpeg' in content_type or 'jpg' in content_type:
                    file_extension = '.jpg'
                elif 'png' in content_type:
                    file_extension = '.png'
                elif 'gif' in content_type:
                    file_extension = '.gif'

                # Save the image bytes
                image_filename = save_image_from_bytes(picture_resp.content, file_extension)
        except Exception as e:
            print(f"Failed to download Microsoft profile picture: {e}")

        return image_filename

    def _get_or_create_user(self, extracted_user: User) -> tuple[User, bool]:
        """Get existing user or create new one. Returns (user, is_new_user)"""
        if not extracted_user.oauth_providers or len(extracted_user.oauth_providers) == 0:
            raise ValueError("Geen login-provider gevonden")

        oauth_provider = extracted_user.oauth_providers[0]

        existing_user = self.user_repo.get_by_sub_and_provider(
            oauth_provider.oauth_sub,
            oauth_provider.provider_name
        )

        if not existing_user:
            new_user = self.user_repo.create_user(extracted_user)
            return new_user, True

        return existing_user, False