#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "          PRAMAAN Containerized Deployment Script         "
echo "=========================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed or not in PATH."
    echo "Please install Docker and Docker Compose before deploying."
    exit 1
fi

# Check if .env file exists, otherwise copy from template
if [ ! -f .env ]; then
    echo "[+] Creating .env from .env.example..."
    cp .env.example .env
    # Generate random secret key
    RANDOM_SECRET=$(openssl rand -hex 32 2>/dev/null || date +%s%N | sha256sum | head -c 64)
    sed -i "s/SECRET_KEY=.*/SECRET_KEY=${RANDOM_SECRET}/" .env 2>/dev/null || true
fi

MODE=${1:-standard}

if [ "$MODE" = "prod" ] || [ "$MODE" = "nginx" ]; then
    echo "[+] Deploying in PRODUCTION mode (Frontend + Backend + Nginx on Port 80)..."
    docker compose -f docker-compose.prod.yml down --remove-orphans || true
    docker compose -f docker-compose.prod.yml build --no-cache
    docker compose -f docker-compose.prod.yml up -d
    echo ""
    echo "=========================================================="
    echo "Deployment successful!"
    echo "Web Application : http://localhost (Port 80)"
    echo "Backend API     : http://localhost/api/v1"
    echo "Interactive API : http://localhost/docs"
    echo "=========================================================="
else
    echo "[+] Deploying in STANDARD mode (Frontend: 3000, Backend: 8000)..."
    docker compose down --remove-orphans || true
    docker compose build
    docker compose up -d
    echo ""
    echo "=========================================================="
    echo "Deployment successful!"
    echo "Frontend Portal : http://localhost:3000"
    echo "Backend API     : http://localhost:8000"
    echo "API Docs        : http://localhost:8000/docs"
    echo "=========================================================="
fi

echo "[*] Checking container status..."
docker compose ps
