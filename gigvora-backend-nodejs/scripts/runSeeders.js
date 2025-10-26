#!/usr/bin/env node

import process from 'node:process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';

import { Sequelize } from 'sequelize';
import { Umzug, SequelizeStorage } from 'umzug';

import logger from '../src/utils/logger.js';
import models from '../src/models/index.js';

const sequelize = models.sequelize;
const queryInterface = sequelize.getQueryInterface();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const seederPaths = new Map();
let seedAuditTableAvailable = null;
let seedRegistry = null;

async function loadSeedRegistry() {
  if (seedRegistry !== null) {
    return seedRegistry;
  }

  const registryPath = path.resolve(rootDir, 'database', 'seeders', 'registry.json');
  try {
    const payload = await fs.readFile(registryPath, 'utf8');
    seedRegistry = JSON.parse(payload);
  } catch (error) {
    logger.debug({ err: error, registryPath }, 'Seed registry not available, proceeding without metadata');
    seedRegistry = {};
  }
  return seedRegistry;
}

function buildLogger() {
  const umzugLogger = logger.child({ component: 'seed-runner' });
  return {
    info: (msg) => umzugLogger.info(msg),
    warn: (msg) => umzugLogger.warn(msg),
    error: (msg) => umzugLogger.error(msg),
    debug: (msg) => umzugLogger.debug(msg),
  };
}

async function computeChecksum(filePath) {
  if (!filePath) {
    return null;
  }
  try {
    const content = await fs.readFile(filePath);
    const hash = createHash('sha256');
    hash.update(content);
    return hash.digest('hex');
  } catch (error) {
    logger.warn({ err: error, filePath }, 'Failed to compute seeder checksum');
    return null;
  }
}

async function ensureSeedAuditTable() {
  if (seedAuditTableAvailable !== null) {
    return seedAuditTableAvailable;
  }
  try {
    await queryInterface.describeTable('seed_execution_audits');
    seedAuditTableAvailable = true;
  } catch (error) {
    const message = error?.message?.toLowerCase?.() ?? '';
    if (message.includes('does not exist') || message.includes('unknown')) {
      seedAuditTableAvailable = false;
    } else {
      throw error;
    }
  }
  return seedAuditTableAvailable;
}

function resolveExecutor() {
  if (process.env.SEED_EXECUTOR) {
    return process.env.SEED_EXECUTOR;
  }
  try {
    return os.userInfo().username;
  } catch (error) {
    logger.debug({ err: error }, 'Failed to resolve OS user for seed executor');
    return null;
  }
}

function resolveHost() {
  try {
    return os.hostname();
  } catch (error) {
    logger.debug({ err: error }, 'Failed to resolve hostname for seed executor');
    return null;
  }
}

async function recordSeedAudit(entry) {
  if (!(await ensureSeedAuditTable())) {
    return;
  }

  const executedAt = entry.executedAt ?? new Date();
  const payload = {
    seederName: entry.seederName,
    checksum: entry.checksum,
    direction: entry.direction,
    status: entry.status,
    executedBy: entry.executedBy,
    executedFrom: entry.executedFrom,
    environment: entry.environment,
    durationMs: entry.durationMs,
    executedAt,
    datasetTags: entry.datasetTags ?? null,
    metadata: entry.metadata ?? null,
    notes: entry.notes,
    createdAt: executedAt,
    updatedAt: executedAt,
  };

  await queryInterface.bulkInsert('seed_execution_audits', [payload]);
}

function normaliseDuration(start, end) {
  if (!start || !end) {
    return null;
  }
  const diffMs = Number(end - start) / 1_000_000;
  return Number(diffMs.toFixed(3));
}

function extractRegistryMetadata(name, direction) {
  const registry = seedRegistry ?? {};
  const metadata = registry[name] ?? registry[name.replace(/\.cjs$/, '')] ?? null;
  if (!metadata) {
    return { datasetTags: null, metadata: { direction } };
  }

  return {
    datasetTags: Array.isArray(metadata.tags) ? metadata.tags : null,
    metadata: {
      direction,
      title: metadata.title,
      personas: metadata.personas,
      domains: metadata.domains,
      summary: metadata.summary,
    },
  };
}

const umzug = new Umzug({
  context: { queryInterface, Sequelize },
  storage: new SequelizeStorage({ sequelize, modelName: 'SequelizeData' }),
  logger: buildLogger(),
  migrations: {
    glob: ['database/seeders/*.cjs', { cwd: rootDir }],
    resolve: ({ name, path: seederPath, context }) => {
      seederPaths.set(name, seederPath);
      return {
        name,
        path: seederPath,
        up: async () => {
          const mod = await import(pathToFileURL(seederPath));
          const seeder = mod.default ?? mod;
          return seeder.up(context.queryInterface, context.Sequelize);
        },
        down: async () => {
          const mod = await import(pathToFileURL(seederPath));
          const seeder = mod.default ?? mod;
          if (typeof seeder.down !== 'function') {
            throw new Error(`Seeder ${name} does not export a down method`);
          }
          return seeder.down(context.queryInterface, context.Sequelize);
        },
      };
    },
  },
});

async function runSeeders({ to, step }) {
  await loadSeedRegistry();

  const pending = await umzug.pending();
  if (!pending.length) {
    logger.info('No pending seeders.');
    return;
  }

  let selected = pending;
  if (to) {
    const index = pending.findIndex((seeder) => seeder.name === to);
    if (index === -1) {
      throw new Error(`Target seeder ${to} not found in pending list.`);
    }
    selected = pending.slice(0, index + 1);
  }

  if (step && Number.isFinite(step)) {
    selected = selected.slice(0, step);
  }

  for (const seeder of selected) {
    const started = process.hrtime.bigint();
    const executedAt = new Date();
    try {
      await umzug.up({ migrations: [seeder.name] });
      const finished = process.hrtime.bigint();
      const durationMs = normaliseDuration(started, finished);
      const checksum = await computeChecksum(seederPaths.get(seeder.name));
      const registryInfo = extractRegistryMetadata(seeder.name, 'up');

      await recordSeedAudit({
        seederName: seeder.name,
        checksum,
        direction: 'up',
        status: 'completed',
        executedBy: resolveExecutor(),
        executedFrom: resolveHost(),
        environment: process.env.NODE_ENV ?? 'development',
        durationMs,
        executedAt,
        datasetTags: registryInfo.datasetTags,
        metadata: registryInfo.metadata,
      });
    } catch (error) {
      const finished = process.hrtime.bigint();
      const durationMs = normaliseDuration(started, finished);
      const registryInfo = extractRegistryMetadata(seeder.name, 'up');
      await recordSeedAudit({
        seederName: seeder.name,
        checksum: await computeChecksum(seederPaths.get(seeder.name)),
        direction: 'up',
        status: 'failed',
        executedBy: resolveExecutor(),
        executedFrom: resolveHost(),
        environment: process.env.NODE_ENV ?? 'development',
        durationMs,
        executedAt,
        datasetTags: registryInfo.datasetTags,
        metadata: registryInfo.metadata,
        notes: error?.message,
      });
      throw error;
    }
  }
}

async function rollbackSeeders({ to, step }) {
  await loadSeedRegistry();

  const executed = await umzug.executed();
  if (!executed.length) {
    logger.info('No executed seeders to rollback.');
    return;
  }

  let selected = executed.slice().reverse();
  if (to) {
    const index = selected.findIndex((seeder) => seeder.name === to);
    if (index === -1) {
      throw new Error(`Target seeder ${to} not found in executed list.`);
    }
    selected = selected.slice(0, index + 1);
  }

  if (step && Number.isFinite(step)) {
    selected = selected.slice(0, step);
  }

  for (const seeder of selected) {
    const started = process.hrtime.bigint();
    const executedAt = new Date();
    try {
      await umzug.down({ migrations: [seeder.name] });
      const finished = process.hrtime.bigint();
      const durationMs = normaliseDuration(started, finished);
      const registryInfo = extractRegistryMetadata(seeder.name, 'down');

      await recordSeedAudit({
        seederName: seeder.name,
        checksum: await computeChecksum(seederPaths.get(seeder.name)),
        direction: 'down',
        status: 'rolled_back',
        executedBy: resolveExecutor(),
        executedFrom: resolveHost(),
        environment: process.env.NODE_ENV ?? 'development',
        durationMs,
        executedAt,
        datasetTags: registryInfo.datasetTags,
        metadata: registryInfo.metadata,
      });
    } catch (error) {
      const finished = process.hrtime.bigint();
      const durationMs = normaliseDuration(started, finished);
      const registryInfo = extractRegistryMetadata(seeder.name, 'down');
      await recordSeedAudit({
        seederName: seeder.name,
        checksum: await computeChecksum(seederPaths.get(seeder.name)),
        direction: 'down',
        status: 'failed',
        executedBy: resolveExecutor(),
        executedFrom: resolveHost(),
        environment: process.env.NODE_ENV ?? 'development',
        durationMs,
        executedAt,
        datasetTags: registryInfo.datasetTags,
        metadata: registryInfo.metadata,
        notes: error?.message,
      });
      throw error;
    }
  }
}

function parseNumberOption(options, key) {
  if (!options.has(key)) {
    return undefined;
  }
  const value = Number(options.get(key));
  if (Number.isNaN(value)) {
    throw new Error(`Option --${key} expects a numeric value.`);
  }
  return value;
}

function parseOptions(argv) {
  const options = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      continue;
    }
    const key = token.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      options.set(key, next);
      index += 1;
    } else {
      options.set(key, 'true');
    }
  }
  return options;
}

async function main() {
  const command = process.argv[2] ?? 'up';
  const options = parseOptions(process.argv.slice(3));
  const to = options.get('to');
  const step = parseNumberOption(options, 'step');

  try {
    switch (command) {
      case 'up':
        await runSeeders({ to, step });
        break;
      case 'down':
        await rollbackSeeders({ to, step });
        break;
      case 'pending': {
        const pending = await umzug.pending();
        pending.forEach((seeder) => {
          console.log(seeder.name);
        });
        break;
      }
      case 'executed': {
        const executed = await umzug.executed();
        executed.forEach((seeder) => {
          console.log(seeder.name);
        });
        break;
      }
      case 'status': {
        const pending = await umzug.pending();
        const executed = await umzug.executed();
        console.log('Executed seeders:');
        executed.forEach((seeder) => console.log(`  ✓ ${seeder.name}`));
        console.log('Pending seeders:');
        pending.forEach((seeder) => console.log(`  • ${seeder.name}`));
        break;
      }
      default:
        throw new Error(`Unsupported command: ${command}`);
    }
  } finally {
    await sequelize.close();
  }
}

main().catch((error) => {
  logger.error({ err: error }, 'Seed runner failed');
  process.exitCode = 1;
});
