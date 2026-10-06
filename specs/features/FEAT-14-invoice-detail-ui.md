# Feature: Invoice Detail (UI)
**Owner:** Frontend | **Module:** Invoicing

## Goal
Let a user view one invoice, change its status, and download it as a PDF.

## Scope
- Page: `app/(dashboard)/invoices/[id]/page.tsx`
- Clean printable-style layout of the invoice.
- Status dropdown (unpaid/partial/paid).
- "Download PDF" button calling FEAT-20's endpoint.
