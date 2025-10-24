import process from 'node:process';

import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { BatchSpanProcessor, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

let provider = null;
let initialized = false;

function buildHeadersFromEnv(headerString) {
  if (!headerString) {
    return undefined;
  }
  return headerString.split(',').reduce((accumulator, segment) => {
    const [rawKey, rawValue] = segment.split('=');
    const key = rawKey?.trim();
    if (!key) {
      return accumulator;
    }
    accumulator[key] = rawValue?.trim() ?? '';
    return accumulator;
  }, {});
}

export function initializeTracing({
  serviceName = 'gigvora-backend',
  serviceVersion = process.env.APP_VERSION ?? 'unknown',
  logger = console,
} = {}) {
  if (initialized) {
    return provider;
  }

  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV ?? 'development',
  });

  provider = new NodeTracerProvider({ resource });

  const endpoint = process.env.TRACING_OTLP_ENDPOINT ?? process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? null;
  const headers = buildHeadersFromEnv(process.env.TRACING_OTLP_HEADERS ?? process.env.OTEL_EXPORTER_OTLP_HEADERS);

  if (endpoint) {
    const exporter = new OTLPTraceExporter({ url: endpoint.replace(/\/?$/, '/v1/traces'), headers });
    provider.addSpanProcessor(new BatchSpanProcessor(exporter));
  } else if (process.env.NODE_ENV !== 'production') {
    // In local environments default to localhost collector if available.
    const exporter = new OTLPTraceExporter({ url: 'http://localhost:4318/v1/traces' });
    provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  }

  provider.register();
  initialized = true;
  logger?.info?.(
    {
      component: 'tracing',
      endpoint: endpoint ?? 'http://localhost:4318/v1/traces',
    },
    'OpenTelemetry tracing initialised',
  );

  return provider;
}

export async function shutdownTracing({ logger = console } = {}) {
  if (!provider) {
    return;
  }
  try {
    await provider.shutdown();
    logger?.info?.({ component: 'tracing' }, 'Tracing provider shut down');
  } catch (error) {
    logger?.warn?.({ err: error }, 'Failed to shut down tracing provider cleanly');
  } finally {
    provider = null;
    initialized = false;
  }
}

export default {
  initializeTracing,
  shutdownTracing,
};
