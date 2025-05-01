FROM python:3.13-slim

WORKDIR /app

# System dependencies needed for typedb-driver native extensions
# - build-essential: Provides compilers and build tools for C/C++ extension compilation
# - libpython3-dev: Provides Python C API headers needed for Python extensions
# - Cleanup to reduce image size by removing package indexes (not needed after installation)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpython3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Document the port that will be exposed
EXPOSE 8000

# Start the application directly using uvicorn command (more efficient than running `python main.py`)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
