import { Op, fn, col } from 'sequelize';
import sequelize from '../models/sequelizeClient.js';
import {
  CompanyPage,
  CompanyPageSection,
  CompanyPageRevision,
  CompanyPageCollaborator,
  CompanyPageMedia,
  COMPANY_PAGE_STATUSES,
  COMPANY_PAGE_VISIBILITIES,
  COMPANY_PAGE_SECTION_VARIANTS,
  COMPANY_PAGE_COLLABORATOR_ROLES,
  COMPANY_PAGE_COLLABORATOR_STATUSES,
} from '../models/companyPageModels.js';
import models from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const { ProviderWorkspace, User, Profile } = models;

const DEFAULT_BLUEPRINTS = Object.freeze([
  {
    id: 'employer_brand',
    name: 'Employer brand',
    description: 'Tell your culture story with values, benefits, and proof points.',
  },
  {
    id: 'team_spotlight',
    name: 'Team spotlight',
    description: 'Showcase a hiring team with mission, rituals, and open roles.',
  },
  {
    id: 'program_landing',
    name: 'Program landing',
    description: 'Launch an initiative or cohort with schedule, curriculum, and CTA.',
  },
  {
    id: 'event_microsite',
    name: 'Event microsite',
    description: 'Publish speakers, agenda, and registration for upcoming events.',
  },
]);

const DEFAULT_SECTION_LIBRARY = Object.freeze([
  {
    variant: 'hero',
    label: 'Hero',
    description: 'Large hero with headline, supporting copy, and primary CTA.',
  },
  {
    variant: 'story_block',
    label: 'Story block',
    description: 'Flexible text-first layout for mission and value narratives.',
  },
  {
    variant: 'metrics_grid',
    label: 'Metrics grid',
    description: 'Display quantified proof with 2-4 highlight metrics.',
  },
  {
    variant: 'media_gallery',
    label: 'Media gallery',
    description: 'Showcase image or video galleries with captions.',
  },
  {
    variant: 'team_spotlight',
    label: 'Team spotlight',
    description: 'Highlight teammates with avatars, roles, and quotes.',
  },
  {
    variant: 'faq',
    label: 'FAQ',
    description: 'Structured question and answer set to handle objections.',
  },
  {
    variant: 'cta_banner',
    label: 'CTA banner',
    description: 'High-visibility call-to-action with supporting copy.',
  },
  {
    variant: 'custom',
    label: 'Custom block',
    description: 'Bring your own layout using structured JSON content.',
  },
]);

function slugify(value, fallback = 'page') {
  if (!value || typeof value !== 'string') {
    return fallback;
  }
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
  return base || fallback;
}

async function ensureWorkspace(workspaceId, { transaction } = {}) {
  if (!workspaceId || !Number.isInteger(Number(workspaceId))) {
    throw new ValidationError('workspaceId is required.');
  }
  const workspace = await ProviderWorkspace.findByPk(workspaceId, { transaction });
  if (!workspace) {
    throw new NotFoundError('Workspace not found.');
  }
  return workspace;
}

async function ensureUniqueSlug(baseSlug, { workspaceId, transaction, ignoreId } = {}) {
  const base = slugify(baseSlug);
  let candidate = base;
  let suffix = 1;
  while (true) {
    const existing = await CompanyPage.findOne({
      where: {
        workspaceId,
        slug: candidate,
        ...(ignoreId ? { id: { [Op.ne]: ignoreId } } : {}),
      },
      transaction,
    });
    if (!existing) {
      return candidate;
    }
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

function sanitizeArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => {
      if (typeof entry === 'string') {
        const trimmed = entry.trim();
        return trimmed ? trimmed : null;
      }
      if (!entry || typeof entry !== 'object') {
        return null;
      }
      return entry;
    })
    .filter(Boolean);
}

function sanitizeTags(value) {
  return sanitizeArray(value).map((tag) =>
    typeof tag === 'string' ? tag.slice(0, 60) : String(tag).slice(0, 60),
  );
}

function sanitizeSeo(seo) {
  if (!seo || typeof seo !== 'object') {
    return undefined;
  }
  const result = {};
  if (seo.title) {
    result.title = String(seo.title).slice(0, 120);
  }
  if (seo.description) {
    result.description = String(seo.description).slice(0, 300);
  }
  if (Array.isArray(seo.keywords)) {
    result.keywords = seo.keywords.slice(0, 15).map((keyword) => String(keyword).slice(0, 40));
  }
  return result;
}

function sanitizeAllowedRoles(value) {
  if (!value) {
    return ['company', 'company_admin', 'workspace_admin'];
  }
  return Array.from(
    new Set(
      sanitizeArray(value).map((role) =>
        String(role)
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '_')
          .slice(0, 80),
      ),
    ),
  );
}

function normalizeSectionPayload(section, index) {
  const variant = COMPANY_PAGE_SECTION_VARIANTS.includes(section.variant)
    ? section.variant
    : 'custom';
  const payload = {
    id: section.id ?? undefined,
    title: section.title ? String(section.title).slice(0, 180) : null,
    sectionKey: section.sectionKey ? String(section.sectionKey).slice(0, 120) : null,
    variant,
    orderIndex: Number.isInteger(section.orderIndex) ? section.orderIndex : index,
    headline: section.headline ? String(section.headline).slice(0, 240) : null,
    body: section.body ? String(section.body) : null,
    content: section.content && typeof section.content === 'object' ? section.content : null,
    media: section.media && typeof section.media === 'object' ? section.media : null,
    ctaLabel: section.ctaLabel ? String(section.ctaLabel).slice(0, 120) : null,
    ctaUrl: section.ctaUrl ? String(section.ctaUrl).slice(0, 255) : null,
    visibility: COMPANY_PAGE_VISIBILITIES.includes(section.visibility)
      ? section.visibility
      : 'public',
    settings: section.settings && typeof section.settings === 'object' ? section.settings : null,
  };
  return payload;
}

function normalizeCollaboratorPayload(collaborator) {
  const role = COMPANY_PAGE_COLLABORATOR_ROLES.includes(collaborator.role)
    ? collaborator.role
    : 'editor';
  const status = COMPANY_PAGE_COLLABORATOR_STATUSES.includes(collaborator.status)
    ? collaborator.status
    : 'invited';
  return {
    id: collaborator.id ?? undefined,
    collaboratorId:
      collaborator.collaboratorId && Number.isInteger(Number(collaborator.collaboratorId))
        ? Number(collaborator.collaboratorId)
        : null,
    collaboratorEmail: collaborator.collaboratorEmail
      ? String(collaborator.collaboratorEmail).toLowerCase().slice(0, 180)
      : null,
    collaboratorName: collaborator.collaboratorName ? String(collaborator.collaboratorName).slice(0, 180) : null,
    role,
    status,
    permissions: collaborator.permissions && typeof collaborator.permissions === 'object'
      ? collaborator.permissions
      : null,
    invitedById:
      collaborator.invitedById && Number.isInteger(Number(collaborator.invitedById))
        ? Number(collaborator.invitedById)
        : null,
  };
}

function buildPageAnalyticsSnapshot(records) {
  const base = {
    total: records.length,
    statusCounts: COMPANY_PAGE_STATUSES.reduce((acc, status) => ({ ...acc, [status]: 0 }), {}),
    visibilityCounts: COMPANY_PAGE_VISIBILITIES.reduce((acc, visibility) => ({ ...acc, [visibility]: 0 }), {}),
    totalFollowers: 0,
    averageConversionRate: null,
    lastPublishedAt: null,
    scheduledCount: 0,
    upcomingLaunches: [],
  };

  if (!records.length) {
    return base;
  }

  const now = new Date();
  let conversionSum = 0;
  let conversionSamples = 0;

  const launches = [];

  for (const record of records) {
    const analytics = record.analytics ?? {};
    if (base.statusCounts[record.status] != null) {
      base.statusCounts[record.status] += 1;
    }
    if (base.visibilityCounts[record.visibility] != null) {
      base.visibilityCounts[record.visibility] += 1;
    }
    if (analytics.followers != null && Number.isFinite(Number(analytics.followers))) {
      base.totalFollowers += Number(analytics.followers);
    }
    if (analytics.conversionRate != null && Number.isFinite(Number(analytics.conversionRate))) {
      conversionSum += Number(analytics.conversionRate);
      conversionSamples += 1;
    }
    if (record.publishedAt) {
      const publishedAt = new Date(record.publishedAt);
      if (!base.lastPublishedAt || publishedAt > base.lastPublishedAt) {
        base.lastPublishedAt = publishedAt;
      }
    }
    if (record.status === 'scheduled' || record.scheduledFor) {
      const launchDate = record.scheduledFor ? new Date(record.scheduledFor) : null;
      if (launchDate && launchDate >= now) {
        base.scheduledCount += 1;
        launches.push({
          id: record.id,
          title: record.title,
          launchDate,
          status: record.status,
          owner: record.createdBy?.Profile?.fullName ?? record.createdBy?.name ?? null,
        });
      }
    }
  }

  if (conversionSamples > 0) {
    base.averageConversionRate = Number((conversionSum / conversionSamples).toFixed(2));
  }
  base.upcomingLaunches = launches
    .sort((a, b) => a.launchDate.getTime() - b.launchDate.getTime())
    .slice(0, 5)
    .map((launch) => ({
      id: launch.id,
      title: launch.title,
      launchDate: launch.launchDate,
      status: launch.status,
      owner: launch.owner,
    }));

  return base;
}

function buildGovernanceSnapshot(records) {
  const pendingApprovals = records.filter((record) => record.status === 'in_review').length;
  const missingHeroImage = records.filter((record) => !record.heroImageUrl && record.status !== 'archived').length;
  const restrictedVisibility = records.filter((record) => record.visibility !== 'public').length;

  return {
    approvalsPending: pendingApprovals,
    heroImageRequired: missingHeroImage,
    restrictedVisibility,
  };
}

function serializePage(page) {
  if (!page) {
    return null;
  }
  const plain = page.get ? page.get({ plain: true }) : page;
  if (plain.sections) {
    plain.sections = plain.sections.map((section) => (section.get ? section.get({ plain: true }) : section));
  }
  if (plain.collaborators) {
    plain.collaborators = plain.collaborators.map((collaborator) =>
      collaborator.get ? collaborator.get({ plain: true }) : collaborator,
    );
  }
  if (plain.media) {
    plain.media = plain.media.map((media) => (media.get ? media.get({ plain: true }) : media));
  }
  if (plain.revisions) {
    plain.revisions = plain.revisions
      .sort((a, b) => (b.version || 0) - (a.version || 0))
      .slice(0, 10)
      .map((revision) => (revision.get ? revision.get({ plain: true }) : revision));
  }
  return plain;
}

export async function listCompanyPages({
  workspaceId,
  status,
  visibility,
  search,
  limit = 20,
  offset = 0,
} = {}) {
  await ensureWorkspace(Number(workspaceId));

  const where = { workspaceId: Number(workspaceId) };
  if (status && COMPANY_PAGE_STATUSES.includes(status)) {
    where.status = status;
  }
  if (visibility && COMPANY_PAGE_VISIBILITIES.includes(visibility)) {
    where.visibility = visibility;
  }
  if (search && typeof search === 'string') {
    const like = `%${search.trim().toLowerCase()}%`;
    where[Op.or] = [
      sequelize.where(fn('LOWER', col('CompanyPage.title')), { [Op.like]: like }),
      sequelize.where(fn('LOWER', col('CompanyPage.headline')), { [Op.like]: like }),
      { slug: { [Op.like]: like } },
    ];
  }

  const { rows, count } = await CompanyPage.findAndCountAll({
    where,
    limit: Math.min(Number(limit) || 20, 100),
    offset: Number(offset) || 0,
    order: [
      ['status', 'ASC'],
      ['updatedAt', 'DESC'],
    ],
    include: [
      { model: CompanyPageSection, as: 'sections', separate: true, order: [['orderIndex', 'ASC']] },
      { model: CompanyPageCollaborator, as: 'collaborators' },
      { model: CompanyPageMedia, as: 'media' },
    ],
  });

  const analyticsSource = await CompanyPage.findAll({
    where: { workspaceId: Number(workspaceId) },
    attributes: ['id', 'title', 'slug', 'status', 'visibility', 'heroImageUrl', 'publishedAt', 'scheduledFor', 'analytics'],
    include: [
      { model: User, as: 'createdBy', attributes: ['id'], include: [{ model: Profile, attributes: ['fullName'] }] },
    ],
  });

  const analyticsSnapshot = buildPageAnalyticsSnapshot(analyticsSource.map((record) => record.get({ plain: true })));
  const governanceSignals = buildGovernanceSnapshot(analyticsSource.map((record) => record.get({ plain: true })));

  return {
    pages: rows.map(serializePage),
    pagination: {
      total: count,
      limit: Math.min(Number(limit) || 20, 100),
      offset: Number(offset) || 0,
    },
    stats: analyticsSnapshot,
    governance: governanceSignals,
    blueprints: DEFAULT_BLUEPRINTS,
    sectionLibrary: DEFAULT_SECTION_LIBRARY,
    collaboratorRoles: COMPANY_PAGE_COLLABORATOR_ROLES,
    visibilityOptions: COMPANY_PAGE_VISIBILITIES,
    statusOptions: COMPANY_PAGE_STATUSES,
  };
}

export async function getCompanyPage({ workspaceId, pageId }) {
  await ensureWorkspace(Number(workspaceId));
  if (!pageId || !Number.isInteger(Number(pageId))) {
    throw new ValidationError('pageId must be a numeric value.');
  }
  const page = await CompanyPage.findOne({
    where: { workspaceId: Number(workspaceId), id: Number(pageId) },
    include: [
      { model: CompanyPageSection, as: 'sections', order: [['orderIndex', 'ASC']] },
      { model: CompanyPageCollaborator, as: 'collaborators' },
      { model: CompanyPageMedia, as: 'media' },
      { model: CompanyPageRevision, as: 'revisions', separate: true, order: [['version', 'DESC']], limit: 10 },
    ],
  });
  if (!page) {
    throw new NotFoundError('Page not found.');
  }
  return serializePage(page);
}

export async function createCompanyPage({
  workspaceId,
  title,
  headline,
  summary,
  blueprint = 'employer_brand',
  visibility = 'private',
  status = 'draft',
  heroImageUrl,
  tags,
  seo,
  settings,
  allowedRoles,
  sections = [],
  collaborators = [],
  analytics,
  scheduledFor,
  actorId,
} = {}) {
  await ensureWorkspace(Number(workspaceId));
  const trimmedTitle = title ? String(title).trim() : '';
  if (!trimmedTitle) {
    throw new ValidationError('title is required.');
  }
  const trimmedHeadline = headline ? String(headline).trim() : '';
  if (!trimmedHeadline) {
    throw new ValidationError('headline is required.');
  }

  const visibilityOption = COMPANY_PAGE_VISIBILITIES.includes(visibility) ? visibility : 'private';
  const statusOption = COMPANY_PAGE_STATUSES.includes(status) ? status : 'draft';

  return sequelize.transaction(async (transaction) => {
    const slug = await ensureUniqueSlug(trimmedTitle, { workspaceId: Number(workspaceId), transaction });
    const page = await CompanyPage.create(
      {
        workspaceId: Number(workspaceId),
        title: trimmedTitle.slice(0, 180),
        headline: trimmedHeadline.slice(0, 240),
        slug,
        summary: summary ? String(summary) : null,
        blueprint,
        visibility: visibilityOption,
        status: statusOption,
        heroImageUrl: heroImageUrl ? String(heroImageUrl).slice(0, 255) : null,
        tags: sanitizeTags(tags),
        seo: sanitizeSeo(seo),
        settings: settings && typeof settings === 'object' ? settings : null,
        allowedRoles: sanitizeAllowedRoles(allowedRoles),
        analytics: analytics && typeof analytics === 'object' ? analytics : null,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        createdById: actorId ?? null,
        updatedById: actorId ?? null,
        lastEditedById: actorId ?? null,
      },
      { transaction },
    );

    if (Array.isArray(sections) && sections.length) {
      const normalizedSections = sections.map((section, index) => ({
        ...normalizeSectionPayload(section, index),
        pageId: page.id,
      }));
      await CompanyPageSection.bulkCreate(normalizedSections, { transaction });
    }

    if (Array.isArray(collaborators) && collaborators.length) {
      const normalizedCollaborators = collaborators.map((entry) => ({
        ...normalizeCollaboratorPayload(entry),
        pageId: page.id,
      }));
      await CompanyPageCollaborator.bulkCreate(normalizedCollaborators, { transaction });
    }

    const snapshot = await CompanyPage.findByPk(page.id, {
      include: [
        { model: CompanyPageSection, as: 'sections', order: [['orderIndex', 'ASC']] },
        { model: CompanyPageCollaborator, as: 'collaborators' },
      ],
      transaction,
    });

    await CompanyPageRevision.create(
      {
        pageId: page.id,
        version: 1,
        snapshot: serializePage(snapshot),
        notes: 'Initial draft created',
        createdById: actorId ?? null,
      },
      { transaction },
    );

    const created = await CompanyPage.findByPk(page.id, {
      include: [
        { model: CompanyPageSection, as: 'sections', order: [['orderIndex', 'ASC']] },
        { model: CompanyPageCollaborator, as: 'collaborators' },
        { model: CompanyPageMedia, as: 'media' },
      ],
      transaction,
    });

    return serializePage(created);
  });
}

export async function updateCompanyPage({
  workspaceId,
  pageId,
  title,
  slug,
  headline,
  summary,
  blueprint,
  visibility,
  status,
  heroImageUrl,
  tags,
  seo,
  settings,
  allowedRoles,
  analytics,
  scheduledFor,
  actorId,
} = {}) {
  await ensureWorkspace(Number(workspaceId));
  if (!pageId || !Number.isInteger(Number(pageId))) {
    throw new ValidationError('pageId must be a numeric value.');
  }

  return sequelize.transaction(async (transaction) => {
    const page = await CompanyPage.findOne({
      where: { id: Number(pageId), workspaceId: Number(workspaceId) },
      transaction,
    });
    if (!page) {
      throw new NotFoundError('Page not found.');
    }

    const updates = {};
    let nextSlug = null;
    if (title != null) {
      const trimmed = String(title).trim();
      if (!trimmed) {
        throw new ValidationError('title cannot be empty.');
      }
      updates.title = trimmed.slice(0, 180);
      nextSlug = await ensureUniqueSlug(trimmed, {
        workspaceId: Number(workspaceId),
        ignoreId: page.id,
        transaction,
      });
    }
    if (slug != null) {
      const trimmedSlug = String(slug).trim();
      if (!trimmedSlug) {
        throw new ValidationError('slug cannot be empty.');
      }
      nextSlug = await ensureUniqueSlug(trimmedSlug, {
        workspaceId: Number(workspaceId),
        ignoreId: page.id,
        transaction,
      });
    }
    if (nextSlug) {
      updates.slug = nextSlug.slice(0, 200);
    }
    if (headline != null) {
      const trimmed = String(headline).trim();
      if (!trimmed) {
        throw new ValidationError('headline cannot be empty.');
      }
      updates.headline = trimmed.slice(0, 240);
    }
    if (summary !== undefined) {
      updates.summary = summary ? String(summary) : null;
    }
    if (blueprint) {
      updates.blueprint = String(blueprint).slice(0, 120);
    }
    if (visibility) {
      updates.visibility = COMPANY_PAGE_VISIBILITIES.includes(visibility) ? visibility : page.visibility;
    }
    if (status) {
      updates.status = COMPANY_PAGE_STATUSES.includes(status) ? status : page.status;
    }
    if (heroImageUrl !== undefined) {
      updates.heroImageUrl = heroImageUrl ? String(heroImageUrl).slice(0, 255) : null;
    }
    if (tags !== undefined) {
      updates.tags = sanitizeTags(tags);
    }
    if (seo !== undefined) {
      updates.seo = sanitizeSeo(seo) ?? null;
    }
    if (settings !== undefined) {
      updates.settings = settings && typeof settings === 'object' ? settings : null;
    }
    if (allowedRoles !== undefined) {
      updates.allowedRoles = sanitizeAllowedRoles(allowedRoles);
    }
    if (analytics !== undefined) {
      updates.analytics = analytics && typeof analytics === 'object' ? analytics : null;
    }
    if (scheduledFor !== undefined) {
      updates.scheduledFor = scheduledFor ? new Date(scheduledFor) : null;
    }

    updates.updatedById = actorId ?? page.updatedById;
    updates.lastEditedById = actorId ?? page.lastEditedById;

    await page.update(updates, { transaction });

    const latestRevision = await CompanyPageRevision.max('version', {
      where: { pageId: page.id },
      transaction,
    });

    const fresh = await CompanyPage.findByPk(page.id, {
      include: [
        { model: CompanyPageSection, as: 'sections', order: [['orderIndex', 'ASC']] },
        { model: CompanyPageCollaborator, as: 'collaborators' },
        { model: CompanyPageMedia, as: 'media' },
      ],
      transaction,
    });

    await CompanyPageRevision.create(
      {
        pageId: page.id,
        version: Number.isInteger(latestRevision) ? latestRevision + 1 : 1,
        snapshot: serializePage(fresh),
        notes: 'Page settings updated',
        createdById: actorId ?? null,
      },
      { transaction },
    );

    return serializePage(fresh);
  });
}

export async function replacePageSections({ workspaceId, pageId, sections = [], actorId } = {}) {
  await ensureWorkspace(Number(workspaceId));
  if (!pageId || !Number.isInteger(Number(pageId))) {
    throw new ValidationError('pageId must be a numeric value.');
  }
  return sequelize.transaction(async (transaction) => {
    const page = await CompanyPage.findOne({
      where: { id: Number(pageId), workspaceId: Number(workspaceId) },
      transaction,
    });
    if (!page) {
      throw new NotFoundError('Page not found.');
    }

    await CompanyPageSection.destroy({ where: { pageId: page.id }, transaction });
    if (Array.isArray(sections) && sections.length) {
      const normalized = sections.map((section, index) => ({
        ...normalizeSectionPayload(section, index),
        pageId: page.id,
      }));
      await CompanyPageSection.bulkCreate(normalized, { transaction });
    }

    const fresh = await CompanyPage.findByPk(page.id, {
      include: [
        { model: CompanyPageSection, as: 'sections', order: [['orderIndex', 'ASC']] },
        { model: CompanyPageCollaborator, as: 'collaborators' },
        { model: CompanyPageMedia, as: 'media' },
      ],
      transaction,
    });

    const latestRevision = await CompanyPageRevision.max('version', {
      where: { pageId: page.id },
      transaction,
    });

    await CompanyPageRevision.create(
      {
        pageId: page.id,
        version: Number.isInteger(latestRevision) ? latestRevision + 1 : 1,
        snapshot: serializePage(fresh),
        notes: 'Sections updated',
        createdById: actorId ?? null,
      },
      { transaction },
    );

    return serializePage(fresh);
  });
}

export async function replacePageCollaborators({ workspaceId, pageId, collaborators = [], actorId } = {}) {
  await ensureWorkspace(Number(workspaceId));
  if (!pageId || !Number.isInteger(Number(pageId))) {
    throw new ValidationError('pageId must be a numeric value.');
  }

  return sequelize.transaction(async (transaction) => {
    const page = await CompanyPage.findOne({
      where: { id: Number(pageId), workspaceId: Number(workspaceId) },
      transaction,
    });
    if (!page) {
      throw new NotFoundError('Page not found.');
    }

    await CompanyPageCollaborator.destroy({ where: { pageId: page.id }, transaction });
    if (Array.isArray(collaborators) && collaborators.length) {
      const normalized = collaborators.map((entry) => ({
        ...normalizeCollaboratorPayload(entry),
        pageId: page.id,
        invitedById: entry.invitedById ?? actorId ?? entry.invitedById ?? null,
      }));
      await CompanyPageCollaborator.bulkCreate(normalized, { transaction });
    }

    const fresh = await CompanyPage.findByPk(page.id, {
      include: [
        { model: CompanyPageSection, as: 'sections', order: [['orderIndex', 'ASC']] },
        { model: CompanyPageCollaborator, as: 'collaborators' },
        { model: CompanyPageMedia, as: 'media' },
      ],
      transaction,
    });

    return serializePage(fresh);
  });
}

export async function publishCompanyPage({ workspaceId, pageId, actorId } = {}) {
  await ensureWorkspace(Number(workspaceId));
  if (!pageId || !Number.isInteger(Number(pageId))) {
    throw new ValidationError('pageId must be a numeric value.');
  }
  return sequelize.transaction(async (transaction) => {
    const page = await CompanyPage.findOne({
      where: { id: Number(pageId), workspaceId: Number(workspaceId) },
      transaction,
    });
    if (!page) {
      throw new NotFoundError('Page not found.');
    }

    await page.update(
      {
        status: 'published',
        visibility: page.visibility === 'private' ? 'internal' : page.visibility,
        publishedAt: new Date(),
        scheduledFor: null,
        updatedById: actorId ?? page.updatedById,
        lastEditedById: actorId ?? page.lastEditedById,
      },
      { transaction },
    );

    const fresh = await CompanyPage.findByPk(page.id, {
      include: [
        { model: CompanyPageSection, as: 'sections', order: [['orderIndex', 'ASC']] },
        { model: CompanyPageCollaborator, as: 'collaborators' },
        { model: CompanyPageMedia, as: 'media' },
      ],
      transaction,
    });

    const latestRevision = await CompanyPageRevision.max('version', {
      where: { pageId: page.id },
      transaction,
    });

    await CompanyPageRevision.create(
      {
        pageId: page.id,
        version: Number.isInteger(latestRevision) ? latestRevision + 1 : 1,
        snapshot: serializePage(fresh),
        notes: 'Page published',
        createdById: actorId ?? null,
      },
      { transaction },
    );

    return serializePage(fresh);
  });
}

export async function archiveCompanyPage({ workspaceId, pageId, actorId } = {}) {
  await ensureWorkspace(Number(workspaceId));
  if (!pageId || !Number.isInteger(Number(pageId))) {
    throw new ValidationError('pageId must be a numeric value.');
  }
  return sequelize.transaction(async (transaction) => {
    const page = await CompanyPage.findOne({
      where: { id: Number(pageId), workspaceId: Number(workspaceId) },
      transaction,
    });
    if (!page) {
      throw new NotFoundError('Page not found.');
    }

    await page.update(
      {
        status: 'archived',
        archivedAt: new Date(),
        updatedById: actorId ?? page.updatedById,
        lastEditedById: actorId ?? page.lastEditedById,
      },
      { transaction },
    );

    return true;
  });
}

export async function deleteCompanyPage({ workspaceId, pageId } = {}) {
  await ensureWorkspace(Number(workspaceId));
  if (!pageId || !Number.isInteger(Number(pageId))) {
    throw new ValidationError('pageId must be a numeric value.');
  }
  const deleted = await CompanyPage.destroy({
    where: { id: Number(pageId), workspaceId: Number(workspaceId) },
  });
  if (!deleted) {
    throw new NotFoundError('Page not found.');
  }
  return true;
}

export async function getWorkspacePageSnapshot({ workspaceId } = {}) {
  await ensureWorkspace(Number(workspaceId));
  const pages = await CompanyPage.findAll({
    where: { workspaceId: Number(workspaceId) },
    attributes: [
      'id',
      'title',
      'status',
      'visibility',
      'heroImageUrl',
      'publishedAt',
      'scheduledFor',
      'analytics',
    ],
    include: [
      { model: User, as: 'createdBy', attributes: ['id'], include: [{ model: Profile, attributes: ['fullName'] }] },
    ],
  });

  const snapshot = buildPageAnalyticsSnapshot(pages.map((page) => page.get({ plain: true })));
  const governance = buildGovernanceSnapshot(pages.map((page) => page.get({ plain: true })));

  return {
    ...snapshot,
    governance,
  };
}

export default {
  listCompanyPages,
  getCompanyPage,
  createCompanyPage,
  updateCompanyPage,
  replacePageSections,
  replacePageCollaborators,
  publishCompanyPage,
  archiveCompanyPage,
  deleteCompanyPage,
  getWorkspacePageSnapshot,
};
