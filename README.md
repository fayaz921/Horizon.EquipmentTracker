# Horizon Equipment Tracker

An equipment check-out tracker for Horizon Survey Services (Lahore). It shows who has which piece of equipment, when it is due back, what is overdue, and what has come back damaged. Built for the Solvefy AI Engineer I (Associate) test task.

## Stack

| Part     | Choice                                                                          |
| -------- | ------------------------------------------------------------------------------- |
| Backend  | .NET 8, ASP.NET Core Web API (controllers, services, DTOs), EF Core 8           |
| Database | SQL Server LocalDB, migrations applied and data seeded automatically on startup |
| Frontend | React + Vite + TypeScript + Bootstrap 5.3                                       |
| Repo     | One repo, one backend project and one frontend project                          |

## Requirements

- .NET 8 SDK (`global.json` pins SDK 8, any 8.0.x works)
- Node.js 20 or newer
- SQL Server LocalDB. It ships with Visual Studio, or install SQL Server Express LocalDB. Check with `sqllocaldb info`; it should list `MSSQLLocalDB`.

## Run it

Open two terminals in the repository root.

**Terminal 1: API (http://localhost:5186)**

```
dotnet run --project src/Horizon.EquipmentTracker.Api --launch-profile http
```

*(Alternatively, open `Horizon.EquipmentTracker.sln` in Visual Studio and run the `http` profile).*

On first start it creates the `HorizonEquipmentTracker` database in LocalDB, applies the migration and seeds sample data. Swagger is at http://localhost:5186/swagger.

**Terminal 2: client (http://localhost:5173)**

```
cd src/client
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` to port 5186, so both must be running.

The HTTPS redirect warning in the API log is harmless, because only the HTTP profile is used.

### Demo PINs (sample values, change before any real use)

| Purpose                         | PIN    |
| ------------------------------- | ------ |
| Admin (Saima / Tariq)           | `9999` |
| Approver (Hamza, for the drone) | `1234` |

PINs are stored as SHA-256 hashes in `src/Horizon.EquipmentTracker.Api/appsettings.json`. The server checks them; the UI never displays them.

### Reset the demo data

```
dotnet tool restore
dotnet ef database drop --project src/Horizon.EquipmentTracker.Api --force
```

Then start the API again and it re-seeds.

### If LocalDB gives a startup error

Run `sqllocaldb start MSSQLLocalDB` first. If the instance itself is broken, `sqllocaldb delete MSSQLLocalDB` followed by `sqllocaldb create MSSQLLocalDB` recreates it. Deleting the instance removes every database in it.

## Seed data is sample data

Everything in the seed (7 people, 5 serialized items, 2 kit templates, sample checkouts including one overdue and one from last month) is invented, except the client's numbers: 4 tripods, 6 field tablets, a drone needing Hamza's approval, and two GPS rovers. Do not read it as Horizon's real inventory.

## What is done

- **Who has what:** a board with active checkouts, status pills (Due today / Overdue), counted stock cards, and items needing attention (Lost, Pending approval, Needs inspection).
- **Checkout and return:** multi-line checkouts, a mandatory due date, kit templates that pre-fill the lines, per-line returns including partial returns of counted items.
- **Two item types:** individually tracked items (own status and holder) and counted items (4 tripods, 6 tablets).
- **Approval flow:** the drone requires Hamza's approval. Requests wait in a queue and need his PIN. There is no override. The new rover starts open, and an admin can switch approval on or off per item.
- **Damage:** a Good or Damaged choice is required on return. Damaged items are blocked from checkout until an admin clears them.
- **Overdue and reminders:** overdue starts at 00:00 Pakistan time the day after the due date. A WhatsApp button opens a pre-filled `wa.me` link for Saima to send.
- **Extensions:** the holder can extend before the due date. Once overdue, only an admin can. Each extension is logged.
- **History:** a screen with This month / Last month / custom range, plus person and equipment filters. Checkouts match by date overlap, so long holds appear.
- **Admin:** a server-checked PIN gate, clearing inspection, marking items Lost, and adding or deactivating people and equipment.
- **Concurrency:** equipment, counted pools and checkout lines carry a row-version token. Conflicts return HTTP 409 with a message.

## What I cut, and why

- **Automated WhatsApp messages.** They need a Meta Business account, templates and per-message cost, and cannot be run by a reviewer. The `wa.me` button covers the need.
- **CSV / Excel export.** The client asked to see history on a screen.
- **Real user accounts and roles.** The client said "it's all on trust". A shared Admin PIN and an approver PIN cover the exceptions.
- No authentication or authorization system. Identity is trust-based (name from a list, shared PINs), which matches the client's stated requirement. Real user accounts and RBAC were deliberately cut.
- **QR codes, offline mode, mobile apps.** Not requested.

## Known limitations

- **No automated tests.** The API was checked with real HTTP calls and the UI by hand. A true simultaneous-checkout race was not tested; only the availability rules were.
- **PINs are a deterrent, not security.** They are unsalted SHA-256 hashes of 4-digit values, with no attempt limit.
- **No identity checks without logins.** Anyone can cancel a pending request, and the app cannot confirm the person extending a loan is its holder.
- **UI polish is limited.** It works on desktop and mobile widths, but a density and layout pass was started and rolled back (see below). `AdminTab.tsx` is large and would be split with more time.
- **Single office time zone.** Dates use Pakistan time (UTC+5).

## Project layout

```
src/Horizon.EquipmentTracker.Api   backend (Controllers, Services, Dtos, Mapping, Data, Models)
src/client                         React frontend
docs/                              BMad outputs (brief, PRD, architecture, epics and stories)
conversations/                     every AI conversation, unedited
DECISIONS.md                       assumptions and decisions log
HOURS.md                           hours per day
```

## How I used BMad

I followed the current BMad documentation and repository, not the masterclass video, which is over a year old. What I noticed had changed:

- BMad is now a set of installable **skills** (commands such as `bmad-product-brief`, `bmad-prd`, `bmad-architecture`) run inside a coding tool, not a team of persona agents you talk to in turn.
- It installs with `npx skills add bmad-code-org/BMAD-METHOD --skill '*'` and needs Node, Python and `uv`, not a standalone installer.
- Planning is sized to the work. Epics and stories are written by the Product Owner skill into `tickets.toml` files, not one story file per ticket.
- Outputs go to `_bmad-output/` (copied to `docs/bmad/`), and each skill keeps an append-only `.memlog.md` decision log.

Flow used: product brief, PRD, architecture spine, epics and stories (30 stories), then `bmad-agent-dev` builds per epic. I answered the agents' questions myself and logged my decisions in `DECISIONS.md`. During the build I added AD-11 (services, DTOs and mappers, no repository layer) and moved the PIN check to the server after finding that the first admin gate accepted any PIN.

## AI tools used

- **Antigravity (agent):** BMad skills and all code generation, including the build of each epic and the bug fixes.
- **Claude (claude.ai):** explaining the task, repo and tooling setup, working through each requirements decision, reviewing agent reports, and writing prompts for the agent.

The final frontend redesign attempt was rejected and rolled back. That conversation is kept in `conversations/` because it shows the failed attempt.

## Hours

About 17.5 hours in total. See `HOURS.md` for the per-day breakdown.

## Conversations

All AI conversations are in `/conversations`, unedited: the Antigravity chats (setup, brief, PRD, architecture, epics, each build run and bug fix, including the rolled-back redesign) and the full Claude chat.
