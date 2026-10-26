# 16 – Bugfix: Extend 415 and Admin PIN Gate

This file contains the Antigravity agent session (bmad-agent-dev) that fixed two bugs found after the stories 6.5-6.8 build, plus the final database reset and cleanup steps.

---

## Bugs Found

### Bug 1: POST /api/checkouts/{lineId}/extend returns 415 Unsupported Media Type
The extend call from the UI (ExtensionModal and apiClient) reached the server without a Content-Type: application/json header. The server refused it with 415.

Root cause: In apiClient.ts, the ...init spread came after the headers object, so any caller passing additional headers wiped out Content-Type.

### Bug 2: Admin tab unlocks with any PIN
The Admin gate only stored whatever was typed and unlocked the tab. It never checked the PIN with the server. The server does correctly check the PIN on every admin action, but the UI gate was fake. A reviewer would notice immediately.

---

## Pre-bugfix Port Cleanup

Two old background processes were still holding ports 5186 (API) and 5173 (Vite):

  taskkill //PID 9648 //F
  taskkill //PID 16688 //F
  netstat -ano | grep -E ":(5173|5174|5186)"

Ports freed.

---

## Git Status Before Bug-fix Prompt

  git log --oneline -3
  6ce215b (HEAD -> main, origin/main) Frontend stories 6.5-6.8 (extend and admin gate bugs known)
  6f89698 Frontend redesign v1 (working)
  2349669 Frontend stories 6.1-6.4 (functional, unstyled)

  git status --short
  (nothing — workspace clean)

---

## Prompt Sent to Antigravity Agent

Run bmad-agent-dev. Fix two bugs in the frontend and add one small backend endpoint. Do not change anything else.

Bug 1: POST /api/checkouts/{lineId}/extend returns 415 Unsupported Media Type when called from the UI (ExtensionModal and the apiClient extend method). Read the extend method in src/client/src/api/apiClient.ts, the ExtensionModal, and CheckoutsController.ExtendDueDate with its request DTO. Find why the request reaches the server without a JSON body or without Content-Type: application/json (also check the header handling when X-Admin-PIN is added), fix it, and make sure the Admin PIN header is sent only for overdue lines.

Bug 2: The Admin tab unlocks with any PIN because it never checks the PIN with the server. Add POST /api/admin/verify-pin to AdminController, protected by the existing [AdminAuthorize] attribute, returning 204 NoContent (a thin action, no service needed, no body). Then make the Admin tab gate call it when the user submits the PIN: on success unlock and keep the PIN in memory only (never localStorage or sessionStorage); on 401 stay locked and show 'Invalid Admin PIN'. Show a spinner or disabled state while checking, and clear the PIN field after a failure.

Rules:
- Backend change is ONLY the verify-pin endpoint. Do not change any other backend file or add a migration. No new packages. Do not restyle anything.
- Never write PIN values into any file, comment or log. For testing only, the demo PINs are: Admin 9999, Approver 1234.
- Do not use a browser subagent or browser automation.
- Never delete or recreate the LocalDB instance or database. Do not write to DECISIONS.md or README.md.

Verify: run npm run build and fix all TypeScript errors. Make sure no old API or Vite process is running (check ports 5173 and 5186 first), then start the API (dotnet run --launch-profile http) and Vite. Through the Vite proxy (http://localhost:5173/api/...) test with real HTTP calls and exact status codes: verify-pin with no header, a wrong PIN and the right PIN (expect 401, 401, 204); extend a Due Today line forward by a day with a JSON body and no PIN (expect 200 and the extension count going up). If any line is overdue, also extend it without the Admin PIN (expect 401) and with it (expect 200). Report exact results, every error and how you fixed it, and the files changed. Stop all processes when done, and confirm ports 5173, 5174 and 5186 are free.

Paste its final report here, and do not commit yet.

---

## Agent Report Summary

Root cause of Bug 1 confirmed: In apiClient.ts the headers was constructed first as a const, then the spread ...init placed after it, allowing callers to accidentally override Content-Type. Fixed by ensuring Content-Type is always set after the spread, so it is never overwritten.

Root cause of Bug 2 confirmed: AdminTab.tsx checked only if the PIN string was non-empty. Added call to POST /api/admin/verify-pin. On 204 success, unlocks tab and stores PIN in component state only. On 401, shows 'Invalid Admin PIN', clears PIN field, stays locked.

Backend: Added POST /api/admin/verify-pin to AdminController with [AdminAuthorize] attribute, returns 204 NoContent.

HTTP test results:
- POST /api/admin/verify-pin (no header): 401
- POST /api/admin/verify-pin (wrong PIN): 401
- POST /api/admin/verify-pin (correct PIN 9999): 204
- POST /api/checkouts/{lineId}/extend (Due Today line, JSON body, no PIN): 200, extension count incremented
- POST /api/checkouts/{overdue lineId}/extend (no PIN): 401
- POST /api/checkouts/{overdue lineId}/extend (PIN 9999): 200, extension count incremented

npm run build: 0 TypeScript errors
Ports 5173, 5174, 5186: all free after agent stopped

Files changed:
- src/Horizon.EquipmentTracker.Api/Controllers/AdminController.cs (added verify-pin endpoint)
- src/client/src/api/apiClient.ts (fixed Content-Type header ordering)
- src/client/src/components/AdminTab.tsx (added server PIN verification)

---

## User Verification

Ran the app:
  Terminal 1: dotnet run --project src/Horizon.EquipmentTracker.Api --launch-profile http
  Terminal 2: cd src/client && npm run dev

Checks:
- Extend button on Due Today line: SUCCESS (no more 415)
- Extension count went up: YES
- Admin tab with wrong PIN: showed 'Invalid Admin PIN', stayed locked: YES
- Admin tab with PIN 9999: unlocked successfully: YES
- Rest of functionality: all working fine

---

## Commit

  git add .
  git status --short | grep -E "/(bin|obj|node_modules|dist)/"
  git status --short | wc -l

  Stdout:
  (no bin/obj lines)
  3

  git commit -m "Fix extend 415 and add server-side admin PIN check"
  git push

  [main b0b7e0e] Fix extend 415 and add server-side admin PIN check
  3 files changed, 83 insertions(+), 14 deletions(-)
  Pushed to https://github.com/fayaz921/Horizon.EquipmentTracker.git
  6ce215b..b0b7e0e main -> main

---

## Database Reset

Dropped the HorizonEquipmentTracker database to clear test-run dirty data. App will recreate and re-seed on next start.

  dotnet tool restore
  dotnet ef database drop --project src/Horizon.EquipmentTracker.Api --force

Output:
  Tool 'dotnet-ef' (version '8.0.32') was restored.
  Build started... Build succeeded.
  Dropping database 'HorizonEquipmentTracker' on server '(localdb)\MSSQLLocalDB'.
  Successfully dropped database 'HorizonEquipmentTracker'.

---

## In-place Verification (instead of clean-clone test)

  git status --ignored --short
  (showed only bin/, obj/, node_modules/, dist/ as !! — no source files ignored)

  dotnet run --project src/Horizon.EquipmentTracker.Api --launch-profile http

Output confirmed:
  - InitialCreate migration applied
  - Seeding: 7 personnel, 5 serialized items, 2 counted pools, 2 kit templates, sample checkouts
  - Now listening on: http://localhost:5186

Frontend started:
  cd src/client && npm run dev
  (http://localhost:5173)

Board loaded with clean demo data. All screens working.

---

## Final Status

All code complete and committed. Conversation logs to save:
- This Claude guidance chat: save as conversations/02-claude-guidance.md (export at end)
- Antigravity agent chats: save as 00, 01, 03-16 in conversations/

Demo PINs (for README):
- Admin PIN: 9999
- Approver PIN (Hamza): 1234
