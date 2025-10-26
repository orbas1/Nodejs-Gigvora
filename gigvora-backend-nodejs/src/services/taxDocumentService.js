import { Op } from 'sequelize';
import {
  sequelize,
  FreelancerTaxFiling,
  FreelancerTaxEstimate,
  ComplianceDocument,
  ComplianceDocumentVersion,
  ComplianceReminder,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { storeTaxDocument, readTaxDocument } from './taxDocumentStorageService.js';

const MAX_LOOKBACK_YEARS = 5;

function ensurePositiveInteger(value, field) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError(`${field} must be a positive integer.`);
  }
  return parsed;
}

function normaliseStatus(status) {
  if (!status) {
    return 'not_started';
  }
  const lower = `${status}`.trim().toLowerCase();
  switch (lower) {
    case 'submitted':
    case 'overdue':
    case 'in_progress':
    case 'not_started':
      return lower;
    default:
      return 'not_started';
  }
}

function buildSeverity(score) {
  if (score == null) {
    return 'low';
  }
  const numeric = Number(score);
  if (!Number.isFinite(numeric)) {
    return 'low';
  }
  if (numeric >= 80) {
    return 'critical';
  }
  if (numeric >= 60) {
    return 'high';
  }
  if (numeric >= 35) {
    return 'medium';
  }
  return 'low';
}

function extractDocumentMetadata(document) {
  const metadata = document.metadata ?? {};
  return {
    taxFilingId:
      metadata.taxFilingId != null
        ? Number(metadata.taxFilingId)
        : metadata.filingId != null
          ? Number(metadata.filingId)
          : null,
    taxYear: metadata.taxYear ?? null,
    jurisdiction: metadata.jurisdiction ?? document.jurisdiction ?? null,
  };
}

function aggregateSummary({ filings }) {
  const total = filings.length;
  let submitted = 0;
  let overdue = 0;
  let requiresAttention = 0;
  let nextDeadline = null;

  for (const filing of filings) {
    if (filing.status === 'submitted') {
      submitted += 1;
    }
    if (filing.status === 'overdue') {
      overdue += 1;
      requiresAttention += 1;
    } else if (filing.status !== 'submitted') {
      requiresAttention += 1;
    }

    if (filing.dueDate) {
      const due = new Date(filing.dueDate);
      if (!Number.isNaN(due.getTime())) {
        if (!nextDeadline || due < nextDeadline) {
          nextDeadline = due;
        }
      }
    }
  }

  return {
    totalFilings: total,
    submittedFilings: submitted,
    outstandingFilings: requiresAttention,
    overdueFilings: overdue,
    nextDeadline: nextDeadline ? nextDeadline.toISOString() : null,
    updatedAt: new Date().toISOString(),
  };
}

function hydrateDocument(filing, { documentsByFiling, remindersByDocument }) {
  const linkedDocument = documentsByFiling.get(filing.id) ?? null;
  const reminders = linkedDocument ? remindersByDocument.get(linkedDocument.id) ?? [] : [];

  const alerts = [];
  if (filing.status === 'overdue') {
    alerts.push('Overdue filing');
  } else if (filing.status !== 'submitted') {
    const due = filing.dueDate ? new Date(filing.dueDate) : null;
    if (due && due.getTime() < Date.now() + 7 * 24 * 60 * 60 * 1000) {
      alerts.push('Due soon');
    }
  }

  for (const reminder of reminders) {
    if (reminder.status !== 'acknowledged') {
      alerts.push(reminder.reminderType.replace(/_/g, ' '));
    }
  }

  return {
    id: filing.id,
    filingId: filing.id,
    name: filing.name,
    jurisdiction: filing.jurisdiction,
    dueDate: filing.dueDate,
    submittedAt: filing.submittedAt,
    status: filing.status,
    taxYear: filing.metadata?.taxYear ?? null,
    amount: filing.metadata?.amount ?? null,
    documentId: linkedDocument?.id ?? null,
    documentTitle: linkedDocument?.title ?? null,
    documentStoragePath: linkedDocument?.storagePath ?? null,
    documentStorageProvider: linkedDocument?.storageProvider ?? null,
    latestVersionId: linkedDocument?.latestVersionId ?? null,
    requiresAction: filing.status !== 'submitted',
    alerts,
    reminders: reminders.map((reminder) => ({
      id: reminder.id,
      reminderType: reminder.reminderType,
      dueAt: reminder.dueAt,
      status: reminder.status,
      metadata: reminder.metadata ?? null,
    })),
  };
}

export async function listTaxDocuments(freelancerId, { lookbackYears = MAX_LOOKBACK_YEARS } = {}) {
  const resolvedId = ensurePositiveInteger(freelancerId, 'freelancerId');
  const resolvedLookback = Number.isFinite(Number(lookbackYears)) ? Number(lookbackYears) : MAX_LOOKBACK_YEARS;
  const since = new Date();
  since.setFullYear(since.getFullYear() - Math.min(Math.max(resolvedLookback, 1), MAX_LOOKBACK_YEARS));

  const filings = await FreelancerTaxFiling.findAll({
    where: {
      freelancerId: resolvedId,
      dueDate: { [Op.gte]: since },
    },
    order: [
      ['dueDate', 'ASC'],
      ['id', 'ASC'],
    ],
  });

  const estimates = await FreelancerTaxEstimate.findAll({
    where: { freelancerId: resolvedId },
    order: [
      ['dueDate', 'ASC'],
      ['id', 'ASC'],
    ],
    limit: 6,
  });

  const filingIds = filings.map((filing) => filing.id);

  let complianceDocuments = [];
  let reminders = [];
  if (filingIds.length) {
    complianceDocuments = await ComplianceDocument.findAll({
      where: {
        ownerId: resolvedId,
        documentType: 'tax',
      },
    });

    const documentIds = complianceDocuments.map((doc) => doc.id);
    if (documentIds.length) {
      reminders = await ComplianceReminder.findAll({
        where: { documentId: { [Op.in]: documentIds } },
        order: [['dueAt', 'ASC']],
      });
    }
  }

  const documentsByFiling = new Map();
  for (const document of complianceDocuments) {
    const { taxFilingId } = extractDocumentMetadata(document);
    if (taxFilingId) {
      documentsByFiling.set(Number(taxFilingId), document);
    }
  }

  const remindersByDocument = new Map();
  for (const reminder of reminders) {
    const list = remindersByDocument.get(reminder.documentId) ?? [];
    list.push(reminder.toPublicObject());
    remindersByDocument.set(reminder.documentId, list);
  }

  const documents = filings.map((filing) => hydrateDocument(filing.toPublicObject(), { documentsByFiling, remindersByDocument }));

  const summary = aggregateSummary({ filings: documents });

  const taxEstimates = estimates.map((estimate) => estimate.toPublicObject());

  return {
    freelancerId: resolvedId,
    summary,
    documents,
    estimates: taxEstimates,
    reminders: reminders.map((reminder) => reminder.toPublicObject()),
  };
}

async function findFilingById(filingId) {
  const id = ensurePositiveInteger(filingId, 'filingId');
  const record = await FreelancerTaxFiling.findByPk(id);
  if (!record) {
    throw new NotFoundError('Tax document not found.');
  }
  return record;
}

export async function acknowledgeTaxDocument(filingId, { actorId } = {}) {
  const record = await findFilingById(filingId);

  await record.update({
    status: 'submitted',
    submittedAt: new Date(),
    metadata: {
      ...(record.metadata ?? {}),
      acknowledgedById: actorId ?? null,
      acknowledgedAt: new Date().toISOString(),
    },
  });

  return record.toPublicObject();
}

async function resolveOrCreateComplianceDocument(transaction, filing, payload = {}) {
  const metadataSeed = payload.metadata ?? {};
  const finderWhere = {
    ownerId: filing.freelancerId,
    documentType: 'tax',
    storagePath: payload.storagePath ?? null,
  };

  let existing = null;
  if (payload.documentId) {
    existing = await ComplianceDocument.findByPk(payload.documentId, { transaction });
  }

  if (!existing) {
    existing = await ComplianceDocument.findOne({
      where: {
        ownerId: filing.freelancerId,
        documentType: 'tax',
        title: payload.title ?? filing.name,
      },
      transaction,
    });
  }

  if (existing) {
    return existing;
  }

  return ComplianceDocument.create(
    {
      ownerId: filing.freelancerId,
      workspaceId: payload.workspaceId ?? null,
      title: payload.title ?? `${filing.name} (${filing.jurisdiction ?? 'Global'})`,
      documentType: 'tax',
      status: 'active',
      storageProvider: payload.storageProvider ?? 'filesystem',
      storagePath: payload.storagePath,
      storageRegion: payload.storageRegion ?? null,
      jurisdiction: filing.jurisdiction,
      effectiveDate: filing.dueDate,
      tags: ['tax', `tax-year-${filing.metadata?.taxYear ?? ''}`].filter(Boolean),
      metadata: {
        taxFilingId: filing.id,
        taxYear: filing.metadata?.taxYear ?? null,
        ...metadataSeed,
      },
    },
    { transaction },
  );
}

export async function uploadTaxDocument(
  filingId,
  { data, fileName, contentType, actorId, workspaceId, storageProvider, storageRegion, sha256 } = {},
) {
  if (!data) {
    throw new ValidationError('data is required.');
  }
  if (!fileName) {
    throw new ValidationError('fileName is required.');
  }
  if (!contentType) {
    throw new ValidationError('contentType is required.');
  }

  const filing = await findFilingById(filingId);

  return sequelize.transaction(async (transaction) => {
    const stored = await storeTaxDocument({ data, fileName, contentType, actorId });

    const document = await resolveOrCreateComplianceDocument(transaction, filing, {
      title: `${filing.name} ${filing.metadata?.taxYear ? `(${filing.metadata.taxYear})` : ''}`.trim(),
      workspaceId,
      storagePath: stored.key,
      storageProvider: storageProvider ?? 'filesystem',
      storageRegion,
      metadata: {
        sha256: sha256 ?? stored.sha256 ?? null,
        uploadedById: actorId ?? null,
      },
    });

    const nextVersionNumber =
      (await ComplianceDocumentVersion.max('versionNumber', {
        where: { documentId: document.id },
        transaction,
      })) ?? 0;

    const version = await ComplianceDocumentVersion.create(
      {
        documentId: document.id,
        versionNumber: nextVersionNumber + 1,
        fileKey: stored.key,
        fileName,
        mimeType: contentType,
        fileSize: stored.size ?? null,
        sha256: sha256 ?? stored.sha256 ?? null,
        uploadedById: actorId ?? null,
        metadata: {
          storageProvider: storageProvider ?? 'filesystem',
          storageRegion,
        },
      },
      { transaction },
    );

    await document.update(
      {
        latestVersionId: version.id,
        storagePath: stored.key,
        storageProvider: storageProvider ?? 'filesystem',
        storageRegion,
        metadata: {
          ...(document.metadata ?? {}),
          taxFilingId: filing.id,
          taxYear: filing.metadata?.taxYear ?? null,
          lastUploadActorId: actorId ?? null,
          lastUploadAt: new Date().toISOString(),
        },
      },
      { transaction },
    );

    await filing.update(
      {
        metadata: {
          ...(filing.metadata ?? {}),
          documentId: document.id,
          documentVersionId: version.id,
          lastUploadedAt: new Date().toISOString(),
          lastUploadedById: actorId ?? null,
        },
      },
      { transaction },
    );

    return {
      filing: filing.toPublicObject(),
      document: document.toPublicObject(),
      version: version.toPublicObject(),
      storage: stored,
    };
  });
}

export async function downloadTaxDocument(filingId) {
  const filing = await findFilingById(filingId);
  const documentId = filing.metadata?.documentId;
  if (!documentId) {
    throw new NotFoundError('No document upload recorded for this filing.');
  }

  const document = await ComplianceDocument.findByPk(documentId);
  if (!document) {
    throw new NotFoundError('Associated compliance document not found.');
  }

  const versionId = filing.metadata?.documentVersionId ?? document.latestVersionId;
  const version = versionId
    ? await ComplianceDocumentVersion.findByPk(versionId)
    : await ComplianceDocumentVersion.findOne({
        where: { documentId: document.id },
        order: [['versionNumber', 'DESC']],
      });

  if (!version) {
    throw new NotFoundError('Document version not available.');
  }

  const stored = await readTaxDocument(version.fileKey);

  return {
    filing: filing.toPublicObject(),
    document: document.toPublicObject(),
    version: version.toPublicObject(),
    payload: stored,
  };
}

export async function snoozeTaxReminder(reminderId, { days = 7 } = {}) {
  const id = ensurePositiveInteger(reminderId, 'reminderId');
  const reminder = await ComplianceReminder.findByPk(id);
  if (!reminder) {
    throw new NotFoundError('Reminder not found.');
  }

  const increment = Number.isFinite(Number(days)) ? Number(days) : 7;
  const baseDate = reminder.dueAt ? new Date(reminder.dueAt) : new Date();
  baseDate.setDate(baseDate.getDate() + increment);

  await reminder.update({
    dueAt: baseDate,
    status: 'scheduled',
    acknowledgedAt: null,
    metadata: {
      ...(reminder.metadata ?? {}),
      snoozedUntil: baseDate.toISOString(),
      snoozeDays: increment,
    },
  });

  return reminder.toPublicObject();
}

export default {
  listTaxDocuments,
  acknowledgeTaxDocument,
  uploadTaxDocument,
  downloadTaxDocument,
  snoozeTaxReminder,
};
