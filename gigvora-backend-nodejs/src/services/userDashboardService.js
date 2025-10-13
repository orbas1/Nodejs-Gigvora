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
  Project,
  ProjectAssignmentEvent,
  Notification,
  User,
  CareerDocument,
  CareerDocumentVersion,
  CareerDocumentCollaborator,
  CareerDocumentAnalytics,
  CareerDocumentExport,
  CareerStoryBlock,
  CareerBrandAsset,
} from '../models/index.js';
import profileService from './profileService.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import { ValidationError } from '../utils/errors.js';
import careerPipelineAutomationService from './careerPipelineAutomationService.js';

const CACHE_NAMESPACE = 'dashboard:user';
const CACHE_TTL_SECONDS = 60;

const TERMINAL_STATUSES = new Set(['withdrawn', 'rejected', 'hired']);
const OFFER_STATUSES = new Set(['offered', 'hired']);
const INTERVIEW_STATUSES = new Set(['interview']);
const FOLLOW_UP_STATUSES = new Set(['submitted', 'under_review', 'shortlisted', 'interview', 'offered']);

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
  const base = blockInstance.toPublicObject();
  return {
    ...base,
    metrics: base.metrics ?? {},
  };
}

function sanitizeBrandAsset(assetInstance) {
  if (!assetInstance) return null;
  const base = assetInstance.toPublicObject();
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
  const base = orderInstance.toPublicObject();
  const gigInstance = orderInstance.get?.('gig') ?? orderInstance.gig;
  const requirementsRaw = orderInstance.get?.('requirements') ?? orderInstance.requirements;
  const revisionsRaw = orderInstance.get?.('revisions') ?? orderInstance.revisions;
  const requirements = Array.isArray(requirementsRaw)
    ? requirementsRaw.map((req) => req.toPublicObject())
    : [];
  const revisions = Array.isArray(revisionsRaw)
    ? revisionsRaw.map((revision) => revision.toPublicObject())
    : [];
  const outstandingRequirements = requirements.filter((item) => item.status === 'pending').length;
  const activeRevisions = revisions.filter((item) => ['requested', 'in_progress', 'submitted'].includes(item.status)).length;
  const nextRequirementDue = requirements
    .filter((item) => item.status === 'pending' && item.dueAt)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())[0] || null;
  return {
    ...base,
    gig: gigInstance?.toPublicObject?.() ?? gigInstance ?? null,
    requirements,
    revisions,
    outstandingRequirements,
    activeRevisions,
    nextRequirementDueAt: nextRequirementDue?.dueAt ?? null,
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

  const purchasedGigOrdersQuery = GigOrder.findAll({
    where: { freelancerId: userId },
    include: [
      { model: Gig, as: 'gig', attributes: ['id', 'title'] },
      { model: GigOrderRequirement, as: 'requirements' },
      { model: GigOrderRevision, as: 'revisions' },
    ],
    order: [['updatedAt', 'DESC']],
    limit: 8,
  });

  const [
    applications,
    pipelineRows,
    notifications,
    launchpadApplications,
    projectEvents,
    documentRecords,
    storyBlocks,
    brandAssets,
    purchasedGigOrders,
    careerPipelineAutomation,
  ] = await Promise.all([
    applicationQuery,
    pipelineQuery,
    notificationsQuery,
    launchpadApplicationsQuery,
    projectEventsQuery,
    documentWorkspaceQuery,
    storyBlocksQuery,
    brandAssetsQuery,
    purchasedGigOrdersQuery,
    careerPipelineAutomationService.getCareerPipelineAutomation(userId, { bypassCache }),
  ]);

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
  const documentStudio = buildDocumentStudio(documentWorkspace, storyBlocks, brandAssets, purchasedGigOrders);

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

  const summary = {
    totalApplications: totals.total,
    activeApplications: totals.active,
    interviewsScheduled: totals.interviews,
    offersNegotiating: totals.offers,
    documentsUploaded: totals.documents,
    connections: profile.connectionsCount ?? profile.metrics?.connectionsCount ?? 0,
  };

  return {
    generatedAt: new Date().toISOString(),
    profile,
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
    },
    launchpad: {
      applications: sanitizedLaunchpad,
    },
    projectActivity: {
      recent: sanitizedProjectEvents,
    },
    tasks: {
      followUps,
      automations,
    },
    careerPipelineAutomation,
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
