# This is the Dockerfile for the Projojo frontend service.

FROM node:22-alpine AS base
WORKDIR /app

# Copy and install dependencies only when needed
COPY package*.json ./
RUN npm ci

# Development stage - expects volume mount for live reloading
FROM base AS development
EXPOSE 5173
# Print environment variables for debugging
RUN echo "=== F: DEVELOPMENT STAGE ENVIRONMENT ===" && env | sort || true
CMD ["sh", "-c", "echo 'F: Starting development server...' && echo 'Environment:' && env | sort && npm run dev -- --host 0.0.0.0"]

# Preview stage - copies source code and builds for production
FROM base AS preview
ARG VITE_BACKEND_HOST
ARG VITE_BACKEND_PORT
ENV VITE_BACKEND_HOST=${VITE_BACKEND_HOST}
ENV VITE_BACKEND_PORT=${VITE_BACKEND_PORT}
RUN echo "=== F: PREVIEW STAGE ENVIRONMENT ===" && env | sort || true
COPY . .
RUN npm run build
EXPOSE 4173
# Print environment variables for debugging
CMD ["sh", "-c", "echo 'F: Starting preview server...' && echo 'Environment:' && env | sort && npm run preview -- --host 0.0.0.0"]
