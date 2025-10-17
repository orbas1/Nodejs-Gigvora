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
};
