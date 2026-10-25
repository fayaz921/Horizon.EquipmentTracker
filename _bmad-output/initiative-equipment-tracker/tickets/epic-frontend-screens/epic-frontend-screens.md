---
type: epic
title: Frontend Screens
parent: initiative-equipment-tracker
covers: ["FR-1", "FR-5", "FR-6", "FR-8", "FR-9", "FR-12", "FR-13", "FR-14", "FR-15", "FR-17", "FR-18", "FR-19"]
sources: ["_bmad-output/initiative-equipment-tracker/prd-equipment-tracker/prd-equipment-tracker.md", "_bmad-output/initiative-equipment-tracker/architecture-equipment-tracker/architecture-equipment-tracker.md"]
after: ["epic-checkout-and-return", "epic-approvals-and-damage", "epic-overdue-and-history", "epic-admin"]
refined: true
risk: medium
---

# Frontend Screens

## Description

Constructs the mobile-first React SPA (Vite + TypeScript + Bootstrap 5.3) in `src/client`, featuring typed API integration, the operational "Who Has What" dashboard board, checkout modal with survey kit support, return modal with condition check, approvals queue with Hamza's PIN challenge, due date extension dialog, retrospective history table with presets, and Admin panel modal.

## Outcome

A responsive, high-velocity web application providing 10-second checkouts, instant dashboard visibility, damage reporting, WhatsApp reminders, and administrative management.

## Boundaries

- Bootstrap 5.3 vanilla CSS styling without TailwindCSS.
- React server state managed via typed native fetch inside custom hooks (no Redux/Zustand).
