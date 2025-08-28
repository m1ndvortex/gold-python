# Development stage
FROM node:18-alpine as development

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Create build directory and set permissions
RUN mkdir -p build && chmod 755 build

# Expose port
EXPOSE 3000

# Set environment variables for Docker
ENV REACT_APP_API_URL=http://localhost:8000
ENV GENERATE_SOURCEMAP=false

# Command to run the application
CMD ["npm", "start"]

# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Verify build doesn't contain test files
RUN node scripts/verify-build.js

# Production stage
FROM nginx:alpine as production

# Copy built application from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]