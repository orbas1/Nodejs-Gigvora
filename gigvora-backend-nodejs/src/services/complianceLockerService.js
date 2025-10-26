import { Op } from 'sequelize';
import {
  sequelize,
  User,
  ComplianceDocument,
  ComplianceDocumentVersion,
  ComplianceReminder,
  ComplianceObligation,
  ComplianceLocalization,
  ConsentPolicy,
  ConsentPolicyVersion,
  UserConsent,
  LegalDocument,
  LegalDocumentVersion,
  LegalDocumentAuditEvent,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { assertComplianceInfrastructureOperational } from './runtimeDependencyGuard.js';
import { appCache, buildCacheKey } from '../utils/cache.js';

const CACHE_NAMESPACE = 'compliance:locker';
const CACHE_TTL_SECONDS = 45;

function lockerCachePrefix(ownerId) {
  return `${CACHE_NAMESPACE}:${ownerId}`;
}

function invalidateLockerCache(ownerId) {
  if (!ownerId) return;
  appCache.flushByPrefix(lockerCachePrefix(ownerId));
}

function normalizePositiveInteger(value, fieldName) {
  if (value == null) {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer.`);
  }
  return numeric;
}

function normalizeString(value, fieldName, { required = false, maxLength } = {}) {
  if (value == null) {
    if (required) {
      throw new ValidationError(`${fieldName} is required.`);
    }
    return null;
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    if (required) {
      throw new ValidationError(`${fieldName} cannot be empty.`);
    }
    return null;
  }
  if (maxLength && trimmed.length > maxLength) {
    throw new ValidationError(`${fieldName} must be ${maxLength} characters or fewer.`);
  }
  return trimmed;
}

function normalizeDate(value, fieldName) {
  if (value == null || value === '') {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date.`);
  }
  return date;
}

function ensureDocumentPayload(payload = {}) {
  const ownerId = normalizePositiveInteger(payload.ownerId, 'ownerId');
  const title = normalizeString(payload.title, 'title', { required: true, maxLength: 255 });
  const storagePath = normalizeString(payload.storagePath, 'storagePath', { required: true, maxLength: 500 });

  const documentType = payload.documentType ?? 'contract';
  const status = payload.status ?? 'awaiting_signature';
  const storageProvider = payload.storageProvider ?? 'r2';

  const tags = Array.isArray(payload.tags)
    ? payload.tags.filter((tag) => typeof tag === 'string' && tag.trim().length > 0).map((tag) => tag.trim())
    : null;
  const metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : null;

  return {
    ownerId,
    workspaceId: normalizePositiveInteger(payload.workspaceId, 'workspaceId'),
    title,
    documentType,
    status,
    storageProvider,
    storagePath,
    storageRegion: normalizeString(payload.storageRegion, 'storageRegion', { maxLength: 120 }),
    counterpartyName: normalizeString(payload.counterpartyName, 'counterpartyName', { maxLength: 255 }),
    counterpartyEmail: normalizeString(payload.counterpartyEmail, 'counterpartyEmail', { maxLength: 255 }),
    counterpartyCompany: normalizeString(payload.counterpartyCompany, 'counterpartyCompany', { maxLength: 255 }),
    jurisdiction: normalizeString(payload.jurisdiction, 'jurisdiction', { maxLength: 120 }),
    governingLaw: normalizeString(payload.governingLaw, 'governingLaw', { maxLength: 120 }),
    effectiveDate: normalizeDate(payload.effectiveDate, 'effectiveDate'),
    expiryDate: normalizeDate(payload.expiryDate, 'expiryDate'),
    renewalTerms: normalizeString(payload.renewalTerms, 'renewalTerms', { maxLength: 255 }),
    obligationSummary: normalizeString(payload.obligationSummary, 'obligationSummary'),
    tags,
    metadata,
  };
}

function normalizeVersionPayload(documentId, payload = {}, { defaultVersionNumber = 1, actorId } = {}) {
  const versionNumber = normalizePositiveInteger(payload.versionNumber ?? defaultVersionNumber, 'versionNumber');
  const fileKey = normalizeString(payload.fileKey ?? payload.storageKey, 'fileKey', { required: true, maxLength: 500 });
  const fileName = normalizeString(payload.fileName, 'fileName', { required: true, maxLength: 255 });
  const mimeType = normalizeString(payload.mimeType, 'mimeType', { maxLength: 120 });
  const fileSize = payload.fileSize == null ? null : Number(payload.fileSize);
  if (fileSize != null && (!Number.isFinite(fileSize) || fileSize < 0)) {
    throw new ValidationError('fileSize must be a positive number when provided.');
  }

  const metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : null;
  const auditTrail = payload.auditTrail && typeof payload.auditTrail === 'object' ? payload.auditTrail : null;

  return {
    documentId,
    versionNumber,
    fileKey,
    fileName,
    mimeType,
    fileSize,
    sha256: normalizeString(payload.sha256, 'sha256', { maxLength: 128 }),
    uploadedById: actorId ?? normalizePositiveInteger(payload.uploadedById, 'uploadedById'),
    signedAt: normalizeDate(payload.signedAt, 'signedAt'),
    signedByName: normalizeString(payload.signedByName, 'signedByName', { maxLength: 255 }),
    signedByEmail: normalizeString(payload.signedByEmail, 'signedByEmail', { maxLength: 255 }),
    signedByIp: normalizeString(payload.signedByIp, 'signedByIp', { maxLength: 64 }),
    auditTrail,
    changeSummary: normalizeString(payload.changeSummary, 'changeSummary'),
    metadata,
  };
}

function normalizeObligationPayload(documentId, payload = {}) {
  const description = normalizeString(payload.description, 'description', { required: true });
  const metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : null;
  const escalations = payload.escalations && typeof payload.escalations === 'object' ? payload.escalations : null;
  return {
    documentId,
    clauseReference: normalizeString(payload.clauseReference, 'clauseReference', { maxLength: 120 }),
    description,
    status: payload.status ?? 'open',
    dueAt: normalizeDate(payload.dueAt, 'dueAt'),
    completedAt: normalizeDate(payload.completedAt, 'completedAt'),
    assigneeId: normalizePositiveInteger(payload.assigneeId, 'assigneeId'),
    priority: normalizeString(payload.priority, 'priority', { maxLength: 60 }),
    escalations,
    metadata,
    lastNotifiedAt: normalizeDate(payload.lastNotifiedAt, 'lastNotifiedAt'),
  };
}

function normalizeReminderPayload(documentId, payload = {}) {
  const reminderType = normalizeString(payload.reminderType, 'reminderType', { required: true, maxLength: 120 });
  const metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : null;
  return {
    documentId,
    obligationId: normalizePositiveInteger(payload.obligationId, 'obligationId'),
    reminderType,
    dueAt: normalizeDate(payload.dueAt ?? payload.dueDate, 'dueAt') ?? new Date(),
    status: payload.status ?? 'scheduled',
    channel: normalizeString(payload.channel, 'channel', { maxLength: 60 }),
    createdById: normalizePositiveInteger(payload.createdById, 'createdById'),
    sentAt: normalizeDate(payload.sentAt, 'sentAt'),
    acknowledgedAt: normalizeDate(payload.acknowledgedAt, 'acknowledgedAt'),
    metadata,
  };
}

function toPlain(instance) {
  if (!instance) return null;
  if (typeof instance.toPublicObject === 'function') {
    return instance.toPublicObject();
  }
  if (typeof instance.get === 'function') {
    return instance.get({ plain: true });
  }
  return instance;
}

function buildVersionsByDocument(versions) {
  const map = new Map();
  versions.forEach((version) => {
    if (!map.has(version.documentId)) {
      map.set(version.documentId, []);
    }
    map.get(version.documentId).push(version);
  });
  map.forEach((list) => list.sort((a, b) => b.versionNumber - a.versionNumber));
  return map;
}

function buildCollectionByDocument(records, key = 'documentId') {
  const map = new Map();
  records.forEach((record) => {
    const bucketKey = record[key];
    if (!bucketKey) return;
    if (!map.has(bucketKey)) {
      map.set(bucketKey, []);
    }
    map.get(bucketKey).push(record);
  });
  return map;
}

function formatAuditActionLabel(action) {
  if (!action) {
    return 'Legal Event';
  }
  return action
    .toString()
    .split(/[_\s-]+/)
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function sanitizeReminder(reminder) {
  const plain = toPlain(reminder);
  if (!plain) return null;
  return {
    id: plain.id,
    documentId: plain.documentId,
    obligationId: plain.obligationId,
    reminderType: plain.reminderType,
    dueAt: plain.dueAt,
    status: plain.status,
    channel: plain.channel,
    createdById: plain.createdById,
    sentAt: plain.sentAt,
    acknowledgedAt: plain.acknowledgedAt,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function sanitizePolicyAcknowledgement(consent) {
  if (!consent) {
    return null;
  }
  const plain = toPlain(consent);
  if (!plain) {
    return null;
  }
  return {
    id: plain.id,
    policyId: plain.policyId,
    policyVersionId: plain.policyVersionId,
    status: plain.status,
    grantedAt: plain.grantedAt,
    withdrawnAt: plain.withdrawnAt,
    source: plain.source,
    metadata: plain.metadata ?? null,
  };
}

function sanitizeConsentPolicy(policy, { activeVersionMap, userConsentMap }) {
  const plain = toPlain(policy);
  if (!plain) {
    return null;
  }
  const activeVersion = activeVersionMap.get(plain.activeVersionId ?? null) ?? null;
  const acknowledgement = sanitizePolicyAcknowledgement(userConsentMap.get(plain.id));
  const isCurrentAcknowledgement = Boolean(
    acknowledgement &&
      acknowledgement.status === 'granted' &&
      acknowledgement.policyVersionId === (plain.activeVersionId ?? acknowledgement.policyVersionId),
  );
  const isOutstanding = Boolean(
    plain.required && (!acknowledgement || acknowledgement.status !== 'granted' || !isCurrentAcknowledgement),
  );

  return {
    id: plain.id,
    code: plain.code,
    title: plain.title,
    description: plain.description ?? null,
    audience: plain.audience,
    region: plain.region,
    legalBasis: plain.legalBasis,
    required: Boolean(plain.required),
    revocable: Boolean(plain.revocable),
    retentionPeriodDays: plain.retentionPeriodDays ?? null,
    metadata: plain.metadata ?? {},
    activeVersion,
    acknowledgement: acknowledgement
      ? {
          ...acknowledgement,
          isCurrentVersion: isCurrentAcknowledgement,
        }
      : null,
    isOutstanding,
  };
}

function sanitizeLegalDocumentVersion(version) {
  if (!version) {
    return null;
  }
  const plain = toPlain(version);
  if (!plain) {
    return null;
  }
  return {
    id: plain.id,
    documentId: plain.documentId,
    version: plain.version,
    locale: plain.locale,
    status: plain.status,
    summary: plain.summary ?? null,
    changeSummary: plain.changeSummary ?? null,
    effectiveAt: plain.effectiveAt,
    publishedAt: plain.publishedAt,
    supersededAt: plain.supersededAt,
    externalUrl: plain.externalUrl ?? null,
    metadata: plain.metadata ?? null,
  };
}

function sanitizeLegalDocument(document, activeVersionMap) {
  const plain = toPlain(document);
  if (!plain) {
    return null;
  }
  return {
    id: plain.id,
    slug: plain.slug,
    title: plain.title,
    category: plain.category,
    status: plain.status,
    region: plain.region,
    defaultLocale: plain.defaultLocale,
    audienceRoles: Array.isArray(plain.audienceRoles) ? plain.audienceRoles : [],
    editorRoles: Array.isArray(plain.editorRoles) ? plain.editorRoles : [],
    tags: Array.isArray(plain.tags) ? plain.tags : [],
    summary: plain.summary ?? null,
    metadata: plain.metadata ?? {},
    publishedAt: plain.publishedAt,
    retiredAt: plain.retiredAt,
    activeVersion: sanitizeLegalDocumentVersion(activeVersionMap.get(plain.activeVersionId ?? null)),
  };
}

function sanitizeObligation(obligation, reminderMap) {
  const plain = toPlain(obligation);
  if (!plain) return null;
  const reminders = reminderMap.get(plain.id) ?? [];
  return {
    id: plain.id,
    documentId: plain.documentId,
    clauseReference: plain.clauseReference,
    description: plain.description,
    status: plain.status,
    dueAt: plain.dueAt,
    completedAt: plain.completedAt,
    assigneeId: plain.assigneeId,
    priority: plain.priority,
    escalations: plain.escalations ?? null,
    metadata: plain.metadata ?? null,
    lastNotifiedAt: plain.lastNotifiedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    reminders: reminders.map(sanitizeReminder),
  };
}

function sanitizeDocument(document, { versionMap, obligationMap, reminderMap }) {
  const plain = toPlain(document);
  if (!plain) return null;
  const versions = versionMap.get(plain.id) ?? [];
  const obligations = obligationMap.get(plain.id) ?? [];
  const reminders = reminderMap.get(plain.id) ?? [];
  const remindersByObligation = buildCollectionByDocument(reminders, 'obligationId');

  return {
    ...plain,
    tags: Array.isArray(plain.tags) ? plain.tags : plain.tags ? Object.values(plain.tags) : [],
    metadata: plain.metadata ?? null,
    versions: versions.slice(0, 5).map((version) => {
      const sanitized = toPlain(version);
      return {
        ...sanitized,
        auditTrail: sanitized.auditTrail ?? null,
        metadata: sanitized.metadata ?? null,
      };
    }),
    obligations: obligations.map((obligation) => sanitizeObligation(obligation, remindersByObligation)),
    reminders: reminders.filter((reminder) => !reminder.obligationId).map(sanitizeReminder),
  };
}

function sanitizeFramework(record) {
  const plain = toPlain(record);
  if (!plain) return null;
  return {
    id: plain.id,
    framework: plain.framework,
    region: plain.region,
    requirement: plain.requirement,
    guidance: plain.guidance,
    recommendedDocumentTypes: Array.isArray(plain.recommendedDocumentTypes)
      ? plain.recommendedDocumentTypes
      : plain.recommendedDocumentTypes ?? [],
    questionnaireUrl: plain.questionnaireUrl,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function computeDocumentSummary(documents) {
  const totals = {
    totalDocuments: documents.length,
    activeDocuments: 0,
    awaitingSignature: 0,
    expired: 0,
    archived: 0,
    jurisdictionsCovered: 0,
  };
  const jurisdictions = new Set();
  const typeCounts = {};
  const now = Date.now();
  const renewals = [];

  documents.forEach((document) => {
    const status = document.status ?? 'draft';
    if (status === 'active') totals.activeDocuments += 1;
    if (status === 'awaiting_signature') totals.awaitingSignature += 1;
    if (status === 'expired') totals.expired += 1;
    if (status === 'archived' || status === 'superseded') totals.archived += 1;

    if (document.documentType) {
      const typeKey = document.documentType;
      typeCounts[typeKey] = (typeCounts[typeKey] ?? 0) + 1;
    }

    if (document.jurisdiction) {
      jurisdictions.add(document.jurisdiction);
    }

    if (document.expiryDate) {
      const expiry = new Date(document.expiryDate).getTime();
      if (!Number.isNaN(expiry)) {
        const daysUntil = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
        renewals.push({
          documentId: document.id,
          title: document.title,
          status,
          expiryDate: document.expiryDate,
          daysUntil,
        });
      }
    }
  });

  totals.jurisdictionsCovered = jurisdictions.size;
  renewals.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  const expiringSoon = renewals.filter((renewal) => renewal.daysUntil >= 0 && renewal.daysUntil <= 45);
  const overdueRenewals = renewals.filter((renewal) => renewal.daysUntil < 0);

  return {
    totals,
    typeCounts,
    renewals,
    expiringSoon,
    overdueRenewals,
  };
}

function computeObligationSummary(obligations) {
  const openStatuses = new Set(['open', 'in_progress', 'overdue']);
  const open = obligations.filter((item) => openStatuses.has(item.status));
  const overdue = obligations.filter((item) => item.status === 'overdue');
  const completed = obligations.filter((item) => item.status === 'satisfied' || item.status === 'waived');

  return {
    total: obligations.length,
    openCount: open.length,
    overdueCount: overdue.length,
    completedCount: completed.length,
    open,
    overdue,
    completed,
  };
}

function computeReminderSummary(reminders) {
  const now = Date.now();
  const overdue = reminders.filter(
    (reminder) =>
      reminder.status !== 'acknowledged' &&
      reminder.status !== 'dismissed' &&
      reminder.status !== 'cancelled' &&
      reminder.dueAt &&
      new Date(reminder.dueAt).getTime() < now,
  );
  const upcoming = reminders
    .filter((reminder) => reminder.dueAt && new Date(reminder.dueAt).getTime() >= now)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());

  return {
    total: reminders.length,
    overdue,
    upcoming,
  };
}

function computePolicySummary(policies) {
  if (!policies.length) {
    return {
      total: 0,
      required: 0,
      acknowledged: 0,
      outstanding: 0,
      withdrawn: 0,
      lastAcknowledgedAt: null,
    };
  }

  let lastAcknowledgedAt = null;
  let acknowledged = 0;
  let withdrawn = 0;
  const requiredPolicies = policies.filter((policy) => policy.required);

  policies.forEach((policy) => {
    const acknowledgement = policy.acknowledgement;
    if (acknowledgement?.status === 'granted') {
      acknowledged += acknowledgement.isCurrentVersion ? 1 : 0;
      if (acknowledgement.grantedAt) {
        const timestamp = new Date(acknowledgement.grantedAt).getTime();
        if (!Number.isNaN(timestamp) && (lastAcknowledgedAt == null || timestamp > lastAcknowledgedAt)) {
          lastAcknowledgedAt = timestamp;
        }
      }
    }
    if (acknowledgement?.status === 'withdrawn') {
      withdrawn += 1;
    }
  });

  return {
    total: policies.length,
    required: requiredPolicies.length,
    acknowledged,
    outstanding: policies.filter((policy) => policy.isOutstanding).length,
    withdrawn,
    lastAcknowledgedAt: lastAcknowledgedAt != null ? new Date(lastAcknowledgedAt) : null,
  };
}

function computeLegalDocumentSummary(documents) {
  if (!documents.length) {
    return {
      total: 0,
      active: 0,
      categories: [],
      regions: [],
      lastPublishedAt: null,
    };
  }

  const categories = new Set();
  const regions = new Set();
  let latestPublished = null;

  documents.forEach((document) => {
    if (document.category) {
      categories.add(document.category);
    }
    if (document.region) {
      regions.add(document.region);
    }
    const publishedAt = document.activeVersion?.publishedAt ?? document.publishedAt ?? null;
    if (publishedAt) {
      const timestamp = new Date(publishedAt).getTime();
      if (!Number.isNaN(timestamp) && (latestPublished == null || timestamp > latestPublished)) {
        latestPublished = timestamp;
      }
    }
  });

  return {
    total: documents.length,
    active: documents.filter((document) => document.status === 'active').length,
    categories: Array.from(categories),
    regions: Array.from(regions),
    lastPublishedAt: latestPublished != null ? new Date(latestPublished) : null,
  };
}

async function persistDocument(payload, { actorId, logger, requestId, forceRefresh = false } = {}) {
  const normalized = ensureDocumentPayload(payload);
  if (!normalized.ownerId) {
    throw new ValidationError('ownerId is required.');
  }

  await assertComplianceInfrastructureOperational({
    feature: 'compliance_document:create',
    logger,
    requestId,
    forceRefresh,
  });

  return sequelize.transaction(async (transaction) => {
    const document = await ComplianceDocument.create(
      {
        ...normalized,
      },
      { transaction },
    );

    const versionInput = payload.version ?? payload.latestVersion;
    let createdVersion = null;
    if (versionInput) {
      const versionPayload = normalizeVersionPayload(document.id, versionInput, {
        defaultVersionNumber: 1,
        actorId,
      });
      createdVersion = await ComplianceDocumentVersion.create(versionPayload, { transaction });
      await document.update({ latestVersionId: createdVersion.id }, { transaction });
    }

    const obligationsInput = Array.isArray(payload.obligations) ? payload.obligations : [];
    const createdObligations = [];
    const clauseMap = new Map();
    for (const obligationInput of obligationsInput) {
      const normalizedObligation = normalizeObligationPayload(document.id, obligationInput);
      const obligation = await ComplianceObligation.create(normalizedObligation, { transaction });
      createdObligations.push(obligation);
      if (normalizedObligation.clauseReference) {
        clauseMap.set(normalizedObligation.clauseReference, obligation);
      }
    }

    const remindersInput = Array.isArray(payload.reminders) ? payload.reminders : [];
    const createdReminders = [];
    for (const reminderInput of remindersInput) {
      const normalizedReminder = normalizeReminderPayload(document.id, reminderInput);
      if (!normalizedReminder.obligationId && reminderInput.clauseReference) {
        const referenced = clauseMap.get(reminderInput.clauseReference);
        if (referenced) {
          normalizedReminder.obligationId = referenced.id;
        }
      }
      const reminder = await ComplianceReminder.create(normalizedReminder, { transaction });
      createdReminders.push(reminder);
    }

    await document.reload({ transaction });

    invalidateLockerCache(document.ownerId);

    if (createdVersion) {
      await createdVersion.reload({ transaction });
    }

    return {
      document,
      versions: createdVersion ? [createdVersion] : [],
      obligations: createdObligations,
      reminders: createdReminders,
    };
  });
}

async function fetchLockerOverview(ownerId, options = {}) {
  const limit = options.limit && Number.isInteger(options.limit) && options.limit > 0 ? options.limit : 50;
  const region = options.region ? String(options.region).trim() : null;
  const frameworkFilter = Array.isArray(options.frameworks)
    ? options.frameworks.filter((item) => item && String(item).trim().length > 0).map((item) => String(item).trim())
    : options.frameworks
    ? [String(options.frameworks).trim()]
    : [];

  const owner = await User.findByPk(ownerId, {
    attributes: ['id', 'firstName', 'lastName', 'email'],
  });

  const documents = await ComplianceDocument.findAll({
    where: { ownerId },
    order: [['updatedAt', 'DESC']],
    limit,
  });

  const documentIds = documents.map((document) => document.id);

  const [versions, obligations, reminders] = await Promise.all([
    documentIds.length
      ? ComplianceDocumentVersion.findAll({
          where: { documentId: { [Op.in]: documentIds } },
          order: [
            ['documentId', 'ASC'],
            ['versionNumber', 'DESC'],
          ],
        })
      : [],
    documentIds.length
      ? ComplianceObligation.findAll({
          where: { documentId: { [Op.in]: documentIds } },
          order: [
            ['documentId', 'ASC'],
            ['dueAt', 'ASC NULLS LAST'],
          ],
        })
      : [],
    documentIds.length
      ? ComplianceReminder.findAll({
          where: { documentId: { [Op.in]: documentIds } },
          order: [
            ['documentId', 'ASC'],
            ['dueAt', 'ASC'],
          ],
        })
      : [],
  ]);

  const policyWhere = { activeVersionId: { [Op.not]: null } };
  if (region) {
    policyWhere.region = { [Op.in]: [region, 'global'] };
  }

  const policies = await ConsentPolicy.findAll({
    where: policyWhere,
    order: [
      ['region', 'ASC'],
      ['code', 'ASC'],
    ],
  });

  const policyIds = policies.map((policy) => policy.id);
  const activePolicyVersionIds = policies
    .map((policy) => policy.activeVersionId)
    .filter((value) => Number.isInteger(value));

  const [activePolicyVersions, userConsents] = await Promise.all([
    activePolicyVersionIds.length
      ? ConsentPolicyVersion.findAll({ where: { id: { [Op.in]: activePolicyVersionIds } } })
      : [],
    policyIds.length
      ? UserConsent.findAll({
          where: {
            policyId: { [Op.in]: policyIds },
            userId: ownerId,
          },
        })
      : [],
  ]);

  const policyVersionMap = new Map();
  activePolicyVersions.forEach((version) => {
    const plain = toPlain(version);
    if (!plain) {
      return;
    }
    policyVersionMap.set(plain.id, {
      id: plain.id,
      version: plain.version,
      documentUrl: plain.documentUrl ?? null,
      summary: plain.summary ?? null,
      effectiveAt: plain.effectiveAt,
      supersededAt: plain.supersededAt,
      metadata: plain.metadata ?? {},
    });
  });

  const userConsentMap = new Map();
  userConsents.forEach((consent) => {
    userConsentMap.set(consent.policyId, consent);
  });

  const sanitizedPolicies = policies
    .map((policy) => sanitizeConsentPolicy(policy, { activeVersionMap: policyVersionMap, userConsentMap }))
    .filter(Boolean);
  const policySummary = computePolicySummary(sanitizedPolicies);

  const legalWhere = { status: { [Op.ne]: 'archived' } };
  if (region) {
    legalWhere.region = { [Op.in]: [region, 'global'] };
  }

  const legalDocuments = await LegalDocument.findAll({
    where: legalWhere,
    order: [
      ['category', 'ASC'],
      ['title', 'ASC'],
    ],
  });

  const legalDocumentIds = legalDocuments.map((document) => document.id);
  const legalActiveVersionIds = legalDocuments
    .map((document) => document.activeVersionId)
    .filter((value) => Number.isInteger(value));

  const legalVersions = legalActiveVersionIds.length
    ? await LegalDocumentVersion.findAll({ where: { id: { [Op.in]: legalActiveVersionIds } } })
    : [];

  const legalAuditEvents = legalDocumentIds.length
    ? await LegalDocumentAuditEvent.findAll({
        where: { documentId: { [Op.in]: legalDocumentIds } },
        order: [['createdAt', 'DESC']],
        limit: 100,
      })
    : [];

  const legalVersionMap = new Map();
  legalVersions.forEach((version) => {
    if (version) {
      legalVersionMap.set(version.id, version);
    }
  });

  const sanitizedLegalDocuments = legalDocuments
    .map((document) => sanitizeLegalDocument(document, legalVersionMap))
    .filter(Boolean);
  const legalSummary = computeLegalDocumentSummary(sanitizedLegalDocuments);

  const versionMap = buildVersionsByDocument(versions.map((version) => toPlain(version)));
  const obligationMap = buildCollectionByDocument(obligations.map((item) => toPlain(item)));
  const reminderMap = buildCollectionByDocument(reminders.map((item) => toPlain(item)));
  const filteredDocuments = documents
    .map((document) => sanitizeDocument(document, { versionMap, obligationMap, reminderMap }))
    .filter(Boolean);

  const summary = computeDocumentSummary(filteredDocuments);
  const allObligations = filteredDocuments.flatMap((document) => document.obligations ?? []);
  const obligationsSummary = computeObligationSummary(allObligations);
  const allReminders = filteredDocuments
    .flatMap((document) => [
      ...(document.reminders ?? []),
      ...(document.obligations ?? []).flatMap((obligation) => obligation.reminders ?? []),
    ])
    .map((reminder) => ({ ...reminder }));
  const remindersSummary = computeReminderSummary(allReminders);

  const versionEvents = versions.map((version) => {
    const plain = toPlain(version);
    return {
      id: `version-${plain.id}`,
      documentId: plain.documentId,
      type: 'version',
      label: `Version ${plain.versionNumber}`,
      occurredAt: plain.createdAt,
      actorId: plain.uploadedById,
      summary: plain.changeSummary ?? 'Document version uploaded',
      metadata: plain.metadata ?? null,
    };
  });
  const reminderEvents = reminders.map((reminder) => {
    const plain = toPlain(reminder);
    return {
      id: `reminder-${plain.id}`,
      documentId: plain.documentId,
      type: 'reminder',
      label: `${plain.reminderType} reminder`,
      occurredAt: plain.updatedAt ?? plain.createdAt,
      actorId: plain.createdById,
      summary: `Reminder ${plain.status}`,
      metadata: plain.metadata ?? null,
    };
  });
  const legalEvents = legalAuditEvents.map((event) => {
    const plain = toPlain(event);
    return {
      id: `legal-audit-${plain.id}`,
      documentId: plain.documentId,
      type: 'legal_audit',
      label: `Legal ${formatAuditActionLabel(plain.action)}`,
      occurredAt: plain.createdAt,
      actorId: plain.actorId,
      summary: plain.metadata?.summary ?? `Legal document ${plain.action}`,
      metadata: plain.metadata ?? null,
    };
  });

  const auditLog = versionEvents
    .concat(reminderEvents)
    .concat(legalEvents)
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, 50);

  const localizationWhere = {};
  if (region) {
    localizationWhere.region = region;
  }
  if (frameworkFilter.length) {
    localizationWhere.framework = { [Op.in]: frameworkFilter };
  }

  let frameworks = await ComplianceLocalization.findAll({
    where: localizationWhere,
    order: [
      ['framework', 'ASC'],
      ['region', 'ASC'],
    ],
  });

  if (region) {
    const globalWhere = { region: 'global' };
    if (frameworkFilter.length) {
      globalWhere.framework = { [Op.in]: frameworkFilter };
    }
    const globalFrameworks = await ComplianceLocalization.findAll({
      where: globalWhere,
      order: [
        ['framework', 'ASC'],
        ['region', 'ASC'],
      ],
    });
    frameworks = frameworks.concat(globalFrameworks);
  }

  const policySummaryFormatted = {
    total: policySummary.total,
    required: policySummary.required,
    acknowledged: policySummary.acknowledged,
    outstanding: policySummary.outstanding,
    withdrawn: policySummary.withdrawn,
    lastAcknowledgedAt: policySummary.lastAcknowledgedAt
      ? policySummary.lastAcknowledgedAt.toISOString()
      : null,
  };

  const legalSummaryFormatted = {
    total: legalSummary.total,
    active: legalSummary.active,
    categories: legalSummary.categories,
    regions: legalSummary.regions,
    lastPublishedAt: legalSummary.lastPublishedAt
      ? legalSummary.lastPublishedAt.toISOString()
      : null,
  };

  return {
    owner: owner ? owner.get({ plain: true }) : null,
    summary: {
      totals: summary.totals,
      typeCounts: summary.typeCounts,
      renewals: summary.renewals,
      expiringSoon: summary.expiringSoon,
      overdueRenewals: summary.overdueRenewals,
      obligations: {
        total: obligationsSummary.total,
        open: obligationsSummary.openCount,
        overdue: obligationsSummary.overdueCount,
        completed: obligationsSummary.completedCount,
      },
      reminders: {
        total: remindersSummary.total,
        overdue: remindersSummary.overdue.length,
        upcoming: remindersSummary.upcoming.length,
      },
    },
    documents: {
      list: filteredDocuments,
    },
    obligations: {
      open: obligationsSummary.open,
      overdue: obligationsSummary.overdue,
      completed: obligationsSummary.completed,
    },
    reminders: {
      upcoming: remindersSummary.upcoming,
      overdue: remindersSummary.overdue,
    },
    frameworks: frameworks.map(sanitizeFramework),
    legalPolicies: {
      summary: policySummaryFormatted,
      list: sanitizedPolicies,
    },
    legalDocuments: {
      summary: legalSummaryFormatted,
      list: sanitizedLegalDocuments,
    },
    auditLog,
  };
}

export async function createComplianceDocument(payload, options = {}) {
  const { document, versions, obligations, reminders } = await persistDocument(payload, options);
  const versionMap = buildVersionsByDocument(versions.map((item) => toPlain(item)));
  const obligationMap = buildCollectionByDocument(obligations.map((item) => toPlain(item)));
  const reminderMap = buildCollectionByDocument(reminders.map((item) => toPlain(item)));
  return sanitizeDocument(document, { versionMap, obligationMap, reminderMap });
}

export async function addComplianceDocumentVersion(
  documentId,
  payload = {},
  { actorId, logger, requestId, forceRefresh = false } = {},
) {
  const normalizedDocumentId = normalizePositiveInteger(documentId, 'documentId');
  const document = await ComplianceDocument.findByPk(normalizedDocumentId);
  if (!document) {
    throw new NotFoundError('Compliance document not found.');
  }

  await assertComplianceInfrastructureOperational({
    feature: 'compliance_document:version',
    logger,
    requestId,
    forceRefresh,
  });

  return sequelize.transaction(async (transaction) => {
    const currentMaxVersion = await ComplianceDocumentVersion.max('versionNumber', {
      where: { documentId: normalizedDocumentId },
      transaction,
    });
    const nextVersionNumber = Number.isFinite(currentMaxVersion) ? currentMaxVersion + 1 : 1;

    const versionPayload = normalizeVersionPayload(normalizedDocumentId, payload, {
      defaultVersionNumber: nextVersionNumber,
      actorId,
    });

    const version = await ComplianceDocumentVersion.create(versionPayload, { transaction });

    const documentUpdates = {};
    if (payload.status) {
      documentUpdates.status = payload.status;
    }
    if (payload.expiryDate) {
      documentUpdates.expiryDate = normalizeDate(payload.expiryDate, 'expiryDate');
    }
    if (payload.effectiveDate) {
      documentUpdates.effectiveDate = normalizeDate(payload.effectiveDate, 'effectiveDate');
    }
    if (payload.renewalTerms) {
      documentUpdates.renewalTerms = normalizeString(payload.renewalTerms, 'renewalTerms', { maxLength: 255 });
    }
    if (payload.metadata && typeof payload.metadata === 'object') {
      documentUpdates.metadata = {
        ...(document.metadata ?? {}),
        ...payload.metadata,
      };
    }

    await document.update({
      latestVersionId: version.id,
      ...documentUpdates,
    }, { transaction });

    await document.reload({ transaction });

    invalidateLockerCache(document.ownerId);

    return {
      document: document.toPublicObject(),
      version: version.toPublicObject(),
    };
  });
}

export async function acknowledgeComplianceReminder(
  reminderId,
  status = 'acknowledged',
  { actorId, logger, requestId, forceRefresh = false } = {},
) {
  const normalizedReminderId = normalizePositiveInteger(reminderId, 'reminderId');
  const reminder = await ComplianceReminder.findByPk(normalizedReminderId, {
    include: [{ model: ComplianceDocument, as: 'document' }],
  });
  if (!reminder) {
    throw new NotFoundError('Reminder not found.');
  }

  await assertComplianceInfrastructureOperational({
    feature: 'compliance_document:reminder',
    logger,
    requestId,
    forceRefresh,
  });

  const validStatuses = new Set(['scheduled', 'sent', 'acknowledged', 'dismissed', 'cancelled']);
  if (!validStatuses.has(status)) {
    throw new ValidationError('Invalid reminder status.');
  }

  const updates = { status };
  const now = new Date();
  if (status === 'acknowledged' || status === 'dismissed') {
    updates.acknowledgedAt = now;
  }
  if (status === 'sent' && !reminder.sentAt) {
    updates.sentAt = now;
  }

  const metadata = reminder.metadata && typeof reminder.metadata === 'object' ? { ...reminder.metadata } : {};
  if (actorId) {
    metadata.lastActorId = actorId;
    metadata.lastActorStatus = status;
  }
  updates.metadata = metadata;

  await reminder.update(updates);
  await reminder.reload();

  if (reminder.document?.ownerId) {
    invalidateLockerCache(reminder.document.ownerId);
  }

  return sanitizeReminder(reminder);
}

export async function getComplianceLockerOverview(ownerId, options = {}) {
  const normalizedOwnerId = normalizePositiveInteger(ownerId, 'ownerId');
  const useCache = options.useCache !== false;
  const cacheKeyPayload = {
    limit: options.limit ?? null,
    region: options.region ?? null,
    frameworks: Array.isArray(options.frameworks) ? options.frameworks : options.frameworks ? [options.frameworks] : [],
  };
  const cacheKey = buildCacheKey(lockerCachePrefix(normalizedOwnerId), cacheKeyPayload);

  if (!useCache) {
    return fetchLockerOverview(normalizedOwnerId, options);
  }

  return appCache.remember(cacheKey, CACHE_TTL_SECONDS, () => fetchLockerOverview(normalizedOwnerId, options));
}

export async function recordComplianceDocument(payload, options = {}) {
  const { document, versions, obligations, reminders } = await persistDocument(payload, options);
  const versionMap = buildVersionsByDocument(versions.map((item) => toPlain(item)));
  const obligationMap = buildCollectionByDocument(obligations.map((item) => toPlain(item)));
  const reminderMap = buildCollectionByDocument(reminders.map((item) => toPlain(item)));
  return sanitizeDocument(document, { versionMap, obligationMap, reminderMap });
}

export default {
  createComplianceDocument,
  addComplianceDocumentVersion,
  acknowledgeComplianceReminder,
  getComplianceLockerOverview,
  recordComplianceDocument,
};
