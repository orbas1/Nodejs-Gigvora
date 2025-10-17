import crypto from 'crypto';
import { Op } from 'sequelize';
import {
  CreationStudioItem,
  CreationStudioStep,
  CREATION_STUDIO_TYPES,
  CREATION_STUDIO_STATUSES,
  CREATION_STUDIO_VISIBILITIES,
  CREATION_STUDIO_STEPS,
} from '../models/creationStudioModels.js';

function normaliseString(value) {
  if (value == null) {
    return null;
  }
  const trimmed = `${value}`.trim();
  return trimmed.length ? trimmed : null;
}

function normaliseType(candidate) {
  const value = normaliseString(candidate);
  if (!value) {
    return null;
  }
  const lower = value.toLowerCase();
  return CREATION_STUDIO_TYPES.find((type) => type === lower) ?? null;
}

function normaliseVisibility(candidate) {
  const value = normaliseString(candidate);
  if (!value) {
    return 'private';
  }
  const lower = value.toLowerCase();
  return CREATION_STUDIO_VISIBILITIES.find((visibility) => visibility === lower) ?? 'private';
}

function normaliseStatus(candidate) {
  const value = normaliseString(candidate);
  if (!value) {
    return 'draft';
  }
  const lower = value.toLowerCase();
  return CREATION_STUDIO_STATUSES.find((status) => status === lower) ?? 'draft';
}

function normaliseTags(tags) {
  if (!tags) {
    return [];
  }
  if (Array.isArray(tags)) {
    return tags
      .map((tag) => normaliseString(tag))
      .filter(Boolean)
      .map((tag) => tag.toLowerCase());
  }
  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((tag) => normaliseString(tag))
      .filter(Boolean)
      .map((tag) => tag.toLowerCase());
  }
  return [];
}

function slugify(value) {
  if (!value) {
    return null;
  }
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

const CREATION_TYPE_CATALOG = [
  {
    type: 'project',
    label: 'Project',
    summary: 'Scoped collaborative initiatives with milestones, deliverables, and collaborators.',
    recommendedVisibility: 'connections',
    defaultSettings: {
      requiresBrief: true,
      allowMentors: true,
      allowVendors: true,
      budget: { currency: 'USD', minimum: 0, maximum: null },
    },
  },
  {
    type: 'gig',
    label: 'Gig',
    summary: 'Short-term engagements or micro-deliverables suited for freelance collaborators.',
    recommendedVisibility: 'connections',
    defaultSettings: {
      requiresBrief: true,
      allowMentors: false,
      allowVendors: true,
      budget: { currency: 'USD', minimum: 0, maximum: null },
    },
  },
  {
    type: 'job',
    label: 'Job',
    summary: 'Full-time or part-time roles with application flows and interview scheduling.',
    recommendedVisibility: 'public',
    defaultSettings: {
      requiresBrief: true,
      allowMentors: false,
      allowVendors: false,
      compensation: { currency: 'USD', minimum: null, maximum: null, type: 'salary' },
    },
  },
  {
    type: 'launchpad_job',
    label: 'Launchpad job',
    summary: 'Experience Launchpad-aligned job brief with cohort gating and mentor co-signs.',
    recommendedVisibility: 'connections',
    defaultSettings: {
      requiresBrief: true,
      launchpadOnly: true,
      allowMentors: true,
      cohort: { required: true },
    },
  },
  {
    type: 'launchpad_project',
    label: 'Launchpad project',
    summary: 'Launchpad sprint workspace with mentor pods, talent rotations, and rituals.',
    recommendedVisibility: 'connections',
    defaultSettings: {
      requiresBrief: true,
      launchpadOnly: true,
      allowMentors: true,
      rituals: ['daily_standup', 'demo_day', 'retro'],
    },
  },
  {
    type: 'volunteering',
    label: 'Volunteering opportunity',
    summary: 'Social impact missions, pro bono briefs, and volunteering squads.',
    recommendedVisibility: 'public',
    defaultSettings: {
      requiresBrief: true,
      backgroundChecks: false,
      allowMentors: true,
      allowVendors: false,
    },
  },
  {
    type: 'networking_session',
    label: 'Networking session',
    summary: 'Live or virtual sessions with rotations, breakout rooms, and RSVP flows.',
    recommendedVisibility: 'public',
    defaultSettings: {
      requiresBrief: false,
      rsvpRequired: true,
      capacity: 50,
      allowMentors: true,
      allowVendors: false,
    },
  },
  {
    type: 'group',
    label: 'Community group',
    summary: 'Persistent community spaces with membership policies and moderation settings.',
    recommendedVisibility: 'connections',
    defaultSettings: {
      requiresBrief: false,
      membershipPolicy: 'approval',
      allowMentors: true,
      allowVendors: true,
    },
  },
  {
    type: 'page',
    label: 'Page',
    summary: 'Public facing page for personal brand, initiative, or partner programme.',
    recommendedVisibility: 'public',
    defaultSettings: {
      requiresBrief: false,
      seoOptimised: true,
      allowMentors: false,
      allowVendors: false,
    },
  },
  {
    type: 'ad',
    label: 'Gigvora ad',
    summary: 'Sponsored placement with targeting controls and pacing guardrails.',
    recommendedVisibility: 'public',
    defaultSettings: {
      requiresBrief: true,
      allowMentors: false,
      allowVendors: false,
      budget: { currency: 'USD', minimum: 25, maximum: null },
    },
  },
  {
    type: 'blog_post',
    label: 'Blog post',
    summary: 'Editorial storytelling with hero imagery, SEO tags, and cross-posting.',
    recommendedVisibility: 'public',
    defaultSettings: {
      requiresBrief: false,
      seoOptimised: true,
      allowMentors: false,
      allowVendors: false,
    },
  },
  {
    type: 'event',
    label: 'Event',
    summary: 'Workshops, demo days, or meetups with ticketing, capacity, and streaming.',
    recommendedVisibility: 'public',
    defaultSettings: {
      requiresBrief: true,
      rsvpRequired: true,
      capacity: 150,
      allowMentors: true,
      allowVendors: true,
    },
  },
];

const SHARE_DESTINATIONS = [
  { id: 'timeline', label: 'Personal timeline' },
  { id: 'groups', label: 'Groups & communities' },
  { id: 'pages', label: 'Pages' },
  { id: 'inbox', label: 'Direct inbox' },
  { id: 'external', label: 'External social (shareable link)' },
];

function generateShareSlug(title) {
  const slug = slugify(title ?? '') ?? crypto.randomBytes(6).toString('hex');
  const suffix = crypto.randomBytes(2).toString('hex');
  return `${slug}-${suffix}`.slice(0, 80);
}

function sanitiseStep(stepInstance) {
  if (!stepInstance) {
    return null;
  }
  const plain = stepInstance.get?.({ plain: true }) ?? stepInstance;
  return {
    id: plain.id,
    stepKey: plain.stepKey,
    completed: Boolean(plain.completed),
    data: plain.data ?? {},
    completedAt: plain.completedAt ?? null,
    lastEditedBy: plain.lastEditedBy ?? null,
    updatedAt: plain.updatedAt ?? null,
    createdAt: plain.createdAt ?? null,
  };
}

function sanitiseItem(itemInstance) {
  if (!itemInstance) {
    return null;
  }
  const plain = itemInstance.get?.({ plain: true }) ?? itemInstance;
  return {
    id: plain.id,
    userId: plain.userId,
    type: plain.type,
    title: plain.title,
    tagline: plain.tagline ?? null,
    summary: plain.summary ?? null,
    status: plain.status,
    visibility: plain.visibility,
    heroImageUrl: plain.heroImageUrl ?? null,
    locationLabel: plain.locationLabel ?? null,
    locationMode: plain.locationMode ?? 'hybrid',
    schedule: plain.schedule ?? {},
    settings: plain.settings ?? {},
    metadata: plain.metadata ?? {},
    shareTargets: plain.shareTargets ?? [],
    shareMessage: plain.shareMessage ?? null,
    tags: Array.isArray(plain.tags) ? plain.tags : [],
    launchAt: plain.launchAt ?? null,
    shareSlug: plain.shareSlug ?? null,
    lastEditedBy: plain.lastEditedBy ?? null,
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
    steps: Array.isArray(plain.steps) ? plain.steps.map((step) => sanitiseStep(step)).filter(Boolean) : [],
  };
}

function buildSummary(items) {
  const summary = {
    total: items.length,
    drafts: 0,
    scheduled: 0,
    published: 0,
    archived: 0,
    byType: {},
  };
  items.forEach((item) => {
    summary.byType[item.type] = summary.byType[item.type] || { total: 0, published: 0, drafts: 0 };
    summary.byType[item.type].total += 1;
    if (item.status === 'published') {
      summary.published += 1;
      summary.byType[item.type].published += 1;
    } else if (item.status === 'scheduled') {
      summary.scheduled += 1;
    } else if (item.status === 'archived') {
      summary.archived += 1;
    } else {
      summary.drafts += 1;
      summary.byType[item.type].drafts += 1;
    }
  });
  return summary;
}

export function getCreationTypeCatalog() {
  return CREATION_TYPE_CATALOG.map((entry) => ({ ...entry }));
}

export function getShareDestinations() {
  return SHARE_DESTINATIONS.map((entry) => ({ ...entry }));
}

export async function listItems(userId, { includeArchived = false } = {}) {
  if (!userId) {
    return { items: [], summary: buildSummary([]) };
  }

  const where = { userId };
  if (!includeArchived) {
    where.status = { [Op.ne]: 'archived' };
  }

  const records = await CreationStudioItem.findAll({
    where,
    include: [{ model: CreationStudioStep, as: 'steps' }],
    order: [
      ['updatedAt', 'DESC'],
      ['id', 'DESC'],
    ],
  });

  const items = records.map((record) => sanitiseItem(record)).filter(Boolean);
  return { items, summary: buildSummary(items) };
}

export async function getDashboardSnapshot(userId) {
  const { items, summary } = await listItems(userId, { includeArchived: false });
  return {
    summary,
    items: items.slice(0, 6),
    catalog: getCreationTypeCatalog(),
    shareDestinations: getShareDestinations(),
  };
}

export async function getWorkspace(userId, { includeArchived = false } = {}) {
  const result = await listItems(userId, { includeArchived });
  return {
    ...result,
    catalog: getCreationTypeCatalog(),
    shareDestinations: getShareDestinations(),
  };
}

export async function createItem(userId, payload, { actorId } = {}) {
  const type = normaliseType(payload?.type) ?? 'project';
  const title = normaliseString(payload?.title) ?? `${type.replace('_', ' ')} draft`;
  const defaults = CREATION_TYPE_CATALOG.find((entry) => entry.type === type)?.defaultSettings ?? {};
  const visibility = normaliseVisibility(payload?.visibility ?? defaults?.visibility);
  const tags = normaliseTags(payload?.tags);
  const status = normaliseStatus(payload?.status);
  const shareSlug = generateShareSlug(title);

  const item = await CreationStudioItem.create({
    userId,
    lastEditedBy: actorId ?? userId,
    type,
    title,
    tagline: normaliseString(payload?.tagline),
    summary: normaliseString(payload?.summary),
    status,
    visibility,
    heroImageUrl: normaliseString(payload?.heroImageUrl),
    locationLabel: normaliseString(payload?.locationLabel),
    locationMode: normaliseString(payload?.locationMode) ?? 'hybrid',
    schedule: payload?.schedule ?? {},
    settings: { ...defaults, ...(payload?.settings ?? {}) },
    metadata: payload?.metadata ?? {},
    shareTargets: Array.isArray(payload?.shareTargets) ? payload.shareTargets : [],
    shareMessage: normaliseString(payload?.shareMessage),
    tags,
    launchAt: payload?.launchAt ?? null,
    shareSlug,
  });

  const steps = await Promise.all(
    CREATION_STUDIO_STEPS.map((stepKey, index) =>
      CreationStudioStep.create({
        itemId: item.id,
        stepKey,
        completed: stepKey === 'type',
        completedAt: stepKey === 'type' ? new Date() : null,
        data: index === 0 ? { type } : {},
        lastEditedBy: actorId ?? userId,
      }),
    ),
  );

  const plain = sanitiseItem({ ...item.get({ plain: true }), steps });
  return plain;
}

export async function updateItem(userId, itemId, payload, { actorId } = {}) {
  const item = await CreationStudioItem.findOne({
    where: { id: itemId, userId },
    include: [{ model: CreationStudioStep, as: 'steps' }],
  });
  if (!item) {
    return null;
  }

  const type = normaliseType(payload?.type) ?? item.type;
  const updates = {
    lastEditedBy: actorId ?? userId,
  };

  if (payload?.title !== undefined) {
    const title = normaliseString(payload.title);
    if (title) {
      updates.title = title;
    }
  }
  if (payload?.tagline !== undefined) {
    updates.tagline = normaliseString(payload.tagline);
  }
  if (payload?.summary !== undefined) {
    updates.summary = normaliseString(payload.summary);
  }
  if (payload?.heroImageUrl !== undefined) {
    updates.heroImageUrl = normaliseString(payload.heroImageUrl);
  }
  if (payload?.locationLabel !== undefined) {
    updates.locationLabel = normaliseString(payload.locationLabel);
  }
  if (payload?.locationMode !== undefined) {
    updates.locationMode = normaliseString(payload.locationMode) ?? 'hybrid';
  }
  if (payload?.schedule !== undefined) {
    updates.schedule = payload.schedule ?? {};
  }
  if (payload?.settings !== undefined) {
    const defaults = CREATION_TYPE_CATALOG.find((entry) => entry.type === type)?.defaultSettings ?? {};
    updates.settings = { ...defaults, ...(payload.settings ?? {}) };
  }
  if (payload?.metadata !== undefined) {
    updates.metadata = payload.metadata ?? {};
  }
  if (payload?.shareTargets !== undefined) {
    updates.shareTargets = Array.isArray(payload.shareTargets) ? payload.shareTargets : [];
  }
  if (payload?.shareMessage !== undefined) {
    updates.shareMessage = normaliseString(payload.shareMessage);
  }
  if (payload?.tags !== undefined) {
    updates.tags = normaliseTags(payload.tags);
  }
  if (payload?.launchAt !== undefined) {
    updates.launchAt = payload.launchAt ?? null;
  }
  if (payload?.visibility !== undefined) {
    updates.visibility = normaliseVisibility(payload.visibility);
  }
  if (payload?.status !== undefined) {
    updates.status = normaliseStatus(payload.status);
  }
  if (payload?.type !== undefined && type !== item.type) {
    updates.type = type;
  }

  await item.update(updates);
  return sanitiseItem(item);
}

export async function recordStepProgress(userId, itemId, stepKey, payload = {}, { actorId } = {}) {
  const normalisedKey = normaliseString(stepKey);
  if (!normalisedKey) {
    throw new Error('A step key is required');
  }

  if (!CREATION_STUDIO_STEPS.includes(normalisedKey)) {
    throw new Error(`Unsupported wizard step: ${normalisedKey}`);
  }

  const item = await CreationStudioItem.findOne({
    where: { id: itemId, userId },
  });
  if (!item) {
    return null;
  }

  const [step] = await CreationStudioStep.findOrCreate({
    where: { itemId, stepKey: normalisedKey },
    defaults: {
      itemId,
      stepKey: normalisedKey,
      completed: false,
      data: {},
      lastEditedBy: actorId ?? userId,
    },
  });

  await step.update({
    data: payload?.data ?? payload ?? {},
    completed: Boolean(payload?.completed ?? payload?.isComplete),
    completedAt: payload?.completed || payload?.isComplete ? new Date() : null,
    lastEditedBy: actorId ?? userId,
  });

  return sanitiseStep(step);
}

export async function shareItem(userId, itemId, payload = {}, { actorId } = {}) {
  const item = await CreationStudioItem.findOne({
    where: { id: itemId, userId },
  });
  if (!item) {
    return null;
  }

  const shareTargets = Array.isArray(payload.targets) ? payload.targets : Array.isArray(payload.shareTargets) ? payload.shareTargets : [];
  const message = normaliseString(payload.message ?? payload.shareMessage);
  const visibility = payload.visibility ? normaliseVisibility(payload.visibility) : item.visibility;
  const status = payload.status ? normaliseStatus(payload.status) : item.status;

  await item.update({
    shareTargets,
    shareMessage: message,
    visibility,
    status: status === 'draft' ? 'published' : status,
    lastEditedBy: actorId ?? userId,
    launchAt: payload.launchAt ?? item.launchAt ?? new Date(),
  });

  return sanitiseItem(item);
}

export async function archiveItem(userId, itemId, { actorId } = {}) {
  const item = await CreationStudioItem.findOne({ where: { id: itemId, userId } });
  if (!item) {
    return null;
  }
  await item.update({ status: 'archived', lastEditedBy: actorId ?? userId });
  return true;
}

export default {
  getCreationTypeCatalog,
  getShareDestinations,
  listItems,
  getWorkspace,
  getDashboardSnapshot,
  createItem,
  updateItem,
  recordStepProgress,
  shareItem,
  archiveItem,
import { Op } from 'sequelize';
import {
  creationStudioSequelize,
  CreationStudioItem,
  CreationStudioAsset,
  CreationStudioPermission,
  CREATION_STUDIO_ITEM_TYPES,
  CREATION_STUDIO_ITEM_STATUSES,
  CREATION_STUDIO_VISIBILITIES,
  CREATION_STUDIO_FORMATS,
  CREATION_STUDIO_APPLICATION_TYPES,
  CREATION_STUDIO_PAYOUT_TYPES,
  CREATION_STUDIO_ROLE_OPTIONS,
  syncCreationStudioModels,
} from '../models/creationStudioModels.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

let modelsReady = false;

async function ensureModelsReady() {
  if (!modelsReady) {
    await syncCreationStudioModels();
    modelsReady = true;
  }
}

function slugify(value, fallback = 'creation') {
  if (!value) {
    return fallback;
  }
  return (
    value
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 190) || fallback
  );
}

async function ensureUniqueSlug(baseSlug, { transaction, ignoreId } = {}) {
  if (!baseSlug) {
    return null;
  }
  let candidate = baseSlug;
  let suffix = 0;
  const where = { slug: candidate };
  if (ignoreId) {
    where.id = { [Op.ne]: ignoreId };
  }
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await CreationStudioItem.findOne({ where, transaction });
    if (!existing) {
      return candidate;
    }
    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
    where.slug = candidate;
  }
}

function normalizeStringArray(value) {
  if (!value) {
    return [];
  }
  const source = Array.isArray(value) ? value : [value];
  const normalized = source
    .flatMap((entry) => {
      if (Array.isArray(entry)) {
        return entry;
      }
      if (typeof entry === 'string') {
        return entry
          .split(/[,\n]/)
          .map((token) => token.trim())
          .filter(Boolean);
      }
      if (entry && typeof entry === 'object' && entry.label) {
        return [`${entry.label}`.trim()];
      }
      return entry ? [`${entry}`.trim()] : [];
    })
    .map((entry) => entry.trim())
    .filter(Boolean);
  return Array.from(new Set(normalized));
}

function parseNumeric(value) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return numeric;
}

function parseDate(value, fieldName) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date.`);
  }
  return date;
}

function parseObject(value, { allowEmpty = false, fieldName = 'payload' } = {}) {
  if (value == null || value === '') {
    return allowEmpty ? {} : null;
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
      throw new Error('Parsed value is not an object.');
    } catch (error) {
      throw new ValidationError(`${fieldName} must be valid JSON object.`);
    }
  }
  throw new ValidationError(`${fieldName} must be an object.`);
}

function sanitizeAsset(record) {
  if (!record) {
    return null;
  }
  const plain = record.toJSON ? record.toJSON() : record;
  return {
    id: plain.id,
    itemId: plain.itemId,
    label: plain.label,
    type: plain.type,
    url: plain.url,
    thumbnailUrl: plain.thumbnailUrl,
    altText: plain.altText,
    caption: plain.caption,
    isPrimary: Boolean(plain.isPrimary),
    orderIndex: plain.orderIndex ?? 0,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
  };
}

function sanitizePermission(record) {
  if (!record) {
    return null;
  }
  const plain = record.toJSON ? record.toJSON() : record;
  return {
    id: plain.id,
    itemId: plain.itemId,
    role: plain.role,
    canView: Boolean(plain.canView),
    canEdit: Boolean(plain.canEdit),
    canPublish: Boolean(plain.canPublish),
    canManageAssets: Boolean(plain.canManageAssets),
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
  };
}

function sanitizeItem(record, { includeRelationships = true } = {}) {
  if (!record) {
    return null;
  }
  const plain = record.toJSON ? record.toJSON() : record;
  const tags = Array.isArray(plain.tags) ? plain.tags : [];
  const deliverables = Array.isArray(plain.deliverables) ? plain.deliverables : [];
  const audienceSegments = Array.isArray(plain.audienceSegments) ? plain.audienceSegments : [];
  const roleAccess = Array.isArray(plain.roleAccess) ? plain.roleAccess : [];
  const result = {
    id: plain.id,
    ownerId: plain.ownerId,
    type: plain.type,
    title: plain.title,
    slug: plain.slug,
    summary: plain.summary,
    description: plain.description,
    status: plain.status,
    visibility: plain.visibility,
    format: plain.format,
    heroImageUrl: plain.heroImageUrl,
    heroVideoUrl: plain.heroVideoUrl,
    thumbnailUrl: plain.thumbnailUrl,
    tags,
    deliverables,
    audienceSegments,
    roleAccess,
    metadata: plain.metadata ?? null,
    settings: plain.settings ?? null,
    cta: { label: plain.ctaLabel ?? null, url: plain.ctaUrl ?? null },
    application: {
      type: plain.applicationType,
      url: plain.applicationUrl,
      instructions: plain.applicationInstructions,
      deadline: plain.applicationDeadline ? plain.applicationDeadline.toISOString?.() ?? plain.applicationDeadline : null,
    },
    schedule: {
      startAt: plain.startAt ? plain.startAt.toISOString?.() ?? plain.startAt : null,
      endAt: plain.endAt ? plain.endAt.toISOString?.() ?? plain.endAt : null,
      scheduledAt: plain.scheduledAt ? plain.scheduledAt.toISOString?.() ?? plain.scheduledAt : null,
      publishedAt: plain.publishedAt ? plain.publishedAt.toISOString?.() ?? plain.publishedAt : null,
    },
    location: {
      label: plain.locationLabel ?? null,
      details: plain.locationDetails ?? null,
    },
    experienceLevel: plain.experienceLevel ?? null,
    commitmentHours: plain.commitmentHours != null ? Number(plain.commitmentHours) : null,
    payoutType: plain.payoutType,
    compensation: {
      currency: plain.compensationCurrency,
      minimum: plain.compensationMin != null ? Number(plain.compensationMin) : null,
      maximum: plain.compensationMax != null ? Number(plain.compensationMax) : null,
    },
    createdById: plain.createdById ?? null,
    updatedById: plain.updatedById ?? null,
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
  };

  if (includeRelationships) {
    const assets = Array.isArray(plain.assets) ? plain.assets.map(sanitizeAsset).filter(Boolean) : [];
    const permissions = Array.isArray(plain.permissions)
      ? plain.permissions.map(sanitizePermission).filter(Boolean)
      : [];
    result.assets = assets;
    result.permissions = permissions;
  }

  return result;
}

function coerceRole(role) {
  if (!role) {
    return null;
  }
  const normalized = role.toString().trim().toLowerCase();
  if (!CREATION_STUDIO_ROLE_OPTIONS.includes(normalized)) {
    throw new ValidationError(`Unsupported role "${role}" for creation studio permissions.`);
  }
  return normalized;
}

function normalizePermissions(value) {
  if (!value) {
    return null;
  }
  if (!Array.isArray(value)) {
    throw new ValidationError('permissions must be an array.');
  }
  const normalized = value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }
      const role = coerceRole(entry.role);
      if (!role) {
        return null;
      }
      return {
        role,
        canView: entry.canView !== undefined ? Boolean(entry.canView) : true,
        canEdit: Boolean(entry.canEdit),
        canPublish: Boolean(entry.canPublish),
        canManageAssets: Boolean(entry.canManageAssets),
      };
    })
    .filter(Boolean);
  if (!normalized.length) {
    return null;
  }
  const deduped = [];
  const seen = new Set();
  normalized.forEach((permission) => {
    if (seen.has(permission.role)) {
      const existing = deduped.find((item) => item.role === permission.role);
      existing.canView = existing.canView || permission.canView;
      existing.canEdit = existing.canEdit || permission.canEdit;
      existing.canPublish = existing.canPublish || permission.canPublish;
      existing.canManageAssets = existing.canManageAssets || permission.canManageAssets;
    } else {
      deduped.push(permission);
      seen.add(permission.role);
    }
  });
  return deduped;
}

function normalizeAssets(value) {
  if (value == null) {
    return null;
  }
  if (!Array.isArray(value)) {
    throw new ValidationError('assets must be an array.');
  }
  const normalized = value
    .map((asset, index) => {
      if (!asset || typeof asset !== 'object') {
        return null;
      }
      const label = `${asset.label ?? ''}`.trim();
      const url = `${asset.url ?? ''}`.trim();
      if (!label || !url) {
        throw new ValidationError('Each asset requires a label and url.');
      }
      const orderIndex = Number.isFinite(Number(asset.orderIndex)) ? Number(asset.orderIndex) : index;
      return {
        label,
        type: `${asset.type ?? 'image'}`.trim().toLowerCase() || 'image',
        url,
        thumbnailUrl: asset.thumbnailUrl ? `${asset.thumbnailUrl}`.trim() : null,
        altText: asset.altText ? `${asset.altText}`.trim() : null,
        caption: asset.caption ? `${asset.caption}`.trim() : null,
        isPrimary: Boolean(asset.isPrimary),
        orderIndex,
        metadata: asset.metadata ? parseObject(asset.metadata, { allowEmpty: true, fieldName: 'asset.metadata' }) : null,
      };
    })
    .filter(Boolean);
  return normalized;
}

function normalizeEnum(value, allowed, { fieldName, required = false, defaultValue = null } = {}) {
  if (value == null || value === '') {
    if (required && defaultValue == null) {
      throw new ValidationError(`${fieldName} is required.`);
    }
    return defaultValue;
  }
  const normalized = `${value}`.trim().toLowerCase();
  if (!allowed.includes(normalized)) {
    throw new ValidationError(`${fieldName} must be one of: ${allowed.join(', ')}.`);
  }
  return normalized;
}

function normalizePayload(payload, { partial = false } = {}) {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('A payload is required to configure the Creation Studio item.');
  }

  const body = {};
  const ownerCandidate = payload.ownerId ?? payload.userId ?? payload.freelancerId;
  if (ownerCandidate !== undefined) {
    const numericOwner = Number.parseInt(ownerCandidate, 10);
    if (!Number.isFinite(numericOwner) || numericOwner <= 0) {
      throw new ValidationError('ownerId must be a positive integer.');
    }
    body.ownerId = numericOwner;
  } else if (!partial) {
    throw new ValidationError('ownerId is required.');
  }

  if (payload.title !== undefined || !partial) {
    const title = `${payload.title ?? ''}`.trim();
    if (!title) {
      throw new ValidationError('title is required.');
    }
    body.title = title;
  }

  if (payload.summary !== undefined) {
    body.summary = payload.summary ? `${payload.summary}`.trim() : null;
  }
  if (payload.description !== undefined) {
    body.description = payload.description ? `${payload.description}`.trim() : null;
  }

  if (payload.slug !== undefined) {
    body.slug = payload.slug ? slugify(payload.slug, slugify(body.title ?? payload.title ?? 'creation')) : null;
  }

  const typeValue = payload.type !== undefined ? payload.type : !partial ? 'gig' : undefined;
  if (typeValue !== undefined) {
    body.type = normalizeEnum(typeValue, CREATION_STUDIO_ITEM_TYPES, { fieldName: 'type', required: true });
  }

  if (payload.status !== undefined || !partial) {
    const statusValue = payload.status ?? 'draft';
    body.status = normalizeEnum(statusValue, CREATION_STUDIO_ITEM_STATUSES, { fieldName: 'status', required: true });
  }

  if (payload.visibility !== undefined || !partial) {
    const visibilityValue = payload.visibility ?? 'private';
    body.visibility = normalizeEnum(visibilityValue, CREATION_STUDIO_VISIBILITIES, {
      fieldName: 'visibility',
      required: true,
    });
  }

  if (payload.format !== undefined || !partial) {
    const formatValue = payload.format ?? 'async';
    body.format = normalizeEnum(formatValue, CREATION_STUDIO_FORMATS, { fieldName: 'format', required: true });
  }

  if (payload.heroImageUrl !== undefined) {
    body.heroImageUrl = payload.heroImageUrl ? `${payload.heroImageUrl}`.trim() : null;
  }
  if (payload.heroVideoUrl !== undefined) {
    body.heroVideoUrl = payload.heroVideoUrl ? `${payload.heroVideoUrl}`.trim() : null;
  }
  if (payload.thumbnailUrl !== undefined) {
    body.thumbnailUrl = payload.thumbnailUrl ? `${payload.thumbnailUrl}`.trim() : null;
  }

  if (payload.commitmentHours !== undefined) {
    body.commitmentHours = parseNumeric(payload.commitmentHours);
  }
  if (payload.experienceLevel !== undefined) {
    body.experienceLevel = payload.experienceLevel ? `${payload.experienceLevel}`.trim() : null;
  }

  const monetization = payload.monetization ?? payload.compensation;
  if (
    monetization?.currency !== undefined ||
    payload.compensationCurrency !== undefined ||
    (!partial && !payload.compensationCurrency && !monetization?.currency)
  ) {
    const currencyValue = monetization?.currency ?? payload.compensationCurrency ?? 'USD';
    body.compensationCurrency = normalizeEnum(currencyValue, ['usd', 'eur', 'gbp', 'cad', 'aud', 'nzd', 'sgd', 'inr'], {
      fieldName: 'compensation currency',
      required: true,
      defaultValue: 'usd',
    }).toUpperCase();
  }
  if (monetization?.minimum !== undefined || monetization?.min !== undefined || payload.compensationMin !== undefined) {
    const minValue = monetization?.minimum ?? monetization?.min ?? payload.compensationMin;
    body.compensationMin = parseNumeric(minValue);
  }
  if (monetization?.maximum !== undefined || monetization?.max !== undefined || payload.compensationMax !== undefined) {
    const maxValue = monetization?.maximum ?? monetization?.max ?? payload.compensationMax;
    body.compensationMax = parseNumeric(maxValue);
  }
  if (monetization?.type !== undefined || payload.payoutType !== undefined || !partial) {
    const payoutTypeValue = monetization?.type ?? payload.payoutType ?? 'fixed';
    body.payoutType = normalizeEnum(payoutTypeValue, CREATION_STUDIO_PAYOUT_TYPES, {
      fieldName: 'payout type',
      required: true,
    });
  }

  const application = payload.application;
  if (application?.type !== undefined || payload.applicationType !== undefined || !partial) {
    const applicationType = application?.type ?? payload.applicationType ?? 'external';
    body.applicationType = normalizeEnum(applicationType, CREATION_STUDIO_APPLICATION_TYPES, {
      fieldName: 'application type',
      required: true,
    });
  }
  if (application?.url !== undefined || payload.applicationUrl !== undefined) {
    const applicationUrl = application?.url ?? payload.applicationUrl;
    body.applicationUrl = applicationUrl ? `${applicationUrl}`.trim() : null;
  }
  if (application?.instructions !== undefined || payload.applicationInstructions !== undefined) {
    const applicationInstructions = application?.instructions ?? payload.applicationInstructions;
    body.applicationInstructions = applicationInstructions ? `${applicationInstructions}`.trim() : null;
  }
  const applicationDeadline = application?.deadline ?? payload.applicationDeadline;
  if (applicationDeadline !== undefined) {
    body.applicationDeadline = applicationDeadline ? parseDate(applicationDeadline, 'applicationDeadline') : null;
  }

  const startAt = payload.startAt ?? payload.schedule?.startAt;
  const endAt = payload.endAt ?? payload.schedule?.endAt;
  const scheduledAt = payload.scheduledAt ?? payload.schedule?.scheduledAt;
  if (startAt !== undefined) {
    body.startAt = startAt ? parseDate(startAt, 'startAt') : null;
  }
  if (endAt !== undefined) {
    body.endAt = endAt ? parseDate(endAt, 'endAt') : null;
  }
  if (scheduledAt !== undefined) {
    body.scheduledAt = scheduledAt ? parseDate(scheduledAt, 'scheduledAt') : null;
  }

  const tags = normalizeStringArray(payload.tags);
  if (payload.tags !== undefined) {
    body.tags = tags.length ? tags : null;
  }
  const deliverables = normalizeStringArray(payload.deliverables ?? payload.keyDeliverables);
  if (payload.deliverables !== undefined || payload.keyDeliverables !== undefined) {
    body.deliverables = deliverables.length ? deliverables : null;
  }

  const audienceSegments = normalizeStringArray(
    payload.audienceSegments ?? payload.audience ?? payload.targetAudience,
  );
  if (
    payload.audienceSegments !== undefined ||
    payload.audience !== undefined ||
    payload.targetAudience !== undefined
  ) {
    body.audienceSegments = audienceSegments.length ? audienceSegments : null;
  }

  if (payload.metadata !== undefined) {
    body.metadata = parseObject(payload.metadata, { allowEmpty: true, fieldName: 'metadata' });
  }
  if (payload.settings !== undefined) {
    body.settings = parseObject(payload.settings, { allowEmpty: true, fieldName: 'settings' });
  }

  const cta = payload.cta ?? {};
  const ctaLabel = cta.label ?? payload.ctaLabel;
  const ctaUrl = cta.url ?? payload.ctaUrl;
  if (ctaLabel !== undefined) {
    body.ctaLabel = ctaLabel ? `${ctaLabel}`.trim() : null;
  }
  if (ctaUrl !== undefined) {
    body.ctaUrl = ctaUrl ? `${ctaUrl}`.trim() : null;
  }

  if (payload.locationLabel !== undefined || payload.location?.label !== undefined) {
    const label = payload.locationLabel ?? payload.location?.label;
    body.locationLabel = label ? `${label}`.trim() : null;
  }

  if (
    payload.location !== undefined ||
    payload.locationDetails !== undefined ||
    payload.locationCity !== undefined ||
    payload.locationRegion !== undefined ||
    payload.locationCountry !== undefined ||
    payload.locationTimezone !== undefined ||
    payload.virtualLocationUrl !== undefined
  ) {
    const details = parseObject(payload.locationDetails ?? payload.location, {
      allowEmpty: true,
      fieldName: 'location details',
    });
    if (payload.locationCity !== undefined) {
      details.city = payload.locationCity ? `${payload.locationCity}`.trim() : null;
    }
    if (payload.locationRegion !== undefined) {
      details.region = payload.locationRegion ? `${payload.locationRegion}`.trim() : null;
    }
    if (payload.locationCountry !== undefined) {
      details.country = payload.locationCountry ? `${payload.locationCountry}`.trim() : null;
    }
    if (payload.locationTimezone !== undefined) {
      details.timezone = payload.locationTimezone ? `${payload.locationTimezone}`.trim() : null;
    }
    if (payload.virtualLocationUrl !== undefined) {
      details.virtualUrl = payload.virtualLocationUrl ? `${payload.virtualLocationUrl}`.trim() : null;
    }
    Object.keys(details).forEach((key) => {
      if (details[key] == null || details[key] === '') {
        delete details[key];
      }
    });
    body.locationDetails = Object.keys(details).length ? details : null;
  }

  const permissions = normalizePermissions(payload.permissions);
  const assets = normalizeAssets(payload.assets);

  if (permissions) {
    const rolesWithView = permissions.filter((permission) => permission.canView).map((permission) => permission.role);
    const roleAccess = normalizeStringArray(payload.roleAccess ?? rolesWithView);
    body.roleAccess = roleAccess.length ? roleAccess : rolesWithView;
  } else if (payload.roleAccess !== undefined) {
    const roleAccess = normalizeStringArray(payload.roleAccess);
    body.roleAccess = roleAccess.length ? roleAccess : null;
  }

  return { body, permissions, assets };
}

function defaultPermissions() {
  return [
    {
      role: 'freelancer',
      canView: true,
      canEdit: true,
      canPublish: true,
      canManageAssets: true,
    },
    {
      role: 'admin',
      canView: true,
      canEdit: true,
      canPublish: true,
      canManageAssets: true,
    },
  ];
}

export async function listCreationStudioItems(filters = {}) {
  await ensureModelsReady();
  const pageValue = Number.parseInt(filters.page ?? 1, 10);
  const page = Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1;
  const pageSizeValue = Number.parseInt(filters.pageSize ?? 20, 10);
  const pageSize = Number.isFinite(pageSizeValue) && pageSizeValue > 0 ? Math.min(pageSizeValue, 100) : 20;
  const offset = (page - 1) * pageSize;

  const where = {};
  if (filters.ownerId) {
    const ownerId = Number.parseInt(filters.ownerId, 10);
    if (!Number.isFinite(ownerId) || ownerId <= 0) {
      throw new ValidationError('ownerId must be a positive integer.');
    }
    where.ownerId = ownerId;
  }
  if (filters.type) {
    where.type = normalizeEnum(filters.type, CREATION_STUDIO_ITEM_TYPES, { fieldName: 'type', required: true });
  }
  if (filters.status) {
    where.status = normalizeEnum(filters.status, CREATION_STUDIO_ITEM_STATUSES, {
      fieldName: 'status',
      required: true,
    });
  }
  if (filters.visibility) {
    where.visibility = normalizeEnum(filters.visibility, CREATION_STUDIO_VISIBILITIES, {
      fieldName: 'visibility',
      required: true,
    });
  }

  if (filters.search) {
    const dialect = creationStudioSequelize.getDialect();
    const operator = ['postgres', 'postgresql'].includes(dialect) ? Op.iLike : Op.like;
    const term = `%${filters.search.replace(/%/g, '').trim()}%`;
    where[Op.or] = [
      { title: { [operator]: term } },
      { summary: { [operator]: term } },
      { description: { [operator]: term } },
    ];
  }

  const { rows, count } = await CreationStudioItem.findAndCountAll({
    where,
    limit: pageSize,
    offset,
    order: [
      ['updatedAt', 'DESC'],
      ['id', 'DESC'],
    ],
  });

  return {
    items: rows.map((row) => sanitizeItem(row, { includeRelationships: false })),
    pagination: {
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    },
    filters: {
      ownerId: where.ownerId ?? null,
      type: where.type ?? null,
      status: where.status ?? null,
      visibility: where.visibility ?? null,
      search: filters.search ?? null,
    },
  };
}

export async function getCreationStudioItem(itemId) {
  await ensureModelsReady();
  const id = Number.parseInt(itemId, 10);
  if (!Number.isFinite(id) || id <= 0) {
    throw new ValidationError('itemId must be a positive integer.');
  }
  const item = await CreationStudioItem.findByPk(id, {
    include: [
      {
        model: CreationStudioAsset,
        as: 'assets',
        separate: true,
        order: [
          ['orderIndex', 'ASC'],
          ['id', 'ASC'],
        ],
      },
      {
        model: CreationStudioPermission,
        as: 'permissions',
        separate: true,
        order: [['role', 'ASC']],
      },
    ],
  });
  if (!item) {
    throw new NotFoundError('Creation Studio item not found.');
  }
  return sanitizeItem(item);
}

export async function createCreationStudioItem(payload, { actorId } = {}) {
  await ensureModelsReady();
  const { body, permissions, assets } = normalizePayload(payload, { partial: false });

  const resolvedPermissions = permissions && permissions.length ? permissions : defaultPermissions();
  const viewRoles = resolvedPermissions.filter((entry) => entry.canView).map((entry) => entry.role);
  body.roleAccess = viewRoles.length ? viewRoles : body.roleAccess ?? ['freelancer'];
  body.createdById = actorId ?? body.ownerId ?? null;
  body.updatedById = actorId ?? body.ownerId ?? null;

  const result = await creationStudioSequelize.transaction(async (transaction) => {
    if (!body.slug && body.title) {
      body.slug = await ensureUniqueSlug(slugify(body.title), { transaction });
    } else if (body.slug) {
      body.slug = await ensureUniqueSlug(slugify(body.slug), { transaction });
    }

    const created = await CreationStudioItem.create(body, { transaction });

    if (assets && assets.length) {
      const assetPayload = assets.map((asset) => ({
        ...asset,
        itemId: created.id,
      }));
      await CreationStudioAsset.bulkCreate(assetPayload, { transaction });
    }

    if (resolvedPermissions.length) {
      const permissionPayload = resolvedPermissions.map((permission) => ({
        ...permission,
        itemId: created.id,
      }));
      await CreationStudioPermission.bulkCreate(permissionPayload, { transaction });
    }

    return created.id;
  });

  return getCreationStudioItem(result);
}

export async function updateCreationStudioItem(itemId, payload, { actorId } = {}) {
  await ensureModelsReady();
  const id = Number.parseInt(itemId, 10);
  if (!Number.isFinite(id) || id <= 0) {
    throw new ValidationError('itemId must be a positive integer.');
  }
  const existing = await CreationStudioItem.findByPk(id);
  if (!existing) {
    throw new NotFoundError('Creation Studio item not found.');
  }

  const { body, permissions, assets } = normalizePayload(payload, { partial: true });
  if (actorId) {
    body.updatedById = actorId;
  }

  await creationStudioSequelize.transaction(async (transaction) => {
    if (body.slug !== undefined) {
      body.slug = body.slug ? await ensureUniqueSlug(slugify(body.slug), { transaction, ignoreId: id }) : null;
    } else if (!existing.slug && body.title) {
      body.slug = await ensureUniqueSlug(slugify(body.title), { transaction, ignoreId: id });
    }

    if (body.status === 'published' && !existing.publishedAt) {
      body.publishedAt = new Date();
    }
    if (body.status && body.status !== 'published' && payload.publishedAt === undefined) {
      body.publishedAt = body.status === 'published' ? new Date() : existing.publishedAt;
    }

    await existing.update(body, { transaction });

    if (Array.isArray(assets)) {
      await CreationStudioAsset.destroy({ where: { itemId: id }, transaction });
      if (assets.length) {
        const assetPayload = assets.map((asset) => ({ ...asset, itemId: id }));
        await CreationStudioAsset.bulkCreate(assetPayload, { transaction });
      }
    }

    if (Array.isArray(permissions)) {
      await CreationStudioPermission.destroy({ where: { itemId: id }, transaction });
      if (permissions.length) {
        const permissionPayload = permissions.map((permission) => ({ ...permission, itemId: id }));
        await CreationStudioPermission.bulkCreate(permissionPayload, { transaction });
      }
    }
  });

  return getCreationStudioItem(id);
}

export async function publishCreationStudioItem(itemId, payload = {}, { actorId } = {}) {
  await ensureModelsReady();
  const id = Number.parseInt(itemId, 10);
  if (!Number.isFinite(id) || id <= 0) {
    throw new ValidationError('itemId must be a positive integer.');
  }
  const item = await CreationStudioItem.findByPk(id);
  if (!item) {
    throw new NotFoundError('Creation Studio item not found.');
  }

  const update = {};
  if (payload.visibility !== undefined) {
    update.visibility = normalizeEnum(payload.visibility, CREATION_STUDIO_VISIBILITIES, {
      fieldName: 'visibility',
      required: true,
    });
  }
  if (payload.status !== undefined) {
    update.status = normalizeEnum(payload.status, CREATION_STUDIO_ITEM_STATUSES, {
      fieldName: 'status',
      required: true,
    });
  }

  const scheduledAt = payload.scheduledAt ?? payload.schedule?.scheduledAt ?? null;
  if (scheduledAt) {
    const scheduleDate = parseDate(scheduledAt, 'scheduledAt');
    update.scheduledAt = scheduleDate;
    update.status = scheduleDate.getTime() > Date.now() ? 'scheduled' : 'published';
    if (update.status === 'published') {
      update.publishedAt = new Date();
    }
  } else {
    update.scheduledAt = null;
    update.publishedAt = new Date();
    update.status = update.status ?? 'published';
  }

  if (actorId) {
    update.updatedById = actorId;
  }

  await item.update(update);
  return getCreationStudioItem(id);
}

export default {
  listCreationStudioItems,
  getCreationStudioItem,
  createCreationStudioItem,
  updateCreationStudioItem,
  publishCreationStudioItem,
};
