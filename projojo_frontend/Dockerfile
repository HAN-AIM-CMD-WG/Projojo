FROM node:22-alpine

WORKDIR /app

# Install dependencies only when needed
COPY package*.json ./
RUN npm install

# Document the port that will be exposed
EXPOSE 5173

# Start the development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]