# Feature: Parties List (UI)
**Owner:** Frontend | **Module:** Party Ledger (Khata)

## Goal
Let a user see all customers/suppliers with their balances at a glance.

## Scope
- Page: `app/(dashboard)/parties/page.tsx`
- List/cards: name, type badge, current balance (color-coded: green if
  they owe you, red if you owe them). Search + type filter.
- Click a party → opens party ledger detail (FEAT-09).
