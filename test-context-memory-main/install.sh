#!/bin/bash

# ContextMemory TypeScript Installation Script
# This script sets up both Express backend and Next.js frontend

set -e  # Exit on error

echo "🚀 ContextMemory TypeScript Setup"
echo "================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}❌ npm not found. Please install npm${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node $(node --version)${NC}"
echo -e "${GREEN}✅ npm v$(npm --version)${NC}"
echo ""

# Backend Setup
echo -e "${BLUE}📦 Setting up Express Backend (server)...${NC}"
cd server

if [ ! -f ".env" ]; then
    echo "Creating default .env..."
    echo "PORT=8000" > .env
    echo "JWT_SECRET=supersecretjwtkey123456789" >> .env
    echo "LLM_PROVIDER=openrouter" >> .env
    echo "LLM_MODEL=openai/gpt-4o-mini" >> .env
    echo "EMBEDDING_MODEL=text-embedding-3-small" >> .env
fi

echo "Installing Express server dependencies..."
npm install

echo -e "${GREEN}✅ Express backend setup complete${NC}"
echo ""

# Frontend Setup
cd ../web
echo -e "${BLUE}📦 Setting up Next.js Frontend (web)...${NC}"

if [ ! -f ".env.local" ]; then
    echo "Creating .env.local..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
fi

echo "Installing Next.js dependencies..."
npm install

echo -e "${GREEN}✅ Frontend setup complete${NC}"
echo ""

# Summary
echo -e "${GREEN}🎉 Installation Complete!${NC}"
echo ""
echo "To start the full-stack application:"
echo ""
echo -e "${BLUE}Terminal 1 (Express Server):${NC}"
echo "  cd server"
echo "  npm run dev"
echo ""
echo -e "${BLUE}Terminal 2 (Next.js Web UI):${NC}"
echo "  cd web"
echo "  npm run dev"
echo ""
echo -e "Then visit: ${GREEN}http://localhost:3000${NC}"
echo ""
