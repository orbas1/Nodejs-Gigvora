#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, relative } from 'node:path';
import fs from 'fs-extra';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { authUserSchema } from '../src/domains/schemas/auth.js';
import { projectWorkspaceSchema } from '../src/domains/schemas/marketplace.js';
import { featureFlagSchema } from '../src/domains/schemas/platform.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function renderSchema(schema) {
  const jsonSchema = zodToJsonSchema(schema, 'Schema');
  return `${JSON.stringify(jsonSchema, null, 2)}\n`;
}

async function writeOrCheck(content, targetPath, { check }) {
  await fs.ensureDir(dirname(targetPath));
  if (check) {
    const existing = await fs.readFile(targetPath, 'utf8');
    if (existing !== content) {
      const root = resolve(__dirname, '..');
      const displayPath = relative(root, targetPath);
      throw new Error(
        `Schema drift detected for ${displayPath}. Run scripts/syncDomainSchemas.js to regenerate.`,
      );
    }
    return;
  }

  await fs.writeFile(targetPath, content, 'utf8');
}

async function main() {
  const args = process.argv.slice(2);
  const skipRegistry = args.includes('--skip-registry');
  const check = args.includes('--check');
  const root = resolve(__dirname, '..');
  const outputDir = join(root, '..', 'shared-contracts', 'domain');

  await writeOrCheck(await renderSchema(authUserSchema), join(outputDir, 'auth', 'user.json'), { check });
  await writeOrCheck(
    await renderSchema(projectWorkspaceSchema),
    join(outputDir, 'marketplace', 'workspace.json'),
    { check },
  );
  await writeOrCheck(await renderSchema(featureFlagSchema), join(outputDir, 'platform', 'feature-flag.json'), {
    check,
  });

  if (skipRegistry) {
    console.info('Skipping domain registry snapshot generation (--skip-registry).');
  } else {
    const { getDomainServicesSnapshot } = await import('../src/domains/serviceCatalog.js');
    const snapshotPath = join(outputDir, 'registry-snapshot.json');
    const content = `${JSON.stringify(getDomainServicesSnapshot(), null, 2)}\n`;
    await writeOrCheck(content, snapshotPath, { check });
  }
}

main().catch((error) => {
  console.error('Failed to sync domain schemas:', error);
  process.exitCode = 1;
});
