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
  resolveHttpRateLimitSettings,
  whenRuntimeConfigReady,
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

const computeHttpLoggerSignature = (config) =>
  String(config?.logging?.enableHttpLogging ?? process.env.NODE_ENV !== 'test');

const buildHttpLogger = (config) =>
  pinoHttp({
    logger: logger.child({ component: 'http' }),
    autoLogging: config?.logging?.enableHttpLogging ?? process.env.NODE_ENV !== 'test',
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

const computeBodyParserSignature = (config) => config?.http?.requestBodyLimit ?? '1mb';

const buildJsonParser = (config) =>
  express.json({
    limit: computeBodyParserSignature(config),
    verify: (req, res, buf) => {
      const path = req.originalUrl || req.url || '';
      if (path.startsWith('/api/support/chatwoot/webhook')) {
        req.rawBody = buf.toString();
      }
    },
  });
const buildUrlencodedParser = (config) =>
  express.urlencoded({ extended: true, limit: computeBodyParserSignature(config) });

const resolveRequestPath = (req) => {
  const base = req.baseUrl || '';
  const path = req.path || req.originalUrl || '';
  const combined = `${base}${path}`;
  return combined.split('?')[0] || '';
};

const normalizeSkipPrefix = (prefix) => {
  if (typeof prefix !== 'string') {
    return null;
  }
  const trimmed = prefix.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};

const createShouldSkipRateLimit = (skipPaths) => {
  const prefixes = Array.from(
    new Set(
      (skipPaths || [])
        .map((prefix) => normalizeSkipPrefix(prefix))
        .filter((prefix) => typeof prefix === 'string'),
    ),
  );
  return (req) => {
    const method = (req.method || 'GET').toUpperCase();
    if (method === 'OPTIONS') {
      return true;
    }
    const path = resolveRequestPath(req);
    return prefixes.some((prefix) => path.startsWith(prefix));
  };
};

const buildRateLimiterBundle = (config) => {
  const { windowMs, maxRequests, skipPaths } = resolveHttpRateLimitSettings(config);
  const signature = [windowMs, maxRequests, ...[...skipPaths].sort()].join(':');
  return {
    signature,
    middleware: createInstrumentedRateLimiter({
      windowMs,
      max: maxRequests,
      skip: createShouldSkipRateLimit(skipPaths),
    }),
  };
};

let httpLoggerSignature = computeHttpLoggerSignature(runtimeConfig);
let httpLogger = buildHttpLogger(runtimeConfig);
let bodyParserSignature = computeBodyParserSignature(runtimeConfig);
let jsonParser = buildJsonParser(runtimeConfig);
let urlencodedParser = buildUrlencodedParser(runtimeConfig);
const initialRateLimiterBundle = buildRateLimiterBundle(runtimeConfig);
let rateLimiter = initialRateLimiterBundle.middleware;
let rateLimiterSignature = initialRateLimiterBundle.signature;

const applyRuntimeConfig = (config) => {
  runtimeConfig = config;

  const nextHttpLoggerSignature = computeHttpLoggerSignature(config);
  if (nextHttpLoggerSignature !== httpLoggerSignature) {
    httpLoggerSignature = nextHttpLoggerSignature;
    httpLogger = buildHttpLogger(config);
  }

  const nextBodyParserSignature = computeBodyParserSignature(config);
  if (nextBodyParserSignature !== bodyParserSignature) {
    bodyParserSignature = nextBodyParserSignature;
    jsonParser = buildJsonParser(config);
    urlencodedParser = buildUrlencodedParser(config);
  }

  const nextRateLimiterBundle = buildRateLimiterBundle(config);
  if (nextRateLimiterBundle.signature !== rateLimiterSignature) {
    rateLimiterSignature = nextRateLimiterBundle.signature;
    rateLimiter = nextRateLimiterBundle.middleware;
  }
};

whenRuntimeConfigReady()
  .then(applyRuntimeConfig)
  .catch((error) => {
    logger.warn({ err: error }, 'Runtime configuration failed to warm before HTTP bootstrap');
  });

onRuntimeConfigChange(({ config }) => {
  applyRuntimeConfig(config);
});

app.use((req, res, next) => httpLogger(req, res, next));
app.use((req, res, next) => jsonParser(req, res, next));
app.use((req, res, next) => urlencodedParser(req, res, next));

app.use(
  (req, res, next) => rateLimiter(req, res, next),
);

app.use('/health', healthRouter);

app.use('/api', routes);

app.use(errorHandler);

export default app;
