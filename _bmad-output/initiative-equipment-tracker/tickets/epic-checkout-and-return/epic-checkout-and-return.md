---
type: epic
title: Checkout and Return
parent: initiative-equipment-tracker
covers: ["FR-1", "FR-2", "FR-3", "FR-4", "FR-7", "FR-8"]
sources: ["_bmad-output/initiative-equipment-tracker/prd-equipment-tracker/prd-equipment-tracker.md", "_bmad-output/initiative-equipment-tracker/architecture-equipment-tracker/architecture-equipment-tracker.md"]
after: ["epic-backend-foundation"]
refined: true
risk: medium
---

# Checkout and Return

## Description

Implements REST API endpoints for fast morning checkouts with dual attribution, equipment availability checks, survey kit expansion, status lockouts, and per-line returns supporting partial quantities for counted inventory.

## Outcome

Surveyors and Saima can self-serve equipment checkouts in seconds and return items line-by-line without passwords, with full database referential integrity and concurrency protection.

## Boundaries

- REST endpoints and backend logic only; UI modals reside in Frontend Screens epic.
- Damage inspection quarantine handling is extended in Approvals and Damage epic.
