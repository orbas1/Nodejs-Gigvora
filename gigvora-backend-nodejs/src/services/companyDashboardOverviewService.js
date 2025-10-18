import * as models from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { appCache } from '../utils/cache.js';

const CACHE_PREFIX = 'dashboard:company';

const CompanyDashboardOverview =
  models.CompanyDashboardOverview ?? models.default?.CompanyDashboardOverview ?? null;
const ProviderWorkspace = models.ProviderWorkspace ?? models.default?.ProviderWorkspace ?? null;
const User = models.User ?? models.default?.User ?? null;

const FallbackCompanyDashboardOverview = {
  async findOne() {
    return null;
  },
  async findOrCreate({ defaults }) {
    return [
      {
        ...defaults,
        get() {
          return { ...defaults };
        },
        async save() {},
        async reload() {},
      },
      true,
    ];
  },
};

const CompanyDashboardOverviewModel = CompanyDashboardOverview ?? FallbackCompanyDashboardOverview;

function toNumber(value) {
  if (value == null) {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function sanitizeOverview(record) {
  if (!record) {
    return null;
  }
  const plain = record.get ? record.get({ plain: true }) : record;
  const lastEditedBy = record.lastEditedBy?.get?.({ plain: true }) ?? record.lastEditedBy ?? null;

  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    displayName: plain.displayName,
    summary: plain.summary ?? null,
    avatarUrl: plain.avatarUrl ?? null,
    followerCount: plain.followerCount ?? 0,
    trustScore: toNumber(plain.trustScore),
    rating: toNumber(plain.rating),
    preferences: plain.preferences ?? {},
    lastEditedBy: lastEditedBy
      ? {
          id: lastEditedBy.id,
          firstName: lastEditedBy.firstName,
          lastName: lastEditedBy.lastName,
          email: lastEditedBy.email,
        }
      : null,
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
  };
}

export async function getCompanyDashboardOverview({ workspaceId }) {
  if (!workspaceId) {
    throw new ValidationError('workspaceId is required to load the dashboard overview.');
  }

  const include = [];
  if (User) {
    include.push({
      model: User,
      as: 'lastEditedBy',
      attributes: ['id', 'firstName', 'lastName', 'email'],
    });
  }

  const overview = await CompanyDashboardOverviewModel.findOne({
    where: { workspaceId },
    include,
  });

  if (!overview) {
    return null;
  }

  return sanitizeOverview(overview);
}

export async function upsertCompanyDashboardOverview({
  workspaceId,
  displayName,
  summary,
  avatarUrl,
  followerCount,
  trustScore,
  rating,
  preferences,
  actorId,
}) {
  if (!workspaceId) {
    throw new ValidationError('workspaceId is required.');
  }

  if (!ProviderWorkspace?.findByPk) {
    throw new NotFoundError('Workspace model is unavailable.');
  }

  const workspace = await ProviderWorkspace.findByPk(workspaceId, {
    attributes: ['id', 'name'],
  });
  if (!workspace) {
    throw new NotFoundError('Workspace not found.');
  }

  const defaults = {
    displayName: displayName?.trim() || workspace.name,
    summary: summary ?? null,
    avatarUrl: avatarUrl ?? null,
    followerCount: Number.isInteger(followerCount) ? followerCount : 0,
    trustScore: toNumber(trustScore),
    rating: toNumber(rating),
    preferences: preferences ?? {},
    lastEditedById: actorId ?? null,
  };

  const [record] = await CompanyDashboardOverviewModel.findOrCreate({
    where: { workspaceId },
    defaults: {
      ...defaults,
      workspaceId,
    },
  });

  if (displayName != null) {
    const trimmed = String(displayName).trim();
    record.displayName = trimmed || workspace.name;
  }
  if (summary !== undefined) {
    record.summary = summary ?? null;
  }
  if (avatarUrl !== undefined) {
    record.avatarUrl = avatarUrl || null;
  }
  if (followerCount !== undefined) {
    const numeric = Number(followerCount);
    record.followerCount = Number.isFinite(numeric) && numeric >= 0 ? Math.round(numeric) : 0;
  }
  if (trustScore !== undefined) {
    const numeric = toNumber(trustScore);
    record.trustScore = numeric != null ? Math.min(Math.max(numeric, 0), 100) : null;
  }
  if (rating !== undefined) {
    const numeric = toNumber(rating);
    record.rating = numeric != null ? Math.min(Math.max(numeric, 0), 5) : null;
  }
  if (preferences !== undefined && preferences !== null) {
    record.preferences = { ...(record.preferences ?? {}), ...preferences };
  }
  if (actorId != null) {
    record.lastEditedById = actorId;
  }

  await record.save();

  appCache.flushByPrefix(CACHE_PREFIX);

  if (record.reload && User) {
    await record.reload({
      include: [
        {
          model: User,
          as: 'lastEditedBy',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });
  }

  return sanitizeOverview(record);
}

export default {
  getCompanyDashboardOverview,
  upsertCompanyDashboardOverview,
};
