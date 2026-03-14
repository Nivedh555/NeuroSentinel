# NeuroSentinel - Quick Docker Start Guide

## For Hackathon Teams: Get Running in 5 Minutes ⚡

### 1. On Your Own Computer (Before the Hackathon)

1. Get your API keys ready:
   - **GROQ_API_KEY** - Get from [Groq Console](https://console.groq.com)
   - **VAPID Keys** - Generate or reuse from your current setup
   - **Upstash Redis** - Get credentials from [Upstash](https://upstash.com)
   - **Gmail App Password** - Get from your Gmail settings
   - **JWT_SECRET & JOURNAL_ENCRYPTION_KEY** - Just copy from your current `.env`

2. Update your `.env` files with these keys before pushing to git

### 2. On the Hackathon Computer

**Prerequisites:**
- Install [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Clone the repository

**Setup (Choose one):**

#### Option A: Linux/Mac
```bash
cd NeuroSentinel
bash setup-docker.sh
# Edit the .env files with API keys
docker-compose up --build
```

#### Option B: Windows
```bash
cd NeuroSentinel
setup-docker.bat
# Edit the .env files with API keys
docker-compose up --build
```

#### Option C: Manual
```bash
# Create .env files
cp server/.env.example server/.env
cp python-server/.env.example python-server/.env

# Edit server/.env - add your API keys
# Edit python-server/.env - add GROQ_API_KEY

# Start all services
docker-compose up --build
```

### 3. Access Your Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Python ML Server: http://localhost:8000

## Typical Commands

```bash
# Start all services
docker-compose up --build

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f server

# Rebuild after code changes
docker-compose up --build

# Clean everything (nuclear option)
docker-compose down -v
```

## Security Notes for Hackathon

✅ DO:
- Share API keys via password manager or encrypted document
- Keep `.env` files local (never commit to git)
- Use the same secret keys across team members (JWT_SECRET, JOURNAL_ENCRYPTION_KEY)

❌ DON'T:
- Commit `.env` files with real keys to git
- Share API keys in plain text chat/email
- Use docker-compose in production (it's built for development)

## If Something Breaks

1. Check the logs:
```bash
docker-compose logs
```

2. Check a specific service:
```bash
docker-compose logs server
docker-compose logs python
docker-compose logs client
```

3. Verify all services are running:
```bash
docker-compose ps
```

4. Restart everything:
```bash
docker-compose down
docker-compose up --build
```

## Full Documentation

See [DOCKER_SETUP.md](DOCKER_SETUP.md) for detailed troubleshooting and more options.
