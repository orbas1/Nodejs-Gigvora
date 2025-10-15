import os from 'node:os';
import { getReadinessReport, getLivenessReport } from './healthService.js';
import { getRateLimitSnapshot } from '../observability/rateLimitMetrics.js';

function getEnvironmentSnapshot() {
  const memory = process.memoryUsage();
  const loadAverages = os.loadavg();
  return {
    nodeEnv: process.env.NODE_ENV ?? null,
    releaseId: process.env.APP_RELEASE ?? null,
    region: process.env.APP_REGION ?? null,
    commit: process.env.APP_COMMIT_SHA ?? null,
    version: process.env.APP_VERSION ?? null,
    uptimeSeconds: process.uptime(),
    memory: {
      rss: memory.rss,
      heapUsed: memory.heapUsed,
      heapTotal: memory.heapTotal,
      external: memory.external,
    },
    system: {
      platform: process.platform,
      arch: process.arch,
      loadAverage: Array.isArray(loadAverages) ? loadAverages.slice(0, 3) : [],
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpuCount: os.cpus()?.length ?? null,
    },
  };
}

export async function getRuntimeOperationalSnapshot() {
  const [readiness, liveness] = await Promise.all([getReadinessReport(), Promise.resolve(getLivenessReport())]);

  return {
    generatedAt: new Date().toISOString(),
    environment: getEnvironmentSnapshot(),
    readiness,
    liveness,
    rateLimit: getRateLimitSnapshot(),
  };
}

export default {
  getRuntimeOperationalSnapshot,
};

