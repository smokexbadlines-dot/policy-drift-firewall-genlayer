# Portal update — Policy Drift Firewall

The project owner submits or replies in the Portal. These fields describe the
corrected Studionet deployment after the October 14 review request.

## Project fields

- **Contribution type:** Project / deployed Intelligent Contract.
- **Project name:** Policy Drift Firewall.
- **Primary tag:** Governance.
- **One-line summary:** Two-party commitments follow editorial policy edits and pause for both parties' consent after material edits.
- **Description (under 1,000 characters):** Policy Drift Firewall binds a two-party commitment to a commit-pinned public policy clause. GenLayer validators independently read old and new bounded sections and classify a revision as EDITORIAL, MATERIAL, or UNCLEAR; contract code applies the state change. An editorial edit rebinds pending and active commitments. A material edit moves both to REVIEW until the parties consent; unclear evidence leaves the old version in place. Peer acceptance checks the current URL and version, so an obsolete pending offer cannot activate. The corrected Studionet deployment has 13 finalized transactions: a pending offer followed an editorial edit and was accepted on version 2; a second pending offer entered REVIEW after a material edit, rejected an old acceptance attempt, and activated only after two consents. It holds no funds and records one artifact digest only when active.
- **Website:** https://policy-drift-firewall-genlayer.vercel.app/
- **GitHub repository:** https://github.com/smokexbadlines-dot/policy-drift-firewall-genlayer
- **Contract link:** https://explorer-studio.genlayer.com/address/0x827B9F7aE69D78CA083d6B5195AA5323AB03dAf5

## Exact reviewer path

1. Open the website without a wallet. Wait for **Finalized read · Studionet** and verify there are **2 clauses and 2 commitments**.
2. Inspect `discussion-link-rule`: `EDITORIAL`, version 2. Commitment `0` is `ACTIVE`, bound to the clause's version 2 URL. It was opened while version 1 was current, then rebound while still pending before Reviewer accepted it.
3. Inspect `execution-spec-links`: `MATERIAL`, version 2. Commitment `1` is `ACTIVE` on the new URL and version 2 with both consent flags true. In the proof panel, open the material assessment, first consent, failed acceptance, and second consent receipts.
4. Open [the proof manifest](https://github.com/smokexbadlines-dot/policy-drift-firewall-genlayer/blob/main/proof/studionet-live.json) and run `cd app; pnpm verify:proof`. It checks all 13 finalized receipts, the deployed source SHA-256, and the latest finalized state. The [review fix note](https://github.com/smokexbadlines-dot/policy-drift-firewall-genlayer/blob/main/REVIEW_FIX.md) maps each relevant receipt to the state transition.

**Expected verification outcome (paste into Portal, 482 characters):** The app reads 2 version-2 clauses and 2 commitments on Studionet. Pending offer #0 stayed PENDING through an EDITORIAL revision, rebound to version 2, then became ACTIVE after Reviewer accepted. Pending offer #1 entered REVIEW after a MATERIAL revision; an acceptance attempt finalized with ERROR and left it unchanged. Steward consent alone left it in REVIEW; Reviewer consent activated it on version 2. All 13 transactions are FINALIZED; deployed source matches the pinned commit.

## Reply to the October 14 reviewer request

Thank you for identifying the stale pending-offer path. I added a URL-and-version check to `accept_commitment`, and revision assessment now handles both PENDING and ACTIVE commitments. EDITORIAL rebinds pending offers without activating them; MATERIAL moves them to REVIEW and requires both parties' consent. I added `test_open_revise_then_accept_pending_commitments` plus a stale URL/version rejection test; all six direct-mode tests pass. The corrected source is pinned in [commit 8781978](https://github.com/smokexbadlines-dot/policy-drift-firewall-genlayer/commit/8781978ada97d9e20726f1d52af96e63ae0c9e43) and redeployed to [Studionet](https://explorer-studio.genlayer.com/address/0x827B9F7aE69D78CA083d6B5195AA5323AB03dAf5). The [13-transaction proof](https://github.com/smokexbadlines-dot/policy-drift-firewall-genlayer/blob/main/proof/studionet-live.json) includes editorial rebind then acceptance, material REVIEW, a finalized failed acceptance, and two-party reconsent. `pnpm verify:proof` checks the source hash and final state. The earlier deployment's proof is archived separately because it cannot establish this fix.

## Evidence links

- [Pinned corrected contract source](https://github.com/smokexbadlines-dot/policy-drift-firewall-genlayer/blob/8781978ada97d9e20726f1d52af96e63ae0c9e43/contracts/policy_drift.py)
- [Editorial assessment](https://explorer-studio.genlayer.com/tx/0x7a2c7913d2adc5c93b83fdb8898a0b9efaa9e5a79efde5eeb4667efeb2dc3067)
- [Editorial acceptance](https://explorer-studio.genlayer.com/tx/0x71708a69d40f5435347d05dbfb4790af58851547d61aee37fc67c0186a45485b)
- [Material assessment](https://explorer-studio.genlayer.com/tx/0x40d13de5b1997b88788d13cfbe8fe53b006fe6ea4d7e582aba192cb54a49190f)
- [Expected failed acceptance](https://explorer-studio.genlayer.com/tx/0xe9e113ed962ff8995e01d3faff95b563a6633fb8ae759f79dbb1f0ffd288e8cd)
- [Second consent](https://explorer-studio.genlayer.com/tx/0x3d135924dc3846297f1c4d18d31fcc9128f8bcda9780445f9480d786b20fb586)

## Scope and distinctiveness

The LLM judges semantic policy drift, while deterministic code controls
version binding and consent. The distinct claim is clause-scoped reconsent for
existing two-party commitments after a third-party policy revision. The
semantic-diff portion alone overlaps existing projects such as
[SemanticPolicyDiff](https://github.com/eaglebooth/SemanticPolicyDiff) and
[Semantic Drift Oracle](https://github.com/MeowStlanik/semantic-drift-oracle).
The contract is a nonfinancial prototype: it does not enforce a legal promise,
transfer GEN, or verify the contents of the attested artifact. The old
deployment's `UNCLEAR` / `INCONCLUSIVE` evidence is historical and is not
claimed as live proof of the corrected source.
