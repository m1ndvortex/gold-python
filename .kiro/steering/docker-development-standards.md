# Docker Development Standards

## Overview
This project follows a strict Docker-first development approach. All development, testing, and deployment activities must be performed within Docker containers to ensure consistency across all environments.

## Core Principles

### 1. Docker-Only Environment
- **Everything runs in Docker**: All development, testing, building, and deployment activities must be performed using Docker containers
- **No local installations**: Do not install Node.js, Python, databases, or other dependencies directly on the host machine
- **Container consistency**: All team members and CI/CD pipelines use identical containerized environments

### 2. Testing Standards

#### Real Database and Backend Testing
- **No mocking**: All tests must use real database connections and backend services
- **Integration testing**: Tests should verify actual API calls, database operations, and service interactions
- **Docker Compose for tests**: Use `docker-compose` to orchestrate test environments with all required services

#### Test Execution Commands
```bash
# Frontend tests (always use Docker)
docker-compose -f docker-compose.yml exec frontend npm test -- --testPathPattern=<test-file> --watchAll=false

# Backend tests (always use Docker)
docker-compose -f docker-compose.yml exec backend python -m pytest <test-file>

# Full integration tests
docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit
```

#### Test Environment Setup
- Tests must wait for backend services to be ready before executing
- Use proper health checks and retry mechanisms
- Test databases should be isolated but real (not mocked)
- All API calls should hit actual endpoints, not mocked responses

### 3. Development Workflow

#### Starting Development Environment
```bash
# Start all services
docker-compose up --build

# View logs
docker-compose logs -f <service-name>

# Execute commands in containers
docker-compose exec <service-name> <command>
```

#### Code Changes
- All code changes are reflected in containers through volume mounts
- Hot reloading is configured for development containers
- No need to rebuild containers for code changes during development

#### Installing Dependencies
```bash
# Frontend dependencies
docker-compose exec frontend npm install <package-name>

# Backend dependencies  
docker-compose exec backend pip install <package-name>
# Then update requirements.txt
docker-compose exec backend pip freeze > requirements.txt
```

### 4. Database Operations

#### Database Access
- Access databases only through Docker containers
- Use `docker-compose exec` to run database commands
- All migrations and seeding must be performed in containers

#### Example Database Commands
```bash
# Access PostgreSQL
docker-compose exec db psql -U postgres -d goldshop

# Run migrations
docker-compose exec backend python -m alembic upgrade head

# Seed data
docker-compose exec backend python seed_data.py
```

### 5. Debugging and Troubleshooting

#### Container Debugging
```bash
# View container logs
docker-compose logs <service-name>

# Execute shell in container
docker-compose exec <service-name> /bin/bash

# Inspect container
docker inspect <container-name>
```

#### Common Issues
- **Port conflicts**: Ensure no local services are running on Docker-exposed ports
- **Volume permissions**: Check file permissions for mounted volumes
- **Network issues**: Verify container networking and service discovery

### 6. CI/CD Integration

#### Pipeline Requirements
- All CI/CD pipelines must use Docker containers
- No dependencies should be installed directly on CI runners
- Use `docker-compose` for consistent build and test environments
- All tests must pass in containerized environment before deployment

#### Example CI Commands
```bash
# Build and test
docker-compose -f docker-compose.test.yml build
docker-compose -f docker-compose.test.yml up --abort-on-container-exit

# Production build
docker-compose -f docker-compose.prod.yml build
```

### 7. File Structure Standards

#### Docker Configuration Files
- `docker-compose.yml` - Development environment
- `docker-compose.test.yml` - Testing environment  
- `docker-compose.prod.yml` - Production environment
- `Dockerfile` - Service-specific container definitions

#### Volume Mounts
- Source code mounted for development hot-reloading
- Persistent volumes for databases and file storage
- Proper permission handling for cross-platform compatibility

### 8. Performance Considerations

#### Container Optimization
- Use multi-stage builds for production images
- Minimize image layers and size
- Implement proper caching strategies
- Use `.dockerignore` files to exclude unnecessary files

#### Resource Management
- Set appropriate memory and CPU limits
- Monitor container resource usage
- Use health checks for service reliability

### 9. Security Standards

#### Container Security
- Run containers with non-root users when possible
- Use official base images from trusted sources
- Regularly update base images and dependencies
- Implement proper secrets management

#### Network Security
- Use internal Docker networks for service communication
- Expose only necessary ports to host
- Implement proper firewall rules

### 10. Documentation Requirements

#### Docker Documentation
- All Docker configurations must be documented
- Include setup instructions for new developers
- Document any special requirements or considerations
- Maintain troubleshooting guides

## Enforcement

### Code Review Requirements
- All pull requests must include Docker-compatible changes
- Tests must pass in Docker environment
- No local environment dependencies allowed

### Development Setup Verification
New team members must verify their setup by:
1. Running `docker-compose up` successfully
2. Executing all tests using Docker commands
3. Making a code change and verifying hot-reload works
4. Accessing all services through Docker containers

## Benefits

### Consistency
- Identical environments across development, testing, and production
- No "works on my machine" issues
- Predictable behavior across different operating systems

### Reliability  
- Real integration testing with actual services
- Early detection of environment-specific issues
- Confidence in deployment process

### Scalability
- Easy to add new services and dependencies
- Simplified onboarding for new developers
- Consistent CI/CD pipeline behavior

## Conclusion

This Docker-first approach ensures that our gold shop management system is developed, tested, and deployed in a consistent, reliable manner. All team members must adhere to these standards to maintain the integrity and quality of our development process.