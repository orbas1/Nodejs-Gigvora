export async function orchestrateHttpShutdown({
  httpServer,
  reason = 'shutdown',
  logger,
  stopBackgroundWorkers,
  shutdownDatabase,
  drainDatabaseConnections,
  recordRuntimeSecurityEvent,
  markHttpServerStopped,
  onHttpServerClosed = () => {},
  timeoutMs = 30000,
}) {
  if (!httpServer) {
    markHttpServerStopped?.({ reason });
    return;
  }

  let workerShutdownError = null;
  let databaseShutdownError = null;

  try {
    if (typeof stopBackgroundWorkers === 'function') {
      await stopBackgroundWorkers({ logger });
    }
  } catch (error) {
    workerShutdownError = error;
    logger?.error?.({ err: error }, 'Failed to shut down one or more background workers');
  }

  const closePromise = new Promise((resolve, reject) => {
    httpServer.close((error) => {
      if (error) {
        logger?.error?.({ err: error }, 'Error while shutting down HTTP server');
        reject(error);
        return;
      }
      markHttpServerStopped?.({ reason });
      logger?.info?.({ reason }, 'Gigvora API stopped');
      onHttpServerClosed();
      resolve();
    });
  });

  if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
    await Promise.race([
      closePromise,
      new Promise((_, reject) =>
        setTimeout(() => {
          const timeoutError = new Error('HTTP server shutdown timed out');
          logger?.error?.({ err: timeoutError, timeoutMs }, 'HTTP server close timed out');
          reject(timeoutError);
        }, timeoutMs),
      ),
    ]);
  } else {
    await closePromise;
  }

  try {
    if (typeof shutdownDatabase === 'function') {
      await shutdownDatabase({ reason, logger });
    }
  } catch (error) {
    logger?.error?.({ err: error }, 'Database shutdown encountered errors');
    if (!workerShutdownError) {
      workerShutdownError = error;
    }
  }

  if (typeof recordRuntimeSecurityEvent === 'function') {
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
      logger?.warn?.({ err: error }, 'Failed to record runtime shutdown audit');
    });
  }

  try {
    if (typeof drainDatabaseConnections === 'function') {
      await drainDatabaseConnections({ logger, reason });
    }
  } catch (error) {
    databaseShutdownError = error;
    logger?.error?.(
      { err: error, reason },
      'Failed to drain database connections during shutdown sequence',
    );
  }

  if (workerShutdownError) {
    throw workerShutdownError;
  }
  if (databaseShutdownError) {
    throw databaseShutdownError;
  }
}

export default orchestrateHttpShutdown;
