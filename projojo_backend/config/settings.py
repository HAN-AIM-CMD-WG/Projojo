from environs import Env

env = Env(expand_vars=True, eager=False)

# Read .env file with override=False so that actual environment variables
# (set by Dokploy/Docker) take precedence over file values.
# This allows:
# - Production/Preview: Real env vars from Dokploy override any file values
# - Development: .env file provides local defaults (copy from .env.example)
env.read_env(".env", recurse=True, override=False)

# Environment
ENVIRONMENT: str = env.str("ENVIRONMENT", "none")
IS_DEVELOPMENT: bool = ENVIRONMENT.lower() == "development"
IS_PRODUCTION: bool = ENVIRONMENT.lower() == "production"


# Frontend
FRONTEND_URL: str = env.str("FRONTEND_URL")

# Session & Security
SESSIONS_SECRET_KEY: str = env.str("SESSIONS_SECRET_KEY")
JWT_SECRET_KEY: str = env.str("JWT_SECRET_KEY")

# OAuth Providers (all required)
GOOGLE_CLIENT_ID: str = env.str("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET: str = env.str("GOOGLE_CLIENT_SECRET")
GITHUB_CLIENT_ID: str = env.str("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET: str = env.str("GITHUB_CLIENT_SECRET")
MICROSOFT_CLIENT_ID: str = env.str("MICROSOFT_CLIENT_ID")
MICROSOFT_CLIENT_SECRET: str = env.str("MICROSOFT_CLIENT_SECRET")

# TypeDB Configuration (all required)
TYPEDB_SERVER_ADDR: str = env.str("TYPEDB_SERVER_ADDR")
TYPEDB_NAME: str = env.str("TYPEDB_NAME")
TYPEDB_USERNAME: str = env.str("TYPEDB_USERNAME")
TYPEDB_DEFAULT_PASSWORD: str = env.str("TYPEDB_DEFAULT_PASSWORD")
TYPEDB_NEW_PASSWORD: str = env.str("TYPEDB_NEW_PASSWORD")

# Optional: Reset database on startup (WARNING: deletes all data!)
RESET_DB: bool = env.bool("RESET_DB", default=False)

# Email Configuration (required except username/password)
EMAIL_DEFAULT_SENDER: str = env.str("EMAIL_DEFAULT_SENDER")
EMAIL_SMTP_HOST: str = env.str("EMAIL_SMTP_HOST")
EMAIL_SMTP_PORT: int = env.int("EMAIL_SMTP_PORT")

# Optional: SMTP credentials (empty for services like MailHog)
EMAIL_SMTP_USERNAME: str = env.str("EMAIL_SMTP_USERNAME", "")
EMAIL_SMTP_PASSWORD: str = env.str("EMAIL_SMTP_PASSWORD", "")

# Validate all required variables and seal (prevent further env reads)
env.seal()
