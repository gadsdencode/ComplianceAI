# ComplianceAI Technical Notes

## Future Development Considerations

### Database Schema Unification (Low Priority - Future Sprint)

**Current State**: The application uses two separate tables for document storage:
- `documents` - Compliance documents managed by the system
- `user_documents` - User-uploaded documents

**Recommendation**: Consider unifying these into a single `documents` table with a `type` column (`system` | `user`) to:
- Simplify cross-document searching and indexing
- Reduce code duplication in storage layer
- Enable unified document management features
- Improve query performance for mixed document lists

**Migration Plan** (when implemented):
1. Add `type` column to documents table with default `system`
2. Migrate data from `user_documents` to `documents` with `type: 'user'`
3. Update storage layer to use single table with type filtering
4. Update API endpoints to support unified document queries
5. Remove `user_documents` table after successful migration

**Estimated Effort**: 2-3 day sprint
**Dependencies**: None
**Risk**: Low - can be rolled back if issues arise

---

## Architecture Overview

### Route Structure

The API routes are organized into modular files under `server/routes/`:

```
server/routes/
├── index.ts        # Main router aggregator
├── auth.ts         # Authentication routes (via auth.ts)
├── documents.ts    # /api/documents/* endpoints
├── user-documents.ts # /api/user-documents/* endpoints
├── ai.ts           # /api/ai/* endpoints (rate limited)
├── templates.ts    # /api/templates/* endpoints
├── analytics.ts    # /api/dashboard/*, /api/analytics/* endpoints
├── compliance.ts   # /api/compliance-deadlines/* endpoints
├── notifications.ts # /api/notifications/* endpoints
├── users.ts        # /api/users/* endpoints
└── health.ts       # /api/health endpoint
```

### Security Features

- **Rate Limiting**: AI endpoints (`/api/ai/*`) are rate-limited to 10 requests per minute per user
- **Session Security**: `SESSION_SECRET` is required in production environments
- **Role-Based Access**: Routes are protected with role-based middleware

### Performance Optimizations

- **Server-Side Pagination**: Document listings support pagination with `page` and `limit` parameters
- **React Query**: Frontend uses `keepPreviousData` for smooth pagination transitions

