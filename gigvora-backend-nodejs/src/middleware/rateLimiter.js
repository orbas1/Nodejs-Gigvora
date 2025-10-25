import rateLimit from 'express-rate-limit';
import {
  configureRateLimitMetrics,
  recordRateLimitAttempt,
  recordRateLimitSuccess,
  recordRateLimitBlocked,
} from '../observability/rateLimitMetrics.js';

const DEFAULT_MESSAGE = { message: 'Too many requests, please try again later.' };

function sanitizeRequestPath(req) {
  const base = req.baseUrl || '';
  const path = req.path || req.originalUrl || '/';
  const combined = `${base}${path}`;
  return combined.split('?')[0] || '/';
}

function defaultKeyGenerator(req) {
  if (req.user?.id != null) {
    return `user:${req.user.id}`;
  }
  if (req.auth?.userId != null) {
    return `user:${req.auth.userId}`;
  }
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim().length) {
    return `ip:${forwarded.split(',')[0].trim()}`;
  }
  if (req.headers['x-real-ip']) {
    return `ip:${req.headers['x-real-ip']}`;
  }
  return `ip:${req.ip}`;
}

export function createInstrumentedRateLimiter(options = {}) {
  const windowMsCandidate = Number(options.windowMs);
  const maxCandidate = Number(options.max);

  const windowMs = Number.isFinite(windowMsCandidate) && windowMsCandidate > 0 ? windowMsCandidate : 60_000;
  const max = Number.isFinite(maxCandidate) && maxCandidate > 0 ? maxCandidate : 300;

  const skip = typeof options.skip === 'function' ? options.skip : () => false;
  const keyGenerator = options.keyGenerator || defaultKeyGenerator;
  const message = options.message ?? DEFAULT_MESSAGE;
  const userHandler = options.handler;
  const userOnLimitReached = options.onLimitReached;

  configureRateLimitMetrics({ windowMs, max });

  const limiter = rateLimit({
    windowMs,
    max,
    standardHeaders: options.standardHeaders ?? true,
    legacyHeaders: options.legacyHeaders ?? false,
    message,
    skip,
    keyGenerator,
    handler: (req, res, next, optionsUsed) => {
      const probe = req.__rateLimitProbe;
      const key = probe?.key ?? keyGenerator(req, res);
      const method = probe?.method ?? req.method;
      const path = probe?.path ?? sanitizeRequestPath(req);
      const timestamp = probe?.timestamp ?? Date.now();
      recordRateLimitBlocked({ key, method, path, timestamp });
      delete req.__rateLimitProbe;
      if (typeof userOnLimitReached === 'function') {
        try {
          userOnLimitReached(req, res, optionsUsed);
        } catch (error) {
          // Swallow observer errors to avoid masking rate-limit responses.
        }
      }
      if (typeof userHandler === 'function') {
        return userHandler(req, res, next, optionsUsed);
      }
      const statusCode = optionsUsed?.statusCode ?? 429;
      const payload = optionsUsed?.message ?? message;
      return res.status(statusCode).json(payload);
    },
  });

  return function instrumentedRateLimiter(req, res, next) {
    if (skip(req)) {
      return next();
    }
    const key = keyGenerator(req, res);
    const path = sanitizeRequestPath(req);
    const method = (req.method || 'GET').toUpperCase();
    const timestamp = Date.now();
    req.__rateLimitProbe = { key, path, method, timestamp };
    recordRateLimitAttempt({ key, method, path, timestamp });
    return limiter(req, res, (err) => {
      if (err) {
        return next(err);
      }
      recordRateLimitSuccess({ key, timestamp });
      delete req.__rateLimitProbe;
      return next();
    });
  };
}

export { sanitizeRequestPath, defaultKeyGenerator };

