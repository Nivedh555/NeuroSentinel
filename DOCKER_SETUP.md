# Docker Setup Guide for NeuroSentinel

This guide will help you run NeuroSentinel on any computer (like during a hackathon) using Docker and Docker Compose.

## Prerequisites

Before running the project, ensure you have the following installed:

1. **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop)
   - Includes Docker Engine and Docker Compose
   - Windows: Download Docker Desktop for Windows
   - Mac: Download Docker Desktop for Mac
   - Linux: Install Docker and Docker Compose separately

2. **Git** (optional but recommended for cloning the repository)

## Quick Start (5 minutes)

### Step 1: Clone or Copy the Project

```bash
git clone <your-repo-url> NeuroSentinel
cd NeuroSentinel
```

### Step 2: Set Up Environment Variables

The project uses `.env` files for API keys and configuration. You need to create these files on the new computer.

#### For the Backend Server (`server/.env`):

1. Copy the template file:
```bash
cp server/.env.example server/.env
```

2. Edit `server/.env` and fill in your API keys:
```bash
# On Windows (PowerShell)
notepad server\.env

# On Mac/Linux
nano server/.env
```

3. **Required API Keys to Set:**
   - `GROQ_API_KEY` - Get from [Groq Console](https://console.groq.com)
   - `JWT_SECRET` - Keep your current value or generate a new one
   - `JOURNAL_ENCRYPTION_KEY` - Keep your current value
   - `VAPID_PUBLIC_KEY` & `VAPID_PRIVATE_KEY` - For push notifications
   - `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN` - From [Upstash](https://upstash.com)
   - `SENDER_EMAIL` & `SENDER_PASS` - Gmail with [App Password](https://support.google.com/accounts/answer/185833)

#### For the Python Server (`python-server/.env`):

1. Copy the template file:
```bash
cp python-server/.env.example python-server/.env
```

2. Edit `python-server/.env` and add:
```bash
GROQ_API_KEY=<same-as-server>
```

### Step 3: Start All Services

Run the entire application stack with one command:

```bash
docker-compose up --build
```

This will:
- Build all Docker images for Frontend, Backend, and Python Server
- Set up MongoDB and Redis databases
- Start all services and make them accessible

### Step 4: Access the Application

Once all services are running, access:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Python ML Server**: http://localhost:8000
- **MongoDB**: mongodb://localhost:27017
- **Redis**: localhost:6379

You should see output like:
```
neurosentinel-client  | VITE v5.x.x  ready in xxx ms
neurosentinel-server  | Server running on port 5000
neurosentinel-python  | Uvicorn running on 0.0.0.0:8000
```

## How to Manage Running Services

### Stop All Services

```bash
docker-compose down
```

This stops all containers but keeps your data.

### Stop & Remove Everything (Clean State)

```bash
docker-compose down -v
```

This removes all containers and volumes (you'll lose database data).

### View Running Services

```bash
docker-compose ps
```

### View Logs

View all logs:
```bash
docker-compose logs -f
```

View logs from a specific service:
```bash
docker-compose logs -f server
docker-compose logs -f python
docker-compose logs -f client
```

### Rebuild After Code Changes

If you make code changes and Docker doesn't pick them up:

```bash
docker-compose up --build
```

Or rebuild a specific service:
```bash
docker-compose build server && docker-compose up
```

## Troubleshooting

### Port Already in Use

If you see "Address already in use" error, either:

1. Stop other services using the port
2. Change the port in `docker-compose.yml` (e.g., `5001:5000`)

### MongoDB Connection Error

Wait 10-15 seconds for MongoDB to start, then refresh the browser.

### Missing Environment Variables

Ensure all `.env` files have the required API keys. Check logs:
```bash
docker-compose logs server
docker-compose logs python
```

### Services Keep Restarting

Check the logs to see specific errors:
```bash
docker-compose logs
```

Common causes:
- Missing API keys in `.env`
- Port conflicts
- Insufficient system resources (RAM/CPU)

### Slow Performance on Windows/Mac

Docker Desktop runs a lightweight Linux VM. If slow:

1. Increase Docker's resource allocation in Docker Desktop settings
2. Give it more CPU cores and RAM

### Clean Up Everything

To remove all containers, images, and volumes:

```bash
docker-compose down -v
docker system prune -a
```

## For Hackathon Teams

### Sharing the Project

1. **Push to GitHub/GitLab** (without .env files - they're in .gitignore)
2. **Each team member:**
   - Clone the repository
   - Run `cp server/.env.example server/.env`
   - Run `cp python-server/.env.example python-server/.env`  
   - Add the same API keys to their `.env` files (share via secure channel)
   - Run `docker-compose up --build`

### Important Security Notes

⚠️ **NEVER commit .env files to git** - They're already in `.gitignore` but double-check!

⚠️ **Share API keys securely** - Use a password manager or encrypted document, not plain text chat

⚠️ **For Production**: Use a real secret management service like AWS Secrets Manager or HashiCorp Vault

## Environment Variables Summary

### Server Required Variables
- `MONGO_URI` - Usually doesn't need change (already set for Docker)
- `GROQ_API_KEY` - Required for AI features
- `JWT_SECRET` - Keep consistent across team
- `JOURNAL_ENCRYPTION_KEY` - Keep consistent across team
- `VAPID_*_KEY` - For push notifications  
- `UPSTASH_*` - For serverless Redis
- `SENDER_*` - For email notifications

### Python Server Required Variables
- `GROQ_API_KEY` - Same as server

### Optional (Only if You Use These Features)
- `IMAGEKIT_*` - Image optimization and CDN
- `TWILIO_*` - SMS notifications

## Help & Support

- Docker Documentation: https://docs.docker.com
- Docker Compose Reference: https://docs.docker.com/compose/compose-file
- Troubleshooting: Run `docker-compose logs` to see detailed error messages
