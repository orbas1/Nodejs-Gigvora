'use strict';

const { QueryTypes } = require('sequelize');

const ENVIRONMENTS = [
  {
    slug: 'calendar-stub',
    service: 'calendar-stub',
    baseUrl: 'http://localhost:4010',
    metadataEndpoint: 'http://localhost:4010/api/system/calendar-meta',
    eventsEndpoint: 'http://localhost:4010/api/company/calendar/events',
    fallbackOrigin: 'http://localhost:4173',
    allowedOrigins: ['http://localhost:5173', 'http://localhost:4173'],
    viewRoles: ['calendar:view', 'calendar:manage', 'platform:admin'],
    manageRoles: ['calendar:manage', 'platform:admin'],
    workspaceSlug: 'acme-talent-hub',
    workspaceId: 101,
    releaseChannel: 'stable',
    region: 'us-central',
    buildNumber: '2024.10.1',
    ownerTeam: 'Integrations Platform',
    version: '2024.10',
    requiresApiKey: false,
    apiKeyPreview: null,
    lastStatus: 'seeded',
    lastMessage: 'Seeded calendar stub configuration',
    lastError: null,
    lastCheckedAt: new Date('2024-09-01T10:15:00.000Z'),
    lastMetadata: {
      service: 'calendar-stub',
      version: '2024.10',
      allowedOrigins: ['http://localhost:5173', 'http://localhost:4173'],
      fallbackOrigin: 'http://localhost:4173',
      latency: { minMs: 0, maxMs: 120 },
      defaults: { windowDays: 30, lookaheadDays: 45, limit: 250, maxLimit: 500 },
      scenarios: ['normal', 'rate-limit', 'maintenance-window'],
      availableWorkspaces: [
        {
          id: 101,
          slug: 'acme-talent-hub',
          name: 'Acme Talent Hub',
          timezone: 'UTC',
          upcomingEvents: 12,
          nextEventStartsAt: '2024-09-02T09:00:00.000Z',
        },
        {
          id: 202,
          slug: 'beta-growth-hub',
          name: 'Beta Growth Hub',
          timezone: 'America/New_York',
          upcomingEvents: 8,
          nextEventStartsAt: '2024-09-02T13:00:00.000Z',
        },
      ],
      workspaceSummary: {
        totalWorkspaces: 2,
        totalEvents: 20,
        defaultWorkspace: {
          id: 101,
          slug: 'acme-talent-hub',
          name: 'Acme Talent Hub',
          timezone: 'UTC',
        },
        defaultWorkspaceSlug: 'acme-talent-hub',
        defaultWorkspaceId: 101,
      },
      requiredHeaders: {
        view: ['x-roles'],
        manage: ['x-roles', 'x-user-id'],
      },
      headerExamples: {
        view: { 'x-roles': 'calendar:view' },
        manage: { 'x-roles': 'calendar:manage', 'x-user-id': '<operator>' },
      },
      telemetry: {
        uptimeSeconds: 86400,
        scenarioCount: 3,
        totalEvents: 20,
        lastEventStartsAt: '2024-09-02T13:00:00.000Z',
        calculatedAt: '2024-09-01T10:15:00.000Z',
      },
      deployment: {
        releaseChannel: 'stable',
        region: 'us-central',
        buildNumber: '2024.10.1',
        ownerTeam: 'Integrations Platform',
        version: '2024.10',
      },
      generatedAt: '2024-09-01T10:15:00.000Z',
    },
    lastTelemetry: {
      uptimeSeconds: 86400,
      scenarioCount: 3,
      totalEvents: 20,
      lastEventStartsAt: '2024-09-02T13:00:00.000Z',
    },
  },
];

async function upsertEnvironment(queryInterface, transaction, environment) {
  const now = new Date();
  const [existing] = await queryInterface.sequelize.query(
    'SELECT id FROM integration_stub_environments WHERE slug = :slug LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { slug: environment.slug },
    },
  );

  let environmentId = existing?.id ?? null;
  if (environmentId) {
    await queryInterface.bulkUpdate(
      'integration_stub_environments',
      {
        service: environment.service,
        baseUrl: environment.baseUrl,
        metadataEndpoint: environment.metadataEndpoint,
        eventsEndpoint: environment.eventsEndpoint,
        fallbackOrigin: environment.fallbackOrigin,
        allowedOrigins: environment.allowedOrigins,
        viewRoles: environment.viewRoles,
        manageRoles: environment.manageRoles,
        workspaceSlug: environment.workspaceSlug,
        workspaceId: environment.workspaceId,
        releaseChannel: environment.releaseChannel,
        region: environment.region,
        buildNumber: environment.buildNumber,
        ownerTeam: environment.ownerTeam,
        version: environment.version,
        requiresApiKey: environment.requiresApiKey,
        apiKeyPreview: environment.apiKeyPreview,
        lastStatus: environment.lastStatus,
        lastMessage: environment.lastMessage,
        lastError: environment.lastError,
        lastCheckedAt: environment.lastCheckedAt,
        lastMetadata: environment.lastMetadata,
        lastTelemetry: environment.lastTelemetry,
        updatedAt: now,
      },
      { id: environmentId },
      { transaction },
    );
  } else {
    await queryInterface.bulkInsert(
      'integration_stub_environments',
      [
        {
          slug: environment.slug,
          service: environment.service,
          baseUrl: environment.baseUrl,
          metadataEndpoint: environment.metadataEndpoint,
          eventsEndpoint: environment.eventsEndpoint,
          fallbackOrigin: environment.fallbackOrigin,
          allowedOrigins: environment.allowedOrigins,
          viewRoles: environment.viewRoles,
          manageRoles: environment.manageRoles,
          workspaceSlug: environment.workspaceSlug,
          workspaceId: environment.workspaceId,
          releaseChannel: environment.releaseChannel,
          region: environment.region,
          buildNumber: environment.buildNumber,
          ownerTeam: environment.ownerTeam,
          version: environment.version,
          requiresApiKey: environment.requiresApiKey,
          apiKeyPreview: environment.apiKeyPreview,
          lastStatus: environment.lastStatus,
          lastMessage: environment.lastMessage,
          lastError: environment.lastError,
          lastCheckedAt: environment.lastCheckedAt,
          lastMetadata: environment.lastMetadata,
          lastTelemetry: environment.lastTelemetry,
          createdAt: now,
          updatedAt: now,
        },
      ],
      { transaction },
    );

    const [inserted] = await queryInterface.sequelize.query(
      'SELECT id FROM integration_stub_environments WHERE slug = :slug LIMIT 1',
      {
        type: QueryTypes.SELECT,
        transaction,
        replacements: { slug: environment.slug },
      },
    );
    environmentId = inserted?.id ?? null;
  }

  if (!environmentId) {
    throw new Error(`Failed to resolve integration stub environment id for ${environment.slug}`);
  }

  await queryInterface.bulkInsert(
    'integration_stub_environment_checks',
    [
      {
        environmentId,
        status: environment.lastStatus,
        checkedAt: environment.lastCheckedAt ?? now,
        message: environment.lastMessage,
        error: environment.lastError,
        metadata: environment.lastMetadata,
        config: {
          baseUrl: environment.baseUrl,
          metadataEndpoint: environment.metadataEndpoint,
          eventsEndpoint: environment.eventsEndpoint,
          fallbackOrigin: environment.fallbackOrigin,
          allowedOrigins: environment.allowedOrigins,
          viewRoles: environment.viewRoles,
          manageRoles: environment.manageRoles,
          workspaceSlug: environment.workspaceSlug,
          workspaceId: environment.workspaceId,
          releaseChannel: environment.releaseChannel,
          region: environment.region,
          buildNumber: environment.buildNumber,
          ownerTeam: environment.ownerTeam,
          version: environment.version,
          requiresApiKey: environment.requiresApiKey,
          apiKeyPreview: environment.apiKeyPreview,
        },
        createdAt: now,
        updatedAt: now,
      },
    ],
    { transaction },
  );
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const environment of ENVIRONMENTS) {
        await upsertEnvironment(queryInterface, transaction, environment);
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const environment of ENVIRONMENTS) {
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM integration_stub_environments WHERE slug = :slug LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { slug: environment.slug },
          },
        );

        if (existing?.id) {
          await queryInterface.bulkDelete(
            'integration_stub_environment_checks',
            { environmentId: existing.id },
            { transaction },
          );
          await queryInterface.bulkDelete(
            'integration_stub_environments',
            { id: existing.id },
            { transaction },
          );
        }
      }
    });
  },
};
