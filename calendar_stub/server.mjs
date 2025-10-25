import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { URL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

import { createDefaultEvents, normaliseEventFixtures, DEFAULT_WORKSPACES } from './fixtures.mjs';

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
];
const SUPPORTED_EVENT_TYPES = ['project', 'interview', 'gig', 'mentorship', 'volunteering'];
const DEFAULT_VIEW_ROLES = ['calendar:view', 'calendar:manage', 'platform:admin'];
const DEFAULT_MANAGE_ROLES = ['calendar:manage', 'platform:admin'];

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

function normaliseWorkspaces(source) {
  const catalogSource = Array.isArray(source) ? source : loadJsonFile(source);
  const list = Array.isArray(catalogSource) && catalogSource.length ? catalogSource : DEFAULT_WORKSPACES;
  return list
    .map((workspace) => ({
      id: Number.parseInt(`${workspace.id}`, 10),
      name: `${workspace.name}`.trim(),
      timezone: workspace.timezone ? `${workspace.timezone}` : 'UTC',
    }))
    .filter((workspace) => Number.isFinite(workspace.id) && workspace.name);
}

function findWorkspace(workspaceCatalog, workspaceId) {
  return workspaceCatalog.find((workspace) => workspace.id === workspaceId) || null;
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

function filterEvents(list, { from, to, types, search }) {
  const fromTime = from ? new Date(from).getTime() : null;
  const toTime = to ? new Date(to).getTime() : null;
  const searchValue = search ? `${search}`.toLowerCase() : null;
  const typeFilter = normaliseTypes(types);

  return list.filter((event) => {
    const startTime = new Date(event.startsAt).getTime();
    if (fromTime && Number.isFinite(fromTime) && startTime < fromTime) {
      return false;
    }
    if (toTime && Number.isFinite(toTime) && startTime > toTime) {
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
  const grouped = {
    project: [],
    interview: [],
    gig: [],
    mentorship: [],
    volunteering: [],
  };

  list.forEach((event) => {
    if (!grouped[event.eventType]) {
      grouped[event.eventType] = [];
    }
    grouped[event.eventType].push(event);
  });

  Object.keys(grouped).forEach((key) => {
    grouped[key] = grouped[key]
      .slice()
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    if (limit && Number.isFinite(limit)) {
      grouped[key] = grouped[key].slice(0, limit);
    }
  });

  return grouped;
}

function buildSummary(list) {
  const totalEvents = list.length;
  const now = Date.now();
  const sorted = list.slice().sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const nextEvent = sorted.find((event) => new Date(event.startsAt).getTime() >= now) || null;
  const overdueCount = list.filter((event) => {
    const endTime = event.endsAt ? new Date(event.endsAt).getTime() : null;
    const comparisonTime = endTime && Number.isFinite(endTime) ? endTime : new Date(event.startsAt).getTime();
    return comparisonTime < now;
  }).length;

  const totalsByType = list.reduce((acc, event) => {
    acc[event.eventType] = (acc[event.eventType] || 0) + 1;
    return acc;
  }, {});

  const upcomingByType = list.reduce((acc, event) => {
    const bucket = acc[event.eventType] || [];
    const eventStart = new Date(event.startsAt).getTime();
    if (eventStart >= now) {
      bucket.push(event);
    }
    acc[event.eventType] = bucket.slice(0, 3);
    return acc;
  }, {});

  return {
    totalEvents,
    nextEvent,
    overdueCount,
    totalsByType,
    upcomingByType,
  };
}

function sanitizeMetadata(value) {
  if (!value || typeof value !== 'object') {
    return {};
  }
  return structuredClone(value);
}

function resolveSeedEvents({ seedEvents, eventsFile, now }) {
  if (Array.isArray(seedEvents)) {
    return seedEvents.map(ensureEventShape);
  }

  if (eventsFile) {
    const parsed = loadJsonFile(eventsFile);
    if (!Array.isArray(parsed)) {
      throw new Error('Calendar stub events file must export an array');
    }
    return normaliseEventFixtures(parsed, { now, allowEmpty: true }).map(ensureEventShape);
  }

  return createDefaultEvents(now).map(ensureEventShape);
}

function serializeEvent(event) {
  return {
    ...event,
    metadata: sanitizeMetadata(event.metadata),
  };
}

function ensureEventShape(event) {
  return serializeEvent({
    ...event,
    id: event.id || randomUUID(),
    createdAt: event.createdAt || new Date().toISOString(),
    updatedAt: event.updatedAt || new Date().toISOString(),
  });
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
  let workspaceCatalog = normaliseWorkspaces(workspaceSource);
  let events = resolveSeedEvents({ ...baseSeed, now: Date.now() });

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
      if (!workspaceIdParam) {
        sendJson(response, request, origin, 400, { message: 'workspaceId query parameter is required' });
        return;
      }
      const workspaceId = Number.parseInt(`${workspaceIdParam}`, 10);
      const workspace = findWorkspace(workspaceCatalog, workspaceId);
      if (!workspace) {
        sendJson(response, request, origin, 404, { message: 'Workspace not found' });
        return;
      }

      const limit = url.searchParams.get('limit') ? Number.parseInt(`${url.searchParams.get('limit')}`, 10) : null;
      const filtered = filterEvents(
        events.filter((event) => event.workspaceId === workspaceId),
        {
          from: url.searchParams.get('from'),
          to: url.searchParams.get('to'),
          types: url.searchParams.get('types'),
          search: url.searchParams.get('search'),
        },
      );

      const grouped = groupEventsByType(filtered, limit);
      const summary = buildSummary(filtered);
      const filters = {
        from: url.searchParams.get('from') || null,
        to: url.searchParams.get('to') || null,
        types: normaliseTypes(url.searchParams.get('types')),
        search: url.searchParams.get('search') || '',
        limit: limit || undefined,
      };

      sendJson(response, request, origin, 200, {
        workspace: {
          id: workspace.id,
          name: workspace.name,
          timezone: workspace.timezone,
        },
        filters,
        eventsByType: grouped,
        summary,
        meta: {
          availableWorkspaces: workspaceCatalog.map((item) => ({
            id: item.id,
            name: item.name,
            timezone: item.timezone,
            permissions: ['manage_calendar', 'view_calendar'],
          })),
          supportedEventTypes: SUPPORTED_EVENT_TYPES,
          scenarios: Array.from(scenarioMap.keys()),
          latency: {
            minMs: minLatencyValue,
            maxMs: maxLatencyValue,
          },
        },
      });
      return;
    }

    const idMatch = pathname.match(/\/api\/company\/calendar\/events\/(?<id>[a-f0-9-]+)/i);
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

      const event = events.find((item) => item.id === eventId);
      if (!event) {
        sendJson(response, request, origin, 404, { message: 'Event not found' });
        return;
      }
      const workspace = findWorkspace(workspaceCatalog, event.workspaceId);
      sendJson(response, request, origin, 200, {
        event: serializeEvent(event),
        workspace: workspace
          ? { id: workspace.id, name: workspace.name, timezone: workspace.timezone }
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
        const workspace = findWorkspace(workspaceCatalog, workspaceId);
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

        const event = ensureEventShape({
          workspaceId,
          title: `${payload.title}`.trim(),
          eventType: SUPPORTED_EVENT_TYPES.includes(payload.eventType) ? payload.eventType : 'project',
          status: payload.status && typeof payload.status === 'string' ? payload.status : 'scheduled',
          startsAt: startDate.toISOString(),
          endsAt: endDate ? endDate.toISOString() : null,
          location: payload.location ?? null,
          metadata: sanitizeMetadata(payload.metadata),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        events = [event, ...events];
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
        if (payload.metadata && typeof payload.metadata !== 'object') {
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

        const updated = ensureEventShape({
          ...existing,
          title: payload.title ? `${payload.title}`.trim() : existing.title,
          eventType: SUPPORTED_EVENT_TYPES.includes(payload.eventType) ? payload.eventType : existing.eventType,
          startsAt: startDate ? startDate.toISOString() : existing.startsAt,
          endsAt: endDate ? endDate.toISOString() : existing.endsAt,
          location: payload.location ?? existing.location,
          status: payload.status ?? existing.status,
          metadata:
            payload.metadata && typeof payload.metadata === 'object'
              ? { ...sanitizeMetadata(existing.metadata), ...sanitizeMetadata(payload.metadata) }
              : sanitizeMetadata(existing.metadata),
          updatedAt: new Date().toISOString(),
        });

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
        return;
      }
      if (!Array.isArray(nextEvents)) {
        throw new TypeError('resetEvents expects an array of events or null');
      }
      events = nextEvents.map(ensureEventShape);
    },
    getEvents() {
      return events.map(serializeEvent);
    },
    resetWorkspaces(nextWorkspaces = workspaceSource) {
      workspaceCatalog = normaliseWorkspaces(nextWorkspaces);
    },
    getWorkspaces() {
      return workspaceCatalog.map((workspace) => ({ ...workspace }));
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
