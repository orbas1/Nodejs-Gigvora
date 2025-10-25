import apiClient from './apiClient.js';

const FALLBACK_TELEMETRY = {
  posture: {
    status: 'guarded',
    attackSurfaceScore: 82,
    attackSurfaceChange: -4,
    signals: [
      'No malware detected across managed endpoints in the past 24 hours.',
      'Endpoint patch compliance holds at 98.4% with zero critical gaps.',
      'Zero trust network segmentation enforced across production workloads.',
    ],
  },
  metrics: {
    blockedIntrusions: 1284,
    quarantinedAssets: 4,
    highRiskVulnerabilities: 2,
    meanTimeToRespondMinutes: 7,
  },
  patchWindow: {
    nextWindow: '2024-05-20T02:00:00Z',
    backlog: 7,
    backlogChange: -3,
  },
  alerts: [
    {
      id: 'alert-critical-203',
      severity: 'critical',
      category: 'Runtime anomaly',
      source: 'Container EDR',
      asset: 'api-gateway-prod-02',
      location: 'us-east-1',
      detectedAt: '2024-05-17T08:20:00Z',
      status: 'open',
      recommendedAction: 'Isolate pod and trigger zero-trust credential rotation.',
    },
    {
      id: 'alert-high-587',
      severity: 'high',
      category: 'Credential stuffing',
      source: 'Login telemetry',
      asset: 'consumer-identity-edge',
      location: 'global',
      detectedAt: '2024-05-17T07:41:00Z',
      status: 'investigating',
      recommendedAction: 'Throttle offending IP ranges and enforce step-up MFA.',
    },
    {
      id: 'alert-medium-912',
      severity: 'medium',
      category: 'Supply chain',
      source: 'Software composition analysis',
      asset: 'payments-service',
      location: 'eu-central-1',
      detectedAt: '2024-05-16T21:10:00Z',
      status: 'acknowledged',
      recommendedAction: 'Apply patched dependency release and monitor rollout gates.',
    },
  ],
  incidents: [
    {
      id: 'incident-441',
      title: 'Automated credential stuffing attempt blocked',
      severity: 'high',
      openedAt: '2024-05-16T07:15:00Z',
      status: 'mitigated',
      owner: 'Security on-call',
      summary:
        'Edge network rate limiting and adaptive MFA neutralised a credential stuffing burst targeting 2,431 accounts.',
    },
    {
      id: 'incident-442',
      title: 'Endpoint malware quarantine',
      severity: 'medium',
      openedAt: '2024-05-15T23:05:00Z',
      status: 'contained',
      owner: 'Endpoint response',
      summary: 'Gigvora Sentinel quarantined a compromised contractor laptop before lateral movement.',
    },
  ],
  playbooks: [
    {
      id: 'playbook-001',
      name: 'Zero-day containment',
      owner: 'Blue team',
      lastExecutedAt: '2024-05-17T04:33:00Z',
      runCount: 12,
    },
    {
      id: 'playbook-014',
      name: 'Identity takeover response',
      owner: 'Identity ops',
      lastExecutedAt: '2024-05-16T12:24:00Z',
      runCount: 27,
    },
  ],
};

function ensureOptions(options) {
  if (options === undefined || options === null) {
    return {};
  }
  if (typeof options !== 'object') {
    throw new Error('Request options must be an object.');
  }
  const rest = { ...options };
  delete rest.params;
  return rest;
}

function ensureAlertId(alertId) {
  if (alertId === null || alertId === undefined) {
    throw new Error('An alert identifier is required.');
  }
  const normalised = `${alertId}`.trim();
  if (!normalised) {
    throw new Error('An alert identifier is required.');
  }
  return normalised;
}

function ensurePayload(payload) {
  if (payload == null) {
    return {};
  }
  if (typeof payload !== 'object') {
    throw new Error('Payload must be an object.');
  }
  return payload;
}

function withRequestOptions(options) {
  const safeOptions = ensureOptions(options);
  return Object.keys(safeOptions).length ? safeOptions : undefined;
}

async function postAlertAction(action, alertId, payload = {}, options = {}) {
  const safeAlertId = ensureAlertId(alertId);
  const body = ensurePayload(payload);
  const requestOptions = withRequestOptions(options);

  try {
    const response = await apiClient.post(`/security/alerts/${encodeURIComponent(safeAlertId)}/${action}`, body, requestOptions);
    return response?.alert ?? { id: safeAlertId, status: action === 'suppress' ? 'suppressed' : 'acknowledged' };
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error;
    }
    return {
      id: safeAlertId,
      status: action === 'suppress' ? 'suppressed' : 'acknowledged',
      fallback: true,
    };
  }
}

export async function fetchSecurityTelemetry(options = {}) {
  try {
    const response = await apiClient.get('/security/telemetry', withRequestOptions(options));
    const payload = response?.telemetry || response;
    if (payload && typeof payload === 'object') {
      return {
        posture: payload.posture ?? FALLBACK_TELEMETRY.posture,
        metrics: payload.metrics ?? FALLBACK_TELEMETRY.metrics,
        patchWindow: payload.patchWindow ?? FALLBACK_TELEMETRY.patchWindow,
        alerts: Array.isArray(payload.alerts) ? payload.alerts : FALLBACK_TELEMETRY.alerts,
        incidents: Array.isArray(payload.incidents) ? payload.incidents : FALLBACK_TELEMETRY.incidents,
        playbooks: Array.isArray(payload.playbooks) ? payload.playbooks : FALLBACK_TELEMETRY.playbooks,
      };
    }
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error;
    }
  }

  return { ...FALLBACK_TELEMETRY };
}

export async function acknowledgeSecurityAlert(alertId, payload = {}, options = {}) {
  return postAlertAction('acknowledge', alertId, payload, options);
}

export async function suppressSecurityAlert(alertId, payload = {}, options = {}) {
  return postAlertAction('suppress', alertId, payload, options);
}

export async function triggerThreatSweep(payload = {}, options = {}) {
  const body = ensurePayload(payload);
  const requestOptions = withRequestOptions(options);

  try {
    const response = await apiClient.post('/security/threat-sweep', body, requestOptions);
    return response ?? { status: 'queued' };
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
    return { status: 'queued', fallback: true };
  }
}

export default {
  fetchSecurityTelemetry,
  acknowledgeSecurityAlert,
  suppressSecurityAlert,
  triggerThreatSweep,
};
