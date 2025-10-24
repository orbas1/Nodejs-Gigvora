import { queueNotification } from '../services/notificationService.js';
import logger from '../utils/logger.js';

const ALERT_THROTTLE_MS = 5 * 60 * 1000;

const lastAlertDispatchedAt = new Map();

function shouldDispatch(key, now = Date.now()) {
  const last = lastAlertDispatchedAt.get(key) ?? 0;
  if (now - last < ALERT_THROTTLE_MS) {
    return false;
  }
  lastAlertDispatchedAt.set(key, now);
  return true;
}

async function dispatchAlert({ title, body, severity = 'critical', meta = {} }) {
  try {
    await queueNotification(
      {
        title,
        body,
        category: 'ops_incident',
        priority: severity === 'critical' ? 'high' : 'normal',
        metadata: { ...meta, severity },
      },
      { bypassQuietHours: severity === 'critical' },
    );
  } catch (error) {
    logger.error({ err: error }, 'Failed to enqueue observability automation alert');
  }
}

export async function evaluateAndSendAlerts(metricsStatus, { now = Date.now() } = {}) {
  if (!metricsStatus) {
    return;
  }

  if (metricsStatus.stale && shouldDispatch('metrics.stale', now)) {
    await dispatchAlert({
      title: 'Prometheus scrape stale',
      body: `Metrics endpoint has not been scraped for ${metricsStatus.secondsSinceLastScrape ?? 'unknown'} seconds.`,
      severity: 'critical',
      meta: { secondsSinceLastScrape: metricsStatus.secondsSinceLastScrape },
    });
  }

  if (metricsStatus.rateLimit?.blockedRatio > 0.5 && shouldDispatch('metrics.rateLimit.blocked', now)) {
    await dispatchAlert({
      title: 'Rate limit blocking surge detected',
      body: `More than half of the requests in the active window were blocked (${metricsStatus.rateLimit.blockedRatio}).`,
      severity: 'warning',
      meta: metricsStatus.rateLimit,
    });
  }

  if (metricsStatus.waf?.autoBlockEvents > 5 && shouldDispatch('metrics.waf.autoblock', now)) {
    await dispatchAlert({
      title: 'WAF auto-block escalation',
      body: `The web application firewall escalated ${metricsStatus.waf.autoBlockEvents} auto-block events this window.`,
      severity: 'warning',
      meta: metricsStatus.waf,
    });
  }

  const queueMetrics = metricsStatus.workerQueues?.profileEngagement;
  if (queueMetrics && queueMetrics.pending > 250 && shouldDispatch('metrics.queue.profileEngagement.backlog', now)) {
    await dispatchAlert({
      title: 'Profile engagement queue backlog',
      body: `Profile engagement queue backlog reached ${queueMetrics.pending} pending jobs. Oldest scheduled job at ${queueMetrics.nextScheduledAt ?? 'unknown'}.`,
      severity: 'warning',
      meta: queueMetrics,
    });
  }
}

export default {
  evaluateAndSendAlerts,
};
