FROM node:22-alpine

WORKDIR /app

# Install dependencies only when needed
COPY package*.json ./
RUN npm install

# Note: This doesn't actually expose the port, only documents it.
# The port must be published in docker-compose.yml via the "ports" section.
EXPOSE 5173

# Start the development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]