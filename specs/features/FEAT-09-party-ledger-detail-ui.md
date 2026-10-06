# Feature: Party Ledger Detail (UI)
**Owner:** Frontend | **Module:** Party Ledger (Khata)

## Goal
Show one party's full transaction history like a bank statement, and let
a user add new entries.

## Scope
- Page: `app/(dashboard)/parties/[id]/page.tsx`
- Header: party name, current balance, phone.
- "You Gave" / "You Got" quick-entry buttons (map to credit/debit).
- Transaction list with running balance per row, newest first.
