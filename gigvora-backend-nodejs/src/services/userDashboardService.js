import { Op, fn, col } from 'sequelize';
import {
  Application,
  ApplicationReview,
  ExperienceLaunchpad,
  ExperienceLaunchpadApplication,
  Job,
  Gig,
  GigOrder,
  GigOrderRequirement,
  GigOrderRevision,
  GigOrderEscrowCheckpoint,
  GigVendorScorecard,
  Project,
  ProjectAssignmentEvent,
  ProjectWorkspace,
  ProjectWorkspaceBrief,
  ProjectWorkspaceFile,
  ProjectWorkspaceApproval,
  ProjectWorkspaceConversation,
  ProjectMilestone,
  ProjectCollaborator,
  ProjectTemplate,
  ProjectIntegration,
  ProjectRetrospective,
  Notification,
  SupportCase,
  SupportKnowledgeArticle,
  CareerAnalyticsSnapshot,
  CareerPeerBenchmark,
  WeeklyDigestSubscription,
  CalendarIntegration,
  CandidateCalendarEvent,
  UserCalendarSetting,
  FocusSession,
  AdvisorCollaboration,
  AdvisorCollaborationMember,
  AdvisorCollaborationAuditLog,
  AdvisorDocumentRoom,
  SupportAutomationLog,
  User,
  CareerDocument,
  CareerDocumentVersion,
  CareerDocumentCollaborator,
  CareerDocumentAnalytics,
  CareerDocumentExport,
  CareerStoryBlock,
  CareerBrandAsset,
  EscrowAccount,
  EscrowTransaction,
  DisputeCase,
  SearchSubscription,
} from '../models/index.js';
import {
  ESCROW_ACCOUNT_STATUSES,
  ESCROW_INTEGRATION_PROVIDERS,
  ESCROW_TRANSACTION_STATUSES,
  ESCROW_TRANSACTION_TYPES,
  DISPUTE_STATUSES,
  DISPUTE_PRIORITIES,
} from '../models/constants/index.js';
import profileService from './profileService.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import { ValidationError } from '../utils/errors.js';
import careerPipelineAutomationService from './careerPipelineAutomationService.js';
import { getAdDashboardSnapshot } from './adService.js';
import { initializeWorkspaceForProject, getProjectWorkspaceSummary } from './projectWorkspaceService.js';
import affiliateDashboardService from './affiliateDashboardService.js';
import userDashboardOverviewService from './userDashboardOverviewService.js';
import profileHubService from './profileHubService.js';
import creationStudioService from './creationStudioService.js';
import { getJobApplicationWorkspace as getJobApplicationWorkspaceSnapshot } from './jobApplicationService.js';
import userNetworkingService from './userNetworkingService.js';
import volunteeringManagementService from './volunteeringManagementService.js';
import userMentoringService from './userMentoringService.js';
import walletManagementService from './walletManagementService.js';
import { getUserWebsitePreferences } from './userWebsitePreferenceService.js';
import userDisputeService from './userDisputeService.js';
import eventManagementService from './eventManagementService.js';
import notificationService from './notificationService.js';
import communityManagementService from './communityManagementService.js';

const CACHE_NAMESPACE = 'dashboard:user';
const CACHE_TTL_SECONDS = 60;

const TERMINAL_STATUSES = new Set(['withdrawn', 'rejected', 'hired']);
const OFFER_STATUSES = new Set(['offered', 'hired']);
const INTERVIEW_STATUSES = new Set(['interview']);
const FOLLOW_UP_STATUSES = new Set(['submitted', 'under_review', 'shortlisted', 'interview', 'offered']);
const ESCROW_PENDING_STATUSES = new Set(['initiated', 'funded', 'in_escrow', 'disputed']);
const ESCROW_RELEASED_STATUSES = new Set(['released']);
const ESCROW_REFUND_STATUSES = new Set(['refunded']);

function normalizeUserId(userId) {
  const numeric = Number(userId);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('userId must be a positive integer.');
  }
  return numeric;
}

function toPlainReviewer(instance) {
  if (!instance) return null;
  const reviewer = instance.get?.('reviewer') ?? instance.reviewer;
  if (!reviewer) return null;
  const plain = reviewer.get?.({ plain: true }) ?? reviewer;
  return {
    id: plain.id,
    firstName: plain.firstName,
    lastName: plain.lastName,
    email: plain.email,
  };
}

function differenceInDays(from, to = new Date()) {
  if (!from) return null;
  const start = new Date(from);
  if (Number.isNaN(start.getTime())) {
    return null;
  }
  const end = new Date(to);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function addDays(date, days) {
  const base = new Date(date);
  if (Number.isNaN(base.getTime())) {
    return null;
  }
  const clone = new Date(base);
  clone.setDate(clone.getDate() + days);
  return clone.toISOString();
}

function resolveNextStep(status) {
  switch (status) {
    case 'draft':
      return 'Finalize documents and submit the application.';
    case 'submitted':
      return 'Awaiting review — send a polite nudge if there is no update in 5 days.';
    case 'under_review':
      return 'Prepare recruiter notes and confirm availability for screening.';
    case 'shortlisted':
      return 'Expect interview scheduling — review role research notes.';
    case 'interview':
      return 'Confirm interview logistics and share prep material with collaborators.';
    case 'offered':
      return 'Review compensation details and compare against target ranges.';
    case 'hired':
      return 'Complete onboarding checklist and archive supporting documents.';
    case 'withdrawn':
      return 'Archive the record and capture learnings for future opportunities.';
    case 'rejected':
    default:
      return 'Close out the record and note any feedback for retrospectives.';
  }
}

function sanitizeApplication(application, targetMap) {
  if (!application) return null;
  const base = application.toPublicObject();
  const target = targetMap.get(`${base.targetType}:${base.targetId}`) ?? null;
  const reviews = Array.isArray(application.reviews)
    ? application.reviews.map((review) => ({
        ...review.toPublicObject(),
        reviewer: toPlainReviewer(review),
      }))
    : [];

  const submittedAt = base.submittedAt ?? base.createdAt ?? base.updatedAt;
  const daysSinceUpdate = differenceInDays(base.updatedAt ?? base.createdAt ?? base.submittedAt);

  return {
    ...base,
    target,
    reviews,
    nextStep: resolveNextStep(base.status),
    daysSinceSubmission: submittedAt ? differenceInDays(submittedAt) : null,
    daysSinceUpdate,
  };
}

function sanitizeNotification(notification) {
  const plain = notification.toPublicObject();
  return {
    ...plain,
    isUnread: !plain.readAt,
  };
}

function toPlainTarget(instance) {
  if (!instance) return null;
  if (typeof instance.toPublicObject === 'function') {
    return instance.toPublicObject();
  }
  if (typeof instance.get === 'function') {
    return instance.get({ plain: true });
  }
  return { ...instance };
}

function sanitizeLaunchpadApplication(record) {
  const base = record.toPublicObject();
  const launchpadInstance = record.get?.('launchpad') ?? record.launchpad;
  const launchpad = launchpadInstance?.toPublicObject?.() ?? null;
  return {
    ...base,
    launchpad,
  };
}

function sanitizeProjectEvent(event) {
  const base = event.toPublicObject();
  const projectInstance = event.get?.('project') ?? event.project;
  const project = projectInstance?.toPublicObject?.() ?? null;
  return {
    ...base,
    project,
  };
}

function collectAttachments(applications) {
  const attachments = [];
  applications.forEach((application) => {
    const appPlain = application.toPublicObject();
    if (Array.isArray(appPlain.attachments)) {
      appPlain.attachments.forEach((attachment) => {
        attachments.push({
          ...attachment,
          applicationId: appPlain.id,
          targetType: appPlain.targetType,
          targetId: appPlain.targetId,
          uploadedAt: appPlain.updatedAt,
        });
      });
    }
  });
  return attachments;
}

function sanitizeSearchSubscription(record) {
  if (!record) {
    return null;
  }
  if (typeof record.toPublicObject === 'function') {
    return record.toPublicObject();
  }
  if (typeof record.get === 'function') {
    return record.get({ plain: true });
  }
  return { ...record };
}

function formatCategoryLabel(value) {
  if (!value) return 'Mixed opportunities';
  const normalised = `${value}`.trim().toLowerCase();
  switch (normalised) {
    case 'job':
    case 'jobs':
      return 'Jobs';
    case 'gig':
    case 'gigs':
      return 'Gigs';
    case 'project':
    case 'projects':
      return 'Projects';
    case 'launchpad':
      return 'Experience launchpads';
    case 'volunteering':
      return 'Volunteering';
    case 'people':
      return 'People';
    case 'mixed':
      return 'Mixed opportunities';
    default:
      return normalised.charAt(0).toUpperCase() + normalised.slice(1);
  }
}

function formatFrequencyLabel(value) {
  if (!value) return 'Daily';
  const normalised = `${value}`.trim().toLowerCase();
  switch (normalised) {
    case 'immediate':
      return 'Immediate';
    case 'daily':
      return 'Daily';
    case 'weekly':
      return 'Weekly';
    default:
      return normalised.charAt(0).toUpperCase() + normalised.slice(1);
  }
}

function describeOpportunityCount(count) {
  if (count >= 75) return 'High demand';
  if (count >= 30) return 'Growing momentum';
  if (count > 0) return 'Emerging activity';
  return 'Monitor for changes';
}

function buildSearchStats(savedSearches) {
  const totals = {
    saved: 0,
    withEmailAlerts: 0,
    withInAppAlerts: 0,
    remoteEnabled: 0,
  };
  const categories = new Map();
  const frequencies = new Map();
  const now = new Date();
  const dueSoonThreshold = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  let nextRunAt = null;
  let lastTriggeredAt = null;
  let overdue = 0;
  let dueSoon = 0;

  savedSearches.forEach((search) => {
    totals.saved += 1;
    const categoryKey = (search.category ?? 'mixed').toLowerCase();
    categories.set(categoryKey, (categories.get(categoryKey) ?? 0) + 1);

    const frequencyKey = (search.frequency ?? 'daily').toLowerCase();
    frequencies.set(frequencyKey, (frequencies.get(frequencyKey) ?? 0) + 1);

    if (search.notifyByEmail) {
      totals.withEmailAlerts += 1;
    }
    if (search.notifyInApp) {
      totals.withInAppAlerts += 1;
    }
    if (search.filters?.isRemote === true) {
      totals.remoteEnabled += 1;
    }

    if (search.lastTriggeredAt) {
      const last = new Date(search.lastTriggeredAt);
      if (!Number.isNaN(last.getTime())) {
        if (!lastTriggeredAt || last > lastTriggeredAt) {
          lastTriggeredAt = last;
        }
      }
    } else if (search.updatedAt) {
      const updated = new Date(search.updatedAt);
      if (!Number.isNaN(updated.getTime())) {
        if (!lastTriggeredAt || updated > lastTriggeredAt) {
          lastTriggeredAt = updated;
        }
      }
    }

    if (search.nextRunAt) {
      const next = new Date(search.nextRunAt);
      if (!Number.isNaN(next.getTime())) {
        if (!nextRunAt || next < nextRunAt) {
          nextRunAt = next;
        }
        if (next < now) {
          overdue += 1;
        } else if (next <= dueSoonThreshold) {
          dueSoon += 1;
        }
      }
    }
  });

  const categoryDistribution = Array.from(categories.entries())
    .map(([key, count]) => ({
      key,
      label: formatCategoryLabel(key),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const frequencyDistribution = Array.from(frequencies.entries())
    .map(([key, count]) => ({
      key,
      label: formatFrequencyLabel(key),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totals,
    distribution: {
      categories: categoryDistribution,
      frequencies: frequencyDistribution,
    },
    schedule: {
      nextRunAt: nextRunAt ? nextRunAt.toISOString() : null,
      lastTriggeredAt: lastTriggeredAt ? lastTriggeredAt.toISOString() : null,
      overdue,
      dueSoon,
    },
  };
}

function computeKeywordHighlights(savedSearches, limit = 6) {
  const tokens = new Map();
  savedSearches.forEach((search) => {
    if (!search.query) {
      return;
    }
    const parts = `${search.query}`
      .split(/\s+/)
      .map((part) => part.replace(/[^\w#\+\-]/g, '').toLowerCase())
      .filter((part) => part.length >= 3 && !Number.isFinite(Number(part)));
    parts.forEach((part) => {
      tokens.set(part, (tokens.get(part) ?? 0) + 1);
    });
  });

  return Array.from(tokens.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([keyword, count]) => ({ keyword, count }));
}

function buildUpcomingRuns(savedSearches, limit = 8) {
  const now = new Date();
  return savedSearches
    .map((search) => {
      if (!search.nextRunAt) {
        return null;
      }
      const next = new Date(search.nextRunAt);
      if (Number.isNaN(next.getTime())) {
        return null;
      }
      return {
        id: search.id,
        name: search.name,
        nextRunAt: next.toISOString(),
        frequency: search.frequency ?? 'daily',
        notifyByEmail: Boolean(search.notifyByEmail),
        notifyInApp: Boolean(search.notifyInApp),
        status: next < now ? 'overdue' : 'scheduled',
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.nextRunAt) - new Date(b.nextRunAt))
    .slice(0, limit);
}

function buildSearchMarketIntelligence({ jobCategoryRows = [], jobLocationRows = [], gigCategoryRows = [] }) {
  const categories = jobCategoryRows
    .map((row) => {
      const value = row.employmentType ?? 'mixed';
      const count = Number(row.count ?? 0);
      return {
        id: value,
        label: formatCategoryLabel(value),
        totalRoles: count,
        insight: describeOpportunityCount(count),
      };
    })
    .filter((entry) => entry.totalRoles > 0);

  const locations = jobLocationRows
    .map((row) => {
      const location = row.location ?? 'Flexible / Remote';
      const count = Number(row.count ?? 0);
      return {
        location,
        totalRoles: count,
        insight: describeOpportunityCount(count),
      };
    })
    .filter((entry) => entry.totalRoles > 0);

  const gigCategories = gigCategoryRows
    .map((row) => {
      const value = row.category ?? 'General services';
      const count = Number(row.count ?? 0);
      return {
        id: value,
        label: value.charAt(0).toUpperCase() + value.slice(1),
        totalListings: count,
        insight: describeOpportunityCount(count),
      };
    })
    .filter((entry) => entry.totalListings > 0);

  return {
    categoryHighlights: categories.slice(0, 6),
    locationHighlights: locations.slice(0, 6),
    gigHighlights: gigCategories.slice(0, 6),
  };
}

async function loadTopSearchModule(userId) {
  const subscriptionRecords = await SearchSubscription.findAll({
    where: { userId },
    order: [
      ['updatedAt', 'DESC'],
      ['id', 'DESC'],
    ],
    limit: 50,
  });

  const savedSearches = subscriptionRecords
    .map((subscription) => sanitizeSearchSubscription(subscription))
    .filter(Boolean);

  const [jobCategoryRows, jobLocationRows, gigCategoryRows] = await Promise.all([
    Job.findAll({
      attributes: ['employmentType', [fn('COUNT', col('id')), 'count']],
      group: ['employmentType'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      limit: 8,
      raw: true,
    }),
    Job.findAll({
      attributes: ['location', [fn('COUNT', col('id')), 'count']],
      where: { location: { [Op.ne]: null } },
      group: ['location'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      limit: 8,
      raw: true,
    }),
    Gig.findAll({
      attributes: ['category', [fn('COUNT', col('id')), 'count']],
      where: { status: { [Op.ne]: 'draft' } },
      group: ['category'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      limit: 8,
      raw: true,
    }),
  ]);

  const stats = buildSearchStats(savedSearches);
  const keywordHighlights = computeKeywordHighlights(savedSearches);
  const upcomingRuns = buildUpcomingRuns(savedSearches);
  const marketIntelligence = buildSearchMarketIntelligence({
    jobCategoryRows,
    jobLocationRows,
    gigCategoryRows,
  });

  return {
    savedSearches,
    stats: {
      ...stats,
      keywordHighlights,
    },
    upcomingRuns,
    recommendations: marketIntelligence,
    permissions: {
      canCreate: true,
      canUpdate: true,
      canDelete: true,
      canRun: true,
    },
    actions: {
      openExplorer: '/search',
    },
  };
}

function toPlainUser(instance) {
  if (!instance) return null;
  const plain = instance.get?.({ plain: true }) ?? instance;
  const name = [plain.firstName, plain.lastName].filter(Boolean).join(' ').trim();
  return {
    id: plain.id,
    firstName: plain.firstName,
    lastName: plain.lastName,
    email: plain.email,
    name: name || plain.email || null,
  };
}

function sanitizeDocumentVersion(versionInstance) {
  if (!versionInstance) return null;
  const base = versionInstance.toPublicObject();
  const createdBy = toPlainUser(versionInstance.get?.('createdBy') ?? versionInstance.createdBy);
  const approvedBy = toPlainUser(versionInstance.get?.('approvedBy') ?? versionInstance.approvedBy);
  return {
    ...base,
    metrics: base.metrics ?? {},
    diffHighlights: base.diffHighlights ?? [],
    createdBy,
    approvedBy,
  };
}

function sanitizeDocumentCollaborator(collaboratorInstance) {
  if (!collaboratorInstance) return null;
  const base = collaboratorInstance.toPublicObject();
  const collaborator = toPlainUser(collaboratorInstance.get?.('collaborator') ?? collaboratorInstance.collaborator);
  return {
    ...base,
    collaborator,
  };
}

function sanitizeDocumentExport(exportInstance) {
  if (!exportInstance) return null;
  const base = exportInstance.toPublicObject();
  const exportedBy = toPlainUser(exportInstance.get?.('exportedBy') ?? exportInstance.exportedBy);
  return {
    ...base,
    metadata: base.metadata ?? {},
    exportedBy,
  };
}

function sanitizeDocumentAnalytics(analyticsInstance) {
  if (!analyticsInstance) return null;
  const base = analyticsInstance.toPublicObject();
  const viewer = toPlainUser(analyticsInstance.get?.('viewer') ?? analyticsInstance.viewer);
  return {
    ...base,
    outcomes: base.outcomes ?? {},
    viewer,
  };
}

function sanitizeCareerDocument(documentInstance) {
  if (!documentInstance) return null;
  const base = documentInstance.toPublicObject();
  const versionsRaw = Array.isArray(documentInstance.get?.('versions'))
    ? documentInstance.get('versions')
    : documentInstance.versions;
  const versions = Array.isArray(versionsRaw)
    ? versionsRaw.map((version) => sanitizeDocumentVersion(version)).sort((a, b) => b.versionNumber - a.versionNumber)
    : [];
  const collaboratorsRaw = Array.isArray(documentInstance.get?.('collaborators'))
    ? documentInstance.get('collaborators')
    : documentInstance.collaborators;
  const collaborators = Array.isArray(collaboratorsRaw)
    ? collaboratorsRaw.map((collaborator) => sanitizeDocumentCollaborator(collaborator))
    : [];
  const exportsRaw = Array.isArray(documentInstance.get?.('exports'))
    ? documentInstance.get('exports')
    : documentInstance.exports;
  const exports = Array.isArray(exportsRaw)
    ? exportsRaw
        .map((record) => sanitizeDocumentExport(record))
        .sort((a, b) => {
          const first = a.exportedAt ? new Date(a.exportedAt).getTime() : 0;
          const second = b.exportedAt ? new Date(b.exportedAt).getTime() : 0;
          return second - first;
        })
    : [];
  const analyticsRaw = Array.isArray(documentInstance.get?.('analytics'))
    ? documentInstance.get('analytics')
    : documentInstance.analytics;
  const analytics = Array.isArray(analyticsRaw)
    ? analyticsRaw
        .map((record) => sanitizeDocumentAnalytics(record))
        .sort((a, b) => {
          const first = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const second = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return second - first;
        })
    : [];

  const latestVersion = versions[0] ?? null;
  const diffHighlights = latestVersion?.diffHighlights;
  const trackedEditCount = Array.isArray(diffHighlights)
    ? diffHighlights.length
    : diffHighlights && typeof diffHighlights === 'object'
      ? Object.keys(diffHighlights).length
      : 0;
  const annotationCount = (() => {
    if (!latestVersion?.metrics) return 0;
    if (Array.isArray(latestVersion.metrics.annotations)) {
      return latestVersion.metrics.annotations.length;
    }
    if (Array.isArray(latestVersion.metrics.recruiterAnnotations)) {
      return latestVersion.metrics.recruiterAnnotations.length;
    }
    return Number(latestVersion.metrics.annotationCount ?? 0);
  })();

  return {
    ...base,
    tags: Array.isArray(base.tags)
      ? base.tags
      : base.tags && typeof base.tags === 'object'
        ? base.tags
        : [],
    metadata: base.metadata ?? {},
    versions,
    collaborators,
    exports,
    analytics,
    latestVersion,
    annotationCount,
    trackedEditCount,
    aiCopyScore: latestVersion?.metrics?.aiCopyScore ?? null,
    toneScore: latestVersion?.metrics?.toneScore ?? null,
  };
}

function sanitizeStoryBlock(blockInstance) {
  if (!blockInstance) return null;
  const base = blockInstance.toPublicObject?.() ?? blockInstance.get?.({ plain: true }) ?? blockInstance;
  return {
    ...base,
    metrics: base.metrics ?? {},
  };
}

function sanitizeBrandAsset(assetInstance) {
  if (!assetInstance) return null;
  const base = assetInstance.toPublicObject?.() ?? assetInstance.get?.({ plain: true }) ?? assetInstance;
  return {
    ...base,
    tags: Array.isArray(base.tags)
      ? base.tags
      : base.tags && typeof base.tags === 'object'
        ? base.tags
        : [],
    metrics: base.metrics ?? {},
    metadata: base.metadata ?? {},
  };
}

function sanitizeGigOrderForDocument(orderInstance) {
  if (!orderInstance) return null;
  const base =
    orderInstance.toPublicObject?.() ?? orderInstance.get?.({ plain: true }) ?? { ...orderInstance };
  const gigInstance = orderInstance.get?.('gig') ?? orderInstance.gig ?? base.gig;
  const requirementsRaw =
    orderInstance.get?.('requirements') ?? orderInstance.requirements ?? base.requirements ?? [];
  const revisionsRaw = orderInstance.get?.('revisions') ?? orderInstance.revisions ?? base.revisions ?? [];
  const requirements = Array.isArray(requirementsRaw)
    ? requirementsRaw.map((req) => req.toPublicObject?.() ?? req.get?.({ plain: true }) ?? req)
    : [];
  const revisions = Array.isArray(revisionsRaw)
    ? revisionsRaw.map((revision) => revision.toPublicObject?.() ?? revision.get?.({ plain: true }) ?? revision)
    : [];
  const escrowRaw =
    orderInstance.get?.('escrowCheckpoints') ??
    orderInstance.escrowCheckpoints ??
    base.escrowCheckpoints ??
    [];
  const escrowCheckpoints = Array.isArray(escrowRaw)
    ? escrowRaw.map((checkpoint) => checkpoint.toPublicObject?.() ?? checkpoint.get?.({ plain: true }) ?? checkpoint)
    : [];
  const scorecardsRaw =
    orderInstance.get?.('vendorScorecards') ??
    orderInstance.vendorScorecards ??
    base.vendorScorecards ??
    [];
  const vendorScorecards = Array.isArray(scorecardsRaw)
    ? scorecardsRaw.map((scorecard) => {
        const baseScorecard = scorecard.toPublicObject?.() ?? scorecard.get?.({ plain: true }) ?? scorecard;
        const vendor = scorecard.get?.('vendor') ?? scorecard.vendor ?? baseScorecard.vendor;
        const reviewedBy = scorecard.get?.('reviewedBy') ?? scorecard.reviewedBy ?? baseScorecard.reviewedBy;
        return {
          ...baseScorecard,
          vendor: toPlainUser(vendor),
          reviewedBy: toPlainUser(reviewedBy),
        };
      })
    : [];
  const outstandingRequirements = requirements.filter((item) => item.status === 'pending').length;
  const activeRevisions = revisions.filter((item) => ['requested', 'in_progress', 'submitted'].includes(item.status)).length;
  const nextRequirementDue = requirements
    .filter((item) => item.status === 'pending' && item.dueAt)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())[0] || null;
  const escrowPendingAmount = escrowCheckpoints
    .filter((checkpoint) => checkpoint.status !== 'released')
    .reduce((sum, checkpoint) => sum + Number(checkpoint.amount ?? 0), 0);
  const nextEscrowRelease = escrowCheckpoints
    .filter((checkpoint) => checkpoint.status !== 'released' && checkpoint.releasedAt)
    .sort((a, b) => new Date(a.releasedAt).getTime() - new Date(b.releasedAt).getTime())[0] || null;
  return {
    ...base,
    gig: gigInstance?.toPublicObject?.() ?? gigInstance ?? null,
    requirements,
    revisions,
    outstandingRequirements,
    activeRevisions,
    nextRequirementDueAt: nextRequirementDue?.dueAt ?? null,
    escrowCheckpoints,
    vendorScorecards,
    escrowPendingAmount,
    nextEscrowReleaseAt: nextEscrowRelease?.releasedAt ?? null,
  };
}

function normaliseMoney(value) {
  const numeric = Number.parseFloat(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Number.parseFloat(numeric.toFixed(2));
}

function sanitizeEscrowTransaction(transactionInstance) {
  if (!transactionInstance) return null;
  const base =
    transactionInstance.toPublicObject?.() ??
    transactionInstance.get?.({ plain: true }) ??
    { ...transactionInstance };
  const accountInstance =
    transactionInstance.get?.('account') ?? transactionInstance.account ?? base.account ?? null;
  const initiatorInstance =
    transactionInstance.get?.('initiator') ?? transactionInstance.initiator ?? null;
  const counterpartyInstance =
    transactionInstance.get?.('counterparty') ?? transactionInstance.counterparty ?? null;

  return {
    ...base,
    amount: normaliseMoney(base.amount),
    feeAmount: normaliseMoney(base.feeAmount ?? 0),
    netAmount: normaliseMoney(base.netAmount ?? base.amount ?? 0),
    currencyCode: base.currencyCode ?? accountInstance?.currencyCode ?? 'USD',
    createdAt: base.createdAt ?? transactionInstance.createdAt ?? null,
    updatedAt: base.updatedAt ?? transactionInstance.updatedAt ?? null,
    accountId: base.accountId ?? accountInstance?.id ?? null,
    account: accountInstance?.toPublicObject?.() ?? accountInstance ?? null,
    initiator: toPlainUser(initiatorInstance),
    counterparty: toPlainUser(counterpartyInstance),
    milestoneLabel: base.milestoneLabel ?? null,
    scheduledReleaseAt: base.scheduledReleaseAt ?? null,
    releasedAt: base.releasedAt ?? null,
    refundedAt: base.refundedAt ?? null,
    disputes: [],
    hasOpenDispute: false,
    hasAuditTrail: Array.isArray(base.auditTrail) ? base.auditTrail.length > 0 : false,
  };
}

function sanitizeEscrowAccount(accountInstance, transactionsByAccount) {
  if (!accountInstance) return null;
  const base =
    accountInstance.toPublicObject?.() ?? accountInstance.get?.({ plain: true }) ?? { ...accountInstance };
  const transactions = transactionsByAccount.get(base.id) ?? [];

  const stats = transactions.reduce(
    (accumulator, transaction) => {
      const amount = normaliseMoney(transaction.amount);
      if (ESCROW_PENDING_STATUSES.has(transaction.status)) {
        accumulator.inEscrow += amount;
      }
      if (ESCROW_RELEASED_STATUSES.has(transaction.status)) {
        accumulator.released += amount;
      }
      if (ESCROW_REFUND_STATUSES.has(transaction.status)) {
        accumulator.refunded += amount;
      }
      if (transaction.hasOpenDispute) {
        accumulator.disputed += amount;
      }
      return accumulator;
    },
    { inEscrow: 0, released: 0, refunded: 0, disputed: 0 },
  );

  const nextRelease = transactions
    .filter((transaction) => ESCROW_PENDING_STATUSES.has(transaction.status) && transaction.scheduledReleaseAt)
    .sort((a, b) => {
      const aTime = new Date(a.scheduledReleaseAt).getTime();
      const bTime = new Date(b.scheduledReleaseAt).getTime();
      return aTime - bTime;
    })[0];

  return {
    ...base,
    currentBalance: normaliseMoney(base.currentBalance ?? 0),
    pendingReleaseTotal: normaliseMoney(base.pendingReleaseTotal ?? 0),
    totals: {
      transactions: transactions.length,
      inEscrow: Number.parseFloat(stats.inEscrow.toFixed(2)),
      released: Number.parseFloat(stats.released.toFixed(2)),
      refunded: Number.parseFloat(stats.refunded.toFixed(2)),
      disputed: Number.parseFloat(stats.disputed.toFixed(2)),
    },
    nextReleaseAt: nextRelease?.scheduledReleaseAt ?? null,
    recentTransactions: transactions.slice(0, 5).map((transaction) => ({
      id: transaction.id,
      reference: transaction.reference,
      status: transaction.status,
      amount: transaction.amount,
      scheduledReleaseAt: transaction.scheduledReleaseAt,
      createdAt: transaction.createdAt,
    })),
  };
}

function sanitizeDisputeCase(disputeInstance) {
  if (!disputeInstance) return null;
  const base =
    disputeInstance.toPublicObject?.() ?? disputeInstance.get?.({ plain: true }) ?? { ...disputeInstance };
  const transactionInstance =
    disputeInstance.get?.('transaction') ?? disputeInstance.transaction ?? base.transaction ?? null;
  const accountInstance = transactionInstance?.get?.('account') ?? transactionInstance?.account ?? null;

  return {
    ...base,
    openedBy: toPlainUser(disputeInstance.get?.('openedBy') ?? disputeInstance.openedBy),
    assignedTo: toPlainUser(disputeInstance.get?.('assignedTo') ?? disputeInstance.assignedTo),
    transaction: transactionInstance
      ? {
          id: transactionInstance.id,
          reference: transactionInstance.reference,
          status: transactionInstance.status,
          amount: normaliseMoney(transactionInstance.amount ?? 0),
          scheduledReleaseAt: transactionInstance.scheduledReleaseAt ?? null,
          accountId: transactionInstance.accountId ?? accountInstance?.id ?? null,
          account: accountInstance?.toPublicObject?.() ?? accountInstance ?? null,
        }
      : null,
  };
}

function buildEscrowManagementSection({
  accounts = [],
  transactions = [],
  disputes = [],
  defaultCurrency = 'USD',
}) {
  const sanitizedTransactions = transactions
    .map((transaction) => sanitizeEscrowTransaction(transaction))
    .filter(Boolean)
    .sort((a, b) => {
      const aTime = new Date(a.createdAt ?? 0).getTime();
      const bTime = new Date(b.createdAt ?? 0).getTime();
      return bTime - aTime;
    });

  const transactionsByAccount = new Map();
  sanitizedTransactions.forEach((transaction) => {
    const existing = transactionsByAccount.get(transaction.accountId) ?? [];
    existing.push(transaction);
    transactionsByAccount.set(transaction.accountId, existing);
  });

  const sanitizedDisputes = disputes.map((dispute) => sanitizeDisputeCase(dispute)).filter(Boolean);
  sanitizedDisputes.sort((a, b) => {
    const aTime = new Date(a.openedAt ?? 0).getTime();
    const bTime = new Date(b.openedAt ?? 0).getTime();
    return bTime - aTime;
  });

  const disputesByTransaction = new Map();
  sanitizedDisputes.forEach((dispute) => {
    const transactionId = dispute.transaction?.id;
    if (!transactionId) {
      return;
    }
    const existing = disputesByTransaction.get(transactionId) ?? [];
    existing.push(dispute);
    disputesByTransaction.set(transactionId, existing);
  });

  const closedDisputeStatuses = new Set(['settled', 'closed']);

  sanitizedTransactions.forEach((transaction) => {
    const relatedDisputes = disputesByTransaction.get(transaction.id) ?? [];
    transaction.disputes = relatedDisputes;
    transaction.hasOpenDispute = relatedDisputes.some((dispute) => !closedDisputeStatuses.has(dispute.status));
  });

  sanitizedTransactions.forEach((transaction) => {
    const accountTransactions = transactionsByAccount.get(transaction.accountId);
    if (accountTransactions) {
      accountTransactions.sort((a, b) => {
        const aTime = new Date(a.createdAt ?? 0).getTime();
        const bTime = new Date(b.createdAt ?? 0).getTime();
        return bTime - aTime;
      });
    }
  });

  const sanitizedAccounts = accounts
    .map((account) => sanitizeEscrowAccount(account, transactionsByAccount))
    .filter(Boolean);

  const totals = sanitizedTransactions.reduce(
    (accumulator, transaction) => {
      const amount = normaliseMoney(transaction.amount);
      accumulator.total += amount;
      if (ESCROW_PENDING_STATUSES.has(transaction.status)) {
        accumulator.inEscrow += amount;
      }
      if (ESCROW_RELEASED_STATUSES.has(transaction.status)) {
        accumulator.released += amount;
      }
      if (ESCROW_REFUND_STATUSES.has(transaction.status)) {
        accumulator.refunded += amount;
      }
      if (transaction.hasOpenDispute) {
        accumulator.disputed += amount;
      }
      return accumulator;
    },
    { total: 0, inEscrow: 0, released: 0, refunded: 0, disputed: 0 },
  );

  const releaseQueue = sanitizedTransactions
    .filter((transaction) => ESCROW_PENDING_STATUSES.has(transaction.status))
    .sort((a, b) => {
      const aReference = a.scheduledReleaseAt ?? a.createdAt ?? null;
      const bReference = b.scheduledReleaseAt ?? b.createdAt ?? null;
      return new Date(aReference ?? 0).getTime() - new Date(bReference ?? 0).getTime();
    })
    .slice(0, 20);

  const openDisputes = sanitizedDisputes.filter((dispute) => !closedDisputeStatuses.has(dispute.status));

  const netBalance = sanitizedAccounts.reduce(
    (sum, account) => sum + normaliseMoney(account.currentBalance ?? 0),
    0,
  );

  return {
    access: {
      canManage: true,
      allowedRoles: ['Client admin', 'Finance operator', 'Platform admin'],
    },
    summary: {
      totalAccounts: sanitizedAccounts.length,
      totalTransactions: sanitizedTransactions.length,
      currency: defaultCurrency,
      grossVolume: Number.parseFloat(totals.total.toFixed(2)),
      inEscrow: Number.parseFloat(totals.inEscrow.toFixed(2)),
      released: Number.parseFloat(totals.released.toFixed(2)),
      refunded: Number.parseFloat(totals.refunded.toFixed(2)),
      disputed: Number.parseFloat(totals.disputed.toFixed(2)),
      netBalance: Number.parseFloat(netBalance.toFixed(2)),
      upcomingRelease: releaseQueue[0]
        ? {
            transactionId: releaseQueue[0].id,
            amount: releaseQueue[0].amount,
            scheduledAt: releaseQueue[0].scheduledReleaseAt ?? releaseQueue[0].createdAt,
          }
        : null,
      releaseQueueSize: releaseQueue.length,
      disputeCount: openDisputes.length,
      openMilestones: releaseQueue.length,
    },
    accounts: sanitizedAccounts,
    transactions: {
      recent: sanitizedTransactions.slice(0, 25),
      releaseQueue,
      disputes: openDisputes,
    },
    permissions: {
      canCreateAccount: true,
      canUpdateAccount: true,
      canInitiateTransaction: true,
      canUpdateTransaction: true,
      canRelease: true,
      canRefund: true,
    },
    forms: {
      defaultCurrency,
      providers: ESCROW_INTEGRATION_PROVIDERS,
      accountStatuses: ESCROW_ACCOUNT_STATUSES,
      transactionStatuses: ESCROW_TRANSACTION_STATUSES,
      transactionTypes: ESCROW_TRANSACTION_TYPES,
      disputeStatuses: DISPUTE_STATUSES,
      disputePriorities: DISPUTE_PRIORITIES,
    },
    integrations: {
      trustCenterHref: '/trust-center',
      financeHubHref: '/finance-hub',
    },
  };
}

function buildFinanceSnapshot(walletOverview) {
  if (!walletOverview) {
    return {
      totalBalance: 0,
      availableBalance: 0,
      pendingBalance: 0,
      primaryCurrency: 'USD',
      defaultCurrency: 'USD',
      currencies: [],
      supportedCurrencies: [],
      wallets: { accounts: [], items: [], totals: {} },
    };
  }

  const summary = walletOverview.summary ?? {};
  const accounts = Array.isArray(walletOverview.accounts) ? walletOverview.accounts : [];
  const currencySet = new Set();
  if (summary.currency) {
    currencySet.add(summary.currency);
  }
  accounts.forEach((account) => {
    if (account?.currencyCode) {
      currencySet.add(account.currencyCode);
    } else if (account?.currency) {
      currencySet.add(account.currency);
    }
  });

  const currencies = Array.from(currencySet);
  const primaryCurrency = summary.currency ?? currencies[0] ?? 'USD';

  const totals = {
    balance: normaliseMoney(summary.totalBalance ?? 0),
    available: normaliseMoney(summary.availableBalance ?? summary.totalBalance ?? 0),
    pending: normaliseMoney(summary.pendingHoldBalance ?? 0),
    currency: primaryCurrency,
    weeklyChange: null,
    delta: null,
    lastReconciledAt: summary.lastReconciledAt ?? null,
    pendingTransferCount: summary.pendingTransferCount ?? 0,
    nextScheduledTransferAt: summary.nextScheduledTransferAt ?? null,
  };

  return {
    ...walletOverview,
    totalBalance: totals.balance,
    availableBalance: totals.available,
    pendingBalance: totals.pending,
    primaryCurrency,
    defaultCurrency: primaryCurrency,
    currencies,
    supportedCurrencies: currencies,
    wallets: {
      accounts,
      items: accounts,
      totals,
      currencies,
      compliance: walletOverview.compliance ?? null,
      transfers: walletOverview.transfers ?? null,
    },
  };
}

function computeTagCounts(items) {
  const map = new Map();
  items.forEach((key) => {
    const normalized = key && typeof key === 'string' ? key : 'Unassigned';
    map.set(normalized, (map.get(normalized) ?? 0) + 1);
  });
  return Array.from(map.entries()).map(([label, count]) => ({ label, count }));
}

function computeExportMix(documents) {
  const counts = new Map();
  documents.forEach((doc) => {
    doc.exports.forEach((record) => {
      counts.set(record.format, (counts.get(record.format) ?? 0) + 1);
    });
  });
  return Array.from(counts.entries()).map(([format, count]) => ({ format, count }));
}

function buildDocumentAnalytics(documents) {
  const analyticsRecords = documents.flatMap((doc) =>
    (doc.analytics ?? []).map((entry) => ({
      ...entry,
      documentId: doc.id,
      documentTitle: doc.title,
      documentType: doc.documentType,
      roleTag: doc.roleTag,
      geographyTag: entry.geographyTag || doc.geographyTag || doc.metadata?.geographyTag || null,
    })),
  );

  const totals = analyticsRecords.reduce(
    (accumulator, record) => {
      const interviews = Number(record.outcomes?.interviews ?? 0);
      const offers = Number(record.outcomes?.offers ?? 0);
      accumulator.opens += Number(record.opens ?? 0);
      accumulator.downloads += Number(record.downloads ?? 0);
      accumulator.shares += Number(record.shares ?? 0);
      accumulator.interviews += interviews;
      accumulator.offers += offers;
      return accumulator;
    },
    { opens: 0, downloads: 0, shares: 0, interviews: 0, offers: 0 },
  );

  const performanceMap = new Map();
  analyticsRecords.forEach((record) => {
    const current = performanceMap.get(record.documentId) ?? {
      documentId: record.documentId,
      title: record.documentTitle,
      documentType: record.documentType,
      opens: 0,
      downloads: 0,
      interviews: 0,
      offers: 0,
      lastInteractionAt: null,
    };
    current.opens += Number(record.opens ?? 0);
    current.downloads += Number(record.downloads ?? 0);
    current.interviews += Number(record.outcomes?.interviews ?? 0);
    current.offers += Number(record.outcomes?.offers ?? 0);
    const interactionTimestamp = Math.max(
      record.lastOpenedAt ? new Date(record.lastOpenedAt).getTime() : 0,
      record.lastDownloadedAt ? new Date(record.lastDownloadedAt).getTime() : 0,
      current.lastInteractionAt ? new Date(current.lastInteractionAt).getTime() : 0,
    );
    current.lastInteractionAt = interactionTimestamp
      ? new Date(interactionTimestamp).toISOString()
      : current.lastInteractionAt;
    performanceMap.set(record.documentId, current);
  });

  const topPerformers = Array.from(performanceMap.values())
    .map((item) => ({
      ...item,
      conversionRate:
        item.opens > 0
          ? Number(((item.interviews / item.opens) * 100).toFixed(1))
          : item.interviews > 0
            ? 100
            : 0,
    }))
    .sort((a, b) => {
      if (b.conversionRate !== a.conversionRate) {
        return b.conversionRate - a.conversionRate;
      }
      return b.opens - a.opens;
    })
    .slice(0, 3);

  const aggregateByKey = (records, key, fallbackLabel) => {
    const map = new Map();
    records.forEach((record) => {
      const label = record[key] || fallbackLabel;
      const entry = map.get(label) ?? { label, opens: 0, downloads: 0, interviews: 0, offers: 0 };
      entry.opens += Number(record.opens ?? 0);
      entry.downloads += Number(record.downloads ?? 0);
      entry.interviews += Number(record.outcomes?.interviews ?? 0);
      entry.offers += Number(record.outcomes?.offers ?? 0);
      map.set(label, entry);
    });
    return Array.from(map.values()).map((entry) => ({
      ...entry,
      conversionRate: entry.opens > 0 ? Number(((entry.interviews / entry.opens) * 100).toFixed(1)) : 0,
    }));
  };

  return {
    records: analyticsRecords,
    totals,
    topPerformers,
    byGeography: aggregateByKey(analyticsRecords, 'geographyTag', 'Unspecified'),
    bySeniority: aggregateByKey(analyticsRecords, 'seniorityTag', 'All levels'),
  };
}

function buildDocumentStudio(documents, storyBlocks, brandAssets, gigOrders) {
  const cvDocuments = documents.filter((doc) => doc.documentType === 'cv');
  const coverLetters = documents.filter((doc) => doc.documentType === 'cover_letter');
  const portfolioDocuments = documents.filter((doc) => doc.documentType === 'portfolio');
  const libraryDocuments = documents.filter((doc) => doc.documentType !== 'story_block');

  const totalVersions = documents.reduce((accumulator, doc) => accumulator + (doc.versions?.length ?? 0), 0);
  const lastUpdatedAt = documents.reduce((latest, doc) => {
    const timestamp = doc.updatedAt ? new Date(doc.updatedAt).getTime() : 0;
    return timestamp > latest ? timestamp : latest;
  }, 0);

  const baseline = cvDocuments.find((doc) => doc.metadata?.isBaseline) || cvDocuments[0] || null;
  const variants = cvDocuments
    .filter((doc) => !baseline || doc.id !== baseline.id)
    .map((doc) => ({
      id: doc.id,
      title: doc.title,
      roleTag: doc.roleTag,
      geographyTag: doc.geographyTag,
      status: doc.status,
      approvalStatus: doc.latestVersion?.approvalStatus ?? doc.status,
      annotationCount: doc.annotationCount,
      trackedEditCount: doc.trackedEditCount,
      aiCopyScore: doc.aiCopyScore,
      toneScore: doc.toneScore,
      collaborators: doc.collaborators,
      latestVersion: doc.latestVersion,
      exports: doc.exports.slice(0, 3),
      shareUrl: doc.shareUrl,
      updatedAt: doc.updatedAt,
      tags: doc.tags,
    }));

  const tagBreakdown = {
    roles: computeTagCounts(cvDocuments.map((doc) => doc.roleTag || 'Generalist profile')),
    geography: computeTagCounts(cvDocuments.map((doc) => doc.geographyTag || 'Global')),
  };

  const exportMix = computeExportMix(cvDocuments);

  const coverLetterTemplates = coverLetters.map((doc) => ({
    id: doc.id,
    title: doc.title,
    status: doc.status,
    approvalStatus: doc.latestVersion?.approvalStatus ?? doc.status,
    toneScore: doc.latestVersion?.metrics?.toneScore ?? null,
    qualityScore: doc.latestVersion?.metrics?.qualityScore ?? null,
    aiSummary: doc.latestVersion?.aiSummary ?? doc.latestVersion?.summary ?? null,
    collaboratorCount: doc.collaborators.length,
    storyBlocksUsed: Array.isArray(doc.latestVersion?.metrics?.storyBlocksUsed)
      ? doc.latestVersion.metrics.storyBlocksUsed
      : [],
    lastUpdatedAt: doc.updatedAt,
  }));

  const toneScores = coverLetterTemplates
    .map((template) => Number(template.toneScore))
    .filter((value) => Number.isFinite(value));
  const toneSummary = toneScores.length
    ? {
        average: Number((toneScores.reduce((sum, value) => sum + value, 0) / toneScores.length).toFixed(2)),
        samples: toneScores.length,
      }
    : { average: null, samples: 0 };

  const analytics = buildDocumentAnalytics(documents);

  const recentExports = documents
    .flatMap((doc) =>
      doc.exports.map((record) => ({
        ...record,
        documentId: doc.id,
        documentTitle: doc.title,
        documentType: doc.documentType,
      })),
    )
    .sort((a, b) => {
      const first = a.exportedAt ? new Date(a.exportedAt).getTime() : 0;
      const second = b.exportedAt ? new Date(b.exportedAt).getTime() : 0;
      return second - first;
    })
    .slice(0, 6);

  const sanitizedStoryBlocks = storyBlocks.map((block) => sanitizeStoryBlock(block)).filter(Boolean);
  const sanitizedBrandAssets = brandAssets.map((asset) => sanitizeBrandAsset(asset)).filter(Boolean);
  const sanitizedOrders = gigOrders.map((order) => sanitizeGigOrderForDocument(order)).filter(Boolean);

  const averageProgress = sanitizedOrders.length
    ? Math.round(
        sanitizedOrders.reduce((sum, order) => sum + Number(order.progressPercent ?? 0), 0) / sanitizedOrders.length,
      )
    : 0;

  const purchasedGigSummary = {
    stats: {
      total: sanitizedOrders.length,
      active: sanitizedOrders.filter((order) => !['completed', 'cancelled'].includes(order.status)).length,
      pendingRequirements: sanitizedOrders.reduce(
        (sum, order) => sum + Number(order.outstandingRequirements ?? 0),
        0,
      ),
      pendingRevisions: sanitizedOrders.reduce((sum, order) => sum + Number(order.activeRevisions ?? 0), 0),
      averageProgress,
    },
    orders: sanitizedOrders
      .slice()
      .sort((a, b) => {
        const first = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
        const second = b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY;
        return first - second;
      })
      .slice(0, 4),
    upcomingDeliverables: sanitizedOrders
      .map((order) => ({
        orderId: order.id,
        orderNumber: order.orderNumber,
        gig: order.gig,
        dueAt: order.nextRequirementDueAt || order.dueAt || order.kickoffDueAt,
        status: order.status,
        outstandingRequirements: order.outstandingRequirements,
      }))
      .filter((entry) => entry.dueAt)
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
      .slice(0, 5),
  };

  const brandHub = {
    assets: sanitizedBrandAssets,
    featuredBanner:
      sanitizedBrandAssets.find((asset) => asset.assetType === 'banner' && asset.status === 'published') ?? null,
    testimonials: sanitizedBrandAssets.filter((asset) => asset.assetType === 'testimonial' && asset.status === 'published'),
    caseStudies: sanitizedBrandAssets.filter((asset) => asset.assetType === 'case_study'),
    videoSpotlight: sanitizedBrandAssets.find((asset) => asset.assetType === 'video'),
    pressFeatures: sanitizedBrandAssets.filter((asset) => asset.assetType === 'press'),
    portfolioProjects: portfolioDocuments.map((doc) => ({
      id: doc.id,
      title: doc.title,
      summary: doc.latestVersion?.summary ?? null,
      status: doc.status,
      shareUrl: doc.shareUrl,
      updatedAt: doc.updatedAt,
    })),
  };

  return {
    summary: {
      totalDocuments: libraryDocuments.length,
      cvCount: cvDocuments.length,
      coverLetterCount: coverLetters.length,
      portfolioCount: portfolioDocuments.length,
      brandAssetCount: sanitizedBrandAssets.length,
      storyBlockCount: sanitizedStoryBlocks.length,
      totalVersions,
      aiAssistedCount: documents.filter((doc) => doc.aiAssisted).length,
      lastUpdatedAt: lastUpdatedAt ? new Date(lastUpdatedAt).toISOString() : null,
    },
    cvStudio: {
      baseline,
      variants,
      tagBreakdown,
      exportMix,
      storage: {
        totalDocuments: cvDocuments.length,
        totalVersions: cvDocuments.reduce((acc, doc) => acc + (doc.versions?.length ?? 0), 0),
        exportMix,
      },
      recentExports: recentExports.filter((record) => record.documentType === 'cv'),
    },
    coverLetters: {
      templates: coverLetterTemplates,
      toneSummary,
      storyBlocks: sanitizedStoryBlocks,
      collaborators: Array.from(
        new Map(
          coverLetters
            .flatMap((doc) => doc.collaborators)
            .map((collaborator) => [collaborator.collaborator?.id ?? collaborator.id, collaborator]),
        ).values(),
      ),
      recentExports: recentExports.filter((record) => record.documentType === 'cover_letter'),
    },
    brandHub,
    analytics: {
      totals: analytics.totals,
      topPerformers: analytics.topPerformers,
      byGeography: analytics.byGeography,
      bySeniority: analytics.bySeniority,
      recentExports,
    },
    purchasedGigs: purchasedGigSummary,
    library: {
      documents,
      storyBlocks: sanitizedStoryBlocks,
      brandAssets: sanitizedBrandAssets,
    },
  };
}

function sanitizeProjectAsset(assetInstance, projectInstance) {
  if (!assetInstance) {
    return null;
  }
  const project = projectInstance?.toPublicObject?.() ?? projectInstance?.get?.({ plain: true }) ?? null;
  const base = assetInstance.toPublicObject?.() ?? assetInstance.get?.({ plain: true }) ?? assetInstance;
  return {
    ...base,
    permissions:
      base.permissions && typeof base.permissions === 'object'
        ? base.permissions
        : { visibility: 'internal_only', allowedRoles: [], allowDownload: false },
    watermarkSettings:
      base.watermarkSettings && typeof base.watermarkSettings === 'object'
        ? base.watermarkSettings
        : { enabled: false },
    projectId: project?.id ?? base.projectId ?? null,
    projectTitle: project?.title ?? null,
  };
}

function sanitizeProjectMilestoneRecord(milestoneInstance) {
  if (!milestoneInstance) {
    return null;
  }
  const base = milestoneInstance.toPublicObject?.() ?? milestoneInstance.get?.({ plain: true }) ?? milestoneInstance;
  const owner = milestoneInstance.get?.('owner') ?? milestoneInstance.owner;
  return {
    ...base,
    owner: toPlainUser(owner),
    effortLoggedHours:
      base.effortLoggedMinutes == null ? null : Number((Number(base.effortLoggedMinutes) / 60).toFixed(2)),
  };
}

function sanitizeProjectCollaboratorRecord(collaboratorInstance) {
  if (!collaboratorInstance) {
    return null;
  }
  const base = collaboratorInstance.toPublicObject?.() ?? collaboratorInstance.get?.({ plain: true }) ?? collaboratorInstance;
  const user = collaboratorInstance.get?.('user') ?? collaboratorInstance.user;
  const invitedBy = collaboratorInstance.get?.('invitedBy') ?? collaboratorInstance.invitedBy;
  return {
    ...base,
    user: toPlainUser(user),
    invitedBy: toPlainUser(invitedBy),
  };
}

function sanitizeProjectIntegrationRecord(integrationInstance) {
  if (!integrationInstance) {
    return null;
  }
  const base = integrationInstance.toPublicObject?.() ?? integrationInstance.get?.({ plain: true }) ?? integrationInstance;
  return {
    ...base,
    syncFrequencyMinutes: base.syncFrequencyMinutes == null ? null : Number(base.syncFrequencyMinutes),
    syncLagMinutes: base.syncLagMinutes == null ? null : Number(base.syncLagMinutes),
  };
}

function sanitizeProjectRetrospectiveRecord(retrospectiveInstance) {
  if (!retrospectiveInstance) {
    return null;
  }
  const base = retrospectiveInstance.toPublicObject?.() ?? retrospectiveInstance.get?.({ plain: true }) ?? retrospectiveInstance;
  const milestoneInstance = retrospectiveInstance.get?.('milestone') ?? retrospectiveInstance.milestone;
  const authoredBy = retrospectiveInstance.get?.('authoredBy') ?? retrospectiveInstance.authoredBy;
  return {
    ...base,
    milestone: milestoneInstance ? sanitizeProjectMilestoneRecord(milestoneInstance) : null,
    authoredBy: toPlainUser(authoredBy),
  };
}

function sanitizeProjectWorkspaceBundle(projectInstance) {
  const workspaceInstance = projectInstance.get?.('workspace') ?? projectInstance.workspace;
  if (!workspaceInstance) {
    return {
      workspace: null,
      brief: null,
      files: [],
      approvals: [],
      conversations: [],
    };
  }

  const workspace = workspaceInstance.toPublicObject?.() ?? workspaceInstance.get?.({ plain: true }) ?? {};
  const briefInstance = workspaceInstance.get?.('brief') ?? workspaceInstance.brief;
  const brief = briefInstance?.toPublicObject?.() ?? briefInstance?.get?.({ plain: true }) ?? null;
  const filesRaw = workspaceInstance.get?.('files') ?? workspaceInstance.files ?? [];
  const approvalsRaw = workspaceInstance.get?.('approvals') ?? workspaceInstance.approvals ?? [];
  const conversationsRaw = workspaceInstance.get?.('conversations') ?? workspaceInstance.conversations ?? [];

  return {
    workspace,
    brief,
    files: filesRaw.map((file) => sanitizeProjectAsset(file, projectInstance)).filter(Boolean),
    approvals: approvalsRaw.map((approval) => approval.toPublicObject?.() ?? approval.get?.({ plain: true }) ?? approval),
    conversations: conversationsRaw.map((conversation) =>
      conversation.toPublicObject?.() ?? conversation.get?.({ plain: true }) ?? conversation,
    ),
  };
}

function sanitizeProjectTemplateRecord(templateInstance) {
  if (!templateInstance) {
    return null;
  }
  const base = templateInstance.toPublicObject?.() ?? templateInstance.get?.({ plain: true }) ?? templateInstance;
  return {
    ...base,
    recommendedUseCases: Array.isArray(base.recommendedUseCases) ? base.recommendedUseCases : [],
    deliverables: Array.isArray(base.deliverables) ? base.deliverables : [],
    metricsFocus: Array.isArray(base.metricsFocus) ? base.metricsFocus : [],
    automationPlaybooks: Array.isArray(base.automationPlaybooks) ? base.automationPlaybooks : [],
    integrations: Array.isArray(base.integrations) ? base.integrations : [],
    toolkit: Array.isArray(base.toolkit) ? base.toolkit : [],
  };
}

function computeBudgetSnapshot(project, workspace, milestones) {
  const currency = project.budgetCurrency ?? 'USD';
  const allocated = project.budgetAmount ?? workspace?.metricsSnapshot?.budget?.allocated ?? null;
  const spentFromWorkspace = workspace?.metricsSnapshot?.budget?.spent ?? null;
  const spentFromMilestones = milestones.reduce((sum, milestone) => sum + (milestone.budgetSpent ?? 0), 0);
  const spent = spentFromWorkspace != null ? Number(spentFromWorkspace) : spentFromMilestones || null;
  const forecast = workspace?.metricsSnapshot?.budget?.forecast ?? (allocated != null ? Number(allocated) * 0.92 : null);
  const burnRateBasis = allocated ? (spent ?? 0) / Number(allocated) : null;
  return {
    currency,
    allocated: allocated == null ? null : Number(allocated),
    spent: spent == null ? null : Number(spent),
    forecast: forecast == null ? null : Number(forecast),
    remaining:
      allocated == null || spent == null ? null : Number((Number(allocated) - Number(spent)).toFixed(2)),
    burnRatePercent: burnRateBasis == null ? null : Number((burnRateBasis * 100).toFixed(1)),
  };
}

function computeAssetRepositorySummary(assets) {
  const summary = {
    total: assets.length,
    watermarked: assets.filter((asset) => asset.watermarkSettings?.enabled).length,
    restricted: assets.filter((asset) => asset.permissions?.allowDownload === false).length,
    external: assets.filter((asset) => asset.storageProvider && asset.storageProvider !== 's3').length,
    totalSizeBytes: assets.reduce((sum, asset) => sum + Number(asset.sizeBytes ?? 0), 0),
  };
  return summary;
}

function buildProjectBoardLanes(projectEntries) {
  const laneDefinitions = [
    { id: 'briefing', label: 'Brief & kickoff', statuses: ['briefing'] },
    { id: 'delivery', label: 'In delivery', statuses: ['active'] },
    { id: 'blocked', label: 'At risk', statuses: ['blocked'] },
    { id: 'completed', label: 'Completed', statuses: ['completed'] },
  ];

  return laneDefinitions.map((lane) => {
    const items = projectEntries
      .filter((entry) => lane.statuses.includes(entry.workspace?.status ?? 'briefing'))
      .map((entry) => ({
        id: entry.project.id,
        title: entry.project.title,
        status: entry.workspace?.status,
        progressPercent: entry.workspace?.progressPercent ?? 0,
        riskLevel: entry.workspace?.riskLevel ?? 'low',
        nextMilestone: entry.timeline.nextMilestone,
        nextMilestoneDueAt: entry.timeline.nextMilestoneDueAt,
      }));

    const averageProgress = items.length
      ? Number(
          (
            items.reduce((sum, item) => sum + Number(item.progressPercent ?? 0), 0) /
            items.length
          ).toFixed(1),
        )
      : 0;

    return {
      id: lane.id,
      label: lane.label,
      items,
      averageProgress,
    };
  });
}

function buildProjectBoardMetrics(projectEntries) {
  const riskDistribution = projectEntries.reduce((acc, entry) => {
    const key = entry.workspace?.riskLevel ?? 'unknown';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const averageProgress = projectEntries.length
    ? Number(
        (
          projectEntries.reduce(
            (sum, entry) => sum + Number(entry.workspace?.progressPercent ?? 0),
            0,
          ) / projectEntries.length
        ).toFixed(1),
      )
    : 0;
  const velocityScores = projectEntries
    .map((entry) => Number(entry.workspace?.velocityScore ?? 0))
    .filter((value) => Number.isFinite(value) && value > 0);
  const velocityAverage = velocityScores.length
    ? Number((velocityScores.reduce((sum, value) => sum + value, 0) / velocityScores.length).toFixed(1))
    : null;

  return {
    totalProjects: projectEntries.length,
    activeProjects: projectEntries.filter((entry) => entry.workspace?.status !== 'completed').length,
    averageProgress,
    velocityAverage,
    riskDistribution,
  };
}

function buildIntegrationSummary(projectEntries) {
  const integrationMap = new Map();
  projectEntries.forEach((entry) => {
    entry.integrations.forEach((integration) => {
      const existing = integrationMap.get(integration.provider) ?? {
        provider: integration.provider,
        connected: 0,
        syncing: 0,
        failing: 0,
        projectIds: new Set(),
        lastSyncedAt: null,
      };
      existing.projectIds.add(entry.project.id);
      if (integration.status === 'connected') {
        existing.connected += 1;
      } else if (integration.status === 'syncing') {
        existing.syncing += 1;
      } else if (integration.status === 'error') {
        existing.failing += 1;
      }
      if (integration.lastSyncedAt) {
        const currentTimestamp = existing.lastSyncedAt ? new Date(existing.lastSyncedAt).getTime() : 0;
        const candidateTimestamp = new Date(integration.lastSyncedAt).getTime();
        if (candidateTimestamp > currentTimestamp) {
          existing.lastSyncedAt = integration.lastSyncedAt;
        }
      }
      integrationMap.set(integration.provider, existing);
    });
  });

  return Array.from(integrationMap.values()).map((entry) => ({
    provider: entry.provider,
    connected: entry.connected,
    syncing: entry.syncing,
    failing: entry.failing,
    projectCount: entry.projectIds.size,
    lastSyncedAt: entry.lastSyncedAt,
  }));
}

function buildGigRemindersFromOrders(orders) {
  const reminders = [];
  const now = new Date();
  orders.forEach((order) => {
    (order.requirements ?? [])
      .filter((requirement) => requirement.status === 'pending')
      .forEach((requirement) => {
        const dueAt = requirement.dueAt || order.dueAt || order.kickoffDueAt || null;
        const dueDate = dueAt ? new Date(dueAt) : null;
        const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
        const type = requirement.metadata?.category
          ? requirement.metadata.category
          : requirement.title?.toLowerCase().includes('compliance')
            ? 'compliance'
            : 'delivery';
        reminders.push({
          id: `${order.id}-${requirement.id}`,
          orderId: order.id,
          orderNumber: order.orderNumber,
          gigTitle: order.gig?.title ?? order.orderNumber,
          title: requirement.title,
          dueAt,
          priority: requirement.priority,
          type,
          daysUntilDue,
          notes: requirement.notes,
        });
      });
  });

  return reminders
    .sort((a, b) => {
      if (a.dueAt && b.dueAt) {
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      }
      if (a.dueAt) return -1;
      if (b.dueAt) return 1;
      return (b.priority || '').localeCompare(a.priority || '');
    })
    .slice(0, 6);
}

function buildVendorScorecardInsights(orders) {
  const records = [];
  orders.forEach((order) => {
    (order.vendorScorecards ?? []).forEach((scorecard) => {
      const vendorName = scorecard.vendor
        ? [scorecard.vendor.firstName, scorecard.vendor.lastName].filter(Boolean).join(' ') || scorecard.vendor.email
        : order.gig?.title ?? 'Vendor';
      records.push({
        ...scorecard,
        orderId: order.id,
        orderNumber: order.orderNumber,
        gigTitle: order.gig?.title ?? null,
        vendorName,
      });
    });
  });

  const aggregateMetric = (key) => {
    const values = records.map((record) => Number(record[key] ?? 0)).filter((value) => Number.isFinite(value));
    if (!values.length) {
      return null;
    }
    return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
  };

  const riskDistribution = records.reduce((acc, record) => {
    const key = record.riskLevel ?? 'unknown';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const topVendors = records
    .slice()
    .sort((a, b) => (Number(b.overallScore ?? 0) || 0) - (Number(a.overallScore ?? 0) || 0))
    .slice(0, 3)
    .map((record) => ({
      vendorName: record.vendorName,
      overallScore: record.overallScore,
      riskLevel: record.riskLevel,
    }));

  return {
    records,
    summary: {
      averages: {
        overall: aggregateMetric('overallScore'),
        onTimeDelivery: aggregateMetric('onTimeDeliveryScore'),
        quality: aggregateMetric('qualityScore'),
        communication: aggregateMetric('communicationScore'),
        compliance: aggregateMetric('complianceScore'),
      },
      riskDistribution,
      topVendors,
    },
  };
}

function buildAchievementAssistant(projectEntries, gigOrders, storyBlocks) {
  const achievements = [];

  projectEntries.forEach((entry) => {
    entry.milestones
      .filter((milestone) => milestone.status === 'completed')
      .slice(0, 3)
      .forEach((milestone) => {
        achievements.push({
          id: `project-${entry.project.id}-milestone-${milestone.id}`,
          source: 'project',
          title: `${entry.project.title}: ${milestone.title}`,
          bullet:
            (Array.isArray(milestone.successCriteria) && milestone.successCriteria[0]) ||
            milestone.description ||
            'Milestone completed',
          metrics: milestone.impactMetrics ?? {},
          deliveredAt: milestone.completedAt ?? milestone.dueDate ?? entry.project.updatedAt,
          recommendedChannel: 'resume',
        });
      });

    entry.retrospectives.slice(0, 2).forEach((retro) => {
      achievements.push({
        id: `project-${entry.project.id}-retro-${retro.id}`,
        source: 'project',
        title: `${entry.project.title}: ${retro.milestone?.title ?? 'Retrospective'}`,
        bullet: Array.isArray(retro.highlights) && retro.highlights.length ? retro.highlights[0] : retro.summary,
        metrics: retro.metadata?.metrics ?? {},
        deliveredAt: retro.generatedAt,
        recommendedChannel: 'linkedin',
      });
    });
  });

  gigOrders
    .filter((order) => ['completed', 'released'].includes(order.status) || Number(order.progressPercent ?? 0) >= 90)
    .forEach((order) => {
      const vendorScore = (order.vendorScorecards ?? [])[0];
      achievements.push({
        id: `gig-${order.id}`,
        source: 'gig',
        title: `${order.gig?.title ?? 'Vendor engagement'} (${order.orderNumber})`,
        bullet:
          vendorScore?.notes ||
          `Delivered ${order.gig?.title ?? 'vendor engagement'} with ${order.activeRevisions ?? 0} revision cycles and ${order.outstandingRequirements ?? 0} outstanding items closed`,
        metrics: {
          progressPercent: order.progressPercent,
          csat: vendorScore?.overallScore ?? null,
        },
        deliveredAt: order.completedAt ?? order.updatedAt ?? order.dueAt,
        recommendedChannel: 'cover_letter',
      });
    });

  const prompts = (Array.isArray(storyBlocks) ? storyBlocks : [])
    .slice(0, 5)
    .map((block) => ({
      id: `story-${block.id ?? block.title}`,
      title: block.title || 'Story concept',
      prompt: block.summary || block.content || block.body || '',
    }));

  const quickExports = {
    resumeBullets: achievements.slice(0, 3).map((achievement) => achievement.bullet),
    coverLetters: achievements
      .slice(0, 3)
      .map((achievement) => `${achievement.title}: ${achievement.bullet}`),
    linkedinPosts: achievements.slice(0, 2).map((achievement) => {
      const impact = achievement.metrics?.progressPercent ? `${achievement.metrics.progressPercent}% progress` : 'key impact';
      return `Delivered ${achievement.title} • ${impact}`;
    }),
  };

  return { achievements, quickExports, prompts };
}

function buildProjectGigManagementSection({ projects, templates, gigOrders, storyBlocks, brandAssets }) {
  void brandAssets;
  const projectEntries = projects.map((projectInstance) => {
    const project = projectInstance.toPublicObject?.() ?? projectInstance.get?.({ plain: true }) ?? projectInstance;
    const workspaceBundle = sanitizeProjectWorkspaceBundle(projectInstance);
    const milestones = (projectInstance.get?.('milestones') ?? projectInstance.milestones ?? [])
      .map((milestone) => sanitizeProjectMilestoneRecord(milestone))
      .sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0));
    const collaborators = (projectInstance.get?.('collaborators') ?? projectInstance.collaborators ?? [])
      .map((collaborator) => sanitizeProjectCollaboratorRecord(collaborator))
      .filter(Boolean);
    const integrations = (projectInstance.get?.('integrations') ?? projectInstance.integrations ?? [])
      .map((integration) => sanitizeProjectIntegrationRecord(integration))
      .filter(Boolean);
    const retrospectives = (projectInstance.get?.('retrospectives') ?? projectInstance.retrospectives ?? [])
      .map((retro) => sanitizeProjectRetrospectiveRecord(retro))
      .filter(Boolean)
      .sort((a, b) => new Date(b.generatedAt || b.createdAt || 0).getTime() - new Date(a.generatedAt || a.createdAt || 0).getTime());

    const budget = computeBudgetSnapshot(project, workspaceBundle.workspace, milestones);
    const collaboratorSummary = {
      active: collaborators.filter((collaborator) => collaborator.status === 'active').length,
      invited: collaborators.filter((collaborator) => collaborator.status === 'invited').length,
    };
    const communications = {
      pendingApprovals: workspaceBundle.approvals.filter((approval) => approval.status !== 'approved').length,
      unreadMessages: workspaceBundle.conversations.reduce(
        (total, conversation) => total + Number(conversation.unreadCount ?? 0),
        0,
      ),
    };
    const upcomingMilestone = milestones.find((milestone) => milestone.status !== 'completed');

    return {
      project,
      workspace: workspaceBundle.workspace,
      brief: workspaceBundle.brief,
      milestones,
      collaborators,
      integrations,
      retrospectives,
      assets: workspaceBundle.files,
      approvals: workspaceBundle.approvals,
      conversations: workspaceBundle.conversations,
      budget,
      collaboratorSummary,
      communications,
      timeline: {
        nextMilestone: workspaceBundle.workspace?.nextMilestone ?? upcomingMilestone?.title ?? null,
        nextMilestoneDueAt:
          workspaceBundle.workspace?.nextMilestoneDueAt ?? upcomingMilestone?.dueDate ?? upcomingMilestone?.completedAt ?? null,
      },
    };
  });

  const assets = projectEntries.flatMap((entry) =>
    entry.assets.map((asset) => ({ ...asset, projectId: entry.project.id, projectTitle: entry.project.title })),
  );
  const assetSummary = computeAssetRepositorySummary(assets);
  const boardLanes = buildProjectBoardLanes(projectEntries);
  const boardMetrics = buildProjectBoardMetrics(projectEntries);
  const boardIntegrations = buildIntegrationSummary(projectEntries);
  const boardRetrospectives = projectEntries
    .flatMap((entry) =>
      entry.retrospectives.map((retro) => ({ ...retro, projectId: entry.project.id, projectTitle: entry.project.title })),
    )
    .slice(0, 6);

  const templateRecords = templates.map((template) => sanitizeProjectTemplateRecord(template)).filter(Boolean);
  const reminders = buildGigRemindersFromOrders(gigOrders);
  const vendorInsights = buildVendorScorecardInsights(gigOrders);
  const storytelling = buildAchievementAssistant(projectEntries, gigOrders, storyBlocks);

  const totalBudget = projectEntries.reduce((sum, entry) => sum + (entry.budget.allocated ?? 0), 0);
  const openGigOrders = gigOrders.filter((order) => !['completed', 'cancelled'].includes(order.status)).length;
  const summary = {
    totalProjects: projectEntries.length,
    activeProjects: projectEntries.filter((entry) => entry.workspace?.status !== 'completed').length,
    budgetInPlay: totalBudget,
    currency: projectEntries[0]?.budget?.currency ?? 'USD',
    gigsInDelivery: openGigOrders,
    openGigOrders,
    templatesAvailable: templateRecords.length,
    assetsSecured: assetSummary.total,
    vendorSatisfaction: vendorInsights.summary.averages.overall,
    storiesReady: storytelling.achievements.length,
  };

  return {
    summary,
    projectCreation: {
      projects: projectEntries,
      templates: templateRecords,
    },
    assets: {
      items: assets,
      summary: assetSummary,
    },
    managementBoard: {
      lanes: boardLanes,
      metrics: boardMetrics,
      integrations: boardIntegrations,
      retrospectives: boardRetrospectives,
    },
    purchasedGigs: {
      orders: gigOrders,
      reminders,
      scorecards: vendorInsights.records,
      stats: {
        ...vendorInsights.summary,
        totalOrders: gigOrders.length,
      },
    },
    storytelling,
  };
}

async function ensureProjectTemplatesSeeded() {
  const existingCount = await ProjectTemplate.count();
  if (existingCount > 0) {
    return;
  }

  const now = new Date();
  await ProjectTemplate.bulkCreate(
    [
      {
        name: 'Hackathon launch kit',
        category: 'hackathon',
        description:
          'Two-week innovation sprint with kickoff canvases, mentorship cadences, and judging workflows tailored for hackathons.',
        summary:
          'Designed for alumni or community-led hackathons that need structured rituals, scorecards, and sponsor-ready packaging.',
        audience: 'Student founders & emerging product builders',
        durationWeeks: 2,
        recommendedUseCases: ['Campus hackathons', 'Weekend innovation sprints', 'Startup weekends'],
        deliverables: ['Kickoff agenda', 'Mentor office-hours rotation', 'Judging scorecard template', 'Demo day press kit'],
        metricsFocus: ['Prototypes shipped', 'Mentor sessions completed', 'NPS'],
        automationPlaybooks: ['Daily standup reminders', 'Mentor briefing emails', 'Demo day RSVP tracking'],
        integrations: ['github', 'notion', 'figma'],
        budgetRange: { currency: 'USD', minimum: 2500, maximum: 12000 },
        toolkit: ['Sprint retro template', 'Design review checklist', 'Sponsor update deck'],
        metadata: { version: '2024.1', author: 'Gigvora Labs', createdAt: now.toISOString() },
        isFeatured: true,
      },
      {
        name: 'Bootcamp delivery workspace',
        category: 'bootcamp',
        description:
          'Four-week bootcamp accelerator with milestone health metrics, cohort rituals, and alumni storytelling prompts.',
        summary:
          'Ideal for emerging talent communities running intensive bootcamps that need structured delivery and feedback loops.',
        audience: 'Career switchers & apprenticeship cohorts',
        durationWeeks: 4,
        recommendedUseCases: ['Career bootcamps', 'Upskilling cohorts', 'Employer academies'],
        deliverables: ['Weekly curriculum brief', 'Coach retro board', 'Learner portfolio prompts', 'Sponsor outcome report'],
        metricsFocus: ['Attendance', 'Curriculum completion', 'Placement referrals'],
        automationPlaybooks: ['Daily digest emails', 'Coach escalations', 'Learner survey triggers'],
        integrations: ['notion', 'google_drive', 'slack'],
        budgetRange: { currency: 'USD', minimum: 15000, maximum: 48000 },
        toolkit: ['Onboarding form', 'Feedback rubric', 'Alumni storytelling pack'],
        metadata: { version: '2024.2', pillar: 'Launchpad' },
        isFeatured: true,
      },
      {
        name: 'Consulting engagement blueprint',
        category: 'consulting',
        description:
          'Client services workspace covering discovery, delivery, QA, and close-out rituals with executive reporting templates.',
        summary:
          'For independent consultants and boutique teams delivering recurring engagements with clear governance and billing.',
        audience: 'Independent consultants & boutique agencies',
        durationWeeks: 6,
        recommendedUseCases: ['Product discovery', 'Go-to-market research', 'RevOps diagnostics'],
        deliverables: ['Discovery interview log', 'Executive readout deck', 'Risk register', 'Billing checkpoint plan'],
        metricsFocus: ['Cycle time', 'Stakeholder satisfaction', 'Scope variance'],
        automationPlaybooks: ['Invoice reminders', 'Stakeholder pulse surveys', 'Weekly status digest'],
        integrations: ['github', 'notion', 'google_drive', 'slack'],
        budgetRange: { currency: 'USD', minimum: 12000, maximum: 90000 },
        toolkit: ['Statement of work template', 'Decision log', 'QA checklist'],
        metadata: { version: '2024.3', compliance: ['SOC2-ready', 'GDPR-aware'] },
        isFeatured: false,
      },
    ],
    { returning: false },
  );
}

async function ensureProjectDeliveryScaffolding(projectId, { actorId }) {
  const project = await Project.findByPk(projectId);
  if (!project) {
    return null;
  }

  const workspace = await initializeWorkspaceForProject(project, { actorId });

  const [milestoneCount, collaboratorCount, integrationCount, retrospectiveCount] = await Promise.all([
    ProjectMilestone.count({ where: { projectId } }),
    ProjectCollaborator.count({ where: { projectId } }),
    ProjectIntegration.count({ where: { projectId } }),
    ProjectRetrospective.count({ where: { projectId } }),
  ]);

  const now = new Date();

  if (milestoneCount === 0) {
    await ProjectMilestone.bulkCreate(
      [
        {
          projectId,
          title: 'Discovery & kickoff',
          description: 'Align on problem statement, stakeholders, and success measures.',
          status: 'completed',
          ordinal: 1,
          startDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 14),
          dueDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7),
          completedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 6),
          budgetAllocated: project.budgetAmount ? Number(project.budgetAmount) * 0.25 : 15000,
          budgetSpent: project.budgetAmount ? Number(project.budgetAmount) * 0.22 : 13200,
          effortPlannedHours: 120,
          effortLoggedMinutes: 7200,
          successCriteria: ['Kickoff sign-off received', 'Discovery interview readout shared'],
          deliverables: ['Kickoff deck', 'Stakeholder map', 'Research plan'],
          impactMetrics: { stakeholderSatisfaction: 4.7 },
          ownerId: actorId ?? null,
        },
        {
          projectId,
          title: 'Build & iteration',
          description: 'Delivery sprints with QA reviews and automation coverage checks.',
          status: 'in_progress',
          ordinal: 2,
          startDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 6),
          dueDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7),
          budgetAllocated: project.budgetAmount ? Number(project.budgetAmount) * 0.45 : 28000,
          budgetSpent: project.budgetAmount ? Number(project.budgetAmount) * 0.2 : 12000,
          effortPlannedHours: 240,
          effortLoggedMinutes: 5400,
          successCriteria: ['Automation coverage > 60%', 'QA checklist approved'],
          deliverables: ['Sprint demo recordings', 'QA checklist', 'Automation playbook'],
          impactMetrics: { automationCoverage: 0.62 },
          ownerId: actorId ?? null,
        },
        {
          projectId,
          title: 'Launch & retrospective',
          description: 'Final approvals, billing checkpoints, and narrative packaging.',
          status: 'planned',
          ordinal: 3,
          startDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7),
          dueDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14),
          budgetAllocated: project.budgetAmount ? Number(project.budgetAmount) * 0.3 : 18000,
          budgetSpent: 0,
          effortPlannedHours: 160,
          effortLoggedMinutes: 0,
          successCriteria: ['Executive readout delivered', 'Support transition runbook shared'],
          deliverables: ['Executive summary', 'Risk register update', 'Support runbook'],
          impactMetrics: { readinessScore: 0.9 },
          ownerId: actorId ?? null,
        },
      ],
      { returning: false },
    );
  }

  const milestones = await ProjectMilestone.findAll({ where: { projectId }, order: [['ordinal', 'ASC']] });

  if (collaboratorCount === 0) {
    await ProjectCollaborator.bulkCreate(
      [
        {
          projectId,
          userId: actorId ?? null,
          role: 'owner',
          status: 'active',
          permissions: { canEditBudget: true, canInvite: true },
          responsibility: 'Engagement lead',
          invitedAt: now,
          joinedAt: now,
        },
        {
          projectId,
          email: 'mentor@gigvora.com',
          name: 'Gigvora Mentor',
          role: 'mentor',
          status: 'active',
          permissions: { canComment: true, canViewAssets: true },
          responsibility: 'Career storytelling & retrospectives',
          invitedAt: now,
          joinedAt: now,
        },
        {
          projectId,
          email: 'sponsor@example.com',
          name: 'Client Sponsor',
          role: 'client_sponsor',
          status: 'invited',
          permissions: { canApprove: true, canViewAssets: true },
          responsibility: 'Executive approvals',
          invitedAt: now,
          invitedById: actorId ?? null,
        },
      ],
      { returning: false },
    );
  }

  if (integrationCount === 0) {
    await ProjectIntegration.bulkCreate(
      [
        {
          projectId,
          provider: 'github',
          status: 'connected',
          connectedById: actorId ?? null,
          connectedAt: now,
          lastSyncedAt: now,
          syncFrequencyMinutes: 60,
          metadata: { repository: `gigvora/project-${projectId}`, branch: 'main' },
        },
        {
          projectId,
          provider: 'notion',
          status: 'connected',
          connectedById: actorId ?? null,
          connectedAt: now,
          lastSyncedAt: now,
          syncFrequencyMinutes: 30,
          metadata: { workspaceUrl: 'https://notion.so/workspace/project' },
        },
        {
          projectId,
          provider: 'figma',
          status: 'syncing',
          connectedById: actorId ?? null,
          connectedAt: now,
          lastSyncedAt: new Date(now.getTime() - 1000 * 60 * 15),
          syncFrequencyMinutes: 15,
          syncLagMinutes: 15,
          metadata: { fileUrl: 'https://figma.com/file/project', team: 'Product design' },
        },
        {
          projectId,
          provider: 'google_drive',
          status: 'connected',
          connectedById: actorId ?? null,
          connectedAt: now,
          lastSyncedAt: now,
          syncFrequencyMinutes: 45,
          metadata: { folderId: 'drive-folder-project', retentionPolicyDays: 90 },
        },
      ],
      { returning: false },
    );
  }

  if (retrospectiveCount === 0 && milestones.length) {
    await ProjectRetrospective.bulkCreate(
      [
        {
          projectId,
          milestoneId: milestones[0]?.id ?? null,
          authoredById: actorId ?? null,
          summary: 'Kickoff complete with high sponsor confidence and aligned success metrics.',
          highlights: ['Sponsor NPS 4.7/5', 'Discovery insights packaged into Notion hub'],
          risks: ['Scope creep flagged for automation requirements'],
          actions: ['Review scope change at next steering meeting'],
          sentimentScore: 0.82,
          generatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5),
          metadata: { format: 'executive_digest' },
        },
        {
          projectId,
          milestoneId: milestones[1]?.id ?? null,
          authoredById: actorId ?? null,
          summary: 'Mid-sprint health check indicates strong automation coverage with minor QA risks.',
          highlights: ['Automation coverage at 62%', 'QA findings triaged within 8h'],
          risks: ['QA capacity constrained next week'],
          actions: ['Backfill QA contributor for 20 hours'],
          sentimentScore: 0.74,
          generatedAt: now,
          metadata: { format: 'mid_sprint' },
        },
      ],
      { returning: false },
    );
  }

  const plannedHours = milestones.reduce((sum, milestone) => sum + Number(milestone.effortPlannedHours ?? 0), 0);
  const loggedHours = milestones.reduce((sum, milestone) => sum + Number(milestone.effortLoggedMinutes ?? 0), 0) / 60;
  const allocatedBudget = project.budgetAmount == null ? 60000 : Number(project.budgetAmount);
  const spentBudget = milestones.reduce((sum, milestone) => sum + Number(milestone.budgetSpent ?? 0), 0) || allocatedBudget * 0.35;
  const nextMilestone = milestones.find((milestone) => milestone.status !== 'completed');

  await workspace.update({
    metricsSnapshot: {
      ...(workspace.metricsSnapshot ?? {}),
      budget: {
        allocated: allocatedBudget,
        spent: Number(spentBudget.toFixed(2)),
        forecast: Number((allocatedBudget * 0.92).toFixed(2)),
        burnRate: allocatedBudget ? spentBudget / allocatedBudget : 0,
      },
      timeTracking: {
        plannedHours,
        actualHours: Number(loggedHours.toFixed(1)),
      },
    },
    nextMilestone: nextMilestone?.title ?? workspace.nextMilestone,
    nextMilestoneDueAt: nextMilestone?.dueDate ?? workspace.nextMilestoneDueAt,
  });

  return workspace;
}

function buildFollowUps(applications, targetMap) {
  const now = new Date();
  const items = [];

  applications.forEach((application) => {
    const base = application.toPublicObject();
    if (!FOLLOW_UP_STATUSES.has(base.status)) {
      return;
    }
    const referenceDate = base.updatedAt ?? base.submittedAt ?? base.createdAt;
    if (!referenceDate) {
      return;
    }
    const daysSince = differenceInDays(referenceDate, now);
    const threshold = base.status === 'submitted' ? 5 : base.status === 'offered' ? 2 : 3;
    const dueAt = addDays(referenceDate, threshold);
    const target = targetMap.get(`${base.targetType}:${base.targetId}`) ?? {};
    const targetName = target?.title || target?.name || `#${base.targetId}`;

    items.push({
      applicationId: base.id,
      targetName,
      status: base.status,
      nextStep: resolveNextStep(base.status),
      dueAt,
      overdue: daysSince > threshold,
      daysSinceUpdate: differenceInDays(referenceDate, now),
    });
  });

  return items
    .sort((a, b) => {
      if (a.overdue !== b.overdue) {
        return a.overdue ? -1 : 1;
      }
      return (new Date(a.dueAt || now)).getTime() - (new Date(b.dueAt || now)).getTime();
    })
    .slice(0, 8);
}

function toPlain(instance, options = {}) {
  if (!instance) return null;
  if (typeof instance.toPublicObject === 'function') {
    return instance.toPublicObject(options);
  }
  if (typeof instance.get === 'function') {
    return instance.get({ plain: true, ...options });
  }
  return { ...instance };
}

function computeChange(current, previous) {
  if (current == null || previous == null) {
    return null;
  }
  const delta = Number(current) - Number(previous);
  const percent = Number(previous) === 0 ? null : (delta / Number(previous)) * 100;
  return {
    absolute: Math.round(delta * 100) / 100,
    percent: percent == null ? null : Math.round(percent * 10) / 10,
    direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
  };
}

function sanitizeCareerSnapshot(snapshot) {
  const plain = toPlain(snapshot);
  if (!plain) return null;
  return {
    id: plain.id,
    timeframeStart: plain.timeframeStart,
    timeframeEnd: plain.timeframeEnd,
    outreachConversionRate: plain.outreachConversionRate == null ? null : Number(plain.outreachConversionRate),
    interviewMomentum: plain.interviewMomentum == null ? null : Number(plain.interviewMomentum),
    offerWinRate: plain.offerWinRate == null ? null : Number(plain.offerWinRate),
    salaryMedian: plain.salaryMedian == null ? null : Number(plain.salaryMedian),
    salaryCurrency: plain.salaryCurrency ?? 'USD',
    salaryTrend: plain.salaryTrend ?? 'flat',
    diversityRepresentation: plain.diversityRepresentation ?? null,
    funnelBreakdown: plain.funnelBreakdown ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function sanitizeBenchmark(benchmark) {
  const plain = toPlain(benchmark);
  if (!plain) return null;
  return {
    id: plain.id,
    cohortKey: plain.cohortKey,
    metric: plain.metric,
    value: plain.value == null ? null : Number(plain.value),
    percentile: plain.percentile == null ? null : Number(plain.percentile),
    sampleSize: plain.sampleSize == null ? null : Number(plain.sampleSize),
    capturedAt: plain.capturedAt,
    metadata: plain.metadata ?? null,
  };
}

function sanitizeCalendarIntegrationRecord(integration) {
  const plain = toPlain(integration);
  if (!plain) return null;
  return {
    id: plain.id,
    provider: plain.provider,
    externalAccount: plain.externalAccount,
    status: plain.status,
    lastSyncedAt: plain.lastSyncedAt,
    syncError: plain.syncError,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function sanitizeCalendarSettingRecord(setting) {
  const plain = toPlain(setting);
  if (!plain) return null;
  return {
    id: plain.id,
    timezone: plain.timezone ?? 'UTC',
    weekStart: plain.weekStart == null ? 1 : Number(plain.weekStart),
    workStartMinutes: plain.workStartMinutes == null ? 480 : Number(plain.workStartMinutes),
    workEndMinutes: plain.workEndMinutes == null ? 1020 : Number(plain.workEndMinutes),
    defaultView: plain.defaultView ?? 'agenda',
    defaultReminderMinutes:
      plain.defaultReminderMinutes == null ? 30 : Number(plain.defaultReminderMinutes),
    autoFocusBlocks: Boolean(plain.autoFocusBlocks),
    shareAvailability: Boolean(plain.shareAvailability),
    colorHex: plain.colorHex ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
  };
}

function sanitizeCalendarEventRecord(event) {
  const plain = toPlain(event);
  if (!plain) return null;
  return {
    id: plain.id,
    title: plain.title,
    eventType: plain.eventType,
    source: plain.source,
    startsAt: plain.startsAt,
    endsAt: plain.endsAt,
    location: plain.location,
    description: plain.description ?? null,
    videoConferenceLink: plain.videoConferenceLink ?? null,
    isAllDay: Boolean(plain.isAllDay),
    reminderMinutes: plain.reminderMinutes == null ? null : Number(plain.reminderMinutes),
    visibility: plain.visibility ?? 'private',
    relatedEntityType: plain.relatedEntityType ?? null,
    relatedEntityId:
      plain.relatedEntityId == null || Number.isNaN(Number(plain.relatedEntityId))
        ? null
        : Number(plain.relatedEntityId),
    colorHex: plain.colorHex ?? null,
    isFocusBlock: Boolean(plain.isFocusBlock),
    focusMode: plain.focusMode,
    metadata: plain.metadata ?? null,
  };
}

function sanitizeFocusSessionRecord(session) {
  const plain = toPlain(session);
  if (!plain) return null;
  return {
    id: plain.id,
    focusType: plain.focusType,
    startedAt: plain.startedAt,
    endedAt: plain.endedAt,
    durationMinutes: plain.durationMinutes == null ? null : Number(plain.durationMinutes),
    completed: Boolean(plain.completed),
    notes: plain.notes,
    metadata: plain.metadata ?? null,
  };
}

function sanitizeAuditLogRecord(log) {
  const plain = toPlain(log);
  if (!plain) return null;
  const actorInstance = log?.get?.('actor') ?? log.actor ?? plain.actor;
  const actor = actorInstance
    ? {
        id: actorInstance.id,
        firstName: actorInstance.firstName,
        lastName: actorInstance.lastName,
        email: actorInstance.email,
      }
    : null;
  return {
    id: plain.id,
    collaborationId: plain.collaborationId,
    actor,
    action: plain.action,
    scope: plain.scope,
    details: plain.details ?? null,
    createdAt: plain.createdAt,
  };
}

function sanitizeCollaborationRecord(collaboration, auditLogMap = new Map()) {
  const base = toPlain(collaboration);
  if (!base) return null;
  const members = Array.isArray(collaboration?.members)
    ? collaboration.members.map((member) => {
        const memberPlain = toPlain(member) ?? {};
        const userInstance = member?.get?.('member') ?? member.member ?? null;
        const user = userInstance
          ? {
              id: userInstance.id,
              firstName: userInstance.firstName,
              lastName: userInstance.lastName,
              email: userInstance.email,
            }
          : null;
        return {
          ...memberPlain,
          user,
        };
      })
    : [];

  const documentRooms = Array.isArray(collaboration?.documentRooms)
    ? collaboration.documentRooms.map((room) => toPlain(room)).filter(Boolean)
    : [];

  const auditTrail = auditLogMap.get(base.id) ?? [];

  return {
    ...base,
    members,
    documentRooms,
    auditTrail,
  };
}

function sanitizeSupportCaseRecord(supportCase) {
  if (!supportCase) return null;
  const plain = supportCase.get({ plain: true });
  const assignedAgentInstance = supportCase.get?.('assignedAgent') ?? plain.assignedAgent ?? null;
  const assignedAgent = assignedAgentInstance
    ? {
        id: assignedAgentInstance.id,
        firstName: assignedAgentInstance.firstName,
        lastName: assignedAgentInstance.lastName,
        email: assignedAgentInstance.email,
      }
    : null;

  const openedAt = plain.escalatedAt ?? plain.createdAt ?? null;
  const now = new Date();
  const ageHours = openedAt ? Math.round((now.getTime() - new Date(openedAt).getTime()) / (1000 * 60 * 60)) : null;
  const resolved = Boolean(plain.resolvedAt);
  const responseTargetHours = plain.priority === 'urgent' ? 4 : plain.priority === 'high' ? 8 : 24;
  const responseMinutes = plain.firstResponseAt && openedAt
    ? Math.round((new Date(plain.firstResponseAt).getTime() - new Date(openedAt).getTime()) / (1000 * 60))
    : null;
  const resolutionMinutes = plain.resolvedAt && openedAt
    ? Math.round((new Date(plain.resolvedAt).getTime() - new Date(openedAt).getTime()) / (1000 * 60))
    : null;

  return {
    id: plain.id,
    status: plain.status,
    priority: plain.priority,
    reason: plain.reason,
    escalatedAt: plain.escalatedAt,
    firstResponseAt: plain.firstResponseAt,
    resolvedAt: plain.resolvedAt,
    assignedAgent,
    metadata: plain.metadata ?? null,
    ageHours,
    responseMinutes,
    resolutionMinutes,
    slaBreached: !resolved && ageHours != null && ageHours > responseTargetHours,
  };
}

function sanitizeAutomationLogRecord(log) {
  const plain = toPlain(log);
  if (!plain) return null;
  return {
    id: plain.id,
    source: plain.source,
    action: plain.action,
    status: plain.status,
    triggeredAt: plain.triggeredAt,
    completedAt: plain.completedAt,
    metadata: plain.metadata ?? null,
  };
}

function sanitizeKnowledgeArticleRecord(article) {
  const plain = toPlain(article);
  if (!plain) return null;
  return {
    id: plain.id,
    slug: plain.slug,
    title: plain.title,
    summary: plain.summary,
    category: plain.category,
    audience: plain.audience,
    resourceLinks: plain.resourceLinks ?? null,
    lastReviewedAt: plain.lastReviewedAt,
  };
}

function buildCareerAnalyticsInsights(snapshotRecords, benchmarkRecords) {
  const snapshots = snapshotRecords.map((record) => sanitizeCareerSnapshot(record)).filter(Boolean);
  const benchmarks = benchmarkRecords.map((record) => sanitizeBenchmark(record)).filter(Boolean);
  const latest = snapshots[0] ?? null;
  const previous = snapshots[1] ?? null;

  const summary = {
    conversionRate: latest?.outreachConversionRate ?? null,
    interviewMomentum: latest?.interviewMomentum ?? null,
    offerWinRate: latest?.offerWinRate ?? null,
    salary: {
      value: latest?.salaryMedian ?? null,
      currency: latest?.salaryCurrency ?? 'USD',
      trend: latest?.salaryTrend ?? 'flat',
      change: computeChange(latest?.salaryMedian, previous?.salaryMedian),
    },
    conversionChange: computeChange(latest?.outreachConversionRate, previous?.outreachConversionRate),
    interviewChange: computeChange(latest?.interviewMomentum, previous?.interviewMomentum),
    offerChange: computeChange(latest?.offerWinRate, previous?.offerWinRate),
  };

  const diversity = latest?.diversityRepresentation ?? null;
  const funnel = latest?.funnelBreakdown ?? null;

  return {
    summary,
    snapshots,
    benchmarks,
    diversity,
    funnel,
  };
}

function buildCalendarInsights(eventsRecords, focusSessionRecords, integrationRecords, settingRecord) {
  const events = eventsRecords.map((record) => sanitizeCalendarEventRecord(record)).filter(Boolean);
  const focusSessions = focusSessionRecords.map((record) => sanitizeFocusSessionRecord(record)).filter(Boolean);
  const integrations = integrationRecords.map((record) => sanitizeCalendarIntegrationRecord(record)).filter(Boolean);
  const settings = sanitizeCalendarSettingRecord(settingRecord);

  const now = new Date();
  const upcomingEvents = events.filter((event) => !event.startsAt || new Date(event.startsAt) >= now);
  const nextFocusBlock = upcomingEvents.find((event) => event.isFocusBlock) ?? null;
  const upcomingInterviews = upcomingEvents
    .filter((event) => event.eventType === 'interview')
    .slice(0, 3);

  const focusTotalMinutes = focusSessions.reduce((total, session) => {
    if (session.durationMinutes != null) {
      return total + Number(session.durationMinutes);
    }
    if (session.startedAt && session.endedAt) {
      const start = new Date(session.startedAt).getTime();
      const end = new Date(session.endedAt).getTime();
      if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) {
        return total + Math.round((end - start) / (1000 * 60));
      }
    }
    return total;
  }, 0);

  const focusByType = focusSessions.reduce((accumulator, session) => {
    if (!session || !session.focusType) return accumulator;
    const key = session.focusType;
    accumulator[key] = (accumulator[key] ?? 0) + (session.durationMinutes ?? 0);
    return accumulator;
  }, {});

  const eventsByType = events.reduce((accumulator, event) => {
    const key = event.eventType || 'other';
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});

  const upcomingFocusSessions = focusSessions
    .filter((session) => !session.completed)
    .sort((a, b) => {
      const aStart = a.startedAt ? new Date(a.startedAt).getTime() : Number.POSITIVE_INFINITY;
      const bStart = b.startedAt ? new Date(b.startedAt).getTime() : Number.POSITIVE_INFINITY;
      return aStart - bStart;
    })
    .slice(0, 5);

  return {
    integrations,
    events,
    upcomingInterviews,
    nextFocusBlock,
    focus: {
      sessions: focusSessions,
      totalMinutes: focusTotalMinutes,
      byType: focusByType,
    },
    settings,
    summary: {
      totalEvents: events.length,
      upcomingCount: upcomingEvents.length,
      eventsByType,
      nextEvent: upcomingEvents[0] ?? null,
      upcomingFocusSessions,
    },
  };
}

function buildAdvisorInsights(collaborationRecords, auditLogRecords) {
  const auditLogMap = auditLogRecords.reduce((map, log) => {
    const sanitized = sanitizeAuditLogRecord(log);
    if (!sanitized) return map;
    if (!map.has(sanitized.collaborationId)) {
      map.set(sanitized.collaborationId, []);
    }
    map.get(sanitized.collaborationId).push(sanitized);
    return map;
  }, new Map());

  const collaborations = collaborationRecords
    .map((collaboration) => sanitizeCollaborationRecord(collaboration, auditLogMap))
    .filter(Boolean);

  const totalMembers = collaborations.reduce((total, collaboration) => total + (collaboration.members?.length ?? 0), 0);
  const activeRooms = collaborations.flatMap((collaboration) => collaboration.documentRooms ?? []).filter(
    (room) => room && room.status === 'active',
  );

  return {
    collaborations,
    summary: {
      totalCollaborations: collaborations.length,
      totalMembers,
      activeDocumentRooms: activeRooms.length,
    },
  };
}

function buildSupportDeskInsights(caseRecords, automationRecords, knowledgeRecords) {
  const cases = caseRecords.map((record) => sanitizeSupportCaseRecord(record)).filter(Boolean);
  const automation = automationRecords.map((record) => sanitizeAutomationLogRecord(record)).filter(Boolean);
  const articles = knowledgeRecords.map((record) => sanitizeKnowledgeArticleRecord(record)).filter(Boolean);

  const summary = cases.reduce(
    (accumulator, supportCase) => {
      const isOpen = !['resolved', 'closed'].includes(supportCase.status ?? '');
      if (isOpen) {
        accumulator.open += 1;
      }
      if (supportCase.slaBreached) {
        accumulator.slaBreached += 1;
      }
      if (supportCase.responseMinutes != null) {
        accumulator.responseMinutes.push(supportCase.responseMinutes);
      }
      if (supportCase.resolutionMinutes != null) {
        accumulator.resolutionMinutes.push(supportCase.resolutionMinutes);
      }
      return accumulator;
    },
    { open: 0, slaBreached: 0, responseMinutes: [], resolutionMinutes: [] },
  );

  const average = (values) => {
    if (!values.length) return null;
    const total = values.reduce((sum, value) => sum + value, 0);
    return Math.round((total / values.length) * 10) / 10;
  };

  return {
    cases,
    automation,
    knowledgeArticles: articles,
    summary: {
      openCases: summary.open,
      slaBreached: summary.slaBreached,
      averageFirstResponseMinutes: average(summary.responseMinutes),
      averageResolutionMinutes: average(summary.resolutionMinutes),
    },
  };
}

async function hydrateTargets(applications) {
  const jobIds = new Set();
  const gigIds = new Set();
  const projectIds = new Set();

  applications.forEach((application) => {
    const base = application.toPublicObject();
    if (base.targetType === 'job') {
      jobIds.add(base.targetId);
    } else if (base.targetType === 'gig') {
      gigIds.add(base.targetId);
    } else if (base.targetType === 'project') {
      projectIds.add(base.targetId);
    }
  });

  const [jobs, gigs, projects] = await Promise.all([
    jobIds.size
      ? Job.findAll({ where: { id: { [Op.in]: Array.from(jobIds) } } })
      : Promise.resolve([]),
    gigIds.size
      ? Gig.findAll({ where: { id: { [Op.in]: Array.from(gigIds) } } })
      : Promise.resolve([]),
    projectIds.size
      ? Project.findAll({ where: { id: { [Op.in]: Array.from(projectIds) } } })
      : Promise.resolve([]),
  ]);

  const map = new Map();
  jobs.forEach((job) => {
    const plain = toPlainTarget(job);
    if (plain) {
      map.set(`job:${job.id}`, plain);
    }
  });
  gigs.forEach((gig) => {
    const plain = toPlainTarget(gig);
    if (plain) {
      map.set(`gig:${gig.id}`, plain);
    }
  });
  projects.forEach((project) => {
    const plain = toPlainTarget(project);
    if (plain) {
      map.set(`project:${project.id}`, plain);
    }
  });

  return map;
}

async function loadDashboardPayload(userId, { bypassCache = false } = {}) {
  const profile = await profileService.getProfileOverview(userId, { bypassCache });
  const overviewPromise = userDashboardOverviewService.getOverview(userId, {
    bypassCache,
    actorId: userId,
    actorRoles: ['user'],
  });
  const networkingPromise = userNetworkingService.getOverview(userId);
  const walletOverviewPromise = walletManagementService.getWalletOverview(userId, { bypassCache });

  const applicationQuery = Application.findAll({
    where: { applicantId: userId },
    include: [
      {
        model: ApplicationReview,
        as: 'reviews',
        include: [{ model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      },
    ],
    order: [
      ['updatedAt', 'DESC'],
      ['id', 'DESC'],
    ],
    limit: 40,
  });

  const pipelineQuery = Application.findAll({
    where: { applicantId: userId },
    attributes: ['status', [fn('COUNT', col('status')), 'count']],
    group: ['status'],
  });

  const notificationsQuery = Notification.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit: 12,
  });

  const launchpadApplicationsQuery = ExperienceLaunchpadApplication.findAll({
    where: { applicantId: userId },
    include: [{ model: ExperienceLaunchpad, as: 'launchpad' }],
    order: [['updatedAt', 'DESC']],
  });

  const projectEventsQuery = ProjectAssignmentEvent.findAll({
    where: { actorId: userId },
    include: [{ model: Project, as: 'project' }],
    order: [['createdAt', 'DESC']],
    limit: 12,
  });

  const disputeOverviewPromise = userDisputeService.getUserDisputeOverview(userId).catch(() => ({
    summary: {
      total: 0,
      openCount: 0,
      awaitingCustomerAction: 0,
      escalatedCount: 0,
      lastUpdatedAt: null,
      upcomingDeadlines: [],
    },
    metadata: {
      stages: [],
      statuses: [],
      priorities: [],
      reasonCodes: [],
      actionTypes: [],
      actorTypes: [],
    },
    permissions: { canCreate: false },
  }));

  const careerSnapshotsQuery = CareerAnalyticsSnapshot.findAll({
    where: { userId },
    order: [['timeframeEnd', 'DESC']],
    limit: 6,
  });

  const peerBenchmarksQuery = CareerPeerBenchmark.findAll({
    where: { userId },
    order: [['capturedAt', 'DESC']],
    limit: 12,
  });

  const digestSubscriptionQuery = WeeklyDigestSubscription.findOne({ where: { userId } });

  const calendarWindowStart = new Date();
  calendarWindowStart.setDate(calendarWindowStart.getDate() - 14);
  const calendarWindowEnd = new Date();
  calendarWindowEnd.setDate(calendarWindowEnd.getDate() + 30);

  const calendarIntegrationsQuery = CalendarIntegration.findAll({
    where: { userId },
    order: [['provider', 'ASC']],
  });

  const calendarEventsQuery = CandidateCalendarEvent.findAll({
    where: {
      userId,
      startsAt: { [Op.between]: [calendarWindowStart, calendarWindowEnd] },
    },
    order: [['startsAt', 'ASC']],
    limit: 40,
  });

  const calendarSettingsQuery = UserCalendarSetting.findOne({ where: { userId } });

  const focusSessionsQuery = FocusSession.findAll({
    where: { userId },
    order: [['startedAt', 'DESC']],
    limit: 12,
  });

  const collaborationsQuery = AdvisorCollaboration.findAll({
    where: { ownerId: userId },
    include: [
      {
        model: AdvisorCollaborationMember,
        as: 'members',
        include: [{ model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      },
      { model: AdvisorDocumentRoom, as: 'documentRooms' },
    ],
    order: [['updatedAt', 'DESC']],
    limit: 5,
  });

  const supportCasesQuery = SupportCase.findAll({
    where: { escalatedBy: userId },
    include: [{ model: User, as: 'assignedAgent', attributes: ['id', 'firstName', 'lastName', 'email'] }],
    order: [['updatedAt', 'DESC']],
    limit: 10,
  });

  const automationLogsQuery = SupportAutomationLog.findAll({
    where: { userId },
    order: [['triggeredAt', 'DESC']],
    limit: 12,
  });

  const knowledgeArticlesQuery = SupportKnowledgeArticle.findAll({
    where: { audience: { [Op.in]: ['freelancer', 'support_team'] } },
    order: [['lastReviewedAt', 'DESC']],
  });

  const documentWorkspaceQuery = CareerDocument.findAll({
    where: { userId },
    include: [
      {
        model: CareerDocumentVersion,
        as: 'versions',
        separate: true,
        limit: 5,
        order: [['versionNumber', 'DESC']],
        include: [
          { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: User, as: 'approvedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
        ],
      },
      {
        model: CareerDocumentCollaborator,
        as: 'collaborators',
        include: [{ model: User, as: 'collaborator', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      },
      {
        model: CareerDocumentAnalytics,
        as: 'analytics',
        separate: true,
        limit: 50,
        order: [['updatedAt', 'DESC']],
        include: [{ model: User, as: 'viewer', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      },
      {
        model: CareerDocumentExport,
        as: 'exports',
        separate: true,
        limit: 10,
        order: [['exportedAt', 'DESC']],
        include: [{ model: User, as: 'exportedBy', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      },
    ],
    order: [['updatedAt', 'DESC']],
  });

  const storyBlocksQuery = CareerStoryBlock.findAll({
    where: { userId },
    order: [['updatedAt', 'DESC']],
    limit: 20,
  });

  const brandAssetsQuery = CareerBrandAsset.findAll({
    where: { userId },
    order: [['updatedAt', 'DESC']],
    limit: 30,
  });

  const escrowAccountsQuery = EscrowAccount.findAll({
    where: { userId },
    include: [
      {
        model: EscrowTransaction,
        as: 'transactions',
        separate: true,
        limit: 10,
        order: [['createdAt', 'DESC']],
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  const escrowTransactionsQuery = EscrowTransaction.findAll({
    include: [
      {
        model: EscrowAccount,
        as: 'account',
        where: { userId },
        required: true,
      },
      { model: User, as: 'initiator', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'counterparty', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
    order: [['createdAt', 'DESC']],
    limit: 75,
  });

  const escrowDisputesQuery = DisputeCase.findAll({
    include: [
      {
        model: EscrowTransaction,
        as: 'transaction',
        required: true,
        include: [
          {
            model: EscrowAccount,
            as: 'account',
            where: { userId },
            required: true,
          },
        ],
      },
      { model: User, as: 'openedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'assignedTo', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
    order: [['openedAt', 'DESC']],
    limit: 30,
  });

  const purchasedGigOrdersQuery = GigOrder.findAll({
    where: { freelancerId: userId },
    include: [
      { model: Gig, as: 'gig', attributes: ['id', 'title'] },
      { model: GigOrderRequirement, as: 'requirements' },
      { model: GigOrderRevision, as: 'revisions' },
      { model: GigOrderEscrowCheckpoint, as: 'escrowCheckpoints' },
      {
        model: GigVendorScorecard,
        as: 'vendorScorecards',
        include: [
          { model: User, as: 'vendor', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: User, as: 'reviewedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
        ],
      },
    ],
    order: [['updatedAt', 'DESC']],
    limit: 8,
  });

  const projectParticipationQuery = ProjectAssignmentEvent.findAll({
    where: { actorId: userId },
    attributes: [[fn('DISTINCT', col('projectId')), 'projectId']],
    raw: true,
  });
  const topSearchModulePromise = loadTopSearchModule(userId);
  const communityManagementPromise = communityManagementService.getCommunityManagementSnapshot(userId);

  const mentoringDashboardPromise = userMentoringService.getMentoringDashboard(userId, { bypassCache });

  const creationStudioQuery = creationStudioService.getDashboardSnapshot(userId);

  const [
    applications,
    pipelineRows,
    notifications,
    launchpadApplications,
    projectEvents,
    careerSnapshots,
    peerBenchmarks,
    digestSubscription,
    calendarIntegrations,
    calendarEvents,
    calendarSettings,
    focusSessions,
    collaborations,
    supportCases,
    automationLogs,
    knowledgeArticles,
    documentRecords,
    storyBlocks,
    brandAssets,
    escrowAccounts,
    escrowTransactions,
    escrowDisputes,
    purchasedGigOrders,
    mentoringDashboard,
    careerPipelineAutomation,
    affiliateProgram,
    projectParticipation,
    creationStudio,
    volunteeringManagement,
    eventManagement,
    notificationPreferences,
    notificationStats,
    topSearchModule,
    communityManagement,
    walletOverview,
  ] = await Promise.all([
    applicationQuery,
    pipelineQuery,
    notificationsQuery,
    launchpadApplicationsQuery,
    projectEventsQuery,
    careerSnapshotsQuery,
    peerBenchmarksQuery,
    digestSubscriptionQuery,
    calendarIntegrationsQuery,
    calendarEventsQuery,
    calendarSettingsQuery,
    focusSessionsQuery,
    collaborationsQuery,
    supportCasesQuery,
    automationLogsQuery,
    knowledgeArticlesQuery,
    documentWorkspaceQuery,
    storyBlocksQuery,
    brandAssetsQuery,
    escrowAccountsQuery,
    escrowTransactionsQuery,
    escrowDisputesQuery,
    purchasedGigOrdersQuery,
    mentoringDashboardPromise,
    careerPipelineAutomationService.getCareerPipelineAutomation(userId, { bypassCache }),
    affiliateDashboardService.getAffiliateDashboard(userId),
    projectParticipationQuery,
    creationStudioQuery,
    volunteeringManagementService.getUserVolunteeringManagement(userId, { bypassCache }),
    eventManagementService.getUserEventManagement(userId, { includeArchived: false, limit: 6 }),
    notificationService.getPreferences(userId),
    notificationService.getStats(userId),
    topSearchModulePromise,
    communityManagementPromise,
    walletOverviewPromise,
  ]);

  const sanitizedStoryPrompts = storyBlocks.map((block) => sanitizeStoryBlock(block)).filter(Boolean);

  await ensureProjectTemplatesSeeded();

  const projectIdSet = new Set(
    (projectParticipation ?? [])
      .map((record) => Number(record.projectId))
      .filter((id) => Number.isInteger(id) && id > 0),
  );

  projectEvents.forEach((event) => {
    if (event.projectId) {
      projectIdSet.add(Number(event.projectId));
    }
    const projectInstance = event.get?.('project') ?? event.project;
    if (projectInstance?.id) {
      projectIdSet.add(Number(projectInstance.id));
    }
  });

  const projectIdList = Array.from(projectIdSet).slice(0, 6);

  if (projectIdList.length) {
    await Promise.all(
      projectIdList.map((projectId) => ensureProjectDeliveryScaffolding(projectId, { actorId: userId })),
    );
  }

  const projectIncludes = [
    {
      model: ProjectWorkspace,
      as: 'workspace',
      include: [
        { model: ProjectWorkspaceBrief, as: 'brief' },
        { model: ProjectWorkspaceFile, as: 'files' },
        { model: ProjectWorkspaceApproval, as: 'approvals' },
        { model: ProjectWorkspaceConversation, as: 'conversations' },
      ],
    },
    {
      model: ProjectMilestone,
      as: 'milestones',
      include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] }],
    },
    {
      model: ProjectCollaborator,
      as: 'collaborators',
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    },
    { model: ProjectIntegration, as: 'integrations' },
    {
      model: ProjectRetrospective,
      as: 'retrospectives',
      include: [
        { model: ProjectMilestone, as: 'milestone' },
        { model: User, as: 'authoredBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    },
  ];

  let projectRecords = [];
  if (projectIdList.length) {
    projectRecords = await Project.findAll({
      where: { id: projectIdList },
      include: projectIncludes,
      order: [['updatedAt', 'DESC']],
    });
  }

  if (!projectRecords.length) {
    const fallbackProjects = await Project.findAll({ order: [['updatedAt', 'DESC']], limit: 2 });
    const fallbackIds = fallbackProjects.map((project) => project.id);
    if (fallbackIds.length) {
      await Promise.all(
        fallbackIds.map((projectId) => ensureProjectDeliveryScaffolding(projectId, { actorId: userId })),
      );
      projectRecords = await Project.findAll({
        where: { id: fallbackIds },
        include: projectIncludes,
        order: [['updatedAt', 'DESC']],
      });
    }
  }

  const projectTemplates = await ProjectTemplate.findAll({ order: [['updatedAt', 'DESC']], limit: 6 });

  const collaborationIds = collaborations.map((collaboration) => collaboration.id);
  const auditLogs = collaborationIds.length
    ? await AdvisorCollaborationAuditLog.findAll({
        where: { collaborationId: { [Op.in]: collaborationIds } },
        include: [{ model: User, as: 'actor', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        order: [['createdAt', 'DESC']],
        limit: 40,
      })
    : [];

  const targetMap = await hydrateTargets(applications);
  const sanitizedApplications = applications.map((application) => sanitizeApplication(application, targetMap));
  const attachments = collectAttachments(applications);

  const pipeline = pipelineRows.map((row) => {
    const plain = row.get({ plain: true });
    const count = Number(plain.count ?? plain[0] ?? plain['count']);
    return {
      status: plain.status,
      count: Number.isFinite(count) ? count : 0,
    };
  });

  const totals = sanitizedApplications.reduce(
    (accumulator, application) => {
      accumulator.total += 1;
      if (!TERMINAL_STATUSES.has(application.status)) {
        accumulator.active += 1;
      }
      if (INTERVIEW_STATUSES.has(application.status)) {
        accumulator.interviews += 1;
      }
      if (OFFER_STATUSES.has(application.status)) {
        accumulator.offers += 1;
      }
      if (Array.isArray(application.attachments)) {
        accumulator.documents += application.attachments.length;
      }
      return accumulator;
    },
    { total: 0, active: 0, interviews: 0, offers: 0, documents: 0 },
  );

  const unreadCount = notifications.filter((notification) => !notification.readAt).length;
  const sanitizedNotifications = notifications.map((notification) => sanitizeNotification(notification));
  const sanitizedLaunchpad = launchpadApplications.map((record) => sanitizeLaunchpadApplication(record));
  const sanitizedProjectEvents = projectEvents.map((event) => sanitizeProjectEvent(event));

  const sanitizedBrandAssets = brandAssets.map((asset) => sanitizeBrandAsset(asset)).filter(Boolean);
  const sanitizedPurchasedGigOrders = purchasedGigOrders
    .map((order) => sanitizeGigOrderForDocument(order))
    .filter(Boolean);

  const defaultEscrowCurrency =
    profile?.preferredCurrency ??
    profile?.currency ??
    profile?.profile?.preferredCurrency ??
    'USD';

  const escrowManagement = buildEscrowManagementSection({
    accounts: escrowAccounts,
    transactions: escrowTransactions,
    disputes: escrowDisputes,
    defaultCurrency: defaultEscrowCurrency,
  });

  const projectGigManagement = buildProjectGigManagementSection({
    projects: projectRecords,
    templates: projectTemplates,
    gigOrders: sanitizedPurchasedGigOrders,
    storyBlocks: sanitizedStoryPrompts,
    brandAssets: sanitizedBrandAssets,
  });

  const finance = buildFinanceSnapshot(walletOverview);

  const projectWorkspaceSummary = await getProjectWorkspaceSummary(userId);

  const followUps = buildFollowUps(applications, targetMap);

  const automations = [];
  if (profile.launchpadEligibility?.status === 'eligible' && profile.launchpadEligibility?.score != null) {
    automations.push({
      title: 'Launchpad readiness',
      detail: `Score ${profile.launchpadEligibility.score}`,
      recommendation:
        'Schedule a strategy session with your Launchpad mentor to leverage your readiness score before the next cohort deadline.',
    });
  }
  if (profile.availability?.status === 'limited') {
    automations.push({
      title: 'Availability signal',
      detail: 'Limited availability',
      recommendation: 'Update availability to unlock more recruiter matches and auto-apply opportunities.',
    });
  }
  if (totals.documents < 2) {
    automations.push({
      title: 'Document library',
      detail: `${totals.documents} uploaded`,
      recommendation: 'Upload at least two tailored CVs to improve conversion tracking per role type.',
    });
  }

  const interviews = sanitizedApplications
    .filter((application) => INTERVIEW_STATUSES.has(application.status))
    .map((application) => {
      const targetName = application.target?.title || application.target?.name || `#${application.targetId}`;
      const scheduledReview = application.reviews.find((review) => review.stage === 'interview');
      const scheduledAt = scheduledReview?.decidedAt ?? application.metadata?.interviewScheduledAt ?? null;
      return {
        applicationId: application.id,
        targetName,
        scheduledAt,
        reviewer: scheduledReview?.reviewer ?? null,
        status: application.status,
        nextStep: application.nextStep,
      };
    });

  const documentWorkspace = documentRecords.map((record) => sanitizeCareerDocument(record)).filter(Boolean);
  const documentStudio = buildDocumentStudio(
    documentWorkspace,
    sanitizedStoryPrompts,
    sanitizedBrandAssets,
    sanitizedPurchasedGigOrders,
  );

  const documents = {
    attachments,
    portfolioLinks: Array.isArray(profile.portfolioLinks) ? profile.portfolioLinks : [],
    lastUpdatedAt: attachments.reduce((latest, attachment) => {
      const timestamp = attachment.uploadedAt ? new Date(attachment.uploadedAt).getTime() : 0;
      return timestamp > latest ? timestamp : latest;
    }, 0),
    workspace: documentWorkspace,
  };
  if (documents.lastUpdatedAt) {
    documents.lastUpdatedAt = new Date(documents.lastUpdatedAt).toISOString();
  } else {
    documents.lastUpdatedAt = null;
  }

  const metricsSnapshot = {
    projectsActive: projectGigManagement.summary?.activeProjects ?? 0,
    gigOrdersOpen: projectGigManagement.summary?.openGigOrders ?? 0,
    escrowInFlight:
      escrowManagement.summary?.openMilestones ??
      escrowManagement.summary?.releaseQueueSize ??
      0,
    walletBalance: finance.totalBalance,
    walletCurrency: finance.primaryCurrency,
  };

  const summary = {
    totalApplications: totals.total,
    activeApplications: totals.active,
    interviewsScheduled: totals.interviews,
    offersNegotiating: totals.offers,
    documentsUploaded: totals.documents,
    connections: profile.connectionsCount ?? profile.metrics?.connectionsCount ?? 0,
  };

  summary.openGigOrders = summary.openGigOrders ?? metricsSnapshot.gigOrdersOpen;
  summary.walletBalance = finance.totalBalance;
  summary.walletCurrency = finance.primaryCurrency;
  summary.escrowInFlight = metricsSnapshot.escrowInFlight;

  if (affiliateProgram?.overview) {
    summary.affiliateEarnings = affiliateProgram.overview.lifetimeEarnings ?? 0;
    summary.affiliatePendingPayouts = affiliateProgram.overview.pendingPayouts ?? 0;
    summary.affiliateConversionRate = affiliateProgram.overview.conversionRate ?? 0;
  }

  const careerAnalytics = buildCareerAnalyticsInsights(careerSnapshots, peerBenchmarks);
  const calendarInsights = buildCalendarInsights(
    calendarEvents,
    focusSessions,
    calendarIntegrations,
    calendarSettings,
  );
  const advisorInsights = buildAdvisorInsights(collaborations, auditLogs);
  const supportDesk = buildSupportDeskInsights(supportCases, automationLogs, knowledgeArticles);

  const digestPlain = digestSubscription?.toPublicObject?.() ?? digestSubscription?.get?.({ plain: true }) ?? null;
  const weeklyDigest = {
    subscription: digestPlain
      ? {
          frequency: digestPlain.frequency,
          channels: Array.isArray(digestPlain.channels) ? digestPlain.channels : [],
          isActive: Boolean(digestPlain.isActive),
          lastSentAt: digestPlain.lastSentAt ?? null,
          nextScheduledAt: digestPlain.nextScheduledAt ?? null,
          metadata: digestPlain.metadata ?? null,
        }
      : null,
    integrations: Array.isArray(calendarInsights.integrations)
      ? calendarInsights.integrations.map((integration) => ({ ...integration }))
      : [],
  };

  const adKeywordHints = [
    profile?.headline ?? null,
    profile?.role ?? null,
    ...sanitizedApplications.map((application) => application.target?.title).filter(Boolean),
  ].filter(Boolean);

  const adJobIds = [];
  const adGigIds = [];
  targetMap.forEach((target, key) => {
    if (!target) {
      return;
    }
    if (key.startsWith('job:') && Number.isInteger(Number(target.id))) {
      adJobIds.push(Number(target.id));
    } else if (key.startsWith('gig:') && Number.isInteger(Number(target.id))) {
      adGigIds.push(Number(target.id));
    }
  });

  const [networking, disputeOverview, ads] = await Promise.all([
    networkingPromise,
    disputeOverviewPromise,
    getAdDashboardSnapshot({
      surfaces: ['user_dashboard', 'global_dashboard'],
      context: {
        keywordHints: adKeywordHints,
        opportunityTargets: [
          ...(adJobIds.length ? [{ targetType: 'job', ids: adJobIds }] : []),
          ...(adGigIds.length ? [{ targetType: 'gig', ids: adGigIds }] : []),
        ],
      },
    }),
  ]);

  const websitePreferences = await getUserWebsitePreferences(normalizedUserId);

  const jobApplicationsWorkspace = await getJobApplicationWorkspaceSnapshot(userId, {
    actorId: userId,
    limit: 30,
  });

  const profileHub = await profileHubService.getProfileHub(userId, {
    bypassCache,
    profileOverview: profile,
  });

  const overview = await overviewPromise;

  return {
    generatedAt: new Date().toISOString(),
    profile,
    overview,
    profileHub,
    summary,
    pipeline: {
      statuses: pipeline,
      lastActivityAt: sanitizedApplications[0]?.updatedAt ?? null,
    },
    applications: {
      recent: sanitizedApplications.slice(0, 10),
    },
    interviews,
    documents,
    documentStudio,
    notifications: {
      unreadCount,
      recent: sanitizedNotifications,
      preferences: notificationPreferences,
      stats: notificationStats,
    },
    launchpad: {
      applications: sanitizedLaunchpad,
    },
    projectActivity: {
      recent: sanitizedProjectEvents,
    },
    creationStudio,
    escrowManagement,
    projectGigManagement,
    finance,
    wallet: finance,
    projectWorkspace: {
      summary: projectWorkspaceSummary,
    },
    eventManagement,
    tasks: {
      followUps,
      automations,
    },
    jobApplicationsWorkspace,
    networking,
    metrics: metricsSnapshot,
    insights: {
      careerAnalytics,
      weeklyDigest,
      calendar: calendarInsights,
      advisorCollaboration: advisorInsights,
      supportDesk,
    },
    affiliate: affiliateProgram,
    mentoring: mentoringDashboard,
    disputeManagement: disputeOverview,
    careerPipelineAutomation,
    ads,
    volunteeringManagement,
    communityManagement,
    websitePreferences,
    topSearch: topSearchModule,
  };
}

export async function getUserDashboard(userId, { bypassCache = false } = {}) {
  const normalizedUserId = normalizeUserId(userId);
  const cacheKey = buildCacheKey(CACHE_NAMESPACE, { userId: normalizedUserId });

  if (bypassCache) {
    return loadDashboardPayload(normalizedUserId, { bypassCache: true });
  }

  return appCache.remember(cacheKey, CACHE_TTL_SECONDS, () =>
    loadDashboardPayload(normalizedUserId, { bypassCache: false }),
  );
}

export default {
  getUserDashboard,
};
