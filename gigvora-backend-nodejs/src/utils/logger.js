import pino from 'pino';
import {
  getRuntimeConfig,
  onRuntimeConfigChange,
  whenRuntimeConfigReady,
} from '../config/runtimeConfig.js';

const fallbackConfig = {
  env: process.env.NODE_ENV ?? 'development',
  serviceName: process.env.SERVICE_NAME || 'gigvora-backend',
  logging: {
    level: (process.env.LOG_LEVEL || 'info').toLowerCase(),
    redact: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["set-cookie"]',
      'res.headers["set-cookie"]',
    ],
  },
};

function resolveInitialConfig() {
  const config = getRuntimeConfig();
  if (!config) {
    return fallbackConfig;
  }
  return config;
}

const initialConfig = resolveInitialConfig();

const baseLogger = pino({
  level: initialConfig.logging.level ?? fallbackConfig.logging.level,
  name: initialConfig.serviceName ?? fallbackConfig.serviceName,
  redact: {
    paths: initialConfig.logging.redact ?? fallbackConfig.logging.redact,
    remove: true,
  },
  base: {
    env: initialConfig.env ?? fallbackConfig.env,
    service: initialConfig.serviceName ?? fallbackConfig.serviceName,
  },
  messageKey: 'message',
  formatters: {
    level(label) {
      return { level: label };
    },
    log(object) {
      if (object.req?.id && !object.requestId) {
        return { ...object, requestId: object.req.id };
      }
      return object;
    },
  },
});

function applyConfig(config) {
  if (!config) {
    return;
  }
  if (config.logging?.level && baseLogger.level !== config.logging.level) {
    baseLogger.level = config.logging.level;
  }
  if (Array.isArray(config.logging?.redact)) {
    baseLogger.redact = {
      paths: config.logging.redact,
      remove: true,
    };
  }
}

whenRuntimeConfigReady()
  .then((config) => {
    applyConfig(config);
  })
  .catch((error) => {
    baseLogger.warn({ err: error }, 'Failed to apply runtime configuration to logger');
  });

onRuntimeConfigChange(({ config }) => {
  applyConfig(config);
});

export default baseLogger;
