import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { jest } from '@jest/globals';

jest.unstable_mockModule('node-fetch', () => ({
  default: jest.fn(),
}));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sequelizeModulePath = path.join(__dirname, '..', '..', 'models', 'sequelizeClient.js');
const integrationModelsModulePath = path.join(__dirname, '..', '..', 'models', 'integrationEnvironmentModels.js');

const transactionMock = jest.fn(async (handler) => handler({ id: 'tx' }));
const noop = () => {};
const sequelizeMock = {
  transaction: (...args) => transactionMock(...args),
  getDialect: () => 'mysql',
  models: {},
  define: (name, attributes, options = {}) => {
    const model = {
      name,
      attributes,
      options,
      associations: {},
      hasMany: noop,
      belongsTo: noop,
      belongsToMany: noop,
      hasOne: noop,
      toJSON: () => ({}),
    };
    sequelizeMock.models[name] = model;
    return model;
  },
  addHook: noop,
  close: noop,
};

jest.unstable_mockModule(sequelizeModulePath, () => ({
  default: sequelizeMock,
  sequelize: sequelizeMock,
}));

const findOrCreateMock = jest.fn();
const createCheckMock = jest.fn();
const findAllChecksMock = jest.fn();

jest.unstable_mockModule(integrationModelsModulePath, () => ({
  IntegrationStubEnvironment: {
    findOrCreate: (...args) => findOrCreateMock(...args),
  },
  IntegrationStubEnvironmentCheck: {
    create: (...args) => createCheckMock(...args),
    findAll: (...args) => findAllChecksMock(...args),
  },
}));

let environmentState = null;
let historyState = [];

const resolveEnvironmentRecord = () => ({
  id: environmentState.id,
  slug: environmentState.slug,
  update: async (values) => {
    environmentState = { ...environmentState, ...values };
    return { ...environmentState };
  },
  toJSON: () => ({ ...environmentState }),
});

findOrCreateMock.mockImplementation(async ({ defaults }) => {
  if (!environmentState) {
    environmentState = { id: 1, slug: 'calendar-stub', ...defaults };
  }
  return [resolveEnvironmentRecord(), false];
});

createCheckMock.mockImplementation(async (payload) => {
  const entryId = (historyState?.length ?? 0) + 1;
  const entry = {
    ...payload,
    id: entryId,
    toJSON: () => ({ ...payload, id: entryId }),
  };
  historyState.unshift(entry);
  return entry;
});

findAllChecksMock.mockImplementation(async () =>
  historyState.map((entry) => ({ ...entry, toJSON: () => ({ ...entry }) })),
);

const fetch = (await import('node-fetch')).default;
const { resolveCalendarStubSettings, getCalendarStubEnvironment } = await import('../calendarStubEnvironmentService.js');

const ENV_KEYS = [
  'CALENDAR_STUB_BASE_URL',
  'CALENDAR_STUB_HOST',
  'CALENDAR_STUB_PORT',
  'CALENDAR_STUB_API_KEY',
  'CALENDAR_STUB_ALLOWED_ORIGINS',
  'CALENDAR_STUB_VIEW_ROLES',
  'CALENDAR_STUB_MANAGE_ROLES',
  'CALENDAR_STUB_DEFAULT_WORKSPACE_SLUG',
  'CALENDAR_STUB_DEFAULT_WORKSPACE_ID',
  'CALENDAR_STUB_FALLBACK_ORIGIN',
  'CLIENT_URL',
  'CALENDAR_STUB_RELEASE_CHANNEL',
  'CALENDAR_STUB_REGION',
  'CALENDAR_STUB_BUILD_NUMBER',
  'CALENDAR_STUB_OWNER_TEAM',
  'CALENDAR_STUB_VERSION',
];

const originalEnv = {};
ENV_KEYS.forEach((key) => {
  originalEnv[key] = process.env[key];
});

describe('calendarStubEnvironmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    environmentState = null;
    historyState = [];
    process.env.CALENDAR_STUB_BASE_URL = 'http://localhost:4010';
    process.env.CALENDAR_STUB_API_KEY = 'integration-key';
    process.env.CALENDAR_STUB_ALLOWED_ORIGINS = 'http://localhost:4173';
    process.env.CALENDAR_STUB_VIEW_ROLES = 'calendar:view,platform:admin';
    process.env.CALENDAR_STUB_MANAGE_ROLES = 'calendar:manage';
    process.env.CALENDAR_STUB_DEFAULT_WORKSPACE_SLUG = 'acme-talent-hub';
    process.env.CALENDAR_STUB_DEFAULT_WORKSPACE_ID = '101';
    process.env.CALENDAR_STUB_FALLBACK_ORIGIN = 'http://localhost:4173';
    process.env.CALENDAR_STUB_RELEASE_CHANNEL = 'stable';
    process.env.CALENDAR_STUB_REGION = 'us-central';
    process.env.CALENDAR_STUB_BUILD_NUMBER = '2024.10.1';
    process.env.CALENDAR_STUB_OWNER_TEAM = 'Integrations Platform';
    process.env.CALENDAR_STUB_VERSION = '2024.10';
  });

  afterEach(() => {
    ENV_KEYS.forEach((key) => {
      if (originalEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnv[key];
      }
    });
  });

  it('normalises stub settings from environment variables', () => {
    const env = {
      CALENDAR_STUB_BASE_URL: 'http://stub:4015/',
      CALENDAR_STUB_ALLOWED_ORIGINS: 'https://app.example,https://admin.example',
      CALENDAR_STUB_VIEW_ROLES: 'Calendar:View,Platform:Admin',
      CALENDAR_STUB_MANAGE_ROLES: 'calendar:manage',
      CALENDAR_STUB_DEFAULT_WORKSPACE_ID: '205',
      CALENDAR_STUB_DEFAULT_WORKSPACE_SLUG: 'alpha-hub',
      CALENDAR_STUB_API_KEY: 'secret-key',
      CALENDAR_STUB_FALLBACK_ORIGIN: 'https://app.example',
    };

    const settings = resolveCalendarStubSettings(env);
    expect(settings.baseUrl).toBe('http://stub:4015');
    expect(settings.metadataEndpoint).toBe('http://stub:4015/api/system/calendar-meta');
    expect(settings.eventsEndpoint).toBe('http://stub:4015/api/company/calendar/events');
    expect(settings.viewRoles).toEqual(['calendar:view', 'platform:admin']);
    expect(settings.manageRoles).toEqual(['calendar:manage']);
    expect(settings.workspaceId).toBe(205);
    expect(settings.workspaceSlug).toBe('alpha-hub');
    expect(settings.apiKey).toBe('secret-key');
    expect(settings.fallbackOrigin).toBe('https://app.example');
  });

  it('returns connected metadata when the stub responds successfully', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        stub: {
          service: 'calendar-stub',
          version: '2024.10',
          allowedOrigins: ['http://localhost:4173'],
          fallbackOrigin: 'http://localhost:4173',
          latency: { minMs: 0, maxMs: 120 },
          defaults: { windowDays: 30, lookaheadDays: 45, limit: 250, maxLimit: 500 },
          scenarios: ['normal', 'rate-limit'],
          availableWorkspaces: [
            {
              id: 101,
              slug: 'acme-talent-hub',
              name: 'Acme Talent Hub',
              timezone: 'UTC',
              membershipRole: 'admin',
              upcomingEvents: 6,
              nextEventStartsAt: '2024-05-02T09:00:00.000Z',
            },
          ],
          generatedAt: '2024-05-01T12:00:00Z',
          requiredHeaders: { view: ['x-roles'], manage: ['x-roles', 'x-user-id'] },
          workspaceSummary: {
            totalWorkspaces: 1,
            totalEvents: 6,
            defaultWorkspace: {
              id: 101,
              slug: 'acme-talent-hub',
              name: 'Acme Talent Hub',
              timezone: 'UTC',
            },
            defaultWorkspaceSlug: 'acme-talent-hub',
            defaultWorkspaceId: 101,
          },
          deployment: {
            releaseChannel: 'stable',
            region: 'us-central',
            buildNumber: '2024.10.1',
            ownerTeam: 'Integrations Platform',
            version: '2024.10',
          },
          telemetry: {
            uptimeSeconds: 1024,
            scenarioCount: 2,
            totalEvents: 6,
            lastEventStartsAt: '2024-05-02T09:00:00.000Z',
            calculatedAt: '2024-05-01T12:00:00Z',
          },
          headerExamples: {
            view: { 'x-roles': 'calendar:view', 'x-api-key': 'REDACTED' },
            manage: { 'x-roles': 'calendar:view,calendar:manage', 'x-api-key': 'REDACTED', 'x-user-id': '<operator>' },
          },
        },
      }),
    });

    const result = await getCalendarStubEnvironment();
    expect(result.status).toBe('connected');
    expect(result.metadata.scenarios).toContain('normal');
    expect(result.metadata.availableWorkspaces[0].slug).toBe('acme-talent-hub');
    expect(result.config.apiKeyPreview).toBe('inte…ey');
    expect(result.metadata.workspaceSummary.totalEvents).toBe(6);
    expect(result.metadata.telemetry.uptimeSeconds).toBe(1024);
    expect(result.metadata.deployment.ownerTeam).toBe('Integrations Platform');
    expect(result.metadata.headerExamples.manage['x-user-id']).toBe('<operator>');
    expect(transactionMock).toHaveBeenCalled();
    expect(findOrCreateMock).toHaveBeenCalled();
    expect(createCheckMock).toHaveBeenCalled();
    expect(findAllChecksMock).toHaveBeenCalled();
    expect(result.persisted.lastStatus).toBe('connected');
    expect(result.persisted.releaseChannel).toBe('stable');
    expect(result.persisted.ownerTeam).toBe('Integrations Platform');
    expect(result.persisted.version).toBe('2024.10');
    expect(result.persisted.lastSuccessfulCheckAt).toBe(result.checkedAt);
    expect(result.history).toHaveLength(1);
    expect(result.history[0].status).toBe('connected');
    expect(result.history[0].telemetry.totalEvents).toBe(6);
    expect(result.history[0].deployment.releaseChannel).toBe('stable');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:4010/api/system/calendar-meta',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('returns error state when the stub is unreachable', async () => {
    fetch.mockRejectedValueOnce(new Error('connect ECONNREFUSED 127.0.0.1:4010'));

    const result = await getCalendarStubEnvironment();
    expect(result.status).toBe('error');
    expect(result.error).toContain('ECONNREFUSED');
    expect(result.config.requiresApiKey).toBe(true);
    expect(result.persisted.lastStatus).toBe('error');
    expect(result.history).toHaveLength(1);
    expect(result.history[0].status).toBe('error');
  });
});
