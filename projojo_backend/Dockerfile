FROM python:3.13-slim

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# System dependencies needed for typedb-driver native extensions
# - build-essential: Provides compilers and build tools for C/C++ extension compilation
# - libpython3-dev: Provides Python C API headers needed for Python extensions
# - Cleanup to reduce image size by removing package indexes (not needed after installation)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpython3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy uv dependency files
COPY pyproject.toml uv.lock README.md ./

# Install the application dependencies.
RUN uv sync --frozen --no-cache

# Copy application code
COPY . .

# Document the port that will be exposed
EXPOSE 8000

# Run on container start using uv run (manages the virtual environment automatically)
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]