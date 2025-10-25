import { apiClient } from './apiClient.js';

const RBAC_BASE_PATH = '/admin/governance/rbac';
const MAX_PAGE_LIMIT = 200;

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

function ensureIdentifier(name, value) {
  if (value === null || value === undefined) {
    throw new Error(`${name} is required.`);
  }
  const normalised = `${value}`.trim();
  if (!normalised) {
    throw new Error(`${name} is required.`);
  }
  return normalised;
}

function ensurePayload(payload) {
  if (payload == null || typeof payload !== 'object') {
    throw new Error('Payload must be provided as an object.');
  }
  return { ...payload };
}

function normaliseQuery(params = {}) {
  if (params === null || typeof params !== 'object') {
    throw new Error('Query parameters must be provided as an object.');
  }

  return Object.fromEntries(
    Object.entries(params)
      .map(([key, value]) => {
        if (value === undefined || value === null) {
          return [key, undefined];
        }

        if (typeof value === 'boolean') {
          return [key, value ? 'true' : 'false'];
        }

        if (typeof value === 'number') {
          if (!Number.isFinite(value)) {
            return [key, undefined];
          }
          if (/limit|pageSize/i.test(key)) {
            const bounded = Math.min(Math.max(Math.trunc(value), 1), MAX_PAGE_LIMIT);
            return [key, bounded];
          }
          if (/offset|page/i.test(key)) {
            const bounded = Math.max(0, Math.trunc(value));
            return [key, bounded];
          }
          return [key, Math.trunc(value)];
        }

        if (Array.isArray(value)) {
          const list = value.map((item) => `${item}`.trim()).filter(Boolean);
          return [key, list.length ? list.join(',') : undefined];
        }

        const trimmed = `${value}`.trim();
        if (!trimmed) {
          return [key, undefined];
        }
        return [key, trimmed];
      })
      .filter(([, value]) => value !== undefined),
  );
}

function buildGetOptions(params, options) {
  const safeOptions = ensureOptions(options);
  const { signal, ...rest } = safeOptions;
  const requestOptions = {
    params: normaliseQuery(params),
    ...rest,
  };
  if (signal) {
    requestOptions.signal = signal;
  }
  return requestOptions;
}

function ensureDecisionPayload(payload) {
  const body = ensurePayload(payload);
  const resource = ensureIdentifier('resource', body.resource);
  const action = ensureIdentifier('action', body.action);

  const decision = {
    ...body,
    resource,
    action,
  };

  if (decision.subject !== undefined && decision.subject !== null) {
    const subject = `${decision.subject}`.trim();
    if (!subject) {
      delete decision.subject;
    } else {
      decision.subject = subject;
    }
  }

  if (decision.context !== undefined && decision.context !== null && typeof decision.context !== 'object') {
    throw new Error('context must be an object when provided.');
  }

  if (Array.isArray(decision.roles)) {
    decision.roles = decision.roles
      .map((role) => {
        if (role === null || role === undefined) {
          return null;
        }
        const normalised = `${role}`.trim();
        return normalised.length ? normalised : null;
      })
      .filter((role) => role);
  }

  return decision;
}

export async function fetchRbacMatrix(params = {}, options = {}) {
  const response = await apiClient.get(`${RBAC_BASE_PATH}/matrix`, buildGetOptions(params, options));
  return {
    version: response?.version ?? null,
    publishedAt: response?.publishedAt ?? null,
    reviewCadenceDays: response?.reviewCadenceDays ?? null,
    personas: Array.isArray(response?.personas) ? response.personas : [],
    guardrails: Array.isArray(response?.guardrails) ? response.guardrails : [],
    resources: Array.isArray(response?.resources) ? response.resources : [],
  };
}

export async function fetchRbacAuditEvents(params = {}, options = {}) {
  const response = await apiClient.get(`${RBAC_BASE_PATH}/audit-events`, buildGetOptions(params, options));
  const total = Number(response?.total);
  const limit = Number(response?.limit);
  const offset = Number(response?.offset);
  return {
    total: Number.isFinite(total) ? total : 0,
    limit: Number.isFinite(limit) ? limit : 25,
    offset: Number.isFinite(offset) ? offset : 0,
    events: Array.isArray(response?.events) ? response.events : [],
  };
}

export async function simulateRbacDecision(payload = {}, options = {}) {
  const requestOptions = ensureOptions(options);
  const body = ensureDecisionPayload(payload);
  return apiClient.post(
    `${RBAC_BASE_PATH}/simulate`,
    body,
    Object.keys(requestOptions).length ? requestOptions : undefined,
  );
}

export default {
  fetchRbacMatrix,
  fetchRbacAuditEvents,
  simulateRbacDecision,
};
