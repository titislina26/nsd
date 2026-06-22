# Stage 1: Build the React frontend
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Create runtime server container
FROM node:18-alpine
WORKDIR /app/server

# Copy server package and install dependencies
COPY server/package*.json ./
RUN npm install

# Copy server code
COPY server/ .

# Ensure data and uploads folders exist
RUN mkdir -p data uploads

# Copy built frontend assets from stage 1
COPY --from=builder /app/dist /app/dist

# Environment variables
ENV PORT=3001
ENV NODE_ENV=production

# Expose backend port
EXPOSE 3001

# Command to start the application
CMD ["node", "index.js"]
