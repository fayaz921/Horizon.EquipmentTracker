---
type: epic
title: Overdue and History
parent: initiative-equipment-tracker
covers: ["FR-14", "FR-15", "FR-16", "FR-17", "FR-18"]
sources: ["_bmad-output/initiative-equipment-tracker/prd-equipment-tracker/prd-equipment-tracker.md", "_bmad-output/initiative-equipment-tracker/architecture-equipment-tracker/architecture-equipment-tracker.md"]
after: ["epic-checkout-and-return"]
refined: true
risk: medium
---

# Overdue and History

## Description

Implements Pakistan Standard Time (PKT) delinquency evaluation, pre- and post-delinquency return date extension logic with immutable audit logging, WhatsApp reminder data generation, and historical custody querying with interval overlap matching and date presets.

## Outcome

Saima and Mr. Tariq have automated visibility into overdue gear with WhatsApp nudges, controlled extension rules, and comprehensive historical custody lookback.

## Boundaries

- Calendar dates strictly evaluated in PKT (UTC+5).
- On-screen historical filtering only; no CSV/Excel export.
