# 14 – Frontend Density Redesign — REJECTED

This file documents the density and flow redesign prompt that was sent to the Antigravity agent but ultimately rejected because the agent run took too long and the git restore was used to roll back to the working v1 state.

---

## Context

After reviewing the redesign v1 screenshots, the following issues were identified:
- Everything is too big: body text, KPI cards, table cells
- Table is below the fold — user must scroll to see active checkouts
- Checkout dialog starts with wrong section order
- Navigation has a redundant Return link
- Mobile layout wastes space

A density-and-flow improvement prompt was prepared. It was sent to a new Antigravity agent chat.

---

## Prompt Sent to Antigravity Agent

Run bmad-agent-dev. The redesigned frontend in src/client works, but the UX needs a density and flow pass. Keep ALL existing behavior and API calls working (toasts, 409 handling, kit pre-fill with the 'no unit available' message, polling). Do not change the backend. Do not add packages. Do not build stories 6.5 to 6.8 yet. Do these in order.

1. Density and type scale (global, in index.css)
- Body 14px, table text 14px, meta text 12px, page title 22px semibold, section titles 16px semibold, KPI value 22px. Card padding 16px, table cell padding 10px 12px, buttons 36px high on desktop and 44px on mobile. Inputs 16px on mobile to prevent iOS zoom. Container max-width 1320px. Keep Inter, the navy header (56px high), the blue primary and the existing semantic colors. Use soft tinted status pills (light background, dark text, 12px).

2. Board layout: the 'who has what' table is the main job and must be visible without scrolling.
- Desktop (992px and up): compact KPI strip (5 across, about 64px high, 11px uppercase label, small icon), then two columns: left (8/12) has the search box, All/Due today/Overdue chips and the active checkouts table; right (4/12) has a Stock card and a Needs attention card.
- Mobile: KPI strip as horizontally scrollable row of compact chips, then search and chips, then active checkouts as compact cards, then Stock, then Needs attention.
- Acceptance: at 1440x900 and 100% zoom the first table rows are visible without scrolling. At 390x844 at least the first two checkout cards are visible without scrolling.
- KPI behavior: Items out, Due today and Overdue filter the table. Awaiting approval and Needs inspection scroll to and briefly highlight the Needs attention card. No KPI click may ever produce an empty table.
- Table columns: Holder (avatar and name only, no phone number), Item (name; below it a muted line with serial tag and 'since 4:13 pm'; counted items show 'x2'), Due ('Today', 'Tomorrow', or '27 Oct', with the year only if it differs; overdue shows '2 days overdue' in red), Status pill, Action (small Return button). Remove the Qty and Checked Out columns. Sort overdue first, then due today, then by due date. Red left accent only on overdue rows.
- Mobile card: line 1 holder name and status pill; line 2 item name; line 3 muted due text; compact Return button on the right (not full width).

3. Navigation
- Desktop: 56px navy bar with brand, tab links (Board only for now) and primary 'New checkout' button on the right. Remove the separate Return nav link and the Return button from the mobile bottom bar.
- Mobile: no bottom bar. Use circular floating 'New checkout' button (56px) at bottom right.

4. Checkout dialog: fast and flat
- Desktop: centered, max-width 600px. Mobile: full screen. Flat sections with small headings, no boxed cards inside the dialog.
- Section 1 'Who is taking it?': wrapping grid of chips (initials avatar and first name), one tap to select, search field if more than 8 people. One recipient per checkout. Under it, small muted line 'Entered by: same person - Change' that defaults to the same person.
- Section 2 'What are they taking?': small outlined kit shortcut chips, search field, then list of AVAILABLE items as tap-to-toggle rows. Counted items show quantity stepper once selected. Restricted items tagged 'Needs approver approval'. Unavailable items hidden behind 'Show N unavailable' link. Remove 'Add Line' button.
- Section 3 'When is it due?': segmented Today/Tomorrow/Pick a date, default Today.
- Sticky footer: summary ('2 items - due Today') and primary button 'Check out 2 items', disabled until person and at least one item chosen, spinner while submitting. If restricted item selected, show one-line note that it will be requested, not checked out.

5. Return dialog
- Opened from a board row. Desktop: centered, max-width 480px. Mobile: bottom sheet. Lists ALL open lines of that holder as compact rows with a checkbox; the tapped line is pre-checked. Each checked row shows Good/Damaged toggle (required), note field only when Damaged chosen, quantity stepper for counted items (default: full quantity). One primary button 'Return N items', disabled until every checked row has a condition.

6. Verify. Make sure no old API or Vite process is running, then start the API and Vite. Run npm run build and fix all TypeScript errors. Check 1440x900 and 390x844 at 100% zoom against the acceptance criteria above, then run a real checkout and return.

Rules: never delete or recreate the LocalDB instance or database. No PINs in the UI. Do not write to DECISIONS.md or README.md. Report exact results, every error and how you fixed it, and the files created or changed. Stop all processes when done.

---

## What Happened

The agent ran for a long time. After checking git status --short:
  (no output — workspace was clean)

User ran: git restore .

The working v1 state was restored. The density redesign was abandoned to save time.

Decision: proceed directly to building the remaining screens (stories 6.5 to 6.8) in the current v1 look, then handle density improvements only if time allows.

Status: REJECTED — not committed. Workspace restored to commit 6f89698 (Frontend redesign v1 working).

---

## Lesson Learned

Large prompts with 6 changes in one run (density pass + board layout + navigation + checkout dialog + return dialog + verification) take too long and risk losing the working state. Next time: split into smaller runs.

DECISIONS.md note: UI uses one recipient per checkout, although the API allows one per line.
