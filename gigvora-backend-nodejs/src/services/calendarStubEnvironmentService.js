import fetch from 'node-fetch';

import sequelize from '../models/sequelizeClient.js';
import {
  IntegrationStubEnvironment,
  IntegrationStubEnvironmentCheck,
} from '../models/integrationEnvironmentModels.js';
import logger from '../utils/logger.js';

function parseList(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : `${entry}`.trim()))
      .filter((entry) => entry.length > 0);
  }
  return String(value)
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function normaliseBaseUrl(env) {
  const baseUrl = env.CALENDAR_STUB_BASE_URL?.trim();
  if (baseUrl) {
    return baseUrl.replace(/\/$/, '');
  }
  const host = env.CALENDAR_STUB_HOST?.trim() || 'localhost';
  const portValue = env.CALENDAR_STUB_PORT?.trim() || '4010';
  const port = Number.parseInt(portValue, 10);
  const resolvedPort = Number.isFinite(port) ? port : 4010;
  return `http://${host}:${resolvedPort}`;
}

function maskApiKey(value) {
  if (!value) {
    return null;
  }
  if (value.length <= 4) {
    return '*'.repeat(value.length);
  }
  return `${value.slice(0, 4)}…${value.slice(-2)}`;
}

const CALENDAR_ENVIRONMENT_SLUG = 'calendar-stub';

function sanitizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return Array.from(
    new Set(
      value
        .map((entry) => {
          if (typeof entry === 'string') {
            return entry.trim();
          }
          if (entry == null) {
            return null;
          }
          return `${entry}`.trim();
        })
        .filter((entry) => entry && entry.length),
    ),
  );
}

function normaliseString(value) {
  if (value == null) {
    return null;
  }
  const text = typeof value === 'string' ? value.trim() : `${value}`.trim();
  return text.length ? text : null;
}

function cloneForStorage(value) {
  if (value == null) {
    return null;
  }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    logger.warn({ err: error }, 'Failed to clone stub metadata for storage');
    return null;
  }
}

function normaliseWorkspaceId(value) {
  const numeric = Number.parseInt(`${value}`, 10);
  return Number.isFinite(numeric) ? numeric : null;
}

function normaliseCheckedAt(value) {
  if (!value) {
    return new Date();
  }
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
}

function buildPersistenceConfig({ publicSettings, config, metadata }) {
  const workspaceSummary = metadata?.workspaceSummary ?? {};
  const fallbackWorkspaceSlug =
    workspaceSummary.defaultWorkspaceSlug ?? publicSettings.workspaceSlug ?? null;
  const fallbackWorkspaceId =
    normaliseWorkspaceId(workspaceSummary.defaultWorkspaceId) ?? publicSettings.workspaceId ?? null;
  const deployment = metadata?.deployment ?? {};
  const persistenceDeployment = {
    releaseChannel:
      normaliseString(deployment.releaseChannel) ||
      normaliseString(process.env.CALENDAR_STUB_RELEASE_CHANNEL),
    region:
      normaliseString(deployment.region) ||
      normaliseString(process.env.CALENDAR_STUB_REGION),
    buildNumber:
      normaliseString(deployment.buildNumber) ||
      normaliseString(process.env.CALENDAR_STUB_BUILD_NUMBER),
    ownerTeam:
      normaliseString(deployment.ownerTeam) ||
      normaliseString(process.env.CALENDAR_STUB_OWNER_TEAM),
    version:
      normaliseString(metadata?.version ?? deployment.version ?? process.env.CALENDAR_STUB_VERSION),
  };

  return {
    service: metadata?.service ?? 'calendar-stub',
    baseUrl: publicSettings.baseUrl,
    metadataEndpoint: publicSettings.metadataEndpoint,
    eventsEndpoint: publicSettings.eventsEndpoint,
    fallbackOrigin: metadata?.fallbackOrigin ?? publicSettings.fallbackOrigin,
    allowedOrigins: sanitizeStringArray(metadata?.allowedOrigins ?? publicSettings.allowedOrigins ?? []),
    viewRoles: sanitizeStringArray(metadata?.viewRoles ?? publicSettings.viewRoles ?? []),
    manageRoles: sanitizeStringArray(metadata?.manageRoles ?? publicSettings.manageRoles ?? []),
    workspaceSlug: fallbackWorkspaceSlug,
    workspaceId: fallbackWorkspaceId,
    releaseChannel: persistenceDeployment.releaseChannel,
    region: persistenceDeployment.region,
    buildNumber: persistenceDeployment.buildNumber,
    ownerTeam: persistenceDeployment.ownerTeam,
    version: persistenceDeployment.version,
    requiresApiKey: config.requiresApiKey,
    apiKeyPreview: config.apiKeyPreview,
  };
}

async function persistCalendarStubSnapshot({ persistenceConfig, result }) {
  try {
    const metadataSnapshot = cloneForStorage(result.metadata);
    const configSnapshot = cloneForStorage(result.config);
    const checkedAtDate = normaliseCheckedAt(result.checkedAt);

    const environmentRecord = await sequelize.transaction(async (transaction) => {
      const [environment] = await IntegrationStubEnvironment.findOrCreate({
        where: { slug: CALENDAR_ENVIRONMENT_SLUG },
        defaults: {
          slug: CALENDAR_ENVIRONMENT_SLUG,
          ...persistenceConfig,
          lastStatus: result.status,
          lastMessage: result.message ?? null,
          lastError: result.error ?? null,
          lastCheckedAt: checkedAtDate,
          lastMetadata: metadataSnapshot,
          lastTelemetry: metadataSnapshot?.telemetry ?? null,
        },
        transaction,
      });

      await environment.update(
        {
          ...persistenceConfig,
          lastStatus: result.status,
          lastMessage: result.message ?? null,
          lastError: result.error ?? null,
          lastCheckedAt: checkedAtDate,
          lastMetadata: metadataSnapshot,
          lastTelemetry: metadataSnapshot?.telemetry ?? null,
        },
        { transaction },
      );

      await IntegrationStubEnvironmentCheck.create(
        {
          environmentId: environment.id,
          status: result.status,
          checkedAt: checkedAtDate,
          message: result.message ?? null,
          error: result.error ?? null,
          metadata: metadataSnapshot,
          config: configSnapshot,
        },
        { transaction },
      );

      return environment;
    });

    const persisted = environmentRecord?.toJSON?.() ?? environmentRecord ?? null;

    if (!persisted?.id) {
      return { persisted: null, history: [] };
    }

    const historyRows = await IntegrationStubEnvironmentCheck.findAll({
      where: { environmentId: persisted.id },
      order: [['checkedAt', 'DESC']],
      limit: 10,
    });

    return {
      persisted,
      history: historyRows.map((row) => row.toJSON?.() ?? row),
    };
  } catch (error) {
    logger.error({ err: error, slug: CALENDAR_ENVIRONMENT_SLUG }, 'Failed to persist calendar stub snapshot');
    return { persisted: null, history: [] };
  }
}

function buildHistorySummary(history = []) {
  return history.map((row) => {
    const telemetry = row.metadata?.telemetry ?? {};
    const deployment = row.metadata?.deployment ?? {};
    return {
      id: row.id,
      status: row.status,
      checkedAt: row.checkedAt ? new Date(row.checkedAt).toISOString() : null,
      message: row.message ?? null,
      error: row.error ?? null,
      telemetry: {
        uptimeSeconds: telemetry.uptimeSeconds ?? null,
        totalEvents: telemetry.totalEvents ?? null,
        scenarioCount: telemetry.scenarioCount ?? null,
        lastEventStartsAt: telemetry.lastEventStartsAt ?? null,
      },
      deployment: {
        releaseChannel: deployment.releaseChannel ?? null,
        region: deployment.region ?? null,
        buildNumber: deployment.buildNumber ?? null,
      },
    };
  });
}

function buildPersistedSummary(persisted, historySummaries) {
  if (!persisted) {
    return null;
  }

  const summary = {
    id: persisted.id,
    slug: persisted.slug,
    service: persisted.service ?? 'calendar-stub',
    baseUrl: persisted.baseUrl ?? null,
    metadataEndpoint: persisted.metadataEndpoint ?? null,
    eventsEndpoint: persisted.eventsEndpoint ?? null,
    workspaceSlug: persisted.workspaceSlug ?? null,
    workspaceId: persisted.workspaceId ?? null,
    releaseChannel: persisted.releaseChannel ?? null,
    region: persisted.region ?? null,
    buildNumber: persisted.buildNumber ?? null,
    ownerTeam: persisted.ownerTeam ?? null,
    version: persisted.version ?? null,
    lastStatus: persisted.lastStatus,
    lastMessage: persisted.lastMessage,
    lastError: persisted.lastError,
    lastCheckedAt: persisted.lastCheckedAt ? new Date(persisted.lastCheckedAt).toISOString() : null,
    lastTelemetry: persisted.lastTelemetry ?? null,
    requiresApiKey: Boolean(persisted.requiresApiKey),
    apiKeyPreview: persisted.apiKeyPreview ?? null,
  };

  const lastSuccess = historySummaries.find((entry) => entry.status === 'connected');
  summary.lastSuccessfulCheckAt = lastSuccess?.checkedAt ?? null;
  summary.totalTrackedChecks = historySummaries.length;

  return summary;
}

export function resolveCalendarStubSettings(env = process.env) {
  const baseUrl = normaliseBaseUrl(env);
  const metadataEndpoint = `${baseUrl.replace(/\/$/, '')}/api/system/calendar-meta`;
  const eventsEndpoint = `${baseUrl.replace(/\/$/, '')}/api/company/calendar/events`;
  const fallbackOrigin = env.CALENDAR_STUB_FALLBACK_ORIGIN?.trim() || env.CLIENT_URL?.trim() || 'http://localhost:4173';
  const allowedOrigins = parseList(env.CALENDAR_STUB_ALLOWED_ORIGINS);
  const viewRoles = parseList(env.CALENDAR_STUB_VIEW_ROLES).map((role) => role.toLowerCase());
  const manageRoles = parseList(env.CALENDAR_STUB_MANAGE_ROLES).map((role) => role.toLowerCase());
  const workspaceSlug = env.CALENDAR_STUB_DEFAULT_WORKSPACE_SLUG?.trim() || null;
  const workspaceIdValue = env.CALENDAR_STUB_DEFAULT_WORKSPACE_ID?.trim();
  const parsedWorkspaceId = workspaceIdValue ? Number.parseInt(workspaceIdValue, 10) : null;
  const workspaceId = Number.isFinite(parsedWorkspaceId) ? parsedWorkspaceId : null;
  const apiKey = env.CALENDAR_STUB_API_KEY?.trim() || null;

  return {
    baseUrl,
    metadataEndpoint,
    eventsEndpoint,
    fallbackOrigin,
    allowedOrigins,
    viewRoles,
    manageRoles,
    workspaceSlug,
    workspaceId,
    apiKey,
  };
}

function createHeaders({ apiKey, fallbackOrigin, viewRoles }) {
  const headers = {
    Accept: 'application/json',
    Origin: fallbackOrigin,
    'User-Agent': 'gigvora-backend/stub-environment-prober',
  };
  const roles = Array.isArray(viewRoles) && viewRoles.length ? viewRoles : ['calendar:view'];
  headers['x-roles'] = roles.join(',');
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }
  return headers;
}

export async function getCalendarStubEnvironment({ signal } = {}) {
  const settings = resolveCalendarStubSettings();
  const { apiKey, ...publicSettings } = settings;
  const checkedAt = new Date().toISOString();

  const config = {
    ...publicSettings,
    requiresApiKey: Boolean(apiKey),
    apiKeyPreview: maskApiKey(apiKey),
  };

  let persistenceConfig = buildPersistenceConfig({ publicSettings, config, metadata: null });

  if (!publicSettings.metadataEndpoint) {
    const result = {
      status: 'disabled',
      checkedAt,
      baseUrl: publicSettings.baseUrl,
      config,
      message: 'Calendar stub metadata endpoint is not configured.',
    };
    const persistence = await persistCalendarStubSnapshot({
      persistenceConfig,
      result,
    });
    const historySummaries = buildHistorySummary(persistence.history);
    return {
      ...result,
      persisted: buildPersistedSummary(persistence.persisted, historySummaries),
      history: historySummaries,
    };
  }

  try {
    const response = await fetch(publicSettings.metadataEndpoint, {
      method: 'GET',
      headers: createHeaders({ apiKey, fallbackOrigin: publicSettings.fallbackOrigin, viewRoles: publicSettings.viewRoles }),
      signal,
    });

    if (!response.ok) {
      let detail;
      try {
        const payload = await response.json();
        detail = payload?.message ?? payload?.error;
      } catch (error) {
        detail = undefined;
      }
      const result = {
        status: 'error',
        checkedAt,
        baseUrl: publicSettings.baseUrl,
        config,
        error: detail || `Calendar stub responded with ${response.status}.`,
      };
      const persistence = await persistCalendarStubSnapshot({
        persistenceConfig,
        result,
      });
      const historySummaries = buildHistorySummary(persistence.history);
      return {
        ...result,
        persisted: buildPersistedSummary(persistence.persisted, historySummaries),
        history: historySummaries,
      };
    }

    const payload = await response.json();
    const stubMetadata = payload?.stub ?? {};

    const availableWorkspaces = Array.isArray(stubMetadata.availableWorkspaces)
      ? stubMetadata.availableWorkspaces
      : [];
    const workspaceSummary = stubMetadata.workspaceSummary ?? {
      totalWorkspaces: availableWorkspaces.length,
      totalEvents: availableWorkspaces.reduce((accumulator, workspace) => accumulator + (workspace.upcomingEvents ?? 0), 0),
      defaultWorkspace: null,
      defaultWorkspaceSlug: publicSettings.workspaceSlug ?? null,
      defaultWorkspaceId: publicSettings.workspaceId ?? null,
    };
    const deploymentSource = stubMetadata.deployment ?? {};
    const deployment = {
      releaseChannel:
        normaliseString(deploymentSource.releaseChannel) ||
        normaliseString(process.env.CALENDAR_STUB_RELEASE_CHANNEL),
      region:
        normaliseString(deploymentSource.region) ||
        normaliseString(process.env.CALENDAR_STUB_REGION),
      buildNumber:
        normaliseString(deploymentSource.buildNumber) ||
        normaliseString(process.env.CALENDAR_STUB_BUILD_NUMBER),
      ownerTeam:
        normaliseString(deploymentSource.ownerTeam) ||
        normaliseString(process.env.CALENDAR_STUB_OWNER_TEAM),
      version:
        normaliseString(deploymentSource.version) ||
        normaliseString(stubMetadata.version) ||
        normaliseString(process.env.CALENDAR_STUB_VERSION),
    };
    const telemetry = stubMetadata.telemetry ?? {
      uptimeSeconds: null,
      scenarioCount: Array.isArray(stubMetadata.scenarios) ? stubMetadata.scenarios.length : 0,
      totalEvents: workspaceSummary.totalEvents,
      lastEventStartsAt: null,
      calculatedAt: checkedAt,
    };

    const metadata = {
      service: stubMetadata.service ?? 'calendar-stub',
      version: normaliseString(stubMetadata.version),
      allowedOrigins: Array.isArray(stubMetadata.allowedOrigins)
        ? stubMetadata.allowedOrigins
        : publicSettings.allowedOrigins,
      fallbackOrigin: stubMetadata.fallbackOrigin ?? publicSettings.fallbackOrigin,
      latency: stubMetadata.latency ?? null,
      defaults: stubMetadata.defaults ?? null,
      scenarios: Array.isArray(stubMetadata.scenarios) ? stubMetadata.scenarios : [],
      availableWorkspaces,
      workspaceSummary,
      generatedAt: stubMetadata.generatedAt ?? checkedAt,
      requiredHeaders: stubMetadata.requiredHeaders ?? {
        view: ['x-roles'].concat(apiKey ? ['x-api-key'] : []),
        manage: ['x-roles', 'x-user-id'].concat(apiKey ? ['x-api-key'] : []),
      },
      headerExamples: stubMetadata.headerExamples ?? null,
      deployment,
      telemetry,
    };

    persistenceConfig = buildPersistenceConfig({ publicSettings, config, metadata });

    const result = {
      status: 'connected',
      checkedAt,
      baseUrl: publicSettings.baseUrl,
      config,
      metadata,
      message: 'Calendar stub is reachable and hydrated.',
    };

    const persistence = await persistCalendarStubSnapshot({
      persistenceConfig,
      result,
    });
    const historySummaries = buildHistorySummary(persistence.history);

    return {
      ...result,
      persisted: buildPersistedSummary(persistence.persisted, historySummaries),
      history: historySummaries,
    };
  } catch (error) {
    const result = {
      status: 'error',
      checkedAt,
      baseUrl: publicSettings.baseUrl,
      config,
      error: error?.message || 'Failed to contact calendar stub.',
    };
    const persistence = await persistCalendarStubSnapshot({
      persistenceConfig,
      result,
    });
    const historySummaries = buildHistorySummary(persistence.history);
    return {
      ...result,
      persisted: buildPersistedSummary(persistence.persisted, historySummaries),
      history: historySummaries,
    };
  }
}

export default {
  resolveCalendarStubSettings,
  getCalendarStubEnvironment,
};
