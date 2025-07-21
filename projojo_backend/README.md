# Projojo Backend

The API will be available at http://localhost:8000

API documentation will be available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

FastAPI backend service for the Projojo application.

## Prerequisites

1. **[Docker & Docker Compose](https://www.docker.com/get-started/)**
2. **[Python 3.13](https://www.python.org/downloads/)** (optional - only needed for IDE support and dependency management)
3. **[uv](https://docs.astral.sh/uv/getting-started/installation/)** (optional - only needed for IDE support and dependency management)

## Development Setup

```bash
# Optional: Install dependencies locally for IDE support and dependency management
cd projojo_backend
uv sync  # Creates .venv (like npm install)

# Run with Docker (from project root)
docker compose up --build backend
```

## Dependency Management

### Adding Dependencies
```bash
# Production dependencies
uv add fastapi pandas redis

# Development dependencies
uv add --dev pytest black flake8
```

### Removing Dependencies
```bash
uv remove pandas redis
```

### After Adding/Removing Dependencies:
```bash
# Rebuild Docker to apply changes
docker compose up --build backend
```

### Upgrading Dependencies
To upgrade all dependencies in `uv.lock` to their latest compatible versions:
```bash
uv sync --upgrade
```

## Project Structure

- **`pyproject.toml`** - Project metadata and dependencies
- **`uv.lock`** - Lock file with exact versions
- **`requirements.txt`** - Legacy file (*can be removed*)
- **`.venv/`** - Virtual environment
