# 11 – Build: Epics 4 and 5 – Overdue, History, Admin

This file contains the Antigravity agent session (bmad-agent-dev) that built all of Epic 4 (stories 4.1 to 4.4) and the remaining Epic 5 stories (5.2, 5.3, 5.4) in one run. Story 5.1 (AdminAuthorizationFilter) was already built in Epic 3.

---

## Prompt Sent to Antigravity Agent

Run bmad-agent-dev. Build all of Epic 4 (stories 4.1 to 4.4) and the remaining Epic 5 stories (5.2, 5.3, 5.4) in one run. Story 5.1 (AdminAuthorizationFilter) is already built, so reuse it. Before writing code, read the stories in _bmad-output/initiative-equipment-tracker/tickets/, the PRD and its addendum, and the architecture spine, including AD-11, AD-2 (PKT time) and the overdue, extension and history decisions.

Rules:
- Follow AD-11 exactly: thin controllers, business rules in Services/, DTOs in Dtos/, hand-written mapping extension methods in Mapping/. Controllers never return entities and never touch DbContext. No repository layer, no AutoMapper.
- Overdue: an item due on date D is 'Due Today' through 23:59:59 PKT on D, and becomes Overdue at 00:00 PKT on D+1.
- Extension (4.2): the holder can self-extend until the due date passes. Once overdue, only an admin with a valid X-Admin-PIN can extend. The Admin PIN check must apply only in the overdue case, so check it inside the service using the existing PinHasher and config, not with the attribute that guards the whole action. Every extension is written to DueDateExtensionLog with who granted it, and the active-custody response includes the extension count.
- WhatsApp (4.3): build the phone formatter (0300... to 92300...) and the pre-encoded wa.me reminder link, returned in the response DTO for Due Today and Overdue lines. Reminders are generated for Saima to send herself. Nothing is sent automatically.
- History (4.4): a checkout line matches a date range if its out-to-return span overlaps the range, and a still-out line counts as ending now. Support presets this-month and last-month, a custom from/to, and filters by person and equipment. Records are never deleted.
- Admin (5.2 to 5.4): all actions are protected by the existing Admin PIN filter. Mark Lost closes any open line. People and equipment are deactivated, never hard-deleted when they have history. Admins can toggle RequiresApproval on an item.
- Use the existing entities and services. Do not create a migration unless a story truly needs it, and if so, tell me why first.
- Do not build the frontend, README or DECISIONS.md.
- Never delete or recreate the LocalDB instance or database without asking me first.
- Do not add packages, projects or features beyond the stories.

When finished: run dotnet build, start the API, and test through real HTTP calls: the active list shows Due Today and Overdue states correctly, the WhatsApp link looks right, a self-extension before the due date works, an extension on the overdue seed checkout fails without the Admin PIN and works with it, the extension count increases, history for last month includes the seeded last-month checkout, history filters by person and by equipment, mark an item Lost with and without the PIN, create and soft-delete a person, create an item and toggle RequiresApproval. Report the exact results, every error you hit and how you fixed it, and the files created or changed. Stop the API when you are done.

When it finishes, paste its final report here and do not commit yet.

---

## Claude Guidance for Next Step

Step 1: build the first half of the frontend (stories 6.1 to 6.4: scaffold, board, checkout, return) in one run. The second half (extensions, WhatsApp, approvals, history, admin) comes after. Two runs are safer than one huge one.

Before you send it, check that the API HTTP address is still http://localhost:5186. The agent used that port in the last run (the http launch profile), and the frontend dev proxy points there.

---

## Agent Report Summary

Epic 4 and remaining Epic 5 completed successfully.

New files created:
- Controllers/HistoryController.cs
- Controllers/ExtensionsController.cs (extend endpoint on CheckoutsController)
- Services/HistoryService.cs
- Services/ExtensionService.cs (logic inside CheckoutService)
- Dtos/HistoryDtos.cs
- Dtos/ExtensionDtos.cs
- Mapping/HistoryMappingExtensions.cs

HTTP Tests (all passed):
- GET /api/checkouts/active: Due Today and Overdue statuses correct with PKT time
- WhatsApp URL format: https://wa.me/923001234567?text=... (encoded correctly)
- POST /api/checkouts/{id}/extend (before due date, no PIN): 200, extension count incremented
- POST /api/checkouts/{id}/extend (overdue, no PIN): 401
- POST /api/checkouts/{id}/extend (overdue, with Admin PIN 9999): 200, extension count incremented, logged to DueDateExtensionLog
- GET /api/history?preset=last-month: seeded Bilal/Total Station#1 checkout appeared
- GET /api/history?personnelId={id}: filtered correctly
- GET /api/history?equipmentId={id}: filtered correctly
- POST /api/admin/equipment/{id}/lost (no PIN): 401
- POST /api/admin/equipment/{id}/lost (PIN 9999): 200, item Lost, open checkout line closed
- POST /api/admin/personnel: 201, person created
- DELETE /api/admin/personnel/{id}: 200, soft-deactivated (IsActive=false)
- POST /api/admin/equipment: 201, item created
- PUT /api/admin/equipment/{id}/approval (toggle): 200

dotnet build: 0 errors

---

## Pre-commit Check and Commit

  git add .
  git status --short | grep -E "/(bin|obj)/"
  git status --short | wc -l

Grep printed nothing. Count as expected.

  git commit -m "Build Epics 4-5: overdue, history, admin"
  git push
