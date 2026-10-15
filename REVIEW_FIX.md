# Portal review response: pending commitments after a revision

The October 14 review identified a path where a pending commitment could be
accepted against a clause version that had already been replaced. The fix is
in [`contracts/policy_drift.py`](contracts/policy_drift.py):

- `accept_commitment` checks both the bound URL and version against the current
  clause before changing a `PENDING` commitment to `ACTIVE`.
- An `EDITORIAL` assessment rebinds both `PENDING` and `ACTIVE` commitments to
  the new URL and version. The pending offer still needs the peer's acceptance.
- A `MATERIAL` assessment moves both `PENDING` and `ACTIVE` commitments to
  `REVIEW`. Neither acceptance nor exercise can activate them there. Both
  parties must consent before the commitment is rebound and made `ACTIVE`.
  The existing review deadline, exit, and expiry paths apply to these offers.
- `UNCLEAR` leaves the clause version and commitments unchanged.

The repository regression test `test_open_revise_then_accept_pending_commitments`
opens pending offers, assesses editorial and material revisions, and checks
the later acceptance/consent paths. A second test rejects a pending record
whose URL or version is stale. All six direct-mode tests and GenVM lint and
semantic validation passed on the corrected source.

The corrected source was pinned in commit
[`8781978`](https://github.com/smokexbadlines-dot/policy-drift-firewall-genlayer/commit/8781978ada97d9e20726f1d52af96e63ae0c9e43)
and deployed on Studionet at
[`0x827B9F7aE69D78CA083d6B5195AA5323AB03dAf5`](https://explorer-studio.genlayer.com/address/0x827B9F7aE69D78CA083d6B5195AA5323AB03dAf5).
Deployment transaction
[`0xbe6d229…dd47fa1`](https://explorer-studio.genlayer.com/tx/0xbe6d229cd270582a57738f5f4ba5a61931154cd0fdb8e076484234e15dd47fa1)
is `FINALIZED` with successful leader execution; the deployed source SHA-256
matches the commit: `00bde2fa27b6dba0ca667d6eb7f77308c7a70b767586e5e4b19abf78fd3a1d4f`.

The [post-fix proof](proof/studionet-live.json) records 13 finalized transactions
and their execution results. The decisive receipts are:

1. [Editorial assessment](https://explorer-studio.genlayer.com/tx/0x7a2c7913d2adc5c93b83fdb8898a0b9efaa9e5a79efde5eeb4667efeb2dc3067):
   the pending commitment was rebound to version 2 and stayed `PENDING`.
2. [Reviewer acceptance](https://explorer-studio.genlayer.com/tx/0x71708a69d40f5435347d05dbfb4790af58851547d61aee37fc67c0186a45485b):
   the editorial commitment became `ACTIVE` on version 2.
3. [Material assessment](https://explorer-studio.genlayer.com/tx/0x40d13de5b1997b88788d13cfbe8fe53b006fe6ea4d7e582aba192cb54a49190f):
   the pending material commitment entered `REVIEW` while still bound to
   version 1. The unrelated editorial commitment was unaffected.
4. [Steward consent](https://explorer-studio.genlayer.com/tx/0x0931dee0b86b371e8fb04b8cfddb59c06892b313cb00b1f84a241ccfb7bd9088):
   one consent left the material commitment in `REVIEW`.
5. [Expected failed acceptance](https://explorer-studio.genlayer.com/tx/0xe9e113ed962ff8995e01d3faff95b563a6633fb8ae759f79dbb1f0ffd288e8cd):
   finalized with execution `ERROR`; state remained `REVIEW`.
6. [Reviewer consent](https://explorer-studio.genlayer.com/tx/0x3d135924dc3846297f1c4d18d31fcc9128f8bcda9780445f9480d786b20fb586):
   the material commitment became `ACTIVE` on the new URL and version 2.

Run `cd app; pnpm verify:proof` to recheck every transaction, the deployed
source hash, and latest finalized clause and commitment state. The previous
deployment and its historical transactions are archived in [proof/legacy](proof/legacy);
they do not prove this changed source.
