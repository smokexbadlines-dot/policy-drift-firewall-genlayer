# Walkthrough: a pending commitment across a policy revision

Policy Drift Firewall demonstrates a specific GenLayer state transition: two
people can precommit to a public rule, and a later semantic change to that
rule cannot silently activate an obsolete offer. The corrected [Studionet
contract](https://explorer-studio.genlayer.com/address/0x827B9F7aE69D78CA083d6B5195AA5323AB03dAf5)
was deployed from [source commit
8781978](https://github.com/smokexbadlines-dot/policy-drift-firewall-genlayer/commit/8781978ada97d9e20726f1d52af96e63ae0c9e43).
It holds no funds. The action it gates is a single artifact-hash attestation,
available only to party B while the commitment is `ACTIVE`.

## 1. Inspect the completed app

Open the [public app](https://policy-drift-firewall-genlayer.vercel.app/)
without connecting a wallet. Wait for “Finalized read · Studionet.” The
contract section should show two clauses and two commitments. The state panel
is a live finalized read; the proof panel is a recorded transaction snapshot.
That separation matters: a transaction can be submitted, accepted, or even
finalized with an execution error. The app does not count an error as a
successful state change. Its proof links open the Studionet Explorer so a
reviewer can inspect each receipt.

To run the same interface locally, install Node.js 20 or newer and pnpm,
then run `cd app`, `pnpm install`, and `pnpm dev`. Open
`http://127.0.0.1:5173`. The default Studionet address is the corrected
deployment. Connect a funded test wallet only if you want to issue your own
transactions, and inspect every wallet prompt before signing. A read-only
review needs no wallet or test GEN.

## 2. Understand what the validators decide

A steward registers a clause with an exact start and end marker in a raw
GitHub file pinned to a commit SHA. When the steward proposes another pinned
file, anyone may call `assess_revision`. Each validator fetches both bounded
sections and evaluates whether the operative requirement, permission,
prohibition, exception, or eligibility rule changed. The model returns only
`EDITORIAL`, `MATERIAL`, or `UNCLEAR`; it cannot choose a wallet, version,
deadline, or artifact digest. The leader also returns source-section digests.
Validators independently fetch, extract, hash, and judge the same sections,
and require exact equality for every returned field. Contract code then
selects the state transition. If the source is unavailable or the section
markers are missing, `UNCLEAR` leaves the old version in place.

The examples use Ethereum's public EIP-1 file, pinned to historical commits.
For `discussion-link-rule`, commit `b57b7e83…` to `36507828…` changes a
“Github” spelling to “GitHub” in the `discussions-to` guidance. That was
judged `EDITORIAL`. For `execution-spec-links`, `60e2285d…` to `5543b5ce…`
changes an operative specification-link rule. That was judged `MATERIAL`.
The old and new links are visible in the app and frozen in the proof.

## 3. Follow the editorial pending offer

Party A registered the editorial clause and opened commitment `0` with party
B. The [open transaction](https://explorer-studio.genlayer.com/tx/0x3770513063c16dbc6c483911145eb84f8b7176311a5f34afc86ed7d90b7c016d)
finalized, and a readback showed `PENDING` on version 1. Before B accepted,
the steward proposed the new EIP-1 commit. The [assessment](https://explorer-studio.genlayer.com/tx/0x7a2c7913d2adc5c93b83fdb8898a0b9efaa9e5a79efde5eeb4667efeb2dc3067)
finalized as `EDITORIAL`. The clause advanced to version 2. The still-pending
offer was rebound to the new URL and version 2, without becoming active.
Only after that did B [accept](https://explorer-studio.genlayer.com/tx/0x71708a69d40f5435347d05dbfb4790af58851547d61aee37fc67c0186a45485b),
making commitment `0` `ACTIVE` on version 2. This is the safe path for a
nonmaterial policy edit.

## 4. Follow the material pending offer

Party A separately registered `execution-spec-links` and opened commitment
`1` with B. It was `PENDING` on version 1 when the steward proposed the
material source. The [assessment](https://explorer-studio.genlayer.com/tx/0x40d13de5b1997b88788d13cfbe8fe53b006fe6ea4d7e582aba192cb54a49190f)
finalized as `MATERIAL`; commitment `1` entered `REVIEW`, still bound to the
old URL and version. Unrelated commitment `0` was not paused. A first
[consent](https://explorer-studio.genlayer.com/tx/0x0931dee0b86b371e8fb04b8cfddb59c06892b313cb00b1f84a241ccfb7bd9088)
from party A left commitment `1` in `REVIEW`.

The abuse check is direct: B tried to call `accept_commitment(1)` while it
was in review. That [transaction](https://explorer-studio.genlayer.com/tx/0xe9e113ed962ff8995e01d3faff95b563a6633fb8ae759f79dbb1f0ffd288e8cd)
is `FINALIZED` with execution `ERROR`. A subsequent state read still showed
`REVIEW`, version 1, with only A's consent. B then [consented](https://explorer-studio.genlayer.com/tx/0x3d135924dc3846297f1c4d18d31fcc9128f8bcda9780445f9480d786b20fb586).
With both consent flags set, deterministic code rebound commitment `1` to
the new URL and version 2 and made it `ACTIVE`. A pending material offer
therefore cannot use the old one-click acceptance path.

## 5. Recheck the evidence and source

Run `cd app; pnpm verify:proof` from the repository. The script reads all
13 transaction hashes from [proof/studionet-live.json](proof/studionet-live.json),
checks protocol finality and leader execution separately, and confirms that
the deliberately rejected acceptance has `ERROR` while the other 12 calls
succeeded. It hashes the source embedded in the deployment transaction and
compares it with the local contract. It then reads the latest finalized
state and compares both clauses and commitments with the proof snapshot.
The expected source SHA-256 is
`00bde2fa27b6dba0ca667d6eb7f77308c7a70b767586e5e4b19abf78fd3a1d4f`.
Six direct-mode regression tests cover the same transition, including a
stale bound URL or version that must be rejected. The old deployment and its
20 historical receipts are preserved in [proof/legacy](proof/legacy), but
they are not evidence for this changed source.
