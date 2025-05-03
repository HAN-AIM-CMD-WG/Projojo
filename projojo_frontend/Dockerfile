FROM node:22-alpine

WORKDIR /app

# Copy and install dependencies only when needed
COPY package*.json ./
RUN npm install

# Document the port that will be exposed
EXPOSE 5173

# Run on container start
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]