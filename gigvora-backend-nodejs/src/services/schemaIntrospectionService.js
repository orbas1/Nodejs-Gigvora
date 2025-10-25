import models from '../models/index.js';
import logger from '../utils/logger.js';

const AUDIT_COLUMNS = new Set(['id', 'createdAt', 'updatedAt', 'deletedAt', 'metadata']);

function normaliseTableName(entry) {
  if (!entry) {
    return null;
  }
  if (typeof entry === 'string') {
    return entry;
  }
  if (entry?.tableName) {
    return entry.tableName;
  }
  if (entry?.name) {
    return entry.name;
  }
  return null;
}

function extractForeignKeyColumns(columns = {}) {
  return Object.keys(columns).filter((column) => /(_id|Id)$/.test(column));
}

function isLikelyJoinTable(metadata) {
  if (!metadata) {
    return false;
  }
  const columnNames = Object.keys(metadata.columns ?? {});
  if (columnNames.length === 0) {
    return false;
  }
  const foreignKeys = extractForeignKeyColumns(metadata.columns);
  const meaningfulColumns = columnNames.filter((column) => !AUDIT_COLUMNS.has(column));
  return foreignKeys.length >= 2 && meaningfulColumns.length <= 4;
}

function buildJoinSignature(metadata) {
  const foreignKeys = extractForeignKeyColumns(metadata.columns);
  if (!foreignKeys.length) {
    return null;
  }
  return foreignKeys
    .map((column) => column.replace(/Id$/, '').replace(/_id$/, ''))
    .sort()
    .join('|');
}

async function fetchTableMetadata(queryInterface, tableName) {
  const columns = await queryInterface.describeTable(tableName);
  let indexes = [];
  try {
    indexes = await queryInterface.showIndex(tableName);
  } catch (error) {
    logger.debug({ err: error, tableName }, 'Unable to load index metadata for table');
    indexes = [];
  }
  return {
    name: tableName,
    columns,
    indexes,
  };
}

export async function inspectSchemaRedundancies({ logger: scopedLogger = logger } = {}) {
  const sequelize = models?.sequelize;
  if (!sequelize) {
    throw new Error('Sequelize instance is not initialised');
  }

  const queryInterface = sequelize.getQueryInterface();
  const rawTables = await queryInterface.showAllTables();
  const tableNames = rawTables
    .map((entry) => normaliseTableName(entry))
    .filter((entry) => typeof entry === 'string');

  const tableMetadata = [];
  for (const tableName of tableNames) {
    try {
      const metadata = await fetchTableMetadata(queryInterface, tableName);
      tableMetadata.push(metadata);
    } catch (error) {
      scopedLogger.warn({ err: error, tableName }, 'Failed to introspect table metadata');
    }
  }

  const joinTables = tableMetadata.filter((metadata) => isLikelyJoinTable(metadata));
  const duplicatesMap = new Map();

  joinTables.forEach((metadata) => {
    const signature = buildJoinSignature(metadata);
    if (!signature) {
      return;
    }
    if (!duplicatesMap.has(signature)) {
      duplicatesMap.set(signature, []);
    }
    duplicatesMap.get(signature).push(metadata);
  });

  const duplicateJoinTables = Array.from(duplicatesMap.entries())
    .filter(([, tables]) => tables.length > 1)
    .map(([signature, tables]) => ({
      signature,
      tables: tables.map((table) => table.name),
      columns: extractForeignKeyColumns(tables[0].columns ?? {}),
    }));

  return {
    tables: tableMetadata,
    joinTables,
    duplicateJoinTables,
  };
}

export default {
  inspectSchemaRedundancies,
};
