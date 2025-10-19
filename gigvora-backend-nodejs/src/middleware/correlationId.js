import { randomUUID } from 'node:crypto';
import {
  getRuntimeConfig,
  onRuntimeConfigChange,
} from '../config/runtimeConfig.js';

const DEFAULT_HEADER = 'x-request-id';

let activeHeaderName = DEFAULT_HEADER;
let acceptInboundIds = false;

function resolveInboundId(req, headerName) {
  const headerValue = req.headers[headerName] ?? req.headers[headerName.toLowerCase()];
  if (typeof headerValue !== 'string') {
    return null;
  }
  const trimmed = headerValue.trim();
  if (trimmed.length < 16) {
    return null;
  }
  return trimmed;
}

function applyConfig(config) {
  if (!config) {
    return;
  }
  const headerName = config.observability?.correlation?.headerName || DEFAULT_HEADER;
  activeHeaderName = headerName.toLowerCase();
  acceptInboundIds = Boolean(config.observability?.correlation?.acceptIncomingHeader);
}

applyConfig(getRuntimeConfig());

onRuntimeConfigChange(({ config }) => {
  applyConfig(config);
});

export default function correlationIdMiddleware() {
  return function correlationIdHandler(req, res, next) {
    const inboundId = acceptInboundIds ? resolveInboundId(req, activeHeaderName) : null;
    const requestId = inboundId ?? randomUUID();

    req.id = requestId;
    req.correlationId = requestId;
    if (inboundId && inboundId !== requestId) {
      req.parentCorrelationId = inboundId;
    }
    res.setHeader('X-Request-Id', requestId);

    next();
  };
}
