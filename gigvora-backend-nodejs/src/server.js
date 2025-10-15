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
import { getPlatformSettings } from './services/platformSettingsService.js';
import { syncCriticalDependencies } from './observability/dependencyHealth.js';
import { recordRuntimeSecurityEvent } from './services/securityAuditService.js';

dotenv.config();

const DEFAULT_PORT = Number.parseInt(process.env.PORT ?? '5000', 10);
let httpServer = null;

export async function start({ port = DEFAULT_PORT } = {}) {
  if (httpServer) {
    logger.warn({ port: httpServer.address()?.port }, 'Gigvora API server already started');
    return httpServer;
  }

  markHttpServerStarting();
  try {
    const settings = await getPlatformSettings();
    syncCriticalDependencies(settings, { logger: logger.child({ component: 'server' }) });
  } catch (error) {
    logger.warn({ err: error }, 'Failed to synchronise critical dependencies before startup');
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

  let workerShutdownError = null;
  try {
    await stopBackgroundWorkers({ logger });
  } catch (error) {
    workerShutdownError = error;
    logger.error({ err: error }, 'Failed to shut down one or more background workers');
  }

  await new Promise((resolve, reject) => {
    httpServer.close((error) => {
      if (error) {
        logger.error({ err: error }, 'Error while shutting down HTTP server');
        reject(error);
        return;
      }
      markHttpServerStopped({ reason });
      logger.info({ reason }, 'Gigvora API stopped');
      httpServer = null;
      resolve();
    });
  });

  try {
    await shutdownDatabase({ reason, logger });
  } catch (error) {
    logger.error({ err: error }, 'Database shutdown encountered errors');
    if (!workerShutdownError) {
      workerShutdownError = error;
    }
  }

  recordRuntimeSecurityEvent(
    {
      eventType: 'runtime.http.stopped',
      level: workerShutdownError ? 'warn' : 'info',
      message: 'HTTP server shutdown sequence completed.',
      metadata: {
        reason,
        workerShutdownError: workerShutdownError ? workerShutdownError.message : null,
      },
    },
    { logger },
  ).catch((error) => {
    logger.warn({ err: error }, 'Failed to record runtime shutdown audit');
  });

  if (workerShutdownError) {
    throw workerShutdownError;
  }
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
