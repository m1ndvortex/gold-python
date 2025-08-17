FROM node:18-alpine

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
ENV REACT_APP_API_URL=http://backend:8000
ENV GENERATE_SOURCEMAP=false

# Command to run the application
CMD ["npm", "start"]