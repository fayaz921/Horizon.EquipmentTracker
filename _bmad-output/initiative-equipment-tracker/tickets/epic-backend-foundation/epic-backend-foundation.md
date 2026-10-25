---
type: epic
title: Backend Foundation (Entities, Migrations, Seed)
parent: initiative-equipment-tracker
covers: ["FR-23"]
sources: ["_bmad-output/initiative-equipment-tracker/prd-equipment-tracker/prd-equipment-tracker.md", "_bmad-output/initiative-equipment-tracker/architecture-equipment-tracker/architecture-equipment-tracker.md"]
after: []
refined: true
risk: low
---

# Backend Foundation (Entities, Migrations, Seed)

## Description

Establishes the .NET 8 ASP.NET Core Web API project in `src/Horizon.EquipmentTracker.Api`, sets up SQL Server LocalDB with Entity Framework Core 8, defines all domain entities with optimistic concurrency RowVersion tokens, applies EF Core migrations, and runs an automatic database seeder on application startup.

## Outcome

A running backend API with a fully populated and migrated database, ready to serve equipment, personnel, and checkout transactions.

## Boundaries

- Backend API and EF Core data layer only; no client UI components in this epic.
- Single API project structure (AD-1).
