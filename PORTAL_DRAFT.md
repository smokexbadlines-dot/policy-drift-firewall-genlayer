# Portal draft — Policy Drift Firewall

## One-line description

An onchain firewall for two-party agreements when a public policy clause changes.

## Draft Portal fields

- **Contribution type:** Project / deployed Intelligent Contract.
- **Description (under 1,000 characters):** Policy Drift Firewall binds two-party commitments to commit-pinned public policy clauses. GenLayer validators independently fetch old and new bounded sections and classify a revision as EDITORIAL, MATERIAL, or UNCLEAR. Contract code advances related commitments after editorial edits, moves only affected active commitments to REVIEW after material edits, and keeps the prior version on unclear evidence. Both parties must consent to resume a reviewed commitment; party B can then attest one artifact digest. On Studionet, 20 transactions finalized: 19 successful executions and one expected rejected exercise. The live proof shows an affected commitment pausing while an unrelated one stays active, one consent remaining insufficient, two consents reactivating it, successful exercise, and an INCONCLUSIVE missing-section assessment.
- **How to inspect:** Open the [hosted app](https://smokexbadlines-dot.github.io/policy-drift-firewall-genlayer/) without a wallet. Compare the recorded transaction trail with the latest finalized clauses and commitments. Inspect the [source repository](https://github.com/smokexbadlines-dot/policy-drift-firewall-genlayer), run `cd app; pnpm verify:proof`, and follow [TUTORIAL.md](TUTORIAL.md).
- **Expected outcome:** `discussion-link-rule` has `EDITORIAL`; `material-review-demo` has version 2, verdict `UNCLEAR`, and an `INCONCLUSIVE` proposal after its earlier `MATERIAL` assessment. Commitment 0 is `EXERCISED` on version 2; unrelated commitment 1 is `ACTIVE`. The rejected exercise transaction is finalized with execution `ERROR`. The onchain source hash matches the repository contract.
- **Explorer:** [contract](https://explorer-studio.genlayer.com/address/0xa02c1e164D8ce654f6f1F3f33Cb6061E75564a9F), [material assessment](https://explorer-studio.genlayer.com/tx/0x50e82772658a156d575ad5a57e2becc967d6dc7a763a9a17f67098f7e0800cf7), [rejected exercise](https://explorer-studio.genlayer.com/tx/0xaedc298b5af4b33a80348530496923a8c1a7cffced3b5f25f7cfaf63726b598e), [inconclusive assessment](https://explorer-studio.genlayer.com/tx/0xd81df39bcce54a220774326670722ffaa20782263caea40cdeb53f144aa94410).

## Current Project form mapping (checked 14 October 2026)

- **Contribution:** Builder → Projects. Keep the Portal's application date set to the actual submission date.
- **Project name:** Policy Drift Firewall.
- **Primary tag:** Governance. The two more specific tags are optional.
- **One-line summary:** An onchain firewall that pauses affected two-party commitments when a public policy clause materially changes.
- **Description:** Paste the description above; it is 834 characters, below the form's 1,000-character limit.
- **How-to step 1:** Open the public website without a wallet. Wait for “Finalized read · Studionet” and confirm three clauses and two commitments.
- **How-to step 2:** Inspect `discussion-link-rule` (EDITORIAL), `execution-spec-links` (MATERIAL), and `material-review-demo` (version 2, UNCLEAR / INCONCLUSIVE).
- **How-to step 3:** Confirm commitment 0 is EXERCISED on version 2 and unrelated commitment 1 is ACTIVE. In the recorded proof panel, open the material assessment, rejected exercise, second consent, successful exercise, and inconclusive assessment transactions.
- **How-to step 4:** Open the public repository's `proof/studionet-live.json`. Run `cd app; pnpm verify:proof` to recheck the 20 transactions, deployed source hash, and finalized state.
- **Expected verification outcome:** The latest finalized state has 3 clauses and 2 commitments. `material-review-demo` remains version 2 after the UNCLEAR assessment. Commitment 0 is EXERCISED; unrelated commitment 1 is ACTIVE. The exercise attempted during REVIEW is FINALIZED / ERROR, while 19 other recorded transactions are FINALIZED / FINISHED_WITH_RETURN. The deployed source hash matches `contracts/policy_drift.py`.
- **Website:** https://smokexbadlines-dot.github.io/policy-drift-firewall-genlayer/
- **GitHub and required GitHub Repository evidence:** https://github.com/smokexbadlines-dot/policy-drift-firewall-genlayer
- **Optional contract link and additional evidence:** Use the explorer URLs above. The demo-video URL is optional; no video is claimed in this submission.

## Problem

Organizations bind decisions to public policies, then those policies change. Existing agreements need a verifiable answer to whether a revision was just editorial or changed an operative rule. Today the answer is commonly self-reported or applied globally.

## GenLayer-native mechanism

Each commitment fixes a public clause at a SHA-pinned source version. A steward proposes another pinned commit. GenLayer validators independently fetch the old and new bounded sections and return one semantic classification. Deterministic contract code checks source hashes and applies the version gate: editorial edits advance active commitments; material edits put only related commitments in review until both parties consent; unclear evidence leaves the old version in place. Party B can bind one artifact SHA-256 only while active, producing a finalized, version-bound `EXERCISED` certificate. No validator response can rewrite parties or choose that artifact.

## Why GenLayer

The decisive question is semantic: whether the operative permission, prohibition, requirement, eligibility rule, or exception changed. A rigid string diff treats harmless spelling edits as a new rule. A single publisher's declaration would make the revision self-reported. GenLayer lets independent validators read and judge the external policy, while contract code owns state transitions.

## Demo sequence

Use historical EIP-1 commits already present on GitHub. The editorial `Github` to `GitHub` edit and material specification-link rule change both finalized as expected. The core live sequence opened and accepted two commitments on different clauses, assessed a material revision, and read back only commitment 0 in `REVIEW`. One consent left it in review; an attempted exercise finalized with execution `ERROR`; the second consent reactivated it, and party B attested the sample artifact once. An existing pinned EIP-2 file without the frozen section markers then finalized as `UNCLEAR` / `INCONCLUSIVE` without advancing the clause or punishing a commitment. The full hash list, votes, execution results, and latest state are in [proof/studionet-live.json](proof/studionet-live.json).

## Current evidence and gaps

**Submission blocker (14 October 2026):** MetaMask displays a phishing or wallet-draining warning when the public app requests wallet connection, on both the original hosted domain and the GitHub Pages domain. Do not bypass the warning. Public read-only inspection works, but the public wallet flow must be cleared by MetaMask review or verified on a clean host before this draft is submitted as a fully working app.

Local direct-mode tests, GenVM semantic validation, frontend build, and `pnpm verify:proof` pass. Twenty Studionet transactions finalized at `0xa02c1e164D8ce654f6f1F3f33Cb6061E75564a9F`; 19 have successful leader execution and one expected blocked action has execution `ERROR`. The deployed source hash matches the tested source. The core two-party review and reconsent transitions, selective pause, successful exercise, and inconclusive source path have live proof. The prototype does not enforce a real-world legal agreement, transfer value, or verify the artifact's contents. A long-horizon review expiry was tested locally because its seven-day deadline has not elapsed live.

## Distinctiveness and overlap

[SemanticPolicyDiff](https://github.com/eaglebooth/SemanticPolicyDiff) already classifies semantic effects between immutable policy versions, while [Semantic Drift Oracle](https://github.com/MeowStlanik/semantic-drift-oracle) tracks versioned external clauses and labels material versus cosmetic changes. [ObligationGraph](https://github.com/smokexbadlines-dot/obligationgraph-genlayer) overlaps in two-party amendment lifecycle, and [MandateGate](https://github.com/smokexbadlines-dot/mandategate-genlayer) overlaps in single-use authorization. Policy Drift Firewall's distinct mechanism is automatic, clause-scoped reconsent for **existing** two-party commitments after a **third-party** policy revision. That transition now has direct Studionet evidence with an unaffected comparison commitment. The semantic-classification portion alone should not be presented as novel. A public repository search is not an exhaustive Portal submission audit, so acceptance cannot be inferred from it.
