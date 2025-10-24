import http from 'node:http';
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
import {
  getRuntimeConfig,
  whenRuntimeConfigReady,
  onRuntimeConfigChange,
} from './config/runtimeConfig.js';
import { attachSocketServer, shutdownSocketServer } from './realtime/socketServer.js';
import ensureEnvLoaded from './config/envLoader.js';

ensureEnvLoaded({ silent: process.env.NODE_ENV === 'test' });

const DEFAULT_PORT = 4000;
let httpServer = null;
let runtimeConfig = getRuntimeConfig();

onRuntimeConfigChange(({ config }) => {
  runtimeConfig = config;
});

export async function start({ port = DEFAULT_PORT } = {}) {
  if (httpServer) {
    logger.warn({ port: httpServer.address()?.port }, 'Gigvora API server already started');
    return httpServer;
  }

  await whenRuntimeConfigReady();

  markHttpServerStarting();
  await warmDatabaseConnections({ logger });
  try {
    const settings = await getPlatformSettings();
    syncCriticalDependencies(settings, { logger: logger.child({ component: 'server' }) });
  } catch (error) {
    logger.warn({ err: error }, 'Failed to synchronise critical dependencies before startup');
  }
  await warmRuntimeDependencyHealth({ logger, forceRefresh: true });
  try {
    getMetricsStatus();
  } catch (error) {
    logger.warn({ err: error }, 'Failed to prime metrics exporter status during startup');
  }

  try {
    await bootstrapDatabase({ logger });
    const workerResults = await startBackgroundWorkers({ logger });
    logger.info(
      {
        workers: workerResults.map((worker) => ({ name: worker.name, started: worker.started !== false })),
      },
      'Background worker orchestration completed',
    );

    httpServer = http.createServer(app);

    await attachSocketServer(httpServer, {
      logger: logger.child({ component: 'socket-server' }),
    });

    const desiredPort = port ?? runtimeConfig?.http?.port ?? DEFAULT_PORT;
    const normalizedPort = Number.parseInt(desiredPort, 10);
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
      await shutdownSocketServer();
    } catch (socketError) {
      logger.warn({ err: socketError }, 'Socket server shutdown after startup failure encountered errors');
    }
    try {
      await shutdownDatabase({ reason: 'startup-failed', logger });
    } catch (shutdownError) {
      logger.warn({ err: shutdownError }, 'Database shutdown after startup failure encountered errors');
    }
    try {
      await stopBackgroundWorkers({ logger });
    } catch (workerError) {
      logger.warn({ err: workerError }, 'Background worker shutdown after startup failure encountered errors');
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

  try {
    await shutdownSocketServer();
  } catch (error) {
    logger.warn({ err: error }, 'Socket server shutdown reported errors');
  }

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
