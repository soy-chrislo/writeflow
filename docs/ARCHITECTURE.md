# Architecture Overview

This document describes the technical architecture of Writeflow.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    React SPA (Vite)                              │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │   │
│  │  │  Pages   │  │Components│  │  Hooks   │  │  Zustand Store   │ │   │
│  │  │          │  │          │  │          │  │  ┌────────────┐  │ │   │
│  │  │ - Blog   │  │ - Editor │  │ - useAuth│  │  │ auth.ts    │  │ │   │
│  │  │ - Posts  │  │ - Toolbar│  │ - usePosts  │  │ posts.ts   │  │ │   │
│  │  │ - Auth   │  │ - Preview│  │          │  │  │ editor.ts  │  │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  │  └────────────┘  │ │   │
│  │                                            └──────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│                                    │ HTTP/HTTPS                          │
│                                    ▼                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              AWS BACKEND                                 │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      API Gateway (REST)                           │   │
│  │                                                                   │   │
│  │  ┌─────────────────────┐    ┌──────────────────────────────┐    │   │
│  │  │  Cognito Authorizer │◄───│  JWT Validation (ID Token)   │    │   │
│  │  └─────────────────────┘    └──────────────────────────────┘    │   │
│  │                                                                   │   │
│  │  Routes:                                                          │   │
│  │  ├── /posts (GET, POST)                                          │   │
│  │  ├── /posts/{slug} (GET, PUT, DELETE)                            │   │
│  │  ├── /my/posts (GET)                                             │   │
│  │  ├── /my/posts/{slug} (GET)                                      │   │
│  │  ├── /upload-url (POST)                                          │   │
│  │  └── /auth/* (POST)                                              │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│                                    ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      Lambda Functions                             │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐    │   │
│  │  │ createPost │ │  getPost   │ │ updatePost │ │ deletePost │    │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘    │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐                    │   │
│  │  │ listPosts  │ │getUploadUrl│ │  auth/*    │                    │   │
│  │  └────────────┘ └────────────┘ └────────────┘                    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│           │                │                    │                        │
│           ▼                ▼                    ▼                        │
│  ┌──────────────┐  ┌──────────────┐   ┌──────────────────┐             │
│  │   DynamoDB   │  │      S3      │   │     Cognito      │             │
│  │              │  │              │   │                  │             │
│  │ Posts Table  │  │Content Bucket│   │   User Pool      │             │
│  │ - slug (PK)  │  │ - HTML files │   │ - Users          │             │
│  │ - authorId   │  │              │   │ - Auth flows     │             │
│  │ - status     │  │              │   │                  │             │
│  │ - contentKey │  │              │   │                  │             │
│  └──────────────┘  └──────────────┘   └──────────────────┘             │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Model

### DynamoDB: Posts Table

```typescript
interface Post {
  slug: string;        // Partition Key - URL-friendly identifier
  title: string;
  authorId: string;    // Cognito user sub (UUID)
  status: 'draft' | 'published';
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
  publishedAt?: string;
  contentKey: string;  // S3 key: posts/{authorId}/{slug}.html
}
```

**Global Secondary Indexes:**
- `author-index`: Query posts by authorId
- `status-index`: Query posts by status (published/draft)

**Design Decisions:**

1. **Slug as Primary Key**: Enables direct lookup by URL without joins or secondary lookups. Trade-off: changing slug requires creating new item.

2. **Content in S3**: HTML content stored separately to keep DynamoDB items small and enable direct S3 serving for published content.

3. **No User Table**: User data lives in Cognito. We only store `authorId` references.

### S3: Content Structure

```
writeflow-content-{env}-{account}/
└── posts/
    └── {authorId}/
        └── {slug}.html
```

Content is public-readable (for published posts). Access control is handled at the application layer.

## Authentication Flow

```
┌──────────┐     ┌─────────────┐     ┌─────────────┐     ┌──────────┐
│  Client  │     │ API Gateway │     │   Cognito   │     │  Lambda  │
└────┬─────┘     └──────┬──────┘     └──────┬──────┘     └────┬─────┘
     │                  │                   │                  │
     │ 1. Login Request │                   │                  │
     │ ─────────────────►                   │                  │
     │                  │ 2. Authenticate   │                  │
     │                  │ ──────────────────►                  │
     │                  │                   │                  │
     │                  │ 3. Tokens         │                  │
     │                  │ ◄──────────────────                  │
     │ 4. ID + Refresh  │                   │                  │
     │ ◄─────────────────                   │                  │
     │                  │                   │                  │
     │ 5. API Request   │                   │                  │
     │   + ID Token     │                   │                  │
     │ ─────────────────►                   │                  │
     │                  │ 6. Validate Token │                  │
     │                  │ ──────────────────►                  │
     │                  │                   │                  │
     │                  │ 7. Claims         │                  │
     │                  │ ◄──────────────────                  │
     │                  │                   │                  │
     │                  │ 8. Invoke         │                  │
     │                  │ ──────────────────────────────────────►
     │                  │                   │                  │
     │                  │                   │   9. Process     │
     │                  │                   │      Request     │
     │                  │                   │                  │
     │ 10. Response     │ ◄──────────────────────────────────────
     │ ◄─────────────────                   │                  │
```

**Token Usage:**
- **ID Token**: Sent in `Authorization: Bearer <token>` header for API requests
- **Refresh Token**: Used to get new tokens when ID token expires
- **Access Token**: Not used (Cognito authorizer uses ID token)

**Token Refresh Strategy:**
1. **Proactive**: Frontend schedules refresh 5 minutes before expiration
2. **Reactive**: On 401 response, attempt refresh and retry request

## Content Upload Flow

```
┌──────────┐     ┌─────────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │   Lambda    │     │    S3    │     │ DynamoDB │
└────┬─────┘     └──────┬──────┘     └────┬─────┘     └────┬─────┘
     │                  │                 │                 │
     │ 1. POST /upload-url               │                 │
     │     { slug }     │                 │                 │
     │ ─────────────────►                 │                 │
     │                  │                 │                 │
     │                  │ 2. Generate     │                 │
     │                  │    presigned URL│                 │
     │                  │ ────────────────►                 │
     │                  │                 │                 │
     │ 3. { uploadUrl,  │                 │                 │
     │      contentKey }│                 │                 │
     │ ◄─────────────────                 │                 │
     │                  │                 │                 │
     │ 4. PUT content   │                 │                 │
     │    directly to S3│                 │                 │
     │ ───────────────────────────────────►                 │
     │                  │                 │                 │
     │ 5. POST /posts   │                 │                 │
     │    { title,      │                 │                 │
     │      contentKey }│                 │                 │
     │ ─────────────────►                 │                 │
     │                  │                 │                 │
     │                  │ 6. Validate     │                 │
     │                  │    contentKey   │                 │
     │                  │    prefix       │                 │
     │                  │                 │                 │
     │                  │ 7. Create post  │                 │
     │                  │ ─────────────────────────────────►│
     │                  │                 │                 │
     │ 8. { post }      │                 │                 │
     │ ◄─────────────────                 │                 │
```

**Security:**
- Presigned URLs expire after 5 minutes
- Backend validates `contentKey` prefix matches `posts/{authorId}/`
- Content is HTML sanitized on frontend before upload

## Frontend Architecture

### State Management (Zustand)

```
┌─────────────────────────────────────────────────────────────┐
│                      Zustand Stores                          │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   auth.ts       │  │   posts.ts      │  │  editor.ts  │ │
│  │                 │  │                 │  │             │ │
│  │ - user          │  │ - posts[]       │  │ - content   │ │
│  │ - idToken       │  │ - currentPost   │  │ - isDirty   │ │
│  │ - refreshToken  │  │ - isLoading     │  │             │ │
│  │ - isAuthenticated                    │  │             │ │
│  │                 │  │                 │  │             │ │
│  │ Actions:        │  │ Actions:        │  │ Actions:    │ │
│  │ - setTokens()   │  │ - fetchPosts()  │  │ - setContent│ │
│  │ - updateTokens()│  │ - createPost()  │  │ - reset()   │ │
│  │ - logout()      │  │ - deletePost()  │  │             │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│           │                    │                  │         │
│           └────────────────────┴──────────────────┘         │
│                              │                               │
│                    localStorage (persist)                    │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
App
├── Layout
│   ├── AppSidebar
│   └── Main Content
│       ├── Dashboard (/)
│       │   └── Editor
│       │       ├── Toolbar
│       │       └── Preview
│       ├── PostsPage (/posts)
│       │   └── DataTable
│       │       └── DeleteDialog
│       ├── PostView (/posts/:slug)
│       └── Blog (/blog)
└── Auth Pages (/auth/*)
    ├── Login
    ├── Register
    ├── ConfirmCode
    ├── ForgotPassword
    └── ResetPassword
```

### API Client

The `api.ts` client handles:
1. Automatic token injection in headers
2. Response unwrapping (`{ success: true, data: T }` → `T`)
3. Reactive token refresh on 401
4. Request queuing during refresh

```typescript
// Usage
const posts = await api.get<Post[]>('/my/posts');
const newPost = await api.post<Post>('/posts', { title, contentKey });
```

## Security Considerations

### Current Implementation

| Aspect | Status | Notes |
|--------|--------|-------|
| Authentication | Cognito JWT | Validated by API Gateway |
| Authorization | Owner-based | Backend checks `authorId` matches token `sub` |
| Input Validation | Frontend | DOMPurify for HTML sanitization |
| CORS | Open (`*`) | Acceptable for public API |
| HTTPS | API Gateway | Automatic with AWS endpoints |
| Token Storage | localStorage | Trade-off: XSS vulnerable but necessary for SPA |

### Recommendations for Production

1. **Backend Sanitization**: Add HTML sanitization in Lambda handlers
2. **Rate Limiting**: Configure API Gateway throttling
3. **WAF**: Add AWS WAF for common attack protection
4. **CORS Restriction**: Limit to specific domains
5. **CSP Headers**: Add Content-Security-Policy via CloudFront

## Scalability

### Current Limits

| Resource | Limit | Notes |
|----------|-------|-------|
| Lambda concurrent executions | 1000 (default) | Can request increase |
| API Gateway requests | 10,000/sec | Per region |
| DynamoDB | On-demand | Auto-scales |
| S3 | Unlimited | Per-object 5GB limit |

### Scaling Strategies

1. **Read-heavy workload**: Add CloudFront caching for public endpoints
2. **Write-heavy workload**: DynamoDB handles automatically with on-demand
3. **Global users**: Multi-region deployment or CloudFront edge caching
4. **Large content**: Already optimized with S3 direct upload

## Cost Structure

```
Monthly cost estimate for low traffic (~1000 requests/month):

Lambda:        $0.00  (Free tier: 1M requests)
API Gateway:   $0.00  (Free tier: 1M requests)
DynamoDB:      $0.00  (Free tier: 25 WCU/RCU)
S3:            $0.01  (Storage + requests)
Cognito:       $0.00  (Free tier: 50K MAU)
────────────────────
Total:        ~$0.01/month
```

Costs scale linearly with usage. Monitor with AWS Cost Explorer.
