# Environment Variables Setup

This project now uses a dual environment file approach to separate secret and non-secret configuration:

## File Structure

### `settings.env` (Version Controlled)
- Contains all non-secret environment variables
- Safe to commit to git repository
- Used for ports, service names, application settings, etc.
- Will be read by Coolify for base configuration

### `.env` (Secrets Only)
- Contains only secret/sensitive environment variables
- **Never committed to git** (listed in .gitignore)
- Used for passwords, API keys, JWT secrets, etc.
- In production, these should be set via Coolify's Environment Variables UI

## Usage

### Local Development
Both files are used automatically by Docker Compose:
```bash
docker compose up
```

### Production/Coolify Deployment
1. `settings.env` provides base configuration from the repository
2. Secrets are set through Coolify's Environment Variables UI
3. Coolify will override any variables set in both places (UI takes precedence)

## Variable Precedence
Docker Compose follows this order (highest to lowest priority):
1. Environment variables set in shell
2. Variables in `environment` section of docker-compose.yml
3. Variables from `env_file` (`.env` overrides `settings.env`)
4. Variables from default `.env` file
5. Variables in Dockerfile `ENV` directive

## Adding New Variables

### Non-Secret Variables
Add to `settings.env` and commit to repository.

### Secret Variables
- **Local development**: Add to `.env`
- **Production**: Set via Coolify's Environment Variables UI

## Migration Notes
- Original `.env` content was split between `settings.env` and `.env`
- All services now use both files via `env_file` directive
- Frontend `VITE_*` variables remain in `settings.env` (non-secret)
- Only passwords and sensitive data remain in `.env`