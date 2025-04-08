#!/bin/bash

# Check if typedb container is already running
echo "Checking if typedb Docker container is already running..."
if docker ps --filter "name=typedb" --format "{{.Names}}" | grep -q "typedb"; then
    TYPEDB_WAS_RUNNING=true
    echo "TypeDB container was already running."
else
    TYPEDB_WAS_RUNNING=false
    # Start the typedb Docker container
    echo "Starting typedb Docker container..."
    docker start typedb
    echo "TypeDB container started."

    # Wait for TypeDB to be ready
    echo "Waiting for TypeDB to be ready..."
    sleep 5  # Give TypeDB time to initialize
fi

# Start the backend server in the background
echo "Starting backend server..."
cd projojo_backend && python3 main.py &
BACKEND_PID=$!

# Start the frontend development server in the background
echo "Starting frontend server..."
cd projojo_frontend && npm run dev &
FRONTEND_PID=$!

# Wait for servers to start
echo "Waiting for servers to start..."
sleep 5

# Open the browser to the frontend URL
echo "Opening browser..."
python -m webbrowser -t "http://localhost:5173"

# Function to handle script termination
cleanup() {
    echo "Shutting down servers..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    
    # Only stop the typedb Docker container if it wasn't running before
    if [ "$TYPEDB_WAS_RUNNING" = false ]; then
        echo "Stopping typedb Docker container..."
        docker stop typedb
    else
        echo "Leaving typedb Docker container running as it was already running before script execution."
    fi
    
    exit 0
}

# Set up trap to catch termination signal
trap cleanup SIGINT SIGTERM

# Keep script running to maintain background processes
echo "Servers are running. Press Ctrl+C to stop."
wait
