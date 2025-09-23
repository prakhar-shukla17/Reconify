#!/bin/bash

# ITAM Docker Build Script
# This script builds Docker images for the ITAM application

set -e

echo "🚀 Starting ITAM Docker Build Process..."

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

# Parse command line arguments
BUILD_TYPE="production"
CLEAN=false
PUSH=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --dev)
            BUILD_TYPE="development"
            shift
            ;;
        --clean)
            CLEAN=true
            shift
            ;;
        --push)
            PUSH=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --dev      Build development images"
            echo "  --clean    Clean up old images before building"
            echo "  --push     Push images to registry after building"
            echo "  --help     Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Set environment variables
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Clean up old images if requested
if [ "$CLEAN" = true ]; then
    print_status "Cleaning up old Docker images..."
    docker system prune -f
    docker image prune -f
    print_success "Cleanup completed"
fi

# Build based on type
if [ "$BUILD_TYPE" = "development" ]; then
    print_status "Building development images..."
    docker-compose -f docker-compose.dev.yml build --no-cache
    print_success "Development images built successfully"
else
    print_status "Building production images..."
    docker-compose build --no-cache
    print_success "Production images built successfully"
fi

# Push images if requested
if [ "$PUSH" = true ]; then
    print_status "Pushing images to registry..."
    if [ "$BUILD_TYPE" = "development" ]; then
        docker-compose -f docker-compose.dev.yml push
    else
        docker-compose push
    fi
    print_success "Images pushed successfully"
fi

# Show built images
print_status "Built Docker images:"
docker images | grep itam

print_success "Docker build process completed successfully! 🎉"
echo ""
echo "To start the application:"
if [ "$BUILD_TYPE" = "development" ]; then
    echo "  docker-compose -f docker-compose.dev.yml up -d"
else
    echo "  docker-compose up -d"
fi
echo ""
echo "To view logs:"
if [ "$BUILD_TYPE" = "development" ]; then
    echo "  docker-compose -f docker-compose.dev.yml logs -f"
else
    echo "  docker-compose logs -f"
fi

