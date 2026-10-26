---
title: "Product Brief: Horizon Equipment Tracker"
status: complete
created: 2026-10-23
updated: 2026-10-23
---

# Product Brief: Horizon Equipment Tracker

## Executive Summary

Horizon Survey Services is a land-surveying firm in Lahore comprising approximately 25 team members, including 14 field surveyors. The company owns high-value specialized surveying equipment—total stations, GPS rovers, drones, tripods, and field tablets. Currently, asset management relies entirely on an informal trust system without centralized records. Field staff pick up gear in the morning and head to client sites across Punjab. This lack of visibility recently led to buying a redundant PKR 1.1M (11 lakh) GPS rover because the primary unit was misplaced in a car boot for three weeks.

The Horizon Equipment Tracker is an internal, mobile-first web application designed to give the business complete real-time visibility into equipment custody, availability, and physical condition. It bridges the gap between field speed and business accountability: surveyors can self-serve checkouts and returns in seconds without passwords, while the office and owner gain an immediate, single-pane operational board showing who holds what, what is overdue, and what requires inspection.

By introducing lightweight guardrails—such as safety gates for restricted equipment (licensed drone operator sign-off), one-tap damage quarantining, and single-click WhatsApp reminders—Horizon eliminates costly duplicate purchases, avoids aborted field visits caused by surprise broken gear, and relieves the office of daily tracking chaos.

---

## The Problem

1. **Zero Visibility & Capital Waste**: With no central tracking, the owner and office staff have no way of knowing where gear is located. In one extreme incident, an 11-lakh PKR GPS rover was presumed lost and repurchased, only to be discovered weeks later in a surveyor's vehicle.
2. **Prolonged Holds & Lack of Return Accountability**: Surveyors routinely hold specialized gear for weeks when it was checked out for a one-day job, blocking other teams from scheduling client surveys.
3. **Operational Bottleneck on Office Administration**: Saima in the office bears the constant friction of taking phone calls from field staff trying to locate needed instruments, having to guess or manually call around.
4. **Silent Equipment Damage**: Damaged equipment is returned silently to storage. The next crew only discovers the malfunction upon arriving at a remote job site, costing Horizon billable survey days and harming client relationships.
5. **High Friction Kills Field Adoption**: Field surveyors operate on tight morning deployment schedules and primarily communicate via WhatsApp. Any cumbersome system requiring account registrations, passwords, or multi-step forms will be rejected, resulting in a return to chaos.

---

## The Solution

The Horizon Equipment Tracker delivers a fast, transparent custody log accessible via mobile browser or office desktop:

- **Seconds-Fast Morning Checkouts**: Surveyors simply select their name from a roster, tap the items or pre-filled kit templates they need, set an expected return date (defaulting to "Today"), and confirm. Checkouts require no passwords.
- **Single-Pane Office Board ("Who Has What")**: Saima and Tariq have instant live visibility into which surveyor holds which asset, remaining counts of shared tools, items due today, and overdue gear.
- **Operator-Gated Approvals for Sensitive Assets**: High-stakes items (such as the drone, which legally requires licensed pilot Hamza's sign-off) enter a `Pending Approval` state upon request and can only be released when the designated approver verifies via PIN.
- **Mandatory Condition Check on Return**: When returning items, selecting `Good` or `Damaged` is required. Flagged items immediately enter a `Needs Inspection` quarantine, preventing subsequent checkouts until cleared by management.
- **Low-Friction Reminders**: Overdue assets feature a one-click `wa.me` WhatsApp reminder button pre-filled with equipment details, enabling Saima to nudge surveyors directly through their preferred communication channel.

---

## What Makes This Different: Trust-First Velocity with Protective Guardrails

Traditional enterprise asset trackers fail in small field operations because they impose heavy IT overhead: user accounts, complex role hierarchies, and rigid audit gates. Horizon Equipment Tracker recognizes that Horizon operates on trust, not military regimentation:

- **Frictionless by Default**: Surveyors self-report without passwords. Saima can log or correct checkouts on anyone’s behalf.
- **Selective Hard Gates Only Where Cost Demands It**: Strict blocking is applied exclusively to high-risk failure points:
  - **Damage**: A reported damaged item is immediately locked from circulation so broken equipment never reaches the field.
  - **Compliance**: Regulated assets cannot leave without verified operator approval.
  - **Lost Equipment**: Management can formally mark an asset as `Lost` to reflect true operational capacity.

---

## Who This Serves

| Persona | Role & Context | Core Needs & Success Signal |
| :--- | :--- | :--- |
| **Mr. Tariq** *(Owner)* | Runs the business; seeks accountability without creating an adversarial culture. | Needs a single screen to see where company assets are, review monthly historical custody logs, and avoid redundant capital expenses. |
| **Saima** *(Office Admin)* | Coordinates logistics and handles incoming calls from the field. | Needs instant answers to "who has Total Station #2?", overdue status badges, and 1-click WhatsApp follow-ups. |
| **Field Surveyors** *(~14 Staff)* | Morning rush to site across Lahore and Punjab; tech-resistant to friction. | Needs 10-second checkouts and 1-tap returns with zero login hurdles. |
| **Hamza** *(Licensed Drone Pilot)* | Sole qualified operator accountable for regulatory compliance. | Needs a PIN-gated sign-off queue to ensure the drone is only flown under authorized supervision. |

---

## Success Criteria

1. **Zero Redundant Capital Purchases**: No asset repurchased due to missing or forgotten custody.
2. **Zero Aborted Field Days from Silent Damage**: 100% of reported damaged items quarantined before subsequent dispatch.
3. **Checkout Speed Compliance**: Average morning checkout takes under 15 seconds per surveyor.
4. **Office Overhead Reduction**: Saima can identify current equipment holders in under 5 seconds without placing phone calls.
5. **Overdue Accountability**: Overdue items visibly flagged on day one of delinquency with immediate WhatsApp contact capabilities.

---

## Scope & Prioritization

### Must-Have (v1 Core)
- Fast checkout and return flows with dual attribution (`recipient` and `logged_by`).
- Live "Who-Has-What" dashboard with real-time status indicators.
- Mandatory expected return dates with quick selectors (`Today`, `Tomorrow`, `Pick Date`) and overdue calculation in Pakistan Standard Time (PKT).
- Per-line return workflow with mandatory condition selection (`Good` vs `Damaged`).
- Immediate checkout lockout for items in `Needs Inspection`, `Out`, `Pending Approval`, or `Lost` states.
- On-screen historical custody table with preset date filters (`Last Month`, `This Month`, `Custom Range`) supporting overlapping custody intervals and filterable by person/item.
- Admin PIN protection for privileged actions (clearing inspection, toggling approval requirements, managing personnel/equipment, setting `Lost` status).
- Auto-seeding of realistic initial data (staff roster, serialized gear, counted items, sample checkouts, demo PINs) on first launch.

### Should-Have (v1 Extensions)
- Per-item approval flag (`RequiresApproval`) with approver PIN verification (Drone on / Hamza; Rover toggleable).
- Counted/bulk inventory tracking for tripods (4) and tablets (6) with available pool calculations and partial returns.
- Saved "Survey Kit" templates that pre-populate multi-item checkout lines without rigid parent-child locks.
- One-click `wa.me` WhatsApp reminder generator with pre-filled reminder text.
- Due date extension flow with logged revision history.

### Explicitly Cut / Out of Scope (v1)
- Automated WhatsApp notifications via WhatsApp Business API / Twilio (avoids Meta business verification, third-party messaging costs, and API keys).
- CSV / Excel export functionality (the client exclusively requested an on-screen visibility solution).
- Individual password-based user authentication and RBAC infrastructure (violates client simplicity constraint).
- Barcode / QR scanner hardware integrations or native mobile application packaging.

---

## Vision & Future Horizons

If the Horizon Equipment Tracker succeeds in eliminating equipment blindness and establishing daily field habits, future iterations may explore:
1. **Automated WhatsApp Bot / Webhook Alerts**: Upgrading from manual `wa.me` links to an automated service when a Meta Business account is established.
2. **Job Site & Client Tagging**: Associating equipment checkouts with specific client project codes or land parcels across Punjab.
3. **Maintenance & Calibration Scheduling**: Tracking total field hours and manufacturer calibration dates for precision optical and GPS sensors.
