#!/bin/bash

# Function to handle cleanup on exit
cleanup() {
    echo "Shutting down containers..."
    docker-compose stop
    exit 0
}

# Register the cleanup function to run on script termination
trap cleanup SIGINT SIGTERM

# Clean up existing containers first
echo "Cleaning up any existing containers..."
docker rm -f projojo_typedb projojo_backend projojo_frontend 2>/dev/null || true

# Start all services
echo "Starting Projojo services with Docker Compose..."
docker-compose up -d

# Wait a moment for services to initialize
echo "Waiting for services to start..."
sleep 5

# Open browser to the frontend URL
echo "Opening browser..."
python -m webbrowser -t "http://localhost:5173" || xdg-open "http://localhost:5173" || open "http://localhost:5173" || start "http://localhost:5173"

# Show logs
echo "Showing logs (press Ctrl+C to stop)..."
docker-compose logs -f