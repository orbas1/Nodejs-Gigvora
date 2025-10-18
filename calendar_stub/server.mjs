import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { URL } from 'node:url';

const HOST = process.env.CALENDAR_STUB_HOST || '0.0.0.0';
const PORT = Number.parseInt(process.env.CALENDAR_STUB_PORT || '4010', 10);
const SUPPORTED_EVENT_TYPES = ['project', 'interview', 'gig', 'mentorship', 'volunteering'];

const workspaces = [
  { id: 101, name: 'Acme Talent Hub', timezone: 'UTC' },
  { id: 202, name: 'Global Mentorship Guild', timezone: 'America/New_York' },
];

let events = [
  {
    id: randomUUID(),
    workspaceId: 101,
    title: 'Revenue ops project kickoff',
    eventType: 'project',
    status: 'scheduled',
    startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: randomUUID(),
    workspaceId: 101,
    title: 'Staff engineer panel interview',
    eventType: 'interview',
    status: 'scheduled',
    startsAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: randomUUID(),
    workspaceId: 101,
    title: 'Growth marketing gig onboarding',
    eventType: 'gig',
    status: 'scheduled',
    startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
    location: 'Async briefing',
    metadata: {
      relatedEntityName: 'Creator partnership sprint',
      relatedEntityType: 'gig',
      ownerName: 'Gig programs',
      notes: 'Share campaign brief and analytics dashboard logins.',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: randomUUID(),
    workspaceId: 101,
    title: 'Mentorship intro: product leadership',
    eventType: 'mentorship',
    status: 'scheduled',
    startsAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() + 49 * 60 * 60 * 1000).toISOString(),
    location: 'Google Meet',
    metadata: {
      relatedEntityName: 'Growth mentorship',
      relatedEntityType: 'program',
      ownerName: 'Mentor success',
      notes: 'Share growth plan template.',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: randomUUID(),
    workspaceId: 101,
    title: 'Volunteer community briefing',
    eventType: 'volunteering',
    status: 'scheduled',
    startsAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() + 72.5 * 60 * 60 * 1000).toISOString(),
    location: 'Community center',
    metadata: {
      relatedEntityName: 'STEM Futures',
      relatedEntityType: 'volunteering',
      notes: 'Confirm background checks and travel logistics.',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function applyCors(response, request) {
  const origin = request.headers.origin || process.env.CALENDAR_STUB_FALLBACK_ORIGIN || 'http://localhost:4173';
  response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  response.setHeader(
    'Access-Control-Allow-Headers',
    request.headers['access-control-request-headers'] || 'content-type,authorization,x-user-id,x-roles',
  );
  response.setHeader('Vary', 'Origin');
}

function sendJson(response, request, statusCode, payload) {
  applyCors(response, request);
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

function sendNoContent(response, request) {
  applyCors(response, request);
  response.statusCode = 204;
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
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map((entry) => `${entry}`.trim()).filter(Boolean);
  }
  return `${value}`
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function filterEvents(list, { from, to, types, search }) {
  const fromTime = from ? new Date(from).getTime() : null;
  const toTime = to ? new Date(to).getTime() : null;
  const searchValue = search ? `${search}`.toLowerCase() : null;
  const typeFilter = normaliseTypes(types).filter((type) => SUPPORTED_EVENT_TYPES.includes(type));

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

function serializeEvent(event) {
  return {
    ...event,
    metadata: event.metadata || {},
  };
}

function handleListEvents(request, response, workspaceId, query) {
  const workspace = getWorkspace(workspaceId);
  if (!workspace) {
    sendJson(response, request, 404, { message: 'Workspace not found' });
    return;
  }

  const limit = query.get('limit') ? Number.parseInt(`${query.get('limit')}`, 10) : null;
  const filtered = filterEvents(
    events.filter((event) => event.workspaceId === workspaceId),
    {
      from: query.get('from'),
      to: query.get('to'),
      types: query.get('types'),
      search: query.get('search'),
    },
  );

  const grouped = groupEventsByType(filtered, limit);
  const summary = buildSummary(filtered);
  const filters = {
    from: query.get('from') || null,
    to: query.get('to') || null,
    types: normaliseTypes(query.get('types')),
    search: query.get('search') || '',
    limit: limit || undefined,
  };

  sendJson(response, request, 200, {
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
}

function handleCreateEvent(request, response, payload) {
  if (!payload?.workspaceId) {
    sendJson(response, request, 422, { message: 'workspaceId is required' });
    return;
  }
  if (!payload?.title) {
    sendJson(response, request, 422, { message: 'title is required' });
    return;
  }
  if (!payload?.startsAt) {
    sendJson(response, request, 422, { message: 'startsAt is required' });
    return;
  }

  const workspaceId = Number.parseInt(`${payload.workspaceId}`, 10);
  const workspace = getWorkspace(workspaceId);
  if (!workspace) {
    sendJson(response, request, 404, { message: 'Workspace not found' });
    return;
  }

  const event = {
    id: randomUUID(),
    workspaceId,
    title: `${payload.title}`.trim(),
    eventType: SUPPORTED_EVENT_TYPES.includes(payload.eventType) ? payload.eventType : 'project',
    status: payload.status && typeof payload.status === 'string' ? payload.status : 'scheduled',
    startsAt: new Date(payload.startsAt).toISOString(),
    endsAt: payload.endsAt ? new Date(payload.endsAt).toISOString() : null,
    location: payload.location ?? null,
    metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  events = [event, ...events.filter((existing) => existing.id !== event.id)];

  sendJson(response, request, 201, serializeEvent(event));
}

function handleUpdateEvent(request, response, id, payload) {
  const existingIndex = events.findIndex((event) => event.id === id);
  if (existingIndex === -1) {
    sendJson(response, request, 404, { message: 'Event not found' });
    return;
  }

  const existing = events[existingIndex];
  const updated = {
    ...existing,
    title: payload.title ? `${payload.title}`.trim() : existing.title,
    eventType: SUPPORTED_EVENT_TYPES.includes(payload.eventType) ? payload.eventType : existing.eventType,
    startsAt: payload.startsAt ? new Date(payload.startsAt).toISOString() : existing.startsAt,
    endsAt: payload.endsAt ? new Date(payload.endsAt).toISOString() : existing.endsAt,
    location: payload.location ?? existing.location,
    status: payload.status ?? existing.status,
    metadata:
      payload.metadata && typeof payload.metadata === 'object'
        ? { ...existing.metadata, ...payload.metadata }
        : existing.metadata,
    updatedAt: new Date().toISOString(),
  };

  events[existingIndex] = updated;
  sendJson(response, request, 200, serializeEvent(updated));
}

function handleDeleteEvent(request, response, id) {
  const existing = events.find((event) => event.id === id);
  if (!existing) {
    sendJson(response, request, 404, { message: 'Event not found' });
    return;
  }

  events = events.filter((event) => event.id !== id);
  sendNoContent(response, request);
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const pathname = url.pathname;

  if (request.method === 'OPTIONS') {
    applyCors(response, request);
    response.statusCode = 204;
    response.setHeader('Access-Control-Max-Age', '86400');
    response.end();
    return;
  }

  if (!pathname.startsWith('/api/company/calendar/events')) {
    sendJson(response, request, 404, { message: 'Not found' });
    return;
  }

  if (request.method === 'GET' && pathname === '/api/company/calendar/events') {
    const workspaceId = url.searchParams.get('workspaceId');
    if (!workspaceId) {
      sendJson(response, request, 400, { message: 'workspaceId query parameter is required' });
      return;
    }
    handleListEvents(request, response, Number.parseInt(`${workspaceId}`, 10), url.searchParams);
    return;
  }

  if (request.method === 'POST' && pathname === '/api/company/calendar/events') {
    try {
      const payload = await parseRequestBody(request);
      handleCreateEvent(request, response, payload);
    } catch (error) {
      sendJson(response, request, 400, { message: 'Invalid JSON payload', detail: error.message });
    }
    return;
  }

  const idMatch = pathname.match(/\/api\/company\/calendar\/events\/(?<id>[a-f0-9-]+)/i);
  const eventId = idMatch?.groups?.id;
  if (!eventId) {
    sendJson(response, request, 404, { message: 'Event not found' });
    return;
  }

  if (request.method === 'PATCH') {
    try {
      const payload = await parseRequestBody(request);
      handleUpdateEvent(request, response, eventId, payload || {});
    } catch (error) {
      sendJson(response, request, 400, { message: 'Invalid JSON payload', detail: error.message });
    }
    return;
  }

  if (request.method === 'DELETE') {
    handleDeleteEvent(request, response, eventId);
    return;
  }

  sendJson(response, request, 405, { message: 'Method not allowed' });
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`Calendar stub listening on http://${HOST}:${PORT}/api/company/calendar/events`);
});
