import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { createHash } from 'node:crypto';

const hash = process.argv[2];
if (!/^0x[0-9a-fA-F]{64}$/.test(hash || '')) {
  console.error('Usage: node scripts/check-tx.mjs <tx-hash>');
  process.exit(2);
}

const tx = await createClient({ chain: studionet }).getTransaction({ hash });
const leader = tx.consensus_data?.leader_receipt?.find(item => item.mode === 'leader');
const code = tx.data?.contract_code;
console.log(JSON.stringify({
  hash,
  status: tx.statusName ?? tx.status,
  execution: tx.txExecutionResultName ?? (leader?.execution_result === 'SUCCESS' && leader?.result?.status === 'return'
    ? 'FINISHED_WITH_RETURN' : leader?.execution_result ?? tx.txExecutionResult),
  contract: tx.data?.contract_address ?? tx.txDataDecoded?.contractAddress ?? null,
  sourceSha256: code ? createHash('sha256').update(Buffer.from(code, 'base64')).digest('hex') : null,
  votes: tx.consensus_data?.votes ?? null,
}, null, 2));
