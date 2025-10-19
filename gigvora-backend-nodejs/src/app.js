import express from 'express';
import pinoHttp from 'pino-http';
import routes from './routes/index.js';
import correlationId from './middleware/correlationId.js';
import errorHandler from './middleware/errorHandler.js';
import healthRouter from './routes/health.js';
import logger from './utils/logger.js';
import createInstrumentedRateLimiter from './middleware/rateLimiter.js';
import { applyHttpSecurity } from './config/httpSecurity.js';
import createWebApplicationFirewall from './middleware/webApplicationFirewall.js';
import {
  getRuntimeConfig,
  onRuntimeConfigChange,
} from './config/runtimeConfig.js';

const app = express();

app.disable('x-powered-by');
applyHttpSecurity(app, { logger });

app.use(correlationId());

app.use(
  createWebApplicationFirewall({
    logger: logger.child({ component: 'app' }),
  }),
);

let runtimeConfig = getRuntimeConfig();

const buildHttpLogger = () =>
  pinoHttp({
    logger: logger.child({ component: 'http' }),
    autoLogging: runtimeConfig?.logging?.enableHttpLogging ?? process.env.NODE_ENV !== 'test',
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
  });

const buildJsonParser = () => express.json({ limit: runtimeConfig?.http?.requestBodyLimit || '1mb' });
const buildUrlencodedParser = () =>
  express.urlencoded({ extended: true, limit: runtimeConfig?.http?.requestBodyLimit || '1mb' });

let httpLogger = buildHttpLogger();
let jsonParser = buildJsonParser();
let urlencodedParser = buildUrlencodedParser();

onRuntimeConfigChange(({ config }) => {
  runtimeConfig = config;
  httpLogger = buildHttpLogger();
  jsonParser = buildJsonParser();
  urlencodedParser = buildUrlencodedParser();
});

app.use((req, res, next) => httpLogger(req, res, next));
app.use((req, res, next) => jsonParser(req, res, next));
app.use((req, res, next) => urlencodedParser(req, res, next));

const shouldSkipRateLimit = (req) => {
  if (req.method && req.method.toUpperCase() === 'OPTIONS') {
    return true;
  }
  const path = req.path || req.originalUrl || '';
  const skipPrefixes = runtimeConfig?.http?.rateLimit?.skipPaths ?? ['/health'];
  return skipPrefixes.some((prefix) => path.startsWith(prefix));
};

const resolveRateLimitWindow = () => runtimeConfig?.http?.rateLimit?.windowMs ?? 60_000;
const resolveRateLimitMax = () => runtimeConfig?.http?.rateLimit?.maxRequests ?? 300;

app.use(
  createInstrumentedRateLimiter({
    windowMs: resolveRateLimitWindow(),
    max: resolveRateLimitMax(),
    skip: shouldSkipRateLimit,
  }),
);

app.use('/health', healthRouter);

app.use('/api', routes);

app.use(errorHandler);

export default app;
