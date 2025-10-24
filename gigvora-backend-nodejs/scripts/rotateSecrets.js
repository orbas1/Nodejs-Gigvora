#!/usr/bin/env node
import crypto from 'node:crypto';
import process from 'node:process';

import sequelize from '../src/models/sequelizeClient.js';
import { getPlatformSettings, updatePlatformSettings } from '../src/services/platformSettingsService.js';
import { refreshRuntimeConfig } from '../src/config/runtimeConfig.js';

function parseArgs(argv = process.argv.slice(2)) {
  const options = {
    dryRun: false,
    rotatedBy: process.env.GIGVORA_OPERATOR ?? process.env.USER ?? 'secret-rotation-cli',
    skipRuntimeRefresh: false,
  };

  for (const arg of argv) {
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg.startsWith('--rotated-by=')) {
      options.rotatedBy = arg.slice('--rotated-by='.length) || options.rotatedBy;
    } else if (arg === '--skip-runtime-refresh') {
      options.skipRuntimeRefresh = true;
    }
  }

  return options;
}

function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

async function rotateMetricsToken({ dryRun, rotatedBy, skipRuntimeRefresh }) {
  await sequelize.authenticate();
  const currentSettings = await getPlatformSettings();
  const previousToken = currentSettings?.security?.tokens?.metricsBearer ?? '';
  const nextToken = generateToken();
  const rotationTimestamp = new Date().toISOString();

  if (dryRun) {
    console.log('Dry run: metrics bearer token would be rotated.');
    console.log(`Previous token preview: ${previousToken ? previousToken.slice(0, 6) + '…' : '(unset)'}`);
    console.log(`Generated token preview: ${nextToken.slice(0, 6)}…`);
    return;
  }

  const updatedSettings = await updatePlatformSettings({
    security: {
      tokens: {
        metricsBearer: nextToken,
        rotatedBy,
        lastRotatedAt: rotationTimestamp,
      },
    },
  });

  console.log('Metrics bearer token rotated successfully.');
  const acknowledgement = updatedSettings?.security?.tokens;
  if (acknowledgement) {
    console.log(
      `Rotation metadata -> rotatedBy: ${acknowledgement.rotatedBy ?? 'unknown'}, lastRotatedAt: ${acknowledgement.lastRotatedAt ?? 'n/a'}`,
    );
  }

  if (!skipRuntimeRefresh) {
    await refreshRuntimeConfig({ reason: 'secret-rotation', overrides: { METRICS_BEARER_TOKEN: nextToken } });
    console.log('Runtime configuration refreshed with rotated metrics token.');
  } else {
    console.log('Runtime configuration refresh skipped by operator request.');
  }
}

async function main() {
  const options = parseArgs();
  try {
    await rotateMetricsToken(options);
  } finally {
    await sequelize.close();
  }
}

main().catch((error) => {
  console.error('Secret rotation failed:', error);
  process.exitCode = 1;
});
