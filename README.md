# Writeflow

A serverless CMS with a rich text editor and live preview. Built as a portfolio project to demonstrate full-stack development skills with modern technologies.

## Features

- **Rich Text Editor** - TipTap-based editor with formatting toolbar (headings, lists, links, code blocks, blockquotes)
- **Live Preview** - Real-time HTML preview with DOMPurify sanitization
- **Authentication** - Complete auth flow: register, confirm email, login, password reset
- **Token Management** - Hybrid refresh strategy (proactive + reactive) for seamless UX
- **Post Management** - Full CRUD with publish/unpublish workflow
- **File Uploads** - S3 presigned URLs for secure image uploads
- **Public Blog** - Public-facing blog with SEO-friendly slugs
- **E2E Testing** - Comprehensive API tests including security scenarios

## Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite 7 + SWC
- TipTap (rich text editor)
- Zustand (state management)
- shadcn/ui + Tailwind CSS v4
- Biome (linting/formatting)

**Backend:**
- AWS SAM (Serverless Application Model)
- Lambda (Node.js 22)
- API Gateway + Cognito Authorizer
- DynamoDB
- S3

## Prerequisites

Before starting, ensure you have installed:

| Tool | Version | Installation |
|------|---------|--------------|
| Node.js | 22.x LTS | [nodejs.org](https://nodejs.org/) |
| pnpm | 9.x | `npm install -g pnpm` |
| AWS CLI | 2.x | [AWS CLI Install](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) |
| AWS SAM CLI | Latest | [SAM CLI Install](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) |
| Docker | Latest | [Docker Install](https://docs.docker.com/get-docker/) |
| Hurl | 4.x+ | [Hurl Install](https://hurl.dev/docs/installation.html) (optional, for E2E tests) |

**AWS Account Requirements:**
- An AWS account with permissions to create: CloudFormation, Lambda, API Gateway, DynamoDB, S3, Cognito, IAM roles
- AWS CLI configured with credentials (`aws configure`)

## Quick Start

### Option A: Frontend Only (No AWS Required)

If you just want to explore the frontend UI without backend:

```bash
# Clone the repository
git clone https://github.com/soy-chrislo/writeflow.git
cd writeflow

# Setup frontend
cd app
cp .env.example .env
pnpm install
pnpm dev
```

The frontend will run at `http://localhost:5173` but API calls will fail without a backend.

### Option B: Full Stack with AWS

```bash
# Clone the repository
git clone https://github.com/soy-chrislo/writeflow.git
cd writeflow

# Run the setup script
chmod +x setup.sh
./setup.sh

# Deploy backend to AWS (see docs/DEPLOY.md for details)
cd backend/writeflow-sam-app
cp samconfig.toml.example samconfig.toml
# Edit samconfig.toml with your preferences
sam build
sam deploy --guided

# Note the outputs (ApiUrl, UserPoolId, etc.)

# Configure frontend with your API URL
cd ../../app
# Edit .env with your ApiUrl from the deploy output
pnpm dev
```

## Project Structure

```
writeflow/
├── app/                          # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── Editor/           # TipTap rich text editor
│   │   │   ├── ui/               # shadcn/ui components
│   │   │   └── posts/            # Post management components
│   │   ├── pages/                # Route pages
│   │   ├── services/             # API client
│   │   ├── store/                # Zustand stores
│   │   ├── hooks/                # Custom React hooks
│   │   └── lib/                  # Utilities
│   └── package.json
│
├── backend/
│   └── writeflow-sam-app/        # AWS SAM backend
│       ├── src/
│       │   ├── handlers/         # Lambda function handlers
│       │   ├── types/            # TypeScript types
│       │   └── utils/            # Shared utilities
│       ├── tests/
│       │   └── e2e/              # Hurl E2E tests
│       ├── template.yaml         # SAM/CloudFormation template
│       └── samconfig.toml.example
│
├── docs/                         # Documentation
│   ├── DEPLOY.md                 # Deployment guide
│   └── ARCHITECTURE.md           # Architecture overview
│
├── setup.sh                      # Setup script
├── docker-compose.yml            # Local development (DynamoDB)
└── README.md                     # This file
```

## Development

### Frontend

```bash
cd app
pnpm dev          # Start dev server (http://localhost:5173)
pnpm build        # Build for production
pnpm lint         # Run ESLint
pnpm preview      # Preview production build
```

### Backend

```bash
cd backend/writeflow-sam-app
sam build                    # Build Lambda functions
sam local start-api          # Run API locally (requires Docker)
sam deploy                   # Deploy to AWS
sam logs -n CreatePostFunction --tail  # View logs
```

### E2E Tests

```bash
cd backend/writeflow-sam-app/tests/e2e

# Setup test environment
cp vars/dev.env.example vars/dev.env
# Edit vars/dev.env with your values

# Create test users
./auth/create-test-user.sh

# Run tests
./run-tests.sh              # All tests
./run-tests.sh --quick      # Smoke tests only
./run-tests.sh --no-auth    # Public endpoints only
./run-tests.sh --report     # Generate HTML report
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/posts` | No | List published posts |
| GET | `/posts/{slug}` | No | Get a published post |
| GET | `/my/posts` | Yes | List user's posts |
| GET | `/my/posts/{slug}` | Yes | Get user's post (including drafts) |
| POST | `/posts` | Yes | Create a post |
| PUT | `/posts/{slug}` | Yes | Update a post |
| DELETE | `/posts/{slug}` | Yes | Delete a post |
| POST | `/upload-url` | Yes | Get presigned URL for content upload |
| POST | `/auth/register` | No | Register new user |
| POST | `/auth/confirm` | No | Confirm registration |
| POST | `/auth/login` | No | Login |
| POST | `/auth/refresh` | No | Refresh tokens |
| POST | `/auth/forgot-password` | No | Request password reset |
| POST | `/auth/reset-password` | No | Reset password |
| POST | `/auth/resend-code` | No | Resend confirmation code |

## Environment Variables

### Frontend (`app/.env`)

```bash
VITE_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/dev
```

### Backend E2E Tests (`backend/writeflow-sam-app/tests/e2e/vars/dev.env`)

See `vars/dev.env.example` for all required variables.

## Documentation

- [Deployment Guide](docs/DEPLOY.md) - Step-by-step AWS deployment
- [Architecture](docs/ARCHITECTURE.md) - System design and decisions

## Troubleshooting

### Common Issues

**Frontend shows "Network Error" or API calls fail:**
- Check that `VITE_API_URL` in `.env` matches your deployed API Gateway URL
- Ensure the backend is deployed and the API Gateway URL is correct

**`sam deploy` fails with permission errors:**
- Ensure AWS CLI is configured with sufficient IAM permissions
- You need permissions for CloudFormation, Lambda, API Gateway, DynamoDB, S3, Cognito, IAM

**`sam local start-api` fails:**
- Ensure Docker is running
- Note: Local API won't have Cognito auth - use deployed backend for auth testing

**E2E tests fail with authentication errors:**
- Ensure test user exists: run `./auth/create-test-user.sh`
- Check that `vars/dev.env` has correct values from your deployment

**Cognito email verification not received:**
- Check spam folder
- Cognito uses Amazon SES in sandbox mode by default (limited to verified emails)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
