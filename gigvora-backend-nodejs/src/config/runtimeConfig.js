import { EventEmitter } from 'node:events';
import { readFile } from 'node:fs/promises';
import { watch } from 'node:fs';
import path from 'node:path';
import { parse as parseEnvFile } from 'dotenv';
import { z } from 'zod';

const DEFAULT_ALLOWED_ORIGINS = [
  'https://app.gigvora.com',
  'https://admin.gigvora.com',
  'https://console.gigvora.com',
  'https://gigvora.com',
  'https://www.gigvora.com',
  'http://localhost:3000',
  'http://localhost:4000',
  'http://localhost:4173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4000',
  'http://127.0.0.1:4173',
];

const LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

function parseBoolean(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const normalised = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalised)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalised)) {
    return false;
  }
  return fallback;
}

function parseNumber(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const numberValue = Number(value);
  if (Number.isFinite(numberValue)) {
    return numberValue;
  }
  return fallback;
}

function parseList(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
      .filter((entry) => entry.length > 0);
  }
  return String(value)
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function parseOrigins(env) {
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
    parseList(source).forEach((origin) => {
      if (origin) {
        resolved.add(origin);
      }
    });
  });

  return Array.from(resolved);
}

export const runtimeConfigSchema = z.object({
  env: z
    .enum(['development', 'test', 'staging', 'production', 'preview'])
    .default('development'),
  serviceName: z.string().min(1).default('gigvora-backend'),
  http: z.object({
    host: z.string().min(1).default('0.0.0.0'),
    port: z.number().int().min(1).max(65535).default(4000),
    requestBodyLimit: z.string().min(1).default('1mb'),
    compressionThreshold: z.string().min(1).default('2kb'),
    rateLimit: z.object({
      windowMs: z.number().int().positive().default(60_000),
      maxRequests: z.number().int().positive().default(300),
      skipHealth: z.boolean().default(true),
      skipPaths: z.array(z.string()).default(['/health', '/api/admin/runtime/health']),
    }),
  }),
  security: z.object({
    metrics: z.object({
      enabled: z.boolean().default(true),
      token: z.string().min(16).optional(),
    }),
    cors: z.object({
      allowedOrigins: z.array(z.string()).default([]),
    }),
    csp: z.object({
      scriptSrc: z.array(z.string()).default(["'self'"]),
      styleSrc: z.array(z.string()).default(["'self'", 'https:']),
      connectSrc: z.array(z.string()).default(["'self'"]),
      imgSrc: z.array(z.string()).default(["'self'", 'data:', 'https:']),
    }),
  }),
  logging: z.object({
    level: z.enum(LOG_LEVELS).default('info'),
    redact: z.array(z.string()).default([
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["set-cookie"]',
      'res.headers["set-cookie"]',
    ]),
    enableHttpLogging: z.boolean().default(true),
    pretty: z.boolean().default(false),
  }),
  observability: z.object({
    correlation: z.object({
      headerName: z.string().min(3).default('x-request-id'),
      acceptIncomingHeader: z.boolean().default(false),
    }),
  }),
  workers: z.object({
    autoStart: z.boolean().default(true),
    profileEngagement: z.object({
      enabled: z.boolean().default(true),
      intervalMs: z.number().int().positive().default(30_000),
    }),
    newsAggregation: z.object({
      enabled: z.boolean().default(true),
      intervalMs: z.number().int().positive().default(5 * 60_000),
    }),
  }),
  runtime: z.object({
    configFile: z.string().optional(),
    hotReload: z.boolean().default(true),
  }),
});

const configEmitter = new EventEmitter();
configEmitter.setMaxListeners(50);

let activeWatcher = null;
let cachedConfig = null;

async function loadConfigFile(configFilePath) {
  if (!configFilePath) {
    return {};
  }
  try {
    const absolute = path.resolve(configFilePath);
    const content = await readFile(absolute, 'utf8');
    const parsed = parseEnvFile(content);
    return parsed ?? {};
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(
        `Failed to read runtime config file at ${configFilePath}: ${error.message}`,
      );
    }
    return {};
  }
}

function buildRawConfig(env) {
  const allowedOrigins = parseOrigins(env);
  const compressionThreshold = env.COMPRESSION_THRESHOLD ?? '2kb';
  const metricsEnabled = parseBoolean(env.ENABLE_PROMETHEUS_METRICS, true);
  const requestBodyLimit = env.REQUEST_BODY_LIMIT ?? '1mb';
  const hotReload = parseBoolean(env.RUNTIME_CONFIG_HOT_RELOAD, true);

  return {
    env: env.NODE_ENV ?? 'development',
    serviceName: env.SERVICE_NAME || 'gigvora-backend',
    http: {
      host: env.HOST || '0.0.0.0',
      port: parseNumber(env.PORT, 4000),
      requestBodyLimit,
      compressionThreshold,
      rateLimit: {
        windowMs: parseNumber(env.RATE_LIMIT_WINDOW_MS, 60_000),
        maxRequests: parseNumber(env.RATE_LIMIT_MAX_REQUESTS, 300),
        skipHealth: true,
        skipPaths: ['/health', '/api/admin/runtime/health'],
      },
    },
    security: {
      metrics: {
        enabled: metricsEnabled,
        token: env.METRICS_BEARER_TOKEN || undefined,
      },
      cors: {
        allowedOrigins,
      },
      csp: {
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", 'https:'],
        connectSrc: ["'self'", ...allowedOrigins],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    logging: {
      level: LOG_LEVELS.includes((env.LOG_LEVEL || '').toLowerCase())
        ? env.LOG_LEVEL.toLowerCase()
        : env.NODE_ENV === 'development'
          ? 'debug'
          : 'info',
      redact: undefined,
      enableHttpLogging: parseBoolean(env.ENABLE_HTTP_LOGGING, env.NODE_ENV !== 'test'),
      pretty: parseBoolean(env.PINO_PRETTY_PRINT, env.NODE_ENV === 'development'),
    },
    observability: {
      correlation: {
        headerName: (env.CORRELATION_ID_HEADER || 'x-request-id').toLowerCase(),
        acceptIncomingHeader: parseBoolean(env.ACCEPT_INBOUND_REQUEST_IDS, false),
      },
    },
    workers: {
      autoStart: parseBoolean(env.ENABLE_BACKGROUND_WORKERS, true),
      profileEngagement: {
        enabled: parseBoolean(env.ENABLE_PROFILE_ENGAGEMENT_WORKER, true),
        intervalMs: parseNumber(env.PROFILE_ENGAGEMENT_INTERVAL_MS, 30_000),
      },
      newsAggregation: {
        enabled: parseBoolean(env.ENABLE_NEWS_AGGREGATION_WORKER, true),
        intervalMs: parseNumber(env.NEWS_AGGREGATION_INTERVAL_MS, 5 * 60_000),
      },
    },
    runtime: {
      configFile: env.RUNTIME_CONFIG_FILE || env.RUNTIME_ENV_FILE || undefined,
      hotReload,
    },
  };
}

async function resolveConfig(env = process.env, overrides = {}) {
  const fileOverrides = await loadConfigFile(overrides.RUNTIME_CONFIG_FILE || env.RUNTIME_CONFIG_FILE);
  const mergedEnv = {
    ...env,
    ...fileOverrides,
    ...overrides,
  };

  const rawConfig = buildRawConfig(mergedEnv);
  return runtimeConfigSchema.parse(rawConfig);
}

export function buildRuntimeConfigFromEnv(env = process.env) {
  return buildRawConfig(env);
}

export function getRuntimeConfig() {
  return cachedConfig;
}

export async function refreshRuntimeConfig({ reason = 'manual', overrides = {} } = {}) {
  const nextConfig = await resolveConfig(process.env, overrides);
  cachedConfig = nextConfig;
  configEmitter.emit('change', {
    config: nextConfig,
    reason,
    timestamp: new Date().toISOString(),
  });
  return nextConfig;
}

export function onRuntimeConfigChange(listener) {
  configEmitter.on('change', listener);
  return () => configEmitter.off('change', listener);
}

function registerWatcherIfNeeded(config) {
  if (!config.runtime.configFile || !config.runtime.hotReload) {
    if (activeWatcher) {
      activeWatcher.close();
      activeWatcher = null;
    }
    return;
  }

  const absolute = path.resolve(config.runtime.configFile);
  if (activeWatcher) {
    const currentPath = activeWatcher.__watchedPath;
    if (currentPath === absolute) {
      return;
    }
    activeWatcher.close();
    activeWatcher = null;
  }

  try {
    activeWatcher = watch(absolute, { persistent: false }, (eventType) => {
      if (eventType === 'change' || eventType === 'rename') {
        refreshRuntimeConfig({ reason: 'hot-reload', overrides: { RUNTIME_CONFIG_FILE: absolute } }).catch((error) => {
          console.error('Failed to hot reload runtime configuration', error);
        });
      }
    });
    activeWatcher.__watchedPath = absolute;
  } catch (error) {
    console.warn(`Unable to watch runtime config file ${absolute}: ${error.message}`);
  }
}

// Initialise configuration synchronously on first import.
const initialConfigPromise = resolveConfig()
  .then((config) => {
    cachedConfig = config;
    registerWatcherIfNeeded(config);
    return config;
  })
  .catch((error) => {
    console.error('Failed to load runtime configuration', error);
    cachedConfig = runtimeConfigSchema.parse(buildRawConfig(process.env));
    return cachedConfig;
  });

export function whenRuntimeConfigReady() {
  return initialConfigPromise;
}

configEmitter.on('change', ({ config }) => {
  registerWatcherIfNeeded(config);
});

