import express from 'express';
import pinoHttp from 'pino-http';
import routes from './routes/index.js';
import correlationId from './middleware/correlationId.js';
import errorHandler from './middleware/errorHandler.js';
import healthRouter from './routes/health.js';
import logger from './utils/logger.js';
import createInstrumentedRateLimiter from './middleware/rateLimiter.js';
import { applyHttpSecurity } from './config/httpSecurity.js';

const app = express();

app.disable('x-powered-by');
applyHttpSecurity(app, { logger });

app.use(correlationId());

app.use(
  pinoHttp({
    logger: logger.child({ component: 'http' }),
    autoLogging: process.env.NODE_ENV !== 'test',
    genReqId: (req) => req.id,
    customProps: (req) => ({
      requestId: req.id,
      userId: req.user?.id ?? null,
    }),
    customLogLevel: (res, err) => {
      if (err || res.statusCode >= 500) {
        return 'error';
      }
      if (res.statusCode >= 400) {
        return 'warn';
      }
      return 'info';
    },
    quietReqLogger: process.env.NODE_ENV === 'test',
  }),
);

const bodyLimit = process.env.REQUEST_BODY_LIMIT || '1mb';
app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: bodyLimit }));

const windowMsCandidate = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
const maxRequestsCandidate = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 300);
const resolvedWindowMs = Number.isFinite(windowMsCandidate) && windowMsCandidate > 0 ? windowMsCandidate : 60_000;
const resolvedMaxRequests =
  Number.isFinite(maxRequestsCandidate) && maxRequestsCandidate > 0 ? maxRequestsCandidate : 300;

const shouldSkipRateLimit = (req) => {
  if (req.method && req.method.toUpperCase() === 'OPTIONS') {
    return true;
  }
  const path = req.path || req.originalUrl || '';
  if (path.startsWith('/health')) {
    return true;
  }
  if (path.startsWith('/api/admin/runtime/health')) {
    return true;
  }
  return false;
};

app.use(
  createInstrumentedRateLimiter({
    windowMs: resolvedWindowMs,
    max: resolvedMaxRequests,
    skip: shouldSkipRateLimit,
  }),
);

app.use('/health', healthRouter);

app.use('/api', routes);

app.use(errorHandler);

export default app;
