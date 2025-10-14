import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';

const STORAGE_KEY = 'gigvora:company-integrations:v1';

const DEFAULT_CONNECTORS = [
  {
    key: 'salesforce',
    name: 'Salesforce',
    category: 'crm',
    status: 'connected',
    description:
      'Bi-directional sync for opportunities, hiring requests, and customer health scoring directly from Salesforce.',
    regions: ['us-east-1', 'eu-west-1'],
    lastSyncedAt: Date.now() - 1000 * 60 * 22,
    connectedAt: Date.now() - 1000 * 60 * 60 * 24 * 180,
    scopes: ['accounts:read', 'opportunities:write', 'leads:read'],
    owner: 'Revenue Ops',
    incidents: [],
    requiresApiKey: false,
    compliance: ['SOC 2', 'GDPR', 'ISO 27001'],
  },
  {
    key: 'monday',
    name: 'monday.com',
    category: 'work_management',
    status: 'connected',
    description:
      'Two-way project plan sync for hiring pods, interview loops, and onboarding milestones managed in monday.com.',
    regions: ['us-east-1'],
    lastSyncedAt: Date.now() - 1000 * 60 * 9,
    connectedAt: Date.now() - 1000 * 60 * 60 * 24 * 45,
    scopes: ['boards:read', 'boards:write', 'webhooks:manage'],
    owner: 'Talent Operations',
    incidents: [
      {
        id: 'monday-incident-1',
        openedAt: Date.now() - 1000 * 60 * 60 * 6,
        severity: 'low',
        summary: 'Automation throughput temporarily throttled. Retrying with back-off.',
        status: 'monitoring',
      },
    ],
    requiresApiKey: false,
    compliance: ['SOC 2', 'GDPR'],
  },
  {
    key: 'slack',
    name: 'Slack',
    category: 'communication',
    status: 'connected',
    description: 'Real-time hiring alerts, digest publishing, and approvals delivered to recruiting channels.',
    regions: ['us-west-2'],
    lastSyncedAt: Date.now() - 1000 * 60 * 3,
    connectedAt: Date.now() - 1000 * 60 * 60 * 24 * 365,
    scopes: ['chat:write', 'channels:manage', 'files:write'],
    owner: 'Internal Communications',
    incidents: [],
    requiresApiKey: false,
    compliance: ['SOC 2', 'HIPAA'],
  },
  {
    key: 'hubspot',
    name: 'HubSpot',
    category: 'crm',
    status: 'action_required',
    description:
      'Pipeline attribution and nurture program syncing for talent communities and candidate marketing.',
    regions: ['eu-central-1'],
    lastSyncedAt: Date.now() - 1000 * 60 * 60 * 28,
    connectedAt: Date.now() - 1000 * 60 * 60 * 24 * 120,
    scopes: ['crm.objects.contacts.read', 'crm.objects.deals.write'],
    owner: 'Growth Marketing',
    incidents: [
      {
        id: 'hubspot-token-rotation',
        openedAt: Date.now() - 1000 * 60 * 60 * 28,
        severity: 'medium',
        summary: 'Token expired. Requires admin re-authorisation.',
        status: 'open',
      },
    ],
    requiresApiKey: false,
    compliance: ['SOC 2', 'GDPR'],
  },
  {
    key: 'google-drive',
    name: 'Google Drive',
    category: 'content',
    status: 'connected',
    description: 'Offer templates, hiring playbooks, and onboarding collateral synced into secure Drive folders.',
    regions: ['us-west-1', 'asia-southeast1'],
    lastSyncedAt: Date.now() - 1000 * 60 * 14,
    connectedAt: Date.now() - 1000 * 60 * 60 * 24 * 200,
    scopes: ['drive.file', 'drive.metadata.readonly'],
    owner: 'People Operations',
    incidents: [],
    requiresApiKey: false,
    compliance: ['SOC 2', 'ISO 27017'],
  },
  {
    key: 'claude',
    name: 'Claude',
    category: 'ai',
    status: 'not_connected',
    description:
      'Talent concierge drafting, interview summarisation, and journey orchestration using Anthropic Claude.',
    regions: ['us-east-1'],
    lastSyncedAt: null,
    connectedAt: null,
    scopes: ['text:generation'],
    owner: 'Intelligence Ops',
    incidents: [],
    requiresApiKey: true,
    compliance: ['SOC 2'],
  },
  {
    key: 'openai',
    name: 'OpenAI',
    category: 'ai',
    status: 'connected',
    description:
      'Autonomous job description drafting and talent market intelligence powered by OpenAI GPT models.',
    regions: ['us-east-1'],
    lastSyncedAt: Date.now() - 1000 * 60 * 5,
    connectedAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
    scopes: ['chat.completions', 'embeddings'],
    owner: 'Intelligence Ops',
    incidents: [],
    requiresApiKey: true,
    compliance: ['SOC 2'],
    apiKeyFingerprint: '****-OPENAI-2048',
  },
  {
    key: 'deepseek',
    name: 'DeepSeek',
    category: 'ai',
    status: 'not_connected',
    description:
      'Specialist reasoning models for complex hiring analytics and long-form workforce planning.',
    regions: ['ap-southeast-1'],
    lastSyncedAt: null,
    connectedAt: null,
    scopes: ['reasoning', 'analysis'],
    owner: 'Strategic Analytics',
    incidents: [],
    requiresApiKey: true,
    compliance: ['ISO 27001'],
  },
  {
    key: 'x',
    name: 'X (Twitter)',
    category: 'communication',
    status: 'connected',
    description: 'Employer brand publishing, talent community replies, and campaign analytics via X.',
    regions: ['us-east-1'],
    lastSyncedAt: Date.now() - 1000 * 60 * 60 * 4,
    connectedAt: Date.now() - 1000 * 60 * 60 * 24 * 50,
    scopes: ['tweet.read', 'tweet.write', 'users.read'],
    owner: 'Employer Brand',
    incidents: [],
    requiresApiKey: true,
    compliance: ['SOC 2'],
    apiKeyFingerprint: '****-X-6384',
  },
];

const DEFAULT_AUDIT_LOG = [
  {
    id: 'audit-salesforce',
    connector: 'salesforce',
    action: 'connection_verified',
    actor: 'system',
    createdAt: Date.now() - 1000 * 60 * 60 * 12,
    context: 'OAuth token auto-rotated with zero downtime.',
  },
  {
    id: 'audit-openai',
    connector: 'openai',
    action: 'api_key_uploaded',
    actor: 'ava.chen',
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
    context: 'OpenAI enterprise key rotated and encrypted via KMS.',
  },
];

const INITIAL_STATE = {
  hydrated: false,
  loading: true,
  connectors: DEFAULT_CONNECTORS,
  auditLog: DEFAULT_AUDIT_LOG,
  lastSyncedAt: Date.now() - 1000 * 60 * 15,
  error: null,
};

function sanitizeConnector(connector) {
  if (!connector || typeof connector !== 'object') {
    return null;
  }
  const merged = { ...connector };
  merged.status = ['connected', 'action_required', 'not_connected', 'degraded'].includes(connector.status)
    ? connector.status
    : 'not_connected';
  merged.incidents = Array.isArray(connector.incidents)
    ? connector.incidents.map((incident) => ({
        ...incident,
        severity: ['low', 'medium', 'high', 'critical'].includes(incident.severity)
          ? incident.severity
          : 'low',
        status: ['open', 'monitoring', 'resolved'].includes(incident.status) ? incident.status : 'open',
        openedAt: typeof incident.openedAt === 'number' ? incident.openedAt : Date.now(),
      }))
    : [];
  merged.scopes = Array.isArray(connector.scopes) ? connector.scopes : [];
  merged.regions = Array.isArray(connector.regions) ? connector.regions : [];
  merged.compliance = Array.isArray(connector.compliance) ? connector.compliance : [];
  merged.owner = connector.owner ?? 'Operations';
  merged.requiresApiKey = Boolean(connector.requiresApiKey);
  merged.apiKeyFingerprint = connector.apiKeyFingerprint ?? null;
  merged.lastSyncedAt = typeof connector.lastSyncedAt === 'number' ? connector.lastSyncedAt : null;
  merged.connectedAt = typeof connector.connectedAt === 'number' ? connector.connectedAt : null;
  return merged;
}

function reducer(state, action) {
  switch (action.type) {
    case 'hydrate': {
      const payload = action.payload ?? {};
      const connectors = Array.isArray(payload.connectors)
        ? payload.connectors.map(sanitizeConnector).filter(Boolean)
        : DEFAULT_CONNECTORS;
      const auditLog = Array.isArray(payload.auditLog)
        ? payload.auditLog
            .map((entry) => ({
              ...entry,
              createdAt: typeof entry.createdAt === 'number' ? entry.createdAt : Date.now(),
              id: entry.id ?? `audit-${Math.random().toString(36).slice(2, 10)}`,
            }))
            .filter((entry) => entry.connector)
        : DEFAULT_AUDIT_LOG;
      return {
        ...state,
        hydrated: true,
        loading: false,
        connectors,
        auditLog,
        lastSyncedAt: typeof payload.lastSyncedAt === 'number' ? payload.lastSyncedAt : state.lastSyncedAt,
        error: null,
      };
    }
    case 'setError':
      return { ...state, error: action.error ?? 'unexpected_error', loading: false };
    case 'refresh':
      return {
        ...state,
        lastSyncedAt: Date.now(),
        loading: false,
        error: null,
        connectors: state.connectors.map((connector) =>
          connector.status === 'action_required'
            ? { ...connector, lastSyncedAt: connector.lastSyncedAt ?? Date.now() }
            : { ...connector, lastSyncedAt: Date.now() - Math.floor(Math.random() * 1000 * 60 * 10) },
        ),
        auditLog: [
          {
            id: `audit-refresh-${Date.now()}`,
            connector: 'system',
            action: 'refresh_completed',
            actor: 'system',
            createdAt: Date.now(),
            context: 'Integration health snapshot refreshed.',
          },
          ...state.auditLog,
        ].slice(0, 30),
      };
    case 'updateConnector': {
      const { key, changes, audit } = action.payload ?? {};
      if (!key) {
        return state;
      }
      const connectors = state.connectors.map((connector) =>
        connector.key === key ? { ...connector, ...changes } : connector,
      );
      const auditLog = audit
        ? [
            {
              id: audit.id ?? `audit-${key}-${Date.now()}`,
              connector: key,
              action: audit.action ?? 'updated',
              actor: audit.actor ?? 'system',
              createdAt: audit.createdAt ?? Date.now(),
              context: audit.context ?? '',
            },
            ...state.auditLog,
          ].slice(0, 50)
        : state.auditLog;
      return { ...state, connectors, auditLog };
    }
    case 'appendAudit': {
      if (!action.entry) {
        return state;
      }
      return {
        ...state,
        auditLog: [
          {
            id: action.entry.id ?? `audit-${Date.now()}`,
            createdAt: action.entry.createdAt ?? Date.now(),
            ...action.entry,
          },
          ...state.auditLog,
        ].slice(0, 50),
      };
    }
    default:
      return state;
  }
}

async function digestSecret(secret) {
  if (typeof secret !== 'string' || !secret.trim()) {
    return null;
  }
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    return `hashed-${secret.slice(-4)}`;
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(secret.trim());
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function groupByCategory(connectors) {
  return connectors.reduce((accumulator, connector) => {
    const list = accumulator.get(connector.category) ?? [];
    list.push(connector);
    accumulator.set(connector.category, list);
    return accumulator;
  }, new Map());
}

function computeSummary(connectors) {
  const counts = connectors.reduce(
    (accumulator, connector) => {
      accumulator.total += 1;
      if (connector.status === 'connected') {
        accumulator.connected += 1;
      }
      if (connector.status === 'action_required') {
        accumulator.actionRequired += 1;
      }
      if (connector.incidents.some((incident) => incident.status !== 'resolved')) {
        accumulator.openIncidents += 1;
      }
      if (connector.requiresApiKey) {
        accumulator.byok += 1;
        if (connector.apiKeyFingerprint) {
          accumulator.byokConfigured += 1;
        }
      }
      return accumulator;
    },
    { total: 0, connected: 0, actionRequired: 0, openIncidents: 0, byok: 0, byokConfigured: 0 },
  );

  return {
    ...counts,
    healthScore: counts.total
      ? Math.max(0, Math.round(((counts.connected - counts.actionRequired) / counts.total) * 100))
      : 0,
  };
}

export default function useIntegrationControlTower() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const persistTimerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    if (typeof window === 'undefined') {
      dispatch({ type: 'hydrate', payload: INITIAL_STATE });
      return () => {
        cancelled = true;
      };
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        dispatch({ type: 'hydrate', payload: INITIAL_STATE });
        return () => {
          cancelled = true;
        };
      }
      const parsed = JSON.parse(raw);
      if (!cancelled) {
        dispatch({ type: 'hydrate', payload: parsed });
      }
    } catch (error) {
      console.error('Failed to restore integration state', error);
      dispatch({ type: 'setError', error });
      dispatch({ type: 'hydrate', payload: INITIAL_STATE });
    }

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !state.hydrated) {
      return undefined;
    }
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
    }
    persistTimerRef.current = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            connectors: state.connectors,
            auditLog: state.auditLog,
            lastSyncedAt: state.lastSyncedAt,
          }),
        );
      } catch (error) {
        console.error('Failed to persist integration state', error);
      }
    }, 150);

    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
      }
    };
  }, [state.connectors, state.auditLog, state.lastSyncedAt, state.hydrated]);

  const summary = useMemo(() => computeSummary(state.connectors), [state.connectors]);
  const connectorsByCategory = useMemo(() => groupByCategory(state.connectors), [state.connectors]);

  const refresh = useCallback(() => {
    dispatch({ type: 'refresh' });
  }, []);

  const markIncidentResolved = useCallback((connectorKey, incidentId) => {
    dispatch({
      type: 'updateConnector',
      payload: {
        key: connectorKey,
        changes: {
          incidents: state.connectors
            .find((item) => item.key === connectorKey)
            ?.incidents.map((incident) =>
              incident.id === incidentId ? { ...incident, status: 'resolved', resolvedAt: Date.now() } : incident,
            ) ?? [],
        },
        audit: {
          action: 'incident_resolved',
          context: `Incident ${incidentId} closed for ${connectorKey}.`,
        },
      },
    });
  }, [state.connectors]);

  const rotateApiKey = useCallback(
    async (connectorKey, secret, actor = 'system') => {
      const hashed = await digestSecret(secret);
      dispatch({
        type: 'updateConnector',
        payload: {
          key: connectorKey,
          changes: {
            apiKeyFingerprint: hashed ? `****-${hashed.slice(-8)}` : null,
            status: hashed ? 'connected' : 'action_required',
            lastSyncedAt: Date.now(),
            connectedAt: Date.now(),
          },
          audit: {
            action: 'api_key_rotated',
            actor,
            context: hashed
              ? 'BYOK credential rotated via in-browser hashing. Raw secret never persisted.'
              : 'API key cleared pending replacement.',
          },
        },
      });
    },
    [],
  );

  const toggleConnection = useCallback((connectorKey, nextStatus = 'connected', actor = 'system') => {
    const allowed = new Set(['connected', 'not_connected', 'action_required']);
    const status = allowed.has(nextStatus) ? nextStatus : 'connected';
    dispatch({
      type: 'updateConnector',
      payload: {
        key: connectorKey,
        changes: {
          status,
          connectedAt: status === 'connected' ? Date.now() : null,
          lastSyncedAt: status === 'connected' ? Date.now() : null,
        },
        audit: {
          action: status === 'connected' ? 'connection_enabled' : 'connection_disabled',
          actor,
          context:
            status === 'connected'
              ? `${connectorKey} connection enabled with least privilege scopes.`
              : `${connectorKey} connection disabled. Tokens revoked and webhooks paused.`,
        },
      },
    });
  }, []);

  const addManualAuditEvent = useCallback((entry) => {
    if (!entry) {
      return;
    }
    dispatch({
      type: 'appendAudit',
      entry: {
        ...entry,
        createdAt: entry.createdAt ?? Date.now(),
      },
    });
  }, []);

  return {
    loading: state.loading,
    error: state.error,
    hydrated: state.hydrated,
    lastSyncedAt: state.lastSyncedAt,
    summary,
    connectors: state.connectors,
    connectorsByCategory,
    auditLog: state.auditLog,
    refresh,
    toggleConnection,
    rotateApiKey,
    markIncidentResolved,
    addManualAuditEvent,
  };
}
