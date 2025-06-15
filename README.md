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
```

For Mac/Linux (Bash):
```bash
./docker-start.sh
```

These scripts will:
1. Clean up any existing containers
2. Start all services with Docker Compose
3. Open your browser to the frontend application
4. Display container logs in the terminal

### Docker Services

| Service      | Container Name   | Description            | Port |
| ------------ | ---------------- | ---------------------- | ---- |
| **TypeDB**   | projojo_typedb   | TypeDB database server | 1729 |
| **Backend**  | projojo_backend  | FastAPI application    | 8000 |
| **Frontend** | projojo_frontend | Vite/React application | 5173 |

### Managing the Database

To reset the TypeDB database and start fresh:

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
> Note: Changes made using Method 2 **will persist** because we're using Docker volumes. The package.json file is synchronized between your host and the container. However, only the frontend/package.json file will be updated, not frontend/node_modules (which is an anonymous volume).

### Backend Dependencies Management

When adding or updating Python packages:

#### Method 1: Rebuild after requirements.txt changes
```bash
# After manually editing requirements.txt
docker-compose build backend
docker-compose up -d backend
```

#### Method 2: Install inside the container
```bash
# Access backend container shell
docker-compose exec backend bash

# Install package
pip install package-name

# Update requirements.txt
pip freeze > requirements.txt

# Exit container
exit
```
> Note: Changes made using Method 2 **will persist** because we're using Docker volumes. The requirements.txt file is synchronized between your host and the container through the volume mapping in docker-compose.yml.

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

Below is the legacy setup process, which is kept for reference but is not recommended for new developers. The Docker setup is preferred for its simplicity and ease of use.

<!-- Legacy readme -->
## Projojo

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
2. Pull the TypeDB Docker image
3. Create a TypeDB container with port 1729 exposed
4. Mount the data volume to maintain data between container restarts

Use the `reset-volume` option when you need to clear all existing TypeDB data and start fresh.

### Running the project

Use `./start.sh` (Mac/Linux) to run the app. The script will: 
1. The frontend server
2. The backend server
3. The TypeDB container.

A browser tab should open automatically.
