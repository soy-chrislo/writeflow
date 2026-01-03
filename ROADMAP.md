# Writeflow Roadmap

## Project Overview

Writeflow is a serverless CMS with a rich text editor and live preview. This roadmap outlines the planned development phases and features.

## Development Phases

### Phase 0: Security First (Critical Issues)
*Must resolve these before any other features*

| # | Feature | Target Date | Status | Priority |
|---|---------|-------------|---------|----------|
| 1 | Fix CORS to specific domains | Jan 4, 2026 | 🔄 TODO | 🚨 Critical |
| 2 | Add HTML sanitization in backend | Jan 7, 2026 | 🔄 TODO | 🚨 Critical |
| 3 | Enable DynamoDB backups (PointInTimeRecovery) | Jan 10, 2026 | 🔄 TODO | 🚨 Critical |
| 4 | Configure rate limiting in API Gateway | Jan 13, 2026 | 🔄 TODO | 🔥 High |

### Phase 1: Solid Foundations (Quick Wins)
*High value, low complexity features*

| # | Feature | Target Date | Status | Priority |
|---|---------|-------------|---------|----------|
| 5 | Implement CI/CD pipeline | Jan 16, 2026 | 🔄 TODO | 💎 Essential |
| 6 | Configure CDN + cache headers | Jan 19, 2026 | 🔄 TODO | 💎 Essential |
| 7 | Add soft deletes for posts | Jan 22, 2026 | 🔄 TODO | 💎 Essential |
| 8 | Implement auto-save for drafts | Jan 25, 2026 | 🔄 TODO | 💎 Essential |
| 9 | Media upload in TipTap editor | Jan 28, 2026 | 🔄 TODO | 💎 Essential |
| 10 | Tags and categories system | Jan 31, 2026 | 🔄 TODO | 💎 Essential |
| 11 | SEO meta tags and Open Graph | Feb 3, 2026 | 🔄 TODO | 💎 Essential |
| 12 | Basic search in frontend | Feb 6, 2026 | 🔄 TODO | 💎 Essential |

### Phase 2: Engagement & Monetization
*Advanced features requiring WebSocket and payment integration*

| # | Feature | Target Date | Status | Priority |
|---|---------|-------------|---------|----------|
| 13 | Real-time comments (WebSockets) | TBD | 📋 TODO | 🚀 Strategic |
| 14 | Basic analytics (views, engagement) | TBD | 📋 TODO | 🚀 Strategic |
| 15 | Stripe subscriptions (premium content) | TBD | 📋 TODO | 🚀 Strategic |
| 16 | Revision system and versioning | TBD | 📋 TODO | 🚀 Strategic |

### Phase 3: AI & Differentiation
*Advanced AI-powered features*

| # | Feature | Target Date | Status | Priority |
|---|---------|-------------|---------|----------|
| 17 | AI writing assistant (Claude API) | TBD | 📋 TODO | 🔮 Innovation |
| 18 | Semantic search with embeddings | TBD | 📋 TODO | 🔮 Innovation |
| 19 | Content recommendations | TBD | 📋 TODO | 🔮 Innovation |
| 20 | Automatic SEO optimization | TBD | 📋 TODO | 🔮 Innovation |

### Phase 4: Enterprise & SaaS
*Multi-tenancy and advanced features*

| # | Feature | Target Date | Status | Priority |
|---|---------|-------------|---------|----------|
| 21 | Multi-tenant architecture | TBD | 📋 TODO | 🏢 Enterprise |
| 22 | Advanced roles and permissions | TBD | 📋 TODO | 🏢 Enterprise |
| 23 | White-labeling options | TBD | 📋 TODO | 🏢 Enterprise |
| 24 | Headless APIs (GraphQL) | TBD | 📋 TODO | 🏢 Enterprise |

## Current Focus

**Phase 0 (Security) and Phase 1 (Foundations)** are the immediate priority. Features in Phase 2+ will be prioritized based on user feedback and business requirements.

## Implementation Notes

### Security Requirements (Phase 0)
- **CORS**: Restrict `Access-Control-Allow-Origin` to specific domains
- **HTML Sanitization**: Add DOMPurify or similar in Lambda handlers
- **Backups**: Enable PointInTimeRecovery in DynamoDB table
- **Rate Limiting**: Configure throttling limits in API Gateway

### Foundation Features (Phase 1)
- **CI/CD**: GitHub Actions with automated testing and deployment
- **CDN**: CloudFront with appropriate cache headers
- **Soft Deletes**: Add `deletedAt` timestamp instead of permanent deletion
- **Auto-save**: Periodic draft saving to prevent data loss
- **Media Upload**: Direct S3 upload integration in TipTap editor
- **Tags/Categories**: Metadata system for content organization
- **SEO**: Meta descriptions, OG tags, structured data
- **Search**: Client-side filtering and search functionality

## Dependencies

- **AI Features**: Require Claude API keys and cost management
- **Search**: May need OpenSearch Serverless for advanced search
- **Multi-tenancy**: Requires significant architectural changes
- **Payment Integration**: Stripe account and webhook configuration

## Legend

| Status | Meaning |
|--------|---------|
| ✅ Done | Feature completed |
| 🔄 TODO | Work in progress or planned |
| 📋 TODO | Backlogged for future consideration |
| 🚨 Critical | Security/stability blocking issue |
| 🔥 High | Important but not blocking |
| 💎 Essential | Core functionality |
| 🚀 Strategic | Business value driver |
| 🔮 Innovation | Competitive advantage |
| 🏢 Enterprise | Scaling requirement |

---

*Last Updated: January 2, 2026*