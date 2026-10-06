# Feature: Staff List (UI)
**Owner:** Frontend | **Module:** Staff & Permissions

## Goal
Let an owner see everyone with access to the business.

## Scope
- Page: `app/(dashboard)/staff/page.tsx` (owner only — hidden/blocked for
  staff role).
- Table: name, email, role, can_edit/can_delete badges, joined date.
