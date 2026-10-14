import { createClient } from 'genlayer-js';
import { studionet, testnetBradbury } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';
import './style.css';

const networks = {
  studionet: { chain: studionet, label: 'Studionet', explorer: 'https://studio.genlayer.com' },
  testnetBradbury: { chain: testnetBradbury, label: 'Bradbury testnet', explorer: 'https://explorer-bradbury.genlayer.com' },
};
const demo = {
  editorial: {
    old: 'b57b7e83fd92e4b6862bea447ee4b86db5c1f034',
    next: '36507828d1449d1265dd88730fb61fe2b3eb0cb8',
    start: '### `discussions-to`', end: '### `type`',
    id: 'discussion-link-rule',
  },
  material: {
    old: '60e2285dae7fcb7eda7befa32577085fdceb2255',
    next: '5543b5cebb801cd49d42284a176031ac12dda826',
    start: '### Execution Client Specifications', end: '### Consensus Layer Specifications',
    id: 'execution-spec-links',
  },
};
const raw = sha => `https://raw.githubusercontent.com/ethereum/EIPs/${sha}/EIPS/eip-1.md`;
const assetBase = import.meta.env.BASE_URL;
const studionetDemoAddress = '0xa02c1e164D8ce654f6f1F3f33Cb6061E75564a9F';
const storedNetwork = localStorage.getItem('pdf-network');
let network = networks[storedNetwork] ? storedNetwork : 'studionet';
let address = localStorage.getItem(`pdf-address-${network}`) || (network === 'studionet' ? studionetDemoAddress : '');
let account = '';
let client;
let pending = [];
let proof = null;
let data = null;
let refreshing = false;

const app = document.querySelector('#app');
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));
const short = value => value && value.length > 18 ? `${value.slice(0, 9)}…${value.slice(-7)}` : value || '—';
const date = seconds => seconds ? new Date(Number(seconds) * 1000).toLocaleString() : '—';
const statusClass = value => ['ACTIVE', 'EXERCISED', 'EDITORIAL', 'CHECKABLE'].includes(value) ? 'good'
  : ['MATERIAL', 'REVIEW', 'OPEN', 'INCONCLUSIVE', 'UNCLEAR', 'PENDING'].includes(value) ? 'caution' : 'neutral';
const pill = value => `<span class="pill ${statusClass(value)}">${escape(value || 'NONE')}</span>`;
const canWrite = () => Boolean(account && address);
const transactionStore = () => `pdf-transactions-${network}`;
try {
  const saved = JSON.parse(localStorage.getItem(transactionStore()) || '[]');
  if (Array.isArray(saved)) pending = saved.filter(tx => /^0x[0-9a-fA-F]{64}$/.test(tx.hash || '')).slice(0, 30);
} catch { /* Ignore invalid local browser history. */ }
const saveTransactions = () => localStorage.setItem(transactionStore(), JSON.stringify(pending.slice(0, 30)));

function getClient() {
  if (!client) client = createClient({ chain: networks[network].chain });
  return client;
}

function toast(message, kind = 'info') {
  const box = document.querySelector('#notice');
  box.textContent = message;
  box.className = `notice ${kind}`;
  box.hidden = false;
}

function page() {
  app.innerHTML = `
    <div class="grain"></div>
    <header class="topbar">
      <div class="brand"><span class="brandmark">PD<span>F</span></span><span>Policy Drift <b>Firewall</b><small>GenLayer Native</small></span></div>
      <div class="top-actions">
        <select id="network" aria-label="Network"><option value="studionet" ${network === 'studionet' ? 'selected' : ''}>Studionet</option><option value="testnetBradbury" ${network === 'testnetBradbury' ? 'selected' : ''}>Bradbury testnet</option></select>
        <button id="connect" class="button secondary">${account ? short(account) : 'Connect wallet'}</button>
      </div>
    </header>
    <main>
      <section class="hero">
        <div class="hero-copy"><div class="eyebrow"><span class="pulse"></span> PUBLIC POLICY · PRIVATE AGREEMENT</div>
          <h1>When a rule changes,<br><em>your agreement knows.</em></h1>
          <p>Bind a two-party commitment to a versioned public clause. Validators read both versions and judge whether a revision changes the rule. Code handles the rest: editorial updates advance; material updates pause the affected commitment until both parties consent.</p>
          <div class="hero-links"><a href="${assetBase}contract.py" download>Download contract source ↗</a><a href="https://docs.genlayer.com/developers/intelligent-contracts/first-contract" target="_blank" rel="noreferrer">How GenLayer contracts work ↗</a></div>
        </div>
        <div class="flow-card"><div class="flow-head"><span>01 / VERSION CONTROL</span><span class="live">DEMO BUILD</span></div>
          <div class="flow-item"><i>01</i><div><strong>Freeze the source</strong><small>Pinned GitHub commit + exact section markers</small></div></div>
          <div class="flow-line"></div><div class="flow-item"><i>02</i><div><strong>Assess the revision</strong><small>Independent validator reads, one bounded judgment</small></div></div>
          <div class="flow-line"></div><div class="flow-item"><i>03</i><div><strong>Apply the gate</strong><small>Editorial: advance · Material: review · Unclear: hold</small></div></div>
        </div>
      </section>
      <div id="notice" class="notice" role="status" hidden></div>
      <section class="workspace">
        <div class="section-heading"><div><span class="kicker">01 — CONTRACT</span><h2>Attach a deployment</h2></div><span id="sync" class="sync">Read-only until attached</span></div>
        <div class="card attach">
          <label>Contract address <input id="address" value="${escape(address)}" placeholder="0x…" spellcheck="false" autocomplete="off" /></label>
          <button class="button" id="attach">Load contract</button><button class="button tertiary" id="deploy">Deploy with wallet</button>
        </div>
        <p class="fineprint">This prototype stores no private key. Deployment and writes require your browser wallet. The displayed source and address must match the deployment you intend to use.</p>
      </section>
      <section class="workspace">
        <div class="section-heading"><div><span class="kicker">02 — ONCHAIN STATE</span><h2>Clauses and commitments</h2></div><button class="text-button" id="refresh">Refresh finalized state ↗</button></div>
        <div class="stats"><div><small>CLAUSES</small><strong id="clause-count">—</strong></div><div><small>COMMITMENTS</small><strong id="commitment-count">—</strong></div><div><small>STEWARD</small><strong id="steward">—</strong></div></div>
        <div class="split"><div class="card"><h3>Policy clauses</h3><div id="clauses" class="empty">Attach a deployed contract to read its clauses.</div></div><div class="card"><h3>Two-party commitments</h3><div id="commitments" class="empty">Commitment status appears here after a finalized read.</div></div></div>
      </section>
      <section class="workspace">
        <div class="section-heading"><div><span class="kicker">03 — OPERATE</span><h2>Move the agreement</h2></div><span class="fineprint">Transactions may take several minutes to finalize.</span></div>
        <div class="operations">
          <form class="card operation" data-method="register_clause"><span class="step">STEWARD</span><h3>Register a clause</h3><p>Fix a pinned policy version and a bounded section.</p><label>Clause ID<input name="clause_id" required maxlength="48" placeholder="publication-rule" /></label><label>Pinned raw GitHub URL<input name="url" required placeholder="https://raw.githubusercontent.com/…" /></label><div class="two"><label>Start marker<input name="start" required placeholder="## Rule" /></label><label>End marker<input name="end" required placeholder="## Next rule" /></label></div><button class="button" type="submit">Register clause</button></form>
          <form class="card operation" data-method="open_commitment"><span class="step">PARTY A</span><h3>Open a commitment</h3><p>The other party accepts before the action is enabled.</p><label>Clause ID<input name="clause_id" required placeholder="publication-rule" /></label><label>Other party address<input name="other_party" required placeholder="0x…" /></label><button class="button" type="submit">Open commitment</button></form>
          <form class="card operation" data-method="propose_revision"><span class="step">STEWARD</span><h3>Propose a revision</h3><p>Assessment uses frozen old and new commit URLs.</p><label>Clause ID<input name="clause_id" required placeholder="publication-rule" /></label><label>New pinned raw URL<input name="new_url" required placeholder="https://raw.githubusercontent.com/…" /></label><button class="button" type="submit">Propose revision</button></form>
          <div class="card operation"><span class="step">ANY ACCOUNT / PARTIES</span><h3>Advance or resolve</h3><p>Use an ID from the state above. Consent must come from both wallets. Exercise binds one artifact hash and closes the commitment.</p><label>Clause ID<input id="action-clause" placeholder="publication-rule" /></label><label>Commitment ID<input id="action-id" type="number" min="0" step="1" placeholder="0" /></label><label>Artifact SHA-256 (for Exercise)<input id="artifact-digest" maxlength="64" placeholder="64 lowercase hex characters" /></label><label>Or hash a file locally<input id="artifact-file" type="file" /></label><div class="action-grid"><button class="button secondary" data-action="assess_revision">Assess</button><button class="button secondary" data-action="expire_revision">Expire proposal</button><button class="button secondary" data-action="accept_commitment">Accept</button><button class="button secondary" data-action="consent_to_revision">Consent</button><button class="button secondary" data-action="exercise">Exercise</button><button class="button secondary" data-action="exit_review">Exit review</button><button class="button secondary" data-action="expire_review">Expire review</button></div></div>
        </div>
      </section>
      <section class="workspace examples"><div class="section-heading"><div><span class="kicker">04 — REPRODUCIBLE INPUTS</span><h2>Two real policy edits</h2></div><span class="fineprint">Use these pinned inputs; the recorded verdict appears in finalized state above.</span></div>
        <div class="split"><article class="card example"><span class="pill good">EDITORIAL EXAMPLE</span><h3>“Github” → “GitHub”</h3><p>EIP-1 changes the spelling in its <code>discussions-to</code> guidance. Both versions are pinned to public commits.</p><blockquote class="evidence-quote">“The URL cannot point to Github pull requests…”<br>→ “The URL cannot point to GitHub pull requests…”</blockquote><div class="evidence-links"><a href="${raw(demo.editorial.old)}" target="_blank" rel="noreferrer">Old pinned source ↗</a><a href="${raw(demo.editorial.next)}" target="_blank" rel="noreferrer">New pinned source ↗</a></div><button class="text-button" data-fill="editorial">Fill register form ↗</button><button class="text-button" data-next="editorial">Fill revision form ↗</button></article><article class="card example"><span class="pill caution">MATERIAL EXAMPLE</span><h3>Specification link rule changes</h3><p>EIP-1 revises permitted execution-specification-test links. Existing commitments should enter REVIEW.</p><blockquote class="evidence-quote">Old: “Permitted Execution Specification Tests URLs must anchor to a specific commit…”<br>New: “Links to specific commits of those test files are permitted under the same rule.”</blockquote><div class="evidence-links"><a href="${raw(demo.material.old)}" target="_blank" rel="noreferrer">Old pinned source ↗</a><a href="${raw(demo.material.next)}" target="_blank" rel="noreferrer">New pinned source ↗</a></div><button class="text-button" data-fill="material">Fill register form ↗</button><button class="text-button" data-next="material">Fill revision form ↗</button></article></div>
      </section>
      <section class="workspace"><div class="section-heading"><div><span class="kicker">05 — PROOF</span><h2>Studionet proof</h2></div><span class="fineprint">Recorded snapshot · compare with live state above</span></div><div class="card" id="proof"><div class="empty">Loading verified transaction snapshot…</div></div></section>
      <section class="workspace"><div class="section-heading"><div><span class="kicker">06 — YOUR ACTIVITY</span><h2>Transaction trail</h2></div></div><div class="card" id="transactions"><div class="empty">Wallet transactions on this browser appear here.</div></div></section>
    </main><footer><span>POLICY DRIFT FIREWALL · GENLAYER NATIVE</span><span>Evidence is public. Consent is explicit.</span></footer>`;
  renderState(); renderProof(); renderTransactions(); bind();
}

function renderProof() {
  const panel = document.querySelector('#proof');
  if (network !== 'studionet') {
    panel.innerHTML = '<div class="empty">The recorded proof is for Studionet. Select Studionet to inspect it.</div>';
    return;
  }
  if (!proof) {
    panel.innerHTML = '<div class="empty">Recorded proof is unavailable. Live state remains available above.</div>';
    return;
  }
  const txs = proof.transactions || [];
  const labels = ['Deploy contract', 'Register editorial clause', 'Propose editorial revision', 'Assess editorial revision', 'Register material clause', 'Propose material revision', 'Assess material revision'];
  panel.innerHTML = `<p class="fineprint">Snapshot verified ${escape(proof.verifiedAt || '—')} · Contract <a href="https://explorer-studio.genlayer.com" target="_blank" rel="noreferrer">${escape(proof.contract)}</a> · Source SHA-256 ${escape(proof.expectedContractSha256)}</p>
    <p class="fineprint">Historical proof is recorded evidence. The clauses and commitments above are read from the latest finalized chain state.</p>
    ${txs.map((tx, i) => `<div class="tx"><div><strong>${escape(tx.label || labels[i] || 'Protocol transaction')}</strong><a class="hash-link" href="https://explorer-studio.genlayer.com/tx/${encodeURIComponent(tx.hash)}" target="_blank" rel="noreferrer" title="${escape(tx.hash)}">${escape(short(tx.hash))} ↗</a></div><div class="tx-right">${pill(tx.status)}<small>${escape(tx.execution || 'UNKNOWN')}</small></div></div>`).join('')}`;
}

function renderState() {
  const clauses = data?.clauses || [];
  const commitments = data?.commitments || [];
  document.querySelector('#clause-count').textContent = data ? String(clauses.length) : '—';
  document.querySelector('#commitment-count').textContent = data ? String(commitments.length) : '—';
  document.querySelector('#steward').textContent = data ? short(data.steward) : '—';
  document.querySelector('#steward').title = data?.steward || '';
  document.querySelector('#sync').textContent = data ? `Finalized read · ${networks[network].label}` : 'Read-only until attached';
  document.querySelector('#clauses').innerHTML = clauses.length ? clauses.map(c => `<div class="record"><div class="record-top"><strong>${escape(c.id)}</strong>${pill(c.pendingState || c.lastVerdict || 'CURRENT')}</div><small>Version ${escape(c.version)} · ${escape(short(c.url))}</small><small>Digest ${escape(short(c.digest))}</small>${c.pendingUrl ? `<small>Proposed ${escape(short(c.pendingUrl))} · deadline ${escape(date(c.pendingDeadline))}</small>` : ''}${c.lastVerdict ? `<small>Last verdict: ${escape(c.lastVerdict)}</small>` : ''}<a href="${escape(c.url)}" target="_blank" rel="noreferrer">View pinned source ↗</a></div>`).join('') : '<div class="empty">No clauses registered yet.</div>';
  document.querySelector('#commitments').innerHTML = commitments.length ? commitments.map((c, id) => `<div class="record"><div class="record-top"><strong>#${id} · ${escape(c.clauseId)}</strong>${pill(c.status)}</div><small>${escape(short(c.partyA))} ↔ ${escape(short(c.partyB))}</small><small>Bound version ${escape(c.version)} · ${escape(short(c.boundUrl))}</small>${c.artifactDigest ? `<small>Artifact SHA-256: ${escape(c.artifactDigest)}</small><small>Exercised ${escape(date(c.exercisedAt))}</small>` : ''}${c.status === 'REVIEW' ? `<small>Consent: A ${c.aConsent ? '✓' : '○'} / B ${c.bConsent ? '✓' : '○'} · deadline ${escape(date(c.reviewDeadline))}</small>` : ''}</div>`).join('') : '<div class="empty">No commitments opened yet.</div>';
}

function renderTransactions() {
  const panel = document.querySelector('#transactions');
  panel.innerHTML = pending.length ? pending.map(tx => `<div class="tx"><div><strong>${escape(tx.label)}</strong><a class="hash-link" href="${network === 'studionet' ? 'https://explorer-studio.genlayer.com' : 'https://explorer-bradbury.genlayer.com'}/tx/${encodeURIComponent(tx.hash)}" target="_blank" rel="noreferrer" title="${escape(tx.hash)}">${escape(short(tx.hash))} ↗</a>${tx.contractAddress ? `<small>Deployed contract: ${escape(tx.contractAddress)}</small>` : ''}${tx.votes ? `<small>Validator votes: ${escape(JSON.stringify(tx.votes))}</small>` : ''}</div><div class="tx-right">${pill(tx.status)}<small>${escape(tx.execution || 'Awaiting execution result')}</small></div></div>`).join('') : '<div class="empty">Wallet transactions on this browser appear here.</div>';
}

function requireAddress() {
  const candidate = document.querySelector('#address').value.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(candidate)) throw new Error('Enter a 0x contract address with 40 hex digits.');
  return candidate;
}

async function connectWallet() {
  if (!window.ethereum) throw new Error('No browser wallet detected. Open this app in a browser with a GenLayer-compatible wallet.');
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  if (!accounts?.[0]) throw new Error('Wallet did not return an account.');
  account = accounts[0];
  client = createClient({ chain: networks[network].chain, account, provider: window.ethereum });
  await client.connect(network);
  document.querySelector('#connect').textContent = short(account);
  toast(`Wallet connected: ${short(account)} on ${networks[network].label}.`, 'success');
}

async function refresh() {
  if (refreshing) return;
  address = requireAddress();
  refreshing = true;
  try {
    const result = await getClient().readContract({ address, functionName: 'get_state', args: [], transactionHashVariant: TransactionHashVariant.LATEST_FINAL });
    data = JSON.parse(String(result));
    localStorage.setItem(`pdf-address-${network}`, address);
    renderState();
    toast('Finalized contract state loaded.', 'success');
  } finally { refreshing = false; }
}

function record(hash, label) {
  pending.unshift({ hash, label, status: 'PENDING', execution: '' });
  saveTransactions();
  renderTransactions();
  toast(`Submitted ${label}: ${short(hash)}. Waiting for finality.`, 'info');
}

async function write(functionName, args) {
  if (!account) await connectWallet();
  address = requireAddress();
  const hash = await getClient().writeContract({ address, functionName, args, value: 0n });
  record(hash, functionName.replaceAll('_', ' '));
  return hash;
}

async function deploy() {
  if (!account) await connectWallet();
  const response = await fetch(`${assetBase}contract.py`);
  if (!response.ok) throw new Error('Contract source could not be loaded.');
  const hash = await getClient().deployContract({ code: await response.text(), args: [] });
  record(hash, 'deploy contract');
  toast('Deployment submitted. Attach the contract address only after finalization and receipt verification.', 'info');
}

async function pollTransactions() {
  if (!pending.length) return;
  for (const tx of pending.filter(item => item.status !== 'FINALIZED' && item.status !== 'CANCELED')) {
    try {
      const receipt = await getClient().getTransaction({ hash: tx.hash });
      tx.status = receipt.statusName || String(receipt.status || 'PENDING');
      const leader = receipt.consensus_data?.leader_receipt?.find(item => item.mode === 'leader');
      tx.execution = receipt.txExecutionResultName || (leader?.execution_result === 'SUCCESS' && leader?.result?.status === 'return'
        ? 'FINISHED_WITH_RETURN'
        : leader?.execution_result || '');
      tx.votes = receipt.consensus_data?.votes || null;
      if (tx.status === 'FINALIZED') {
        if (tx.execution === 'FINISHED_WITH_RETURN') {
          toast(`${tx.label} finalized successfully. Refreshing state.`, 'success');
          if (tx.label === 'deploy contract') {
            tx.contractAddress = receipt.txDataDecoded?.contractAddress || receipt.data?.contractAddress || receipt.data?.contract_address || '';
            if (tx.contractAddress) {
              document.querySelector('#address').value = tx.contractAddress;
              address = tx.contractAddress;
              await refresh();
            } else {
              toast('Deployment finalized. Find its contract address in the transaction receipt and attach it here.', 'info');
            }
          } else if (address) await refresh();
        } else {
          toast(`${tx.label} finalized with ${tx.execution || 'unknown execution result'}. Inspect this transaction before retrying.`, 'error');
        }
      }
    } catch (error) { tx.execution = `Polling: ${error.message}`; }
  }
  saveTransactions();
  renderTransactions();
}

function bind() {
  document.querySelector('#network').addEventListener('change', event => {
    network = event.target.value; localStorage.setItem('pdf-network', network);
    address = localStorage.getItem(`pdf-address-${network}`) || (network === 'studionet' ? studionetDemoAddress : '');
    client = null; account = ''; data = null;
    try { pending = JSON.parse(localStorage.getItem(transactionStore()) || '[]'); } catch { pending = []; }
    page();
  });
  document.querySelector('#connect').addEventListener('click', () => connectWallet().catch(error => toast(error.message, 'error')));
  document.querySelector('#attach').addEventListener('click', () => refresh().catch(error => toast(error.message, 'error')));
  document.querySelector('#refresh').addEventListener('click', () => refresh().catch(error => toast(error.message, 'error')));
  document.querySelector('#deploy').addEventListener('click', () => deploy().catch(error => toast(error.message, 'error')));
  document.querySelectorAll('form[data-method]').forEach(form => form.addEventListener('submit', async event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form));
    const args = Object.values(values).map(value => String(value).trim());
    try { await write(form.dataset.method, args); } catch (error) { toast(error.message, 'error'); }
  }));
  document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', async () => {
    const method = button.dataset.action;
    const isClause = ['assess_revision', 'expire_revision'].includes(method);
    const input = document.querySelector(isClause ? '#action-clause' : '#action-id').value.trim();
    if (!input || (!isClause && !/^\d+$/.test(input))) return toast(`Enter a ${isClause ? 'clause ID' : 'commitment ID'}.`, 'error');
    const args = [isClause ? input : Number(input)];
    if (method === 'exercise') {
      const digest = document.querySelector('#artifact-digest').value.trim();
      if (!/^[0-9a-f]{64}$/.test(digest)) return toast('Enter the artifact SHA-256 as 64 lowercase hex characters.', 'error');
      args.push(digest);
    }
    try { await write(method, args); } catch (error) { toast(error.message, 'error'); }
  }));
  document.querySelector('#artifact-file').addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const hash = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
      document.querySelector('#artifact-digest').value = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
      toast(`Hashed ${file.name} locally. The file was not uploaded.`, 'success');
    } catch (error) { toast(`Could not hash file: ${error.message}`, 'error'); }
  });
  document.querySelectorAll('[data-fill]').forEach(button => button.addEventListener('click', () => {
    const item = demo[button.dataset.fill];
    const form = document.querySelector('[data-method="register_clause"]');
    form.elements.clause_id.value = item.id; form.elements.url.value = raw(item.old);
    form.elements.start.value = item.start; form.elements.end.value = item.end;
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }));
  document.querySelectorAll('[data-next]').forEach(button => button.addEventListener('click', () => {
    const item = demo[button.dataset.next];
    const form = document.querySelector('[data-method="propose_revision"]');
    form.elements.clause_id.value = item.id; form.elements.new_url.value = raw(item.next);
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }));
}

page();
fetch(`${assetBase}proof.json`).then(response => response.ok ? response.json() : null).then(value => { proof = value; renderProof(); }).catch(() => {
  document.querySelector('#proof').innerHTML = '<div class="empty">Recorded proof could not be loaded. Live state remains available above.</div>';
});
window.ethereum?.on?.('accountsChanged', () => {
  account = '';
  client = null;
  document.querySelector('#connect').textContent = 'Connect wallet';
  toast('Wallet account changed. Connect the selected account before signing another transaction.', 'info');
});
setInterval(pollTransactions, 10000);
if (address) refresh().catch(error => toast(`Saved deployment could not be read: ${error.message}`, 'error'));
