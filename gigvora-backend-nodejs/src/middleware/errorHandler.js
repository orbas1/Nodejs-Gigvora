import logger from '../utils/logger.js';

export default function errorHandler(err, req, res, next) {
  const status = err.status ?? err.statusCode ?? 500;
  const message = err.message || 'Internal server error';
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

  const responseBody = {
    message,
    requestId,
  };

  if (err.expose === true && err.details) {
    responseBody.details = err.details;
  }

  res.status(status).json(responseBody);
}
