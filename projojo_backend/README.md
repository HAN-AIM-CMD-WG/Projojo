# Projojo Backend

The API will be available at http://localhost:8000

API documentation will be available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

FastAPI backend service for the Projojo application.

## Development Setup

## Prerequisites

1. **[Docker & Docker Compose](https://www.docker.com/get-started/)**
2. **[Python 3.13](https://www.python.org/downloads/)** (optional - only needed for IDE support and dependency management)
3. **[uv](https://docs.astral.sh/uv/getting-started/installation/)** (optional - only needed for IDE support and dependency management)

## Quick Start
```bash
# Optional: Install dependencies locally for IDE support and dependency management
cd projojo_backend
uv sync

# Run with Docker (from project root)
docker compose up backend
```

## Dependency Management

All commands below should be run locally, not inside the Docker container. This ensures dependency changes are immediately available for version control.

### Adding Dependencies
```bash
# Production dependencies
uv add fastapi pandas redis

# Development dependencies
uv add pytest black flake8 --dev

# Rebuild Docker to apply changes
docker compose up --build backend
```

### Removing Dependencies
```bash
# Production dependencies
uv remove pandas redis

# Development dependencies
uv remove pytest black flake8 --dev

# Rebuild Docker to apply changes
docker compose up --build backend
```

### Upgrading Dependencies
To upgrade all dependencies to their latest compatible versions, use:
```bash
uv sync --upgrade
```

## Project Structure

- **`pyproject.toml`** - Project metadata and dependencies
- **`uv.lock`** - Lock file with exact versions
- **`.venv/`** - Virtual environment
