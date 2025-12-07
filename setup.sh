#!/bin/bash
# Writeflow Setup Script
# This script helps you get started with local development

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}       Writeflow Setup Script          ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "  ${GREEN}✓${NC} $1 found"
        return 0
    else
        echo -e "  ${RED}✗${NC} $1 not found"
        return 1
    fi
}

MISSING=0

check_command "node" || MISSING=1
check_command "pnpm" || MISSING=1
check_command "aws" || { echo -e "    ${YELLOW}(optional for frontend-only development)${NC}"; }
check_command "sam" || { echo -e "    ${YELLOW}(optional for frontend-only development)${NC}"; }
check_command "docker" || { echo -e "    ${YELLOW}(optional for local API)${NC}"; }

echo ""

# Check Node version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        echo -e "${YELLOW}Warning: Node.js version $NODE_VERSION detected. Version 20+ recommended.${NC}"
    fi
fi

if [ $MISSING -eq 1 ]; then
    echo -e "${RED}Some required tools are missing.${NC}"
    echo "Please install:"
    echo "  - Node.js 20+: https://nodejs.org/"
    echo "  - pnpm: npm install -g pnpm"
    echo ""
    echo "For full stack development, also install:"
    echo "  - AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    echo "  - SAM CLI: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html"
    echo "  - Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Setup Frontend
echo -e "${YELLOW}Setting up frontend...${NC}"

if [ ! -f "app/.env" ]; then
    if [ -f "app/.env.example" ]; then
        cp app/.env.example app/.env
        echo -e "  ${GREEN}✓${NC} Created app/.env from example"
    else
        echo "VITE_API_URL=http://localhost:3000" > app/.env
        echo -e "  ${GREEN}✓${NC} Created app/.env with default values"
    fi
else
    echo -e "  ${YELLOW}!${NC} app/.env already exists, skipping"
fi

echo -e "${YELLOW}Installing frontend dependencies...${NC}"
cd app
pnpm install
cd ..
echo -e "  ${GREEN}✓${NC} Frontend dependencies installed"

# Setup Backend (if AWS tools available)
if command -v sam &> /dev/null; then
    echo ""
    echo -e "${YELLOW}Setting up backend configuration...${NC}"

    if [ ! -f "backend/writeflow-sam-app/samconfig.toml" ]; then
        if [ -f "backend/writeflow-sam-app/samconfig.toml.example" ]; then
            cp backend/writeflow-sam-app/samconfig.toml.example backend/writeflow-sam-app/samconfig.toml
            echo -e "  ${GREEN}✓${NC} Created samconfig.toml from example"
            echo -e "  ${YELLOW}!${NC} Edit backend/writeflow-sam-app/samconfig.toml before deploying"
        fi
    else
        echo -e "  ${YELLOW}!${NC} samconfig.toml already exists, skipping"
    fi
fi

# Setup E2E Tests
echo ""
echo -e "${YELLOW}Setting up E2E test configuration...${NC}"

E2E_DIR="backend/writeflow-sam-app/tests/e2e/vars"
if [ ! -f "$E2E_DIR/dev.env" ]; then
    if [ -f "$E2E_DIR/dev.env.example" ]; then
        cp "$E2E_DIR/dev.env.example" "$E2E_DIR/dev.env"
        echo -e "  ${GREEN}✓${NC} Created E2E test config from example"
        echo -e "  ${YELLOW}!${NC} Edit $E2E_DIR/dev.env with your deployment values"
    fi
else
    echo -e "  ${YELLOW}!${NC} E2E test config already exists, skipping"
fi

# Done
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}       Setup Complete!                 ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo ""
echo -e "${BLUE}1. Frontend only:${NC}"
echo "   cd app && pnpm dev"
echo "   (Note: API calls will fail without backend)"
echo ""
echo -e "${BLUE}2. Full stack with AWS:${NC}"
echo "   a. Configure AWS CLI: aws configure"
echo "   b. Deploy backend:"
echo "      cd backend/writeflow-sam-app"
echo "      sam build && sam deploy --guided"
echo "   c. Update app/.env with your API URL"
echo "   d. Start frontend: cd app && pnpm dev"
echo ""
echo -e "See ${YELLOW}docs/DEPLOY.md${NC} for detailed deployment instructions."
echo -e "See ${YELLOW}docs/ARCHITECTURE.md${NC} for system overview."
