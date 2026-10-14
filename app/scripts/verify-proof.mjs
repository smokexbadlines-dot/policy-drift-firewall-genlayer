import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const project = resolve(here, '../..');
const proof = JSON.parse(readFileSync(resolve(project, 'proof/studionet-live.json'), 'utf8'));
const localCode = readFileSync(resolve(project, 'contracts/policy_drift.py'));
const localHash = createHash('sha256').update(localCode).digest('hex');
const failures = [];
if (proof.network !== 'studionet') failures.push('Proof network is not Studionet.');
if (proof.expectedContractSha256 !== localHash) failures.push('Local contract source differs from the deployed proof.');

const client = createClient({ chain: studionet });
for (const expected of proof.transactions) {
  const tx = await client.getTransaction({ hash: expected.hash });
  const leader = tx.consensus_data?.leader_receipt?.find(item => item.mode === 'leader');
  const execution = tx.txExecutionResultName ?? (leader?.execution_result === 'SUCCESS' && leader?.result?.status === 'return'
    ? 'FINISHED_WITH_RETURN' : leader?.execution_result ?? tx.txExecutionResult);
  const status = tx.statusName ?? tx.status;
  if (status !== expected.status || execution !== expected.execution) {
    failures.push(`${expected.label || expected.hash}: expected ${expected.status}/${expected.execution}, got ${status}/${execution}.`);
  }
  if (expected.deployedContractSha256) {
    const codeHash = tx.data?.contract_code
      ? createHash('sha256').update(Buffer.from(tx.data.contract_code, 'base64')).digest('hex') : null;
    if (codeHash !== localHash || expected.deployedContractSha256 !== localHash) {
      failures.push('Deployment code hash does not match local source.');
    }
  }
}

const rawState = await client.readContract({
  address: proof.contract,
  functionName: 'get_state',
  args: [],
  transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
});
const state = JSON.parse(String(rawState));
const clauseKeys = ['id', 'url', 'version', 'digest', 'pendingUrl', 'pendingState', 'lastVerdict'];
const commitmentKeys = ['clauseId', 'partyA', 'partyB', 'boundUrl', 'version', 'status', 'aConsent', 'bConsent', 'artifactDigest'];
for (const [kind, keys] of [['clauses', clauseKeys], ['commitments', commitmentKeys]]) {
  const expected = proof.finalizedState[kind];
  const actual = state[kind];
  if (actual.length !== expected.length) failures.push(`${kind} count changed: ${expected.length} → ${actual.length}.`);
  for (let i = 0; i < Math.min(actual.length, expected.length); i++) {
    for (const key of keys) {
      if (actual[i][key] !== expected[i][key]) failures.push(`${kind}[${i}].${key} changed.`);
    }
  }
}

const ok = failures.length === 0;
console.log(`${ok ? 'PASS' : 'FAIL'} — ${proof.transactions.length} finalized transactions, ${state.clauses.length} clauses, ${state.commitments.length} commitments`);
console.log(`Contract ${proof.contract} · source SHA-256 ${localHash}`);
for (const failure of failures) console.error(`- ${failure}`);
if (!ok) process.exitCode = 1;
