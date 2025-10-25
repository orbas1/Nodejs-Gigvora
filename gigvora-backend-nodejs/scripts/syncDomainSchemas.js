#!/usr/bin/env node
import { join } from 'node:path';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { authUserSchema } from '../src/domains/schemas/auth.js';
import { projectWorkspaceSchema } from '../src/domains/schemas/marketplace.js';
import { featureFlagSchema } from '../src/domains/schemas/platform.js';
import { schemaPaths, writeJsonArtifact, readJsonFile } from './lib/schemaArtifacts.js';

async function writeSchema(schema, targetPath) {
  const jsonSchema = zodToJsonSchema(schema, 'Schema');
  await writeJsonArtifact(targetPath, jsonSchema);
}

async function buildDomainSnapshot(snapshotPath) {
  try {
    const module = await import('../src/domains/serviceCatalog.js');
    const snapshot =
      typeof module.getDomainServicesSnapshot === 'function'
        ? module.getDomainServicesSnapshot()
        : null;

    if (!snapshot) {
      throw new Error('Domain service catalog did not return a snapshot.');
    }

    return { ...snapshot, generatedAt: new Date().toISOString() };
  } catch (error) {
    console.warn('Unable to generate live domain registry snapshot:', error.message);
    const fallback = (await readJsonFile(snapshotPath, null)) ?? {};
    return {
      ...fallback,
      contexts: fallback.contexts ?? {},
      services: fallback.services ?? {},
      generatedAt: new Date().toISOString(),
      warning: 'Snapshot generation failed; using last known snapshot or defaults.',
    };
  }
}

async function main() {
  const outputDir = schemaPaths.domainContractsRoot;
  await writeSchema(authUserSchema, join(outputDir, 'auth', 'user.json'));
  await writeSchema(projectWorkspaceSchema, join(outputDir, 'marketplace', 'workspace.json'));
  await writeSchema(featureFlagSchema, join(outputDir, 'platform', 'feature-flag.json'));

  const snapshotPath = join(outputDir, 'registry-snapshot.json');
  const snapshot = await buildDomainSnapshot(snapshotPath);
  await writeJsonArtifact(snapshotPath, snapshot);
}

main().catch((error) => {
  console.error('Failed to sync domain schemas:', error);
  process.exitCode = 1;
});
