import { jest } from '@jest/globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fetchMock = jest.fn();

await jest.unstable_mockModule('node-fetch', () => ({
  default: jest.fn((...args) => fetchMock(...args)),
}));

const serviceModulePath = path.resolve(__dirname, '../../src/services/stubEnvironmentService.js');

async function importServiceModule() {
  jest.resetModules();
  return import(serviceModulePath);
}

describe('stubEnvironmentService', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    delete process.env.CALENDAR_STUB_HOST;
    delete process.env.CALENDAR_STUB_PORT;
    delete process.env.CALENDAR_STUB_ALLOWED_ORIGINS;
    delete process.env.CALENDAR_STUB_FALLBACK_ORIGIN;
    delete process.env.CALENDAR_STUB_VIEW_ROLES;
    delete process.env.CALENDAR_STUB_MANAGE_ROLES;
    delete process.env.CALENDAR_STUB_MIN_LATENCY_MS;
    delete process.env.CALENDAR_STUB_MAX_LATENCY_MS;
    delete process.env.CALENDAR_STUB_API_KEY;
    delete process.env.CALENDAR_STUB_EVENTS_FILE;
    delete process.env.CALENDAR_STUB_WORKSPACES_FILE;
    delete process.env.CALENDAR_STUB_EXTRA_SCENARIOS;
    delete process.env.CALENDAR_STUB_HEALTH_LOG_FILE;
    delete process.env.CALENDAR_STUB_SCENARIO_DETAILS_FILE;
  });

  it('returns calendar stub metadata with default configuration', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
    });

    const { getStubEnvironmentCatalog } = await importServiceModule();
    const result = await getStubEnvironmentCatalog({ includeHealth: true });

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:4010/health', expect.any(Object));
    expect(result.meta.count).toBe(1);

    const environment = result.environments[0];
    expect(environment.baseUrl).toBe('http://localhost:4010');
    expect(environment.workspaceCount).toBeGreaterThan(0);
    expect(environment.eventCount).toBeGreaterThan(0);
    expect(environment.roles.view).toEqual(
      expect.arrayContaining(['calendar:view', 'calendar:manage', 'platform:admin']),
    );
    expect(environment.health.status).toBe('online');
    expect(environment.scenarios).toEqual(expect.arrayContaining(['rate-limit', 'forbidden', 'server-error']));
    expect(environment.observability).toEqual(
      expect.objectContaining({
        sampleSize: expect.any(Number),
      }),
    );
  });

  it('reflects runtime configuration and handles offline health checks', async () => {
    process.env.CALENDAR_STUB_HOST = 'stub.local';
    process.env.CALENDAR_STUB_PORT = '4501';
    process.env.CALENDAR_STUB_ALLOWED_ORIGINS = 'https://app.gigvora.test,https://admin.gigvora.test';
    process.env.CALENDAR_STUB_FALLBACK_ORIGIN = 'https://app.gigvora.test';
    process.env.CALENDAR_STUB_VIEW_ROLES = 'calendar:view,calendar:manage';
    process.env.CALENDAR_STUB_MANAGE_ROLES = 'calendar:manage';
    process.env.CALENDAR_STUB_MIN_LATENCY_MS = '125';
    process.env.CALENDAR_STUB_MAX_LATENCY_MS = '420';
    process.env.CALENDAR_STUB_API_KEY = 'secret-key';
    process.env.CALENDAR_STUB_EXTRA_SCENARIOS = 'chaos';

    fetchMock.mockRejectedValue(new Error('connect ECONNREFUSED'));

    const { getStubEnvironmentCatalog } = await importServiceModule();
    const result = await getStubEnvironmentCatalog({ includeHealth: true });
    const environment = result.environments[0];

    expect(environment.baseUrl).toBe('http://stub.local:4501');
    expect(environment.allowedOrigins).toEqual([
      'https://app.gigvora.test',
      'https://admin.gigvora.test',
    ]);
    expect(environment.latency).toEqual({ minMs: 125, maxMs: 420, configurable: true });
    expect(environment.requiresApiKey).toBe(true);
    expect(environment.roles.manage).toEqual(['calendar:manage']);
    expect(environment.scenarios).toEqual(expect.arrayContaining(['chaos', 'rate-limit']));
    expect(environment.health.status).toBe('offline');
    expect(environment.health.error).toBeDefined();
  });

  it('enriches catalog with observability metrics and scenario catalog data', async () => {
    process.env.CALENDAR_STUB_HEALTH_LOG_FILE = path.resolve(
      __dirname,
      '../fixtures/stub/health-history.json',
    );
    process.env.CALENDAR_STUB_SCENARIO_DETAILS_FILE = path.resolve(
      __dirname,
      '../fixtures/stub/scenario-catalog.json',
    );
    process.env.CALENDAR_STUB_EXTRA_SCENARIOS = 'latency';

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok', latencyMs: 160 }),
    });

    const { getStubEnvironmentCatalog } = await importServiceModule();
    const result = await getStubEnvironmentCatalog({ includeHealth: true });
    const environment = result.environments[0];

    expect(environment.healthHistory.length).toBeGreaterThan(0);
    expect(environment.observability).toEqual(
      expect.objectContaining({
        uptimeLast24h: expect.any(Number),
        averageLatencyMs: expect.any(Number),
        sampleSize: expect.any(Number),
      }),
    );
    expect(environment.scenarioDetails).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'rate-limit', label: 'Premium rate limit' }),
        expect.objectContaining({ id: 'latency', label: 'Latency spike' }),
      ]),
    );
    expect(environment.insights.events).toEqual(
      expect.objectContaining({
        topEventTypes: expect.any(Array),
        workspaceDensity: expect.any(Array),
      }),
    );
  });
});
