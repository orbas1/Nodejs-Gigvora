#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import process from 'process';
import { fileURLToPath } from 'url';
import sequelize from '../src/models/sequelizeClient.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_ROOT = path.resolve(__dirname, '../schema/snapshots');

function normaliseTableName(entry) {
  if (!entry) return null;
  if (typeof entry === 'string') {
    return entry;
  }
  if (typeof entry === 'object') {
    return entry.tableName || entry.table_name || entry.name || null;
  }
  return null;
}

async function ensureDirectory(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function collectSchema() {
  const queryInterface = sequelize.getQueryInterface();
  const tables = await queryInterface.showAllTables();
  const normalized = tables
    .map((entry) => normaliseTableName(entry))
    .filter((name) => typeof name === 'string' && !name.startsWith('sqlite_'))
    .sort();

  const snapshot = {};
  for (const tableName of normalized) {
    try {
      const columns = await queryInterface.describeTable(tableName);
      const indexes = await queryInterface.showIndex(tableName);
      snapshot[tableName] = {
        columns,
        indexes: indexes.map((index) => ({
          name: index.name,
          unique: index.unique,
          fields: index.fields?.map((field) => field.attribute || field.name) ?? [],
        })),
      };
    } catch (error) {
      console.warn(`Failed to introspect table ${tableName}:`, error.message);
    }
  }

  return snapshot;
}

async function readAppliedMigrations() {
  const queryInterface = sequelize.getQueryInterface();
  const metaTable = queryInterface.quoteTable('SequelizeMeta');
  try {
    const [rows] = await sequelize.query(`SELECT name FROM ${metaTable} ORDER BY name ASC`);
    if (!Array.isArray(rows)) {
      return [];
    }
    return rows.map((row) => row.name);
  } catch (error) {
    console.warn('Could not read applied migrations:', error.message);
    return [];
  }
}

async function main() {
  const started = Date.now();
  await ensureDirectory(OUTPUT_ROOT);

  try {
    await sequelize.authenticate({ logging: false });
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
    process.exitCode = 1;
    await sequelize.close();
    return;
  }

  try {
    const [schema, appliedMigrations] = await Promise.all([
      collectSchema(),
      readAppliedMigrations(),
    ]);

    const payload = {
      generatedAt: new Date().toISOString(),
      dialect: sequelize.getDialect(),
      appliedMigrations,
      tables: schema,
    };

    const json = JSON.stringify(payload, null, 2);
    const checksum = crypto.createHash('sha256').update(json).digest('hex');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    const jsonPath = path.join(OUTPUT_ROOT, `schema-${timestamp}.json`);
    const latestPath = path.join(OUTPUT_ROOT, 'schema-latest.json');
    const checksumPath = path.join(OUTPUT_ROOT, 'schema-latest.sha256');

    await fs.writeFile(jsonPath, json, 'utf8');
    await fs.writeFile(latestPath, json, 'utf8');
    await fs.writeFile(checksumPath, `${checksum}\n`, 'utf8');

    console.info(
      JSON.stringify(
        {
          status: 'ok',
          tables: Object.keys(schema).length,
          checksum,
          output: { jsonPath, latestPath, checksumPath },
          durationMs: Date.now() - started,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    console.error('Failed to generate schema snapshot:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

await main();
