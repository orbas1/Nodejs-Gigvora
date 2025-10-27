import { after, afterEach, before, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

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
  assert.ok(Array.isArray(payload.events), 'events list should be returned');
  assert.strictEqual(payload.workspace.slug, 'acme-talent-hub');
  assert.ok(payload.filters.from && payload.filters.to, 'filters should include window bounds');
  const [firstEvent] = payload.events;
  assert.ok(firstEvent, 'expected at least one event payload');
  assert.ok(['scheduled', 'in_progress', 'completed'].includes(firstEvent.status));
  assert.ok(Object.prototype.hasOwnProperty.call(firstEvent, 'durationMinutes'));
  assert.ok(
    payload.meta.availableWorkspaces.some((workspace) => workspace.slug === 'acme-talent-hub'),
    'available workspaces should include the requested slug',
  );
});

test('creates a new event with manage permissions', async () => {
  const startsAt = new Date(Date.now() + 60 * 60 * 1000);
  const endsAt = new Date(startsAt.getTime() + 45 * 60 * 1000);
  const createResponse = await fetch(`${baseUrl}/api/company/calendar/events`, {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json', 'x-roles': 'calendar:manage' }),
    body: JSON.stringify({
      workspaceId: 101,
      title: 'Test sync meeting',
      eventType: 'gig',
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      metadata: { ownerName: 'QA Automation', notes: 'Local scenario validation' },
    }),
  });
  assert.strictEqual(createResponse.status, 201);
  const created = await createResponse.json();
  assert.ok(Number.isInteger(created.id), 'event id should be numeric');
  assert.strictEqual(created.eventType, 'gig');
  assert.strictEqual(created.status, 'scheduled');
  assert.strictEqual(created.metadata.ownerName, 'QA Automation');
  assert.strictEqual(created.durationMinutes, 45);

  const listResponse = await fetch(`${baseUrl}/api/company/calendar/events?workspaceSlug=acme-talent-hub`, {
    headers: buildHeaders({ 'x-roles': 'calendar:view', 'x-user-id': undefined }),
  });
  const listPayload = await listResponse.json();
  const gigEvents = listPayload.eventsByType.gig || [];
  assert.ok(gigEvents.some((event) => event.id === created.id));
  assert.ok(listPayload.events.some((event) => event.id === created.id));
});

test('exposes slug filtering and default window range', async () => {
  const response = await fetch(`${baseUrl}/api/company/calendar/events?workspaceSlug=acme-talent-hub`, {
    headers: buildHeaders({ 'x-roles': 'calendar:view', 'x-user-id': undefined }),
  });
  assert.strictEqual(response.status, 200);
  const payload = await response.json();
  assert.strictEqual(payload.filters.workspaceSlug, 'acme-talent-hub');
  const from = new Date(payload.filters.from);
  const to = new Date(payload.filters.to);
  assert.ok(from < to, 'window range should be valid');
});

test('returns individual events with workspace context', async () => {
  const [seedEvent] = baselineEvents;
  const response = await fetch(`${baseUrl}/api/company/calendar/events/${seedEvent.id}`, {
    headers: buildHeaders({ 'x-roles': 'calendar:view', 'x-user-id': undefined }),
  });
  assert.strictEqual(response.status, 200);
  const payload = await response.json();
  assert.strictEqual(`${payload.event.id}`, `${seedEvent.id}`);
  assert.ok(payload.event.status);
  assert.strictEqual(payload.workspace.slug, 'acme-talent-hub');
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

test('allows scenario toggles to force rate limits', async () => {
  const response = await fetch(
    `${baseUrl}/api/company/calendar/events?workspaceId=101&scenario=rate-limit`,
    {
      headers: buildHeaders({ 'x-roles': 'calendar:view', 'x-user-id': undefined }),
    },
  );
  assert.strictEqual(response.status, 429);
  const payload = await response.json();
  assert.strictEqual(payload.retryAfterSeconds, 30);
});

test('invokes a custom latency provider for event requests', async () => {
  let invoked = false;
  const latencyApp = createCalendarServer({
    logger: { info: () => {} },
    latencyProvider: async () => {
      invoked = true;
      return 0;
    },
  });

  await new Promise((resolve) => latencyApp.listen(0, '127.0.0.1', resolve));
  const latencyAddress = latencyApp.server.address();

  try {
    const response = await fetch(
      `http://127.0.0.1:${latencyAddress.port}/api/company/calendar/events?workspaceId=101`,
      {
        headers: buildHeaders({ 'x-roles': 'calendar:view', 'x-user-id': undefined }),
      },
    );
    assert.strictEqual(response.status, 200);
    assert.ok(invoked, 'expected latency provider to be invoked');
  } finally {
    await new Promise((resolve, reject) => {
      latencyApp.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('supports dynamic workspace fixtures', async () => {
  const customWorkspaces = [{ id: 777, slug: 'qa-workspace', name: 'QA Workspace', timezone: 'Europe/London' }];
  const customEvents = [
    {
      workspaceId: 777,
      title: 'QA sync-up',
      eventType: 'project',
      startsAt: new Date(Date.now() + 3_600_000).toISOString(),
    },
  ];

  const customApp = createCalendarServer({
    logger: { info: () => {} },
    workspaces: customWorkspaces,
    seedEvents: customEvents,
  });

  await new Promise((resolve) => customApp.listen(0, '127.0.0.1', resolve));
  const customAddress = customApp.server.address();

  try {
    const response = await fetch(
      `http://127.0.0.1:${customAddress.port}/api/company/calendar/events?workspaceSlug=qa-workspace`,
      {
        headers: buildHeaders({ 'x-roles': 'calendar:view', 'x-user-id': undefined }),
      },
    );
    assert.strictEqual(response.status, 200);
    const payload = await response.json();
    assert.strictEqual(payload.workspace.name, 'QA Workspace');
    assert.strictEqual(payload.workspace.slug, 'qa-workspace');
    assert.ok(
      Array.isArray(payload.eventsByType.project) &&
        payload.eventsByType.project.some((event) => event.title === 'QA sync-up'),
    );
  } finally {
    await new Promise((resolve, reject) => {
      customApp.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('loads combined dataset files with workspaces and events', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'calendar-stub-dataset-'));
  const datasetPath = path.join(tmpDir, 'dataset.json');
  const now = new Date();
  const dataset = {
    workspaces: [{ id: 888, slug: 'dataset-hub', name: 'Dataset Hub', timezone: 'UTC' }],
    events: [
      {
        id: 123,
        workspaceId: 888,
        title: 'Dataset sync review',
        eventType: 'project',
        startsAt: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
        endsAt: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
        metadata: { ownerName: 'Dataset QA' },
      },
    ],
  };
  fs.writeFileSync(datasetPath, JSON.stringify(dataset), 'utf8');

  const datasetApp = createCalendarServer({
    logger: { info: () => {}, error: () => {} },
    eventsFile: datasetPath,
    workspaces: datasetPath,
  });

  await new Promise((resolve) => datasetApp.listen(0, '127.0.0.1', resolve));
  const address = datasetApp.server.address();

  try {
    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/company/calendar/events?workspaceSlug=dataset-hub`,
      {
        headers: buildHeaders({ 'x-roles': 'calendar:view', 'x-user-id': undefined }),
      },
    );
    assert.strictEqual(response.status, 200);
    const payload = await response.json();
    assert.strictEqual(payload.workspace.slug, 'dataset-hub');
    assert.ok(payload.events.some((event) => event.title === 'Dataset sync review'));
  } finally {
    await new Promise((resolve, reject) => {
      datasetApp.close((error) => (error ? reject(error) : resolve()));
    });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('persists events and workspaces to disk when configured', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'calendar-stub-persist-'));
  const persistPath = path.join(tmpDir, 'persist.json');
  const customWorkspaces = [{ id: 555, slug: 'persist-hub', name: 'Persist Hub', timezone: 'UTC' }];

  const persistApp = createCalendarServer({
    logger: { info: () => {}, error: () => {} },
    seedEvents: [],
    workspaces: customWorkspaces,
    persistPath,
  });

  await new Promise((resolve) => persistApp.listen(0, '127.0.0.1', resolve));
  const address = persistApp.server.address();

  try {
    const startsAt = new Date(Date.now() + 90 * 60 * 1000);
    const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);
    const createResponse = await fetch(`http://127.0.0.1:${address.port}/api/company/calendar/events`, {
      method: 'POST',
      headers: buildHeaders({ 'Content-Type': 'application/json', 'x-roles': 'calendar:manage' }),
      body: JSON.stringify({
        workspaceId: 555,
        title: 'Persisted sync',
        eventType: 'gig',
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      }),
    });
    assert.strictEqual(createResponse.status, 201);
    const created = await createResponse.json();

    const firstSnapshot = JSON.parse(fs.readFileSync(persistPath, 'utf8'));
    assert.ok(Array.isArray(firstSnapshot.events));
    assert.strictEqual(firstSnapshot.events.length, 1);
    assert.strictEqual(firstSnapshot.events[0].title, 'Persisted sync');
    assert.ok(Array.isArray(firstSnapshot.workspaces));
    assert.ok(firstSnapshot.workspaces.some((workspace) => workspace.slug === 'persist-hub'));
    assert.ok(firstSnapshot.meta?.generatedAt);

    const patchResponse = await fetch(
      `http://127.0.0.1:${address.port}/api/company/calendar/events/${created.id}`,
      {
        method: 'PATCH',
        headers: buildHeaders({ 'Content-Type': 'application/json', 'x-roles': 'calendar:manage' }),
        body: JSON.stringify({ status: 'completed', metadata: { notes: 'QA review complete' } }),
      },
    );
    assert.strictEqual(patchResponse.status, 200);

    const updatedSnapshot = JSON.parse(fs.readFileSync(persistPath, 'utf8'));
    const [updatedEvent] = updatedSnapshot.events;
    assert.strictEqual(updatedEvent.status, 'completed');
    assert.strictEqual(updatedEvent.metadata.notes, 'QA review complete');

    const deleteResponse = await fetch(
      `http://127.0.0.1:${address.port}/api/company/calendar/events/${created.id}`,
      {
        method: 'DELETE',
        headers: buildHeaders({ 'x-roles': 'calendar:manage' }),
      },
    );
    assert.strictEqual(deleteResponse.status, 204);

    const finalSnapshot = JSON.parse(fs.readFileSync(persistPath, 'utf8'));
    assert.ok(Array.isArray(finalSnapshot.events));
    assert.strictEqual(finalSnapshot.events.length, 0);
  } finally {
    await new Promise((resolve, reject) => {
      persistApp.close((error) => (error ? reject(error) : resolve()));
    });
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
