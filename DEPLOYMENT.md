# PRAMAAN — Production Container Deployment Guide

This document provides complete instructions for deploying the **PRAMAAN** Digital Academic Records Platform in containerized production environments using Docker, Docker Compose, and Nginx.

---

## Architecture Overview

```
                      +-----------------------------+
                      |       Client Browser        |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |   Nginx Reverse Proxy       |
                      |   Port 80 / Port 443 (SSL)  |
                      +--------------+--------------+
                                     |
                +--------------------+--------------------+
                |                                         |
                v                                         v
+-------------------------------+         +-------------------------------+
|   Next.js Frontend Container  |         |   FastAPI Backend Container   |
|   Node.js 20 Standalone       |         |   Python 3.12 (Uvicorn)       |
|   Port 3000                   |         |   Port 8000                   |
+-------------------------------+         +---------------+---------------+
                                                          |
                                                          v
                                          +-------------------------------+
                                          |   Persistent Volume (/app/data|
                                          |   SQLite WAL / PostgreSQL     |
                                          +-------------------------------+
```

---

## 1. Quick Start (Standard Mode)

Deploy Frontend on port **3000** and Backend API on port **8000**:

```bash
# Clone the repository (or navigate to project directory)
cd "New folder (4)"

# Linux / macOS:
./deploy.sh

# Windows:
deploy.bat

# Or directly with Docker Compose:
docker compose up -d --build
```

### Endpoints
- **Frontend Portal**: `http://localhost:3000`
- **Backend API Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/api/v1/public-stats`

---

## 2. Production Mode (Single Port with Nginx)

In production on a VPS or domain, route all traffic through Nginx on **Port 80** (and 443 with SSL):

```bash
# Linux / macOS:
./deploy.sh prod

# Windows:
deploy.bat prod

# Or directly:
docker compose -f docker-compose.prod.yml up -d --build
```

### Endpoints
- **Web Platform**: `http://<your-server-ip>`
- **API Endpoints**: `http://<your-server-ip>/api/v1/...`
- **Swagger Documentation**: `http://<your-server-ip>/docs`

---

## 3. Cloud / VPS Deployment Guide (AWS, DigitalOcean, Hetzner, GCP)

### Step 1: Provision your Virtual Private Server
- Recommended spec: 1 vCPU, 2 GB RAM (e.g. DigitalOcean Basic Droplet, AWS t3.small, Hetzner CX22).
- OS: Ubuntu 22.04 LTS or 24.04 LTS.

### Step 2: Install Docker and Docker Compose
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ca-certificates gnupg lsb-release

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add current user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### Step 3: Clone Repository & Configure Environment
```bash
git clone <your-repo-url> pramaan
cd pramaan

# Create production .env file
cp .env.example .env
```

Edit `.env` to configure your production secrets:
```env
PROJECT_NAME="PRAMAAN Digital Academic Records Platform"
ENVIRONMENT=production
SECRET_KEY="generate-a-strong-random-64-character-secret-key"
DATABASE_URL=sqlite:////app/data/pramaan.db
FRONTEND_URL=https://yourdomain.com
```

### Step 4: Launch Containers
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Step 5: Configure SSL Certificate (Let's Encrypt / Certbot)
If you have a domain pointing to your server IP:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 4. Maintenance & Operations

### View Live Logs
```bash
# All logs:
docker compose logs -f

# Backend API logs only:
docker compose logs -f backend

# Frontend logs only:
docker compose logs -f frontend
```

### Inspect Container Health
```bash
docker compose ps
```

### Stopping or Restarting Services
```bash
# Graceful stop:
docker compose down

# Restart:
docker compose restart
```

### Database Persistence & Backups
The database is stored in the Docker named volume `pramaan_data` mapped to `/app/data/pramaan.db`.

To create a live snapshot backup:
```bash
docker compose exec backend sqlite3 /app/data/pramaan.db ".backup '/app/data/backup-$(date +%Y%m%d).db'"
```

To copy the database out of the container to the host machine:
```bash
docker cp pramaan-backend:/app/data/pramaan.db ./pramaan-backup.db
```

---

## 5. Seeded Accounts for Testing

Once deployed, the database automatically initializes with synthetic demonstration records:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Student** | `aarav.sharma@demo.ac.in` | `Student@123` |
| **Institution Admin** | `admin@iitdelhi.demo.ac.in` | `InstAdmin@123` |
| **Super Administrator** | `superadmin@pramaan.demo.gov` | `SuperAdmin@123` |

Verification Demo Document ID: `PRM-DOC-2024-918274`
