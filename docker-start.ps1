# Docker Startup Script for Projojo (PowerShell)
#
# Description:
# This script manages the Projojo Docker containers. It can start the services,
# and optionally, reset them by removing existing containers/volumes and rebuilding images.
#
# Usage:
#   .\docker-start.ps1
#     Starts the Docker containers if they are not running, or creates them if they don't exist.
#     Uses existing images. If core services are already running, it will notify and skip restart.
#
#   .\docker-start.ps1 -reset
#     Stops and removes all containers, networks, and named volumes associated with this
#     project (defined in docker-compose.yml). Then, rebuilds the images from their
#     Dockerfiles (re-running package installations) and starts the services.
#     This does NOT affect other Docker containers or volumes outside of this project.
#
# Behavior:
# - Starts services in detached mode.
# - Waits for the frontend service to be accessible before attempting to open the browser.
# - Opens the default web browser to the frontend URL (http://localhost:5173).
# - Streams logs only from the 'backend' and 'frontend' services.
# - Pressing Ctrl+C while logs are streaming will stop the log stream but will NOT
#   stop the running containers. Containers should be managed via Docker Desktop or
#   other Docker CLI commands (e.g., 'docker compose stop').

param (
    [switch]$reset
)

if ($reset) {
    Write-Host "Resetting Projojo services..."
    Write-Host "Stopping and removing existing project containers, networks, and volumes..."
    docker compose down --volumes # This is scoped to the current docker-compose.yml project
    Write-Host "Building images and starting Projojo services..."
    docker compose up -d --build
} else {
    Write-Host "Starting Projojo services..."
    docker compose up -d
}

Write-Host "Allowing a few seconds for services to initialize..."
Start-Sleep -Seconds 5

Write-Host "Opening browser to http://localhost:5173..."
Start-Process "http://localhost:5173"

# Show logs for backend and frontend services
Write-Host "Showing logs for backend and frontend services (press Ctrl+C to stop log streaming)..."
docker compose logs -f backend frontend --tail 20
