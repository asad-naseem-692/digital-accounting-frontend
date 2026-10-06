# Feature: Sign In (UI)
**Owner:** Frontend | **Module:** Auth & Business

## Goal
Let an existing user log in.

## Scope
- Page: `app/(auth)/login/page.tsx`
- On success → if the user has exactly one business, go straight to its
  dashboard; if multiple, show the business switcher (FEAT-06); if none,
  show "Create a business" onboarding.
