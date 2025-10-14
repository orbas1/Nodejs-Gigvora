import logger from '../utils/logger.js';

export default function errorHandler(err, req, res, next) {
  const status = err.status ?? err.statusCode ?? 500;
  const message = err.message || 'Internal server error';
  const details = err.details ?? null;
  const requestId = req?.id ?? null;
  const log = req?.log ?? logger;

  const errorPayload = {
    err,
    requestId,
    path: req?.originalUrl,
    method: req?.method,
    status,
  };

  if (res.headersSent) {
    log.error(errorPayload, 'Response headers already sent when handling error');
    return next(err);
  }

  log.error(errorPayload, 'Unhandled application error');

  res.status(status).json({
    message,
    details,
    requestId,
  });
}
