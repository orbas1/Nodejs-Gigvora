import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { URL } from 'node:url';

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
];
const SUPPORTED_EVENT_TYPES = ['project', 'interview', 'gig', 'mentorship', 'volunteering'];
const DEFAULT_VIEW_ROLES = ['calendar:view', 'calendar:manage', 'platform:admin'];
const DEFAULT_MANAGE_ROLES = ['calendar:manage', 'platform:admin'];

export const CALENDAR_CONNECTOR_DOCUMENTATION = Object.freeze({
  stub: {
    id: 'calendar_stub',
    baseUrl: 'http://localhost:4010/api/company/calendar',
    authentication: 'x-api-key header (optional) with role headers for RBAC simulation.',
    persistence: 'Volatile in-memory store seeded with sample events. Reset on every server restart.',
    capabilities: ['Event CRUD', 'Role-based access control', 'Workspace scoping', 'CORS configuration'],
  },
  production: {
    id: 'calendar_service',
    baseUrl: 'https://api.gigvora.com/calendar',
    authentication: 'OAuth 2.0 service accounts for Google/Microsoft providers with token rotation.',
    persistence:
      'Backed by provider connectors and mirrored in CandidateCalendarEvent records within the platform database.',
    capabilities: ['Bi-directional sync', 'Provider webhooks', 'Availability reconciliation', 'Audit logging'],
  },
});

export function describeCalendarConnectors() {
  return CALENDAR_CONNECTOR_DOCUMENTATION;
}

const workspaces = [
  { id: 101, name: 'Acme Talent Hub', timezone: 'UTC' },
  { id: 202, name: 'Global Mentorship Guild', timezone: 'America/New_York' },
];

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

function getWorkspace(workspaceId) {
  return workspaces.find((workspace) => workspace.id === workspaceId) || null;
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

function serializeEvent(event) {
  return {
    ...event,
    metadata: sanitizeMetadata(event.metadata),
  };
}

function buildDefaultEvents(now = Date.now()) {
  const makeDate = (offsetHours) => new Date(now + offsetHours * 60 * 60 * 1000).toISOString();
  const timestamp = new Date(now).toISOString();
  return [
    {
      id: randomUUID(),
      workspaceId: 101,
      title: 'Revenue ops project kickoff',
      eventType: 'project',
      status: 'scheduled',
      startsAt: makeDate(1),
      endsAt: makeDate(2),
      location: 'Hybrid · HQ Level 4',
      metadata: {
        relatedEntityName: 'Revenue intelligence rollout',
        relatedEntityType: 'project',
        ownerName: 'Alex Morgan',
        ownerEmail: 'alex.morgan@example.com',
        participants: [
          { name: 'Alex Morgan', email: 'alex.morgan@example.com', role: 'project lead' },
          { name: 'Jordan Li', email: 'jordan.li@example.com', role: 'operations' },
        ],
        notes: 'Share pre-read before the working session.',
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: randomUUID(),
      workspaceId: 101,
      title: 'Staff engineer panel interview',
      eventType: 'interview',
      status: 'scheduled',
      startsAt: makeDate(4),
      endsAt: makeDate(5),
      location: 'Zoom',
      metadata: {
        relatedEntityName: 'Staff Engineer - Platform',
        relatedEntityType: 'job',
        ownerName: 'Recruiting squad',
        participants: [
          { name: 'Priya Patel', email: 'priya.patel@example.com', role: 'interviewer' },
          { name: 'Jamie Lee', email: 'jamie.lee@example.com', role: 'interviewer' },
        ],
        notes: 'Panel: systems design, leadership, architecture deep dive.',
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: randomUUID(),
      workspaceId: 101,
      title: 'Growth marketing gig onboarding',
      eventType: 'gig',
      status: 'scheduled',
      startsAt: makeDate(24),
      endsAt: makeDate(25),
      location: 'Async briefing',
      metadata: {
        relatedEntityName: 'Creator partnership sprint',
        relatedEntityType: 'gig',
        ownerName: 'Gig programs',
        notes: 'Share campaign brief and analytics dashboard logins.',
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: randomUUID(),
      workspaceId: 101,
      title: 'Mentorship intro: product leadership',
      eventType: 'mentorship',
      status: 'scheduled',
      startsAt: makeDate(48),
      endsAt: makeDate(49),
      location: 'Google Meet',
      metadata: {
        relatedEntityName: 'Growth mentorship',
        relatedEntityType: 'program',
        ownerName: 'Mentor success',
        notes: 'Share growth plan template.',
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: randomUUID(),
      workspaceId: 101,
      title: 'Volunteer community briefing',
      eventType: 'volunteering',
      status: 'scheduled',
      startsAt: makeDate(72),
      endsAt: makeDate(72.5),
      location: 'Community center',
      metadata: {
        relatedEntityName: 'STEM Futures',
        relatedEntityType: 'volunteering',
        ownerName: 'Community success',
        notes: 'Confirm background checks and travel logistics.',
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
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

export function createCalendarServer({
  seedEvents,
  allowedOrigins = process.env.CALENDAR_STUB_ALLOWED_ORIGINS,
  fallbackOrigin = process.env.CALENDAR_STUB_FALLBACK_ORIGIN || 'http://localhost:4173',
  viewRoles = process.env.CALENDAR_STUB_VIEW_ROLES,
  manageRoles = process.env.CALENDAR_STUB_MANAGE_ROLES,
  logger = console,
} = {}) {
  const allowedOriginList = resolveAllowedOrigins(allowedOrigins);
  const viewRoleSet = buildRoleSet(viewRoles, DEFAULT_VIEW_ROLES);
  const manageRoleSet = buildRoleSet(manageRoles, DEFAULT_MANAGE_ROLES);
  let events = (seedEvents || buildDefaultEvents()).map(ensureEventShape);

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

    response.on('finish', () => {
      if (typeof logger?.info === 'function') {
        logger.info({ requestId, method: request.method, path: pathname, statusCode: response.statusCode }, 'calendar stub request');
      }
    });

    if (request.method === 'GET' && pathname === '/health') {
      sendJson(response, request, origin, 200, { status: 'ok', timestamp: new Date().toISOString() });
      return;
    }

    if (!pathname.startsWith('/api/company/calendar/events')) {
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
      const workspace = getWorkspace(workspaceId);
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
          availableWorkspaces: workspaces.map((item) => ({
            id: item.id,
            name: item.name,
            timezone: item.timezone,
            permissions: ['manage_calendar', 'view_calendar'],
          })),
          supportedEventTypes: SUPPORTED_EVENT_TYPES,
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
      const workspace = getWorkspace(event.workspaceId);
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
        const workspace = getWorkspace(workspaceId);
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
      events = nextEvents.map(ensureEventShape);
    },
    getEvents() {
      return events.map(serializeEvent);
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
