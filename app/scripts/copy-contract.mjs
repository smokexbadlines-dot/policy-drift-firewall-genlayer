import { copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, '../../contracts/policy_drift.py');
const targetDirectory = resolve(here, '../public');
mkdirSync(targetDirectory, { recursive: true });
copyFileSync(source, resolve(targetDirectory, 'contract.py'));
