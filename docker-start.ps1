# Docker startup script for Windows PowerShell
# Run this script in PowerShell to start the Projojo services

# Function to handle cleanup on exit
function Cleanup {
    Write-Host "Shutting down containers..."
    docker-compose stop
    exit
}

# Register cleanup function for Ctrl+C
$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action { Cleanup }

# Clean up existing containers first
Write-Host "Cleaning up any existing containers..."
docker rm -f projojo_typedb projojo_backend projojo_frontend 2>$null

# Start all services
Write-Host "Starting Projojo services with Docker Compose..."
docker-compose up -d

# Wait a moment for services to initialize
Write-Host "Waiting for services to start..."
Start-Sleep -Seconds 5

# Open browser to the frontend URL
Write-Host "Opening browser..."
Start-Process "http://localhost:5173"

# Show logs
Write-Host "Showing logs (press Ctrl+C to stop)..."
docker-compose logs -f

# Note: When manually stopping with Ctrl+C, the cleanup function will execute