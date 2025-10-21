import { Op } from 'sequelize';
import {
  LegalDocument,
  LegalDocumentVersion,
  LegalDocumentAuditEvent,
  sequelize,
} from '../models/index.js';
import {
  LEGAL_DOCUMENT_CATEGORIES,
  LEGAL_DOCUMENT_STATUSES,
  LEGAL_DOCUMENT_VERSION_STATUSES,
} from '../models/constants/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';

const CATEGORY_SET = new Set(LEGAL_DOCUMENT_CATEGORIES);
const DOCUMENT_STATUS_SET = new Set(LEGAL_DOCUMENT_STATUSES);
const VERSION_STATUS_SET = new Set(LEGAL_DOCUMENT_VERSION_STATUSES);

function slugify(value) {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function normalizeStringArray(value, { minLength = 1, maxLength = 120 } = {}) {
  if (!value) {
    return [];
  }
  const source = Array.isArray(value) ? value : [value];
  const result = [];
  const seen = new Set();
  source.forEach((item) => {
    if (typeof item !== 'string') {
      return;
    }
    const trimmed = item.trim();
    if (!trimmed) {
      return;
    }
    if (trimmed.length < minLength || trimmed.length > maxLength) {
      return;
    }
    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    result.push(trimmed);
  });
  return result;
}

function sanitizeMetadata(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value;
}

async function recordAuditEvent(documentId, versionId, action, metadata = {}, { actorId, actorType } = {}) {
  try {
    await LegalDocumentAuditEvent.create({
      documentId,
      versionId: versionId ?? null,
      action,
      actorId: actorId ?? null,
      actorType: actorType ?? 'admin',
      metadata: sanitizeMetadata(metadata),
    });
  } catch (error) {
    logger.warn({ err: error, documentId, versionId, action }, 'failed to record legal policy audit event');
  }
}

function mapDocumentInstance(document, { includeVersions = true, includeAudit = false } = {}) {
  if (!document) {
    return null;
  }
  if (typeof document.toSummary === 'function') {
    return document.toSummary({ includeVersions, includeAudit });
  }
  const plain = document.toJSON();
  if (!includeVersions) {
    delete plain.versions;
  }
  if (!includeAudit) {
    delete plain.auditEvents;
  }
  return plain;
}

export async function listLegalDocuments({ category, status, locale, includeVersions = false } = {}) {
  const where = {};
  if (category && CATEGORY_SET.has(category)) {
    where.category = category;
  }
  if (status && DOCUMENT_STATUS_SET.has(status)) {
    where.status = status;
  }

  const include = [];
  if (includeVersions) {
    include.push({
      model: LegalDocumentVersion,
      as: 'versions',
      required: false,
      where: locale
        ? {
            [Op.or]: [
              { locale },
              { locale: { [Op.is]: null } },
            ],
          }
        : undefined,
      separate: false,
      order: [
        ['locale', 'ASC'],
        ['version', 'DESC'],
      ],
    });
  }

  const documents = await LegalDocument.findAll({
    where,
    include,
    order: [
      ['category', 'ASC'],
      ['title', 'ASC'],
    ],
  });

  return documents.map((document) => mapDocumentInstance(document, { includeVersions }));
}

export async function getLegalDocument(identifier, { includeVersions = true, includeAudit = false } = {}) {
  const where = typeof identifier === 'number' ? { id: identifier } : { slug: identifier };
  const document = await LegalDocument.findOne({
    where,
    include: [
      includeVersions
        ? {
            model: LegalDocumentVersion,
            as: 'versions',
            order: [
              ['locale', 'ASC'],
              ['version', 'DESC'],
            ],
            include: includeAudit
              ? [
                  {
                    model: LegalDocumentAuditEvent,
                    as: 'auditTrail',
                    separate: false,
                    order: [['createdAt', 'DESC']],
                  },
                ]
              : [],
          }
        : null,
      includeAudit
        ? {
            model: LegalDocumentAuditEvent,
            as: 'auditEvents',
            separate: false,
            order: [['createdAt', 'DESC']],
          }
        : null,
    ].filter(Boolean),
  });

  if (!document) {
    throw new NotFoundError('Legal document not found.');
  }

  return mapDocumentInstance(document, { includeVersions, includeAudit });
}

async function ensureUniqueSlug(slug, existingId) {
  const existing = await LegalDocument.findOne({
    where: existingId
      ? {
          slug,
          id: { [Op.ne]: existingId },
        }
      : { slug },
  });
  if (existing) {
    throw new ValidationError('A legal document with this slug already exists.');
  }
}

function resolveDocumentStatus(document, { hasActiveVersion }) {
  if (document.status === 'archived') {
    return 'archived';
  }
  if (hasActiveVersion) {
    return 'active';
  }
  return 'draft';
}

export async function createLegalDocument(payload = {}, { actorId, actorType } = {}) {
  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  if (!title) {
    throw new ValidationError('title is required.');
  }

  const slug = payload.slug ? slugify(payload.slug) : slugify(title);
  if (!slug) {
    throw new ValidationError('Unable to derive a slug for this document.');
  }

  if (!CATEGORY_SET.has(payload.category ?? 'terms')) {
    throw new ValidationError('category must be one of the supported document categories.');
  }

  await ensureUniqueSlug(slug);

  const audienceRoles = normalizeStringArray(payload.audienceRoles, { minLength: 2, maxLength: 80 });
  const editorRoles = normalizeStringArray(payload.editorRoles, { minLength: 2, maxLength: 80 });
  const tags = normalizeStringArray(payload.tags, { minLength: 2, maxLength: 60 });

  return sequelize.transaction(async (transaction) => {
    const document = await LegalDocument.create(
      {
        slug,
        title,
        category: payload.category,
        status: DOCUMENT_STATUS_SET.has(payload.status) ? payload.status : 'draft',
        region: payload.region ? payload.region.trim() : 'global',
        defaultLocale: payload.defaultLocale ? payload.defaultLocale.trim() : 'en',
        audienceRoles,
        editorRoles,
        tags,
        summary: payload.summary ?? null,
        metadata: sanitizeMetadata(payload.metadata),
        createdBy: actorId ?? payload.createdBy ?? null,
        updatedBy: actorId ?? payload.updatedBy ?? null,
      },
      { transaction },
    );

    let createdVersion = null;
    if (payload.initialVersion) {
      createdVersion = await createDocumentVersion(
        document.id,
        payload.initialVersion,
        { actorId, actorType },
        transaction,
      );
    }

    await recordAuditEvent(document.id, createdVersion?.id, 'document.created', { title }, { actorId, actorType });

    if (createdVersion && createdVersion.status === 'published') {
      await document.update(
        {
          activeVersionId: createdVersion.id,
          publishedAt: createdVersion.effectiveAt ?? createdVersion.publishedAt ?? new Date(),
          status: resolveDocumentStatus(document, { hasActiveVersion: true }),
        },
        { transaction },
      );
    }

    const fresh = await LegalDocument.findByPk(document.id, {
      include: createdVersion
        ? [
            {
              model: LegalDocumentVersion,
              as: 'versions',
              order: [
                ['locale', 'ASC'],
                ['version', 'DESC'],
              ],
            },
          ]
        : [],
      transaction,
    });

    return mapDocumentInstance(fresh ?? document, { includeVersions: true });
  });
}

export async function updateLegalDocument(documentId, payload = {}, { actorId, actorType } = {}) {
  if (!documentId) {
    throw new ValidationError('documentId is required.');
  }
  const document = await LegalDocument.findByPk(documentId);
  if (!document) {
    throw new NotFoundError('Legal document not found.');
  }

  const updates = {};

  if (payload.title) {
    const normalizedTitle = payload.title.trim();
    if (!normalizedTitle) {
      throw new ValidationError('title cannot be empty.');
    }
    updates.title = normalizedTitle;
  }

  if (payload.slug) {
    const normalizedSlug = slugify(payload.slug);
    if (!normalizedSlug) {
      throw new ValidationError('slug is invalid.');
    }
    await ensureUniqueSlug(normalizedSlug, documentId);
    updates.slug = normalizedSlug;
  }

  if (payload.category && CATEGORY_SET.has(payload.category)) {
    updates.category = payload.category;
  }

  if (payload.status && DOCUMENT_STATUS_SET.has(payload.status)) {
    updates.status = payload.status;
  }

  if (payload.region) {
    updates.region = payload.region.trim();
  }

  if (payload.defaultLocale) {
    updates.defaultLocale = payload.defaultLocale.trim();
  }

  if (payload.summary !== undefined) {
    updates.summary = payload.summary ?? null;
  }

  if (payload.metadata !== undefined) {
    updates.metadata = sanitizeMetadata(payload.metadata);
  }

  if (payload.audienceRoles !== undefined) {
    updates.audienceRoles = normalizeStringArray(payload.audienceRoles, { minLength: 2, maxLength: 80 });
  }

  if (payload.editorRoles !== undefined) {
    updates.editorRoles = normalizeStringArray(payload.editorRoles, { minLength: 2, maxLength: 80 });
  }

  if (payload.tags !== undefined) {
    updates.tags = normalizeStringArray(payload.tags, { minLength: 2, maxLength: 60 });
  }

  updates.updatedBy = actorId ?? payload.updatedBy ?? document.updatedBy ?? null;

  await document.update(updates);

  await recordAuditEvent(document.id, null, 'document.updated', updates, { actorId, actorType });

  const fresh = await getLegalDocument(document.id, { includeVersions: true, includeAudit: false });
  return fresh;
}

function normalizeVersionPayload(document, payload = {}) {
  const locale = payload.locale ? payload.locale.trim() : document.defaultLocale;
  if (!locale) {
    throw new ValidationError('locale is required for a document version.');
  }

  const status = payload.status && VERSION_STATUS_SET.has(payload.status) ? payload.status : 'draft';

  const normalized = {
    locale,
    status,
    summary: payload.summary ?? null,
    changeSummary: payload.changeSummary ?? null,
    content: payload.content ?? null,
    externalUrl: payload.externalUrl ?? null,
    metadata: sanitizeMetadata(payload.metadata),
  };

  if (payload.version != null) {
    const versionNumber = Number(payload.version);
    if (!Number.isFinite(versionNumber) || versionNumber <= 0) {
      throw new ValidationError('version must be a positive integer.');
    }
    normalized.version = Math.trunc(versionNumber);
  }

  if (payload.effectiveAt) {
    const effectiveDate = new Date(payload.effectiveAt);
    if (Number.isNaN(effectiveDate.getTime())) {
      throw new ValidationError('effectiveAt must be a valid date.');
    }
    normalized.effectiveAt = effectiveDate;
  }

  return normalized;
}

async function nextVersionNumber(documentId, locale, transaction) {
  const latest = await LegalDocumentVersion.findOne({
    where: { documentId, locale },
    order: [['version', 'DESC']],
    transaction,
  });
  return latest ? latest.version + 1 : 1;
}

export async function createDocumentVersion(documentId, payload = {}, actor = {}, existingTransaction) {
  const document = await LegalDocument.findByPk(documentId, {
    transaction: existingTransaction,
  });
  if (!document) {
    throw new NotFoundError('Legal document not found.');
  }

  const normalized = normalizeVersionPayload(document, payload);
  if (!normalized.version) {
    normalized.version = await nextVersionNumber(documentId, normalized.locale, existingTransaction);
  }

  const transaction = existingTransaction || (await sequelize.transaction());
  let created;
  let committed = false;
  try {
    created = await LegalDocumentVersion.create(
      {
        ...normalized,
        documentId,
        createdBy: actor.actorId ?? payload.createdBy ?? null,
      },
      { transaction },
    );

    if (!existingTransaction) {
      await transaction.commit();
      committed = true;
    }
  } catch (error) {
    if (!existingTransaction) {
      await transaction.rollback();
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new ValidationError('This locale already has the provided version number.');
    }
    throw error;
  }

  await recordAuditEvent(documentId, created.id, 'document.version.created', {
    locale: created.locale,
    version: created.version,
  }, actor);

  return created.toSummary();
}

async function loadVersion(documentId, versionId) {
  const version = await LegalDocumentVersion.findOne({
    where: { id: versionId, documentId },
  });
  if (!version) {
    throw new NotFoundError('Document version not found.');
  }
  return version;
}

export async function updateDocumentVersion(documentId, versionId, payload = {}, actor = {}) {
  const document = await LegalDocument.findByPk(documentId);
  if (!document) {
    throw new NotFoundError('Legal document not found.');
  }

  const version = await loadVersion(documentId, versionId);

  const normalized = normalizeVersionPayload(document, { ...version.toJSON(), ...payload });
  if (payload.version != null) {
    const versionNumber = Number(payload.version);
    if (!Number.isFinite(versionNumber) || versionNumber <= 0) {
      throw new ValidationError('version must be a positive integer.');
    }
    if (versionNumber !== version.version) {
      const conflict = await LegalDocumentVersion.findOne({
        where: {
          documentId,
          locale: normalized.locale,
          version: Math.trunc(versionNumber),
          id: { [Op.ne]: versionId },
        },
      });
      if (conflict) {
        throw new ValidationError('Another version with this number already exists for the same locale.');
      }
      normalized.version = Math.trunc(versionNumber);
    }
  }

  if (payload.status && VERSION_STATUS_SET.has(payload.status)) {
    normalized.status = payload.status;
  }

  if (payload.effectiveAt !== undefined) {
    if (payload.effectiveAt) {
      const effectiveDate = new Date(payload.effectiveAt);
      if (Number.isNaN(effectiveDate.getTime())) {
        throw new ValidationError('effectiveAt must be a valid date.');
      }
      normalized.effectiveAt = effectiveDate;
    } else {
      normalized.effectiveAt = null;
    }
  }

  await version.update({
    ...normalized,
    updatedAt: new Date(),
  });

  await recordAuditEvent(documentId, version.id, 'document.version.updated', normalized, actor);

  return version.toSummary();
}

export async function publishDocumentVersion(documentId, versionId, payload = {}, actor = {}) {
  const version = await loadVersion(documentId, versionId);
  if (version.status === 'archived') {
    throw new ValidationError('Archived versions cannot be published.');
  }

  const updates = {
    status: 'published',
    publishedAt: new Date(),
    publishedBy: actor.actorId ?? payload.publishedBy ?? null,
  };

  if (payload.effectiveAt) {
    const effectiveDate = new Date(payload.effectiveAt);
    if (Number.isNaN(effectiveDate.getTime())) {
      throw new ValidationError('effectiveAt must be a valid date.');
    }
    updates.effectiveAt = effectiveDate;
  } else if (!version.effectiveAt) {
    updates.effectiveAt = new Date();
  }

  if (payload.summary !== undefined) {
    updates.summary = payload.summary ?? version.summary ?? null;
  }
  if (payload.changeSummary !== undefined) {
    updates.changeSummary = payload.changeSummary ?? version.changeSummary ?? null;
  }

  await version.update(updates);

  await recordAuditEvent(documentId, versionId, 'document.version.published', updates, actor);

  return version.toSummary();
}

export async function activateDocumentVersion(documentId, versionId, actor = {}) {
  const document = await LegalDocument.findByPk(documentId);
  if (!document) {
    throw new NotFoundError('Legal document not found.');
  }
  const version = await loadVersion(documentId, versionId);

  if (!['published', 'approved'].includes(version.status)) {
    throw new ValidationError('Only published or approved versions can be activated.');
  }

  await sequelize.transaction(async (transaction) => {
    await LegalDocument.update(
      {
        activeVersionId: version.id,
        status: resolveDocumentStatus(document, { hasActiveVersion: true }),
        publishedAt: version.effectiveAt ?? version.publishedAt ?? new Date(),
        updatedBy: actor.actorId ?? document.updatedBy ?? null,
      },
      { where: { id: documentId }, transaction },
    );

    await LegalDocumentVersion.update(
      {
        supersededAt: new Date(),
      },
      {
        where: {
          documentId,
          id: { [Op.ne]: version.id },
          status: { [Op.in]: ['published', 'approved'] },
        },
        transaction,
      },
    );
  });

  await recordAuditEvent(documentId, versionId, 'document.version.activated', {}, actor);

  return getLegalDocument(documentId, { includeVersions: true, includeAudit: false });
}

export async function archiveDocumentVersion(documentId, versionId, payload = {}, actor = {}) {
  const document = await LegalDocument.findByPk(documentId);
  if (!document) {
    throw new NotFoundError('Legal document not found.');
  }
  const version = await loadVersion(documentId, versionId);

  if (document.activeVersionId === versionId) {
    await document.update({
      activeVersionId: null,
      status: resolveDocumentStatus(document, { hasActiveVersion: false }),
      retiredAt: new Date(),
    });
  }

  await version.update({
    status: 'archived',
    supersededAt: payload.archivedAt ? new Date(payload.archivedAt) : new Date(),
  });

  await recordAuditEvent(documentId, versionId, 'document.version.archived', payload, actor);

  return version.toSummary();
}

export const __testing = {
  slugify,
  normalizeStringArray,
  sanitizeMetadata,
  mapDocumentInstance,
  resolveDocumentStatus,
};

export default {
  listLegalDocuments,
  getLegalDocument,
  createLegalDocument,
  updateLegalDocument,
  createDocumentVersion,
  updateDocumentVersion,
  publishDocumentVersion,
  activateDocumentVersion,
  archiveDocumentVersion,
};
