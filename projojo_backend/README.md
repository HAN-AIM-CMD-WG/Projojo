# Projojo Backend

The API will be available at http://localhost:8000

API documentation will be available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

FastAPI backend service for the Projojo application.

# Development Setup

## Prerequisites

1. **[Docker & Docker Compose](https://www.docker.com/get-started/)**
2. optional: **[Python 3.13](https://www.python.org/downloads/)**
3. optional: **[uv](https://docs.astral.sh/uv/getting-started/installation/)**

> **uv** and **python** are only needed for IDE support and dependency management

## Quick Start
```bash
# Run with Docker (from project root)
docker compose up backend

# Optional: Install dependencies locally for IDE support and dependency management
cd projojo_backend
uv sync
# Optional: Run backend locally (requires Python and uv installed)
uv run python main.py
```
> [!IMPORTANT] Windows Compatibility Notice
> **Dependency management** with uv **should work just fine** (installing, adding, removing packages). However, the TypeDB driver currently has **compatibility issues** on Windows due to missing native binaries for Python 3.13. Local development with `uv run python main.py` may fail with import errors.
>
> Windows users should use Docker for development or **switch to WSL2** (Windows Subsystem for Linux). **Docker works perfectly fine** as it runs a Linux environment and downloads the necessary native dependencies on the first run.

## What is uv?

uv is a fast Python tool for dependency management and virtual environments. Think of it as npm, but for Python:
- `pyproject.toml` ≈ `package.json` (project metadata and dependencies)
- `uv.lock` ≈ `package-lock.json` (exact versions for reproducible installs)
- `uv add <dependency>` ≈ `npm install <dependency>`
- `uv sync` ≈ `npm ci` (install exact versions from lock file)

More info: https://docs.astral.sh/uv/

## Dependency Management

All commands below should be run locally, not inside the Docker container. This ensures dependency changes are immediately available for version control.

> **Important:** When you change dependencies, always rebuild your Docker container so the changes are applied: `docker compose up --build backend`

### Getting Started with Existing Project
```bash
# Install/sync dependencies according to pyproject.toml and uv.lock
uv sync
```

### Adding Dependencies
```bash
# Production dependencies
uv add <dependency> [<dependency2> ...]
uv add fastapi pandas redis

# Development dependencies
uv add pytest black flake8 --dev

# Rebuild Docker to apply changes
docker compose up --build backend
```

### Removing Dependencies
```bash
# Production dependencies
uv remove <dependency> [<dependency2> ...]
uv remove pandas redis

# Development dependencies
uv remove black flake8 --dev

# Rebuild Docker to apply changes
docker compose up --build backend
```

### Upgrading Dependencies
```bash
# Upgrade all dependencies to latest compatible versions
uv sync --upgrade

# Upgrade specific dependency
uv add <dependency> --upgrade

# Rebuild Docker to apply changes
docker compose up --build backend
```

### Running Commands
You can run Python commands through uv without manually activating the virtual environment:
```bash
# Run Python scripts
uv run python main.py
uv run python --version
```

Or activate the virtual environment manually
```bash
# Windows (PowerShell)
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

# Deactivate when done
deactivate
```

## Project Structure

- **`pyproject.toml`** - Project metadata and dependencies
- **`uv.lock`** - Lock file with exact versions
- **`.venv/`** - Virtual environment
