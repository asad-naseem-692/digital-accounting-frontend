# Feature: Create Invoice (UI)
**Owner:** Frontend | **Module:** Invoicing

## Goal
Let a user build and send an invoice to a customer.

## Scope
- Page: `app/(dashboard)/invoices/new/page.tsx`
- Customer picker (from parties list, type=customer only).
- Dynamic item rows (description, quantity, unit price) with a live
  computed total shown as the user types.
- Due date picker.
