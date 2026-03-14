# NeuroSentinel

AI-enabled connected care platform for early risk detection, smart triage, and rapid intervention.

## Hackathon Pitch

### Problem
Healthcare teams and patients often miss early warning signs because critical signals are fragmented across different touchpoints: vitals, symptom logs, daily check-ins, journal text, and chat interactions. Most systems treat these as isolated data points instead of a continuous risk timeline.

This creates three major gaps:
- Detection gap: subtle deterioration is identified too late.
- Coordination gap: patients, caregivers, and providers do not share a unified risk view.
- Action gap: even when risk is detected, escalation to follow-up care is often manual and delayed.

The result is avoidable crisis events, delayed treatment, higher care burden, and reduced patient confidence in continuous care systems.

### Solution
NeuroSentinel combines real-time AI assessment, adaptive check-ins, and automated escalation into one workflow for patients and providers.

### Why It Matters
- Early intervention reduces avoidable crisis events.
- Unified risk view improves clinician decision speed.
- Automated alerts help close the gap between detection and action.

## What Makes NeuroSentinel Different

- Multi-modal risk intelligence:
    - Vitals + symptoms + quiz trends + journal sentiment + interaction patterns.
- Proactive safety net:
    - High-risk auto escalation with emergency contact notification.
- Clinical continuity:
    - AI assessment to appointment booking in one user journey.
- Responsible AI usage:
    - Human-in-the-loop positioning, transparency, and disclaimers.

## Core Features

### Patient Experience
- AI symptom and vitals analysis.
- Adaptive daily and category quizzes (stress, anxiety, depression, sleep).
- Guided journaling with sentiment signals.
- AI companion chat support.
- Camera-assisted facial emotion detection during Journal and Chatbot sessions (browser permission required).
- Appointment booking with risk-aware context.

### Provider/Admin Experience
- Role-separated admin portal.
- Risk-aware patient monitoring and triage support.
- Emergency alert awareness for critical users.

### Safety and Community
- Emergency contact notification flow (Twilio SMS).
- Web-push reminders for check-ins.
- Hate speech moderation for community safety.
- Helpline access for immediate support resources.

## System Architecture

### Frontend
- React (Vite)
- Tailwind CSS + DaisyUI
- Recharts
- face-api.js

### Backend
- Node.js + Express
- MongoDB (Mongoose)
- Redis / Upstash
- Twilio + Web Push

### AI Services
- Python service (FastAPI-style architecture)
- DistilBERT (risk text classification)
- Toxic-BERT (moderation)
- XGBoost (risk scoring and forecasting)

## Repository Structure

```text
NeuroSentinel/
|- client/
|- server/
|- python-server/
|- data/
`- docker-compose.yml
```

## Quick Start (Hackathon Friendly)

### Prerequisites
- Docker + Docker Compose
- Node.js 18+ (if running without Docker)
- Python 3.10+ (if running without Docker)

### 1) Configure Environment Files
Create `.env` files in:
- `server/.env`
- `client/.env`
- `python-server/.env`

Use the Environment Variables section below as reference.

### 2) Start with Docker (Recommended)

```bash
docker-compose up --build
```

Services:
- Client: http://localhost:5173
- Server API: http://localhost:5000
- Python AI service: http://localhost:8000
- Redis: localhost:6379

### 3) If Full Build Fails, Start Incrementally

```bash
docker-compose up -d --build server
docker-compose up -d --build client
docker-compose up -d --build python
```

Then inspect logs:

```bash
docker-compose logs --tail=100
```

## Local Development (Without Docker)

```bash
# server
cd server
npm install
npm run dev

# python service (new terminal)
cd ../python-server
pip install -r requirements.txt
python server.py

# client (new terminal)
cd ../client
npm install
npm run dev
```

## Environment Variables

### server/.env

| Variable | Description |
| :--- | :--- |
| MONGO_URI | MongoDB connection string. |
| PORT | Express server port (default: 5000). |
| JWT_SECRET | JWT signing secret. |
| NODE_ENV | Environment mode. |
| CLIENT_URL | Frontend origin (example: http://localhost:5173). |
| PYTHON_SERVER | Python service URL (example: http://localhost:8000). |
| JOURNAL_ENCRYPTION_KEY | 32-byte hex key for AES encryption. |
| GEMINI_API_KEY | Gemini API key. |
| VAPID_PUBLIC_KEY | Web-push public key. |
| VAPID_PRIVATE_KEY | Web-push private key. |
| REDIS_HOST | Redis hostname (example: redis). |
| REDIS_PORT | Redis port (example: 6379). |
| UPSTASH_REDIS_REST_URL | Optional Upstash URL. |
| UPSTASH_REDIS_REST_TOKEN | Optional Upstash token. |
| TWILIO_ACCOUNT_SID | Twilio account SID. |
| TWILIO_AUTH_TOKEN | Twilio auth token. |
| TWILIO_PHONE_NUMBER | Twilio sender number. |
| SENDER_EMAIL | Sender email for mail features. |
| SENDER_PASS | Sender app password. |
| IMAGEKIT_PUBLIC_KEY | ImageKit public key. |
| IMAGEKIT_PRIVATE_KEY | ImageKit private key. |
| IMAGEKIT_URL_ENDPOINT | ImageKit URL endpoint. |

### client/.env

| Variable | Description |
| :--- | :--- |
| VITE_BASE_URL | Backend API URL (example: http://localhost:5000). |
| VITE_VAPID_PUBLIC_KEY | Public VAPID key for push subscription. |
| VITE_IMAGEKIT_ENDPOINT | ImageKit endpoint. |
| VITE_IMAGEKIT_PUBLIC_KEY | ImageKit public key. |
| VITE_IMAGEKIT_PRIVATE_KEY | ImageKit private key if required by your setup. |
| VITE_GEMINI_PUBLIC_KEY | Public/client identifier for Gemini workflows. |

### python-server/.env

| Variable | Description |
| :--- | :--- |
| GROQ_API_KEY | Groq API key for model inference where configured. |

## Demo Script (5 Minutes)

1. User login and role split (patient vs admin).
2. Patient enters vitals and symptoms in Diagnosis.
3. Open Journal or Chatbot and allow camera permission for facial emotion assist.
4. AI generates risk analysis + condition probabilities.
5. If high risk: show emergency warning and explain auto-notification flow.
6. Book appointment directly from diagnosis tray.
7. Show Insights dashboard for trend visibility.
8. Switch to admin portal and highlight provider view.

## Camera Access and Privacy

NeuroSentinel uses camera access in specific user-facing workflows that include emotion assistance.

- Where camera is used:
    - Journal page.
    - Chatbot dashboard/session.
- Why camera is used:
    - Detect current facial expression using face-api.js and compare with text sentiment to surface mood-mismatch guidance.
- Permission model:
    - Camera activates only after browser-level user consent (`getUserMedia`).
    - If access is denied, the app continues without camera-based emotion signals.
- Data handling in current implementation:
    - Emotion detection runs on the client.
    - The app uses detected emotion labels for in-app guidance (for example, mismatch banners).
    - Raw webcam video frames are not uploaded by the emotion detector component.

## Hackathon Judging Alignment

- Innovation: Multi-modal AI + predictive risk + automated escalation.
- Impact: Early detection and faster intervention pipeline.
- Technical depth: Full-stack microservice-style architecture with ML integration.
- Feasibility: Dockerized deployment and modular services.
- UX: Role-based flows, explainable outputs, actionable recommendations.
