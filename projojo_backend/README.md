# Projojo Backend

The API will be available at http://localhost:8000

API documentation will be available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

FastAPI backend service for the Projojo application.

## Prerequisites

1. **Python 3.13** is required
2. **uv** package manager
3. **Docker & Docker Compose** (for containerized development)

## Installing uv

```bash
# On macOS and Linux.
curl -LsSf https://astral.sh/uv/install.sh | sh
```
```powershell
# On Windows.
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

After installation, restart your shell or add uv to PATH for the current session:
- **Windows**: `$env:Path = "C:\Users\$env:USERNAME\.local\bin;$env:Path"`
- **macOS/Linux**: `export PATH="$HOME/.local/bin:$PATH"`

## Development Setup

```bash
cd projojo_backend
uv sync  # Creates .venv and installs all dependencies (like npm install)

# Run locally
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Or run with Docker (from project root)
docker-compose up --build backend
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
**Rebuild Docker:** `docker compose up --build backend`

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

## Cross-Platform Notes

- **Windows**: `uvloop` is automatically excluded (not supported)
- **macOS/Linux**: `uvloop` provides performance benefits
- **Docker**: Always uses Linux environment with optimal dependencies
