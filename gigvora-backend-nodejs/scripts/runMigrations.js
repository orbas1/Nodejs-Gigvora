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

const migrationPaths = new Map();
let migrationAuditTableAvailable = null;

function buildLogger() {
  const umzugLogger = logger.child({ component: 'migration-runner' });
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
    logger.warn({ err: error, filePath }, 'Failed to compute migration checksum');
    return null;
  }
}

async function ensureMigrationAuditTable() {
  if (migrationAuditTableAvailable !== null) {
    return migrationAuditTableAvailable;
  }
  try {
    await queryInterface.describeTable('schema_migration_audits');
    migrationAuditTableAvailable = true;
  } catch (error) {
    const message = error?.message?.toLowerCase?.() ?? '';
    if (message.includes('does not exist') || message.includes('unknown')) {
      migrationAuditTableAvailable = false;
    } else {
      throw error;
    }
  }
  return migrationAuditTableAvailable;
}

async function recordMigrationAudit(entry) {
  if (!(await ensureMigrationAuditTable())) {
    return;
  }

  const executedAt = entry.executedAt ?? new Date();
  const payload = {
    migrationName: entry.migrationName,
    checksum: entry.checksum,
    direction: entry.direction,
    status: entry.status,
    executedBy: entry.executedBy,
    executedFrom: entry.executedFrom,
    environment: entry.environment,
    durationMs: entry.durationMs,
    executedAt,
    notes: entry.notes,
    metadata: entry.metadata ?? null,
    createdAt: executedAt,
    updatedAt: executedAt,
  };

  await queryInterface.bulkInsert('schema_migration_audits', [payload]);
}

function normaliseDuration(start, end) {
  if (!start || !end) {
    return null;
  }
  const diffMs = Number(end - start) / 1_000_000;
  return Number(diffMs.toFixed(3));
}

function resolveExecutor() {
  if (process.env.MIGRATION_EXECUTOR) {
    return process.env.MIGRATION_EXECUTOR;
  }
  try {
    return os.userInfo().username;
  } catch (error) {
    logger.debug({ err: error }, 'Failed to resolve OS user for migration executor');
    return null;
  }
}

function resolveHost() {
  try {
    return os.hostname();
  } catch (error) {
    logger.debug({ err: error }, 'Failed to resolve hostname for migration executor');
    return null;
  }
}

const umzug = new Umzug({
  context: { queryInterface, Sequelize },
  storage: new SequelizeStorage({ sequelize }),
  logger: buildLogger(),
  migrations: {
    glob: ['database/migrations/*.cjs', { cwd: rootDir }],
    resolve: ({ name, path: migrationPath, context }) => {
      migrationPaths.set(name, migrationPath);
      return {
        name,
        path: migrationPath,
        up: async () => {
          const mod = await import(pathToFileURL(migrationPath));
          const migration = mod.default ?? mod;
          return migration.up(context.queryInterface, context.Sequelize);
        },
        down: async () => {
          const mod = await import(pathToFileURL(migrationPath));
          const migration = mod.default ?? mod;
          if (typeof migration.down !== 'function') {
            throw new Error(`Migration ${name} does not export a down method`);
          }
          return migration.down(context.queryInterface, context.Sequelize);
        },
      };
    },
  },
});

async function runMigrations({ to, step }) {
  const pending = await umzug.pending();
  if (!pending.length) {
    logger.info('No pending migrations.');
    return;
  }

  let selected = pending;
  if (to) {
    const index = pending.findIndex((migration) => migration.name === to);
    if (index === -1) {
      throw new Error(`Target migration ${to} not found in pending list.`);
    }
    selected = pending.slice(0, index + 1);
  }

  if (step && Number.isFinite(step)) {
    selected = selected.slice(0, step);
  }

  for (const migration of selected) {
    const started = process.hrtime.bigint();
    const executedAt = new Date();
    try {
      await umzug.up({ migrations: [migration.name] });
      const finished = process.hrtime.bigint();
      const durationMs = normaliseDuration(started, finished);
      const checksum = await computeChecksum(migrationPaths.get(migration.name));

      await recordMigrationAudit({
        migrationName: migration.name,
        checksum,
        direction: 'up',
        status: 'completed',
        executedBy: resolveExecutor(),
        executedFrom: resolveHost(),
        environment: process.env.NODE_ENV ?? 'development',
        durationMs,
        executedAt,
        metadata: { command: 'up', to, step },
      });
    } catch (error) {
      const finished = process.hrtime.bigint();
      const durationMs = normaliseDuration(started, finished);
      await recordMigrationAudit({
        migrationName: migration.name,
        checksum: await computeChecksum(migrationPaths.get(migration.name)),
        direction: 'up',
        status: 'failed',
        executedBy: resolveExecutor(),
        executedFrom: resolveHost(),
        environment: process.env.NODE_ENV ?? 'development',
        durationMs,
        executedAt,
        notes: error?.message,
        metadata: { command: 'up', to, step },
      });
      throw error;
    }
  }
}

async function rollbackMigrations({ to, step }) {
  const executed = await umzug.executed();
  if (!executed.length) {
    logger.info('No executed migrations to rollback.');
    return;
  }

  let selected = executed.slice().reverse();
  if (to) {
    const index = selected.findIndex((migration) => migration.name === to);
    if (index === -1) {
      throw new Error(`Target migration ${to} not found in executed list.`);
    }
    selected = selected.slice(0, index + 1);
  }

  if (step && Number.isFinite(step)) {
    selected = selected.slice(0, step);
  }

  for (const migration of selected) {
    const started = process.hrtime.bigint();
    const executedAt = new Date();
    try {
      await umzug.down({ migrations: [migration.name] });
      const finished = process.hrtime.bigint();
      const durationMs = normaliseDuration(started, finished);
      await recordMigrationAudit({
        migrationName: migration.name,
        checksum: await computeChecksum(migrationPaths.get(migration.name)),
        direction: 'down',
        status: 'rolled_back',
        executedBy: resolveExecutor(),
        executedFrom: resolveHost(),
        environment: process.env.NODE_ENV ?? 'development',
        durationMs,
        executedAt,
        metadata: { command: 'down', to, step },
      });
    } catch (error) {
      const finished = process.hrtime.bigint();
      const durationMs = normaliseDuration(started, finished);
      await recordMigrationAudit({
        migrationName: migration.name,
        checksum: await computeChecksum(migrationPaths.get(migration.name)),
        direction: 'down',
        status: 'failed',
        executedBy: resolveExecutor(),
        executedFrom: resolveHost(),
        environment: process.env.NODE_ENV ?? 'development',
        durationMs,
        executedAt,
        notes: error?.message,
        metadata: { command: 'down', to, step },
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
        await runMigrations({ to, step });
        break;
      case 'down':
        await rollbackMigrations({ to, step });
        break;
      case 'pending': {
        const pending = await umzug.pending();
        pending.forEach((migration) => {
          console.log(migration.name);
        });
        break;
      }
      case 'executed': {
        const executed = await umzug.executed();
        executed.forEach((migration) => {
          console.log(migration.name);
        });
        break;
      }
      case 'status': {
        const pending = await umzug.pending();
        const executed = await umzug.executed();
        console.log('Executed migrations:');
        executed.forEach((migration) => console.log(`  ✓ ${migration.name}`));
        console.log('Pending migrations:');
        pending.forEach((migration) => console.log(`  • ${migration.name}`));
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
  logger.error({ err: error }, 'Migration runner failed');
  process.exitCode = 1;
});
