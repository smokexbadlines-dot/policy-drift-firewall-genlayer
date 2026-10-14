# Policy Drift Firewall — design record

## Mechanism

Two parties bind a one-time onchain authorization to one clause of a public, versioned policy. The policy steward can propose a new pinned source. Validators independently fetch the old and new versions and judge one bounded question: does the changed clause alter a permission, prohibition, requirement, eligibility rule, or exception? Ordinary code then advances editorial revisions automatically or places affected commitments in REVIEW. A material change never silently rewrites an existing agreement: both parties must opt in to the new version, or the commitment expires after a fixed review deadline. Party B can exercise only while ACTIVE, binding a 64-character SHA-256 artifact digest and closing the commitment as EXERCISED.

This is a nonfinancial prototype. It issues a single-use, version-bound artifact attestation; it does not hold or transfer GEN. The useful invariant is that an editorial update can migrate an agreement, while a substantive update cannot bind either party without consent. A revision to one clause cannot pause an unrelated clause's agreements.

## Participants and state

- Policy steward: registers clause sources and proposes revisions. Cannot vote on behalf of the other party.
- Two commitment parties: jointly activate a commitment and jointly accept a material revision. Either can exit during review.
- Any account: can assess a frozen revision or expire a stale review; cannot supply replacement evidence to a frozen assessment.
- Clause: ID, current pinned URL, section markers, version, pending revision, assessment deadline.
- Commitment: two addresses, clause ID, bound version and URL, PENDING/ACTIVE/REVIEW/EXERCISED/EXITED/EXPIRED status, consent bits, review deadline, artifact digest and exercise timestamp.

## Judgment boundary

The LLM returns only `EDITORIAL`, `MATERIAL`, or `UNCLEAR` for one clause revision. `EDITORIAL` means wording or presentation changed without altering an operative rule. `MATERIAL` means an operative rule changed. Missing, ambiguous, unreadable, or conflicting evidence means `UNCLEAR`. The leader also returns deterministic digests of the extracted old and new source sections. Each validator fetches and extracts them independently, reruns the judgment, and requires exact equality for every returned field. No LLM output sets a fee, amount, party, version, deadline, or permission directly.

The source is a pinned raw GitHub file. Each clause fixes exact start and end markers to extract a bounded section from each version. Pages are treated as untrusted data, not instructions. An unavailable or oversized source cannot produce a material classification.

## Candidate historical demo

Both cases use Ethereum's public EIP-1 source file, pinned to commit SHAs:

1. Editorial: `b57b7e83fd92e4b6862bea447ee4b86db5c1f034` to `36507828d1449d1265dd88730fb61fe2b3eb0cb8` changes “Github” to “GitHub” under `discussions-to`.
2. Material: `60e2285dae7fcb7eda7befa32577085fdceb2255` to `5543b5cebb801cd49d42284a176031ac12dda826` replaces permitted execution-specification-test link rules.

Expected demo: register two clauses and two commitments; the editorial update automatically advances one; the material update places the other in REVIEW; action under REVIEW fails; an unrelated ACTIVE commitment can still act; unilateral consent is insufficient; both-party consent reactivates the reviewed commitment. An invalid URL or prompt-injection fixture yields UNCLEAR. These are hypotheses until live finalized transactions and read-backs confirm them.

## Close-match comparison

| Shape | Judgment | State transition | Difference to prove |
| --- | --- | --- | --- |
| [MandateGate](https://github.com/smokexbadlines-dot/mandategate-genlayer) | Does a PR stay within a human mandate? | Issues a single-use merge ticket | This app judges a third-party policy revision and selectively gates existing agreements, rather than judging one PR against fixed instructions. The single-use artifact certificate is still structurally similar to MandateGate's ticket. |
| [ObligationGraph](https://github.com/smokexbadlines-dot/obligationgraph-genlayer) | Does evidence fulfill a written obligation? | Records outcome and bilateral amendments | This app judges external source drift rather than performance evidence. Editorial changes auto-migrate; material changes trigger reconsent only for bound agreements. The two-party lifecycle is a real overlap. |
| Dependency/retraction registry | Is a source valid or retracted? | Dependent decisions become unusable | Here a policy amendment can auto-migrate an agreement or require a two-party version handshake; old rights remain version-bound. |
| Covenant Watch | Extract a numerical fact for a threshold | Penalty ladder | Here validators judge semantic rule drift, while code controls selective authorization and consent. |

Two visible earlier user repositories have been compared. The current Portal cohort has not been audited. Distinctiveness is plausible at the mechanism level but not an assured Portal outcome.

## Evidence and release gates

Before live deployment: check raw byte caps, probe the exact sources from GenVM, probe runner deployment and one write/read, and lint/test contract code. For every demo transaction, record transaction ID, protocol status, execution result, votes, and read-back. Only FINALIZED with successful execution is proof. A change to deployed source requires a new deployment and new demonstration. Keep the repo private until the user explicitly approves public visibility; the human submits to the Portal.
