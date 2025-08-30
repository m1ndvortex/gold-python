#!/bin/bash
# Deployment Script for Universal Inventory Management System
# Supports development, testing, and production environments

set -e

# Configuration
ENVIRONMENT=${1:-development}
COMPOSE_FILE=""
PROJECT_NAME="goldshop"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running"
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Set compose file based on environment
set_compose_file() {
    case $ENVIRONMENT in
        development|dev)
            COMPOSE_FILE="docker-compose.yml"
            ;;
        testing|test)
            COMPOSE_FILE="docker-compose.test.yml"
            ;;
        production|prod)
            COMPOSE_FILE="docker-compose.prod.yml"
            ;;
        *)
            error "Invalid environment: $ENVIRONMENT"
            error "Valid environments: development, testing, production"
            exit 1
            ;;
    esac
    
    log "Using compose file: $COMPOSE_FILE"
}

# Create required directories
create_directories() {
    log "Creating required directories..."
    
    directories=(
        "logs/nginx"
        "logs/backend"
        "logs/frontend"
        "backups"
        "ssl"
    )
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log "Created directory: $dir"
        fi
    done
}

# Setup secrets for production
setup_secrets() {
    if [ "$ENVIRONMENT" = "production" ] || [ "$ENVIRONMENT" = "prod" ]; then
        log "Setting up production secrets..."
        
        if [ ! -f "secrets/db_password.txt" ]; then
            warning "Production database password not found"
            echo "Please create secrets/db_password.txt with a secure password"
            read -p "Continue anyway? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
        
        # Set proper permissions on secrets
        if [ -d "secrets" ]; then
            chmod 700 secrets/
            chmod 600 secrets/*.txt 2>/dev/null || true
            log "Set proper permissions on secrets directory"
        fi
    fi
}

# Build and start services
deploy_services() {
    log "Deploying services for $ENVIRONMENT environment..."
    
    # Pull latest images
    log "Pulling latest images..."
    docker-compose -f "$COMPOSE_FILE" pull
    
    # Build services
    log "Building services..."
    docker-compose -f "$COMPOSE_FILE" build --no-cache
    
    # Start services
    log "Starting services..."
    if [ "$ENVIRONMENT" = "production" ] || [ "$ENVIRONMENT" = "prod" ]; then
        docker-compose -f "$COMPOSE_FILE" up -d
    else
        docker-compose -f "$COMPOSE_FILE" up -d
    fi
    
    success "Services started successfully"
}

# Wait for services to be healthy
wait_for_services() {
    log "Waiting for services to be healthy..."
    
    services=("db" "redis" "backend")
    max_attempts=30
    
    for service in "${services[@]}"; do
        log "Waiting for $service to be healthy..."
        attempt=1
        
        while [ $attempt -le $max_attempts ]; do
            if docker-compose -f "$COMPOSE_FILE" ps "$service" | grep -q "healthy\|Up"; then
                success "$service is healthy"
                break
            fi
            
            if [ $attempt -eq $max_attempts ]; then
                error "$service failed to become healthy"
                docker-compose -f "$COMPOSE_FILE" logs "$service"
                exit 1
            fi
            
            log "Attempt $attempt/$max_attempts - waiting for $service..."
            sleep 10
            ((attempt++))
        done
    done
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Wait a bit more for database to be fully ready
    sleep 5
    
    # Run migrations
    docker-compose -f "$COMPOSE_FILE" exec -T backend python -c "
from database import engine
from models import Base
Base.metadata.create_all(bind=engine)
print('Database tables created successfully')
"
    
    success "Database migrations completed"
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check if all containers are running
    if ! docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        error "Some services are not running"
        docker-compose -f "$COMPOSE_FILE" ps
        exit 1
    fi
    
    # Test health endpoints
    log "Testing health endpoints..."
    
    max_attempts=10
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -k https://localhost/api/health &> /dev/null; then
            success "Health check passed"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            error "Health check failed"
            exit 1
        fi
        
        log "Health check attempt $attempt/$max_attempts..."
        sleep 5
        ((attempt++))
    done
    
    success "Deployment verification completed"
}

# Show deployment status
show_status() {
    log "Deployment Status:"
    echo
    docker-compose -f "$COMPOSE_FILE" ps
    echo
    
    log "Service URLs:"
    case $ENVIRONMENT in
        development|dev)
            echo "  Frontend: https://localhost"
            echo "  Backend API: https://localhost/api"
            echo "  Database: localhost:5432"
            echo "  Redis: localhost:6379"
            ;;
        production|prod)
            echo "  Application: https://yourdomain.com"
            echo "  Monitoring: https://yourdomain.com/grafana"
            ;;
    esac
    echo
    
    log "Useful Commands:"
    echo "  View logs: docker-compose -f $COMPOSE_FILE logs -f [service]"
    echo "  Stop services: docker-compose -f $COMPOSE_FILE down"
    echo "  Restart service: docker-compose -f $COMPOSE_FILE restart [service]"
    echo "  Execute command: docker-compose -f $COMPOSE_FILE exec [service] [command]"
}

# Cleanup function
cleanup() {
    if [ $? -ne 0 ]; then
        error "Deployment failed"
        log "Cleaning up..."
        docker-compose -f "$COMPOSE_FILE" down
    fi
}

# Main deployment function
main() {
    log "Starting deployment for $ENVIRONMENT environment"
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    check_prerequisites
    set_compose_file
    create_directories
    setup_secrets
    deploy_services
    wait_for_services
    run_migrations
    verify_deployment
    show_status
    
    success "Deployment completed successfully!"
}

# Show usage
usage() {
    echo "Usage: $0 [environment]"
    echo
    echo "Environments:"
    echo "  development (default) - Development environment"
    echo "  testing              - Testing environment"
    echo "  production           - Production environment"
    echo
    echo "Examples:"
    echo "  $0                   # Deploy development environment"
    echo "  $0 development       # Deploy development environment"
    echo "  $0 production        # Deploy production environment"
}

# Handle command line arguments
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    usage
    exit 0
fi

# Run main function
main