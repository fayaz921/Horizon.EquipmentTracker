# 07 – Stories Update for AD-11

This file contains the Claude guidance and Antigravity session that updated the story acceptance criteria and constraints to align with the AD-11 layering rule adopted after the architecture spine was finalised.

---

## Why Stories Needed Updating

After the architecture spine was finalised with AD-11 (strict layering: thin controllers, services hold all logic, no repository pattern, no AutoMapper, hand-written mapping), the existing stories were reviewed for consistency. Several acceptance criteria referenced patterns that AD-11 bans:
- Direct DbContext usage in controllers
- AutoMapper for object mapping
- Repository interfaces

The stories were updated before the first build prompt was sent to the agent so it had accurate acceptance criteria to follow.

---

## Claude Guidance

The build prompt for Epic 1 tells the agent to follow AD-11 exactly:

- Thin controllers: business rules in Services/, DTOs in Dtos/, hand-written mapping extension methods in Mapping/.
- Controllers never return entities and never touch DbContext.
- No repository layer, no AutoMapper.

This must be stated explicitly in every build prompt, not just the architecture doc, because the agent reads the stories and the prompt together.

---

## Updated Story Constraints (Applied to All Epics)

The following constraints were added/clarified across all stories before builds began:

1. Every endpoint lives in a controller class decorated with [ApiController]. No Minimal API route delegates.
2. Controller actions call exactly one service method. No business logic in controllers.
3. Service methods accept and return DTOs or primitives. Never entity types.
4. Mapping between entities and DTOs uses static extension methods in Mapping/{Domain}MappingExtensions.cs. Never AutoMapper.
5. DbContext is constructor-injected into service classes only.
6. RowVersion bytes on SerializedEquipment, CountedInventory, and CheckoutLine. Optimistic concurrency violations return 409 Conflict with a descriptive message.
7. Time comparisons for overdue logic use PKT (UTC+5). Active list computed on every request; no scheduled jobs.

---

## Antigravity Agent Session — Story Validation

The bmad-agent-po skill was asked to review the generated stories against the AD-11 constraints and flag any mismatches.

Key findings resolved:
- Story 1.4: Added explicit note that EquipmentController must not call DbContext directly.
- Story 2.1: Clarified that CheckoutService handles all availability checks and RowVersion comparison.
- Story 3.5: AdminAuthorizationFilter reads X-Admin-PIN header. Filter is registered via [ServiceFilter] not globally, applied per-controller-action.
- Story 4.2: Extension admin PIN check happens inside CheckoutService using PinHasher, not the AdminAuthorizationFilter attribute, because the PIN check is conditional (only when the line is overdue).

---

## Final State

All 30 stories reviewed and updated. Tickets.toml updated in _bmad-output/initiative-equipment-tracker/tickets/. No scope changes — only acceptance-criteria language aligned to AD-11.

Status committed as part of:
  git commit -m "Build Epic 1 backend foundation; add AD-11 layering; update stories"
