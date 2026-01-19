# Operation and Support

## Health Checks

### Backend Health

```bash
# Root endpoint
curl http://localhost:10103/
# Expected: {"message": "Welcome to Projojo Backend API"}

# TypeDB status (development only)
curl http://localhost:10103/typedb/status
# Expected: {"status": "connected", "database": "...", "server": "..."}
```

### Service Status

```bash
# Check running containers
docker compose ps

# Expected output:
# NAME               STATUS
# projojo_backend    Up
# projojo_frontend   Up
# projojo_typedb     Up
# projojo_mailhog    Up
```

## Logging

### Viewing Logs

```bash
# All services (follow mode)
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f typedb

# Last N lines
docker compose logs --tail 100 backend

# Since specific time
docker compose logs --since 1h backend
```

### Log Levels

Backend logging via uvicorn:
- Request/response headers (debug level)
- API errors and exceptions
- TypeDB connection status

### Log Locations

| Service | Log Location |
|---------|-------------|
| Backend | stdout (Docker logs) |
| Frontend | stdout (Docker logs) |
| TypeDB | stdout + internal logs |

## Monitoring

### Current State

Basic monitoring via Docker container health and logs. No formal monitoring infrastructure.

### TODO: Recommended Monitoring

- [ ] Application Performance Monitoring (APM)
- [ ] Error tracking (e.g., Sentry)
- [ ] Database query performance
- [ ] User analytics
- [ ] Uptime monitoring

## Common Operations

### Restarting Services

```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart backend

# Stop and start (clean restart)
docker compose down
docker compose up
```

### Updating Dependencies

```bash
# Backend
cd projojo_backend
uv add <package>          # Add new
uv sync --upgrade         # Upgrade all
docker compose up --build backend

# Frontend
cd projojo_frontend
npm install <package>     # Add new
npm update                # Upgrade
docker compose up --build frontend
```

### Database Operations

```bash
# Connect to TypeDB Studio
open http://localhost:10102

# View database via Docker
docker exec -it projojo_typedb bash

# Reset database
docker compose down
docker volume rm projojo_typedb-data
docker compose up
```

### Viewing Emails

During development, all emails are captured by MailHog:

1. Open http://localhost:10106
2. View sent emails in web interface
3. No real emails are sent

## Troubleshooting Guide

### Backend Issues

**API returns 500 errors**:
```bash
# Check backend logs
docker compose logs backend

# Common causes:
# - TypeDB connection failed
# - Missing environment variables
# - Database query errors
```

**Authentication failures**:
```bash
# Check OAuth configuration
# 1. Verify .env has correct credentials
# 2. Verify callback URLs in OAuth provider
# 3. Check backend logs for OAuth errors
```

**TypeDB connection errors**:
```bash
# Check TypeDB is running
docker compose ps typedb

# Check TypeDB logs
docker compose logs typedb

# TypeDB may take 30-60s to start
# Wait and retry
```

### Frontend Issues

**Page not loading**:
```bash
# Check frontend is running
docker compose ps frontend

# Check Vite dev server logs
docker compose logs frontend

# Verify environment variables
docker compose exec frontend env | grep VITE
```

**API calls failing**:
```bash
# Check browser console for CORS errors
# Verify VITE_BACKEND_PORT matches backend

# Check network tab for actual requests
# Verify backend is reachable
curl http://localhost:10103/
```

### Docker Issues

**Container won't start**:
```bash
# Check for port conflicts
lsof -i :10103

# Rebuild images
docker compose build --no-cache

# Remove and recreate
docker compose down
docker compose up --build
```

**Out of disk space**:
```bash
# Clean unused Docker resources
docker system prune -a

# Clean volumes (DELETES DATA)
docker volume prune
```

**Permission issues on volumes**:
```bash
# Check file ownership
ls -la projojo_backend/

# Fix permissions if needed
sudo chown -R $USER:$USER projojo_backend/
```

## Runbooks

### Runbook: Deploy Update

1. Pull latest code:
   ```bash
   git pull origin main
   ```

2. Check for dependency changes:
   ```bash
   git diff HEAD~1 -- projojo_backend/pyproject.toml
   git diff HEAD~1 -- projojo_frontend/package.json
   ```

3. Rebuild if dependencies changed:
   ```bash
   docker compose up --build
   ```

4. Verify services are healthy:
   ```bash
   docker compose ps
   curl http://localhost:10103/
   ```

### Runbook: Reset Development Environment

1. Stop all containers:
   ```bash
   docker compose down
   ```

2. Remove volumes (optional - loses database):
   ```bash
   docker volume rm projojo_typedb-data
   ```

3. Remove node_modules and .venv (optional):
   ```bash
   rm -rf projojo_frontend/node_modules
   rm -rf projojo_backend/.venv
   ```

4. Rebuild and start:
   ```bash
   docker compose up --build
   ```

### Runbook: Investigate Slow Performance

1. Check container resource usage:
   ```bash
   docker stats
   ```

2. Check TypeDB query performance:
   - Open TypeDB Studio (localhost:10102)
   - Run problematic queries
   - Check query execution time

3. Check backend logs for slow requests:
   ```bash
   docker compose logs backend | grep -i slow
   ```

4. Check browser DevTools:
   - Network tab for slow API calls
   - Performance tab for rendering issues

## Support Contacts

- **Repository**: https://github.com/HAN-AIM-CMD-WG/Projojo
- **Issues**: https://github.com/HAN-AIM-CMD-WG/Projojo/issues
