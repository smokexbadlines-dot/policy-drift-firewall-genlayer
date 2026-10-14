import { createClient } from 'genlayer-js';
import { studionet, testnetBradbury } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const [, , networkName, address, ...hashes] = process.argv;
const chains = { studionet, testnetBradbury };
if (!chains[networkName] || !/^0x[0-9a-fA-F]{40}$/.test(address || '') || !hashes.length) {
  console.error('Usage: pnpm verify <studionet|testnetBradbury> <contract-address> <tx-hash> [tx-hash...]');
  process.exit(2);
}

const client = createClient({ chain: chains[networkName] });
const localCode = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../contracts/policy_drift.py'));
const expectedContractSha256 = createHash('sha256').update(localCode).digest('hex');
const transactions = [];
for (const hash of hashes) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) throw new Error(`Invalid transaction hash: ${hash}`);
  const tx = await client.getTransaction({ hash });
  const leader = tx.consensus_data?.leader_receipt?.find(item => item.mode === 'leader');
  const execution = tx.txExecutionResultName ?? (leader?.execution_result === 'SUCCESS' && leader?.result?.status === 'return'
    ? 'FINISHED_WITH_RETURN'
    : leader?.execution_result ?? tx.txExecutionResult);
  transactions.push({
    hash,
    status: tx.statusName ?? tx.status,
    execution,
    contractAddress: tx.data?.contract_address ?? null,
    deployedContractSha256: tx.data?.contract_code
      ? createHash('sha256').update(Buffer.from(tx.data.contract_code, 'base64')).digest('hex')
      : null,
    votes: tx.consensus_data?.votes ?? null,
    round: tx.lastRound ?? null,
  });
}
const rawState = await client.readContract({
  address,
  functionName: 'get_state',
  args: [],
  transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
});
const report = {
  network: networkName,
  contract: address,
  expectedContractSha256,
  transactions,
  finalizedState: JSON.parse(String(rawState)),
  verifiedAt: new Date().toISOString(),
};
console.log(JSON.stringify(report, null, 2));
if (transactions.some(tx => tx.status !== 'FINALIZED' || tx.execution !== 'FINISHED_WITH_RETURN'
  || (tx.deployedContractSha256 && tx.deployedContractSha256 !== expectedContractSha256))) process.exitCode = 1;
