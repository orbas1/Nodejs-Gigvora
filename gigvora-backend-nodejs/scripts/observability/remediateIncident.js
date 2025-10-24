#!/usr/bin/env node
import process from 'node:process';

import dotenv from 'dotenv';

import { warmDatabaseConnections, drainDatabaseConnections } from '../../src/services/databaseLifecycleService.js';
import { resetWebApplicationFirewallMetrics, configureWebApplicationFirewall } from '../../src/security/webApplicationFirewall.js';
import { collectMetrics, getMetricsStatus } from '../../src/observability/metricsRegistry.js';
import { initializeTracing, shutdownTracing } from '../../src/observability/tracing.js';
import { getRuntimeOperationalSnapshot } from '../../src/services/runtimeObservabilityService.js';
import { getProfileEngagementQueueSnapshot } from '../../src/services/profileEngagementService.js';
import logger from '../../src/utils/logger.js';

dotenv.config();

async function main() {
  const startTime = Date.now();
  logger.info({ component: 'observability-remediator' }, 'Starting observability remediation workflow');

  try {
    initializeTracing({
      serviceName: 'gigvora-observability-remediator',
      serviceVersion: process.env.APP_VERSION ?? 'unknown',
      logger,
    });
  } catch (error) {
    logger.warn({ err: error }, 'Tracing initialisation failed for remediation workflow');
  }

  await warmDatabaseConnections({ logger });

  configureWebApplicationFirewall();
  resetWebApplicationFirewallMetrics();
  logger.info({ component: 'observability-remediator' }, 'Reset WAF metrics and refreshed configuration');

  await collectMetrics();
  const metricsStatus = getMetricsStatus();
  logger.info({ component: 'observability-remediator', metrics: metricsStatus }, 'Prometheus exporter refreshed');

  const queueSnapshot = await getProfileEngagementQueueSnapshot({ staleAfterSeconds: 600 });
  logger.info({ component: 'observability-remediator', queueSnapshot }, 'Profile engagement queue snapshot captured');

  const operationalSnapshot = await getRuntimeOperationalSnapshot();
  logger.info({ component: 'observability-remediator', operationalSnapshot }, 'Operational snapshot generated');

  await drainDatabaseConnections({ logger });
  await shutdownTracing({ logger });

  logger.info(
    {
      component: 'observability-remediator',
      durationMs: Date.now() - startTime,
    },
    'Observability remediation workflow complete',
  );
}

main().catch((error) => {
  logger.error({ err: error }, 'Observability remediation workflow failed');
  shutdownTracing({ logger }).finally(() => process.exit(1));
});
