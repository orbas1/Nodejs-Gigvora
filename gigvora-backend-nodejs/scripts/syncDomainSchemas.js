#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import fs from 'fs-extra';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { authUserSchema } from '../src/domains/schemas/auth.js';
import { projectWorkspaceSchema } from '../src/domains/schemas/marketplace.js';
import { featureFlagSchema } from '../src/domains/schemas/platform.js';
import { getDomainServicesSnapshot } from '../src/domains/serviceCatalog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function writeSchema(schema, targetPath) {
  const jsonSchema = zodToJsonSchema(schema, 'Schema');
  await fs.ensureDir(dirname(targetPath));
  await fs.writeJson(targetPath, jsonSchema, { spaces: 2 });
}

async function main() {
  const root = resolve(__dirname, '..');
  const outputDir = join(root, '..', 'shared-contracts', 'domain');
  await writeSchema(authUserSchema, join(outputDir, 'auth', 'user.json'));
  await writeSchema(projectWorkspaceSchema, join(outputDir, 'marketplace', 'workspace.json'));
  await writeSchema(featureFlagSchema, join(outputDir, 'platform', 'feature-flag.json'));

  const snapshotPath = join(outputDir, 'registry-snapshot.json');
  await fs.writeJson(snapshotPath, getDomainServicesSnapshot(), { spaces: 2 });
}

main().catch((error) => {
  console.error('Failed to sync domain schemas:', error);
  process.exitCode = 1;
});
