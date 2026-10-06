# Feature: Auth Token & Business Context Storage (UI)
**Owner:** Frontend | **Module:** Auth & Business

## Goal
Keep the session AND the currently-selected business available, and
attach both to every API call.

## Scope
- `lib/auth.ts`: token storage.
- `lib/business.ts`: currently-selected business id storage.
- `lib/api.ts`: attaches `Authorization: Bearer <token>` AND
  `X-Business-Id: <id>` headers to every business-scoped request.
