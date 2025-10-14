import pino from 'pino';

const redactPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["set-cookie"]',
  'res.headers["set-cookie"]',
];

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  name: 'gigvora-api',
  redact: {
    paths: redactPaths,
    remove: true,
  },
  base: {
    env: process.env.NODE_ENV ?? 'development',
    service: 'gigvora-backend',
  },
});

export default logger;
