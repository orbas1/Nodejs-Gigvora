import fs from 'node:fs/promises';
import path from 'node:path';
import fetch from 'node-fetch';

import {
  DEFAULT_WORKSPACES,
  createDefaultEvents,
  normaliseEventFixtures,
} from '../../../calendar_stub/fixtures.mjs';
import logger from '../utils/logger.js';

const DEFAULT_TIMEOUT_MS = 2000;
const DEFAULT_SCENARIOS = ['rate-limit', 'forbidden', 'server-error'];
const DEFAULT_SCENARIO_SUMMARIES = {
  'rate-limit': {
    label: 'Rate limit drill',
    description: 'Returns 429 responses after burst thresholds so teams can validate retry and backoff handling.',
    docsUrl: 'https://docs.gigvora.local/integrations/calendar-stub#rate-limits',
  },
  forbidden: {
    label: 'Access revoked',
    description: 'Simulates RBAC violations and suspended accounts to confirm entitlement experiences stay on-brand.',
    docsUrl: 'https://docs.gigvora.local/integrations/calendar-stub#access',
  },
  'server-error': {
    label: 'Server fault',
    description: 'Surface 5xx responses with structured diagnostics so operators can rehearse escalation paths.',
    docsUrl: 'https://docs.gigvora.local/integrations/calendar-stub#errors',
  },
};

const MAX_HEALTH_HISTORY_SAMPLES = 48;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DEFAULT_ALLOWED_METHODS = ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'];

function toInteger(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = Number.parseInt(`${value}`, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toList(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => `${entry}`.trim())
      .filter(Boolean);
  }
  return `${value}`
    .split(',')
    .map((entry) => `${entry}`.trim())
    .filter(Boolean);
}

async function loadJsonFile(filePath) {
  if (!filePath) {
    return null;
  }
  const trimmed = `${filePath}`.trim();
  if (!trimmed) {
    return null;
  }
  const resolvedPath = path.isAbsolute(trimmed)
    ? trimmed
    : path.resolve(process.cwd(), trimmed);
  try {
    const raw = await fs.readFile(resolvedPath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    logger.warn({ err: error, filePath: resolvedPath }, 'Failed to load stub environment JSON file');
    return null;
  }
}

async function loadWorkspaceCatalog(workspacesFile) {
  const workspaceSource = await loadJsonFile(workspacesFile);
  if (Array.isArray(workspaceSource) && workspaceSource.length) {
    return workspaceSource
      .map((workspace) => ({
        id: toInteger(workspace.id, null),
        slug: workspace.slug ? `${workspace.slug}`.trim() : null,
        name: workspace.name ? `${workspace.name}`.trim() : null,
        timezone: workspace.timezone ? `${workspace.timezone}`.trim() : 'UTC',
        defaultCurrency: workspace.defaultCurrency ? `${workspace.defaultCurrency}`.trim() : 'USD',
        membershipRole: workspace.membershipRole ? `${workspace.membershipRole}`.trim() : 'admin',
      }))
      .filter((workspace) => Number.isFinite(workspace.id) && workspace.name);
  }
  return DEFAULT_WORKSPACES;
}

async function loadEventFixtures(eventsFile) {
  const dataset = await loadJsonFile(eventsFile);
  if (Array.isArray(dataset) && dataset.length) {
    return normaliseEventFixtures(dataset, { allowEmpty: false });
  }
  return createDefaultEvents(Date.now());
}

async function loadScenarioCatalog(scenariosFile) {
  const catalog = await loadJsonFile(scenariosFile);
  if (!catalog) {
    return [];
  }

  const entries = Array.isArray(catalog?.scenarios) ? catalog.scenarios : catalog;
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }
      const id = entry.id ? `${entry.id}`.trim().toLowerCase() : null;
      if (!id) {
        return null;
      }
      return {
        id,
        label: entry.label ? `${entry.label}`.trim() : null,
        description: entry.description ? `${entry.description}`.trim() : null,
        docsUrl: entry.docsUrl ? `${entry.docsUrl}`.trim() : null,
      };
    })
    .filter(Boolean);
}

function resolveHostForDisplay(hostname) {
  if (!hostname) {
    return 'localhost';
  }
  const trimmed = `${hostname}`.trim();
  if (!trimmed || trimmed === '0.0.0.0' || trimmed === '::') {
    return 'localhost';
  }
  return trimmed;
}

function buildBaseUrl({ host, port }) {
  const displayHost = resolveHostForDisplay(host);
  return `http://${displayHost}:${port}`;
}

async function checkHealth(url, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  const startedAt = Date.now();
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    const elapsed = Date.now() - startedAt;
    if (!response.ok) {
      return {
        status: 'offline',
        latencyMs: elapsed,
        checkedAt: new Date().toISOString(),
        error: `Health responded with status ${response.status}`,
      };
    }
    let body = null;
    try {
      body = await response.json();
    } catch (parseError) {
      body = null;
    }
    return {
      status: 'online',
      latencyMs: elapsed,
      checkedAt: new Date().toISOString(),
      details: body,
    };
  } catch (error) {
    return {
      status: 'offline',
      latencyMs: null,
      checkedAt: new Date().toISOString(),
      error: error?.message ?? 'Health check failed',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function resolveScenarioList(extraScenarios) {
  const merged = [...DEFAULT_SCENARIOS, ...toList(extraScenarios)];
  return Array.from(new Set(merged.map((scenario) => scenario.toLowerCase())));
}

function buildScenarioSummaries(scenarios, catalogEntries = []) {
  if (!Array.isArray(scenarios) || scenarios.length === 0) {
    return [];
  }

  const catalog = new Map();
  catalogEntries.forEach((entry) => {
    if (entry?.id) {
      catalog.set(entry.id, entry);
    }
  });

  return scenarios.map((scenario) => {
    const id = `${scenario}`.trim().toLowerCase();
    const overrides = catalog.get(id) ?? null;
    const defaults = DEFAULT_SCENARIO_SUMMARIES[id] ?? null;
    return {
      id,
      label: overrides?.label ?? defaults?.label ?? id,
      description: overrides?.description ?? defaults?.description ?? 'Custom stub scenario for integration rehearsal.',
      docsUrl: overrides?.docsUrl ?? defaults?.docsUrl ?? null,
    };
  });
}

function normaliseHealthEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }
  const status = entry.status ? `${entry.status}`.trim().toLowerCase() : 'unknown';
  const checkedAt = entry.checkedAt ? new Date(entry.checkedAt) : null;
  const latency = Number.isFinite(Number(entry.latencyMs)) ? Number(entry.latencyMs) : null;
  if (!checkedAt || Number.isNaN(checkedAt.getTime())) {
    return {
      status,
      latencyMs: latency,
      checkedAt: null,
    };
  }
  return {
    status,
    latencyMs: latency,
    checkedAt: checkedAt.toISOString(),
  };
}

async function loadHealthHistory(healthLogFile) {
  const historySource = await loadJsonFile(healthLogFile);
  if (!historySource) {
    return [];
  }
  const list = Array.isArray(historySource?.entries) ? historySource.entries : historySource;
  if (!Array.isArray(list)) {
    return [];
  }
  return list
    .map((entry) => normaliseHealthEntry(entry))
    .filter(Boolean)
    .sort((a, b) => {
      const aTime = a.checkedAt ? new Date(a.checkedAt).getTime() : 0;
      const bTime = b.checkedAt ? new Date(b.checkedAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, MAX_HEALTH_HISTORY_SAMPLES);
}

function computeLatencyStats(samples) {
  const values = samples
    .map((sample) => (Number.isFinite(sample.latencyMs) ? Number(sample.latencyMs) : null))
    .filter((value) => value != null);

  if (!values.length) {
    return { averageLatencyMs: null, p95LatencyMs: null };
  }

  const sum = values.reduce((total, value) => total + value, 0);
  const averageLatencyMs = Number((sum / values.length).toFixed(1));
  const sorted = values.slice().sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor(0.95 * (sorted.length - 1)));
  const p95LatencyMs = Math.round(sorted[index]);
  return { averageLatencyMs, p95LatencyMs };
}

function computeUptime(samples, now = Date.now()) {
  if (!samples.length) {
    return null;
  }
  const startThreshold = now - DAY_IN_MS;
  const relevant = samples.filter((sample) => {
    if (!sample.checkedAt) {
      return true;
    }
    const timestamp = new Date(sample.checkedAt).getTime();
    if (Number.isNaN(timestamp)) {
      return true;
    }
    return timestamp >= startThreshold;
  });

  const targetSamples = relevant.length ? relevant : samples;
  if (!targetSamples.length) {
    return null;
  }

  const upCount = targetSamples.filter((sample) => sample.status !== 'offline').length;
  const uptime = (upCount / targetSamples.length) * 100;
  return Number(uptime.toFixed(2));
}

function resolveLastIncident(samples) {
  const incident = samples.find((sample) => sample.status === 'offline' || sample.status === 'degraded');
  return incident?.checkedAt ?? null;
}

function buildObservability(samples, currentHealth) {
  const mergedSamples = [];
  if (currentHealth) {
    mergedSamples.push(normaliseHealthEntry({
      status: currentHealth.status,
      latencyMs: currentHealth.latencyMs,
      checkedAt: currentHealth.checkedAt,
    }));
  }
  if (Array.isArray(samples)) {
    mergedSamples.push(...samples);
  }
  const filtered = mergedSamples.filter(Boolean).sort((a, b) => {
    const aTime = a.checkedAt ? new Date(a.checkedAt).getTime() : 0;
    const bTime = b.checkedAt ? new Date(b.checkedAt).getTime() : 0;
    return bTime - aTime;
  });

  if (!filtered.length) {
    return {
      uptimeLast24h: null,
      averageLatencyMs: null,
      p95LatencyMs: null,
      sampleSize: 0,
      lastIncidentAt: null,
    };
  }

  const uptimeLast24h = computeUptime(filtered);
  const { averageLatencyMs, p95LatencyMs } = computeLatencyStats(filtered);
  const lastIncidentAt = resolveLastIncident(filtered);

  return {
    uptimeLast24h,
    averageLatencyMs,
    p95LatencyMs,
    sampleSize: filtered.length,
    lastIncidentAt,
  };
}

function buildWorkspaceHighlights(workspaces) {
  if (!Array.isArray(workspaces) || !workspaces.length) {
    return {
      preview: [],
      timezones: [],
      membershipRoles: [],
    };
  }

  const preview = workspaces
    .map((workspace) => workspace?.name)
    .filter(Boolean)
    .slice(0, 4);

  const timezones = Array.from(
    new Set(
      workspaces
        .map((workspace) => (workspace?.timezone ? `${workspace.timezone}`.trim() : null))
        .filter(Boolean),
    ),
  ).sort();

  const membershipRoles = Array.from(
    new Set(
      workspaces
        .map((workspace) => (workspace?.membershipRole ? `${workspace.membershipRole}`.trim() : null))
        .filter(Boolean),
    ),
  ).sort();

  return { preview, timezones, membershipRoles };
}

function buildEventInsights(events, workspaces) {
  if (!Array.isArray(events) || !events.length) {
    return {
      nextEvent: null,
      lastEvent: null,
      topEventTypes: [],
      workspaceDensity: [],
    };
  }

  const now = Date.now();
  const sorted = events
    .map((event) => ({
      ...event,
      startsAt: event.startsAt ? `${event.startsAt}` : null,
    }))
    .filter((event) => event.startsAt && !Number.isNaN(new Date(event.startsAt).getTime()))
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  const nextEvent = sorted.find((event) => new Date(event.startsAt).getTime() >= now) ?? null;
  const lastEvent = [...sorted].reverse().find((event) => new Date(event.startsAt).getTime() < now) ?? sorted.at(-1) ?? null;

  const typeCounts = new Map();
  events.forEach((event) => {
    const type = event.eventType ? `${event.eventType}`.trim().toLowerCase() : 'other';
    typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1);
  });

  const topEventTypes = Array.from(typeCounts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const workspaceCounts = new Map();
  events.forEach((event) => {
    if (!Number.isFinite(Number(event.workspaceId))) {
      return;
    }
    const id = Number(event.workspaceId);
    workspaceCounts.set(id, (workspaceCounts.get(id) ?? 0) + 1);
  });

  const workspaceLookup = new Map();
  if (Array.isArray(workspaces)) {
    workspaces.forEach((workspace) => {
      if (Number.isFinite(Number(workspace.id))) {
        workspaceLookup.set(Number(workspace.id), workspace.name ?? `Workspace ${workspace.id}`);
      }
    });
  }

  const workspaceDensity = Array.from(workspaceCounts.entries())
    .map(([workspaceId, count]) => ({
      workspaceId,
      count,
      name: workspaceLookup.get(workspaceId) ?? `Workspace ${workspaceId}`,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const toInsight = (event) =>
    event
      ? {
          title: event.title ?? 'Scheduled event',
          startsAt: event.startsAt,
          workspaceId: Number.isFinite(Number(event.workspaceId)) ? Number(event.workspaceId) : null,
          workspaceName:
            Number.isFinite(Number(event.workspaceId)) && workspaceLookup.has(Number(event.workspaceId))
              ? workspaceLookup.get(Number(event.workspaceId))
              : null,
        }
      : null;

  return {
    nextEvent: toInsight(nextEvent),
    lastEvent: toInsight(lastEvent),
    topEventTypes,
    workspaceDensity,
  };
}

export async function getStubEnvironmentCatalog({ includeHealth = true } = {}) {
  const host = process.env.CALENDAR_STUB_HOST || '0.0.0.0';
  const port = toInteger(process.env.CALENDAR_STUB_PORT, 4010);
  const allowedOrigins = toList(process.env.CALENDAR_STUB_ALLOWED_ORIGINS);
  const fallbackOrigin = process.env.CALENDAR_STUB_FALLBACK_ORIGIN || 'http://localhost:4173';
  const viewRoles = toList(process.env.CALENDAR_STUB_VIEW_ROLES || ['calendar:view', 'calendar:manage', 'platform:admin']);
  const manageRoles = toList(process.env.CALENDAR_STUB_MANAGE_ROLES || ['calendar:manage', 'platform:admin']);
  const minLatencyMs = toInteger(process.env.CALENDAR_STUB_MIN_LATENCY_MS, 0);
  const maxLatencyMs = toInteger(process.env.CALENDAR_STUB_MAX_LATENCY_MS, 0);
  const apiKeyConfigured = Boolean(process.env.CALENDAR_STUB_API_KEY && `${process.env.CALENDAR_STUB_API_KEY}`.trim());
  const workspaces = await loadWorkspaceCatalog(process.env.CALENDAR_STUB_WORKSPACES_FILE);
  const events = await loadEventFixtures(process.env.CALENDAR_STUB_EVENTS_FILE);
  const scenarioCatalog = await loadScenarioCatalog(process.env.CALENDAR_STUB_SCENARIO_DETAILS_FILE);

  const eventTypes = Array.from(
    new Set(
      events
        .map((event) => event.eventType || 'other')
        .filter((eventType) => typeof eventType === 'string' && eventType.trim().length > 0),
    ),
  ).sort();

  const baseUrl = buildBaseUrl({ host, port });
  const healthUrl = `${baseUrl}/health`;

  const health = includeHealth ? await checkHealth(healthUrl) : { status: 'unknown', checkedAt: null };
  const healthHistory = includeHealth
    ? await loadHealthHistory(process.env.CALENDAR_STUB_HEALTH_LOG_FILE)
    : [];

  const observability = includeHealth ? buildObservability(healthHistory, health) : null;
  const scenarioList = resolveScenarioList(process.env.CALENDAR_STUB_EXTRA_SCENARIOS);
  const scenarioDetails = buildScenarioSummaries(scenarioList, scenarioCatalog);
  const workspaceHighlights = buildWorkspaceHighlights(workspaces);
  const eventInsights = buildEventInsights(events, workspaces);

  const environments = [
    {
      id: 'calendar-local',
      name: 'Calendar Scheduling Stub',
      category: 'calendar',
      description:
        'Workspace-aware scheduling sandbox mirroring production RBAC, latency, and error scenarios for integration drills.',
      baseUrl,
      health,
      status: health.status,
      latency: {
        minMs: minLatencyMs,
        maxMs: maxLatencyMs,
        configurable: maxLatencyMs > 0 || minLatencyMs > 0,
      },
      workspaceCount: workspaces.length,
      eventCount: events.length,
      eventTypes,
      scenarios: scenarioList,
      allowedOrigins,
      fallbackOrigin,
      requiresApiKey: apiKeyConfigured,
      allowedMethods: DEFAULT_ALLOWED_METHODS,
      roles: {
        view: viewRoles,
        manage: manageRoles,
      },
      docsUrl: 'https://docs.gigvora.local/integrations/calendar-stub',
      datasetSource: process.env.CALENDAR_STUB_EVENTS_FILE ? 'custom-fixture' : 'default-dataset',
      workspaceSource: process.env.CALENDAR_STUB_WORKSPACES_FILE ? 'custom-catalog' : 'default-dataset',
      updatedAt: new Date().toISOString(),
      observability,
      healthHistory,
      scenarioDetails,
      workspaceHighlights,
      insights: {
        events: eventInsights,
        workspaces: {
          total: workspaces.length,
          preview: workspaceHighlights.preview,
          timezones: workspaceHighlights.timezones,
          membershipRoles: workspaceHighlights.membershipRoles,
        },
      },
    },
  ];

  return {
    environments,
    meta: {
      count: environments.length,
      generatedAt: new Date().toISOString(),
    },
  };
}

export default {
  getStubEnvironmentCatalog,
};
