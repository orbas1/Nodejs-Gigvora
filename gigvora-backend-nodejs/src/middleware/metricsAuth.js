import {
  getRuntimeConfig,
  onRuntimeConfigChange,
} from '../config/runtimeConfig.js';

let metricsEnabled = true;
let metricsToken = null;

function applyConfig(config) {
  if (!config) {
    metricsEnabled = false;
    metricsToken = null;
    return;
  }
  metricsEnabled = Boolean(config.security?.metrics?.enabled);
  metricsToken = config.security?.metrics?.token ?? null;
  if (metricsEnabled && !metricsToken) {
    // When no token is defined we hard-disable to avoid exposing metrics unintentionally.
    metricsEnabled = false;
  }
}

applyConfig(getRuntimeConfig());

onRuntimeConfigChange(({ config }) => {
  applyConfig(config);
});

function extractBearerToken(headerValue) {
  if (!headerValue || typeof headerValue !== 'string') {
    return null;
  }
  const [scheme, token] = headerValue.split(' ');
  if (!scheme || !token) {
    return null;
  }
  if (scheme.toLowerCase() !== 'bearer') {
    return null;
  }
  return token.trim();
}

export default function metricsAuth() {
  return function metricsAuthMiddleware(req, res, next) {
    if (!metricsEnabled) {
      res.status(404).json({ message: 'Metrics endpoint is disabled.', requestId: req.id ?? null });
      return;
    }

    const token = extractBearerToken(req.get('authorization'));
    if (!token) {
      res.status(401).json({ message: 'Metrics authentication required.', requestId: req.id ?? null });
      return;
    }

    if (token !== metricsToken) {
      res.status(403).json({ message: 'Invalid metrics authentication token.', requestId: req.id ?? null });
      return;
    }

    next();
  };
}
