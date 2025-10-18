import crypto from 'node:crypto';
import {
  sequelize,
  User,
  CareerDocument,
  CareerDocumentVersion,
  CareerDocumentCollaborator,
  CareerDocumentExport,
} from '../models/careerDocumentModels.js';
import { ValidationError, NotFoundError, AuthorizationError } from '../utils/errors.js';

const ALLOWED_CREATOR_ROLES = new Set(['user', 'freelancer', 'headhunter', 'mentor', 'admin']);
const ADMIN_OVERRIDE_ROLES = new Set(['admin', 'talent_lead', 'career_coach']);

function slugify(value, fallback = 'cv-document') {
  if (!value || typeof value !== 'string') {
    return fallback;
  }
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 80)
    .trim() || fallback;
}

function normalizeTags(raw) {
  if (!raw) {
    return [];
  }
  if (Array.isArray(raw)) {
    return [...new Set(raw.map((tag) => `${tag}`.trim()).filter(Boolean))];
  }
  if (typeof raw === 'string') {
    return [...new Set(raw.split(',').map((tag) => tag.trim()).filter(Boolean))];
  }
  return [];
}

function normalizeMetadata(raw = {}) {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const { persona, impact, keywords, ...rest } = raw;
  const metadata = { ...rest };
  if (persona) {
    metadata.persona = persona;
  }
  if (impact) {
    metadata.impact = impact;
  }
  if (keywords) {
    metadata.keywords = Array.isArray(keywords)
      ? keywords.map((item) => `${item}`.trim()).filter(Boolean)
      : typeof keywords === 'string'
        ? keywords
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : keywords;
  }
  return metadata;
}

function normalizeStoryBlocks(raw) {
  if (!raw) {
    return [];
  }
  if (Array.isArray(raw)) {
    return [...new Set(raw.map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0))];
  }
  return [];
}

function extractActor({ actorId, actorRoles, userId }) {
  const resolvedActorId = Number(actorId);
  if (!Number.isFinite(resolvedActorId) || resolvedActorId <= 0) {
    throw new AuthorizationError('Actor identity is required to manage CV documents.');
  }
  const normalizedRoles = Array.isArray(actorRoles)
    ? actorRoles.map((role) => `${role}`.toLowerCase())
    : typeof actorRoles === 'string'
      ? `${actorRoles}`
          .split(',')
          .map((role) => role.trim().toLowerCase())
          .filter(Boolean)
      : [];

  const allowed = normalizedRoles.some((role) => ALLOWED_CREATOR_ROLES.has(role));
  const admin = normalizedRoles.some((role) => ADMIN_OVERRIDE_ROLES.has(role));

  if (resolvedActorId !== Number(userId)) {
    if (!admin) {
      throw new AuthorizationError('You can only manage CV documents for your own workspace.');
    }
    if (!allowed) {
      throw new AuthorizationError('Your role does not have permission to manage CV documents.');
    }
  } else if (!allowed) {
    throw new AuthorizationError('Your role does not have permission to manage CV documents.');
  }

  return { actorId: resolvedActorId, roles: normalizedRoles, isAdmin: admin };
}

async function ensureUser(userId, transaction) {
  const user = await User.findByPk(userId, { transaction });
  if (!user) {
    throw new NotFoundError('User not found.', { userId });
  }
  return user;
}

function buildShareUrl(document, baseUrl = process.env.APP_BASE_URL || 'https://app.gigvora.test') {
  const slug = slugify(document.title, `cv-${document.id}`);
  const normalizedBase = baseUrl.replace(/\/?$/, '');
  return `${normalizedBase}/documents/${slug}-${document.id}`;
}

function sanitizeVersion(instance) {
  if (!instance) {
    return null;
  }
  const plain = instance.toPublicObject?.() ?? instance.get?.({ plain: true }) ?? instance;
  return {
    ...plain,
    metrics: plain.metrics ?? {},
    diffHighlights: plain.diffHighlights ?? null,
  };
}

function sanitizeDocument(instance) {
  if (!instance) {
    return null;
  }
  const plain = instance.toPublicObject?.() ?? instance.get?.({ plain: true }) ?? instance;
  const versionsRaw = instance.get?.('versions') ?? instance.versions ?? [];
  const versions = Array.isArray(versionsRaw)
    ? versionsRaw
        .map((version) => sanitizeVersion(version))
        .sort((a, b) => (b.versionNumber ?? 0) - (a.versionNumber ?? 0))
    : [];
  const latestVersion = versions[0] ?? null;
  return {
    ...plain,
    tags: Array.isArray(plain.tags)
      ? plain.tags
      : plain.tags && typeof plain.tags === 'object'
        ? Object.values(plain.tags)
        : [],
    metadata: plain.metadata ?? {},
    versions,
    latestVersion,
    trackedEditCount: latestVersion?.diffHighlights
      ? Array.isArray(latestVersion.diffHighlights)
        ? latestVersion.diffHighlights.length
        : typeof latestVersion.diffHighlights === 'object'
          ? Object.keys(latestVersion.diffHighlights).length
          : 0
      : 0,
    annotationCount: (() => {
      const metrics = latestVersion?.metrics;
      if (!metrics) return 0;
      if (Array.isArray(metrics.annotations)) return metrics.annotations.length;
      if (Array.isArray(metrics.recruiterAnnotations)) return metrics.recruiterAnnotations.length;
      return Number(metrics.annotationCount ?? 0);
    })(),
  };
}

const DOCUMENT_INCLUDE = [
  {
    model: CareerDocumentVersion,
    as: 'versions',
    required: false,
    separate: true,
    order: [['versionNumber', 'DESC']],
  },
  {
    model: CareerDocumentCollaborator,
    as: 'collaborators',
    required: false,
  },
  {
    model: CareerDocumentExport,
    as: 'exports',
    required: false,
    limit: 5,
    order: [['exportedAt', 'DESC']],
  },
];

async function fetchDocuments(userId, { documentTypes = ['cv'], transaction } = {}) {
  const where = { userId };
  if (Array.isArray(documentTypes)) {
    if (documentTypes.length === 1) {
      where.documentType = documentTypes[0];
    } else {
      where.documentType = documentTypes;
    }
  } else if (documentTypes) {
    where.documentType = documentTypes;
  }

  const documents = await CareerDocument.findAll({
    where,
    include: DOCUMENT_INCLUDE,
    order: [['updatedAt', 'DESC']],
    transaction,
  });

  return documents.map((doc) => sanitizeDocument(doc));
}

async function loadWorkspace(userId, transaction) {
  const sanitized = await fetchDocuments(userId, { documentTypes: ['cv'], transaction });
  const baseline = sanitized.find((doc) => doc.metadata?.isBaseline) || sanitized[0] || null;
  const variants = sanitized.filter((doc) => (baseline ? doc.id !== baseline.id : true));
  const totalVersions = sanitized.reduce((sum, doc) => sum + (doc.versions?.length ?? 0), 0);
  const aiAssistedCount = sanitized.filter((doc) => Boolean(doc.aiAssisted)).length;
  const lastUpdatedAt = sanitized.reduce((latest, doc) => {
    const updated = doc.updatedAt ? new Date(doc.updatedAt).getTime() : 0;
    return Math.max(latest, updated);
  }, 0);

  return {
    summary: {
      totalDocuments: sanitized.length,
      totalVersions,
      aiAssistedCount,
      lastUpdatedAt: lastUpdatedAt ? new Date(lastUpdatedAt).toISOString() : null,
    },
    baseline,
    variants,
    documents: sanitized,
  };
}

async function loadCoverLetterWorkspace(userId, transaction) {
  const coverLetters = await fetchDocuments(userId, { documentTypes: ['cover_letter'], transaction });
  const storyBlocks = await fetchDocuments(userId, { documentTypes: ['story_block'], transaction });

  const toneSamples = coverLetters
    .map((doc) => {
      const score = doc.latestVersion?.metrics?.toneScore ?? doc.metadata?.toneScore ?? null;
      return Number.isFinite(Number(score)) ? Number(score) : null;
    })
    .filter((value) => value != null);

  const summary = {
    totalTemplates: coverLetters.length,
    totalStoryBlocks: storyBlocks.length,
    aiAssistedCount: coverLetters.filter((doc) => doc.aiAssisted).length,
    lastUpdatedAt: (() => {
      const timestamps = [...coverLetters, ...storyBlocks]
        .map((doc) => (doc.updatedAt ? new Date(doc.updatedAt).getTime() : 0))
        .filter(Boolean);
      if (!timestamps.length) {
        return null;
      }
      return new Date(Math.max(...timestamps)).toISOString();
    })(),
  };

  const toneSummary = {
    average: toneSamples.length ? toneSamples.reduce((total, value) => total + value, 0) / toneSamples.length : null,
    samples: toneSamples.length,
  };

  const templates = coverLetters.map((doc) => ({
    ...doc,
    toneScore: doc.latestVersion?.metrics?.toneScore ?? doc.metadata?.toneScore ?? null,
    qualityScore: doc.latestVersion?.metrics?.qualityScore ?? doc.metadata?.qualityScore ?? null,
    collaboratorCount: Array.isArray(doc.collaborators) ? doc.collaborators.length : 0,
    storyBlocksUsed: Array.isArray(doc.metadata?.storyBlocks) ? doc.metadata.storyBlocks : [],
  }));

  const blocks = storyBlocks.map((doc) => ({
    ...doc,
    tone: doc.metadata?.tone ?? 'Neutral',
    useCount:
      doc.metadata?.useCount ??
      doc.latestVersion?.metrics?.useCount ??
      doc.metrics?.useCount ??
      (Array.isArray(doc.metadata?.storyBlocks) ? doc.metadata.storyBlocks.length : 0),
  }));

  return {
    summary,
    templates,
    storyBlocks: blocks,
    toneSummary,
  };
}

async function getCvWorkspace({ userId, actorId, actorRoles }) {
  if (!userId) {
    throw new ValidationError('userId is required.');
  }
  const actor = extractActor({ userId, actorId, actorRoles });
  await ensureUser(userId);
  const workspace = await loadWorkspace(userId);
  return {
    ...workspace,
    actor,
  };
}

async function createCvDocument({ userId, actorId, actorRoles, payload }) {
  if (!userId) {
    throw new ValidationError('userId is required.');
  }
  const actor = extractActor({ userId, actorId, actorRoles });
  const input = payload || {};
  const title = `${input.title ?? ''}`.trim();
  if (!title) {
    throw new ValidationError('A document title is required.');
  }
  await ensureUser(userId);

  const tags = normalizeTags(input.tags);
  const metadata = normalizeMetadata({
    persona: input.persona,
    impact: input.impact,
    keywords: input.keywords,
    ...input.metadata,
  });

  if (input.isBaseline !== false) {
    metadata.isBaseline = true;
  }

  return sequelize.transaction(async (transaction) => {
    if (metadata.isBaseline) {
      const existingBaseline = await CareerDocument.findAll({
        where: { userId, documentType: 'cv' },
        transaction,
      });
      if (
        existingBaseline.some((doc) => {
          const meta = doc.metadata ?? {};
          return meta && typeof meta === 'object' && meta.isBaseline;
        })
      ) {
        throw new ValidationError('A baseline CV already exists. Update the existing baseline or create a variant.');
      }
    }

    const document = await CareerDocument.create(
      {
        userId,
        documentType: 'cv',
        title,
        slug: slugify(title, `cv-${crypto.randomUUID().slice(0, 8)}`),
        status: input.status && typeof input.status === 'string' ? input.status : 'in_review',
        roleTag: input.roleTag ?? null,
        geographyTag: input.geographyTag ?? null,
        aiAssisted: Boolean(input.aiAssisted ?? input.metrics?.aiCopyScore != null),
        tags,
        metadata,
        shareUrl: input.shareUrl ?? null,
      },
      { transaction },
    );

    const metrics = {
      aiCopyScore: input.metrics?.aiCopyScore ?? null,
      toneScore: input.metrics?.toneScore ?? null,
      keywords: metadata.keywords ?? null,
      recruiterAnnotations: [],
    };

    const version = await CareerDocumentVersion.create(
      {
        documentId: document.id,
        versionNumber: 1,
        title,
        summary: input.summary ?? null,
        content: input.content ?? null,
        contentPath: input.contentPath ?? input.file?.storageKey ?? null,
        aiSummary: input.aiSummary ?? null,
        changeSummary: input.changeSummary ?? null,
        metrics,
        approvalStatus: input.approvalStatus && typeof input.approvalStatus === 'string' ? input.approvalStatus : 'pending_review',
        createdById: actor.actorId,
      },
      { transaction },
    );

    await document.update(
      {
        baselineVersionId: metadata.isBaseline ? version.id : null,
        latestVersionId: version.id,
        shareUrl: document.shareUrl ?? buildShareUrl(document),
      },
      { transaction },
    );

    const fresh = await CareerDocument.findByPk(document.id, {
      include: [
        { model: CareerDocumentVersion, as: 'versions', required: false },
        { model: CareerDocumentCollaborator, as: 'collaborators', required: false },
      ],
      transaction,
    });

    return sanitizeDocument(fresh);
  });
}

async function uploadCvVersion({ userId, documentId, actorId, actorRoles, payload }) {
  if (!userId) {
    throw new ValidationError('userId is required.');
  }
  if (!documentId) {
    throw new ValidationError('documentId is required.');
  }
  const actor = extractActor({ userId, actorId, actorRoles });
  const changes = payload || {};
  if (!changes.content && !changes.file?.base64 && !changes.file?.storageKey) {
    throw new ValidationError('Either rich text content or an uploaded file is required.');
  }

  return sequelize.transaction(async (transaction) => {
    const document = await CareerDocument.findOne({
      where: { id: documentId, userId, documentType: 'cv' },
      include: [{ model: CareerDocumentVersion, as: 'versions', required: false }],
      lock: transaction.LOCK.UPDATE,
      transaction,
    });
    if (!document) {
      throw new NotFoundError('CV document not found.', { documentId });
    }

    const latestNumber = document.versions?.reduce((max, version) => Math.max(max, version.versionNumber ?? 0), 0) ?? 0;
    const nextVersionNumber = latestNumber + 1;

    const metrics = {
      aiCopyScore: changes.metrics?.aiCopyScore ?? document.versions?.[0]?.metrics?.aiCopyScore ?? null,
      toneScore: changes.metrics?.toneScore ?? document.versions?.[0]?.metrics?.toneScore ?? null,
      keywords: changes.metrics?.keywords ?? document.metadata?.keywords ?? null,
      recruiterAnnotations: [],
      ...(changes.metrics ?? {}),
    };

    const contentPath = changes.file?.storageKey ?? null;
    const content = changes.content ?? (changes.file?.base64 ? `base64:${changes.file.base64}` : null);

    const version = await CareerDocumentVersion.create(
      {
        documentId: document.id,
        versionNumber: nextVersionNumber,
        title: changes.title ?? document.title,
        summary: changes.summary ?? null,
        content,
        contentPath,
        aiSummary: changes.aiSummary ?? null,
        changeSummary: changes.changeSummary ?? null,
        metrics,
        approvalStatus:
          changes.approvalStatus && typeof changes.approvalStatus === 'string'
            ? changes.approvalStatus
            : 'pending_review',
        createdById: actor.actorId,
      },
      { transaction },
    );

    const updatePayload = {
      latestVersionId: version.id,
      aiAssisted: document.aiAssisted || Boolean(metrics.aiCopyScore),
    };

    if (changes.setAsBaseline) {
      updatePayload.baselineVersionId = version.id;
      document.metadata = { ...(document.metadata ?? {}), isBaseline: true };
      updatePayload.metadata = document.metadata;
    }

    await document.update(updatePayload, { transaction });

    const fresh = await CareerDocument.findByPk(document.id, {
      include: [
        { model: CareerDocumentVersion, as: 'versions', required: false },
        { model: CareerDocumentCollaborator, as: 'collaborators', required: false },
        { model: CareerDocumentExport, as: 'exports', required: false },
      ],
      transaction,
    });

    return sanitizeDocument(fresh);
  });
}

async function getCoverLetterWorkspace({ userId, actorId, actorRoles }) {
  if (!userId) {
    throw new ValidationError('userId is required.');
  }
  const actor = extractActor({ userId, actorId, actorRoles });
  await ensureUser(userId);
  const workspace = await loadCoverLetterWorkspace(userId);
  return {
    ...workspace,
    actor,
  };
}

async function createCoverLetter({ userId, actorId, actorRoles, payload }) {
  if (!userId) {
    throw new ValidationError('userId is required.');
  }
  const actor = extractActor({ userId, actorId, actorRoles });
  const input = payload || {};
  const title = `${input.title ?? ''}`.trim();
  if (!title) {
    throw new ValidationError('A cover letter title is required.');
  }
  await ensureUser(userId);

  const tags = normalizeTags(input.tags);
  const storyBlocks = normalizeStoryBlocks(input.storyBlocks ?? input.metadata?.storyBlocks);
  const metadata = normalizeMetadata({
    persona: input.persona,
    impact: input.impact,
    keywords: input.keywords,
    tone: input.tone,
    targetRole: input.targetRole,
    targetCompany: input.targetCompany,
    callToAction: input.callToAction,
    storyBlocks,
    ...input.metadata,
  });

  return sequelize.transaction(async (transaction) => {
    const document = await CareerDocument.create(
      {
        userId,
        documentType: 'cover_letter',
        title,
        slug: slugify(title, `cover-${crypto.randomUUID().slice(0, 8)}`),
        status: input.status && typeof input.status === 'string' ? input.status : 'draft',
        roleTag: input.roleTag ?? null,
        geographyTag: input.geographyTag ?? null,
        aiAssisted: Boolean(
          input.aiAssisted ||
            input.metrics?.aiCopyScore != null ||
            input.metrics?.toneScore != null ||
            input.metrics?.qualityScore != null,
        ),
        tags,
        metadata,
        shareUrl: input.shareUrl ?? null,
      },
      { transaction },
    );

    const metrics = {
      toneScore: input.metrics?.toneScore ?? null,
      qualityScore: input.metrics?.qualityScore ?? null,
      aiCopyScore: input.metrics?.aiCopyScore ?? null,
      wordCount: input.metrics?.wordCount ?? null,
      storyBlocksUsed: storyBlocks,
    };

    const hasFile = Boolean(input.file?.base64 || input.file?.storageKey);
    const content = hasFile ? (input.file?.base64 ? `base64:${input.file.base64}` : null) : input.content ?? null;
    const contentPath = input.file?.storageKey ?? null;

    const version = await CareerDocumentVersion.create(
      {
        documentId: document.id,
        versionNumber: 1,
        title,
        summary: input.summary ?? null,
        content,
        contentPath,
        aiSummary: input.aiSummary ?? null,
        changeSummary: input.changeSummary ?? null,
        metrics,
        approvalStatus:
          input.approvalStatus && typeof input.approvalStatus === 'string'
            ? input.approvalStatus
            : 'pending_review',
        createdById: actor.actorId,
      },
      { transaction },
    );

    await document.update(
      {
        latestVersionId: version.id,
        shareUrl: document.shareUrl ?? buildShareUrl(document),
        aiAssisted: document.aiAssisted || Boolean(metrics.aiCopyScore || metrics.toneScore || metrics.qualityScore),
      },
      { transaction },
    );

    const fresh = await CareerDocument.findByPk(document.id, {
      include: DOCUMENT_INCLUDE,
      transaction,
    });

    return sanitizeDocument(fresh);
  });
}

async function uploadCoverLetterVersion({ userId, documentId, actorId, actorRoles, payload }) {
  if (!userId) {
    throw new ValidationError('userId is required.');
  }
  if (!documentId) {
    throw new ValidationError('documentId is required.');
  }
  const actor = extractActor({ userId, actorId, actorRoles });
  const changes = payload || {};
  if (!changes.content && !changes.file?.base64 && !changes.file?.storageKey) {
    throw new ValidationError('Provide cover letter content or upload a file to create a new version.');
  }

  return sequelize.transaction(async (transaction) => {
    const document = await CareerDocument.findOne({
      where: { id: documentId, userId, documentType: 'cover_letter' },
      include: [{ model: CareerDocumentVersion, as: 'versions', required: false }],
      lock: transaction.LOCK.UPDATE,
      transaction,
    });
    if (!document) {
      throw new NotFoundError('Cover letter not found.', { documentId });
    }

    const latestNumber = document.versions?.reduce((max, version) => Math.max(max, version.versionNumber ?? 0), 0) ?? 0;
    const nextVersionNumber = latestNumber + 1;

    const storyBlocks = normalizeStoryBlocks(changes.storyBlocks ?? document.metadata?.storyBlocks);
    const metrics = {
      toneScore: changes.metrics?.toneScore ?? document.versions?.[0]?.metrics?.toneScore ?? null,
      qualityScore: changes.metrics?.qualityScore ?? document.versions?.[0]?.metrics?.qualityScore ?? null,
      aiCopyScore: changes.metrics?.aiCopyScore ?? document.versions?.[0]?.metrics?.aiCopyScore ?? null,
      wordCount: changes.metrics?.wordCount ?? document.versions?.[0]?.metrics?.wordCount ?? null,
      storyBlocksUsed: storyBlocks,
      ...(changes.metrics ?? {}),
    };

    const contentPath = changes.file?.storageKey ?? null;
    const content = changes.content ?? (changes.file?.base64 ? `base64:${changes.file.base64}` : null);

    const version = await CareerDocumentVersion.create(
      {
        documentId: document.id,
        versionNumber: nextVersionNumber,
        title: changes.title ?? document.title,
        summary: changes.summary ?? null,
        content,
        contentPath,
        aiSummary: changes.aiSummary ?? null,
        changeSummary: changes.changeSummary ?? null,
        metrics,
        approvalStatus:
          changes.approvalStatus && typeof changes.approvalStatus === 'string'
            ? changes.approvalStatus
            : 'pending_review',
        createdById: actor.actorId,
      },
      { transaction },
    );

    const updatePayload = {
      latestVersionId: version.id,
      metadata: { ...(document.metadata ?? {}), storyBlocks },
      aiAssisted:
        document.aiAssisted || Boolean(metrics.aiCopyScore || metrics.toneScore || metrics.qualityScore),
    };

    await document.update(updatePayload, { transaction });

    const fresh = await CareerDocument.findByPk(document.id, {
      include: DOCUMENT_INCLUDE,
      transaction,
    });

    return sanitizeDocument(fresh);
  });
}

async function createStoryBlock({ userId, actorId, actorRoles, payload }) {
  if (!userId) {
    throw new ValidationError('userId is required.');
  }
  const actor = extractActor({ userId, actorId, actorRoles });
  const input = payload || {};
  const title = `${input.title ?? ''}`.trim();
  if (!title) {
    throw new ValidationError('A story block title is required.');
  }
  const content = `${input.content ?? ''}`.trim();
  if (!content) {
    throw new ValidationError('Story block content is required.');
  }
  await ensureUser(userId);

  const tags = normalizeTags(input.tags);
  const metadata = normalizeMetadata({
    tone: input.tone,
    impact: input.impact,
    persona: input.persona,
    keywords: input.keywords,
    category: input.category,
    callToAction: input.callToAction,
    ...input.metadata,
  });

  return sequelize.transaction(async (transaction) => {
    const document = await CareerDocument.create(
      {
        userId,
        documentType: 'story_block',
        title,
        slug: slugify(title, `story-${crypto.randomUUID().slice(0, 8)}`),
        status: input.status && typeof input.status === 'string' ? input.status : 'draft',
        tags,
        metadata,
      },
      { transaction },
    );

    const metrics = {
      toneScore: input.metrics?.toneScore ?? null,
      impactScore: input.metrics?.impactScore ?? null,
    };

    await CareerDocumentVersion.create(
      {
        documentId: document.id,
        versionNumber: 1,
        title,
        summary: input.summary ?? null,
        content,
        aiSummary: input.aiSummary ?? null,
        changeSummary: input.changeSummary ?? null,
        metrics,
        approvalStatus:
          input.approvalStatus && typeof input.approvalStatus === 'string'
            ? input.approvalStatus
            : 'pending_review',
        createdById: actor.actorId,
      },
      { transaction },
    );

    const fresh = await CareerDocument.findByPk(document.id, {
      include: DOCUMENT_INCLUDE,
      transaction,
    });

    return sanitizeDocument(fresh);
  });
}

async function uploadStoryBlockVersion({ userId, documentId, actorId, actorRoles, payload }) {
  if (!userId) {
    throw new ValidationError('userId is required.');
  }
  if (!documentId) {
    throw new ValidationError('documentId is required.');
  }
  const actor = extractActor({ userId, actorId, actorRoles });
  const changes = payload || {};
  const content = `${changes.content ?? ''}`.trim();
  if (!content) {
    throw new ValidationError('Updated story block content is required.');
  }

  return sequelize.transaction(async (transaction) => {
    const document = await CareerDocument.findOne({
      where: { id: documentId, userId, documentType: 'story_block' },
      include: [{ model: CareerDocumentVersion, as: 'versions', required: false }],
      lock: transaction.LOCK.UPDATE,
      transaction,
    });
    if (!document) {
      throw new NotFoundError('Story block not found.', { documentId });
    }

    const latestNumber = document.versions?.reduce((max, version) => Math.max(max, version.versionNumber ?? 0), 0) ?? 0;
    const nextVersionNumber = latestNumber + 1;

    const metrics = {
      toneScore: changes.metrics?.toneScore ?? document.versions?.[0]?.metrics?.toneScore ?? null,
      impactScore: changes.metrics?.impactScore ?? document.versions?.[0]?.metrics?.impactScore ?? null,
      ...(changes.metrics ?? {}),
    };

    const version = await CareerDocumentVersion.create(
      {
        documentId: document.id,
        versionNumber: nextVersionNumber,
        title: changes.title ?? document.title,
        summary: changes.summary ?? null,
        content,
        aiSummary: changes.aiSummary ?? null,
        changeSummary: changes.changeSummary ?? null,
        metrics,
        approvalStatus:
          changes.approvalStatus && typeof changes.approvalStatus === 'string'
            ? changes.approvalStatus
            : 'pending_review',
        createdById: actor.actorId,
      },
      { transaction },
    );

    const metadata = normalizeMetadata({ ...(document.metadata ?? {}), ...changes.metadata });

    await document.update(
      {
        latestVersionId: version.id,
        metadata,
      },
      { transaction },
    );

    const fresh = await CareerDocument.findByPk(document.id, {
      include: DOCUMENT_INCLUDE,
      transaction,
    });

    return sanitizeDocument(fresh);
  });
}

export default {
  getCvWorkspace,
  createCvDocument,
  uploadCvVersion,
  getCoverLetterWorkspace,
  createCoverLetter,
  uploadCoverLetterVersion,
  createStoryBlock,
  uploadStoryBlockVersion,
};
