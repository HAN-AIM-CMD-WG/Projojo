import os
from authlib.integrations.starlette_client import OAuth


def setup_oauth() -> OAuth:
    """Configure OAuth providers"""
    oauth = OAuth()

    oauth.register(
        name='google',
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={'scope': 'openid email profile'}
    )

    oauth.register(
        name='github',
        client_id=os.getenv("GITHUB_CLIENT_ID"),
        client_secret=os.getenv("GITHUB_CLIENT_SECRET"),
        access_token_url='https://github.com/login/oauth/access_token',
        access_token_params=None,
        authorize_url='https://github.com/login/oauth/authorize',
        authorize_params=None,
        api_base_url='https://api.github.com/',
        client_kwargs={'scope': 'read:user user:email'},
    )

    oauth.register(
        name='microsoft',
        client_id=os.getenv("MICROSOFT_CLIENT_ID"),
        client_secret=os.getenv("MICROSOFT_CLIENT_SECRET"),
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

    oauth.register(
        name='surf',
        client_id=os.getenv("SURF_CLIENT_ID"),
        client_secret=os.getenv("SURF_CLIENT_SECRET"),
        server_metadata_url='https://connect.test.surfconext.nl/.well-known/openid-configuration', # Testing
        # server_metadata_url='https://connect.surfconext.nl/.well-known/openid-configuration', # Production
        client_kwargs={'scope': 'openid email name picture'}, # profile ?
        # TODO: ik weet niet of de afbeelding wel te krijgen is via surf, of dat dit via de key van surf bij de HAN moet worden opgehaald?
        # TODO: mogelijk is er ook een scope voor type gebruiker (student/docent)
    )

    return oauth


# Create OAuth client once at module level (singleton pattern)
oauth_client = setup_oauth()