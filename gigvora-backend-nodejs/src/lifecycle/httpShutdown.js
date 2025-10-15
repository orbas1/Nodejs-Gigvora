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
}) {
  if (!httpServer) {
    markHttpServerStopped?.({ reason });
    return;
  }

  let workerShutdownError = null;
  let databaseShutdownError = null;

  try {
    await stopBackgroundWorkers({ logger });
  } catch (error) {
    workerShutdownError = error;
    logger?.error?.({ err: error }, 'Failed to shut down one or more background workers');
  }

  await new Promise((resolve, reject) => {
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

  try {
    await shutdownDatabase({ reason, logger });
  } catch (error) {
    logger?.error?.({ err: error }, 'Database shutdown encountered errors');
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
    logger?.warn?.({ err: error }, 'Failed to record runtime shutdown audit');
  });

  try {
    await drainDatabaseConnections({ logger, reason });
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
