import { Op, fn, col, literal } from 'sequelize';
import {
  AgencyCreationItem,
  AgencyCreationAsset,
  AgencyCreationCollaborator,
  AgencyProfile,
  ProviderWorkspace,
  ProviderWorkspaceMember,
  User,
  sequelize,
  AGENCY_CREATION_TARGET_TYPES,
  AGENCY_CREATION_STATUSES,
  AGENCY_CREATION_PRIORITIES,
  AGENCY_CREATION_VISIBILITIES,
  AGENCY_CREATION_ASSET_TYPES,
  AGENCY_CREATION_COLLABORATOR_STATUSES,
} from '../models/index.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from '../utils/errors.js';
import logger from '../utils/logger.js';

const CACHE_NAMESPACE = 'agency:creation-studio';
const CACHE_TTL_SECONDS = 60;
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 25;

const TYPE_LABELS = {
  project: 'Project workspace',
  gig: 'Gig package',
  job: 'Job post',
  launchpad_job: 'Launchpad job',
  launchpad_project: 'Launchpad project',
  volunteer_opportunity: 'Volunteering opportunity',
  mentorship_offering: 'Mentorship offering',
  networking_session: 'Networking session',
  blog_post: 'Blog post',
  group: 'Community group',
  page: 'Landing page',
  ad: 'Gigvora ad',
  event: 'Event experience',
  cv: 'CV document',
  cover_letter: 'Cover letter',
};

const STATUS_LABELS = {
  draft: 'Draft',
  in_review: 'In review',
  scheduled: 'Scheduled',
  published: 'Published',
  archived: 'Archived',
};

const DEFAULT_SHARE_CHANNELS = [
  'gigvora_feed',
  'email_campaign',
  'community_groups',
  'partner_network',
  'public_pages',
];

const DEFAULT_SETTINGS_TEMPLATE = {
  enableAutoPublish: false,
  highlightOnDashboard: true,
  requireApproval: true,
  trackApplicationAnalytics: true,
  notifyCollaborators: true,
};

function toPlain(instance) {
  if (!instance) return null;
  if (typeof instance.toJSON === 'function') {
    return instance.toJSON();
  }
  if (typeof instance.get === 'function') {
    return instance.get({ plain: true });
  }
  if (instance && typeof instance === 'object') {
    return { ...instance };
  }
  return instance;
}

function normaliseArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value
      .split(/,|\n/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  if (typeof value === 'object') {
    return Object.values(value)
      .map((entry) => (typeof entry === 'string' ? entry : entry?.label))
      .filter(Boolean);
  }
  return [];
}

function normaliseObject(value, template = {}) {
  if (!value || typeof value !== 'object') {
    return { ...template };
  }
  return { ...template, ...value };
}

function normaliseBool(value, fallback = false) {
  if (value === true || value === false) return value;
  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalised)) return true;
    if (['false', '0', 'no', 'off'].includes(normalised)) return false;
  }
  return fallback;
}

function mapLabel(dictionary, value, fallbackLabel) {
  if (!value) return fallbackLabel || 'Not specified';
  return dictionary[value] ?? fallbackLabel ?? value;
}

function sanitizeAsset(instance) {
  const plain = toPlain(instance) ?? {};
  const uploadedBy = toPlain(plain.uploadedBy) ?? null;
  return {
    id: plain.id,
    itemId: plain.itemId,
    label: plain.label,
    description: plain.description ?? null,
    assetType: plain.assetType,
    url: plain.url,
    thumbnailUrl: plain.thumbnailUrl ?? null,
    metadata: plain.metadata ?? null,
    uploadedBy: uploadedBy
      ? {
          id: uploadedBy.id,
          email: uploadedBy.email ?? null,
          name: [uploadedBy.firstName, uploadedBy.lastName].filter(Boolean).join(' ') || uploadedBy.email || null,
        }
      : null,
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
  };
}

function sanitizeCollaborator(instance) {
  const plain = toPlain(instance) ?? {};
  const collaborator = toPlain(plain.collaborator) ?? null;
  const addedBy = toPlain(plain.addedBy) ?? null;
  return {
    id: plain.id,
    itemId: plain.itemId,
    collaboratorId: plain.collaboratorId ?? null,
    collaboratorEmail: plain.collaboratorEmail ?? collaborator?.email ?? null,
    collaboratorName:
      plain.collaboratorName ??
      (collaborator ? [collaborator.firstName, collaborator.lastName].filter(Boolean).join(' ') || collaborator.email : null),
    role: plain.role ?? 'Contributor',
    status: plain.status ?? 'invited',
    statusLabel: mapLabel(STATUS_LABELS, plain.status ?? 'invited', 'Invited'),
    permissions: normaliseObject(plain.permissions),
    addedBy: addedBy
      ? {
          id: addedBy.id,
          email: addedBy.email ?? null,
          name: [addedBy.firstName, addedBy.lastName].filter(Boolean).join(' ') || addedBy.email || null,
        }
      : null,
    invitedAt: plain.invitedAt ? new Date(plain.invitedAt).toISOString() : null,
    notes: plain.notes ?? null,
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
  };
}

function sanitizeWorkspace(instance) {
  const plain = toPlain(instance) ?? {};
  if (!plain.id) {
    return null;
  }
  return {
    id: plain.id,
    name: plain.name ?? 'Workspace',
    slug: plain.slug ?? null,
    type: plain.type ?? null,
    timezone: plain.timezone ?? null,
  };
}

function sanitizeUserSummary(instance) {
  const plain = toPlain(instance) ?? {};
  if (!plain.id) return null;
  return {
    id: plain.id,
    email: plain.email ?? null,
    name: [plain.firstName, plain.lastName].filter(Boolean).join(' ') || plain.email || null,
  };
}

function sanitizeCreationItem(instance) {
  const plain = toPlain(instance) ?? {};
  const assets = Array.isArray(plain.assets) ? plain.assets.map(sanitizeAsset) : [];
  const collaborators = Array.isArray(plain.collaborators)
    ? plain.collaborators.map(sanitizeCollaborator)
    : [];
  const workspace = sanitizeWorkspace(plain.workspace);
  const createdBy = sanitizeUserSummary(plain.createdBy);
  const updatedBy = sanitizeUserSummary(plain.updatedBy);

  return {
    id: plain.id,
    ownerWorkspaceId: plain.ownerWorkspaceId ?? workspace?.id ?? null,
    title: plain.title,
    slug: plain.slug ?? null,
    targetType: plain.targetType,
    targetLabel: mapLabel(TYPE_LABELS, plain.targetType, 'Creation'),
    status: plain.status,
    statusLabel: mapLabel(STATUS_LABELS, plain.status, 'Draft'),
    priority: plain.priority ?? 'medium',
    visibility: plain.visibility ?? 'internal',
    summary: plain.summary ?? null,
    description: plain.description ?? null,
    callToAction: plain.callToAction ?? null,
    ctaUrl: plain.ctaUrl ?? null,
    applicationInstructions: plain.applicationInstructions ?? null,
    requirements: normaliseArray(plain.requirements),
    tags: normaliseArray(plain.tags),
    location: plain.location ?? null,
    timezone: plain.timezone ?? null,
    launchDate: plain.launchDate ? new Date(plain.launchDate).toISOString() : null,
    closingDate: plain.closingDate ? new Date(plain.closingDate).toISOString() : null,
    budgetAmount: plain.budgetAmount != null ? Number(plain.budgetAmount) : null,
    budgetCurrency: plain.budgetCurrency ?? null,
    capacityNeeded: plain.capacityNeeded != null ? Number(plain.capacityNeeded) : null,
    expectedAttendees: plain.expectedAttendees != null ? Number(plain.expectedAttendees) : null,
    experienceLevel: plain.experienceLevel ?? null,
    audience: plain.audience ?? null,
    autoShareChannels: Array.isArray(plain.autoShareChannels)
      ? plain.autoShareChannels
      : normaliseArray(plain.autoShareChannels),
    settings: normaliseObject(plain.settings, DEFAULT_SETTINGS_TEMPLATE),
    metadata: plain.metadata ?? null,
    contactEmail: plain.contactEmail ?? null,
    contactPhone: plain.contactPhone ?? null,
    assets,
    collaborators,
    workspace,
    createdBy,
    updatedBy,
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
  };
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

async function resolveAgencyProfile({ actorId, actorRole, agencyProfileId }) {
  if (!actorId) {
    throw new AuthenticationError('You must be signed in to manage creation studio content.');
  }

  const normalisedRole = actorRole ? String(actorRole).toLowerCase() : null;
  const isPlatformAdmin = normalisedRole === 'admin';
  const isAgencyAdmin = normalisedRole === 'agency_admin';

  let profile = null;
  if (agencyProfileId) {
    profile = await AgencyProfile.findByPk(agencyProfileId);
    if (!profile) {
      throw new NotFoundError('Agency profile not found.');
    }
    if (profile.userId !== actorId && !isPlatformAdmin && !isAgencyAdmin) {
      const membership = await ProviderWorkspaceMember.findOne({
        where: { userId: actorId, status: 'active' },
        include: [
          {
            model: ProviderWorkspace,
            as: 'workspace',
            required: true,
            attributes: ['id', 'ownerId'],
            where: { ownerId: profile.userId },
          },
        ],
      });
      if (!membership) {
        throw new AuthorizationError('You do not have access to this agency workspace.');
      }
    }
    return profile;
  }

  profile = await AgencyProfile.findOne({ where: { userId: actorId } });
  if (!profile) {
    if (isPlatformAdmin) {
      profile = await AgencyProfile.findOne();
      if (profile) {
        return profile;
      }
      throw new NotFoundError('No agency profile has been configured.');
    }

    if (isAgencyAdmin) {
      const membership = await ProviderWorkspaceMember.findOne({
        where: { userId: actorId, status: 'active' },
        include: [
          {
            model: ProviderWorkspace,
            as: 'workspace',
            required: true,
            attributes: ['id', 'ownerId'],
          },
        ],
        order: [['createdAt', 'ASC']],
      });
      if (membership?.workspace?.ownerId) {
        profile = await AgencyProfile.findOne({ where: { userId: membership.workspace.ownerId } });
        if (profile) {
          return profile;
        }
      }
    }

    throw new AuthorizationError('Agency profile not found for the current user.');
  }
  return profile;
}

function buildOverviewCacheKey(agencyProfileId, filters) {
  return buildCacheKey(`${CACHE_NAMESPACE}:overview:${agencyProfileId}`, filters);
}

function flushOverviewCache(agencyProfileId) {
  if (!agencyProfileId) return;
  appCache.flushByPrefix(`${CACHE_NAMESPACE}:overview:${agencyProfileId}`);
}

function validateCreationPayload(payload = {}) {
  const errors = {};
  if (!payload.title || !String(payload.title).trim()) {
    errors.title = 'Title is required.';
  }
  if (!payload.targetType || !AGENCY_CREATION_TARGET_TYPES.includes(payload.targetType)) {
    errors.targetType = 'A valid creation type is required.';
  }
  if (payload.status && !AGENCY_CREATION_STATUSES.includes(payload.status)) {
    errors.status = 'Invalid status provided.';
  }
  if (payload.priority && !AGENCY_CREATION_PRIORITIES.includes(payload.priority)) {
    errors.priority = 'Invalid priority provided.';
  }
  if (payload.visibility && !AGENCY_CREATION_VISIBILITIES.includes(payload.visibility)) {
    errors.visibility = 'Invalid visibility provided.';
  }
  if (payload.assets) {
    const invalidAssets = payload.assets.filter(
      (asset) => !asset || !asset.label || !asset.url || !AGENCY_CREATION_ASSET_TYPES.includes(asset.assetType ?? 'link'),
    );
    if (invalidAssets.length) {
      errors.assets = 'Each asset must include a label, type, and URL.';
    }
  }
  if (payload.collaborators) {
    const invalidCollaborators = payload.collaborators.filter(
      (collaborator) => !collaborator || !(collaborator.collaboratorEmail || collaborator.collaboratorId),
    );
    if (invalidCollaborators.length) {
      errors.collaborators = 'Collaborators require an email or linked account.';
    }
  }
  if (Object.keys(errors).length) {
    throw new ValidationError('Creation studio payload validation failed.', errors);
  }
}

function normaliseAssets(assets = []) {
  return assets
    .filter(Boolean)
    .map((asset) => ({
      label: String(asset.label).trim(),
      description: asset.description ? String(asset.description).trim() : null,
      assetType: AGENCY_CREATION_ASSET_TYPES.includes(asset.assetType) ? asset.assetType : 'link',
      url: String(asset.url).trim(),
      thumbnailUrl: asset.thumbnailUrl ? String(asset.thumbnailUrl).trim() : null,
      metadata: asset.metadata && typeof asset.metadata === 'object' ? asset.metadata : null,
      uploadedById: asset.uploadedById ?? null,
    }));
}

function normaliseCollaborators(collaborators = []) {
  return collaborators
    .filter(Boolean)
    .map((collaborator) => ({
      collaboratorId: collaborator.collaboratorId ?? null,
      collaboratorEmail: collaborator.collaboratorEmail ? String(collaborator.collaboratorEmail).trim() : null,
      collaboratorName: collaborator.collaboratorName ? String(collaborator.collaboratorName).trim() : null,
      role: collaborator.role ? String(collaborator.role).trim() : 'Contributor',
      status: AGENCY_CREATION_COLLABORATOR_STATUSES.includes(collaborator.status)
        ? collaborator.status
        : 'invited',
      permissions:
        collaborator.permissions && typeof collaborator.permissions === 'object'
          ? {
              ...collaborator.permissions,
              canEdit: normaliseBool(collaborator.permissions.canEdit, true),
              canPublish: normaliseBool(collaborator.permissions.canPublish, false),
              canManageAccess: normaliseBool(collaborator.permissions.canManageAccess, false),
            }
          : {
              canEdit: true,
              canPublish: false,
              canManageAccess: false,
            },
      addedById: collaborator.addedById ?? null,
      invitedAt: parseDate(collaborator.invitedAt),
      notes: collaborator.notes ? String(collaborator.notes).trim() : null,
    }));
}

function buildFilters({ targetType, status, search }) {
  const where = {};
  if (targetType && AGENCY_CREATION_TARGET_TYPES.includes(targetType)) {
    where.targetType = targetType;
  }
  if (status && AGENCY_CREATION_STATUSES.includes(status)) {
    where.status = status;
  }
  if (search && String(search).trim()) {
    const term = String(search).trim();
    const likeOperator = Op.iLike ?? Op.like;
    where[Op.or] = [
      { title: { [likeOperator]: `%${term}%` } },
      { summary: { [likeOperator]: `%${term}%` } },
      { description: { [likeOperator]: `%${term}%` } },
    ];
  }
  return where;
}

async function resolveWorkspaceForActor(profile, actorId) {
  if (!profile || !actorId) {
    return null;
  }

  const membership = await ProviderWorkspaceMember.findOne({
    where: { userId: actorId, status: 'active' },
    include: [
      {
        model: ProviderWorkspace,
        as: 'workspace',
        required: true,
        attributes: ['id', 'ownerId'],
        where: { ownerId: profile.userId },
      },
    ],
    order: [['createdAt', 'ASC']],
  });

  if (membership?.workspace?.id) {
    return membership.workspace.id;
  }

  if (profile.userId === actorId) {
    const workspace = await ProviderWorkspace.findOne({
      where: { ownerId: profile.userId },
      order: [['createdAt', 'ASC']],
    });
    return workspace?.id ?? null;
  }

  return null;
}

async function buildSummary(agencyProfileId) {
  const [statusRows, typeRows, backlogCount, readyCount, totalItems] = await Promise.all([
    AgencyCreationItem.findAll({
      where: { agencyProfileId },
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    }),
    AgencyCreationItem.findAll({
      where: { agencyProfileId },
      attributes: ['targetType', [fn('COUNT', col('id')), 'count']],
      group: ['targetType'],
      raw: true,
    }),
    AgencyCreationItem.count({
      where: {
        agencyProfileId,
        status: { [Op.in]: ['draft', 'in_review'] },
      },
    }),
    AgencyCreationItem.count({
      where: {
        agencyProfileId,
        status: { [Op.in]: ['scheduled'] },
      },
    }),
    AgencyCreationItem.count({ where: { agencyProfileId } }),
  ]);

  const totalsByStatus = Object.fromEntries(
    statusRows.map((row) => [row.status, Number(row.count)]),
  );
  const totalsByType = Object.fromEntries(typeRows.map((row) => [row.targetType, Number(row.count)]));

  return {
    totalItems,
    totalsByStatus,
    totalsByType,
    backlogCount,
    readyToPublishCount: readyCount,
  };
}

async function listUpcoming(agencyProfileId) {
  const now = new Date();
  const records = await AgencyCreationItem.findAll({
    where: {
      agencyProfileId,
      status: { [Op.in]: ['scheduled', 'in_review'] },
      launchDate: { [Op.not]: null, [Op.gte]: now },
    },
    include: [
      { model: AgencyCreationAsset, as: 'assets' },
      { model: AgencyCreationCollaborator, as: 'collaborators' },
      { model: ProviderWorkspace, as: 'workspace' },
    ],
    order: [['launchDate', 'ASC']],
    limit: 5,
  });
  return records.map(sanitizeCreationItem);
}

export async function getCreationStudioOverview(params = {}, context = {}) {
  const { actorId, actorRole } = context;
  const { agencyProfileId, page = 1, pageSize = DEFAULT_PAGE_SIZE, targetType, status, search } = params;

  const profile = await resolveAgencyProfile({ actorId, actorRole, agencyProfileId });
  const pagination = {
    page: Math.max(Number(page) || 1, 1),
    pageSize: Math.min(Math.max(Number(pageSize) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE),
  };

  const cacheKey = buildOverviewCacheKey(profile.id, {
    targetType: targetType ?? null,
    status: status ?? null,
    search: search ? String(search).trim() : null,
    page: pagination.page,
    pageSize: pagination.pageSize,
  });

  return appCache.remember(cacheKey, CACHE_TTL_SECONDS, async () => {
    const where = buildFilters({ targetType, status, search });
    where.agencyProfileId = profile.id;

    const include = [
      { model: AgencyCreationAsset, as: 'assets' },
      { model: AgencyCreationCollaborator, as: 'collaborators' },
      { model: ProviderWorkspace, as: 'workspace' },
      { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ];

    const { rows, count } = await AgencyCreationItem.findAndCountAll({
      where,
      include,
      order: [
        [literal("CASE WHEN status = 'scheduled' THEN 0 ELSE 1 END"), 'ASC'],
        ['updatedAt', 'DESC'],
      ],
      limit: pagination.pageSize,
      offset: (pagination.page - 1) * pagination.pageSize,
    });

    const items = rows.map(sanitizeCreationItem);
    const summary = await buildSummary(profile.id);
    const upcoming = await listUpcoming(profile.id);

    return {
      summary: {
        ...summary,
        upcomingLaunches: upcoming,
      },
      items: {
        data: items,
        pagination: {
          page: pagination.page,
          pageSize: pagination.pageSize,
          totalItems: count,
          totalPages: Math.max(1, Math.ceil(count / pagination.pageSize)),
        },
      },
      filters: {
        targetType: targetType ?? null,
        status: status ?? null,
        search: search ? String(search).trim() : null,
      },
      config: {
        targetTypes: AGENCY_CREATION_TARGET_TYPES.map((type) => ({
          value: type,
          label: mapLabel(TYPE_LABELS, type, type),
        })),
        statuses: AGENCY_CREATION_STATUSES.map((value) => ({
          value,
          label: mapLabel(STATUS_LABELS, value, value),
        })),
        priorities: AGENCY_CREATION_PRIORITIES.map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) })),
        visibilities: AGENCY_CREATION_VISIBILITIES.map((value) => ({
          value,
          label: value === 'internal' ? 'Internal' : value === 'restricted' ? 'Restricted' : 'Public',
        })),
        assetTypes: AGENCY_CREATION_ASSET_TYPES,
        collaboratorStatuses: AGENCY_CREATION_COLLABORATOR_STATUSES,
        autoShareChannels: DEFAULT_SHARE_CHANNELS,
        settingsTemplate: DEFAULT_SETTINGS_TEMPLATE,
      },
      metadata: {
        agencyProfileId: profile.id,
        refreshedAt: new Date().toISOString(),
      },
    };
  });
}

export async function getCreationStudioSnapshot(params = {}, context = {}) {
  const overview = await getCreationStudioOverview(
    { ...params, page: 1, pageSize: 6 },
    context,
  );
  return overview;
}

export async function createCreationItem(payload = {}, context = {}) {
  const { actorId, actorRole } = context;
  const profile = await resolveAgencyProfile({ actorId, actorRole, agencyProfileId: payload.agencyProfileId });
  validateCreationPayload(payload);

  const assets = normaliseAssets(payload.assets ?? []);
  const collaborators = normaliseCollaborators(payload.collaborators ?? []);
  const resolvedWorkspaceId =
    payload.ownerWorkspaceId !== undefined && payload.ownerWorkspaceId !== null
      ? payload.ownerWorkspaceId
      : await resolveWorkspaceForActor(profile, actorId);

  const record = await sequelize.transaction(async (transaction) => {
    const created = await AgencyCreationItem.create(
      {
        agencyProfileId: profile.id,
        ownerWorkspaceId: resolvedWorkspaceId ?? null,
        createdById: actorId,
        updatedById: actorId,
        title: String(payload.title).trim(),
        slug: payload.slug ? String(payload.slug).trim() : null,
        targetType: payload.targetType,
        status: payload.status ?? 'draft',
        priority: payload.priority ?? 'medium',
        visibility: payload.visibility ?? 'internal',
        summary: payload.summary ? String(payload.summary).trim() : null,
        description: payload.description ? String(payload.description).trim() : null,
        callToAction: payload.callToAction ? String(payload.callToAction).trim() : null,
        ctaUrl: payload.ctaUrl ? String(payload.ctaUrl).trim() : null,
        applicationInstructions: payload.applicationInstructions
          ? String(payload.applicationInstructions).trim()
          : null,
        requirements: normaliseArray(payload.requirements ?? payload.requirementsText),
        tags: normaliseArray(payload.tags ?? payload.tagList),
        location: payload.location ? String(payload.location).trim() : null,
        timezone: payload.timezone ? String(payload.timezone).trim() : null,
        launchDate: parseDate(payload.launchDate),
        closingDate: parseDate(payload.closingDate),
        budgetAmount: payload.budgetAmount != null ? Number(payload.budgetAmount) : null,
        budgetCurrency: payload.budgetCurrency ? String(payload.budgetCurrency).trim().toUpperCase() : null,
        capacityNeeded: payload.capacityNeeded != null ? Number(payload.capacityNeeded) : null,
        expectedAttendees: payload.expectedAttendees != null ? Number(payload.expectedAttendees) : null,
        experienceLevel: payload.experienceLevel ? String(payload.experienceLevel).trim() : null,
        audience: payload.audience && typeof payload.audience === 'object' ? payload.audience : null,
        autoShareChannels: normaliseArray(payload.autoShareChannels),
        settings: normaliseObject(payload.settings, DEFAULT_SETTINGS_TEMPLATE),
        metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : null,
        contactEmail: payload.contactEmail ? String(payload.contactEmail).trim() : null,
        contactPhone: payload.contactPhone ? String(payload.contactPhone).trim() : null,
      },
      { transaction },
    );

    if (assets.length) {
      await AgencyCreationAsset.bulkCreate(
        assets.map((asset) => ({ ...asset, itemId: created.id })),
        { transaction },
      );
    }

    if (collaborators.length) {
      await AgencyCreationCollaborator.bulkCreate(
        collaborators.map((collaborator) => ({ ...collaborator, itemId: created.id, addedById: collaborator.addedById ?? actorId })),
        { transaction },
      );
    }

    return created;
  });

  flushOverviewCache(profile.id);

  const reloaded = await AgencyCreationItem.findByPk(record.id, {
    include: [
      { model: AgencyCreationAsset, as: 'assets' },
      { model: AgencyCreationCollaborator, as: 'collaborators' },
      { model: ProviderWorkspace, as: 'workspace' },
      { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
  });

  return sanitizeCreationItem(reloaded);
}

export async function updateCreationItem(itemId, payload = {}, context = {}) {
  const { actorId, actorRole } = context;
  if (!itemId) {
    throw new ValidationError('Creation item identifier is required.');
  }
  const profile = await resolveAgencyProfile({ actorId, actorRole, agencyProfileId: payload.agencyProfileId });

  const item = await AgencyCreationItem.findOne({ where: { id: itemId, agencyProfileId: profile.id } });
  if (!item) {
    throw new NotFoundError('Creation item not found.');
  }

  validateCreationPayload({
    ...payload,
    title: payload.title ?? item.title,
    targetType: payload.targetType ?? item.targetType,
  });

  const assets = payload.assets ? normaliseAssets(payload.assets) : null;
  const collaborators = payload.collaborators ? normaliseCollaborators(payload.collaborators) : null;
  const resolvedWorkspaceId =
    payload.ownerWorkspaceId !== undefined
      ? payload.ownerWorkspaceId ?? (await resolveWorkspaceForActor(profile, actorId))
      : item.ownerWorkspaceId;

  await sequelize.transaction(async (transaction) => {
    await item.update(
      {
        ownerWorkspaceId: resolvedWorkspaceId ?? null,
        updatedById: actorId,
        title: payload.title ? String(payload.title).trim() : item.title,
        slug: payload.slug ? String(payload.slug).trim() : item.slug,
        targetType: payload.targetType ?? item.targetType,
        status: payload.status ?? item.status,
        priority: payload.priority ?? item.priority,
        visibility: payload.visibility ?? item.visibility,
        summary: payload.summary != null ? String(payload.summary).trim() : item.summary,
        description: payload.description != null ? String(payload.description).trim() : item.description,
        callToAction: payload.callToAction != null ? String(payload.callToAction).trim() : item.callToAction,
        ctaUrl: payload.ctaUrl != null ? String(payload.ctaUrl).trim() : item.ctaUrl,
        applicationInstructions:
          payload.applicationInstructions != null
            ? String(payload.applicationInstructions).trim()
            : item.applicationInstructions,
        requirements:
          payload.requirements != null
            ? normaliseArray(payload.requirements ?? payload.requirementsText)
            : item.requirements,
        tags: payload.tags != null ? normaliseArray(payload.tags ?? payload.tagList) : item.tags,
        location: payload.location != null ? String(payload.location).trim() : item.location,
        timezone: payload.timezone != null ? String(payload.timezone).trim() : item.timezone,
        launchDate: payload.launchDate !== undefined ? parseDate(payload.launchDate) : item.launchDate,
        closingDate: payload.closingDate !== undefined ? parseDate(payload.closingDate) : item.closingDate,
        budgetAmount:
          payload.budgetAmount !== undefined
            ? payload.budgetAmount == null
              ? null
              : Number(payload.budgetAmount)
            : item.budgetAmount,
        budgetCurrency:
          payload.budgetCurrency !== undefined
            ? payload.budgetCurrency
              ? String(payload.budgetCurrency).trim().toUpperCase()
              : null
            : item.budgetCurrency,
        capacityNeeded:
          payload.capacityNeeded !== undefined
            ? payload.capacityNeeded == null
              ? null
              : Number(payload.capacityNeeded)
            : item.capacityNeeded,
        expectedAttendees:
          payload.expectedAttendees !== undefined
            ? payload.expectedAttendees == null
              ? null
              : Number(payload.expectedAttendees)
            : item.expectedAttendees,
        experienceLevel:
          payload.experienceLevel !== undefined
            ? payload.experienceLevel
              ? String(payload.experienceLevel).trim()
              : null
            : item.experienceLevel,
        audience:
          payload.audience !== undefined
            ? payload.audience && typeof payload.audience === 'object'
              ? payload.audience
              : null
            : item.audience,
        autoShareChannels:
          payload.autoShareChannels !== undefined ? normaliseArray(payload.autoShareChannels) : item.autoShareChannels,
        settings:
          payload.settings !== undefined ? normaliseObject(payload.settings, DEFAULT_SETTINGS_TEMPLATE) : item.settings,
        metadata: payload.metadata !== undefined ? (payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : null) : item.metadata,
        contactEmail:
          payload.contactEmail !== undefined
            ? payload.contactEmail
              ? String(payload.contactEmail).trim()
              : null
            : item.contactEmail,
        contactPhone:
          payload.contactPhone !== undefined
            ? payload.contactPhone
              ? String(payload.contactPhone).trim()
              : null
            : item.contactPhone,
      },
      { transaction },
    );

    if (Array.isArray(assets)) {
      await AgencyCreationAsset.destroy({ where: { itemId: item.id }, transaction });
      if (assets.length) {
        await AgencyCreationAsset.bulkCreate(
          assets.map((asset) => ({ ...asset, itemId: item.id })),
          { transaction },
        );
      }
    }

    if (Array.isArray(collaborators)) {
      await AgencyCreationCollaborator.destroy({ where: { itemId: item.id }, transaction });
      if (collaborators.length) {
        await AgencyCreationCollaborator.bulkCreate(
          collaborators.map((collaborator) => ({
            ...collaborator,
            itemId: item.id,
            addedById: collaborator.addedById ?? actorId,
          })),
          { transaction },
        );
      }
    }
  });

  flushOverviewCache(profile.id);

  const reloaded = await AgencyCreationItem.findByPk(item.id, {
    include: [
      { model: AgencyCreationAsset, as: 'assets' },
      { model: AgencyCreationCollaborator, as: 'collaborators' },
      { model: ProviderWorkspace, as: 'workspace' },
      { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
  });

  return sanitizeCreationItem(reloaded);
}

export async function deleteCreationItem(itemId, context = {}) {
  const { actorId, actorRole } = context;
  if (!itemId) {
    throw new ValidationError('Creation item identifier is required.');
  }
  const profile = await resolveAgencyProfile({ actorId, actorRole });
  const item = await AgencyCreationItem.findOne({ where: { id: itemId, agencyProfileId: profile.id } });
  if (!item) {
    throw new NotFoundError('Creation item not found.');
  }

  await AgencyCreationItem.destroy({ where: { id: itemId } });
  flushOverviewCache(profile.id);
  logger.info({
    event: 'agency.creation_studio.item_deleted',
    itemId,
    actorId,
    agencyProfileId: profile.id,
  });
  return { success: true };
}

export default {
  getCreationStudioOverview,
  getCreationStudioSnapshot,
  createCreationItem,
  updateCreationItem,
  deleteCreationItem,
};
