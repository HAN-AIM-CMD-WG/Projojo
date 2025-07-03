FROM node:22-alpine AS base
WORKDIR /app

# Copy and install dependencies only when needed
COPY package*.json ./
RUN npm ci

# Development stage - expects volume mount for live reloading
FROM base AS development
EXPOSE 5173
# Print environment variables for debugging
RUN echo "=== F: DEVELOPMENT STAGE ENVIRONMENT ===" && env | grep -E "(VITE_|NODE_|FRONTEND_|BACKEND_)" | sort || true
CMD ["sh", "-c", "echo 'Starting development server...' && echo 'Environment:' && env | grep -E '(VITE_|NODE_|FRONTEND_|BACKEND_)' | sort && npm run dev -- --host 0.0.0.0"]

# Preview stage - copies source code and builds for production
FROM base AS preview
COPY . .
RUN npm run build
EXPOSE 4173
# Print environment variables for debugging
RUN echo "=== F: PREVIEW STAGE ENVIRONMENT ===" && env | grep -E "(VITE_|NODE_|FRONTEND_|BACKEND_)" | sort || true
CMD ["sh", "-c", "echo 'Starting preview server...' && echo 'Environment:' && env | grep -E '(VITE_|NODE_|FRONTEND_|BACKEND_)' | sort && npm run preview -- --host 0.0.0.0"]
