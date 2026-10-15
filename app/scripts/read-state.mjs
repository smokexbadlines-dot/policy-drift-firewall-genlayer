import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';

const address = process.argv[2];
if (!/^0x[0-9a-fA-F]{40}$/.test(address || '')) {
  console.error('Usage: node scripts/read-state.mjs <contract-address>');
  process.exit(2);
}
const state = await createClient({ chain: studionet }).readContract({
  address,
  functionName: 'get_state',
  args: [],
  transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
});
console.log(JSON.stringify(JSON.parse(String(state)), null, 2));
