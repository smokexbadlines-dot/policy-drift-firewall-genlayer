# Reproducing the Policy Drift Firewall demo

This walkthrough uses the deployed Studionet contract at [`0xa02c1e164D8ce654f6f1F3f33Cb6061E75564a9F`](https://explorer-studio.genlayer.com/address/0xa02c1e164D8ce654f6f1F3f33Cb6061E75564a9F). It follows 20 finalized transactions using real pinned EIP-1 and EIP-2 files. The contract never holds funds or transfers GEN. Each wallet write still consumes test GEN, so inspect the MetaMask prompt before signing.

## 1. Start the app and inspect public state

Open the [hosted app](https://smokexbadlines-dot.github.io/policy-drift-firewall-genlayer/) without connecting a wallet. To run locally, install Node.js 20 or newer and pnpm, then run `cd app`, `pnpm install`, and `pnpm dev`; open `http://127.0.0.1:5173`. Studionet and the deployed address are selected by default. Wait for “Finalized read · Studionet” and confirm three clauses and two commitments. `discussion-link-rule` should show version 2 and `EDITORIAL`; `execution-spec-links` should show version 2 and `MATERIAL`. `material-review-demo` is at version 2 with a later `UNCLEAR` verdict and an `INCONCLUSIVE` proposal. Commitment 0 is `EXERCISED` on version 2; unrelated commitment 1 is `ACTIVE`.

The app deliberately shows the onchain verdict rather than treating an example card as proof. Its lower proof panel is a recorded snapshot with explorer links; the clauses and commitments above are read from the latest finalized chain state. A fresh deployment will begin with no clauses. A later state change may cause the snapshot and live read to differ, so check the address, network, and finality marker.

## 2. Verify the deployment and transactions without a wallet

Open [proof/studionet-live.json](proof/studionet-live.json). It records 20 transactions: deployment, two baseline register/propose/assess sequences, a live two-party review sequence, and a missing-section assessment. Nineteen entries are `FINALIZED / FINISHED_WITH_RETURN`. The intentionally rejected `exercise` is `FINALIZED / ERROR`. The deployment entry records a SHA-256 of the onchain source equal to local `contracts/policy_drift.py`: `3be5122d91ee2bb0447064d354d123c3bb8e3679f0dd8c41a4fd9f021f096b9f`. Validator vote maps are included where Studionet exposed them. The final `get_state` read-back includes all clauses and commitments.

To check the entire report, run `pnpm verify:proof` from `app`. The script reads the live RPC without a private key, compares all 20 transaction states with the recorded expectations, checks the deployed code hash, and compares the latest finalized contract state with the snapshot. It exits nonzero on any mismatch. A later authorized change may make the snapshot stale; regenerate proof only after verifying the new finalized state. The semantic assessments are the meaningful GenLayer step: validators independently fetch bounded old and new sections, compare digests, and run the one-label judgment. A plain string comparison would notice changed bytes but would not reliably decide whether a requirement changed.

## 3. Understand the two decisions

The editorial case starts with EIP-1 commit `b57b7e83fd92e4b6862bea447ee4b86db5c1f034` and proposes `36507828d1449d1265dd88730fb61fe2b3eb0cb8`. In the bounded `discussions-to` section, the relevant spelling changes from “Github” to “GitHub”. The finalized assessment labeled it `EDITORIAL`, so contract code advanced the clause to version 2.

The material case starts with commit `60e2285dae7fcb7eda7befa32577085fdceb2255` and proposes `5543b5cebb801cd49d42284a176031ac12dda826`. The bounded execution specification section changes an operative link rule. The old version has separate pinned-commit URL patterns for specification tests. The new version permits links to test files inside the execution specifications repository under the same rule. The finalized assessment labeled it `MATERIAL`. These baseline assessments did not have active commitments, so we repeated the material case with an existing two-party commitment below.

## 4. Follow the live two-party gate

The steward registered `material-review-demo` at the old material-case commit. Party A opened commitment 0 with Party B's public address; Party B accepted it, making it `ACTIVE`. The parties also opened and accepted commitment 1 on the unrelated `discussion-link-rule` clause before the new material assessment. Both were active at the time of judgment.

The finalized material assessment moved only commitment 0 into `REVIEW`. Its bound URL and version stayed at the old value until reconsent. Commitment 1 remained `ACTIVE` on its own clause. Party A called `consent_to_revision(0)`; the finalized read still showed `REVIEW`, with only A's consent. Party B attempted `exercise(0, digest)` during review. The transaction finalized with execution `ERROR`, and the state still had no artifact digest. Party B then called `consent_to_revision(0)`. The second consent changed commitment 0 to `ACTIVE`, rebound it to the new clause URL and version 2, and cleared the review deadline.

Party B exercised commitment 0 with the SHA-256 of [examples/demo-artifact.txt](examples/demo-artifact.txt): `6f453b274aea0c616bdcc6b9235722b39fa13a4b2c50e7c92f818933a2ac64f2`. The browser hashes a chosen file locally; the file is not uploaded. The contract records only the digest and changes the commitment to `EXERCISED`. It does not inspect the artifact content or trigger an external action. A consuming system must check finalized state and the exact digest itself.

## 5. Inspect the inconclusive path

Finally, the steward proposed a commit-pinned `eip-2.md` file for `material-review-demo`. The file exists at the same public GitHub commit but lacks the registered EIP-1 section markers. The validator path returned `UNCLEAR`, rather than guessing a materiality label. The assessment finalized successfully and marked the proposal `INCONCLUSIVE`. The clause stayed on its current EIP-1 URL and version 2; commitment 0 stayed `EXERCISED` and commitment 1 stayed `ACTIVE`. This is the intended no-punishment path for missing or unclear evidence.

To recreate the write flow on a fresh contract, use two distinct funded Studionet accounts, register the pinned sections, open and accept commitments before assessment, and review each MetaMask prompt. The existing deployment can be inspected without funding a wallet or repeating the transactions.
