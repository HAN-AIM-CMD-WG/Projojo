# This is the Dockerifile for the Projojo backend service.

FROM python:3.13-bullseye AS base

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

# Development stage - expects volume mount for live reloading
FROM base AS development
EXPOSE ${BACKEND_PORT}
# Print environment variables for debugging
RUN echo "=== B: DEVELOPMENT STAGE ENVIRONMENT ===" && env | sort || true
CMD ["sh", "-c", "echo 'B: Starting development server...' && echo 'Environment:' && env | sort && uv run uvicorn main:app --host 0.0.0.0 --port ${BACKEND_PORT} --reload --log-level debug"]

# Preview stage - copies source code for production
FROM base AS preview
COPY . .
EXPOSE ${BACKEND_PORT}
# Print environment variables for debugging
RUN echo "=== B: PREVIEW STAGE ENVIRONMENT ===" && env | sort || true
# --proxy-headers: Trust X-Forwarded-Proto header from Traefik for HTTPS detection
# --forwarded-allow-ips "*": Allow proxy headers from any IP (Traefik runs in Docker network)
CMD ["sh", "-c", "echo 'B: Starting production server...' && env | sort && uv run uvicorn main:app --host 0.0.0.0 --port ${BACKEND_PORT} --proxy-headers --forwarded-allow-ips '*' --log-level info"]

