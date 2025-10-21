import { randomUUID } from 'node:crypto';
import {
  getRuntimeConfig,
  onRuntimeConfigChange,
} from '../config/runtimeConfig.js';

const DEFAULT_HEADER = 'x-request-id';
const MIN_CORRELATION_ID_LENGTH = 16;
const MAX_CORRELATION_ID_LENGTH = 128;
const CORRELATION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

let activeHeaderName = DEFAULT_HEADER;
let acceptInboundIds = false;

function isValidCorrelationId(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();
  if (trimmed.length < MIN_CORRELATION_ID_LENGTH || trimmed.length > MAX_CORRELATION_ID_LENGTH) {
    return false;
  }

  if (trimmed.includes('\n') || trimmed.includes('\r')) {
    return false;
  }

  if (!CORRELATION_ID_PATTERN.test(trimmed)) {
    return false;
  }

  return true;
}

function resolveInboundId(req, headerName) {
  const headerValue = req.headers?.[headerName];
  if (!isValidCorrelationId(headerValue)) {
    return null;
  }
  return headerValue.trim();
}

function applyConfig(config) {
  if (!config) {
    return;
  }
  const headerName = config.observability?.correlation?.headerName;
  if (typeof headerName === 'string' && headerName.trim().length) {
    activeHeaderName = headerName.trim().toLowerCase();
  } else {
    activeHeaderName = DEFAULT_HEADER;
  }
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
