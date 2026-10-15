import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const contract = '0x827B9F7aE69D78CA083d6B5195AA5323AB03dAf5';
const sourceCommit = '8781978ada97d9e20726f1d52af96e63ae0c9e43';
const localCode = readFileSync(resolve(project, 'contracts/policy_drift.py'));
const expectedContractSha256 = createHash('sha256').update(localCode).digest('hex');
const input = [
  ['Deploy corrected contract', '0xbe6d229cd270582a57738f5f4ba5a61931154cd0fdb8e076484234e15dd47fa1'],
  ['Register editorial clause', '0xd4032e71abe81dfa42ef4f8c7e5ef013a2d9691fea9b87a785bd9254d29bd154'],
  ['Open editorial commitment #0: PENDING v1', '0x3770513063c16dbc6c483911145eb84f8b7176311a5f34afc86ed7d90b7c016d'],
  ['Propose editorial revision', '0xcca556bc09d21cf362c9c301bf1bca694ea89c33ad971c5b49ace395222b9df8'],
  ['Assess EDITORIAL: pending #0 rebound to v2', '0x7a2c7913d2adc5c93b83fdb8898a0b9efaa9e5a79efde5eeb4667efeb2dc3067'],
  ['Register material clause', '0xf1e1c3e44560f166f3fee452566b24ff1b905e5970a5d8ee59ed92fb90954438'],
  ['Open material commitment #1: PENDING v1', '0xa15b43e33eb6168d326e961f517347e8fe7eb606bf4cecb0e3fec2c2f201bf58'],
  ['Propose material revision', '0x7741b6b01e41bb5f49e4d8df9c0c7ecdb8c6475e47cd87707d5981c668548429'],
  ['Assess MATERIAL: pending #1 enters REVIEW', '0x40d13de5b1997b88788d13cfbe8fe53b006fe6ea4d7e582aba192cb54a49190f'],
  ['Steward consent: #1 stays REVIEW', '0x0931dee0b86b371e8fb04b8cfddb59c06892b313cb00b1f84a241ccfb7bd9088'],
  ['Reviewer accepts editorial #0 on v2', '0x71708a69d40f5435347d05dbfb4790af58851547d61aee37fc67c0186a45485b'],
  ['EXPECTED FAILURE: Reviewer cannot accept material #1 in REVIEW', '0xe9e113ed962ff8995e01d3faff95b563a6633fb8ae759f79dbb1f0ffd288e8cd', 'ERROR'],
  ['Reviewer consent: #1 ACTIVE on v2', '0x3d135924dc3846297f1c4d18d31fcc9128f8bcda9780445f9480d786b20fb586'],
];

const client = createClient({ chain: studionet });
const transactions = [];
for (const [label, hash, expectedExecution = 'FINISHED_WITH_RETURN'] of input) {
  const tx = await client.getTransaction({ hash });
  const leader = tx.consensus_data?.leader_receipt?.find(item => item.mode === 'leader');
  const execution = tx.txExecutionResultName ?? (leader?.execution_result === 'SUCCESS' && leader?.result?.status === 'return'
    ? 'FINISHED_WITH_RETURN' : leader?.execution_result ?? tx.txExecutionResult);
  const status = tx.statusName ?? tx.status;
  const deployedContractSha256 = tx.data?.contract_code
    ? createHash('sha256').update(Buffer.from(tx.data.contract_code, 'base64')).digest('hex') : null;
  if (status !== 'FINALIZED' || execution !== expectedExecution) {
    throw new Error(`${label}: ${status}/${execution}; expected FINALIZED/${expectedExecution}`);
  }
  if (deployedContractSha256 && deployedContractSha256 !== expectedContractSha256) {
    throw new Error('Deployed source does not match the pinned local contract.');
  }
  transactions.push({
    hash, status, execution, label,
    contractAddress: tx.data?.contract_address ?? null,
    deployedContractSha256,
    votes: tx.consensus_data?.votes ?? null,
    round: tx.lastRound ?? null,
  });
}
const rawState = await client.readContract({
  address: contract, functionName: 'get_state', args: [],
  transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
});
const finalizedState = JSON.parse(String(rawState));
const [editorial, material] = finalizedState.clauses;
const [editorialOffer, materialOffer] = finalizedState.commitments;
if (finalizedState.clauses.length !== 2 || finalizedState.commitments.length !== 2
  || editorial.id !== 'discussion-link-rule' || editorial.version !== 2 || editorial.lastVerdict !== 'EDITORIAL'
  || material.id !== 'execution-spec-links' || material.version !== 2 || material.lastVerdict !== 'MATERIAL'
  || editorialOffer.status !== 'ACTIVE' || editorialOffer.version !== 2 || editorialOffer.boundUrl !== editorial.url
  || materialOffer.status !== 'ACTIVE' || materialOffer.version !== 2 || materialOffer.boundUrl !== material.url
  || !materialOffer.aConsent || !materialOffer.bConsent) {
  throw new Error('Latest finalized state does not match the expected review-fix outcome.');
}

const proof = {
  proofVersion: 2,
  network: 'studionet',
  contract,
  sourceCommit,
  expectedContractSha256,
  transactions,
  finalizedState,
  verifiedAt: new Date().toISOString(),
};
writeFileSync(resolve(project, 'proof/studionet-live.json'), `${JSON.stringify(proof, null, 2)}\n`);
console.log(`Saved ${transactions.length} finalized transactions; source ${expectedContractSha256}`);
