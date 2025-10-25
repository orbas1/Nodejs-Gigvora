import { sequelize } from '../src/models/index.js';
import {
  syncOpportunityIndexes,
  ensureOpportunityIndexes,
} from '../src/services/searchIndexService.js';
import ensureEnvLoaded from '../src/config/envLoader.js';

ensureEnvLoaded({ silent: process.env.NODE_ENV === 'test' });

async function run() {
  const start = Date.now();
  const logger = console;

  try {
    await sequelize.authenticate();
    logger.info('Database connection established; warming internal search indexes.');

    const ensured = await ensureOpportunityIndexes({ logger });
    if (!ensured.configured) {
      logger.warn('Internal search engine reported it is not ready; skipping refresh.');
      return;
    }

    const result = await syncOpportunityIndexes({ logger });

    const elapsedMs = Date.now() - start;
    logger.info('Internal search refresh completed.', {
      elapsedMs,
      indexes: result.indexes,
    });
  } catch (error) {
    console.error('Failed to refresh internal search indexes', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

run();
