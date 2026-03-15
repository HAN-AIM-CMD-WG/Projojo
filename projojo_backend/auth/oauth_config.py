from authlib.integrations.starlette_client import OAuth
from config.settings import (
    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET,
    MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET
)


def setup_oauth() -> OAuth:
    """Configure OAuth providers"""
    oauth = OAuth()

    oauth.register(
        name='google',
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={'scope': 'openid email profile'}
    )

    oauth.register(
        name='github',
        client_id=GITHUB_CLIENT_ID,
        client_secret=GITHUB_CLIENT_SECRET,
        access_token_url='https://github.com/login/oauth/access_token',
        access_token_params=None,
        authorize_url='https://github.com/login/oauth/authorize',
        authorize_params=None,
        api_base_url='https://api.github.com/',
        client_kwargs={'scope': 'read:user user:email'},
    )

    oauth.register(
        name='microsoft',
        client_id=MICROSOFT_CLIENT_ID,
        client_secret=MICROSOFT_CLIENT_SECRET,
        # server_metadata_url='https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration',
        access_token_url='https://login.microsoftonline.com/common/oauth2/v2.0/token',
        authorize_url='https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        api_base_url='https://graph.microsoft.com/v1.0/',
        jwks_uri='https://login.microsoftonline.com/common/discovery/v2.0/keys',
        client_kwargs={
            'scope': 'openid email profile User.Read',
            'token_endpoint_auth_method': 'client_secret_post',
        },
    )

    return oauth


# Create OAuth client once at module level (singleton pattern)
oauth_client = setup_oauth()