---
type: epic
title: Admin
parent: initiative-equipment-tracker
covers: ["FR-19", "FR-21", "FR-22"]
sources: ["_bmad-output/initiative-equipment-tracker/prd-equipment-tracker/prd-equipment-tracker.md", "_bmad-output/initiative-equipment-tracker/architecture-equipment-tracker/architecture-equipment-tracker.md"]
after: ["epic-backend-foundation"]
refined: true
risk: low
---

# Admin

## Description

Implements administrative security and catalog maintenance: Admin PIN verification filter for privileged endpoints, marking assets `Lost`, and CRUD operations for personnel and equipment with soft-deletion integrity.

## Outcome

Privileged operational changes are safeguarded behind the shared Admin PIN, and company catalogs can be managed without breaking historical data integrity.

## Boundaries

- Admin PIN protects catalog edits, mark lost, clear inspection, and overdue extensions (AD-6).
- Soft deletion only (`IsActive = false`) for entities with checkout history.
