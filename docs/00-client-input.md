# Client Input: Horizon Survey Services

Horizon Survey Services is a land-surveying company in Lahore. About 25 people, roughly 14 are field staff. They own expensive equipment: total stations, GPS rovers, tripods, drones, laptops, field tablets.

## 1. Voice note from the owner, Mr Tariq (transcript)

"So basically the problem is the equipment. We have a lot of equipment, it is expensive, and I never know where any of it is. The boys come in the morning, they pick up what they need, they go to site. Fine. Then somebody else needs the same thing and nobody knows who has it. Last month we bought a second GPS rover for eleven lakh because we thought ours was lost. It was in somebody's car boot for three weeks.

So I want to know who has what. That's it really. And I want it back on time, people keep things for weeks when they needed it for one day.

Anyone in the team can take anything, we don't have a system, it's all on trust, and mostly that's fine, I don't want to make it like the army. But I want to see it on a screen.

Sometimes they take the whole survey kit, sometimes just one piece. Oh and the office needs to know too, Saima in the office gets the calls asking where things are, she is the one suffering.

One more thing — the boys are not going to use anything complicated. Half of them just use WhatsApp, that's it. If it takes more than a few seconds they won't do it, and then we're back where we started."

## 2. Follow-up email from Mr Tariq, two days later

Subject: RE: equipment thing

"Hi,

Forgot to mention a few things.

The drone is different, that needs Hamza's approval before anyone takes it, he is the only licensed operator. Same for the new rover maybe, I will decide later.

We have 4 tripods and 6 field tablets, those are not individually tracked, we just need to know how many are left.

Also sometimes equipment comes back damaged and nobody says anything until the next person takes it to site and finds out. That has cost us two days of client work this year.

It would be good if the system reminds people. We mostly use WhatsApp for everything here.

And I want to be able to look back at last month and see what was out and who had it.

Thanks
Tariq"

## 3. Technical constraints (chosen by the developer)

- Backend: .NET 9, C#, ASP.NET Core Web API, EF Core
- Database: SQL Server (LocalDB for local running)
- Frontend: React + Vite + TypeScript, styled with Bootstrap
- One repository containing backend and frontend (src/Horizon.EquipmentTracker.Api and src/client)
- Must run locally from a short, documented set of steps
