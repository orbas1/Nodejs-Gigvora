import { EventEmitter } from 'node:events';
import { readFile } from 'node:fs/promises';
import { watch } from 'node:fs';
import path from 'node:path';
import { parse as parseEnvFile } from 'dotenv';
import { z } from 'zod';
import { ensureEnvLoaded } from './envLoader.js';

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

const HEALTH_CHECK_RATE_LIMIT_PATHS = [
  '/health',
  '/health/live',
  '/health/ready',
  '/health/metrics',
];

const CONTROL_PLANE_RATE_LIMIT_PATHS = ['/api/admin/runtime/health'];

const DEFAULT_RATE_LIMIT_SKIP_PATHS = [
  ...new Set([...HEALTH_CHECK_RATE_LIMIT_PATHS, ...CONTROL_PLANE_RATE_LIMIT_PATHS]),
];

const TRACING_DIAGNOSTIC_LEVELS = ['none', 'error', 'warn', 'info', 'debug', 'all'];

ensureEnvLoaded({ silent: process.env.NODE_ENV === 'test' });

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

function parseJsonObject(value) {
  if (!value) {
    return undefined;
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    return undefined;
  }
  return undefined;
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

function normalizeSkipPath(path) {
  if (typeof path !== 'string') {
    return null;
  }
  const trimmed = path.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function normaliseRateLimitSkipPaths({ skipHealth = true, existingSkipPaths = [] } = {}) {
  const entries = new Set(CONTROL_PLANE_RATE_LIMIT_PATHS);
  const initialPaths = Array.isArray(existingSkipPaths) ? existingSkipPaths : [];
  initialPaths.forEach((candidate) => {
    const normalised = normalizeSkipPath(candidate);
    if (normalised) {
      entries.add(normalised);
    }
  });
  if (skipHealth) {
    HEALTH_CHECK_RATE_LIMIT_PATHS.forEach((path) => entries.add(path));
  } else {
    HEALTH_CHECK_RATE_LIMIT_PATHS.forEach((path) => entries.delete(path));
  }
  return Array.from(entries);
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
      skipPaths: z.array(z.string()).default(DEFAULT_RATE_LIMIT_SKIP_PATHS),
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
    tracing: z
      .object({
        enabled: z.boolean().default(false),
        serviceName: z.string().min(3).default('gigvora-backend'),
        diagnostics: z.enum(['none', 'error', 'warn', 'info', 'debug', 'all']).default('error'),
        sampling: z
          .object({
            ratio: z.number().min(0).max(1).default(0.1),
          })
          .default({ ratio: 0.1 }),
        ignorePaths: z.array(z.string()).default([]),
        otlp: z
          .object({
            url: z.string().url().optional(),
            headers: z.record(z.string()).default({}),
          })
          .default({ headers: {} }),
      })
      .default({
        enabled: false,
        serviceName: 'gigvora-backend',
        diagnostics: 'error',
        sampling: { ratio: 0.1 },
        ignorePaths: [],
        otlp: { headers: {} },
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
  realtime: z
    .object({
      enabled: z.boolean().default(true),
      cors: z.object({ allowedOrigins: z.array(z.string()).default([]) }).default({ allowedOrigins: [] }),
      connection: z
        .object({
          maxConnectionsPerUser: z.number().int().positive().default(6),
          handshakeTimeoutMs: z.number().int().positive().default(45_000),
          pingIntervalMs: z.number().int().positive().default(25_000),
          pingTimeoutMs: z.number().int().positive().default(20_000),
        })
        .default({
          maxConnectionsPerUser: 6,
          handshakeTimeoutMs: 45_000,
          pingIntervalMs: 25_000,
          pingTimeoutMs: 20_000,
        }),
      redis: z
        .object({
          url: z.string().min(5).optional(),
          tls: z.boolean().default(false),
          keyPrefix: z.string().min(1).default('gigvora:realtime'),
        })
        .default({ url: undefined, tls: false, keyPrefix: 'gigvora:realtime' }),
      namespaces: z
        .object({
          community: z
            .object({
              rateLimitPerMinute: z.number().int().positive().default(120),
              historyLimit: z.number().int().positive().default(50),
            })
            .default({ rateLimitPerMinute: 120, historyLimit: 50 }),
          voice: z
            .object({
              enabled: z.boolean().default(true),
              maxParticipants: z.number().int().positive().default(100),
              recordingRequired: z.boolean().default(false),
            })
            .default({ enabled: true, maxParticipants: 100, recordingRequired: false }),
          events: z.object({ enabled: z.boolean().default(true) }).default({ enabled: true }),
          moderation: z.object({ enabled: z.boolean().default(true) }).default({ enabled: true }),
        })
        .default({
          community: { rateLimitPerMinute: 120, historyLimit: 50 },
          voice: { enabled: true, maxParticipants: 100, recordingRequired: false },
          events: { enabled: true },
          moderation: { enabled: true },
        }),
    })
    .default({
      enabled: true,
      cors: { allowedOrigins: [] },
      connection: {
        maxConnectionsPerUser: 6,
        handshakeTimeoutMs: 45_000,
        pingIntervalMs: 25_000,
        pingTimeoutMs: 20_000,
      },
      redis: { url: undefined, tls: false, keyPrefix: 'gigvora:realtime' },
      namespaces: {
        community: { rateLimitPerMinute: 120, historyLimit: 50 },
        voice: { enabled: true, maxParticipants: 100, recordingRequired: false },
        events: { enabled: true },
        moderation: { enabled: true },
      },
    }),
  support: z
    .object({
      chatwoot: z
        .object({
          enabled: z.boolean().default(false),
          baseUrl: z.string().url().optional(),
          websiteToken: z.string().min(8).optional(),
          hmacToken: z.string().min(8).optional(),
          webhookToken: z.string().min(8).optional(),
          inboxId: z.number().int().positive().optional(),
          portalToken: z.string().optional(),
          defaultLocale: z.string().min(2).max(10).default('en'),
          sla: z
            .object({
              firstResponseMinutes: z.number().int().positive().default(30),
              resolutionMinutes: z.number().int().positive().default(720),
            })
            .default({ firstResponseMinutes: 30, resolutionMinutes: 720 }),
        })
        .refine(
          (value) =>
            !value.enabled ||
            (typeof value.baseUrl === 'string' && value.baseUrl.length > 0 &&
              typeof value.websiteToken === 'string' && value.websiteToken.length > 0),
          {
            message: 'Chatwoot configuration requires baseUrl and websiteToken when enabled.',
          },
        )
        .default({
          enabled: false,
          baseUrl: undefined,
          websiteToken: undefined,
          hmacToken: undefined,
          webhookToken: undefined,
          inboxId: undefined,
          portalToken: undefined,
          defaultLocale: 'en',
          sla: { firstResponseMinutes: 30, resolutionMinutes: 720 },
        }),
    })
    .default({
      chatwoot: {
        enabled: false,
        baseUrl: undefined,
        websiteToken: undefined,
        hmacToken: undefined,
        webhookToken: undefined,
        inboxId: undefined,
        portalToken: undefined,
        defaultLocale: 'en',
        sla: { firstResponseMinutes: 30, resolutionMinutes: 720 },
      },
    }),
});

export class RuntimeConfigValidationError extends Error {
  constructor(zodError, rawConfig) {
    const issues = Array.isArray(zodError?.issues) ? zodError.issues : [];
    const formattedIssues = issues
      .map((issue) => {
        const path = Array.isArray(issue.path) && issue.path.length ? issue.path.join('.') : 'root';
        return `• ${path}: ${issue.message}`;
      })
      .join('\n');
    const message = formattedIssues
      ? `Runtime configuration validation failed:\n${formattedIssues}`
      : 'Runtime configuration validation failed.';
    super(message);
    this.name = 'RuntimeConfigValidationError';
    this.issues = issues;
    this.rawConfig = rawConfig;
  }
}

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
  const realtimeEnabled = parseBoolean(env.REALTIME_ENABLED ?? env.SOCKET_IO_ENABLED, true);
  const realtimeOrigins = parseList(env.REALTIME_ALLOWED_ORIGINS ?? env.SOCKET_ALLOWED_ORIGINS);
  const realtimeAllowedOrigins = realtimeOrigins.length ? realtimeOrigins : allowedOrigins;
  const maxConnectionsPerUser = parseNumber(env.REALTIME_MAX_CONNECTIONS_PER_USER, 6);
  const handshakeTimeoutMs = parseNumber(env.REALTIME_HANDSHAKE_TIMEOUT_MS, 45_000);
  const pingIntervalMs = parseNumber(env.REALTIME_PING_INTERVAL_MS, 25_000);
  const pingTimeoutMs = parseNumber(env.REALTIME_PING_TIMEOUT_MS, 20_000);
  const realtimeRedisUrl =
    env.REALTIME_REDIS_URL || env.SOCKET_REDIS_URL || env.REDIS_URL || env.IO_REDIS_URL || undefined;
  const realtimeRedisTls = parseBoolean(env.REALTIME_REDIS_TLS ?? env.SOCKET_REDIS_TLS, false);
  const realtimeRedisPrefix = env.REALTIME_REDIS_PREFIX || env.SOCKET_REDIS_PREFIX || 'gigvora:realtime';
  const communityRateLimitPerMinute = parseNumber(env.REALTIME_COMMUNITY_RATE_LIMIT_PER_MINUTE, 120);
  const communityHistoryLimit = parseNumber(env.REALTIME_COMMUNITY_HISTORY_LIMIT, 50);
  const voiceEnabled = parseBoolean(env.REALTIME_VOICE_ENABLED, true);
  const voiceMaxParticipants = parseNumber(env.REALTIME_VOICE_MAX_PARTICIPANTS, 100);
  const voiceRecordingRequired = parseBoolean(env.REALTIME_VOICE_RECORDING_REQUIRED, false);
  const eventsEnabled = parseBoolean(env.REALTIME_EVENTS_ENABLED, true);
  const moderationEnabled = parseBoolean(env.REALTIME_MODERATION_ENABLED, true);
  const tracingEnabled = parseBoolean(env.TRACING_ENABLED ?? env.OTEL_TRACING_ENABLED, false);
  const tracingExporterUrl =
    env.TRACING_EXPORTER_URL || env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const tracingHeaders =
    parseJsonObject(env.TRACING_EXPORTER_HEADERS ?? env.OTEL_EXPORTER_OTLP_HEADERS) || undefined;
  const tracingIgnorePaths = parseList(env.TRACING_IGNORE_PATHS);
  const tracingSamplingRatio = parseNumber(env.TRACING_SAMPLING_RATIO, 0.1);
  const tracingDiagnostics = (env.TRACING_DIAGNOSTICS_LEVEL || env.OTEL_DIAGNOSTICS || '').toLowerCase();
  const tracingServiceName = env.TRACING_SERVICE_NAME || env.OTEL_SERVICE_NAME || env.SERVICE_NAME;
  const chatwootEnabled = parseBoolean(env.CHATWOOT_ENABLED ?? env.ENABLE_CHATWOOT, false);
  const chatwootBaseUrl = env.CHATWOOT_BASE_URL || env.CHATWOOT_URL || undefined;
  const chatwootWebsiteToken = env.CHATWOOT_WEBSITE_TOKEN || env.CHATWOOT_TOKEN || undefined;
  const chatwootHmacToken = env.CHATWOOT_HMAC_TOKEN || env.CHATWOOT_HMAC_SECRET || undefined;
  const chatwootWebhookToken =
    env.CHATWOOT_WEBHOOK_TOKEN || env.CHATWOOT_WEBHOOK_SECRET || env.CHATWOOT_HMAC_TOKEN || undefined;
  const chatwootInboxId = parseNumber(env.CHATWOOT_INBOX_ID, undefined);
  const chatwootPortalToken = env.CHATWOOT_PORTAL_TOKEN || env.CHATWOOT_API_TOKEN || undefined;
  const chatwootLocale = env.CHATWOOT_DEFAULT_LOCALE || 'en';
  const chatwootFirstResponseMinutes = parseNumber(env.CHATWOOT_SLA_FIRST_RESPONSE_MINUTES, 30);
  const chatwootResolutionMinutes = parseNumber(env.CHATWOOT_SLA_RESOLUTION_MINUTES, 720);

  const rateLimitSkipHealth = parseBoolean(env.RATE_LIMIT_SKIP_HEALTH, true);
  const configuredSkipPaths = parseList(env.RATE_LIMIT_SKIP_PATHS);
  const resolvedSkipPaths = normaliseRateLimitSkipPaths({
    skipHealth: rateLimitSkipHealth,
    existingSkipPaths: configuredSkipPaths.length ? configuredSkipPaths : DEFAULT_RATE_LIMIT_SKIP_PATHS,
  });

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
        skipHealth: rateLimitSkipHealth,
        skipPaths: resolvedSkipPaths,
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
      tracing: {
        enabled: tracingEnabled,
        serviceName: tracingServiceName || env.SERVICE_NAME || 'gigvora-backend',
        diagnostics: TRACING_DIAGNOSTIC_LEVELS.includes(tracingDiagnostics) ? tracingDiagnostics : 'error',
        sampling: {
          ratio:
            typeof tracingSamplingRatio === 'number' && tracingSamplingRatio >= 0 && tracingSamplingRatio <= 1
              ? tracingSamplingRatio
              : 0.1,
        },
        ignorePaths: tracingIgnorePaths,
        otlp: {
          url: tracingExporterUrl || undefined,
          headers: tracingHeaders || {},
        },
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
    realtime: {
      enabled: realtimeEnabled,
      cors: { allowedOrigins: realtimeAllowedOrigins },
      connection: {
        maxConnectionsPerUser: maxConnectionsPerUser > 0 ? maxConnectionsPerUser : 6,
        handshakeTimeoutMs: handshakeTimeoutMs > 1_000 ? handshakeTimeoutMs : 45_000,
        pingIntervalMs: pingIntervalMs > 5_000 ? pingIntervalMs : 25_000,
        pingTimeoutMs: pingTimeoutMs > 5_000 ? pingTimeoutMs : 20_000,
      },
      redis: {
        url: realtimeRedisUrl,
        tls: realtimeRedisTls,
        keyPrefix: realtimeRedisPrefix,
      },
      namespaces: {
        community: {
          rateLimitPerMinute: communityRateLimitPerMinute > 0 ? communityRateLimitPerMinute : 120,
          historyLimit: communityHistoryLimit > 0 ? communityHistoryLimit : 50,
        },
        voice: {
          enabled: voiceEnabled,
          maxParticipants: voiceMaxParticipants > 0 ? voiceMaxParticipants : 100,
          recordingRequired: voiceRecordingRequired,
        },
        events: { enabled: eventsEnabled },
        moderation: { enabled: moderationEnabled },
      },
    },
    support: {
      chatwoot: {
        enabled: chatwootEnabled,
        baseUrl: chatwootBaseUrl,
        websiteToken: chatwootWebsiteToken,
        hmacToken: chatwootHmacToken,
        webhookToken: chatwootWebhookToken,
        inboxId: chatwootInboxId && chatwootInboxId > 0 ? chatwootInboxId : undefined,
        portalToken: chatwootPortalToken,
        defaultLocale: chatwootLocale || 'en',
        sla: {
          firstResponseMinutes:
            chatwootFirstResponseMinutes && chatwootFirstResponseMinutes > 0
              ? chatwootFirstResponseMinutes
              : 30,
          resolutionMinutes:
            chatwootResolutionMinutes && chatwootResolutionMinutes > 0
              ? chatwootResolutionMinutes
              : 720,
        },
      },
    },
  };
}

function parseRuntimeConfig(rawConfig) {
  const result = runtimeConfigSchema.safeParse(rawConfig);
  if (!result.success) {
    throw new RuntimeConfigValidationError(result.error, rawConfig);
  }
  return result.data;
}

async function resolveConfig(env = process.env, overrides = {}) {
  const fileOverrides = await loadConfigFile(overrides.RUNTIME_CONFIG_FILE || env.RUNTIME_CONFIG_FILE);
  const mergedEnv = {
    ...env,
    ...fileOverrides,
    ...overrides,
  };

  const rawConfig = buildRawConfig(mergedEnv);
  return parseRuntimeConfig(rawConfig);
}

export function buildRuntimeConfigFromEnv(env = process.env) {
  return buildRawConfig(env);
}

export function resolveHttpRateLimitSettings(config = getRuntimeConfig()) {
  const rateLimitConfig = config?.http?.rateLimit ?? {};
  const skipHealth = rateLimitConfig.skipHealth !== false;
  const skipPaths = normaliseRateLimitSkipPaths({
    skipHealth,
    existingSkipPaths: rateLimitConfig.skipPaths ?? DEFAULT_RATE_LIMIT_SKIP_PATHS,
  });
  return {
    windowMs: rateLimitConfig.windowMs ?? 60_000,
    maxRequests: rateLimitConfig.maxRequests ?? 300,
    skipPaths,
  };
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
    throw error;
  });

export function whenRuntimeConfigReady() {
  return initialConfigPromise;
}

configEmitter.on('change', ({ config }) => {
  registerWatcherIfNeeded(config);
});

