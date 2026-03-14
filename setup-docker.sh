#!/bin/bash
# Docker Setup Helper Script for NeuroSentinel
# This script copies .env.example files to .env for easier setup

echo "NeuroSentinel Docker Setup Helper"
echo "=================================="
echo ""

# Create server .env
if [ ! -f "server/.env" ]; then
    echo "Creating server/.env from template..."
    cp server/.env.example server/.env
    echo "✓ Created server/.env"
    echo "  Please edit server/.env and add your API keys"
else
    echo "✓ server/.env already exists"
fi

# Create python-server .env
if [ ! -f "python-server/.env" ]; then
    echo "Creating python-server/.env from template..."
    cp python-server/.env.example python-server/.env
    echo "✓ Created python-server/.env"
    echo "  Please edit python-server/.env and add your API keys"
else
    echo "✓ python-server/.env already exists"
fi

echo ""
echo "Next Steps:"
echo "1. Edit server/.env and add your API keys"
echo "2. Edit python-server/.env and add GROQ_API_KEY"
echo "3. Run: docker-compose up --build"
echo ""
echo "More help: Read DOCKER_SETUP.md"
