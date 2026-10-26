# Decisions Log

Horizon Equipment Tracker. Each entry covers a point where the client input was unclear, missing or contradictory. Seed data in the app is sample data, not Horizon's real inventory.

## 1. Open checkout vs. the drone needing approval

- **The gap:** Tariq says "Anyone in the team can take anything, we don't have a system, it's all on trust", then writes "The drone is different, that needs Hamza's approval before anyone takes it, he is the only licensed operator." These contradict.
- **What I decided:** Approval is a per-item setting (`RequiresApproval` plus a named approver). Everything is open except the drone, which is set to Hamza. A request for a restricted item goes to a Pending Approval queue, and Hamza approves it from the Approvals tab with his PIN. There is no admin override. If Hamza is unavailable, the request stays pending.
- **The alternative:** Hardcode the drone rule, apply rules by category, or let an admin override the approval.
- **Why this one:** Both statements stay true: open by default, with exceptions. Only a licensed operator should authorise the drone, so no override and no auto-approval.
- **What would change my mind:** More items becoming restricted (category rules), Hamza saying the queue slows the morning (inline PIN shortcut), or Tariq naming a backup approver.

## 2. The new rover's approval is undecided

- **The gap:** "Same for the new rover maybe, I will decide later."
- **What I decided:** The new rover starts open (`RequiresApproval` off). An admin can switch it on in the Admin tab without a code change.
- **The alternative:** Restrict it by default.
- **Why this one:** "Maybe" is not a rule. Blocking a rover on an unconfirmed policy adds friction for nothing, and the toggle makes the later decision free.
- **What would change my mind:** Tariq confirming the rover is restricted.

## 3. Who records a checkout, and how identity works

- **The gap:** "The boys come in the morning, they pick up what they need, they go to site." and "If it takes more than a few seconds they won't do it." Nothing says who records the checkout or how people identify themselves.
- **What I decided:** No login. Staff pick a name from a list. Each checkout stores who entered it and who holds each item, so Saima can log or correct a checkout for anyone and the record stays honest.
- **The alternative:** Saima-only logging, or individual accounts with passwords.
- **Why this one:** Speed and trust are the stated requirements. Accounts would break "a few seconds" and "I don't want to make it like the army".
- **What would change my mind:** Records being disputed or blamed on the wrong person (per-person PINs), or staff not logging for themselves (Saima-led logging).

## 4. Admin actions and who may do them

- **The gap:** "Anyone in the team can take anything". Nothing says who may clear a damaged item, edit equipment or people, or extend an overdue loan.
- **What I decided:** One shared Admin PIN (Saima and Tariq) protects those actions. The server checks it on every admin call (`X-Admin-PIN` header). PINs are stored as SHA-256 hashes in `appsettings.json`, and the demo values are in the README.
- **The alternative:** No protection, or real accounts with roles.
- **Why this one:** Everyday use stays open, but anything that undoes a safeguard (damage block, approval) should not be open to everyone. Accounts conflict with the trust culture.
- **What would change my mind:** The PIN leaking or being abused (individual accounts). The PIN is a deterrent, not real security, and unsalted SHA-256 on a 4-digit PIN is weak.

## 5. What a "survey kit" is

- **The gap:** "Sometimes they take the whole survey kit, sometimes just one piece." Kit contents are never defined.
- **What I decided:** A kit is a saved template that pre-fills a checkout with the next available unit of each type. Every item is still its own line, so returns and damage work per item. If no unit is available, that line is left out with a message. Kit contents in the seed data are sample data.
- **The alternative:** A kit as an entity that owns its items and has one status.
- **Why this one:** Contents were never given, and a kit that owns items breaks on partial returns and conflicts with counted items.
- **What would change my mind:** Tariq saying kits are fixed and always travel as one unit.

## 6. Counted items vs. tracked items

- **The gap:** "We have 4 tripods and 6 field tablets, those are not individually tracked, we just need to know how many are left."
- **What I decided:** Two item types. Individually tracked items have one row per unit with its own status and holder. Counted items (tripods, tablets) have one row with total, out and in-inspection quantities, and available = total - out - in inspection. Counted items support partial returns.
- **The alternative:** Track every tripod and tablet individually, or treat everything as counted.
- **Why this one:** It follows the client's wording and avoids the work of tagging unit-level gear.
- **What would change my mind:** Tripods or tablets going missing individually.

## 7. Return dates, "on time" and when something is overdue

- **The gap:** "I want it back on time, people keep things for weeks when they needed it for one day." There is no definition of "on time".
- **What I decided:** The due date is mandatory and chosen at checkout (Today by default, Tomorrow, or a picked date). An item is overdue from 00:00 Pakistan time (UTC+5) on the day after the due date. Timestamps are stored in UTC and overdue is computed in Pakistan time.
- **The alternative:** A fixed rule (for example everything due in 24 hours), or an 18:00 office-hours cutoff.
- **Why this one:** The surveyor knows the job length, and "needed it for one day" suggests Today as the default. The due date is a date, not a time, so an item due Today stays valid for the whole day. I did not invent an office-hours cutoff.
- **What would change my mind:** Saima needing the overdue list before closing time (a configurable cutoff).

## 8. Extending a due date

- **The gap:** Nothing says whether a holder can push the date back. Without a rule, one tap would defeat "back on time".
- **What I decided:** The holder can extend until the due date passes, with no PIN. After that, only Saima or an admin with the Admin PIN can extend. Every extension is logged (who granted it, old and new date) and the extension count shows on the board.
- **The alternative:** Anyone can extend at any time with a visible count, or extensions only through the office.
- **Why this one:** Extending before the deadline is the common case and stays frictionless, while overdue loans get a conversation.
- **What would change my mind:** Saima being flooded with requests, or surveyors blocked on remote sites (switch to self-extend with a visible count). With no logins, the app cannot confirm the person extending is the holder.

## 9. Damage reporting at return

- **The gap:** "sometimes equipment comes back damaged and nobody says anything until the next person takes it to site and finds out. That has cost us two days of client work this year." No flow is specified.
- **What I decided:** Return requires a Good or Damaged choice. The note is optional. A damaged serialized item moves to Needs Inspection and cannot be checked out until an admin clears it. Damaged counted units move to an in-inspection count and reduce what is available.
- **The alternative:** Warn the next person but still allow checkout.
- **Why this one:** Warnings are what already fails ("nobody says anything"), and the owner named the cost. Blocking is stricter than the trust culture, and I accept that.
- **What would change my mind:** Trivial scratches locking up gear (a "minor, still usable" option or warn-only).

## 10. Lost equipment

- **The gap:** "Last month we bought a second GPS rover for eleven lakh because we thought ours was lost." The input has no lost status.
- **What I decided:** A Lost status that only an admin can set. It closes any open checkout and keeps the item out of circulation.
- **The alternative:** No lost status; leave items as "out" until they reappear.
- **Why this one:** Items that cannot be found should not look checked out forever, or be checkable again.
- **What would change my mind:** If the client never uses it, remove it to keep the model small.

## 11. Reminders and WhatsApp

- **The gap:** "It would be good if the system reminds people. We mostly use WhatsApp for everything here."
- **What I decided:** Due Today and Overdue badges on the board, plus a WhatsApp button that opens a `wa.me` link with a pre-filled message to the holder (numbers normalised to +92). Saima sends it herself. Automatic sending is cut.
- **The alternative:** Fully automated WhatsApp through the Business API.
- **Why this one:** The Business API needs Meta verification, message templates and per-message cost, and reviewers could not run it. "It would be good" marks it as a nice-to-have.
- **What would change my mind:** Tariq having a WhatsApp Business account and wanting hands-off reminders.

## 12. "Look back at last month"

- **The gap:** "I want to be able to look back at last month and see what was out and who had it." No format or filters given.
- **What I decided:** An on-screen table with This month, Last month and custom range presets, plus person and equipment filters. A checkout matches if its out-to-return span overlaps the range, and still-out items count as ending now. Records are never deleted, and people and items are deactivated instead. No CSV export.
- **The alternative:** Match on checkout date only, or add CSV export.
- **Why this one:** A loan taken on the 28th and returned on the 3rd belongs in both months, and long holds are what the owner cares about. He asked to see it "on a screen".
- **What would change my mind:** Someone needing the data in a spreadsheet (add CSV).

## 13. Two people taking the same item

- **The gap:** "Then somebody else needs the same thing and nobody knows who has it." The input does not say what happens if two people try at once.
- **What I decided:** An item that is out, pending approval, in inspection or lost cannot be checked out, and counted items cannot exceed what is available. Equipment, counted pools and checkout lines carry a concurrency token, and conflicts return HTTP 409 with a message the UI shows.
- **The alternative:** Allow it and sort it out later, or use pessimistic locks.
- **Why this one:** It is the core promise: one item, one holder at a time. Optimistic concurrency is simple and enough at this scale.
- **What would change my mind:** Nothing at this scale. I tested the availability rules over HTTP, but not a true simultaneous race.

## 14. Web app vs. a WhatsApp-based flow

- **The gap:** "Half of them just use WhatsApp, that's it." It is unclear whether the system must live inside WhatsApp.
- **What I decided:** A responsive web app, plus WhatsApp links for reminders.
- **The alternative:** A WhatsApp-bot checkout flow.
- **Why this one:** A bot needs the Business API (see entry 11), and the task asks for a web stack and "see it on a screen".
- **What would change my mind:** Staff refusing the web app in practice.

## 15. Database

- **The gap:** The task says "any relational database — SQLite or SQL Server LocalDB is completely fine."
- **What I decided:** SQL Server LocalDB with EF Core migrations. The app migrates and seeds itself on startup.
- **The alternative:** SQLite.
- **Why this one:** It is a stack I know, and SQL Server has native row versions for the concurrency tokens. It still runs with no manual database setup.
- **What would change my mind:** A reviewer without LocalDB (switch to SQLite).

## 16. Seed data

- **The gap:** "They own expensive equipment: total stations, GPS rovers, tripods, drones, laptops, field tablets." Real inventory and names are not given beyond 4 tripods, 6 tablets and a second GPS rover.
- **What I decided:** Auto-seed labelled sample data: 7 people, 5 serialized items, 4 tripods, 6 tablets, 2 kit templates and sample checkouts, including one overdue and one from last month. Everything beyond the numbers in the input is invented.
- **The alternative:** Start with an empty database.
- **Why this one:** Reviewers can see the board, overdue state and history within the five-minute run.
- **What would change my mind:** A reviewer wanting a clean slate (make seeding optional).
