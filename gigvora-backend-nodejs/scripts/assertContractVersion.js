import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const manifestPath = path.resolve(projectRoot, '..', 'shared-contracts', 'contract-manifest.json');

async function run() {
  if (!(await fs.pathExists(manifestPath))) {
    throw new Error('Missing contract manifest. Run the schema generator before running CI checks.');
  }

  const manifestRaw = await fs.readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestRaw);

  if (manifest.pendingChanges) {
    throw new Error(
      'Contract manifest reports pending changes. Bump the contract version and update the changelog before merging.',
    );
  }

  console.log('Contract manifest clean. No pending contract version bump required.');
}

run().catch((error) => {
  console.error('Contract version assertion failed', error);
  process.exitCode = 1;
});

