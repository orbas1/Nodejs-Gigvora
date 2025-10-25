import { diag, DiagConsoleLogger, DiagLogLevel, trace } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { Resource } from '@opentelemetry/resources';
import { BatchSpanProcessor, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

import logger from '../utils/logger.js';
import { getRuntimeConfig } from '../config/runtimeConfig.js';

const DEFAULT_IGNORE_PATHS = ['/health', '/health/live', '/health/ready', '/health/metrics'];

let provider = null;
let instrumentations = [];
let activeSignature = null;
let contextManager = null;

function stableStringify(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
  }
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(',')}}`;
}

function toNumber(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function buildIgnorePaths(config) {
  const paths = Array.isArray(config?.ignorePaths) ? config.ignorePaths : [];
  const merged = new Set(DEFAULT_IGNORE_PATHS);
  paths.forEach((pathCandidate) => {
    if (typeof pathCandidate !== 'string') {
      return;
    }
    const trimmed = pathCandidate.trim();
    if (!trimmed) {
      return;
    }
    merged.add(trimmed.startsWith('/') ? trimmed : `/${trimmed}`);
  });
  return Array.from(merged);
}

function buildHeaders(config) {
  if (!config?.headers || typeof config.headers !== 'object') {
    return undefined;
  }
  return Object.entries(config.headers).reduce((accumulator, [key, value]) => {
    if (typeof key !== 'string') {
      return accumulator;
    }
    accumulator[key] = typeof value === 'string' ? value : String(value ?? '');
    return accumulator;
  }, {});
}

function stopInstrumentations() {
  instrumentations.forEach((instrumentation) => {
    try {
      instrumentation.disable();
    } catch (error) {
      logger.warn({ err: error, component: 'tracing' }, 'Failed to disable instrumentation');
    }
  });
  instrumentations = [];
}

export async function shutdownTracing() {
  const previousProvider = provider;
  provider = null;
  activeSignature = null;
  stopInstrumentations();

  if (contextManager) {
    try {
      contextManager.disable();
    } catch (error) {
      logger.warn({ err: error, component: 'tracing' }, 'Failed to disable context manager');
    }
    contextManager = null;
  }

  if (!previousProvider) {
    return;
  }

  try {
    await previousProvider.shutdown();
  } catch (error) {
    logger.warn({ err: error, component: 'tracing' }, 'Tracing provider shutdown encountered errors');
  }
}

function configureDiagLogger(level) {
  const mapping = {
    none: DiagLogLevel.NONE,
    error: DiagLogLevel.ERROR,
    warn: DiagLogLevel.WARN,
    info: DiagLogLevel.INFO,
    debug: DiagLogLevel.DEBUG,
    all: DiagLogLevel.ALL,
  };
  const resolved = mapping[level] ?? DiagLogLevel.ERROR;
  diag.setLogger(new DiagConsoleLogger(), resolved);
}

function buildProvider(config, runtime) {
  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]:
      config?.serviceName || runtime?.serviceName || 'gigvora-backend',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: runtime?.env ?? process.env.NODE_ENV ?? 'development',
    [SemanticResourceAttributes.SERVICE_VERSION]: runtime?.version || process.env.APP_VERSION || 'dev',
  });

  const samplerRatio = toNumber(config?.sampling?.ratio, 0.1);
  const sampler = new TraceIdRatioBasedSampler(Math.max(0, Math.min(1, samplerRatio)));

  const tracerProvider = new NodeTracerProvider({ resource, sampler });

  const exporterUrl = config?.otlp?.url;
  if (exporterUrl) {
    const exporter = new OTLPTraceExporter({
      url: exporterUrl,
      headers: buildHeaders(config?.otlp),
    });
    tracerProvider.addSpanProcessor(new BatchSpanProcessor(exporter));
  }

  return tracerProvider;
}

function enableInstrumentations(config) {
  const ignorePaths = buildIgnorePaths(config);
  const headerName = (config?.correlationHeader ?? 'x-request-id').toLowerCase();

  const httpInstrumentation = new HttpInstrumentation({
    enabled: true,
    ignoreIncomingPaths: ignorePaths,
    requireParentforOutgoingSpans: true,
    requestHook: (span, request) => {
      try {
        const correlationId = request?.headers?.[headerName];
        if (correlationId) {
          span.setAttribute('http.request_id', correlationId);
        }
      } catch (error) {
        logger.debug({ err: error, component: 'tracing' }, 'Failed to attach correlation id to span');
      }
    },
  });

  const expressInstrumentation = new ExpressInstrumentation({ enabled: true });

  instrumentations = [httpInstrumentation, expressInstrumentation];
  registerInstrumentations({ instrumentations });
}

export async function configureTracing(runtimeConfig = getRuntimeConfig()) {
  const tracingConfig = runtimeConfig?.observability?.tracing ?? {};
  const enabled = Boolean(tracingConfig.enabled);
  const signature = enabled ? stableStringify(tracingConfig) : 'disabled';

  if (signature === activeSignature) {
    return { enabled, unchanged: true };
  }

  await shutdownTracing();

  if (!enabled) {
    logger.info({ component: 'tracing' }, 'Tracing disabled via runtime configuration');
    return { enabled: false, refreshed: true };
  }

  configureDiagLogger(tracingConfig?.diagnostics ?? 'error');

  const tracerProvider = buildProvider(tracingConfig, runtimeConfig);

  contextManager = new AsyncLocalStorageContextManager();
  contextManager.enable();

  tracerProvider.register({ contextManager });
  provider = tracerProvider;

  enableInstrumentations({
    ignorePaths: tracingConfig?.ignorePaths,
    correlationHeader: runtimeConfig?.observability?.correlation?.headerName,
  });

  activeSignature = signature;
  logger.info({ component: 'tracing', exporter: tracingConfig?.otlp?.url || 'noop' }, 'Tracing initialised');
  return { enabled: true, refreshed: true };
}

export function getTracer(name = 'gigvora-backend') {
  return trace.getTracer(name);
}

export default {
  configureTracing,
  shutdownTracing,
  getTracer,
};
