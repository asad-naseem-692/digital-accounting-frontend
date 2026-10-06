# Feature: Business Switcher (UI)
**Owner:** Frontend | **Module:** Auth & Business

## Goal
Let a user create a new business or switch between businesses they
belong to.

## Scope
- A dropdown/menu (in the header) listing all businesses from FEAT-07's
  API, with the user's role in each. Selecting one updates
  `lib/business.ts` and reloads the dashboard for that business.
- "+ Create New Business" option opens a simple form (business name, type).
