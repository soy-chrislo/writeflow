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
pnpm lint         # Run ESLint
pnpm preview      # Preview production build locally
npx biome format --write src/  # Format with Biome (config: biome.json)
```

### Backend (`backend/writeflow-sam-app/`)
```bash
cd backend/writeflow-sam-app
sam build         # Build Lambda functions with esbuild
sam local start-api  # Run API locally (requires Docker)
sam deploy        # Deploy to AWS
sam logs -n CreatePostFunction --tail  # Tail Lambda logs
```

### E2E Tests
```bash
cd backend/writeflow-sam-app/tests/e2e
./run-tests.sh              # Run all tests (requires hurl + AWS CLI auth)
./run-tests.sh --no-auth    # Public endpoint tests only
./run-tests.sh --quick      # Smoke tests
./run-tests.sh --report     # Generate HTML report
hurl --test --variables-file vars/dev.env posts/create-post.hurl  # Run single test
```
Note: Auth tests require AWS CLI configured with credentials to obtain Cognito tokens.

## Code Style

### Frontend
- **Formatter**: Biome with tabs and double quotes
- **Path alias**: `@/` maps to `src/` (e.g., `@/components/ui/button`)
- **Styling**: Tailwind CSS v4 with `cn()` utility from `@/lib/utils`
- **State**: Zustand stores in `src/store/`
- **Forms**: react-hook-form + zod validations in `src/lib/validations.ts`

### Backend
- TypeScript Lambda handlers in `src/handlers/`
- Build with esbuild (configured in template.yaml)

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
| Endpoint | Auth | Handler |
|----------|------|---------|
| `GET /posts` | No | listPosts (public posts) |
| `GET /my/posts` | Yes | listPosts (user's posts) |
| `POST /posts` | Yes | createPost |
| `PUT /posts/{slug}` | Yes | updatePost |
| `DELETE /posts/{slug}` | Yes | deletePost |
| `POST /upload-url` | Yes | getUploadUrl |
| `POST /auth/*` | No | register, confirm, login, refresh, etc. |

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
