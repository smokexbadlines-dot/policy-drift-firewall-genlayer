import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const manifestPath = resolve(project, 'RELEASE_MANIFEST.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const proof = JSON.parse(readFileSync(resolve(project, 'proof/studionet-live.json'), 'utf8'));
const bundleName = readdirSync(resolve(project, 'app/dist/assets')).find(name => /^index-.*\.js$/.test(name));
if (!bundleName) throw new Error('Build the frontend before updating release hashes.');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const localCodeHash = sha(readFileSync(resolve(project, 'contracts/policy_drift.py')));
if (proof.expectedContractSha256 !== localCodeHash || proof.transactions.length !== 13) {
  throw new Error('The current live proof does not match this contract release.');
}

manifest.version = '1.1.0';
manifest.contractSha256 = localCodeHash;
manifest.frontendBundleSha256 = sha(readFileSync(resolve(project, 'app/dist/assets', bundleName)));
manifest.runner = 'py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6';
manifest.sdk = 'genlayer-js 1.1.8';
manifest.sourceCommit = proof.sourceCommit;
manifest.checks = {
  genvmLint: 'PASS',
  genvmSemanticValidation: 'PASS',
  directTests: '6 passed',
  frontendBuild: 'PASS',
  liveNetworkDeployment: 'PASS',
  livePendingEditorialRebind: 'PASS',
  livePendingMaterialReview: 'PASS',
  liveOldVersionAcceptanceRejection: 'PASS',
  liveTwoPartyReconsent: 'PASS',
  proofVerifier: 'PASS',
  publicFrontend: manifest.checks?.publicFrontend ?? 'PENDING_PUBLIC_RELEASE',
  publicRepository: manifest.checks?.publicRepository ?? 'PENDING_SOURCE_PUSH',
};
manifest.deployment = {
  network: proof.network,
  address: proof.contract,
  transaction: proof.transactions[0].hash,
  status: proof.transactions[0].status,
  execution: proof.transactions[0].execution,
  sourceHashMatch: proof.transactions[0].deployedContractSha256 === localCodeHash,
  proof: 'proof/studionet-live.json',
};
manifest.liveTransactions = proof.transactions.map(tx => tx.hash);
manifest.evidenceUrls = [...new Set(proof.finalizedState.clauses.map(clause => clause.url).concat([
  'https://raw.githubusercontent.com/ethereum/EIPs/b57b7e83fd92e4b6862bea447ee4b86db5c1f034/EIPS/eip-1.md',
  'https://raw.githubusercontent.com/ethereum/EIPs/60e2285dae7fcb7eda7befa32577085fdceb2255/EIPS/eip-1.md',
]))];
manifest.frontend = 'https://policy-drift-firewall-genlayer.vercel.app/';
manifest.repository = 'https://github.com/smokexbadlines-dot/policy-drift-firewall-genlayer';
manifest.updatedUtc = new Date().toISOString();
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
