# Two-minute demo script

**0:00–0:20 — The problem.** Public rules change after people make commitments against them. A byte diff tells us that text changed; it does not tell us whether the operative rule changed. Policy Drift Firewall binds a two-party commitment to a specific public clause and version.

**0:20–0:40 — The GenLayer mechanism.** Show the Studionet dashboard and its deployed address. A steward pins raw GitHub commit URLs and exact section markers. Validators independently fetch the sections, check their digests, and agree on a bounded `EDITORIAL`, `MATERIAL`, or `UNCLEAR` label. The contract applies the transition; the AI does not choose parties, actions, or money.

**0:40–1:05 — Editorial pending offer.** Show the “Github” → “GitHub” excerpt and `EDITORIAL` verdict. Commitment 0 was opened `PENDING` on version 1, rebound to version 2 by the assessment, then accepted by Reviewer. It ends `ACTIVE` on version 2.

**1:05–1:40 — Material pending offer.** Commitment 1 was opened `PENDING` on version 1. The operative specification-link rule changed. Validators returned `MATERIAL`, and commitment 1 entered `REVIEW`; unrelated commitment 0 stayed usable. Show the first consent leaving it in review. The attempted `accept_commitment(1)` finalized with execution `ERROR` and did not activate it. The second consent activated it on version 2.

**1:40–1:50 — Why the guard matters.** The contract checks both bound URL and version before accepting any pending offer. A material revision does not leave the old offer pending; it moves it to review for explicit consent from both parties.

**1:50–2:00 — Verification.** Show [the proof manifest](proof/studionet-live.json), 13 finalized transactions (12 successful, one expected blocked acceptance), and run `cd app; pnpm verify:proof`. Finish with clause-scoped reconsent for pending and active commitments after an independently judged third-party policy revision.
