import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { URL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

import { createDefaultEvents, normaliseEventFixtures, DEFAULT_WORKSPACES, normaliseMetadata } from './fixtures.mjs';

const DEFAULT_HOST = process.env.CALENDAR_STUB_HOST || '0.0.0.0';
const DEFAULT_PORT = Number.parseInt(process.env.CALENDAR_STUB_PORT || '4010', 10);
const DEFAULT_ALLOWED_METHODS = 'GET,POST,PATCH,DELETE,OPTIONS';
const DEFAULT_ALLOWED_HEADERS = [
  'content-type',
  'authorization',
  'x-user-id',
  'x-roles',
  'x-api-key',
  'x-request-id',
  'x-calendar-scenario',
  'x-calendar-latency-ms',
  'x-workspace-slug',
];
const SUPPORTED_EVENT_TYPES = ['project', 'interview', 'gig', 'mentorship', 'volunteering'];
const DEFAULT_VIEW_ROLES = ['calendar:view', 'calendar:manage', 'platform:admin'];
const DEFAULT_MANAGE_ROLES = ['calendar:manage', 'platform:admin'];

const DEFAULT_WINDOW_DAYS = 30;
const DEFAULT_LOOKAHEAD_DAYS = 45;
const MAX_EVENTS_LIMIT = 500;
const DEFAULT_LIMIT = 250;

const DEFAULT_SCENARIO_HANDLERS = new Map([
  [
    'forbidden',
    ({ request, response, origin }) =>
      sendJson(response, request, origin, 403, {
        message: 'Scenario forced forbidden response',
      }),
  ],
  [
    'rate-limit',
    ({ request, response, origin }) =>
      sendJson(response, request, origin, 429, {
        message: 'Scenario forced rate limit response',
        retryAfterSeconds: 30,
      }),
  ],
  [
    'server-error',
    ({ request, response, origin }) =>
      sendJson(response, request, origin, 500, {
        message: 'Scenario forced server error',
      }),
  ],
]);

function parseList(value, { toLowerCase = false } = {}) {
  if (!value) {
    return [];
  }
  const list = Array.isArray(value) ? value : `${value}`.split(',');
  return list
    .map((entry) => `${entry}`.trim())
    .filter(Boolean)
    .map((entry) => (toLowerCase ? entry.toLowerCase() : entry));
}

function parseInteger(value, fallback = null) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = Number.parseInt(`${value}`, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function loadJsonFile(filePath) {
  if (!filePath) {
    return null;
  }
  const trimmed = `${filePath}`.trim();
  if (!trimmed) {
    return null;
  }
  const resolved = path.isAbsolute(trimmed) ? trimmed : path.resolve(process.cwd(), trimmed);
  const raw = fs.readFileSync(resolved, 'utf8');
  return JSON.parse(raw);
}

function normaliseSlug(value) {
  if (!value) {
    return null;
  }
  return `${value}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '') || null;
}

function normaliseWorkspaces(source) {
  const catalogSource = Array.isArray(source) ? source : loadJsonFile(source);
  const list = Array.isArray(catalogSource) && catalogSource.length ? catalogSource : DEFAULT_WORKSPACES;
  return list
    .map((workspace) => {
      const id = Number.parseInt(`${workspace.id}`, 10);
      const name = `${workspace.name}`.trim();
      if (!Number.isFinite(id) || !name) {
        return null;
      }
      return {
        id,
        slug: normaliseSlug(workspace.slug) || null,
        name,
        timezone: workspace.timezone ? `${workspace.timezone}` : 'UTC',
        defaultCurrency: workspace.defaultCurrency ? `${workspace.defaultCurrency}`.trim() : 'USD',
        membershipRole: workspace.membershipRole ? `${workspace.membershipRole}`.trim() : 'admin',
      };
    })
    .filter(Boolean);
}

function findWorkspace(workspaceCatalog, { workspaceId, workspaceSlug }) {
  if (Number.isInteger(workspaceId)) {
    const match = workspaceCatalog.find((workspace) => workspace.id === workspaceId);
    if (match) {
      return match;
    }
  }
  if (workspaceSlug) {
    const slug = normaliseSlug(workspaceSlug);
    return workspaceCatalog.find((workspace) => workspace.slug === slug) || null;
  }
  return null;
}

function resolveAllowedOrigins(option) {
  const entries = parseList(option);
  if (!entries.length) {
    return entries;
  }
  return Array.from(new Set(entries));
}

function buildRoleSet(input, fallback) {
  const values = parseList(input, { toLowerCase: true });
  const effective = values.length ? values : fallback;
  return new Set(effective.map((role) => role.toLowerCase()));
}

function summariseWorkspaceEvents(workspaces, events) {
  const totals = new Map();
  const nextEventByWorkspace = new Map();
  const now = Date.now();

  for (const event of events) {
    const workspaceId = toPositiveInteger(event.workspaceId);
    if (!workspaceId) {
      continue;
    }
    totals.set(workspaceId, (totals.get(workspaceId) ?? 0) + 1);

    if (!event.startsAt) {
      continue;
    }

    const startsAt = new Date(event.startsAt);
    if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() < now) {
      continue;
    }

    const existing = nextEventByWorkspace.get(workspaceId);
    if (!existing || startsAt.getTime() < existing.getTime()) {
      nextEventByWorkspace.set(workspaceId, startsAt);
    }
  }

  return workspaces.map((workspace) => ({
    id: workspace.id,
    slug: workspace.slug,
    name: workspace.name,
    timezone: workspace.timezone,
    defaultCurrency: workspace.defaultCurrency,
    membershipRole: workspace.membershipRole,
    upcomingEvents: totals.get(workspace.id) ?? 0,
    nextEventStartsAt: nextEventByWorkspace.get(workspace.id)?.toISOString() ?? null,
  }));
}

function computeLatestEventTimestamp(events) {
  let latest = null;
  for (const event of events) {
    if (!event?.startsAt) {
      continue;
    }
    const startsAt = new Date(event.startsAt);
    if (Number.isNaN(startsAt.getTime())) {
      continue;
    }
    if (!latest || startsAt.getTime() > latest.getTime()) {
      latest = startsAt;
    }
  }
  return latest ? latest.toISOString() : null;
}

function buildHeaderExamples({ viewRoles, manageRoles, stubApiKey }) {
  const viewRole = viewRoles.size ? [...viewRoles][0] : 'calendar:view';
  const manageRole = manageRoles.size ? [...manageRoles][0] : 'calendar:manage';

  const base = stubApiKey
    ? {
        'x-api-key': 'YOUR_CALENDAR_STUB_KEY',
      }
    : {};

  return {
    view: {
      ...base,
      'x-roles': viewRole,
    },
    manage: {
      ...base,
      'x-roles': viewRole === manageRole ? manageRole : `${viewRole},${manageRole}`,
      'x-user-id': '<operator-id>',
    },
  };
}

function buildDeploymentSnapshot(env) {
  const releaseChannel = env.CALENDAR_STUB_RELEASE_CHANNEL?.trim() || 'stable';
  const region = env.CALENDAR_STUB_REGION?.trim() || 'us-central';
  const buildNumber = env.CALENDAR_STUB_BUILD_NUMBER?.trim() || null;
  const ownerTeam = env.CALENDAR_STUB_OWNER_TEAM?.trim() || null;

  return {
    releaseChannel,
    region,
    buildNumber,
    ownerTeam,
  };
}

function evaluateOrigin(request, allowedOrigins, fallbackOrigin) {
  const requestedOrigin = request.headers.origin;
  if (!allowedOrigins.length || allowedOrigins.includes('*')) {
    return {
      allowed: true,
      origin: requestedOrigin || fallbackOrigin,
    };
  }
  if (requestedOrigin && allowedOrigins.includes(requestedOrigin)) {
    return {
      allowed: true,
      origin: requestedOrigin,
    };
  }
  if (!requestedOrigin) {
    return {
      allowed: true,
      origin: fallbackOrigin,
    };
  }
  return {
    allowed: false,
    origin: fallbackOrigin,
    message: 'Origin not allowed',
  };
}

function buildScenarioMap(overrides) {
  const scenarios = new Map(DEFAULT_SCENARIO_HANDLERS);
  if (!overrides) {
    return scenarios;
  }

  const entries =
    overrides instanceof Map
      ? overrides.entries()
      : typeof overrides === 'object'
        ? Object.entries(overrides)
        : [];

  for (const [key, handler] of entries) {
    const name = `${key}`.trim().toLowerCase();
    if (!name) {
      continue;
    }
    if (typeof handler === 'function') {
      scenarios.set(name, handler);
      continue;
    }
    if (handler && typeof handler === 'object') {
      const statusCode = parseInteger(handler.statusCode ?? handler.status, 500) ?? 500;
      const body = handler.body ?? { message: handler.message || 'Scenario response' };
      scenarios.set(name, ({ request, response, origin }) => {
        sendJson(response, request, origin, statusCode, body);
      });
    }
  }

  return scenarios;
}

function resolveScenario(request, url, scenarioMap) {
  const headerScenario = request.headers['x-calendar-scenario'] ?? request.headers['x-scenario'];
  const queryScenario = url.searchParams.get('scenario');
  const raw = headerScenario ?? queryScenario;
  if (!raw) {
    return null;
  }
  const scenario = `${raw}`.trim().toLowerCase();
  if (!scenario || scenario === 'none') {
    return null;
  }
  return scenarioMap.has(scenario) ? scenario : null;
}

function createDefaultLatencyProvider({ minLatencyMs = 0, maxLatencyMs = 0 } = {}) {
  const min = Math.max(0, parseInteger(minLatencyMs, 0) ?? 0);
  const maxCandidate = parseInteger(maxLatencyMs, min);
  const max = Math.max(min, maxCandidate ?? min);

  return ({ request, url }) => {
    const headerOverride = parseInteger(
      request.headers['x-calendar-latency-ms'] ?? request.headers['x-latency-ms'],
      null,
    );
    const queryOverride = parseInteger(url.searchParams.get('latencyMs'), null);
    const override = headerOverride ?? queryOverride;
    if (override && override > 0) {
      return override;
    }
    if (max <= 0) {
      return 0;
    }
    if (max === min) {
      return max;
    }
    const delta = max - min;
    return Math.floor(Math.random() * (delta + 1)) + min;
  };
}

async function applyLatency(latencyProvider, context) {
  if (!latencyProvider) {
    return;
  }
  const result = await latencyProvider(context);
  let delayMs = 0;

  if (typeof result === 'number') {
    delayMs = result;
  } else if (result && typeof result === 'object') {
    delayMs = parseInteger(result.delayMs ?? result.latencyMs, 0) ?? 0;
  }

  if (delayMs > 0) {
    await delay(delayMs);
  }
}

function applyCors(response, request, origin) {
  if (!origin) {
    return;
  }
  response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Methods', DEFAULT_ALLOWED_METHODS);

  const requestHeaders = parseList(request.headers['access-control-request-headers']);
  const allowedHeaders = new Set(DEFAULT_ALLOWED_HEADERS.concat(requestHeaders));
  response.setHeader('Access-Control-Allow-Headers', Array.from(allowedHeaders).join(','));
  response.setHeader('Access-Control-Expose-Headers', 'X-Request-Id');
  response.setHeader('Vary', 'Origin, Access-Control-Request-Headers');
}

function sendJson(response, request, origin, statusCode, payload) {
  applyCors(response, request, origin);
  response.statusCode = statusCode;
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

function sendNoContent(response, request, origin) {
  applyCors(response, request, origin);
  response.statusCode = 204;
  response.setHeader('Cache-Control', 'no-store');
  response.end();
}

function parseRequestBody(request) {
  return new Promise((resolve, reject) => {
    let data = '';
    request
      .on('data', (chunk) => {
        data += chunk;
        if (data.length > 1_000_000) {
          request.destroy();
          reject(new Error('Payload too large'));
        }
      })
      .on('end', () => {
        if (!data) {
          resolve(null);
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

function normaliseTypes(value) {
  const list = parseList(value, { toLowerCase: true });
  return list.filter((entry) => SUPPORTED_EVENT_TYPES.includes(entry));
}

function normaliseLimit(value) {
  const parsed = parseInteger(value, DEFAULT_LIMIT);
  const candidate = parsed ?? DEFAULT_LIMIT;
  const bounded = Math.min(Math.max(candidate, 1), MAX_EVENTS_LIMIT);
  return bounded;
}

function resolveWindowRange({ from, to }) {
  const now = new Date();
  const defaultStart = new Date(now.getTime() - DEFAULT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const defaultEnd = new Date(now.getTime() + DEFAULT_LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000);

  const start = from ? new Date(from) : defaultStart;
  const end = to ? new Date(to) : defaultEnd;

  if (Number.isNaN(start.getTime())) {
    throw new Error('from must be a valid ISO-8601 datetime.');
  }
  if (Number.isNaN(end.getTime())) {
    throw new Error('to must be a valid ISO-8601 datetime.');
  }
  if (end.getTime() < start.getTime()) {
    throw new Error('from must be earlier than to.');
  }

  return { start, end };
}

function filterEvents(list, { windowStart, windowEnd, types, search }) {
  const searchValue = search ? `${search}`.toLowerCase() : null;
  const typeFilter = normaliseTypes(types);
  const startTime = windowStart.getTime();
  const endTime = windowEnd.getTime();

  return list.filter((event) => {
    const eventStart = new Date(event.startsAt).getTime();
    if (Number.isNaN(eventStart)) {
      return false;
    }
    if (eventStart < startTime || eventStart > endTime) {
      return false;
    }
    if (typeFilter.length && !typeFilter.includes(event.eventType)) {
      return false;
    }
    if (searchValue) {
      const haystacks = [event.title, event.location, event.metadata?.relatedEntityName, event.metadata?.notes]
        .filter(Boolean)
        .map((value) => `${value}`.toLowerCase());
      if (!haystacks.some((value) => value.includes(searchValue))) {
        return false;
      }
    }
    return true;
  });
}

function groupEventsByType(list, limit) {
  const grouped = SUPPORTED_EVENT_TYPES.reduce((acc, type) => {
    acc[type] = [];
    return acc;
  }, {});

  list.forEach((event) => {
    if (!grouped[event.eventType]) {
      grouped[event.eventType] = [];
    }
    grouped[event.eventType].push(event);
  });

  Object.keys(grouped).forEach((key) => {
    grouped[key] = grouped[key]
      .slice()
      .sort((a, b) => {
        const diff = new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
        if (diff !== 0) {
          return diff;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    if (limit && Number.isFinite(limit)) {
      grouped[key] = grouped[key].slice(0, limit);
    }
  });

  return grouped;
}

function buildSummary(list, windowRange) {
  const now = new Date();
  const totalsByType = SUPPORTED_EVENT_TYPES.reduce((acc, type) => {
    acc[type] = 0;
    return acc;
  }, {});
  const upcomingByType = {};
  let nextEvent = null;
  let overdueCount = 0;

  list.forEach((event) => {
    if (totalsByType[event.eventType] != null) {
      totalsByType[event.eventType] += 1;
    }
    if (event.status === 'completed') {
      const eventEnd = event.endsAt ? new Date(event.endsAt) : null;
      if (eventEnd && eventEnd < now) {
        overdueCount += 1;
      }
    }
    const startDate = event.startsAt ? new Date(event.startsAt) : null;
    if (startDate && startDate >= now) {
      if (!upcomingByType[event.eventType] || new Date(upcomingByType[event.eventType].startsAt) > startDate) {
        upcomingByType[event.eventType] = event;
      }
      if (!nextEvent || new Date(nextEvent.startsAt) > startDate) {
        nextEvent = event;
      }
    }
  });

  return {
    totalEvents: list.length,
    nextEvent,
    overdueCount,
    totalsByType,
    upcomingByType,
    window: {
      from: windowRange.start.toISOString(),
      to: windowRange.end.toISOString(),
    },
  };
}

function prepareMetadata(value) {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const metadata = normaliseMetadata(value);
  return metadata && Object.keys(metadata).length ? metadata : null;
}

function toPositiveInteger(value, fallback = null) {
  const numeric = Number.parseInt(`${value}`, 10);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}

function computeDurationMinutes(startsAt, endsAt) {
  if (!startsAt || !endsAt) {
    return null;
  }
  const start = startsAt instanceof Date ? startsAt : new Date(startsAt);
  const end = endsAt instanceof Date ? endsAt : new Date(endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
}

function determineStatus(startsAt, endsAt, now = Date.now()) {
  const startTime = startsAt instanceof Date ? startsAt : new Date(startsAt);
  const endTime = endsAt ? (endsAt instanceof Date ? endsAt : new Date(endsAt)) : null;
  if (Number.isNaN(startTime.getTime())) {
    return 'scheduled';
  }
  const current = now instanceof Date ? now.getTime() : Number(now);
  if (endTime && !Number.isNaN(endTime.getTime()) && endTime.getTime() <= current) {
    return 'completed';
  }
  if (startTime.getTime() > current) {
    return 'scheduled';
  }
  return 'in_progress';
}

function normaliseEventType(value) {
  if (!value) {
    return 'project';
  }
  const normalised = `${value}`.trim().toLowerCase();
  return SUPPORTED_EVENT_TYPES.includes(normalised) ? normalised : 'project';
}

function ensureEventShape(event, now = new Date()) {
  const id = toPositiveInteger(event.id);
  const createdAt = event.createdAt ? new Date(event.createdAt) : now;
  const updatedAt = event.updatedAt ? new Date(event.updatedAt) : createdAt;
  const startsAt = event.startsAt ? new Date(event.startsAt) : now;
  const endsAt = event.endsAt ? new Date(event.endsAt) : null;

  if (Number.isNaN(startsAt.getTime())) {
    startsAt.setTime(now.getTime());
  }

  const eventRecord = {
    id: id ?? event.id ?? randomUUID(),
    workspaceId: toPositiveInteger(event.workspaceId, 0),
    title: `${event.title}`.trim(),
    eventType: normaliseEventType(event.eventType),
    startsAt: startsAt.toISOString(),
    endsAt: endsAt && !Number.isNaN(endsAt.getTime()) ? endsAt.toISOString() : null,
    location: event.location ? `${event.location}` : null,
    metadata: prepareMetadata(event.metadata),
    status: event.status ? `${event.status}`.trim().toLowerCase() : determineStatus(startsAt, endsAt, now),
    createdAt: Number.isNaN(createdAt.getTime()) ? now.toISOString() : createdAt.toISOString(),
    updatedAt: Number.isNaN(updatedAt.getTime()) ? now.toISOString() : updatedAt.toISOString(),
  };

  return eventRecord;
}

function serializeEvent(event, now = new Date()) {
  const startsAt = event.startsAt ? new Date(event.startsAt) : null;
  const endsAt = event.endsAt ? new Date(event.endsAt) : null;
  return {
    ...event,
    metadata: event.metadata ? structuredClone(event.metadata) : {},
    durationMinutes: computeDurationMinutes(startsAt, endsAt),
    status: determineStatus(startsAt, endsAt, now),
  };
}

function resolveSeedEvents({ seedEvents, eventsFile, now }) {
  if (Array.isArray(seedEvents)) {
    return seedEvents.map((item) => ensureEventShape(item, new Date(now)));
  }

  if (eventsFile) {
    const parsed = loadJsonFile(eventsFile);
    if (!Array.isArray(parsed)) {
      throw new Error('Calendar stub events file must export an array');
    }
    return normaliseEventFixtures(parsed, { now, allowEmpty: true }).map((item) => ensureEventShape(item, new Date(now)));
  }

  return createDefaultEvents(now).map((item) => ensureEventShape(item, new Date(now)));
}

function computeNextEventId(list) {
  const maxId = list.reduce((accumulator, event) => {
    const numeric = toPositiveInteger(event.id);
    if (numeric != null && numeric > accumulator) {
      return numeric;
    }
    return accumulator;
  }, 1000);
  return maxId + 1;
}

function validateDate(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function authorizeRequest(request, response, origin, { permission, viewRoles, manageRoles, apiKey }) {
  const enforcedApiKey = apiKey ?? process.env.CALENDAR_STUB_API_KEY?.trim();
  if (enforcedApiKey) {
    const bearerHeader = request.headers['authorization'];
    const bearerKey = bearerHeader ? bearerHeader.replace(/Bearer\s+/i, '').trim() : undefined;
    const providedKey = request.headers['x-api-key']?.trim() || bearerKey;
    if (providedKey !== enforcedApiKey) {
      sendJson(response, request, origin, 401, { message: 'Invalid or missing API key' });
      return null;
    }
  }

  const providedRoles = new Set(parseList(request.headers['x-roles'] || request.headers['x-user-roles'], { toLowerCase: true }));
  const requiredRoles = permission === 'manage' ? manageRoles : viewRoles;

  const hasRequiredRole = !requiredRoles.size || [...providedRoles].some((role) => requiredRoles.has(role));
  if (!hasRequiredRole) {
    sendJson(response, request, origin, 403, { message: 'Insufficient role grants' });
    return null;
  }

  const userId = request.headers['x-user-id']?.toString().trim() || null;
  if (permission === 'manage' && !userId) {
    sendJson(response, request, origin, 400, { message: 'x-user-id header is required for write actions' });
    return null;
  }

  return {
    userId,
    roles: [...providedRoles],
  };
}

export function createCalendarServer(options = {}) {
  const env = process.env;
  const {
    seedEvents,
    eventsFile = env.CALENDAR_STUB_EVENTS_FILE,
    workspaces: workspaceSource = env.CALENDAR_STUB_WORKSPACES_FILE,
    allowedOrigins = env.CALENDAR_STUB_ALLOWED_ORIGINS,
    fallbackOrigin = env.CALENDAR_STUB_FALLBACK_ORIGIN || 'http://localhost:4173',
    viewRoles = env.CALENDAR_STUB_VIEW_ROLES,
    manageRoles = env.CALENDAR_STUB_MANAGE_ROLES,
    logger = console,
    latencyProvider,
    minLatencyMs = env.CALENDAR_STUB_MIN_LATENCY_MS,
    maxLatencyMs = env.CALENDAR_STUB_MAX_LATENCY_MS,
    scenarioHandlers,
    defaultWorkspaceId: defaultWorkspaceIdOption = env.CALENDAR_STUB_DEFAULT_WORKSPACE_ID,
    defaultWorkspaceSlug: defaultWorkspaceSlugOption = env.CALENDAR_STUB_DEFAULT_WORKSPACE_SLUG,
  } = options;

  const stubApiKey = env.CALENDAR_STUB_API_KEY?.trim() || null;
  const baseSeed = { seedEvents, eventsFile };
  const allowedOriginList = resolveAllowedOrigins(allowedOrigins);
  const viewRoleSet = buildRoleSet(viewRoles, DEFAULT_VIEW_ROLES);
  const manageRoleSet = buildRoleSet(manageRoles, DEFAULT_MANAGE_ROLES);
  const scenarioMap = buildScenarioMap(scenarioHandlers);
  const minLatencyValue = Math.max(0, parseInteger(minLatencyMs, 0) ?? 0);
  const maxLatencyValue = Math.max(
    minLatencyValue,
    parseInteger(maxLatencyMs, minLatencyValue) ?? minLatencyValue,
  );
  const latencyFn =
    latencyProvider ?? createDefaultLatencyProvider({ minLatencyMs: minLatencyValue, maxLatencyMs: maxLatencyValue });
  const defaultWorkspaceId = toPositiveInteger(defaultWorkspaceIdOption);
  const defaultWorkspaceSlug = defaultWorkspaceSlugOption ? normaliseSlug(defaultWorkspaceSlugOption) : null;
  const serverBootedAt = Date.now();
  let workspaceCatalog = normaliseWorkspaces(workspaceSource);
  let events = resolveSeedEvents({ ...baseSeed, now: Date.now() });
  let nextEventId = computeNextEventId(events);

  const deploymentSnapshot = buildDeploymentSnapshot(env);

  function buildMetadataSnapshot() {
    const generatedAt = new Date();
    const workspaceCatalogueWithCounts = summariseWorkspaceEvents(workspaceCatalog, events);
    const totalEvents = workspaceCatalogueWithCounts.reduce((accumulator, workspace) => {
      return accumulator + (workspace.upcomingEvents ?? 0);
    }, 0);
    const scenarioNames = Array.from(scenarioMap.keys());
    const resolvedDefaultWorkspace =
      (defaultWorkspaceSlug
        ? workspaceCatalogueWithCounts.find((workspace) => workspace.slug === defaultWorkspaceSlug)
        : null) ||
      (defaultWorkspaceId
        ? workspaceCatalogueWithCounts.find((workspace) => workspace.id === defaultWorkspaceId)
        : null) ||
      workspaceCatalogueWithCounts[0] ||
      null;

    const workspaceSummary = {
      totalWorkspaces: workspaceCatalogueWithCounts.length,
      totalEvents,
      defaultWorkspace: resolvedDefaultWorkspace
        ? {
            id: resolvedDefaultWorkspace.id,
            slug: resolvedDefaultWorkspace.slug,
            name: resolvedDefaultWorkspace.name,
            timezone: resolvedDefaultWorkspace.timezone,
          }
        : null,
      defaultWorkspaceSlug: resolvedDefaultWorkspace?.slug ?? defaultWorkspaceSlug ?? null,
      defaultWorkspaceId: resolvedDefaultWorkspace?.id ?? defaultWorkspaceId ?? null,
    };

    return {
      service: 'calendar-stub',
      version: env.CALENDAR_STUB_VERSION?.trim() || '2024.10',
      allowedOrigins: [...allowedOriginList],
      fallbackOrigin,
      latency: { minMs: minLatencyValue, maxMs: maxLatencyValue },
      viewRoles: [...viewRoleSet],
      manageRoles: [...manageRoleSet],
      requiresApiKey: Boolean(stubApiKey),
      requiredHeaders: {
        view: ['x-roles'].concat(stubApiKey ? ['x-api-key'] : []),
        manage: ['x-roles', 'x-user-id'].concat(stubApiKey ? ['x-api-key'] : []),
      },
      headerExamples: buildHeaderExamples({ viewRoles: viewRoleSet, manageRoles: manageRoleSet, stubApiKey }),
      scenarios: scenarioNames,
      defaults: {
        windowDays: DEFAULT_WINDOW_DAYS,
        lookaheadDays: DEFAULT_LOOKAHEAD_DAYS,
        limit: DEFAULT_LIMIT,
        maxLimit: MAX_EVENTS_LIMIT,
      },
      availableWorkspaces: workspaceCatalogueWithCounts,
      workspaceSummary,
      telemetry: {
        uptimeSeconds: Math.max(0, Math.round((Date.now() - serverBootedAt) / 1000)),
        scenarioCount: scenarioNames.length,
        totalEvents,
        lastEventStartsAt: computeLatestEventTimestamp(events),
        calculatedAt: generatedAt.toISOString(),
      },
      deployment: {
        ...deploymentSnapshot,
        version: env.CALENDAR_STUB_VERSION?.trim() || '2024.10',
      },
      generatedAt: generatedAt.toISOString(),
    };
  }

  const server = http.createServer(async (request, response) => {
    const requestId = randomUUID();
    response.setHeader('X-Request-Id', requestId);

    const { allowed, origin, message } = evaluateOrigin(request, allowedOriginList, fallbackOrigin);
    if (!allowed) {
      sendJson(response, request, origin, 403, { message });
      return;
    }

    if (request.method === 'OPTIONS') {
      applyCors(response, request, origin);
      response.statusCode = 204;
      response.setHeader('Access-Control-Max-Age', '86400');
      response.end();
      return;
    }

    const url = new URL(request.url, `http://${request.headers.host}`);
    const pathname = url.pathname;
    const isEventPath = pathname.startsWith('/api/company/calendar/events');

    response.on('finish', () => {
      if (typeof logger?.info === 'function') {
        logger.info(
          { requestId, method: request.method, path: pathname, statusCode: response.statusCode },
          'calendar stub request',
        );
      }
    });

    if (isEventPath) {
      const scenarioName = resolveScenario(request, url, scenarioMap);
      await applyLatency(latencyFn, { request, response, url, scenario: scenarioName });
      if (scenarioName) {
        const handler = scenarioMap.get(scenarioName);
        if (handler) {
          handler({ request, response, origin, url });
          return;
        }
      }
    }

    if (request.method === 'GET' && pathname === '/health') {
      sendJson(response, request, origin, 200, { status: 'ok', timestamp: new Date().toISOString() });
      return;
    }

    if (request.method === 'GET' && pathname === '/api/system/calendar-meta') {
      const auth = authorizeRequest(request, response, origin, {
        permission: 'view',
        viewRoles: viewRoleSet,
        manageRoles: manageRoleSet,
        apiKey: stubApiKey,
      });
      if (!auth) {
        return;
      }

      const stubMetadata = buildMetadataSnapshot();

      sendJson(response, request, origin, 200, { status: 'ok', stub: stubMetadata });
      return;
    }

    if (!isEventPath) {
      sendJson(response, request, origin, 404, { message: 'Not found' });
      return;
    }

    if (request.method === 'GET' && pathname === '/api/company/calendar/events') {
      const auth = authorizeRequest(request, response, origin, {
        permission: 'view',
        viewRoles: viewRoleSet,
        manageRoles: manageRoleSet,
        apiKey: stubApiKey,
      });
      if (!auth) {
        return;
      }

      const workspaceIdParam = url.searchParams.get('workspaceId');
      const workspaceSlugParam = url.searchParams.get('workspaceSlug') ?? request.headers['x-workspace-slug'];

      if (!workspaceIdParam && !workspaceSlugParam) {
        sendJson(response, request, origin, 400, { message: 'workspaceId or workspaceSlug is required' });
        return;
      }

      let workspaceId = null;
      if (workspaceIdParam != null) {
        const parsedWorkspaceId = Number.parseInt(`${workspaceIdParam}`, 10);
        if (!Number.isFinite(parsedWorkspaceId) || parsedWorkspaceId <= 0) {
          sendJson(response, request, origin, 422, { message: 'workspaceId must be a positive integer' });
          return;
        }
        workspaceId = parsedWorkspaceId;
      }

      const workspace = findWorkspace(workspaceCatalog, { workspaceId, workspaceSlug: workspaceSlugParam });
      if (!workspace) {
        sendJson(response, request, origin, 404, { message: 'Workspace not found' });
        return;
      }

      let windowRange;
      try {
        windowRange = resolveWindowRange({ from: url.searchParams.get('from'), to: url.searchParams.get('to') });
      } catch (error) {
        sendJson(response, request, origin, 422, { message: error.message });
        return;
      }

      const limit = normaliseLimit(url.searchParams.get('limit'));
      const typesParam = url.searchParams.get('types');
      const searchParam = url.searchParams.get('search');

      const workspaceEvents = events
        .filter((event) => Number(event.workspaceId) === workspace.id)
        .map((event) => serializeEvent(event));

      const filtered = filterEvents(workspaceEvents, {
        windowStart: windowRange.start,
        windowEnd: windowRange.end,
        types: typesParam,
        search: searchParam,
      });

      const sorted = filtered
        .slice()
        .sort((a, b) => {
          const diff = new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
          if (diff !== 0) {
            return diff;
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

      const limitedEvents = sorted.slice(0, limit);
      const grouped = groupEventsByType(limitedEvents, limit);
      const summary = buildSummary(limitedEvents, windowRange);

      const filters = {
        from: windowRange.start.toISOString(),
        to: windowRange.end.toISOString(),
        types: normaliseTypes(typesParam),
        search: searchParam ? `${searchParam}`.trim() : null,
        limit,
        workspaceId: workspace.id,
        workspaceSlug: workspace.slug,
      };

      sendJson(response, request, origin, 200, {
        workspace: {
          id: workspace.id,
          slug: workspace.slug,
          name: workspace.name,
          timezone: workspace.timezone,
          defaultCurrency: workspace.defaultCurrency,
          membershipRole: workspace.membershipRole,
        },
        filters,
        events: limitedEvents,
        eventsByType: grouped,
        summary,
        meta: {
          availableWorkspaces: workspaceCatalog.map((item) => ({
            id: item.id,
            slug: item.slug,
            name: item.name,
            timezone: item.timezone,
            defaultCurrency: item.defaultCurrency,
            membershipRole: item.membershipRole,
            permissions: ['manage_calendar', 'view_calendar'],
          })),
          supportedEventTypes: SUPPORTED_EVENT_TYPES,
          scenarios: Array.from(scenarioMap.keys()),
          seedSource: 'company-calendar-stub',
          latency: {
            minMs: minLatencyValue,
            maxMs: maxLatencyValue,
          },
        },
      });
      return;
    }

    const idMatch = pathname.match(/\/api\/company\/calendar\/events\/(?<id>[a-z0-9-]+)/i);
    const eventId = idMatch?.groups?.id;

    if (request.method === 'GET' && eventId) {
      const auth = authorizeRequest(request, response, origin, {
        permission: 'view',
        viewRoles: viewRoleSet,
        manageRoles: manageRoleSet,
        apiKey: stubApiKey,
      });
      if (!auth) {
        return;
      }

      const numericEventId = toPositiveInteger(eventId);
      const event = events.find((item) => {
        if (`${item.id}` === `${eventId}`) {
          return true;
        }
        const candidateId = toPositiveInteger(item.id);
        return numericEventId != null && candidateId === numericEventId;
      });
      if (!event) {
        sendJson(response, request, origin, 404, { message: 'Event not found' });
        return;
      }
      const workspace = findWorkspace(workspaceCatalog, { workspaceId: toPositiveInteger(event.workspaceId), workspaceSlug: null });
      sendJson(response, request, origin, 200, {
        event: serializeEvent(event),
        workspace: workspace
          ? {
              id: workspace.id,
              slug: workspace.slug,
              name: workspace.name,
              timezone: workspace.timezone,
              defaultCurrency: workspace.defaultCurrency,
              membershipRole: workspace.membershipRole,
            }
          : null,
      });
      return;
    }

    if (request.method === 'POST' && pathname === '/api/company/calendar/events') {
      const auth = authorizeRequest(request, response, origin, {
        permission: 'manage',
        viewRoles: viewRoleSet,
        manageRoles: manageRoleSet,
        apiKey: stubApiKey,
      });
      if (!auth) {
        return;
      }

      try {
        const payload = (await parseRequestBody(request)) || {};
        if (!payload.workspaceId) {
          sendJson(response, request, origin, 422, { message: 'workspaceId is required' });
          return;
        }
        if (!payload.title) {
          sendJson(response, request, origin, 422, { message: 'title is required' });
          return;
        }
        if (!payload.startsAt) {
          sendJson(response, request, origin, 422, { message: 'startsAt is required' });
          return;
        }

        const workspaceId = Number.parseInt(`${payload.workspaceId}`, 10);
        const workspace = findWorkspace(workspaceCatalog, { workspaceId, workspaceSlug: null });
        if (!workspace) {
          sendJson(response, request, origin, 404, { message: 'Workspace not found' });
          return;
        }

        const startDate = validateDate(payload.startsAt);
        if (!startDate) {
          sendJson(response, request, origin, 422, { message: 'startsAt must be a valid ISO date string' });
          return;
        }

        const endDate = validateDate(payload.endsAt);
        if (payload.endsAt && !endDate) {
          sendJson(response, request, origin, 422, { message: 'endsAt must be a valid ISO date string' });
          return;
        }
        if (startDate && endDate && endDate.getTime() < startDate.getTime()) {
          sendJson(response, request, origin, 422, { message: 'endsAt cannot be before startsAt' });
          return;
        }

        if (payload.metadata && typeof payload.metadata !== 'object') {
          sendJson(response, request, origin, 422, { message: 'metadata must be an object' });
          return;
        }

        const createdAt = new Date();
        const event = ensureEventShape(
          {
            id: nextEventId,
            workspaceId,
            title: `${payload.title}`.trim(),
            eventType: payload.eventType,
            status: payload.status && typeof payload.status === 'string' ? payload.status : undefined,
            startsAt: startDate.toISOString(),
            endsAt: endDate ? endDate.toISOString() : null,
            location: payload.location ?? null,
            metadata: payload.metadata ?? null,
            createdAt: createdAt.toISOString(),
            updatedAt: createdAt.toISOString(),
          },
          createdAt,
        );

        events = [event, ...events];
        nextEventId = computeNextEventId(events);
        sendJson(response, request, origin, 201, serializeEvent(event));
      } catch (error) {
        sendJson(response, request, origin, 400, { message: 'Invalid JSON payload', detail: error.message });
      }
      return;
    }

    if (request.method === 'PATCH' && eventId) {
      const auth = authorizeRequest(request, response, origin, {
        permission: 'manage',
        viewRoles: viewRoleSet,
        manageRoles: manageRoleSet,
        apiKey: stubApiKey,
      });
      if (!auth) {
        return;
      }

      const existingIndex = events.findIndex((event) => event.id === eventId);
      if (existingIndex === -1) {
        sendJson(response, request, origin, 404, { message: 'Event not found' });
        return;
      }

      try {
        const payload = (await parseRequestBody(request)) || {};

        if (payload.startsAt && !validateDate(payload.startsAt)) {
          sendJson(response, request, origin, 422, { message: 'startsAt must be a valid ISO date string' });
          return;
        }
        if (payload.endsAt && !validateDate(payload.endsAt)) {
          sendJson(response, request, origin, 422, { message: 'endsAt must be a valid ISO date string' });
          return;
        }
        if (payload.metadata !== undefined && payload.metadata !== null && typeof payload.metadata !== 'object') {
          sendJson(response, request, origin, 422, { message: 'metadata must be an object' });
          return;
        }

        const existing = events[existingIndex];
        const startDate = payload.startsAt ? validateDate(payload.startsAt) : null;
        const endDate = payload.endsAt ? validateDate(payload.endsAt) : null;
        if (startDate && endDate && endDate.getTime() < startDate.getTime()) {
          sendJson(response, request, origin, 422, { message: 'endsAt cannot be before startsAt' });
          return;
        }

        let mergedMetadata = existing.metadata ? structuredClone(existing.metadata) : null;
        if (payload.metadata !== undefined) {
          if (payload.metadata === null) {
            mergedMetadata = null;
          } else {
            const incomingMetadata = prepareMetadata(payload.metadata);
            mergedMetadata = incomingMetadata
              ? { ...(existing.metadata ?? {}), ...incomingMetadata }
              : null;
          }
        }

        const updatedAt = new Date();
        const updated = ensureEventShape(
          {
            ...existing,
            title: payload.title ? `${payload.title}`.trim() : existing.title,
            eventType: payload.eventType ?? existing.eventType,
            startsAt: startDate ? startDate.toISOString() : existing.startsAt,
            endsAt: endDate ? endDate.toISOString() : existing.endsAt,
            location: payload.location ?? existing.location,
            status: payload.status ?? existing.status,
            metadata: mergedMetadata,
            updatedAt: updatedAt.toISOString(),
          },
          updatedAt,
        );

        events[existingIndex] = updated;
        sendJson(response, request, origin, 200, serializeEvent(updated));
      } catch (error) {
        sendJson(response, request, origin, 400, { message: 'Invalid JSON payload', detail: error.message });
      }
      return;
    }

    if (request.method === 'DELETE' && eventId) {
      const auth = authorizeRequest(request, response, origin, {
        permission: 'manage',
        viewRoles: viewRoleSet,
        manageRoles: manageRoleSet,
        apiKey: stubApiKey,
      });
      if (!auth) {
        return;
      }

      const existing = events.find((event) => event.id === eventId);
      if (!existing) {
        sendJson(response, request, origin, 404, { message: 'Event not found' });
        return;
      }

      events = events.filter((event) => event.id !== eventId);
      sendNoContent(response, request, origin);
      return;
    }

    sendJson(response, request, origin, 405, { message: 'Method not allowed' });
  });

  return {
    server,
    listen(port = DEFAULT_PORT, host = DEFAULT_HOST, callback) {
      return server.listen(port, host, callback);
    },
    close(callback) {
      return server.close(callback);
    },
    resetEvents(nextEvents = []) {
      if (nextEvents === null) {
        events = resolveSeedEvents({ ...baseSeed, now: Date.now() });
      } else {
        if (!Array.isArray(nextEvents)) {
          throw new TypeError('resetEvents expects an array of events or null');
        }
        events = nextEvents.map((item) => ensureEventShape(item, new Date()))
          .filter((item) => Number.isFinite(Number(item.workspaceId)) && item.title);
      }
      nextEventId = computeNextEventId(events);
    },
    getEvents() {
      return events.map((event) => serializeEvent(event));
    },
    resetWorkspaces(nextWorkspaces = workspaceSource) {
      workspaceCatalog = normaliseWorkspaces(nextWorkspaces);
    },
    getWorkspaces() {
      return workspaceCatalog.map((workspace) => ({ ...workspace }));
    },
    getMetadata() {
      return {
        status: 'ok',
        stub: buildMetadataSnapshot(),
      };
    },
  };
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const app = createCalendarServer();
  app.listen(DEFAULT_PORT, DEFAULT_HOST, () => {
    // eslint-disable-next-line no-console
    console.log(`Calendar stub listening on http://${DEFAULT_HOST}:${DEFAULT_PORT}/api/company/calendar/events`);
  });
}
