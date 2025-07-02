# Deployment Architecture

This document explains the Docker, deployment, and environment variable architecture for the Projojo application.

## Architecture Components

### 1. Multi-Stage Dockerfiles

Both frontend and backend use multi-stage Dockerfiles with two targets:

- **`development`**: Volume mounts for live reloading, development-optimized commands
- **`preview`**: Source code copied into containers, production-optimized commands

### 2. Docker Compose Strategy

We use Docker Compose file composition to handle different environments:

- **`docker-compose.yml`**: Base configuration for local development
- **`docker-compose.prod.yml`**: Production overrides for Coolify deployment

To make sure the overrides are applied, set in Coolify: `COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml`

### 3. Environment Variable Hierarchy

#### Local Development
```
.env (secrets) → settings.env (non-secrets) → docker-compose.yml
```

#### Production (Coolify)
```
Coolify UI Variables → settings.env → docker-compose.yml:docker-compose.prod.yml
```

## Environment Files

### settings.env
Contains **non-secret** configuration shared between environments:
- Port mappings
- Service hostnames
- Default database settings
- Frontend variables (prefixed with `VITE_`)

### .env (Local Only)
Contains **secrets** for local development:
- Database passwords
- API keys
- Other sensitive configuration

**Note**: `.env` is excluded from production builds for security. It is also not tracked by Git.

### Coolify Environment Variables
Set directly in Coolify UI for production:
- `TYPEDB_NEW_PASSWORD`: Production database password
- `COMPOSE_FILE`: Specifies compose file composition
- Any other production-specific secrets

## Service Configuration

### TypeDB Database
- **Development**: Uses password from `.env` file
- **Production**: Uses password from Coolify environment variable
- Database initialization handled by `projojo_backend/db/initDatabase.py`

### Backend (FastAPI)
- **Development**: 
  - Volume mounted source code
  - Uvicorn with reload enabled
  - Python cache volumes prevented from mounting
- **Production**:
  - Source code copied into container
  - Uvicorn with multiple workers, optimized logging
  - No volume mounts

### Frontend (Vite/React)
- **Development**:
  - Volume mounted source code
  - Vite dev server with hot reloading (port 5173)
  - Node modules volume prevented from mounting
- **Production**:
  - Source code copied and built
  - Vite preview server (port 4173)
  - No volume mounts

## Deployment Workflows

### Local Development
```bash
# Uses development targets with volume mounts and .env secrets
docker compose up
```
or (if you've made changes that require a rebuild of the containers):
```bash
docker compose down; docker compose build && docker compose up
```

### Production (Coolify)
1. Set environment variables in Coolify UI:
   - `COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml`
   - `TYPEDB_NEW_PASSWORD=your_production_password`
2. Coolify automatically uses both compose files
3. Builds preview targets with copied source code
4. No local secrets included

## Volume Strategy

### Development Volumes
- **Source code**: Volume mounted for live reloading
- **Node modules**: Anonymous volume prevents host conflicts
- **Python cache**: Anonymous volume prevents platform/version conflicts

### Production Volumes
- **No source volumes**: Code copied into container for immutability
- **Persistent data only**: TypeDB data volume for database persistence

## Port Configuration

| Service | Development | Production | Notes |
|---------|-------------|------------|-------|
| Frontend | 5173 | 4173 | Vite dev vs preview server |
| Backend | 8000 | 8000 | Same port, different uvicorn config |
| TypeDB | 1729 | 1729 | Database port |
| TypeDB Studio | 8000 | 8000 | Admin interface |

## Troubleshooting

### Development Issues
- Ensure `.env` file exists with required secrets
- Check volume mounts are working (changes should reflect immediately)
- Verify ports are not conflicting with other services
- Check environment debug output in container logs

### Production Issues
- Verify Coolify environment variables are set correctly
- Check that `COMPOSE_FILE` variable includes both files
- Ensure production secrets are configured in Coolify UI
- Confirm preview targets build successfully
- Review environment debug output for missing variables

### Platform Compatibility Issues
- **Python cache conflicts**: Anonymous volumes prevent host `__pycache__` mounting
- **Node modules conflicts**: Anonymous volumes prevent host `node_modules` mounting
- **Architecture differences**: ARM (M1 Mac) vs x86_64 (Linux containers)

## Best Practices

1. **Environment Separation**: Keep secrets in appropriate environment files
2. **Immutable Production**: Use copied source code, not volume mounts
3. **Development Efficiency**: Use volume mounts and reload for fast iteration
4. **Security**: Never commit `.env` files, use Coolify UI for production secrets
5. **Debugging**: Use environment variable output to troubleshoot configuration issues