import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import { recordBlockedOrigin } from '../observability/perimeterMetrics.js';
import { recordRuntimeSecurityEvent } from '../services/securityAuditService.js';
import logger from '../utils/logger.js';

const DEFAULT_ALLOWED_ORIGINS = [
  'https://app.gigvora.com',
  'https://admin.gigvora.com',
  'https://console.gigvora.com',
  'https://gigvora.com',
  'https://www.gigvora.com',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4173',
];

const AUDIT_THROTTLE_MS = 15 * 60 * 1000;

function resolveLogger(candidate) {
  if (!candidate) {
    return logger.child({ component: 'http-security' });
  }
  if (typeof candidate.child === 'function') {
    return candidate.child({ component: 'http-security' });
  }
  return candidate;
}

function splitList(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0);
  }
  return String(value)
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function normaliseOrigin(origin) {
  if (!origin) {
    return null;
  }
  try {
    const url = new URL(origin);
    return `${url.protocol}//${url.host}`;
  } catch (error) {
    return null;
  }
}

function buildRule(origin) {
  if (!origin) {
    return null;
  }

  const wildcardMatch = origin.match(/^(https?):\/\/\*\.([^/]+)$/i);
  if (wildcardMatch) {
    const [, protocol, suffix] = wildcardMatch;
    return {
      type: 'wildcard',
      protocol: `${protocol.toLowerCase()}:`,
      suffix: suffix.toLowerCase(),
      value: origin,
    };
  }

  const normalised = normaliseOrigin(origin);
  if (!normalised) {
    return null;
  }
  const url = new URL(normalised);
  return {
    type: 'exact',
    protocol: url.protocol,
    host: url.host.toLowerCase(),
    value: normalised,
  };
}

export function resolveAllowedOrigins(env = process.env) {
  const sources = [
    env.CLIENT_URL,
    env.CLIENT_URLS,
    env.ALLOWED_ORIGINS,
    env.ADMIN_CLIENT_URL,
    env.ADMIN_CLIENT_URLS,
    env.TRUSTED_WEB_ORIGINS,
  ];

  const resolved = new Set(DEFAULT_ALLOWED_ORIGINS);
  sources.forEach((source) => {
    splitList(source).forEach((origin) => {
      const normalised = normaliseOrigin(origin) ?? origin.trim();
      if (normalised) {
        resolved.add(normalised);
      }
    });
  });

  return Array.from(resolved);
}

export function compileAllowedOriginRules(origins = []) {
  return origins
    .map((origin) => origin?.trim())
    .filter((origin) => origin && origin.length > 0)
    .map((origin) => buildRule(origin))
    .filter(Boolean);
}

export function isOriginAllowed(origin, rules = []) {
  if (!origin) {
    return true;
  }
  let parsed;
  try {
    parsed = new URL(origin);
  } catch (error) {
    return false;
  }

  const protocol = parsed.protocol;
  const host = parsed.host.toLowerCase();

  return rules.some((rule) => {
    if (rule.type === 'exact') {
      return rule.protocol === protocol && rule.host === host;
    }
    if (rule.type === 'wildcard') {
      if (rule.protocol !== protocol) {
        return false;
      }
      if (host === rule.suffix) {
        return true;
      }
      return host.endsWith(`.${rule.suffix}`);
    }
    return false;
  });
}

function resolveTrustProxy(env = process.env) {
  const candidate = env.TRUST_PROXY ?? env.TRUST_PROXY_COUNT;
  if (candidate == null || candidate === '') {
    return 'loopback';
  }

  if (candidate === 'true') {
    return true;
  }
  if (candidate === 'false') {
    return false;
  }

  const numberValue = Number(candidate);
  if (Number.isFinite(numberValue) && numberValue >= 0) {
    return numberValue;
  }

  return candidate;
}

export function createCorsMiddleware({ env = process.env, logger: providedLogger } = {}) {
  const allowedOrigins = resolveAllowedOrigins(env);
  const rules = compileAllowedOriginRules(allowedOrigins);
  const log = resolveLogger(providedLogger);
  const corsHandler = cors({
    credentials: true,
    origin: true,
    exposedHeaders: ['request-id', 'x-request-id'],
    optionsSuccessStatus: 204,
  });

  const lastAudit = new Map();

  return function corsGuard(req, res, next) {
    const origin = req.get('origin');
    if (origin && !isOriginAllowed(origin, rules)) {
      const { entry } = recordBlockedOrigin(origin, {
        path: req.originalUrl || req.path,
        method: req.method,
      });

      const lastRecorded = lastAudit.get(origin);
      const now = Date.now();
      if (!lastRecorded || now - lastRecorded >= AUDIT_THROTTLE_MS) {
        lastAudit.set(origin, now);
        recordRuntimeSecurityEvent(
          {
            eventType: 'security.perimeter.origin_blocked',
            level: entry.attempts > 10 ? 'warn' : 'notice',
            message: `Blocked CORS origin "${origin}" attempting to access ${req.originalUrl || req.path}`,
            metadata: {
              origin,
              attempts: entry.attempts,
              paths: entry.paths.slice(0, 5),
            },
            requestId: req.id,
          },
          { logger: log },
        ).catch((error) => {
          log.warn({ err: error, origin }, 'Failed to persist origin block audit');
        });
      }

      log.warn({ origin, path: req.originalUrl || req.path }, 'Blocked request from untrusted origin');
      res.status(403).json({
        message: 'Origin not allowed for this resource.',
        requestId: req.id ?? null,
      });
      return;
    }

    corsHandler(req, res, next);
  };
}

export function applyHttpSecurity(app, { env = process.env, logger: providedLogger } = {}) {
  const log = resolveLogger(providedLogger);
  const trustProxy = resolveTrustProxy(env);
  if (trustProxy !== undefined) {
    app.set('trust proxy', trustProxy);
  }

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", ...resolveAllowedOrigins(env)],
          imgSrc: ["'self'", 'data:', 'https:'],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      referrerPolicy: { policy: 'no-referrer' },
      strictTransportSecurity: {
        maxAge: 63072000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });

  app.use(createCorsMiddleware({ env, logger: log }));

  app.use(compression({ threshold: '2kb' }));

  return { allowedOrigins: resolveAllowedOrigins(env) };
}

export default applyHttpSecurity;
