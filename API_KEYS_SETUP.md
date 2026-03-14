# NeuroSentinel - API Keys Setup Checklist

Use this checklist to gather all required API keys before running the application on another computer.

## ✅ Required Keys for Core Functionality

### 1. Groq AI (GROQ_API_KEY) ⭐ REQUIRED
- **Used for**: Chatbot AI, sentiment analysis, mental health insights
- **Where to get**: [Groq Console](https://console.groq.com)
- **Steps**:
  1. Create a free account at https://console.groq.com
  2. Go to Dashboard → API Keys
  3. Click "Create API Key"
  4. Copy the key (starts with `gsk_`)
- **Add to**: `server/.env` and `python-server/.env`
- **Status**: ☐ Obtained

### 2. JWT Secret & Encryption Key
- **Used for**: User authentication and journal encryption
- **Where to get**: Use your current values from your existing `.env`
- **Current values**:
  ```
  JWT_SECRET=neurosentinel@2026#soulsync$secure!jwt%key
  JOURNAL_ENCRYPTION_KEY=831618ca55778da03913cf87df958fd356c79cf668d65b22284d75b77db50c68
  ```
- **Note**: Keep these consistent across all team members for data compatibility
- **Add to**: `server/.env`
- **Status**: ☐ Copied

## ⭐ Important: These Keys Should Be The Same Across Team

Make sure all team members have the same values for:
- `JWT_SECRET`
- `JOURNAL_ENCRYPTION_KEY`
- `GROQ_API_KEY`

Otherwise, users won't be able to log in or access their encrypted data across different team member's machines.

## 🔔 Optional: Push Notifications (VAPID Keys)

- **Used for**: Browser push notifications
- **Current values**:
  ```
  VAPID_PUBLIC_KEY=BIvuR6mj4sHyJ0yBPhvTfTbdpVYex4PkH5Jm9S3DATVQ2OY42ya_OZ8gMmvWPtmwRVtP4Y-yjzmqzzhwSsyH4aI
  VAPID_PRIVATE_KEY=Fl5xrPRYVZ_758kdEHBl6E4VoNvviatZnlSB8KAiY90
  ```
- **Where to get**: Use your current values
- **How to generate new ones**: 
  ```bash
  # Using npm web-push package
  npm install -g web-push
  web-push generate-vapid-keys
  ```
- **Add to**: `server/.env`
- **Status**: ☐ Obtained

## 🔴 Recommended: Upstash Redis (For Serverless Cache)

- **Used for**: Rate limiting, caching, real-time notifications
- **Where to get**: [Upstash Console](https://upstash.com)
- **Free tier**: Yes (includes free tier)
- **Steps**:
  1. Sign up at https://upstash.com
  2. Create a new Redis database
  3. Copy the REST URL and REST Token
- **Keys needed**:
  ```
  UPSTASH_REDIS_REST_URL=https://light-bedbug-5615.upstash.io
  UPSTASH_REDIS_REST_TOKEN=ARXvAAImcDI3MTBiMDFjODNlYzA0Y2E1YTc2YjA4OTkzZmQxNmQ4ZXAyNTYxNQ
  ```
- **Add to**: `server/.env`
- **Status**: ☐ Obtained

## 📧 Optional: Email Service (For User Notifications)

- **Used for**: Welcome emails, password resets, alerts
- **Current values**:
  ```
  SENDER_EMAIL=247r1a66h4@cmrtc.ac.in
  SENDER_PASS=Cmr sriram
  ```
- **How to set up**:
  1. Use a Gmail account
  2. Enable 2-Factor Authentication
  3. Go to [App Passwords](https://support.google.com/accounts/answer/185833)
  4. Generate an "App Password" for Gmail
  5. Use that password (not your actual password)
- **Add to**: `server/.env`
- **Status**: ☐ Obtained

## 🎨 Optional: ImageKit (For Image Optimization)

- **Used for**: Image optimization and CDN serving
- **Status**: Currently empty - not critical for hackathon
- **Currently in `.env`**: 
  ```
  IMAGEKIT_PUBLIC_KEY=
  IMAGEKIT_PRIVATE_KEY=
  IMAGEKIT_URL_ENDPOINT=
  ```
- **Status**: ☐ Skipped for now

## 📱 Optional: Twilio (For SMS Alerts)

- **Used for**: SMS notifications to users
- **Status**: Currently not implemented - not critical for hackathon
- **Currently in `.env`**:
  ```
  TWILIO_ACCOUNT_SID=
  TWILIO_AUTH_TOKEN=
  TWILIO_PHONE_NUMBER=
  ```
- **Status**: ☐ Skipped for now

## 📋 Setup Instructions

### For One Computer:

1. Open `server/.env`
2. Fill in the values for:
   - ⭐ GROQ_API_KEY (required)
   - VAPID keys (recommended)
   - UPSTASH keys (recommended)
   - Email credentials (optional)
3. Open `python-server/.env`
4. Fill in:
   - ⭐ GROQ_API_KEY (same as server)

### For Hackathon Team:

1. **One person** gathers all the API keys
2. **Share securely** (password manager or encrypted document):
   - GROQ_API_KEY
   - JWT_SECRET
   - JOURNAL_ENCRYPTION_KEY
   - VAPID_PRIVATE_KEY & VAPID_PUBLIC_KEY
   - UPSTASH credentials
   - Email credentials
3. **Each team member**:
   - Clones the repo
   - Runs `setup-docker.sh` (Mac/Linux) or `setup-docker.bat` (Windows)
   - Copies the shared API keys into their `.env` files
   - Runs `docker-compose up --build`

## 🔒 Security Best Practices

⚠️ **NEVER**:
- Share API keys in plain text via chat or email
- Commit `.env` files to Git (they're in `.gitignore`)
- Use production API keys for testing

✅ **DO**:
- Use a password manager to share keys (e.g., 1Password, LastPass, Bitwarden)
- Encrypt shared documents
- Keep separate keys for production
- Rotate keys if they're compromised

## 🆘 Troubleshooting

### "GROQ_API_KEY not set"
- Check if `server/.env` has the key
- Restart containers: `docker-compose down && docker-compose up --build`

### "Cannot connect to MongoDB"
- Wait 10-15 seconds for MongoDB to start
- Check logs: `docker-compose logs mongodb`

### "Redis connection refused"
- Wait for Redis to start: `docker-compose logs redis`
- Or use Upstash Redis instead of local Redis

### "Encryption key mismatch"
- Ensure all team members have the same `JOURNAL_ENCRYPTION_KEY`
- Existing encrypted journals won't decrypt with a different key

## 📞 Support

For issues:
1. Check `DOCKER_SETUP.md` for detailed troubleshooting
2. View logs: `docker-compose logs`
3. Check specific service: `docker-compose logs -f server`
