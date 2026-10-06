# AGENTS.md — Frontend (Next.js) — Digital Accounting / Khata System

## Scope
This file applies to the `frontend/` folder only. Deploys to Vercel. A
sibling `backend/AGENTS.md` covers the backend — do not build backend
logic here.

## Tech stack (do not substitute)
Next.js (App Router) + TypeScript + Tailwind CSS.

## No AI in this project
This is a deterministic bookkeeping app — no chat, no AI features. Keep
the UI simple, form-and-table based, like a real ledger/accounting app.

## Build order — full-stack, one feature at a time
Vertical slices pairing backend + frontend specs, one feature at a time,
stop for approval after each. Follow `specs/features/` in `FEAT-XX`
numeric order. Suggested module order: Auth & Business → Party Ledger →
Cash Book → Invoicing → Stock → Staff & Permissions → Reports & Dashboard.

## Core invariant
No business logic here. Balance calculations, permission enforcement,
and PDF generation all happen on the backend. This frontend only sends
requests and renders whatever the backend returns.

## Hard rules
- Never hardcode the backend URL — always read
  `process.env.NEXT_PUBLIC_API_BASE_URL`.
- All API calls go through one client module (`lib/api.ts`), which must
  attach BOTH the `Authorization: Bearer <token>` header AND the
  `X-Business-Id` header (from `lib/business.ts`) on every
  business-scoped request — a request missing either will be rejected by
  the backend.
- Hide/disable create/edit/delete actions for a staff user whose
  can_edit/can_delete permissions don't allow them — but remember this
  is a UX convenience only, the backend enforces it regardless.
- Money amounts always shown with 2 decimal places and a currency
  symbol/label — never raw floats.
- Positive/negative balances should be color-coded consistently
  (e.g. green = they owe you / good cash position, red = you owe them /
  low cash) across every screen — never inconsistent between pages.

## Data dictionary — use exactly these field names, always
Same conventions as backend: `snake_case`, ISO 8601 timestamps, UUID ids.

- **User**: `id, name, email, created_at`
- **Auth response**: `{ "access_token": string, "token_type": "bearer", "user": User }`
- **Business**: `id, name, business_type, created_at`
- **BusinessMember**: `id, business_id, user_id, role ("owner"|"staff"), can_edit, can_delete, created_at`
- **Party**: `id, business_id, name, type ("customer"|"supplier"), phone, current_balance, created_at`
- **LedgerTransaction**: `id, business_id, party_id, type ("credit"|"debit"), amount, description, date, created_by, created_at`
- **CashEntry**: `id, business_id, type ("cash_in"|"cash_out"), amount, category, description, date, created_by, created_at`
- **Invoice**: `id, business_id, party_id, invoice_number, items, total_amount, status ("unpaid"|"partial"|"paid"), due_date, created_at`
- **Product**: `id, business_id, name, sku, unit_price, stock_quantity, created_at`
- **StockAdjustment**: `id, business_id, product_id, change_amount, reason, created_at`

If a feature needs a field not listed here, flag it in your summary so
it can be added to `backend/AGENTS.md` too.

## Keep specs and code in sync (mandatory, every time)
The spec file for a feature is the source of truth for what that feature
is supposed to do — not just a one-time planning document. Whenever you
add, change, or remove behavior in a feature after it's already been
built:
1. **Update that feature's `.md` file in `specs/features/` in the same
   change** — add/edit/remove the relevant bullet points so the spec
   still accurately describes the current behavior.
2. If the change affects what data the frontend expects from the
   backend (new field, changed endpoint, changed response shape), note
   that clearly in the spec so it's visible to whoever is working on the
   backend repo.
3. If a change doesn't fit any existing feature file, create a new
   `FEAT-XX-name.md` for it, following the same format as the others,
   rather than leaving the change undocumented.
4. Never let a spec describe behavior that no longer exists in the code,
   and never let the code do something its spec doesn't mention. Treat a
   stale or missing spec update as an incomplete task, not an optional
   cleanup step.

## Never let a change to one feature break a feature it depends on
Before changing a feature others rely on (e.g. the business-context
header pattern, which every screen depends on), check `specs/features/`
for anything referencing it. Update its spec explicitly if changed.

## What you set up yourself
`.env.example` / local `.env` (`NEXT_PUBLIC_API_BASE_URL`), `.gitignore`,
`package.json`, `Dockerfile` (optional, for local testing only — Vercel
builds natively).

## Deployment — not yet
Do NOT deploy this project to Vercel at this stage. Run locally (`npm
run dev`), pointing `NEXT_PUBLIC_API_BASE_URL` at the local backend
(`http://localhost:8000`). We'll deploy once the feature set is far
enough along — still create `.env.example` and a `Dockerfile` as part of
scaffolding so it's ready later, but don't act on deploying it yet.

## Deployment target (later)
Vercel, once we're ready.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
