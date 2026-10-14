import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

const address = process.argv[2];
if (!/^0x[0-9a-fA-F]{40}$/.test(address || '')) throw new Error('Expected wallet address');
const client = createClient({ chain: studionet });
const result = await client.request({ method: 'sim_getTransactionsForAddress', params: [address] });
console.log(JSON.stringify(result.filter(tx => tx.to_address?.toLowerCase() === process.argv[3]?.toLowerCase()).slice(0, 10).map(tx => ({
  hash: tx.hash,
  status: tx.status,
  from: tx.from_address,
  to: tx.to_address,
  createdAt: tx.created_at,
  leaderExecution: tx.consensus_data?.leader_receipt?.find(item => item.mode === 'leader')?.execution_result,
  leaderStatus: tx.consensus_data?.leader_receipt?.find(item => item.mode === 'leader')?.result?.status,
  votes: tx.consensus_data?.votes,
})), null, 2));
