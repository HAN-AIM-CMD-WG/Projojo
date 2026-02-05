# This is the Dockerfile for the Projojo frontend service.
#
# Port Configuration:
# - FRONTEND_PORT is passed via environment variable from docker-compose
# - Vite reads this in vite.config.ts to listen on the correct port
# - This allows the same port inside and outside the container (e.g., 10101)

FROM node:22-alpine AS base
WORKDIR /app

# Copy and install dependencies only when needed
COPY package*.json ./
RUN npm i

# Development stage - expects volume mount for live reloading
FROM base AS development
# FRONTEND_PORT is set via env_file in docker-compose
# Vite will read it from process.env and listen on that port
# Print environment variables for debugging
RUN echo "=== F: DEVELOPMENT STAGE ENVIRONMENT ===" && env | sort || true
CMD ["sh", "-c", "echo 'F: Starting development server on port ${FRONTEND_PORT:-5173}...' && echo 'Environment:' && env | sort && npm run dev"]

# Preview stage - builds for production and serves with 'serve' package
# Uses 'serve' instead of Vite preview server to avoid host restriction issues
FROM base AS preview
ARG VITE_BACKEND_HOST
ARG VITE_BACKEND_PORT
ENV VITE_BACKEND_HOST=${VITE_BACKEND_HOST}
ENV VITE_BACKEND_PORT=${VITE_BACKEND_PORT}

# Install serve globally for serving static files
RUN npm install -g serve

# Copy source and build
COPY . .
RUN echo "=== F: PREVIEW STAGE BUILD ===" && env | sort || true
RUN npm run build

# Serve the built static files
# -s: Single-page app mode (redirects 404s to index.html for client-side routing)
# -l: Listen on specified port
CMD ["sh", "-c", "echo 'F: Serving static build on port ${FRONTEND_PORT:-10101}...' && serve -s dist -l ${FRONTEND_PORT:-10101}"]
