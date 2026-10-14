import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const path = resolve(project, 'proof/studionet-live.json');
const proof = JSON.parse(readFileSync(path, 'utf8'));
const labels = [
  'Deploy contract',
  'Register editorial clause',
  'Propose editorial revision',
  'Assess editorial revision',
  'Register material clause',
  'Propose material revision',
  'Assess material revision',
  'Register live review clause',
  'Open affected commitment #0',
  'Accept affected commitment #0',
  'Open unaffected commitment #1',
  'Accept unaffected commitment #1',
  'Propose live material revision',
  'Assess: affected REVIEW, unaffected ACTIVE',
  'First consent: remains REVIEW',
  'Exercise during REVIEW: rejected',
  'Second consent: returns ACTIVE',
  'Exercise once: records artifact digest',
  'Propose source without section markers',
  'Assess: UNCLEAR and INCONCLUSIVE',
];
if (proof.transactions.length !== labels.length) throw new Error(`Expected ${labels.length} transactions.`);
proof.transactions.forEach((tx, i) => { tx.label = labels[i]; });
proof.scenarios = {
  editorial: { clauseId: 'discussion-link-rule', expectedVerdict: 'EDITORIAL', assessment: proof.transactions[3].hash },
  material: { clauseId: 'material-review-demo', expectedVerdict: 'MATERIAL', assessment: proof.transactions[13].hash, affectedCommitment: 0, unaffectedCommitment: 1 },
  reviewRejection: { transaction: proof.transactions[15].hash, expectedExecution: 'ERROR' },
  inconclusive: { clauseId: 'material-review-demo', expectedVerdict: 'UNCLEAR', expectedPendingState: 'INCONCLUSIVE', assessment: proof.transactions[19].hash },
};
writeFileSync(path, `${JSON.stringify(proof, null, 2)}\n`);
