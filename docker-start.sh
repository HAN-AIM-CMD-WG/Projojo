#!/bin/bash

# Docker Startup Script for Projojo (Bash for macOS/Linux)
#
# Description:
# This script manages the Projojo Docker containers. It can start the services,
# and optionally, reset them by removing existing containers/volumes and rebuilding images.
#
# Usage:
#   ./docker-start.sh
#     Starts the Docker containers if they are not running, or creates them if they don't exist.
#     Uses existing images.
#
#   ./docker-start.sh reset
#   ./docker-start.sh -reset
#     Stops and removes all containers, networks, and named volumes associated with this
#     project (defined in docker-compose.yml). Then, rebuilds the images from their
#     Dockerfiles (re-running package installations) and starts the services.
#     This does NOT affect other Docker containers or volumes outside of this project.
#
# Behavior:
# - Starts services in detached mode.
# - Opens the default web browser to http://localhost:5173 after a short delay.
# - Streams the last 20 logs and then follows new logs from 'backend' and 'frontend'.
# - Pressing Ctrl+C while logs are streaming will stop the log stream but will NOT
#   stop the running containers. Containers should be managed via Docker Desktop or
#   other Docker CLI commands (e.g., 'docker compose stop').

RESET_ARG=""
if [[ "$1" == "reset" || "$1" == "-reset" ]]; then
  RESET_ARG="reset"
fi

if [[ "$RESET_ARG" == "reset" ]]; then
  echo "Resetting Projojo services..."
  echo "Stopping and removing existing project containers, networks, and volumes..."
  docker compose down --volumes # This is scoped to the current docker-compose.yml project
  echo "Building images and starting Projojo services..."
  docker compose up -d --build
else
  echo "Starting Projojo services..."
  docker compose up -d
fi

echo "Allowing a few seconds for services to initialize..."
sleep 5

# Attempt to open browser - works on macOS, may work on some Linux distros
# If not, user can manually open http://localhost:5173
URL="http://localhost:5173"
echo "Attempting to open browser to $URL..."
if command -v xdg-open &> /dev/null; then
  xdg-open "$URL"
elif command -v open &> /dev/null; then
  open "$URL"
else
  echo "Could not detect 'xdg-open' or 'open'. Please open $URL in your browser manually."
fi

# Show logs for backend and frontend services
echo "Showing logs for backend and frontend services (press Ctrl+C to stop log streaming)..."
docker compose logs -f backend frontend --tail 20
