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

### Accessing TypeDB Studio

As of TypeDB version 3.3.0, TypeDB Studio is a web-based application. Our project is already configured to use TypeDB v3.3.0.

To access TypeDB Studio:
1. Go to [studio.typedb.com/connect](https://studio.typedb.com/connect) in your web browser.
2. In the "Server Address" field, enter: `http://localhost:1728`
3. Click "Connect".

This will connect you to the TypeDB instance running in your local Docker container.

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

