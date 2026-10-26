# 05 – Architecture: AD-11 Layering

This file contains the Claude conversation segment covering the AD-11 architecture layering decision and the architecture spine finalisation, plus the SDK/global.json decisions.

---

## Antigravity Agent Output — Architecture Linter Result

Linter: ok: true, 0 findings.

Changed Files:

- architecture-equipment-tracker.md: Updated updated date 2026-10-25; AD-1 rule now names [ApiController] controller classes explicitly and bans Minimal API route groups; AD-3 renamed 'Optimistic Concurrency', binds expanded to FR-11/FR-12, RowVersion on three entities (CountedInventory, SerializedEquipment, CheckoutLine), 409 rule + UI surface requirement added; Consistency Conventions gained two new rows (Client State Management, Concurrency Error Surfacing); ERD gained RowVersion field on SerializedEquipment and CheckoutLine.
- .memlog.md: Three Q-resolved decision entries appended (entries 16-18).

No other files were touched. Awaiting your approval to finalize (set status: final, log the spine finalized event).

---

## Claude Guidance

A passing linter only means the document is well-formed, not that it is right. Before approving, skim the spine for:

- No extra projects, services or layers beyond Api and client.
- A global.json or SDK note pinning .NET 9, since your machine has SDK 10.
- A short list of the entities and endpoints. You will want that in the epics step.

Approve it. The changes match what you chose. One small gap: you asked for RowVersion on approval requests, and the agent put it on CheckoutLine instead. It is probably the same row, because the approval state may live on the checkout line. If it does, it is fine. If approval requests are a separate table, ask the agent to add the token there too. Do not hold the approval for this.

About the .NET 9 note: You are right that you do not need to do much. The point was just that dotnet --version printed 10.0.400, so I wanted to be sure the project builds as .NET 9. Visual Studio template list can show .NET 8, 9 and 10, but whether the .NET 9 SDK is installed on your machine is a separate question.

If a 9.0.x SDK is listed, you are fine. When you create the project in Visual Studio, pick .NET 9. The project file will say net9.0, which is the real requirement. If there is no 9.0.x, run: winget install Microsoft.DotNet.SDK.9

With multiple SDKs installed, add a global.json in the repo root to pin SDK 9:

{
"sdk": {
"version": "9.0.100",
"rollForward": "latestFeature"
}
}

rollForward: latestFeature lets any installed 9.0.x SDK satisfy it.

Send the agent:
Approved. Finalize the architecture spine (status: final) and log the event. Do not modify anything else.

Then commit:
git add .
git commit -m "Add architecture and global.json"
git push

---

## SDK Check Result (User)

8.0.414 [C:\Program Files\dotnet\sdk]
10.0.400 [C:\Program Files\dotnet\sdk]

SDK 8 and SDK 10 installed, no SDK 9. Decision: target net8.0 since SDK 9 is not available and SDK 8 is already installed. Updated architecture and PRD to net8.0.

---

## AD-11 Layering Rule Summary

AD-11 establishes the strict layering rule for the ASP.NET Core Web API:

- Controllers are thin: validate input, call service, return DTO. Never touch DbContext, never contain business rules, never return entity objects.
- Services (Services/) contain all business rules, orchestration, data access via DbContext. One service class per domain area.
- DTOs (Dtos/) are plain C# records or classes, one file per domain area. No AutoMapper. Hand-written mapping extension methods in Mapping/.
- No repository layer. DbContext is injected directly into services.
- No Minimal API route groups. All routes use [ApiController] controller classes.
- Concurrency conflicts (RowVersion) return HTTP 409 with a clear message. UI surfaces this to the user.

Decision rationale: keeps the code straightforward and auditable for a small-team app.
