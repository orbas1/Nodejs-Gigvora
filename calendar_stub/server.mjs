import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { URL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

import { createDefaultEvents, normaliseEventFixtures, DEFAULT_WORKSPACES, normaliseMetadata } from './fixtures.mjs';
import calendarContract from '../shared-contracts/domain/platform/calendar/constants.js';

const {
  COMPANY_CALENDAR_EVENT_TYPES,
  COMPANY_CALENDAR_EVENT_TYPE_SET,
  normalizeCompanyCalendarEventType,
} = calendarContract;

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
const SUPPORTED_EVENT_TYPES = COMPANY_CALENDAR_EVENT_TYPES;
const DEFAULT_VIEW_ROLES = [
  'calendar:view',
  'calendar:manage',
  'platform:admin',
  'company',
  'company_admin',
  'company_manager',
  'company_viewer',
  'admin',
  'viewer',
];
const DEFAULT_MANAGE_ROLES = ['calendar:manage', 'platform:admin', 'company_admin', 'company_manager', 'admin'];

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

function extractWorkspaces(source) {
  if (Array.isArray(source)) {
    return source;
  }
  if (source && typeof source === 'object' && Array.isArray(source.workspaces)) {
    return source.workspaces;
  }
  return null;
}

function normaliseWorkspaces(source) {
  const catalogSource = Array.isArray(source) ? source : loadJsonFile(source);
  const extracted = extractWorkspaces(catalogSource);
  const list = Array.isArray(extracted) && extracted.length ? extracted : DEFAULT_WORKSPACES;
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

function normaliseRoleKey(value) {
  if (!value) {
    return null;
  }
  return `${value}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || null;
}

function buildRoleSet(input, fallback) {
  const values = parseList(input, { toLowerCase: true });
  const effective = values.length ? values : fallback;
  return new Set(
    effective
      .map((role) => normaliseRoleKey(role))
      .filter(Boolean),
  );
}

function extractActorRoles(request) {
  const provided = parseList(request.headers['x-roles'] || request.headers['x-user-roles'], {
    toLowerCase: true,
  });
  const roles = new Set();
  provided.forEach((role) => {
    const normalised = normaliseRoleKey(role);
    if (normalised) {
      roles.add(normalised);
    }
  });
  return roles;
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
    return 'upcoming';
  }

  const current = now instanceof Date ? now.getTime() : Number(now);
  if (endTime && !Number.isNaN(endTime.getTime()) && endTime.getTime() <= current) {
    return 'completed';
  }
  if (startTime.getTime() > current) {
    return 'upcoming';
  }
  return 'in_progress';
}

function normaliseEventType(value) {
  const normalised = normalizeCompanyCalendarEventType(value);
  if (!normalised || !COMPANY_CALENDAR_EVENT_TYPE_SET.has(normalised)) {
    throw new Error(`eventType "${value}" is not supported`);
  }
  return normalised;
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

function resolveSeedDataset({ seedEvents, eventsFile, now }) {
  if (Array.isArray(seedEvents)) {
    return {
      events: seedEvents.map((item) => ensureEventShape(item, new Date(now))),
      workspaces: null,
    };
  }

  if (eventsFile) {
    const parsed = loadJsonFile(eventsFile);
    let eventBlueprints;
    let workspaceBlueprints = null;

    if (Array.isArray(parsed)) {
      eventBlueprints = parsed;
    } else if (parsed && typeof parsed === 'object') {
      eventBlueprints = Array.isArray(parsed.events) ? parsed.events : [];
      workspaceBlueprints = extractWorkspaces(parsed);
    } else {
      throw new Error('Calendar stub events file must export an array or an object with an events array');
    }

    const events = normaliseEventFixtures(eventBlueprints, {
      now,
      allowEmpty: true,
    }).map((item) => ensureEventShape(item, new Date(now)));

    return { events, workspaces: workspaceBlueprints };
  }

  return {
    events: createDefaultEvents(now).map((item) => ensureEventShape(item, new Date(now))),
    workspaces: null,
  };
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

function authorizeRequest(request, response, origin, { permission, viewRoles, manageRoles }) {
  const apiKey = process.env.CALENDAR_STUB_API_KEY?.trim();
  if (apiKey) {
    const bearerHeader = request.headers['authorization'];
    const bearerKey = bearerHeader ? bearerHeader.replace(/Bearer\s+/i, '').trim() : undefined;
    const providedKey = request.headers['x-api-key']?.trim() || bearerKey;
    if (providedKey !== apiKey) {
      sendJson(response, request, origin, 401, { message: 'Invalid or missing API key' });
      return null;
    }
  }

  const providedRoles = extractActorRoles(request);
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
    persistPath = env.CALENDAR_STUB_PERSIST_FILE,
  } = options;

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
  const dataset = resolveSeedDataset({ ...baseSeed, now: Date.now() });
  let workspaceSeedSource = workspaceSource ?? dataset.workspaces;
  let workspaceCatalog = normaliseWorkspaces(workspaceSeedSource);
  let events = dataset.events;
  let nextEventId = computeNextEventId(events);
  const persistFilePath = persistPath
    ? path.isAbsolute(persistPath)
      ? persistPath
      : path.resolve(process.cwd(), persistPath)
    : null;

  function persistState() {
    if (!persistFilePath) {
      return;
    }
    const payload = {
      workspaces: workspaceCatalog.map((workspace) => ({ ...workspace })),
      events: events.map((event) => ({
        ...event,
        metadata: event.metadata != null ? structuredClone(event.metadata) : null,
      })),
      meta: {
        generatedAt: new Date().toISOString(),
        schemaVersion: 1,
      },
    };

    try {
      fs.mkdirSync(path.dirname(persistFilePath), { recursive: true });
      fs.writeFileSync(persistFilePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    } catch (error) {
      if (logger && typeof logger.error === 'function') {
        logger.error({ error, persistFilePath }, 'calendar stub failed to persist state');
      }
    }
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

    if (!isEventPath) {
      sendJson(response, request, origin, 404, { message: 'Not found' });
      return;
    }

    if (request.method === 'GET' && pathname === '/api/company/calendar/events') {
      const auth = authorizeRequest(request, response, origin, {
        permission: 'view',
        viewRoles: viewRoleSet,
        manageRoles: manageRoleSet,
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
      });
      if (!auth) {
        return;
      }

      let payload;
      try {
        payload = (await parseRequestBody(request)) || {};
      } catch (error) {
        sendJson(response, request, origin, 400, { message: 'Invalid JSON payload', detail: error.message });
        return;
      }

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

      let normalisedEventType;
      try {
        normalisedEventType = normaliseEventType(payload.eventType);
      } catch (error) {
        sendJson(response, request, origin, 422, { message: error.message });
        return;
      }

      const createdAt = new Date();
      const event = ensureEventShape(
        {
          id: nextEventId,
          workspaceId,
          title: `${payload.title}`.trim(),
          eventType: normalisedEventType,
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
      persistState();
      return;
    }

    if (request.method === 'PATCH' && eventId) {
      const auth = authorizeRequest(request, response, origin, {
        permission: 'manage',
        viewRoles: viewRoleSet,
        manageRoles: manageRoleSet,
      });
      if (!auth) {
        return;
      }

      const numericEventId = toPositiveInteger(eventId);
      const existingIndex = events.findIndex((event) => {
        if (`${event.id}` === `${eventId}`) {
          return true;
        }
        if (numericEventId == null) {
          return false;
        }
        return toPositiveInteger(event.id) === numericEventId;
      });
      if (existingIndex === -1) {
        sendJson(response, request, origin, 404, { message: 'Event not found' });
        return;
      }

      let payload;
      try {
        payload = (await parseRequestBody(request)) || {};
      } catch (error) {
        sendJson(response, request, origin, 400, { message: 'Invalid JSON payload', detail: error.message });
        return;
      }

      if (payload.metadata !== undefined && payload.metadata !== null && typeof payload.metadata !== 'object') {
        sendJson(response, request, origin, 422, { message: 'metadata must be an object' });
        return;
      }

      const existing = events[existingIndex];
      const startDate = payload.startsAt ? validateDate(payload.startsAt) : null;
      if (payload.startsAt && !startDate) {
        sendJson(response, request, origin, 422, { message: 'startsAt must be a valid ISO date string' });
        return;
      }

      const endDate = payload.endsAt ? validateDate(payload.endsAt) : null;
      if (payload.endsAt && !endDate) {
        sendJson(response, request, origin, 422, { message: 'endsAt must be a valid ISO date string' });
        return;
      }
      if (startDate && endDate && endDate.getTime() < startDate.getTime()) {
        sendJson(response, request, origin, 422, { message: 'endsAt cannot be before startsAt' });
        return;
      }

      let nextEventType = existing.eventType;
      if (payload.eventType != null) {
        try {
          nextEventType = normaliseEventType(payload.eventType);
        } catch (error) {
          sendJson(response, request, origin, 422, { message: error.message });
          return;
        }
      }

      let mergedMetadata = existing.metadata ? structuredClone(existing.metadata) : null;
      if (payload.metadata !== undefined) {
        if (payload.metadata === null) {
          mergedMetadata = null;
        } else {
          const incomingMetadata = prepareMetadata(payload.metadata);
          mergedMetadata = incomingMetadata ? { ...(existing.metadata ?? {}), ...incomingMetadata } : null;
        }
      }

      const updatedAt = new Date();
      const updated = ensureEventShape(
        {
          ...existing,
          title: payload.title ? `${payload.title}`.trim() : existing.title,
          eventType: nextEventType,
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
      persistState();
      return;
    }

    if (request.method === 'DELETE' && eventId) {
      const auth = authorizeRequest(request, response, origin, {
        permission: 'manage',
        viewRoles: viewRoleSet,
        manageRoles: manageRoleSet,
      });
      if (!auth) {
        return;
      }

      const numericEventId = toPositiveInteger(eventId);
      const existing = events.find((event) => {
        if (`${event.id}` === `${eventId}`) {
          return true;
        }
        if (numericEventId == null) {
          return false;
        }
        return toPositiveInteger(event.id) === numericEventId;
      });
      if (!existing) {
        sendJson(response, request, origin, 404, { message: 'Event not found' });
        return;
      }

      events = events.filter((event) => {
        if (`${event.id}` === `${eventId}`) {
          return false;
        }
        if (numericEventId == null) {
          return true;
        }
        return toPositiveInteger(event.id) !== numericEventId;
      });
      sendNoContent(response, request, origin);
      persistState();
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
        const nextDataset = resolveSeedDataset({ ...baseSeed, now: Date.now() });
        events = nextDataset.events;
        if (workspaceSeedSource == null && Array.isArray(nextDataset.workspaces)) {
          workspaceSeedSource = nextDataset.workspaces;
          workspaceCatalog = normaliseWorkspaces(workspaceSeedSource);
        }
      } else {
        if (!Array.isArray(nextEvents)) {
          throw new TypeError('resetEvents expects an array of events or null');
        }
        events = nextEvents.map((item) => ensureEventShape(item, new Date()))
          .filter((item) => Number.isFinite(Number(item.workspaceId)) && item.title);
      }
      nextEventId = computeNextEventId(events);
      persistState();
    },
    getEvents() {
      return events.map((event) => serializeEvent(event));
    },
    resetWorkspaces(nextWorkspaces = workspaceSeedSource) {
      workspaceSeedSource = nextWorkspaces;
      workspaceCatalog = normaliseWorkspaces(workspaceSeedSource);
      persistState();
    },
    getWorkspaces() {
      return workspaceCatalog.map((workspace) => ({ ...workspace }));
    },
    persistState,
    getPersistPath() {
      return persistFilePath;
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
