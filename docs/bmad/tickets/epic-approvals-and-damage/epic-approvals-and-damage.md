---
type: epic
title: Approvals and Damage
parent: initiative-equipment-tracker
covers: ["FR-9", "FR-10", "FR-11", "FR-12", "FR-13", "FR-20"]
sources: ["_bmad-output/initiative-equipment-tracker/prd-equipment-tracker/prd-equipment-tracker.md", "_bmad-output/initiative-equipment-tracker/architecture-equipment-tracker/architecture-equipment-tracker.md"]
after: ["epic-checkout-and-return"]
refined: true
risk: medium
---

# Approvals and Damage

## Description

Implements safety and regulatory guardrails: restricted assets (e.g. Drone) transition to `PendingApproval` and require personal Approver PIN verification with strictly no admin override, while returns mandate condition selection (`Good` vs `Damaged`) with instant damage quarantining to `NeedsInspection` and admin-gated inspection clearance.

## Outcome

Broken gear never leaves the office, and regulated equipment cannot be deployed without verified operator sign-off.

## Boundaries

- Approver PIN strictly releases restricted assets; Admin PIN cannot override operator approvals (AD-5).
- Inspection clearance requires Admin PIN (AD-6, AD-7).
