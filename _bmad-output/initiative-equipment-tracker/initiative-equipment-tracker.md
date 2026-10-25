---
type: initiative
title: Horizon Equipment Tracker
parent: none
sources: ["_bmad-output/initiative-equipment-tracker/prd-equipment-tracker/prd-equipment-tracker.md", "_bmad-output/initiative-equipment-tracker/prd-equipment-tracker/addendum.md", "_bmad-output/initiative-equipment-tracker/brief-equipment-tracker/brief-equipment-tracker.md"]
companions: ["_bmad-output/initiative-equipment-tracker/architecture-equipment-tracker/architecture-equipment-tracker.md"]
---

# Horizon Equipment Tracker

## Description

The Horizon Equipment Tracker is an internal, mobile-first operational web application for Horizon Survey Services in Lahore, Pakistan. Built on .NET 8 (ASP.NET Core Web API) and a React Single Page Application, it provides real-time visibility into high-value surveying instruments and bulk field tools without requiring passwords or cumbersome enterprise account overhead.

## Outcome

For Mr. Tariq, Saima, and the field surveying team, zero redundant capital equipment purchases, zero aborted field days due to silent damage, under 15-second morning checkouts, and single-click WhatsApp delinquency nudges.

## Boundaries

- Internal application only; no external client or subcontractor access.
- No user accounts, passwords, or complex RBAC.
- No automated WhatsApp Business API / Twilio services (client-side `wa.me` only).
- No CSV / Excel export; visibility is entirely on-screen.
- No hardware barcode/RFID scanners or native app store packaging.
