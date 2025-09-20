# Projojo

A full-stack application with a Python backend, React frontend, and TypeDB database.

## Prerequisites

* Docker / Docker Desktop installed

That's it! No direct Node.js or Python installation required as everything runs in containers.

## Development with Docker

### Quick Start

For Windows (PowerShell):
```powershell
.\docker-start.ps1

# For a complete reset, use the -reset flag
.\docker-start.ps1 -reset
```

For Mac/Linux (Bash):
```shell
./docker-start.sh

# For a complete reset, use the -reset flag
./docker-start.sh -reset
```

These scripts will:
1. Clean up any existing containers
2. Start all services with Docker Compose
3. Open your browser to the frontend application
4. Display container logs in the terminal

The `-reset` flag will completely reset all containers (including volumes) for when you want a fresh start. i.e. when the image versions change or you want to clear all data.

### Docker Services

| Service      | Container Name   | Description            | Port |
| ------------ | ---------------- | ---------------------- | ---- |
| **TypeDB**   | projojo_typedb   | TypeDB database server | 1729 |
|              |                  | TypeDB Studio          | 1728 |
| **Backend**  | projojo_backend  | FastAPI application    | 8000 |
| **Frontend** | projojo_frontend | Vite/React application | 5173 |

### Accessing TypeDB Studio

As of TypeDB version 3.3.0, TypeDB Studio is a web-based application. Our project is already configured to use TypeDB v3.3.0.

To access TypeDB Studio:
1. Go to [studio.typedb.com/connect](https://studio.typedb.com/connect) in your web browser.
2. In the "Address" field, enter: `http://localhost:1728`
4. Click "Connect".

You can also switch to "**Use connection URL**" mode and enter: `typedb://admin:password@http://localhost:1728` to log in with the default credentials.

This will connect you to the TypeDB instance running in your local Docker container.

### Managing the Database

To reset the TypeDB database and start fresh, you can use the `-reset` flag with the `docker-start` scripts, or manually run the following commands:

```bash
# Stop all containers
docker-compose down

# Remove the volume
docker volume rm projojo_typedb-data

# Start everything back up
docker-compose up -d
```

### Development Workflow

1. **Code Changes**: Edit files in your IDE as normal
   - Frontend changes use HMR (Hot Module Replacement) to update in real-time
   - Backend changes trigger automatic reload via the --reload flag in uvicorn

2. **Container Management**:
   - View logs: `docker-compose logs -f`
   - Rebuild after dependency changes: `docker-compose build [service_name]`

3. **Debugging**:
   - Frontend: Browser developer tools
   - Backend: View logs with `docker-compose logs -f backend`

### Frontend Dependencies Management

When adding or updating frontend packages:

#### Method 1: Rebuild after package.json changes
```bash
# After manually editing package.json
docker-compose build frontend
docker-compose up -d frontend
```

#### Method 2: Install inside the container
```bash
# Access frontend container shell
docker-compose exec frontend sh

# Install packages
npm install package-name --save         # For runtime dependencies
npm install package-name --save-dev     # For dev dependencies

# Exit container
exit
```
> **Note:** When you install packages directly in the container (Method 2), your changes **will persist** after container restarts. The `package.json` file gets updated on both your host machine and in the container due to Docker volume mapping, so Git will track these dependency changes and you can commit them to version control. However, the `node_modules` folder uses an anonymous Docker volume, therefore this folder will not sync between your host machine and the container.

### Backend Dependencies Management

The backend uses **uv** for modern Python dependency management. Think of uv as npm, but for Python:
- `pyproject.toml` ≈ `package.json`
- `uv.lock` ≈ `package-lock.json`
- `uv add <dependency>` ≈ `npm install <dependency>`
- `uv sync` ≈ `npm ci`

**Quick Start:**
```bash
# Add a dependency locally
cd projojo_backend
uv add fastapi-users

# Apply to Docker
docker-compose up --build backend
```

For complete documentation on backend dependency management, see the [Backend README](./projojo_backend/README.md#dependency-management).

### Troubleshooting

If HMR stops working or the frontend container's CPU usage drops significantly:
1. Restart the frontend container: `docker-compose restart frontend`
2. If the issue persists, try rebuilding: `docker-compose build --no-cache frontend`

For TypeDB connection issues:
1. Ensure the TypeDB container is running: `docker ps`
2. Check backend logs: `docker-compose logs backend`

#### Windows-Docker File Synchronization Issues

For Windows systems, file synchronization between host and containers can be problematic:

1. Vite is already configured with polling in this project:
```javascript
// vite.config.ts
watch: {
  usePolling: true,  // Required for file changes to be detected in Docker on Windows
  interval: 250      // Polling interval in ms
}
```

2. If file changes are still not detected, try:
   - Restarting the containers: `docker-compose restart`
   - In extreme cases, restart Docker Desktop completely

## Legacy Setup (Not Recommended)

> Below is the legacy setup process, which is kept for reference but is not recommended for new developers. The Docker setup is preferred for its simplicity and ease of use.

To make this work, you need:
* a Mac or Linux shell. (Perhaps Git-Bash can run this on Windows? Or WSL?)
* Docker or Docker Desktop installed.
* Node 22 (or higher)
* Python 3.13 (or higher)

### Setting up the TypeDB Database

Use `./create_typedb.sh` to download the latest TypeDB as a container and set it up with a Docker volume called 'typedb-data':

```bash
# Basic setup - creates and configures the TypeDB container
./create_typedb.sh

# Reset volume - removes any existing data and creates a fresh volume in addition to a new container
./create_typedb.sh reset-volume
```

The script will:
1. Create a Docker volume for TypeDB data persistence (if needed or requested)
2. Pull the latest TypeDB Docker image
3. Create a TypeDB container with port 1729 exposed
4. Mount the data volume to maintain data between container restarts

The script is also useful to upgrade TypeDB to a higher version.
Use the `reset-volume` option when you need to clear all existing TypeDB data and start fresh.

### Running the project

Use `./start.sh` (Mac/Linux) to run the app. The script will:
1. The frontend server
2. The backend server
3. The TypeDB container.

A browser tab should open automatically.
