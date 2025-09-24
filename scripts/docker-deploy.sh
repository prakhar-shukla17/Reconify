#!/bin/bash

# ITAM Docker Deployment Script
# This script deploys the ITAM application using Docker Compose

set -e

echo "🚀 Starting ITAM Docker Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Parse command line arguments
DEPLOYMENT_TYPE="production"
BACKUP=true
MIGRATE=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --dev)
            DEPLOYMENT_TYPE="development"
            shift
            ;;
        --no-backup)
            BACKUP=false
            shift
            ;;
        --no-migrate)
            MIGRATE=false
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --dev         Deploy development environment"
            echo "  --no-backup   Skip database backup"
            echo "  --no-migrate  Skip database migration"
            echo "  --help        Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

# Check for environment file
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from template..."
    if [ -f .env.example ]; then
        cp .env.example .env
        print_warning "Please update .env file with your configuration before continuing."
        exit 1
    else
        print_error ".env.example file not found. Please create environment configuration."
        exit 1
    fi
fi

# Set compose file based on deployment type
if [ "$DEPLOYMENT_TYPE" = "development" ]; then
    COMPOSE_FILE="docker-compose.dev.yml"
else
    COMPOSE_FILE="docker-compose.yml"
fi

print_status "Using compose file: $COMPOSE_FILE"

# Backup database if requested and not development
if [ "$BACKUP" = true ] && [ "$DEPLOYMENT_TYPE" = "production" ]; then
    print_status "Creating database backup..."
    BACKUP_DIR="./backups"
    BACKUP_FILE="$BACKUP_DIR/itam-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    mkdir -p "$BACKUP_DIR"
    
    if docker-compose ps mongodb | grep -q "Up"; then
        docker-compose exec -T mongodb mongodump --archive --gzip > "$BACKUP_FILE"
        print_success "Database backup created: $BACKUP_FILE"
    else
        print_warning "MongoDB container not running, skipping backup"
    fi
fi

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f "$COMPOSE_FILE" down

# Pull latest images
print_status "Pulling latest images..."
docker-compose -f "$COMPOSE_FILE" pull

# Build images
print_status "Building images..."
docker-compose -f "$COMPOSE_FILE" build

# Start services
print_status "Starting services..."
docker-compose -f "$COMPOSE_FILE" up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Check service health
print_status "Checking service health..."

# Check MongoDB
if docker-compose -f "$COMPOSE_FILE" exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    print_success "MongoDB is healthy"
else
    print_error "MongoDB is not responding"
    exit 1
fi

# Check Redis
if docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping > /dev/null 2>&1; then
    print_success "Redis is healthy"
else
    print_error "Redis is not responding"
    exit 1
fi

# Check Server
if curl -f http://localhost:3000/api/auth/health > /dev/null 2>&1; then
    print_success "Server is healthy"
else
    print_warning "Server health check failed, but continuing..."
fi

# Check Client
if curl -f http://localhost:3001 > /dev/null 2>&1; then
    print_success "Client is healthy"
else
    print_warning "Client health check failed, but continuing..."
fi

# Run database migrations if requested
if [ "$MIGRATE" = true ]; then
    print_status "Running database migrations..."
    
    # Seed subscription plans
    if docker-compose -f "$COMPOSE_FILE" exec -T server node scripts/seed-subscription-plans.js; then
        print_success "Subscription plans seeded successfully"
    else
        print_warning "Failed to seed subscription plans"
    fi
fi

# Show running containers
print_status "Running containers:"
docker-compose -f "$COMPOSE_FILE" ps

print_success "Deployment completed successfully! 🎉"
echo ""
echo "Application URLs:"
echo "  Frontend: http://localhost:3001"
echo "  Backend API: http://localhost:3000"
echo "  MongoDB: mongodb://localhost:27017"
echo "  Redis: redis://localhost:6379"
echo ""
echo "To view logs:"
echo "  docker-compose -f $COMPOSE_FILE logs -f"
echo ""
echo "To stop the application:"
echo "  docker-compose -f $COMPOSE_FILE down"





