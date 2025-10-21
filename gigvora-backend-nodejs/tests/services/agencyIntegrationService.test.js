import { jest } from '@jest/globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockRandomBytes = jest.fn(() => Buffer.alloc(32, 'a'));
const mockPbkdf2Sync = jest.fn(() => Buffer.from('hashed-secret', 'utf8'));

await jest.unstable_mockModule('crypto', () => ({
  default: {
    randomBytes: mockRandomBytes,
    pbkdf2Sync: mockPbkdf2Sync,
  },
}));

const modelsModulePath = path.resolve(__dirname, '../../src/models/index.js');

const ProviderWorkspace = { findAll: jest.fn() };
const ProviderWorkspaceMember = { findAll: jest.fn(), findOne: jest.fn(), count: jest.fn() };
const WorkspaceIntegration = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
};
const WorkspaceIntegrationSecret = {
  findOne: jest.fn(),
  create: jest.fn(),
  count: jest.fn(),
};
const WorkspaceIntegrationWebhook = {
  create: jest.fn(),
  findByPk: jest.fn(),
  findOne: jest.fn(),
};
const WorkspaceIntegrationAuditLog = {
  create: jest.fn(),
  findAll: jest.fn(),
};
const User = {};

await jest.unstable_mockModule(modelsModulePath, () => ({
  ProviderWorkspace,
  ProviderWorkspaceMember,
  WorkspaceIntegration,
  WorkspaceIntegrationSecret,
  WorkspaceIntegrationWebhook,
  WorkspaceIntegrationAuditLog,
  User,
}));

const serviceModulePath = path.resolve(__dirname, '../../src/services/agencyIntegrationService.js');

const {
  listIntegrations,
  createIntegration,
  updateIntegration,
  rotateSecret,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testIntegrationConnection,
} = await import(serviceModulePath);

const baseWorkspace = {
  id: 99,
  name: 'Stellar Agency',
  slug: 'stellar-agency',
  type: 'agency',
  timezone: 'UTC',
  defaultCurrency: 'USD',
  ownerId: 7,
  isActive: true,
};

function createIntegrationInstance(overrides = {}) {
  const state = {
    id: 501,
    workspaceId: baseWorkspace.id,
    providerKey: 'salesforce',
    displayName: 'Salesforce Sync',
    category: 'other',
    status: 'connected',
    syncFrequency: 'hourly',
    lastSyncedAt: '2024-01-01T00:00:00.000Z',
    metadata: {
      owner: 'Operations',
      environment: 'production',
      regions: ['us'],
      scopes: ['api'],
      channels: ['updates'],
      connectionMode: 'api',
      notes: 'Initial setup',
      incidents: [],
      webhookPolicy: null,
      lastConnectionTestAt: '2024-01-01T02:00:00.000Z',
    },
    secrets: [],
    webhooks: [],
    workspace: { ...baseWorkspace },
    ...overrides,
  };

  const instance = {
    ...state,
    update: jest.fn(async (updates) => {
      Object.assign(state, updates);
      Object.assign(instance, state);
    }),
    get: ({ plain } = {}) => (plain ? { ...state } : instance),
  };

  return instance;
}

function createSecretInstance(overrides = {}) {
  const state = {
    id: 801,
    name: 'API Credential',
    secretType: 'api_key',
    lastFour: '1234',
    version: 1,
    lastRotatedAt: '2024-01-01T00:00:00.000Z',
    rotatedBy: {
      id: 201,
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T01:00:00.000Z',
    ...overrides,
  };

  const instance = {
    ...state,
    update: jest.fn(async (updates) => {
      Object.assign(state, updates);
      Object.assign(instance, state);
    }),
    get: ({ plain } = {}) => (plain ? { ...state } : instance),
  };

  return instance;
}

function createWebhookInstance(overrides = {}) {
  const state = {
    id: 901,
    integrationId: 501,
    secretId: 801,
    name: 'Project Lifecycle',
    status: 'active',
    targetUrl: 'https://hooks.example.com/project',
    eventTypes: ['project.created'],
    verificationToken: 'verify-token',
    metadata: { retries: 0 },
    secret: createSecretInstance({ id: 9011, name: 'Webhook Secret' }).get({ plain: true }),
    createdBy: {
      id: 42,
      firstName: 'Jules',
      lastName: 'Verne',
      email: 'jules@example.com',
    },
    lastTriggeredAt: '2024-01-01T03:00:00.000Z',
    lastErrorAt: null,
    createdAt: '2024-01-01T01:00:00.000Z',
    updatedAt: '2024-01-01T02:00:00.000Z',
    ...overrides,
  };

  const instance = {
    ...state,
    update: jest.fn(async (updates) => {
      Object.assign(state, updates);
      Object.assign(instance, state);
    }),
    destroy: jest.fn(async () => {}),
    get: ({ plain } = {}) => (plain ? { ...state } : instance),
  };

  return instance;
}

function createAuditLogEntry(overrides = {}) {
  const state = {
    id: 3001,
    integrationId: 501,
    eventType: 'integration_created',
    summary: 'Integration connected',
    detail: { ok: true },
    actor: {
      id: 12,
      firstName: 'Casey',
      lastName: 'Taylor',
      email: 'casey@example.com',
    },
    createdAt: '2024-01-01T05:00:00.000Z',
    ...overrides,
  };

  return {
    get: ({ plain } = {}) => (plain ? { ...state } : state),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  ProviderWorkspace.findAll.mockResolvedValue([baseWorkspace]);
  ProviderWorkspaceMember.findAll.mockResolvedValue([]);
  ProviderWorkspaceMember.findOne.mockResolvedValue({ id: 1 });
  ProviderWorkspaceMember.count.mockResolvedValue(1);
  WorkspaceIntegration.findAll.mockResolvedValue([]);
  WorkspaceIntegration.findOne.mockResolvedValue(null);
  WorkspaceIntegration.findByPk.mockReset();
  WorkspaceIntegration.create.mockReset();
  WorkspaceIntegrationSecret.findOne.mockReset();
  WorkspaceIntegrationSecret.create.mockReset();
  WorkspaceIntegrationSecret.count.mockResolvedValue(1);
  WorkspaceIntegrationWebhook.create.mockReset();
  WorkspaceIntegrationWebhook.findByPk.mockReset();
  WorkspaceIntegrationWebhook.findOne.mockReset();
  WorkspaceIntegrationAuditLog.create.mockReset();
  WorkspaceIntegrationAuditLog.findAll.mockResolvedValue([]);

  WorkspaceIntegrationSecret.create.mockImplementation(async (attrs = {}) =>
    createSecretInstance({
      ...attrs,
      rotatedBy:
        attrs.rotatedBy ??
        (attrs.rotatedById != null
          ? { id: attrs.rotatedById, firstName: 'System', lastName: 'User', email: 'system@example.com' }
          : undefined),
    }),
  );
});

describe('agencyIntegrationService', () => {
  test('listIntegrations returns sanitized connectors and summary for admins', async () => {
    const integrationPlain = {
      ...createIntegrationInstance().get({ plain: true }),
      secrets: [createSecretInstance().get({ plain: true })],
      webhooks: [createWebhookInstance().get({ plain: true })],
    };

    WorkspaceIntegration.findAll.mockResolvedValue([
      {
        get: ({ plain } = {}) => (plain ? integrationPlain : integrationPlain),
      },
    ]);

    WorkspaceIntegrationAuditLog.findAll.mockResolvedValue([
      createAuditLogEntry({ eventType: 'integration_updated', summary: 'Settings changed' }),
    ]);

    const result = await listIntegrations({}, { actorId: 22, actorRole: 'admin' });

    expect(result.connectors).toHaveLength(1);
    expect(result.connectors[0]).toMatchObject({
      id: integrationPlain.id,
      displayName: integrationPlain.displayName,
      secrets: [
        expect.objectContaining({
          id: integrationPlain.secrets[0].id,
          lastFour: '1234',
          rotatedBy: expect.objectContaining({ name: 'Ada Lovelace', email: 'ada@example.com' }),
        }),
      ],
      webhooks: [
        expect.objectContaining({
          id: integrationPlain.webhooks[0].id,
          eventTypes: ['project.created'],
          secret: expect.objectContaining({ id: 9011 }),
        }),
      ],
    });

    expect(result.meta.summary).toMatchObject({
      total: 1,
      connected: 1,
      secrets: 1,
      webhooks: 1,
      lastConnectionTestAt: '2024-01-01T02:00:00.000Z',
    });

    expect(result.meta.availableProviders.find((provider) => provider.key === 'salesforce')).toBeTruthy();
    expect(result.auditLog).toHaveLength(1);
    expect(result.auditLog[0]).toMatchObject({
      eventType: 'integration_updated',
      summary: 'Settings changed',
      actor: expect.objectContaining({ name: 'Casey Taylor' }),
    });
  });

  test('createIntegration persists a new integration and records an audit entry', async () => {
    const createdIntegration = createIntegrationInstance({
      id: 777,
      providerKey: 'slack',
      displayName: 'Slack Daily Sync',
      category: 'communication',
      status: 'connected',
      syncFrequency: 'daily',
      metadata: {
        owner: 'Operations',
        environment: 'production',
        regions: ['us'],
        scopes: ['chat:write', 'channels:read'],
        channels: ['alerts'],
        connectionMode: 'api',
        notes: 'Keep leadership updated',
        incidents: [],
        webhookPolicy: null,
        lastConnectionTestAt: null,
      },
      secrets: [],
      webhooks: [],
    });

    WorkspaceIntegration.create.mockResolvedValue({
      get: ({ plain } = {}) => (plain ? createdIntegration.get({ plain: true }) : createdIntegration),
    });

    const result = await createIntegration(
      {
        providerKey: 'slack',
        displayName: 'Slack Daily Sync',
        status: 'connected',
        syncFrequency: 'daily',
        metadata: {
          owner: 'Operations',
          environment: 'production',
          regions: ['us', 'us'],
          scopes: 'chat:write, channels:read',
          channels: ['alerts', 'alerts'],
          notes: 'Keep leadership updated',
        },
      },
      { actorId: 88, actorRole: 'admin' },
    );

    expect(WorkspaceIntegration.create).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: baseWorkspace.id,
        providerKey: 'slack',
        displayName: 'Slack Daily Sync',
        category: 'communication',
        status: 'connected',
        syncFrequency: 'daily',
        metadata: expect.objectContaining({
          owner: 'Operations',
          regions: ['us'],
          scopes: ['chat:write', 'channels:read'],
          channels: ['alerts'],
        }),
      }),
    );

    expect(WorkspaceIntegrationAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        integrationId: createdIntegration.id,
        eventType: 'integration_created',
      }),
    );

    expect(result).toMatchObject({
      providerKey: 'slack',
      metadata: expect.objectContaining({ owner: 'Operations', regions: ['us'] }),
    });
  });

  test('updateIntegration merges metadata changes and tracks audit history', async () => {
    const integrationInstance = createIntegrationInstance({
      id: 888,
      providerKey: 'hubspot',
      displayName: 'HubSpot Sync',
      status: 'pending',
      syncFrequency: 'hourly',
      metadata: { owner: 'Ops', regions: ['us'], scopes: ['crm.objects.contacts.read'] },
    });

    WorkspaceIntegration.findByPk.mockResolvedValue(integrationInstance);

    const result = await updateIntegration(
      integrationInstance.id,
      {
        displayName: 'HubSpot RevOps Sync',
        status: 'connected',
        syncFrequency: 'weekly',
        metadata: { regions: ['us', 'eu'], channels: ['marketing'], notes: 'Expanded scope' },
      },
      { actorId: 102, actorRole: 'admin' },
    );

    expect(integrationInstance.update).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: 'HubSpot RevOps Sync',
        status: 'connected',
        syncFrequency: 'weekly',
        metadata: expect.objectContaining({
          regions: ['us', 'eu'],
          channels: ['marketing'],
          notes: 'Expanded scope',
        }),
      }),
    );

    expect(WorkspaceIntegrationAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'integration_updated', integrationId: integrationInstance.id }),
    );

    expect(result).toMatchObject({
      displayName: 'HubSpot RevOps Sync',
      status: 'connected',
      metadata: expect.objectContaining({ channels: ['marketing'] }),
    });
  });

  test('rotateSecret creates a new credential and refreshes metadata', async () => {
    const integrationInstance = createIntegrationInstance({ id: 999, displayName: 'Custom CRM' });
    const reloadedIntegration = createIntegrationInstance({
      id: 999,
      secrets: [createSecretInstance({ id: 222, lastFour: '1234', version: 1 }).get({ plain: true })],
      webhooks: [],
    });

    WorkspaceIntegration.findByPk
      .mockResolvedValueOnce(integrationInstance)
      .mockResolvedValueOnce(reloadedIntegration);

    const secretInstance = createSecretInstance({ id: 222, secretType: 'oauth_token' });
    WorkspaceIntegrationSecret.create.mockImplementationOnce(async () => secretInstance);

    const result = await rotateSecret(
      integrationInstance.id,
      { name: 'Custom CRM token', secretType: 'oauth_token', secretValue: 'my-secret-1234' },
      { actorId: 55, actorRole: 'admin' },
    );

    expect(WorkspaceIntegrationSecret.create).toHaveBeenCalledWith(
      expect.objectContaining({
        integrationId: integrationInstance.id,
        name: 'Custom CRM token',
        secretType: 'oauth_token',
        lastFour: '1234',
        rotatedById: 55,
      }),
    );

    expect(WorkspaceIntegrationAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'secret_created', integrationId: integrationInstance.id }),
    );

    expect(result.secret).toMatchObject({ id: 222, lastFour: '1234', secretType: 'oauth_token' });
    expect(result.integration.secrets).toHaveLength(1);
  });

  test('createWebhook provisions a webhook and reuses rotated secrets', async () => {
    const integrationInstance = createIntegrationInstance({ id: 1001, displayName: 'Salesforce' });
    const reloadedIntegration = createIntegrationInstance({ id: 1001 });

    WorkspaceIntegration.findByPk
      .mockResolvedValueOnce(integrationInstance)
      .mockResolvedValueOnce(integrationInstance)
      .mockResolvedValueOnce(reloadedIntegration);

    const secretInstance = createSecretInstance({
      id: 333,
      name: 'Salesforce webhook secret',
      secretType: 'webhook_secret',
      lastFour: '7890',
    });
    WorkspaceIntegrationSecret.create.mockImplementationOnce(async () => secretInstance);

    const webhookReload = createWebhookInstance({
      id: 444,
      secretId: 333,
      secret: secretInstance.get({ plain: true }),
      metadata: { retries: 1 },
      targetUrl: 'https://hooks.example.com/projects',
      eventTypes: ['project.created', 'project.completed'],
    });

    WorkspaceIntegrationWebhook.create.mockResolvedValue({ id: webhookReload.id });
    WorkspaceIntegrationWebhook.findByPk.mockResolvedValue(webhookReload);

    const result = await createWebhook(
      integrationInstance.id,
      {
        name: 'Project notifications',
        targetUrl: 'https://hooks.example.com/projects',
        eventTypes: ['project.created', 'project.completed'],
        status: 'active',
        secretValue: 'rotate-me-7890',
        metadata: { retries: 1 },
      },
      { actorId: 77, actorRole: 'admin' },
    );

    expect(WorkspaceIntegrationWebhook.create).toHaveBeenCalledWith(
      expect.objectContaining({
        integrationId: integrationInstance.id,
        name: 'Project notifications',
        targetUrl: 'https://hooks.example.com/projects',
        status: 'active',
        eventTypes: ['project.created', 'project.completed'],
        secretId: 333,
        createdById: 77,
      }),
    );

    expect(WorkspaceIntegrationAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'webhook_created', integrationId: integrationInstance.id }),
    );

    expect(result).toMatchObject({
      id: webhookReload.id,
      targetUrl: 'https://hooks.example.com/projects',
      secret: expect.objectContaining({ id: 333 }),
    });
  });

  test('updateWebhook applies changes and rotates secrets when provided', async () => {
    const integrationInstance = createIntegrationInstance({ id: 1101, displayName: 'HubSpot' });
    const reloadedIntegration = createIntegrationInstance({ id: 1101 });

    WorkspaceIntegration.findByPk
      .mockResolvedValueOnce(integrationInstance)
      .mockResolvedValueOnce(integrationInstance)
      .mockResolvedValueOnce(reloadedIntegration);

    const webhookInstance = createWebhookInstance({
      id: 555,
      name: 'Talent events',
      targetUrl: 'https://hooks.example.com/talent',
      eventTypes: ['talent.hired'],
      secretId: 999,
      metadata: { retries: 0 },
    });
    WorkspaceIntegrationWebhook.findOne.mockResolvedValue(webhookInstance);

    const existingSecret = createSecretInstance({ id: 999, version: 2 });
    WorkspaceIntegrationSecret.findOne.mockResolvedValue(existingSecret);

    const webhookReload = createWebhookInstance({
      id: 555,
      secretId: 999,
      secret: existingSecret.get({ plain: true }),
      eventTypes: ['talent.hired', 'talent.offer_extended'],
      metadata: { retries: 0, location: 'global' },
      targetUrl: 'https://hooks.example.com/talent-updated',
      status: 'paused',
    });
    WorkspaceIntegrationWebhook.findByPk.mockResolvedValue(webhookReload);

    const result = await updateWebhook(
      integrationInstance.id,
      webhookInstance.id,
      {
        name: 'Talent lifecycle events',
        status: 'paused',
        targetUrl: 'https://hooks.example.com/talent-updated',
        eventTypes: ['talent.hired', 'talent.offer_extended'],
        verificationToken: 'verify-456',
        metadata: { location: 'global' },
        secretValue: 'rotate-again-4567',
      },
      { actorId: 98, actorRole: 'admin' },
    );

    expect(webhookInstance.update).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Talent lifecycle events',
        status: 'paused',
        targetUrl: 'https://hooks.example.com/talent-updated',
        eventTypes: ['talent.hired', 'talent.offer_extended'],
        verificationToken: 'verify-456',
        metadata: expect.objectContaining({ location: 'global' }),
        secretId: 999,
      }),
    );

    expect(existingSecret.update).toHaveBeenCalledWith(
      expect.objectContaining({
        secretType: 'webhook_secret',
        lastFour: '4567',
        rotatedById: 98,
      }),
    );

    expect(WorkspaceIntegrationAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'webhook_updated', integrationId: integrationInstance.id }),
    );

    expect(result).toMatchObject({
      id: webhookInstance.id,
      status: 'paused',
      eventTypes: ['talent.hired', 'talent.offer_extended'],
      secret: expect.objectContaining({ id: 999 }),
    });
  });

  test('deleteWebhook removes webhook and records audit entry', async () => {
    const integrationInstance = createIntegrationInstance({ id: 1201 });
    WorkspaceIntegration.findByPk.mockResolvedValue(integrationInstance);

    const webhookInstance = createWebhookInstance({ id: 777, name: 'Finance events' });
    WorkspaceIntegrationWebhook.findOne.mockResolvedValue(webhookInstance);

    const result = await deleteWebhook(
      integrationInstance.id,
      webhookInstance.id,
      { actorId: 45, actorRole: 'admin' },
    );

    expect(webhookInstance.destroy).toHaveBeenCalledTimes(1);
    expect(WorkspaceIntegrationAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'webhook_deleted', integrationId: integrationInstance.id }),
    );
    expect(result).toEqual({ deleted: true });
  });

  test('testIntegrationConnection highlights missing credentials and logs diagnostics', async () => {
    const integrationInstance = createIntegrationInstance({ id: 1301, metadata: {} });
    WorkspaceIntegration.findByPk.mockResolvedValue(integrationInstance);
    WorkspaceIntegrationSecret.count.mockResolvedValue(0);

    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);

    const result = await testIntegrationConnection(
      integrationInstance.id,
      { actorId: 44, actorRole: 'admin' },
    );

    randomSpy.mockRestore();

    expect(integrationInstance.update).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ lastConnectionTestAt: expect.any(String) }),
      }),
    );

    expect(WorkspaceIntegrationAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'connection_tested', integrationId: integrationInstance.id }),
    );

    expect(result).toMatchObject({
      integrationId: integrationInstance.id,
      status: 'action_required',
    });
    expect(result.issues).toContain(
      'No credentials stored for this integration. Upload an API key or complete OAuth setup.',
    );
  });
});
