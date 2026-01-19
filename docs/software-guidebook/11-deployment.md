# Deployment

## Deployment Environments

| Environment | Method | URL |
|-------------|--------|-----|
| Development | Docker Compose (local) | localhost |
| Preview/Demo | Dokploy | https://projojo.dp.demopreview.nl/ |
| Production | TODO | TBD |

## Local Development Setup

### Prerequisites

1. **Docker and Docker Compose**: [Install Docker](https://www.docker.com/get-started/)
2. **OAuth Credentials**: Follow [OAuth Setup Guide](../../projojo_backend/auth/README.md)
3. **Optional**: Python 3.13 and uv (for IDE support)
4. **Optional**: Node.js (for frontend tooling outside Docker)

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/HAN-AIM-CMD-WG/Projojo.git
cd Projojo

# 2. Copy environment template
cp .env.example .env

# 3. Configure OAuth credentials in .env
# (See OAuth Setup Guide)

# 4. Start all services
docker compose up

# Or start specific services
docker compose up backend
docker compose up frontend
```

### Access Points

After starting:
- **Frontend**: http://localhost:10104
- **Backend API**: http://localhost:10103
- **API Docs**: http://localhost:10103/docs
- **TypeDB Studio**: http://localhost:10102
- **MailHog**: http://localhost:10106

## Docker Build Process

### Multi-Stage Builds

Both frontend and backend use multi-stage Dockerfiles:

#### Backend Dockerfile

```dockerfile
# Stage 1: Base with dependencies
FROM python:3.13-slim AS base
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN pip install uv && uv sync

# Stage 2: Development (with live reload)
FROM base AS development
COPY . .
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--reload"]

# Stage 3: Production
FROM base AS production
COPY . .
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0"]
```

#### Frontend Dockerfile

```dockerfile
# Development: Vite dev server with HMR
# Production: Nginx serving built static files
```

### Build Commands

```bash
# Rebuild with changes
docker compose up --build

# Rebuild specific service
docker compose up --build backend

# Force complete rebuild
docker compose build --no-cache
```

## Dependency Management

### Backend (Python/uv)

```bash
# Install dependencies locally (for IDE support)
cd projojo_backend
uv sync

# Add dependency
uv add <package>

# Add dev dependency
uv add <package> --dev

# After changes, rebuild Docker
docker compose up --build backend
```

### Frontend (npm)

```bash
# Install dependencies locally
cd projojo_frontend
npm install

# Add dependency
npm install <package>

# After changes, rebuild Docker
docker compose up --build frontend
```

## Running Tests

### Backend Tests

```bash
# Option 1: Via Docker exec
docker exec -it projojo_backend bash
uv run pytest -v

# Option 2: Locally (requires uv)
cd projojo_backend
uv run pytest -v
```

### Frontend Tests

```bash
# Storybook tests
cd projojo_frontend
npm run storybook          # Start Storybook
npm run test-storybook     # Run visual tests
```

## Preview/Staging Deployment

### Dokploy

The preview environment uses Dokploy with `docker-compose.preview.yml`:

```bash
# Preview uses different compose file
docker compose -f docker-compose.preview.yml up
```

Key differences from development:
- Auto-generated container names (avoids conflicts)
- No volume mounts (code built into images)
- Production build targets
- Isolated network per deployment

### Preview URL

- https://projojo.dp.demopreview.nl/

## Production Deployment

### TODO: Production Checklist

- [ ] Configure production CORS settings (restrict origins)
- [ ] Set up production SMTP service
- [ ] Configure proper secrets management
- [ ] Set up SSL/TLS certificates
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Database backup strategy
- [ ] Health check endpoints

### Environment Variables for Production

```bash
# Security (generate strong random values)
SESSIONS_SECRET_KEY=<generate-strong-key>
JWT_SECRET_KEY=<generate-strong-key>

# OAuth (production callback URLs)
# Update redirect URIs in OAuth provider consoles

# Restrict CORS
# Update CORSMiddleware in main.py
```

## Deployment Workflow

### Development Flow

```
1. git pull
2. docker compose up
3. Make changes (live reload)
4. Run tests
5. Commit and push
```

### Release Flow

```
1. Merge to main branch
2. Dokploy detects changes
3. Automatic build and deploy to preview
4. Manual verification
5. (Future) Deploy to production
```

## Troubleshooting

### Common Issues

**TypeDB won't start on Windows**:
- Use Docker (WSL2 backend recommended)
- Or use WSL2 directly

**Port conflicts**:
- Check if ports 10101-10106 are free
- Modify ports in `.env` if needed

**OAuth not working**:
- Verify callback URLs match OAuth provider configuration
- Check `.env` credentials are correct
- Save a Python file to trigger reload after `.env` changes

**Database connection errors**:
- Wait for TypeDB to fully start (can take 30-60 seconds)
- Check TypeDB logs: `docker compose logs typedb`

### Viewing Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend

# Last N lines
docker compose logs --tail 100 backend
```

### Resetting Database

```bash
# Stop services
docker compose down

# Remove database volume
docker volume rm projojo_typedb-data

# Restart (will recreate database)
docker compose up
```
