#!/usr/bin/env node

import process from 'node:process';

import { inspectSchemaRedundancies } from '../src/services/schemaIntrospectionService.js';
import logger from '../src/utils/logger.js';
import models from '../src/models/index.js';

async function main() {
  try {
    const result = await inspectSchemaRedundancies({ logger });

    if (!result.duplicateJoinTables.length) {
      console.log('No redundant join tables detected.');
    } else {
      console.log('Potential redundant join tables detected:');
      result.duplicateJoinTables.forEach((entry) => {
        console.log(` • ${entry.tables.join(', ')} (foreign keys: ${entry.columns.join(', ')})`);
      });
    }
  } catch (error) {
    logger.error({ err: error }, 'Schema redundancy audit failed');
    console.error('Schema redundancy audit failed:', error.message);
    process.exitCode = 1;
  } finally {
    try {
      await models?.sequelize?.close?.();
    } catch (error) {
      logger.warn({ err: error }, 'Failed to close sequelize connection after audit');
    }
  }
}

main();
