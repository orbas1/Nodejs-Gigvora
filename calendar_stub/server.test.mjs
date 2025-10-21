import { after, afterEach, before, test } from 'node:test';
import assert from 'node:assert/strict';

import { createCalendarServer } from './server.mjs';

const API_KEY = 'test-api-key';
const ALLOWED_ORIGIN = 'http://localhost:4173';

let app;
let baseUrl;
let baselineEvents;

before(async () => {
  process.env.CALENDAR_STUB_API_KEY = API_KEY;
  process.env.CALENDAR_STUB_ALLOWED_ORIGINS = ALLOWED_ORIGIN;
  app = createCalendarServer({
    logger: { info: () => {} },
  });
  await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve));
  const address = app.server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
  baselineEvents = app.getEvents().map((event) => ({
    ...event,
    metadata: structuredClone(event.metadata),
  }));
});

afterEach(() => {
  app.resetEvents(baselineEvents);
});

after(async () => {
  await new Promise((resolve, reject) => {
    app.close((error) => (error ? reject(error) : resolve()));
  });
  delete process.env.CALENDAR_STUB_API_KEY;
  delete process.env.CALENDAR_STUB_ALLOWED_ORIGINS;
});

function buildHeaders(overrides = {}) {
  const headers = {
    Origin: ALLOWED_ORIGIN,
    'x-api-key': API_KEY,
    'x-roles': 'calendar:view,calendar:manage',
    'x-user-id': '999',
  };

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined || value === null) {
      delete headers[key];
    } else {
      headers[key] = value;
    }
  }

  return headers;
}

test('rejects requests without API key', async () => {
  const response = await fetch(`${baseUrl}/api/company/calendar/events?workspaceId=101`, {
    headers: {
      Origin: ALLOWED_ORIGIN,
      'x-roles': 'calendar:view',
    },
  });
  assert.strictEqual(response.status, 401);
});

test('rejects requests without required roles', async () => {
  const response = await fetch(`${baseUrl}/api/company/calendar/events?workspaceId=101`, {
    headers: {
      Origin: ALLOWED_ORIGIN,
      'x-api-key': API_KEY,
    },
  });
  assert.strictEqual(response.status, 403);
});

test('returns events when authorised', async () => {
  const response = await fetch(`${baseUrl}/api/company/calendar/events?workspaceId=101`, {
    headers: buildHeaders({ 'x-roles': 'calendar:view', 'x-user-id': undefined }),
  });
  assert.strictEqual(response.status, 200);
  const payload = await response.json();
  assert.ok(payload.summary.totalEvents >= 1, 'expected at least one seeded event');
  assert.ok(Array.isArray(payload.eventsByType.project));
});

test('creates a new event with manage permissions', async () => {
  const startsAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const createResponse = await fetch(`${baseUrl}/api/company/calendar/events`, {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json', 'x-roles': 'calendar:manage' }),
    body: JSON.stringify({
      workspaceId: 101,
      title: 'Test sync meeting',
      eventType: 'gig',
      startsAt,
      metadata: { createdBy: 'tests' },
    }),
  });
  assert.strictEqual(createResponse.status, 201);
  const created = await createResponse.json();
  assert.ok(created.id, 'event id should be returned');
  assert.strictEqual(created.eventType, 'gig');

  const listResponse = await fetch(`${baseUrl}/api/company/calendar/events?workspaceId=101`, {
    headers: buildHeaders({ 'x-roles': 'calendar:view', 'x-user-id': undefined }),
  });
  const listPayload = await listResponse.json();
  const gigEvents = listPayload.eventsByType.gig || [];
  assert.ok(gigEvents.some((event) => event.id === created.id));
});

test('rejects requests from disallowed origins', async () => {
  const response = await fetch(`${baseUrl}/api/company/calendar/events?workspaceId=101`, {
    headers: {
      Origin: 'https://malicious.example',
      'x-api-key': API_KEY,
      'x-roles': 'calendar:view',
    },
  });
  assert.strictEqual(response.status, 403);
});
