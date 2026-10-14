# Two-minute demo script

**0:00–0:20 — The problem.** Public rules change after people make commitments against them. A byte diff tells us that text changed; it does not tell us whether the operative rule changed. Policy Drift Firewall binds a two-party commitment to a specific public clause and version.

**0:20–0:40 — The GenLayer mechanism.** Show the Studionet dashboard and its deployed address. A steward pins raw GitHub commit URLs and exact section markers. Validators independently fetch the sections, check their digests, and agree on a bounded `EDITORIAL`, `MATERIAL`, or `UNCLEAR` label. The contract applies the transition; the AI does not choose parties, actions, or money.

**0:40–1:05 — Two baseline judgments.** Show the “Github” → “GitHub” excerpt and its `EDITORIAL` verdict. Show the changed execution specification test-link rule and its `MATERIAL` verdict. The proof panel links each finalized assessment to the explorer.

**1:05–1:35 — Selective review, live.** Open the two commitments. In the live material assessment, commitment 0 entered `REVIEW`, while unrelated commitment 1 remained `ACTIVE`. Show the first consent leaving commitment 0 in review and the rejected exercise transaction with `FINALIZED / ERROR`. Then show second consent returning it to `ACTIVE` at version 2, followed by the successful artifact digest attestation and `EXERCISED` state.

**1:35–1:50 — Safe failure.** Show the pinned EIP-2 proposal. The file exists but lacks the frozen clause markers. Validators returned `UNCLEAR`; the proposal became `INCONCLUSIVE`, the current clause remained version 2, and no commitment changed.

**1:50–2:00 — Verification.** Show [the proof manifest](proof/studionet-live.json), 20 finalized transactions (19 successful, one expected blocked action), and run `cd app; pnpm verify:proof`. Finish with clause-scoped reconsent for existing commitments after an independently judged third-party policy revision.
