# 06 – Epics and Stories

This file contains the bmad-agent-po (Sofia) session that created the 6 epics and 30 stories from the PRD, addendum and architecture spine.

---

## Prompt Sent to Antigravity Agent

Run bmad-agent-po. Create epics and stories from the PRD, addendum and architecture spine in _bmad-output/initiative-equipment-tracker/. Order them as: backend foundation (entities, migrations, seed), checkout and return, approvals and damage, overdue and history, admin, frontend screens. Mark each story must-have, should-have or cut using the scope ranking in the brief. Keep stories small enough to build in an hour or two. Draft in one pass, ask at most 3 questions, and do not write to DECISIONS.md.

---

## Agent Questions and Answers

Question 1: Kit definition
The PRD mentions 'survey kits' that can be checked out as a unit. Should a kit be a predefined bundle with a specific set of serialized items, or should it be a saved multi-item template that pre-fills the checkout screen (a shortcut) without owning the items?

Answer (from Claude guidance): A kit is only a saved template that pre-fills checkout lines, not an entity that owns items. The client never defined kit contents and kits conflict with counted items. A checkout can contain several items. A kit template pre-selects its items in one tap, and the surveyor can remove or add items before confirming.

Question 2: Overdue threshold
The PRD says items should be returned on time but does not define what on time means. Should overdue trigger at midnight PKT the day after the expected return date, or at some other threshold?

Answer: Overdue means past 23:59:59 PKT on the expected return date. An item due on date D is Due Today through 23:59:59 PKT on D, and becomes Overdue at 00:00 PKT on D+1.

Question 3: Approver PIN scope
The PRD says Hamza must approve the drone. Should the approver PIN check apply only to the specific restricted item, or should any approver PIN unlock approval for all restricted items?

Answer: Each restricted item has its own RequiresApproval flag and its own approver reference. The PIN check is per-item: the approver for that item must provide their PIN. Admin PIN (9999) cannot override approvals.

---

## Epic and Story Structure (Output)

### Epic 1: Backend Foundation (must-have)
Stories 1.1 to 1.4

- 1.1 Scaffold API project: dotnet new webapi in src/Horizon.EquipmentTracker.Api using controllers, target net8.0, install EF Core 8, Microsoft.Data.SqlClient, Swashbuckle. Create DbContext with all entity sets. Add appsettings.json with LocalDB connection string.
- 1.2 Create entity models and migration: Personnel, SerializedEquipment, CountedInventory, SurveyKit, SurveyKitItem, Checkout, CheckoutLine, DueDateExtensionLog entities. Create InitialCreate migration.
- 1.3 Seed demo data: 7 personnel (Tariq, Hamza, Bilal, Saima, Usman, Kiran, Adeel), 5 serialized items (GPS Rover x2, Drone, Total Station, Laptop), 2 counted pools (4 Tripods, 6 Tablets), 2 kit templates, 3 sample checkouts including one overdue and one last-month. Apply migrations and seed on startup.
- 1.4 Scaffold Personnel and Equipment read endpoints: GET /api/personnel, GET /api/equipment. Follow AD-11.

### Epic 2: Checkout and Return (must-have)
Stories 2.1 to 2.5

- 2.1 POST /api/checkouts: create a checkout with one or more lines. Validate availability. Return 409 for conflicts using RowVersion.
- 2.2 GET /api/checkouts/active: list all open checkout lines with holder, item, due date, status (Available/CheckedOut/DueToday/Overdue/PendingApproval/NeedsInspection/Lost).
- 2.3 POST /api/returns/{checkoutLineId}: return a single line. Require condition (Good or Damaged). Optional note.
- 2.4 Partial return for counted items: quantity field on return. Available count updates.
- 2.5 GET /api/kits: list kit templates. POST /api/kits/preview: expand a kit into checkout lines using next-available units.

### Epic 3: Approvals and Damage (must-have)
Stories 3.1 to 3.5

- 3.1 Restricted item checkout goes to PendingApproval status, not CheckedOut.
- 3.2 GET /api/approvals/pending: list pending requests. POST /api/approvals/{id}/approve: approve with approver PIN. POST /api/approvals/{id}/cancel: cancel a pending request.
- 3.3 Damaged serialized item on return goes to NeedsInspection, cannot be checked out until cleared.
- 3.4 Damaged counted item on return: quantity goes to QuantityInInspection, reduces availability.
- 3.5 Admin PIN guard filter [AdminAuthorize] for admin-only endpoints. X-Admin-PIN header checked against bcrypt hash in config.

### Epic 4: Overdue, Extensions and History (must-have / should-have)
Stories 4.1 to 4.4

- 4.1 Overdue logic: active list returns DueToday and Overdue statuses based on PKT time. Sort overdue first.
- 4.2 Due-date extension: holder can self-extend before due date passes. Once overdue, requires Admin PIN. Every extension logged to DueDateExtensionLog.
- 4.3 WhatsApp reminder link: pre-encoded wa.me URL for Due Today and Overdue lines, returned in DTO for Saima to send manually.
- 4.4 History: GET /api/history. Presets this-month, last-month, custom from/to. Filter by person and equipment. Overlapping date range logic. Records never deleted.

### Epic 5: Admin (must-have / should-have)
Stories 5.1 to 5.4

- 5.1 AdminAuthorizationFilter: reads X-Admin-PIN header, hashes it, compares to config value. Returns 401 if missing or wrong.
- 5.2 POST /api/admin/equipment/{id}/lost: mark Lost, closes any open line. Admin PIN required.
- 5.3 Personnel management: POST /api/admin/personnel (add), PUT /api/admin/personnel/{id} (edit), DELETE /api/admin/personnel/{id} (soft-deactivate, never hard-delete if history exists).
- 5.4 Equipment management: POST /api/admin/equipment (add), toggle RequiresApproval and approver, soft-deactivate.

### Epic 6: Frontend Screens (must-have)
Stories 6.1 to 6.8

- 6.1 Scaffold React + TypeScript + Vite + Bootstrap 5.3 SPA in src/client. Dev proxy /api to localhost:5186.
- 6.2 Operational board: active checkouts table, KPI strip, counted inventory pools, attention section.
- 6.3 Checkout modal: person picker, item picker with availability, kit shortcuts, due-date segmented control.
- 6.4 Return modal: per-holder lines, Good/Damaged toggle (required), optional note, quantity stepper.
- 6.5 Extension modal and WhatsApp button on board rows.
- 6.6 Approvals tab: pending queue, approve with PIN, cancel.
- 6.7 History tab: presets, filters, table.
- 6.8 Admin tab: PIN gate, inspection clear, equipment/people management.

---

## Scope Ranking Summary

Must-have (deliver): Epics 1-3, 4.1-4.4, 5.1-5.4, 6.1-6.8 core screens
Should-have (deliver if time allows): WhatsApp link (4.3), extension count display (4.2)
Cut (explain in README): real WhatsApp sending, email notifications, role-based login, offline mode
