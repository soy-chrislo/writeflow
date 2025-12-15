# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Writeflow** is a serverless CMS with a rich text editor and live preview. It consists of:
- **Frontend** (`app/`): React SPA with TipTap editor
- **Backend** (`backend/writeflow-sam-app/`): AWS SAM serverless API

## Commands

### Frontend (`app/`)
```bash
cd app
pnpm dev          # Start Vite dev server with HMR
pnpm build        # Type-check (tsc) then build with Vite
pnpm lint         # Run Biome check (linting)
pnpm lint:fix     # Auto-fix lint issues
pnpm format       # Format with Biome
pnpm preview      # Preview production build locally
```

### Backend (`backend/writeflow-sam-app/`)
```bash
cd backend/writeflow-sam-app
sam build         # Build Lambda functions with esbuild
sam local start-api  # Run API locally (requires Docker)
sam deploy        # Deploy to AWS
sam logs -n CreatePostFunction --tail  # Tail Lambda logs

# NPM script shortcuts (preferred)
npm run build           # Bundle OpenAPI + sam build
npm run deploy          # Build then deploy
npm run deploy:guided   # Build then deploy with prompts
npm run test:e2e        # Run all E2E tests
npm run test:e2e:quick  # Run quick E2E tests

# OpenAPI spec (used for documentation)
npm run openapi:bundle  # Bundle OpenAPI spec into openapi.yaml
npm run openapi:lint    # Lint OpenAPI spec

# API documentation (Swagger UI)
npm run docs:build      # Build to docs-dist/
npm run docs:serve      # Build and serve at http://localhost:8080
```

### E2E Tests
```bash
cd backend/writeflow-sam-app/tests/e2e
./run-tests.sh              # Run all tests (requires hurl + AWS CLI auth)
./run-tests.sh --no-auth    # Public endpoint tests only
./run-tests.sh --quick      # Smoke tests
./run-tests.sh --report     # Generate HTML report
hurl --test --variables-file vars/dev.env posts/create-post.hurl  # Run single test
./auth/create-test-user.sh  # Create test user in Cognito (run once before auth tests)
```
Note: Auth tests require AWS CLI configured with credentials to obtain Cognito tokens.

## Code Style

### Frontend
- **Formatter/Linter**: Biome with tabs and double quotes (linting disabled on `src/components/ui/` for shadcn/ui)
- **Path alias**: `@/` maps to `src/` (e.g., `@/components/ui/button`)
- **Styling**: Tailwind CSS v4 with `cn()` utility from `@/lib/utils`
- **State**: Zustand stores in `src/store/`
- **Forms**: react-hook-form + zod validations in `src/lib/validations.ts`

### Backend
- TypeScript Lambda handlers in `src/handlers/`
- Shared types in `src/types/` (Post interface, API response types)
- Utilities in `src/utils/` (response helpers, validation)
- Build with esbuild (configured in template.yaml)
- OpenAPI spec is modular (`openapi/` directory) - bundle with `npm run openapi:bundle` before deploy

## CI/CD

GitHub Actions workflow (`.github/workflows/deploy.yml`) deploys on push to `main`:
- **Frontend**: Cloudflare Pages (lint → build → deploy)
- **Backend**: AWS SAM via OIDC (validate → build → deploy)
- **API Docs**: Cloudflare Pages (Swagger UI)
- Pull requests get preview deployments with URL comments

## Architecture

### Frontend Structure
```
app/src/
├── components/
│   ├── Editor/       # TipTap rich text editor with live preview
│   ├── ui/           # shadcn/ui components (Radix + CVA)
│   ├── auth/         # ProtectedRoute wrapper
│   └── posts/        # Posts list, form, data-table
├── pages/            # Route components
├── store/            # Zustand stores (auth, posts, editor)
├── services/         # API client and service functions
├── hooks/            # Custom React hooks (use-auth, use-posts, use-token-refresh)
└── lib/              # Utilities (cn, sanitize, validations)
```

### Backend Architecture
AWS SAM template (`template.yaml`) defines:
- **API Gateway** with Cognito authorizer
- **Lambda functions**: CRUD for posts, auth handlers, upload URL generation
- **DynamoDB**: Posts table with author-index and status-index GSIs
- **S3**: Content bucket for uploads
- **Cognito**: User pool for authentication

### Key API Endpoints
| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /posts` | No | List published posts only |
| `GET /posts/{slug}` | No | Get a published post |
| `GET /my/posts` | Yes | List user's posts (including drafts) |
| `GET /my/posts/{slug}` | Yes | Get user's post (including drafts) |
| `POST /posts` | Yes | Create a post |
| `PUT /posts/{slug}` | Yes | Update a post |
| `DELETE /posts/{slug}` | Yes | Delete a post |
| `POST /upload-url` | Yes | Get presigned URL for S3 upload |
| `POST /auth/*` | No | Auth endpoints (register, confirm, login, refresh, forgot-password, reset-password, resend-code) |

### API Response Format
Backend handlers wrap all responses in `{ success: true, data: T }` format. The frontend API client (`services/api.ts`) automatically unwraps this, so service functions receive just `T`.

### Authentication Flow
- **Important**: API Gateway uses Cognito User Pool Authorizer which requires **ID tokens** (not access tokens)
- Tokens stored in localStorage via Zustand persist
- Proactive refresh 5 minutes before expiration (`use-token-refresh.ts`)
- Reactive refresh on 401 responses (`services/api.ts`)

### Editor
- TipTap with individual extensions (headings 1-3, lists, links, code blocks, etc.)
- Extensions configured in `components/Editor/extensions.ts`
- Real-time HTML preview via DOMPurify sanitization

### DynamoDB Access Patterns
- **Primary key**: `slug` (HASH) - direct post lookup
- **author-index GSI**: Query posts by `authorId` for `/my/posts`
- **status-index GSI**: Query posts by `status` (published/draft) for `/posts`

## Important Notes

- **Public registration disabled by default**: `PublicRegistrationEnabled=false` - endpoints `/auth/register`, `/auth/confirm`, `/auth/resend-code` return 403. Users must be created via `aws cognito-idp admin-create-user`.
- **No frontend unit tests**: The frontend doesn't have unit tests configured. E2E tests cover backend API only.
- **Local API limitations**: `sam local start-api` won't have working Cognito auth - use deployed backend for auth testing.
- **Content storage**: Post HTML content is stored in S3 (not DynamoDB) to keep items small. The `contentKey` field references the S3 object.