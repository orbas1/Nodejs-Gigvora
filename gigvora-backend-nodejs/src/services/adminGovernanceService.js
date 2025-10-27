import { Op } from 'sequelize';
import { listContentSubmissions } from './contentGovernanceService.js';
import { listLegalDocuments } from './legalPolicyService.js';
import {
  GovernanceModerationAction,
  GovernanceContentSubmission,
} from '../models/contentGovernanceModels.js';
import {
  LegalDocument,
  LegalDocumentVersion,
  LegalDocumentAuditEvent,
} from '../models/legalDocumentModels.js';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DEFAULT_LOOKBACK_DAYS = 30;
const DEFAULT_QUEUE_LIMIT = 6;
const DEFAULT_PUBLICATION_LIMIT = 6;
const DEFAULT_TIMELINE_LIMIT = 10;

const VERSION_STATUS_ALIASES = {
  draft: 'drafts',
  drafts: 'drafts',
  'in_review': 'inReview',
  'in-review': 'inReview',
  inreview: 'inReview',
  review: 'inReview',
  approved: 'approved',
  approving: 'approved',
  publish: 'published',
  published: 'published',
  active: 'published',
  archived: 'archived',
};

function normaliseVersionStatusKey(status) {
  if (!status) {
    return null;
  }
  const raw = String(status).trim();
  if (!raw) {
    return null;
  }
  const lowered = raw.toLowerCase().replace(/\s+/g, '_');
  return VERSION_STATUS_ALIASES[lowered] ?? VERSION_STATUS_ALIASES[raw] ?? null;
}

function coerceDate(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIso(value) {
  const date = coerceDate(value);
  return date ? date.toISOString() : null;
}

function normaliseSubmission(submission) {
  if (!submission) {
    return null;
  }

  return {
    id: submission.id,
    title: submission.title,
    summary: submission.summary ?? null,
    referenceType: submission.referenceType,
    referenceId: submission.referenceId,
    status: submission.status,
    priority: submission.priority,
    severity: submission.severity,
    assignedTeam: submission.assignedTeam ?? null,
    assignedReviewerId: submission.assignedReviewerId ?? null,
    submittedAt: toIso(submission.submittedAt),
    lastActivityAt: toIso(submission.lastActivityAt),
    region: submission.region ?? null,
    channel: submission.channel ?? null,
  };
}

function buildPolicySummary(documents = []) {
  const totals = {
    totalDocuments: 0,
    activeDocuments: 0,
    draftDocuments: 0,
    archivedDocuments: 0,
  };

  const versionTotals = {
    drafts: 0,
    inReview: 0,
    approved: 0,
    published: 0,
    archived: 0,
  };

  documents.forEach((document) => {
    totals.totalDocuments += 1;
    if (document.status === 'active') {
      totals.activeDocuments += 1;
    } else if (document.status === 'draft') {
      totals.draftDocuments += 1;
    } else if (document.status === 'archived') {
      totals.archivedDocuments += 1;
    }

    if (Array.isArray(document.versions)) {
      document.versions.forEach((version) => {
        const bucket = normaliseVersionStatusKey(version.status);
        if (bucket && versionTotals[bucket] != null) {
          versionTotals[bucket] += 1;
        }
      });
    }
  });

  return { totals, versionTotals };
}

function sortByDateAsc(items, selector) {
  return [...items].sort((a, b) => {
    const aTime = coerceDate(selector(a))?.getTime?.() ?? 0;
    const bTime = coerceDate(selector(b))?.getTime?.() ?? 0;
    return aTime - bTime;
  });
}

function sortByDateDesc(items, selector) {
  return [...items].sort((a, b) => {
    const aTime = coerceDate(selector(a))?.getTime?.() ?? 0;
    const bTime = coerceDate(selector(b))?.getTime?.() ?? 0;
    return bTime - aTime;
  });
}

function buildPolicyHighlights(documents = [], { now, since, upcomingLimit, publicationLimit }) {
  const upcomingEffective = [];
  const recentPublications = [];

  documents.forEach((document) => {
    document.versions?.forEach((version) => {
      const effectiveAt = coerceDate(version.effectiveAt);
      if (effectiveAt) {
        upcomingEffective.push({
          documentId: document.id,
          documentTitle: document.title,
          slug: document.slug,
          versionId: version.id,
          version: version.version,
          locale: version.locale,
          status: version.status,
          effectiveAt: toIso(effectiveAt),
        });
      }

      const publishedAt = coerceDate(version.publishedAt);
      if (publishedAt) {
        recentPublications.push({
          documentId: document.id,
          documentTitle: document.title,
          slug: document.slug,
          versionId: version.id,
          version: version.version,
          locale: version.locale,
          status: version.status,
          publishedAt: toIso(publishedAt),
        });
      }
    });
  });

  const upcoming = sortByDateAsc(upcomingEffective, (item) => item.effectiveAt).slice(0, upcomingLimit);
  const publications = sortByDateDesc(recentPublications, (item) => item.publishedAt).slice(0, publicationLimit);

  return {
    upcomingEffective: upcoming,
    recentPublications: publications,
  };
}

function mapAuditEvent(event) {
  if (!event) {
    return null;
  }
  return {
    id: event.id,
    documentId: event.documentId,
    documentTitle: event.document?.title ?? null,
    versionId: event.versionId ?? null,
    version: event.version?.version ?? null,
    locale: event.version?.locale ?? null,
    action: event.action,
    actorId: event.actorId ?? null,
    actorType: event.actorType ?? 'admin',
    createdAt: toIso(event.createdAt),
    metadata: event.metadata ?? {},
  };
}

function mapModerationAction(action) {
  if (!action) {
    return null;
  }
  return {
    id: action.id,
    submissionId: action.submissionId,
    action: action.action,
    severity: action.severity,
    priority: action.priority ?? null,
    status: action.status ?? null,
    reason: action.reason ?? null,
    resolutionSummary: action.resolutionSummary ?? null,
    createdAt: toIso(action.createdAt),
    actorId: action.actorId ?? null,
    actorType: action.actorType ?? 'admin',
    submission: action.submission ? normaliseSubmission(action.submission) : null,
  };
}

function buildActivityTimeline({ moderationActions = [], auditEvents = [] }) {
  const events = [];

  moderationActions.forEach((action) => {
    const payload = mapModerationAction(action);
    if (!payload) return;

    events.push({
      id: `content-${payload.id}`,
      type: 'content',
      createdAt: payload.createdAt,
      title: `${payload.action.replace(/_/g, ' ')}`,
      severity: payload.severity,
      priority: payload.priority,
      actorId: payload.actorId,
      actorType: payload.actorType,
      reference: payload.submission
        ? {
            submissionId: payload.submission.id,
            title: payload.submission.title,
            status: payload.submission.status,
            priority: payload.submission.priority,
          }
        : null,
      summary: payload.reason ?? payload.resolutionSummary ?? null,
      metadata: {
        status: payload.status,
        severity: payload.severity,
        priority: payload.priority,
      },
    });
  });

  auditEvents.forEach((event) => {
    const payload = mapAuditEvent(event);
    if (!payload) return;

    events.push({
      id: `policy-${payload.id}`,
      type: 'policy',
      createdAt: payload.createdAt,
      title: payload.action.replace(/_/g, ' '),
      actorId: payload.actorId,
      actorType: payload.actorType,
      reference: {
        documentId: payload.documentId,
        documentTitle: payload.documentTitle,
        versionId: payload.versionId,
        version: payload.version,
        locale: payload.locale,
      },
      summary: payload.metadata?.summary ?? null,
      metadata: payload.metadata,
    });
  });

  return sortByDateDesc(events, (event) => event.createdAt);
}

export async function getGovernanceOverview({
  lookbackDays = DEFAULT_LOOKBACK_DAYS,
  queueLimit = DEFAULT_QUEUE_LIMIT,
  publicationLimit = DEFAULT_PUBLICATION_LIMIT,
  timelineLimit = DEFAULT_TIMELINE_LIMIT,
} = {}) {
  const now = new Date();
  const since = new Date(now.getTime() - lookbackDays * DAY_IN_MS);

  const [queueSnapshot, moderationActions, documents, auditEvents] = await Promise.all([
    listContentSubmissions({ page: 1, pageSize: queueLimit }),
    GovernanceModerationAction.findAll({
      where: {
        createdAt: {
          [Op.gte]: since,
        },
      },
      include: [
        {
          model: GovernanceContentSubmission,
          as: 'submission',
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: timelineLimit,
    }),
    listLegalDocuments({ includeVersions: true }),
    LegalDocumentAuditEvent.findAll({
      where: {
        createdAt: {
          [Op.gte]: since,
        },
      },
      include: [
        { model: LegalDocument, as: 'document', required: false },
        { model: LegalDocumentVersion, as: 'version', required: false },
      ],
      order: [['createdAt', 'DESC']],
      limit: timelineLimit,
    }),
  ]);

  const contentQueue = {
    summary: queueSnapshot?.summary ?? { total: 0, awaitingReview: 0, highSeverity: 0, urgent: 0 },
    pagination: queueSnapshot?.pagination ?? null,
    topSubmissions: Array.isArray(queueSnapshot?.items)
      ? queueSnapshot.items.slice(0, queueLimit).map(normaliseSubmission)
      : [],
  };

  const policySummary = buildPolicySummary(documents ?? []);
    const policyHighlights = buildPolicyHighlights(documents ?? [], {
      now,
      since,
      upcomingLimit: publicationLimit,
      publicationLimit,
    });

  const legalPolicies = {
    totals: policySummary.totals,
    versionTotals: policySummary.versionTotals,
    upcomingEffective: policyHighlights.upcomingEffective,
    recentPublications: policyHighlights.recentPublications,
    auditTrail: (auditEvents ?? []).map(mapAuditEvent).filter(Boolean),
  };

  const activity = buildActivityTimeline({ moderationActions, auditEvents });

  return {
    generatedAt: now.toISOString(),
    lookbackDays,
    contentQueue,
    legalPolicies,
    activity,
  };
}

export default {
  getGovernanceOverview,
};
