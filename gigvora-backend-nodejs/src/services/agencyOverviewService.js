import { z } from 'zod';
import {
  sequelize,
  AgencyDashboardOverview,
  ProviderWorkspace,
  ProviderWorkspaceMember,
} from '../models/index.js';
import { fetchCurrentWeather } from './weatherService.js';
import { appCache } from '../utils/cache.js';
import logger from '../utils/logger.js';
import { AuthorizationError, NotFoundError, ValidationError } from '../utils/errors.js';

const WEATHER_REFRESH_INTERVAL_MS = 15 * 60 * 1000; // fifteen minutes
const OVERVIEW_CACHE_PREFIX = 'agency:dashboard';

function normalizeRolesList(...roleCandidates) {
  const values = roleCandidates.flat().filter(Boolean);
  return Array.from(
    new Set(
      values
        .map((role) => `${role}`.trim().toLowerCase())
        .filter((role) => role.length > 0),
    ),
  );
}

function emptyToNull(value) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return null;
  }
  return value;
}

const numericSchema = (schema) =>
  z.preprocess((value) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : value;
  }, schema);

const highlightSchema = z
  .object({
    id: z.preprocess(emptyToNull, z.string().trim().min(1).max(160).optional().nullable()),
    title: z.string().trim().min(1).max(120),
    summary: z.preprocess(emptyToNull, z.string().trim().max(400).optional().nullable()),
    link: z
      .preprocess(emptyToNull, z.string().trim().url().max(2048).optional().nullable())
      .transform((value) => (value && value.length ? value : null)),
    imageUrl: z
      .preprocess(emptyToNull, z.string().trim().url().max(2048).optional().nullable())
      .transform((value) => (value && value.length ? value : null)),
  })
  .transform((value) => ({
    id: value.id ?? null,
    title: value.title,
    summary: value.summary ?? null,
    link: value.link ?? null,
    imageUrl: value.imageUrl ?? null,
  }));

const overviewUpdateSchema = z.object({
  workspaceId: numericSchema(z.number().int().positive()),
  greetingName: z.string().trim().min(1).max(150),
  greetingHeadline: z.string().trim().min(1).max(200),
  overviewSummary: z.preprocess(emptyToNull, z.string().trim().max(2000).optional().nullable()),
  avatarUrl: z
    .preprocess(emptyToNull, z.string().trim().url().max(2048).optional().nullable())
    .transform((value) => (value === undefined ? undefined : value ?? null)),
  followerCount: numericSchema(z.number().int().min(0).max(10000000)).default(0),
  trustScore: numericSchema(z.number().min(0).max(100).optional().nullable()),
  rating: numericSchema(z.number().min(0).max(5).optional().nullable()),
  weatherLocation: z.preprocess(emptyToNull, z.string().trim().max(180).optional().nullable()),
  weatherLatitude: numericSchema(z.number().min(-90).max(90).optional().nullable()),
  weatherLongitude: numericSchema(z.number().min(-180).max(180).optional().nullable()),
  highlights: z.preprocess(
    (value) => (value == null ? [] : value),
    z.array(highlightSchema).max(6),
  ),
});

function sanitizeWorkspace(workspace) {
  if (!workspace) {
    return null;
  }
  const plain = workspace.get ? workspace.get({ plain: true }) : workspace;
  return {
    id: plain.id,
    name: plain.name,
    slug: plain.slug,
    type: plain.type,
    timezone: plain.timezone,
  };
}

function sanitizeHighlights(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item, index) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const idCandidate = typeof item.id === 'string' && item.id.trim().length ? item.id.trim() : `highlight-${index + 1}`;
      return {
        id: idCandidate,
        title: `${item.title ?? ''}`.trim(),
        summary: item.summary ? `${item.summary}`.trim() : null,
        link: item.link ? `${item.link}` : null,
        imageUrl: item.imageUrl ? `${item.imageUrl}` : null,
      };
    })
    .filter((item) => item && item.title.length);
}

function sanitizeWeather(record) {
  if (!record) {
    return null;
  }
  const snapshot = record.weatherSnapshot ?? null;
  if (!snapshot) {
    return null;
  }
  return {
    provider: snapshot.provider ?? record.weatherProvider ?? null,
    observedAt: snapshot.observedAt ?? (record.weatherLastCheckedAt ? new Date(record.weatherLastCheckedAt).toISOString() : null),
    temperatureC: snapshot.temperatureC ?? null,
    temperatureF: snapshot.temperatureF ?? null,
    description: snapshot.description ?? null,
    category: snapshot.category ?? null,
    windSpeedKph: snapshot.windSpeedKph ?? null,
    windSpeedMph: snapshot.windSpeedMph ?? null,
    windDirection: snapshot.windDirection ?? null,
  };
}

function sanitizeOverview(record, workspace) {
  const base = {
    greetingName: workspace?.name ?? 'Team',
    greetingHeadline: "Let's win today.",
    overviewSummary: null,
    avatarUrl: null,
    followerCount: 0,
    trustScore: null,
    rating: null,
    highlights: [],
    weatherLocation: workspace?.settings?.defaultLocation ?? null,
    weatherLatitude: null,
    weatherLongitude: null,
    weather: null,
    updatedAt: null,
    createdAt: null,
  };

  if (!record) {
    return base;
  }

  const plain = record.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    greetingName: plain.greetingName ?? base.greetingName,
    greetingHeadline: plain.greetingHeadline ?? base.greetingHeadline,
    overviewSummary: plain.overviewSummary ?? null,
    avatarUrl: plain.avatarUrl ?? null,
    followerCount: Number.isFinite(Number(plain.followerCount)) ? Number(plain.followerCount) : 0,
    trustScore: plain.trustScore != null ? Number(plain.trustScore) : null,
    rating: plain.rating != null ? Number(plain.rating) : null,
    highlights: sanitizeHighlights(plain.highlights),
    weatherLocation: plain.weatherLocation ?? null,
    weatherLatitude: plain.weatherLatitude != null ? Number(plain.weatherLatitude) : null,
    weatherLongitude: plain.weatherLongitude != null ? Number(plain.weatherLongitude) : null,
    weather: sanitizeWeather(plain),
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
  };
}

async function ensureWorkspaceAccess({ workspaceId, workspaceSlug }, context = {}, { requireManager = false } = {}) {
  const { actorId, actorRole, actorRoles = [] } = context;
  const normalizedRoles = normalizeRolesList(actorRole, actorRoles);
  const adminAccess = normalizedRoles.includes('admin');

  let workspace = null;
  if (workspaceId != null) {
    workspace = await ProviderWorkspace.findOne({ where: { id: workspaceId, type: 'agency' } });
  }
  if (!workspace && workspaceSlug) {
    workspace = await ProviderWorkspace.findOne({ where: { slug: workspaceSlug, type: 'agency' } });
  }
  if (!workspace) {
    throw new NotFoundError('Agency workspace not found.');
  }

  if (adminAccess) {
    return workspace;
  }

  if (!actorId) {
    throw new AuthorizationError('Authentication required to access this agency workspace.');
  }

  if (workspace.ownerId === actorId) {
    return workspace;
  }

  const membership = await ProviderWorkspaceMember.findOne({
    where: {
      workspaceId: workspace.id,
      userId: actorId,
      status: 'active',
    },
  });

  if (!membership) {
    throw new AuthorizationError('You do not have permission to access this agency workspace.');
  }

  if (requireManager) {
    const managerRoles = new Set(['owner', 'admin', 'manager']);
    const membershipRole = `${membership.role ?? ''}`.toLowerCase();
    if (!managerRoles.has(membershipRole) && !normalizedRoles.includes('agency_admin')) {
      throw new AuthorizationError('You do not have permission to update this overview.');
    }
  }

  return workspace;
}

async function listAvailableWorkspaces(actorId, actorRoles = []) {
  if (!actorId) {
    return [];
  }

  const normalizedRoles = normalizeRolesList(actorRoles);
  const isAdmin = normalizedRoles.includes('admin');

  if (isAdmin) {
    const rows = await ProviderWorkspace.findAll({
      where: { type: 'agency' },
      order: [['name', 'ASC']],
      limit: 100,
    });
    return rows.map((row) => sanitizeWorkspace(row));
  }

  const membershipRows = await ProviderWorkspaceMember.findAll({
    where: { userId: actorId, status: 'active' },
    include: [
      {
        model: ProviderWorkspace,
        as: 'workspace',
        where: { type: 'agency' },
        required: true,
      },
    ],
    order: [[{ model: ProviderWorkspace, as: 'workspace' }, 'name', 'ASC']],
  });

  const workspaces = new Map();
  membershipRows.forEach((row) => {
    if (row.workspace) {
      workspaces.set(row.workspace.id, row.workspace);
    }
  });

  const ownedRows = await ProviderWorkspace.findAll({ where: { ownerId: actorId, type: 'agency' } });
  ownedRows.forEach((row) => workspaces.set(row.id, row));

  return Array.from(workspaces.values())
    .sort((a, b) => `${a.name}`.localeCompare(`${b.name}`))
    .map((row) => sanitizeWorkspace(row));
}

async function maybeRefreshWeather(record) {
  if (!record) {
    return record;
  }
  if (record.weatherLatitude == null || record.weatherLongitude == null) {
    return record;
  }
  const lastChecked = record.weatherLastCheckedAt ? new Date(record.weatherLastCheckedAt).getTime() : 0;
  if (Date.now() - lastChecked < WEATHER_REFRESH_INTERVAL_MS) {
    return record;
  }

  try {
    const snapshot = await fetchCurrentWeather({
      latitude: record.weatherLatitude,
      longitude: record.weatherLongitude,
    });
    if (snapshot) {
      record.weatherSnapshot = snapshot;
      record.weatherProvider = snapshot.provider ?? 'open-meteo';
      record.weatherLastCheckedAt = new Date();
      await record.save({ fields: ['weatherSnapshot', 'weatherProvider', 'weatherLastCheckedAt'] });
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.warn({
      message: 'Unable to refresh agency overview weather snapshot',
      error: error?.message ?? error,
      workspaceId: record.workspaceId,
    });
  }
  return record;
}

async function loadOverview(workspace) {
  if (!workspace) {
    return null;
  }
  const record = await AgencyDashboardOverview.findOne({ where: { workspaceId: workspace.id } });
  if (record) {
    await maybeRefreshWeather(record);
  }
  return record;
}

function buildResponse(record, workspace, availableWorkspaces = []) {
  const overview = sanitizeOverview(record, workspace);
  return {
    overview,
    workspace: sanitizeWorkspace(workspace),
    currentDate: new Date().toISOString(),
    meta: {
      availableWorkspaces,
      selectedWorkspaceId: workspace?.id ?? null,
      lastUpdatedAt: overview.updatedAt ?? null,
      fromCache: false,
    },
  };
}

export async function getAgencyOverview(params = {}, context = {}) {
  const { workspaceId, workspaceSlug } = params;
  const actorRoles = normalizeRolesList(context.actorRole, context.actorRoles, context.roles, context.userRoles);

  const availableWorkspaces = await listAvailableWorkspaces(context.actorId, actorRoles);

  let workspace = null;
  if (workspaceId != null || workspaceSlug) {
    workspace = await ensureWorkspaceAccess({ workspaceId, workspaceSlug }, context, { requireManager: false });
  } else if (availableWorkspaces.length) {
    workspace = await ensureWorkspaceAccess(
      { workspaceId: availableWorkspaces[0].id },
      context,
      { requireManager: false },
    );
  }

  if (!workspace) {
    throw new AuthorizationError('No agency workspace is linked to your account yet.');
  }

  const overviewRecord = await loadOverview(workspace);
  return buildResponse(overviewRecord, workspace, availableWorkspaces);
}

export async function updateAgencyOverview(input, context = {}) {
  const payload = overviewUpdateSchema.parse(input);
  const actorRoles = normalizeRolesList(context.actorRole, context.actorRoles, context.roles, context.userRoles);

  const workspace = await ensureWorkspaceAccess(
    { workspaceId: payload.workspaceId },
    { ...context, actorRoles },
    { requireManager: true },
  );

  let record = await sequelize.transaction(async (transaction) => {
    const [instance] = await AgencyDashboardOverview.findOrCreate({
      where: { workspaceId: workspace.id },
      defaults: {
        workspaceId: workspace.id,
        greetingName: payload.greetingName,
        greetingHeadline: payload.greetingHeadline,
        overviewSummary: payload.overviewSummary ?? null,
        avatarUrl: payload.avatarUrl ?? null,
        followerCount: payload.followerCount ?? 0,
        trustScore: payload.trustScore ?? null,
        rating: payload.rating ?? null,
        highlights: payload.highlights ?? [],
        weatherLocation: payload.weatherLocation ?? null,
        weatherLatitude: payload.weatherLatitude ?? null,
        weatherLongitude: payload.weatherLongitude ?? null,
        createdById: context.actorId ?? null,
        updatedById: context.actorId ?? null,
      },
      transaction,
    });

    instance.greetingName = payload.greetingName;
    instance.greetingHeadline = payload.greetingHeadline;
    instance.overviewSummary = payload.overviewSummary ?? null;
    instance.avatarUrl = payload.avatarUrl ?? null;
    instance.followerCount = payload.followerCount ?? 0;
    instance.trustScore = payload.trustScore ?? null;
    instance.rating = payload.rating ?? null;
    instance.highlights = payload.highlights ?? [];
    instance.weatherLocation = payload.weatherLocation ?? null;
    instance.weatherLatitude = payload.weatherLatitude ?? null;
    instance.weatherLongitude = payload.weatherLongitude ?? null;

    if (payload.weatherLatitude == null || payload.weatherLongitude == null) {
      instance.weatherProvider = null;
      instance.weatherSnapshot = null;
      instance.weatherLastCheckedAt = null;
    }

    if (context.actorId) {
      if (!instance.createdById) {
        instance.createdById = context.actorId;
      }
      instance.updatedById = context.actorId;
    }

    instance.metadata = {
      ...(instance.metadata ?? {}),
      lastUpdatedAt: new Date().toISOString(),
      lastUpdatedById: context.actorId ?? null,
    };

    await instance.save({ transaction });
    return instance;
  });

  if (record && record.weatherLatitude != null && record.weatherLongitude != null) {
    record = await maybeRefreshWeather(record);
    await record.reload();
  }

  appCache.flushByPrefix(OVERVIEW_CACHE_PREFIX);

  const availableWorkspaces = await listAvailableWorkspaces(context.actorId, actorRoles);
  return buildResponse(record, workspace, availableWorkspaces);
}

export default {
  getAgencyOverview,
  updateAgencyOverview,
};
