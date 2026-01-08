# Projojo

A full-stack application with a Python backend, React frontend, and TypeDB database.

## Documentation

- **[Software Guidebook]()** - [NOT MADE YET] Architecture, code patterns, data model
- **[Deployment Infrastructure](./docs/DEPLOYMENT_INFRASTRUCTURE.md)** - Docker setup, ports, environments
- **[OAuth Setup Guide](./projojo_backend/auth/README.md)**

## Prerequisites

* Docker / Docker Desktop installed
* OAuth credentials configured (see [OAuth Setup Guide](./projojo_backend/auth/README.md))

That's it! No direct Node.js or Python installation required as everything runs in containers.

## Development with Docker

### Quick Start

> **First time setup?** Make sure to configure your OAuth credentials first!
> See the [OAuth Setup Guide](./projojo_backend/auth/README.md) for instructions on obtaining Google and GitHub OAuth credentials.

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
1. Start all services with Docker Compose (use `-reset` to clean up first)
2. Wait for services to initialize
3. Open your browser to http://localhost:10101
4. Display container logs for backend and frontend

The `-reset` flag will completely reset all containers (including volumes) for when you want a fresh start. i.e. when the image versions change or you want to clear all data.

### Docker Services

| Service | Container Name | Description | Host Port |
|---------|---------------|-------------|-----------|
| **Frontend** | projojo_frontend | Vite/React application | 10101 |
| **Backend** | projojo_backend | FastAPI application | 10102 |
| **TypeDB** | projojo_typedb | TypeDB database server | 10103 |
| | | TypeDB Studio | 10104 |
| **MailHog** | projojo_mailhog | Email testing (SMTP) | 10105 |
| | | Email testing (Web UI) | 10106 |

> **Note**: Ports use the 10101+ range to avoid conflicts with macOS AirPlay (5000, 7000) and common dev tools.
> See [Deployment Infrastructure](./docs/DEPLOYMENT_INFRASTRUCTURE.md) for details.

### Accessing TypeDB Studio

TypeDB Studio is an external web application (TypeDB v3.4.0+).

To access TypeDB Studio:
1. Go to [studio.typedb.com](https://studio.typedb.com)
2. In the "Address" field, enter: `localhost:10104`
3. Enter credentials: username `admin`, password from your `.env` file (`TYPEDB_NEW_PASSWORD`)
4. Click "Connect"

### Managing the Database

To reset the TypeDB database and start fresh, you can use the `-reset` flag with the `docker-start` scripts shown at [quick start](#quick-start), or manually run the following commands:

```bash
# Stop all containers
docker compose down

# Remove the volume
docker volume rm projojo_typedb-data

# Start everything back up
docker compose up -d
```

### Development Workflow

1. **Code Changes**: Edit files in your IDE as normal
   - Frontend changes use HMR (Hot Module Replacement) to update in real-time
   - Backend changes trigger automatic reload via the --reload flag in uvicorn

2. **Container Management**:
   - View logs: `docker compose logs -f`
   - Rebuild after dependency changes: `docker compose up --build -d [service_name]`

3. **Debugging**:
   - Frontend: Browser developer tools
   - Backend: View logs with `docker compose logs -f backend`

### Frontend Dependencies Management

When adding or updating frontend packages:

#### Method 1: Rebuild after package.json changes
```bash
# After manually editing package.json
docker compose build frontend
docker compose up -d frontend
```

#### Method 2: Install inside the container
```bash
# Access frontend container shell
docker compose exec frontend sh

# Install packages
npm install package-name --save         # For runtime dependencies
npm install package-name --save-dev     # For dev dependencies

# Exit container
exit
```
> **Note:** When you install packages directly in the container (Method 2), your `package.json` changes **will persist** because it's part of the volume-mounted directory. Git will track these dependency changes. However, the `node_modules` folder uses an anonymous Docker volume that stays isolated in the container and does not sync to your host machine.

### Backend Dependencies Management

The backend uses **uv** for modern Python dependency management. Think of uv as npm, but for Python:
- `pyproject.toml` ≈ `package.json`
- `uv.lock` ≈ `package-lock.json`
- `uv add <dependency>` ≈ `npm install <dependency>`
- `uv sync` ≈ `npm ci`

For the complete documentation on backend dependency management, see the [backend README](./projojo_backend/README.md#dependency-management).

### Troubleshooting

If HMR stops working or the frontend container's CPU usage drops significantly:
1. Restart the frontend container: `docker compose restart frontend`
2. If the issue persists, try rebuilding: `docker compose build --no-cache frontend`

For TypeDB connection issues:
1. Ensure the TypeDB container is running: `docker ps`
2. Check backend logs: `docker compose logs backend`

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
   - Restarting the containers: `docker compose restart`
   - In extreme cases, restart Docker Desktop completely
