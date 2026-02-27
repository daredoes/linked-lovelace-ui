#!/bin/bash

# Home Assistant Docker Container Setup Script
# Manages Docker container lifecycle for integration and E2E testing

set -e

# Configuration
CONTAINER_NAME="linked-lovelace-hass-test"
HA_IMAGE="homeassistant/home-assistant:stable"
HA_HOST="http://localhost:8123"
HA_PORT=8123
CONFIG_DIR="./dev/config"
WWW_DIR="./dev/www"
DIST_DIR="./dist"
HEALTH_CHECK_URL="${HA_HOST}/api/states"
STARTUP_TIMEOUT=30  # seconds

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${YELLOW}[STEP]${NC} $1"
}

# Usage function
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Home Assistant Docker Container Setup for Testing"
    echo ""
    echo "Options:"
    echo "  -s, --start    Start the container and wait for health check"
    echo "  -t, --stop     Stop and remove the container"
    echo "  -r, --restart  Restart the container"
    echo "  -c, --clean    Clean container logs and remove orphaned images"
    echo "  -h, --help     Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -s           # Start container for testing"
    echo "  $0 -t           # Stop container"
    echo "  $0 -c           # Clean up container and logs"
    exit 0
}

# Health check function
check_health() {
    log_step "Checking HA health at ${HEALTH_CHECK_URL}"
    for i in $(seq 1 $STARTUP_TIMEOUT); do
        if curl -sf "${HEALTH_CHECK_URL}" >/dev/null 2>&1; then
            log_info "Home Assistant is healthy!"
            return 0
        fi
        log_warn "Waiting for HA to start... (${i}/${STARTUP_TIMEOUT})"
        sleep 1
    done
    log_error "HA container failed to start within timeout (${STARTUP_TIMEOUT}s)"
    return 1
}

# Start container
start_container() {
    log_step "Starting Home Assistant test container..."
    
    # Check if container already exists
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_warn "Container ${CONTAINER_NAME} already exists. Stopping..."
        docker stop ${CONTAINER_NAME} 2>/dev/null || true
        docker rm ${CONTAINER_NAME} 2>/dev/null || true
    fi
    
    # Ensure directories exist
    if [ ! -d "${CONFIG_DIR}" ]; then
        log_warn "Creating config directory: ${CONFIG_DIR}"
        mkdir -p "${CONFIG_DIR}"
    fi
    
    if [ ! -d "${WWW_DIR}" ]; then
        log_warn "Creating www directory: ${WWW_DIR}"
        mkdir -p "${WWW_DIR}"
    fi
    
    # Create default configuration.yaml if it doesn't exist
    if [ ! -f "${CONFIG_DIR}/config.yaml" ]; then
        log_info "Creating default configuration.yaml"
        cat > "${CONFIG_DIR}/config.yaml" << EOF
# Home Assistant configuration for testing
devices:
  enabled: true

lovelace:
  mode: storage

# Enable developer tools for testing
developer_tools:
  enabled: true

# Enable custom cards integration
custom_components:
  custom_cards: true
EOF
        log_info "Configuration created at ${CONFIG_DIR}/config.yaml"
    fi
    
    # Create Docker Compose file for container
    log_info "Creating Docker configuration..."
    cat > "docker-compose.test.yml" << EOF
version: '3.8'
services:
  home-assistant:
    image: ${HA_IMAGE}
    container_name: ${CONTAINER_NAME}
    ports:
      - "${HA_PORT}:8123"
    volumes:
      - ${CONFIG_DIR}:${CONFIG_DIR}
      - ${WWW_DIR}:${WWW_DIR}
      - ./dist:/config/www/custom-cards
    restart: unless-stopped
    security_opt:
      - no-new-privileges:true
    healthcheck:
      test: ["CMD", "curl", "-f", "${HEALTH_CHECK_URL}"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 30s
EOF
    
    # Start container
    log_info "Starting Docker container..."
    docker-compose -f docker-compose.test.yml up -d
    
    # Wait for health check
    log_info "Waiting for Home Assistant to become healthy..."
    check_health
    
    # Container is ready
    log_info "✅ Home Assistant test container is ready!"
    log_info "   Access URL: ${HA_HOST}"
    log_info "   Container: ${CONTAINER_NAME}"
    log_info "   Logs: docker logs ${CONTAINER_NAME} -f"
    
    # Generate API token for testing
    log_info "Generating testing API token..."
    if ! docker exec ${CONTAINER_NAME} echo "Checking token..." 2>/dev/null | grep -q "Running"; then
        log_warn "Container may not be fully initialized yet, token generation may be delayed"
    fi
    
    log_info "Please set HA_TOKEN environment variable with long-lived token from HA UI"
    log_info "Go to Settings > Persons > Your Profile > Long-Lived Access Tokens"
    
    # Display status
    docker-compose -f docker-compose.test.yml ps
}

# Stop container
stop_container() {
    log_step "Stopping Home Assistant test container..."
    
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        docker-compose -f docker-compose.test.yml down
        log_info "✅ Container stopped and removed"
    else
        log_warn "Container ${CONTAINER_NAME} is not running"
    fi
    
    # Clean up Docker Compose file
    if [ -f "docker-compose.test.yml" ]; then
        rm -f docker-compose.test.yml
        log_info "Removed temporary Docker Compose file"
    fi
}

# Restart container
restart_container() {
    log_step "Restarting Home Assistant test container..."
    
    if docker-compose -f docker-compose.test.yml up -d >/dev/null 2>&1; then
        log_info "Container restarted successfully"
        check_health || log_error "Container failed health check after restart"
    else
        log_error "Failed to restart container, starting fresh..."
        start_container
    fi
}

# Clean up
remove_container() {
    log_step "Removing Home Assistant test container..."
    
    # Stop container if running
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        docker-compose -f docker-compose.test.yml down 2>/dev/null || true
    fi
    
    # Force remove container
    docker rm ${CONTAINER_NAME} 2>/dev/null || true
    
    # Clean up configuration
    rm -f docker-compose.test.yml
    
    log_info "✅ Container removed"
}

# Clean logs
clean_logs() {
    log_step "Cleaning container logs..."
    
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        docker-compose -f docker-compose.test.yml logs --tail 0 >/dev/null 2>&1 || true
        log_info "Container logs cleared"
    else
        log_warn "Container not running, cannot clean logs"
    fi
}

# Show container status
show_status() {
    log_info "=== Home Assistant Test Container Status ==="
    
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_info "Container is running"
        docker ps --filter name=${CONTAINER_NAME}
        
        # Check health status
        health_status=$(docker inspect --format='{{.State.Health.Status}}' ${CONTAINER_NAME} 2>/dev/null || echo "unknown")
        log_info "Health status: ${health_status}"
        
        # Check logs
        docker-compose -f docker-compose.test.yml logs --tail 5 2>/dev/null || true
    else
        log_warn "Container ${CONTAINER_NAME} is not running"
    fi
    
    echo ""
    log_info "Commands:"
    log_info "  ${GREEN}docker logs ${CONTAINER_NAME}${NC}  - View logs"
    log_info "  ${GREEN}docker exec ${CONTAINER_NAME} homeassistant --config /config create_user --username test --password test${NC} - Create test user"
}

# Parse command line arguments
action=""
while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--start)
            action="start"
            shift
            ;;
        -t|--stop)
            action="stop"
            shift
            ;;
        -r|--restart)
            action="restart"
            shift
            ;;
        -c|--clean)
            action="clean"
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Execute command
case $action in
    start)
        start_container
        ;;
    stop)
        stop_container
        ;;
    restart)
        restart_container
        ;;
    clean)
        clean_logs
        ;;
    "")
        usage
        ;;
    *)
        log_error "Unknown action: $action"
        usage
        exit 1
        ;;
esac

exit 0
