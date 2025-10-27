import fetch from 'node-fetch';

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

  if (!publicSettings.metadataEndpoint) {
    return {
      status: 'disabled',
      checkedAt,
      config,
      message: 'Calendar stub metadata endpoint is not configured.',
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
      return {
        status: 'error',
        checkedAt,
        config,
        error: detail || `Calendar stub responded with ${response.status}.`,
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
    const deployment = stubMetadata.deployment ?? {
      releaseChannel: process.env.CALENDAR_STUB_RELEASE_CHANNEL?.trim() || null,
      region: process.env.CALENDAR_STUB_REGION?.trim() || null,
      buildNumber: process.env.CALENDAR_STUB_BUILD_NUMBER?.trim() || null,
      ownerTeam: process.env.CALENDAR_STUB_OWNER_TEAM?.trim() || null,
      version: stubMetadata.version ?? null,
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
      version: stubMetadata.version ?? null,
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

    return {
      status: 'connected',
      checkedAt,
      baseUrl: publicSettings.baseUrl,
      config,
      metadata,
      message: 'Calendar stub is reachable and hydrated.',
    };
  } catch (error) {
    return {
      status: 'error',
      checkedAt,
      config,
      error: error?.message || 'Failed to contact calendar stub.',
    };
  }
}

export default {
  resolveCalendarStubSettings,
  getCalendarStubEnvironment,
};
