# 08 – Build: Epic 1 – Backend Foundation

This file contains the Antigravity agent session (bmad-agent-dev) that built all four stories of Epic 1.

---

## Prompt Sent to Antigravity Agent

Run bmad-agent-dev. Build all four stories of Epic 1 (Backend Foundation, stories 1.1 to 1.4) in one run. Read the epic stories in _bmad-output/initiative-equipment-tracker/tickets/, plus the PRD, its addendum and the architecture spine, before writing any code.

Rules:
- Target .NET 8. Create the project in src/Horizon.EquipmentTracker.Api with dotnet new webapi, using controllers (not Minimal APIs). global.json already pins SDK 8.
- Database: SQL Server LocalDB. Put this in appsettings.json: Server=(localdb)\MSSQLLocalDB;Database=HorizonEquipmentTracker;Trusted_Connection=True;TrustServerCertificate=True
- Install the dotnet-ef tool if it is missing (version 8.x), and create the InitialCreate migration.
- The app must apply migrations and seed automatically on startup, with no manual database steps.
- Seed data is sample data and must be labelled as such. Demo PINs live in appsettings.json as hashes, not in code. Document them for the README but do not put them in any UI.
- Do not add features, projects or packages beyond the stories. Do not write to DECISIONS.md or README.md.
- When done, run dotnet build, run the API once to confirm migration and seeding work, and report the exact results, including any errors you hit and how you fixed them.

When it finishes:
- Paste its final report here, errors included.
- Do not commit yet.

---

## Pre-commit Check (Claude Guidance)

Before committing, stage everything and look for build folders:

  git add .
  git status --short | grep -E "/(bin|obj)/"

The grep should print nothing. If it prints any lines, do not commit.

  git status --short | wc -l

---

## User Output — Git Status Check

  Rizwan computers@M-Fayaz MINGW64 /e/horizon-equipment-tracker (main)
  $ sqllocaldb info
  MSSQLLocalDB
  ProjectModels

  $ git status (Changes not staged for commit — source files from agent)
  $ git add .
  $ git status --short | grep -E "/(bin|obj)/"
  (no output — no bin/obj files staged)
  $ git status --short | wc -l
  (file count shown)

The grep printed nothing, so no bin/ or obj/ files are staged. LF/CRLF warnings are harmless Windows line-ending notices.

---

## Commit

  git commit -m "Build Epic 1 backend foundation; add AD-11 layering; update stories"
  git push

---

## Agent Report Summary

Epic 1 completed successfully:
- Project scaffolded at src/Horizon.EquipmentTracker.Api using dotnet new webapi --controllers
- Packages installed: Microsoft.EntityFrameworkCore.SqlServer 8.x, Microsoft.EntityFrameworkCore.Tools, Swashbuckle.AspNetCore
- DbContext: HorizonDbContext with entity sets for Personnel, SerializedEquipment, CountedInventory, SurveyKit, SurveyKitItem, Checkout, CheckoutLine, DueDateExtensionLog
- Entities created with all required fields, navigation properties, and RowVersion on SerializedEquipment, CountedInventory, CheckoutLine
- InitialCreate migration created
- DatabaseSeeder seeds 7 personnel, 5 serialized items, 2 counted pools, 2 kit templates, 3 sample checkouts (1 active, 1 overdue, 1 last-month returned)
- Program.cs applies migrations and seeds on startup
- GET /api/personnel and GET /api/equipment implemented following AD-11
- dotnet build: succeeded, 0 errors
- API started and confirmed: InitialCreate migration applied, seeding completed, listening on http://localhost:5186

Demo PINs (hashed in appsettings.json):
- Admin PIN: 9999
- Approver PIN (Hamza): 1234
