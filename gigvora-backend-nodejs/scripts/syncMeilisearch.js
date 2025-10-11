import dotenv from 'dotenv';
import { sequelize } from '../src/models/index.js';
import {
  syncOpportunityIndexes,
  ensureOpportunityIndexes,
} from '../src/services/searchIndexService.js';

dotenv.config();

async function run() {
  const start = Date.now();
  const logger = console;

  try {
    await sequelize.authenticate();
    logger.info('Database connection established; starting Meilisearch sync.');

    const ensured = await ensureOpportunityIndexes({ logger });
    if (!ensured.configured) {
      logger.warn('Meilisearch is not configured. Define MEILISEARCH_HOST and MEILISEARCH_API_KEY.');
      return;
    }

    const result = await syncOpportunityIndexes({
      logger,
      batchSize: Number.parseInt(process.env.MEILISEARCH_SYNC_BATCH_SIZE ?? '500', 10),
      clearExisting: process.env.MEILISEARCH_SYNC_CLEAR === 'true',
    });

    const elapsedMs = Date.now() - start;
    logger.info('Meilisearch sync completed.', {
      elapsedMs,
      indexes: result.indexes,
    });
  } catch (error) {
    console.error('Failed to execute Meilisearch sync job', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

run();
