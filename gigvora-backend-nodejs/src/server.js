import http from 'node:http';
import dotenv from 'dotenv';
import app from './app.js';
import logger from './utils/logger.js';
import { startBackgroundWorkers, stopBackgroundWorkers } from './lifecycle/workerManager.js';
import { bootstrapDatabase, shutdownDatabase } from './lifecycle/databaseLifecycle.js';
import {
  markHttpServerStarting,
  markHttpServerReady,
  markHttpServerClosing,
  markHttpServerStopped,
} from './lifecycle/runtimeHealth.js';
import { warmRuntimeDependencyHealth } from './services/runtimeDependencyGuard.js';
import {
  warmDatabaseConnections,
  drainDatabaseConnections,
} from './services/databaseLifecycleService.js';
import { getPlatformSettings } from './services/platformSettingsService.js';
import { syncCriticalDependencies } from './observability/dependencyHealth.js';
import { recordRuntimeSecurityEvent } from './services/securityAuditService.js';
import orchestrateHttpShutdown from './lifecycle/httpShutdown.js';
import { getMetricsStatus } from './observability/metricsRegistry.js';

dotenv.config();

const DEFAULT_PORT = Number.parseInt(process.env.PORT ?? '5000', 10);
let httpServer = null;

export async function start({ port = DEFAULT_PORT } = {}) {
  if (httpServer) {
    logger.warn({ port: httpServer.address()?.port }, 'Gigvora API server already started');
    return httpServer;
  }

  markHttpServerStarting();
  await warmDatabaseConnections({ logger });
  try {
    const settings = await getPlatformSettings();
    syncCriticalDependencies(settings, { logger: logger.child({ component: 'server' }) });
  } catch (error) {
    logger.warn({ err: error }, 'Failed to synchronise critical dependencies before startup');
  }
  await startBackgroundWorkers({ logger });
  await warmRuntimeDependencyHealth({ logger, forceRefresh: true });
  try {
    getMetricsStatus();
  } catch (error) {
    logger.warn({ err: error }, 'Failed to prime metrics exporter status during startup');
  }

  try {
    await bootstrapDatabase({ logger });
    await startBackgroundWorkers({ logger });

    httpServer = http.createServer(app);

    const normalizedPort = Number.parseInt(port, 10);
    const listenPort = Number.isNaN(normalizedPort) ? DEFAULT_PORT : normalizedPort;

    await new Promise((resolve, reject) => {
      const onError = (error) => {
        httpServer = null;
        logger.error({ err: error }, 'HTTP server failed to start');
        reject(error);
      };
      httpServer.once('error', onError);
      httpServer.listen(listenPort, () => {
        httpServer.off('error', onError);
        markHttpServerReady({ port: listenPort });
        logger.info({ port: listenPort }, 'Gigvora API running');
        recordRuntimeSecurityEvent(
          {
            eventType: 'runtime.http.started',
            level: 'notice',
            message: 'HTTP server accepted connections after readiness probes passed.',
            metadata: { port: listenPort },
          },
          { logger },
        ).catch((error) => {
          logger.warn({ err: error }, 'Failed to record runtime startup security audit');
        });
        resolve();
      });
    });

    httpServer.on('close', () => {
      markHttpServerStopped({ reason: 'closed' });
    });

    return httpServer;
  } catch (error) {
    try {
      await shutdownDatabase({ reason: 'startup-failed', logger });
    } catch (shutdownError) {
      logger.warn({ err: shutdownError }, 'Database shutdown after startup failure encountered errors');
    }
    markHttpServerStopped({ reason: 'failed' });
    throw error;
  }
}

export async function stop({ reason = 'shutdown' } = {}) {
  if (!httpServer) {
    markHttpServerStopped({ reason });
    return;
  }

  markHttpServerClosing({ reason });

  await orchestrateHttpShutdown({
    httpServer,
    reason,
    logger,
    stopBackgroundWorkers,
    shutdownDatabase,
    drainDatabaseConnections,
    recordRuntimeSecurityEvent,
    markHttpServerStopped,
    onHttpServerClosed: () => {
      httpServer = null;
    },
  });
}

function registerSignalHandlers() {
  const handleSignal = (signal) => {
    logger.warn({ signal }, 'Received shutdown signal');
    stop({ reason: signal })
      .then(() => process.exit(0))
      .catch((error) => {
        logger.error({ err: error }, 'Graceful shutdown failed');
        process.exit(1);
      });
  };

  process.once('SIGTERM', handleSignal);
  process.once('SIGINT', handleSignal);
}

if (process.env.NODE_ENV !== 'test') {
  registerSignalHandlers();
  start().catch((error) => {
    logger.fatal({ err: error }, 'Unable to start Gigvora API');
    process.exit(1);
  });
}

export default app;
