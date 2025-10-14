import { randomUUID } from 'node:crypto';

const DEFAULT_HEADER = 'x-request-id';

export default function correlationIdMiddleware({ headerName = DEFAULT_HEADER } = {}) {
  return function correlationIdHandler(req, res, next) {
    const inboundId = req.headers[headerName] || req.headers[headerName.toLowerCase()];
    const requestId = typeof inboundId === 'string' && inboundId.trim().length > 0 ? inboundId.trim() : randomUUID();

    req.id = requestId;
    req.correlationId = requestId;
    res.setHeader('X-Request-Id', requestId);

    next();
  };
}
