import { Op } from 'sequelize';
import {
  sequelize,
  ProviderWorkspace,
  ProviderWorkspaceMember,
  ProviderContactNote,
  Application,
  ApplicationReview,
  Project,
  User,
  Profile,
  MessageThread,
  Message,
  SupportKnowledgeArticle,
  ClientEngagement,
  ClientEngagementMandate,
  ClientEngagementMilestone,
  ClientEngagementPortal,
  ClientEngagementPortalAuditLog,
  EngagementInvoice,
  EngagementCommissionSplit,
  EngagementScheduleEvent,
  IssueResolutionCase,
  IssueResolutionEvent,
  HeadhunterPipelineStage,
  HeadhunterPipelineItem,
  HeadhunterPipelineNote,
  HeadhunterPipelineAttachment,
  HeadhunterPipelineInterview,
  HeadhunterPassOnShare,
  ProspectIntelligenceProfile,
  ProspectIntelligenceSignal,
  ProspectSearchDefinition,
  ProspectSearchAlert,
  ProspectCampaign,
  ProspectCampaignStep,
  ProspectResearchNote,
  ProspectResearchTask,
} from '../models/index.js';
import {
  ProviderAvailabilityWindow,
  ProviderWellbeingLog,
} from '../models/headhunterExtras.js';
import { NotFoundError } from '../utils/errors.js';
import { appCache, buildCacheKey } from '../utils/cache.js';

const DASHBOARD_CACHE_TTL_SECONDS = 45;
const MAX_LOOKBACK_DAYS = 120;
const MIN_LOOKBACK_DAYS = 7;

const DEFAULT_HEADHUNTER_PIPELINE_STAGES = [
  {
    name: 'Prospect discovery',
    stageType: 'discovery',
    winProbability: 10,
    metadata: { summary: 'Sourcing leads, referrals, and inbound prospects.' },
  },
  {
    name: 'Qualification',
    stageType: 'qualification',
    winProbability: 25,
    metadata: { summary: 'Initial screening, motivation, and mandate fit.' },
  },
  {
    name: 'Interview loop',
    stageType: 'interview',
    winProbability: 55,
    metadata: { summary: 'Client interviews, prep, and feedback orchestration.' },
  },
  {
    name: 'Offer & negotiation',
    stageType: 'offer',
    winProbability: 75,
    metadata: { summary: 'Final references, compensation alignment, and approvals.' },
  },
  {
    name: 'Placement & onboarding',
    stageType: 'placement',
    winProbability: 95,
    metadata: { summary: 'Placement coordination, onboarding success plan.' },
  },
  {
    name: 'Pass-on & nurture',
    stageType: 'archive',
    winProbability: 0,
    metadata: { summary: 'Nurture talent for future mandates or partner referrals.' },
  },
];

const STAGE_BUCKETS = {
  prospecting: {
    label: 'Prospecting',
    statuses: ['draft', 'submitted'],
  },
  screening: {
    label: 'Screening',
    statuses: ['under_review', 'shortlisted'],
  },
  interviewing: {
    label: 'Interviewing',
    statuses: ['interview'],
  },
  offering: {
    label: 'Offer & Negotiation',
    statuses: ['offered'],
  },
  placement: {
    label: 'Placement',
    statuses: ['hired'],
  },
  closed: {
    label: 'Closed/Lost',
    statuses: ['rejected', 'withdrawn'],
  },
};

function normaliseNumber(value) {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normaliseMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }
  return metadata;
}

function asArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value == null) {
    return [];
  }
  return [value];
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function average(values = []) {
  const numericValues = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
  if (!numericValues.length) {
    return null;
  }
  const total = numericValues.reduce((sum, value) => sum + value, 0);
  return Number((total / numericValues.length).toFixed(1));
}

function sumNumbers(values) {
  return values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);
}

function computePercentage(part, total) {
  if (!total || !Number.isFinite(part)) {
    return 0;
  }
  return Number(((part / total) * 100).toFixed(1));
}

function toDaysBetween(start, end) {
  if (!start || !end) {
    return null;
  }
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) {
    return null;
  }
  return Number((diffMs / (1000 * 60 * 60 * 24)).toFixed(1));
}

function formatDecimal(value, digits = 2) {
  const numeric = normaliseNumber(value);
  if (numeric == null) {
    return null;
  }
  return Number(numeric.toFixed(digits));
}

function computeAverage(values = [], digits = 2) {
  const filtered = values.filter((value) => Number.isFinite(value));
  if (!filtered.length) {
    return null;
  }
  const total = sumNumbers(filtered);
  return Number((total / filtered.length).toFixed(digits));
}

function computeHoursBetween(start, end) {
  if (!start || !end) {
    return null;
  }
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  if (!Number.isFinite(diffMs) || diffMs <= 0) {
    return null;
  }
  return Number((diffMs / (1000 * 60 * 60)).toFixed(2));
function toNumberOrNull(value) {
  if (value == null) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function ensureArray(value) {
  if (Array.isArray(value)) {
    return value.filter((entry) => entry != null);
  }
  if (value == null) {
    return [];
  }
  return [value];
}

function mapSentimentToScore(sentiment) {
  const normalised = `${sentiment ?? 'neutral'}`.toLowerCase();
  switch (normalised) {
    case 'delighted':
    case 'positive':
    case 'excited':
      return 1;
    case 'optimistic':
    case 'warm':
      return 0.6;
    case 'neutral':
    case 'steady':
      return 0;
    case 'caution':
    case 'mixed':
    case 'guarded':
      return -0.3;
    case 'risk':
    case 'concern':
    case 'negative':
    case 'fatigue':
      return -0.8;
    default:
      return 0;
  }
}

function determineDominantRiskFromCounts({ low = 0, medium = 0, high = 0 } = {}) {
  if (high > 0) {
    return 'high';
  }
  if (medium > 0) {
    return 'medium';
  }
  return 'low';
}

function isWithinLastDays(date, days) {
  if (!date || !days) {
    return false;
  }
  const parsed = new Date(date);
  if (!Number.isFinite(parsed.getTime())) {
    return false;
  }
  const diffMs = Date.now() - parsed.getTime();
  const threshold = Number(days) * 24 * 60 * 60 * 1000;
  return diffMs >= 0 && diffMs <= threshold;
}

function sanitizeWorkspace(workspace) {
  if (!workspace) return null;
  const plain = workspace.get({ plain: true });
  const members = Array.isArray(plain.members) ? plain.members : [];
  const activeMembers = members.filter((member) => member.status === 'active');
  const pendingMembers = members.filter((member) => member.status === 'pending');

  return {
    id: plain.id,
    name: plain.name,
    slug: plain.slug,
    type: plain.type,
    timezone: plain.timezone,
    defaultCurrency: plain.defaultCurrency,
    intakeEmail: plain.intakeEmail,
    isActive: plain.isActive,
    memberCounts: {
      total: members.length,
      active: activeMembers.length,
      pending: pendingMembers.length,
    },
    members: members.map((member) => ({
      id: member.id,
      userId: member.userId,
      role: member.role,
      status: member.status,
      invitedById: member.invitedById,
      joinedAt: member.joinedAt,
      lastActiveAt: member.lastActiveAt,
      user: member.member
        ? {
            id: member.member.id,
            firstName: member.member.firstName,
            lastName: member.member.lastName,
            email: member.member.email,
          }
        : null,
    })),
  };
}

async function ensureWorkspacePipelineStages(workspaceId) {
  if (!workspaceId) {
    return;
  }

  const existing = await HeadhunterPipelineStage.count({ where: { workspaceId } });
  if (existing > 0) {
    return;
  }

  await sequelize.transaction(async (transaction) => {
    const recheck = await HeadhunterPipelineStage.count({ where: { workspaceId }, transaction });
    if (recheck > 0) {
      return;
    }

    await HeadhunterPipelineStage.bulkCreate(
      DEFAULT_HEADHUNTER_PIPELINE_STAGES.map((stage, index) => ({
        ...stage,
        workspaceId,
        position: index,
        isDefault: true,
      })),
      { transaction },
    );
  });
}

function deriveWorkspaceBadges({ conversionRates, memberCounts, mandateTotals }) {
  const badges = [];
  if (conversionRates.placements >= 0.3) {
    badges.push('High placement velocity');
  }
  if (conversionRates.screening >= 0.5) {
    badges.push('Effective prospect qualification');
  }
  if (memberCounts.active > 8) {
    badges.push('Scaled headhunter pod');
  }
  if ((mandateTotals?.pipelineValue ?? 0) > 500000) {
    badges.push('Seven-figure pipeline');
  }
  return badges;
}

function determineStageKey(status) {
  const entry = Object.entries(STAGE_BUCKETS).find(([, bucket]) => bucket.statuses.includes(status));
  return entry ? entry[0] : 'prospecting';
}

function buildStageBreakdown(applications) {
  const totals = Object.fromEntries(Object.keys(STAGE_BUCKETS).map((key) => [key, 0]));
  const valueTotals = Object.fromEntries(Object.keys(STAGE_BUCKETS).map((key) => [key, 0]));

  applications.forEach((application) => {
    const key = determineStageKey(application.status);
    totals[key] += 1;
    if (application.rateExpectation != null) {
      const numeric = Number(application.rateExpectation);
      if (Number.isFinite(numeric)) {
        valueTotals[key] += numeric;
      }
    }
  });

  const totalApplications = applications.length || 1;

  return Object.entries(STAGE_BUCKETS).map(([key, bucket]) => ({
    key,
    label: bucket.label,
    count: totals[key],
    valueTotal: Number(valueTotals[key].toFixed(2)),
    percentage: computePercentage(totals[key], totalApplications),
    statuses: bucket.statuses,
  }));
}

function aggregateRecentActivity(applications) {
  const events = [];
  applications.forEach((application) => {
    const stageKey = determineStageKey(application.status);
    if (application.updatedAt) {
      events.push({
        type: 'application',
        stage: stageKey,
        status: application.status,
        occurredAt: application.updatedAt,
        applicationId: application.id,
        applicantId: application.applicantId,
        description: `${stageKey} status update`,
      });
    }
    if (Array.isArray(application.reviews)) {
      application.reviews
        .filter((review) => review.decidedAt)
        .forEach((review) => {
          events.push({
            type: 'review',
            stage: review.stage,
            status: review.decision,
            occurredAt: review.decidedAt,
            applicationId: application.id,
            applicantId: application.applicantId,
            description: `Review ${review.stage} • ${review.decision}`,
          });
        });
    }
  });

  return events
    .filter((event) => event.occurredAt)
    .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
    .slice(0, 15);
}

function computeAgingBuckets(applications) {
  const buckets = {
    '0-7': 0,
    '8-14': 0,
    '15-30': 0,
    '30+': 0,
  };

  applications
    .filter((application) => !['hired', 'rejected', 'withdrawn'].includes(application.status) && application.submittedAt)
    .forEach((application) => {
      const submittedAt = new Date(application.submittedAt);
      const diffDays = (Date.now() - submittedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (!Number.isFinite(diffDays) || diffDays < 0) {
        return;
      }
      if (diffDays <= 7) {
        buckets['0-7'] += 1;
      } else if (diffDays <= 14) {
        buckets['8-14'] += 1;
      } else if (diffDays <= 30) {
        buckets['15-30'] += 1;
      } else {
        buckets['30+'] += 1;
      }
    });

  return buckets;
}

function buildCandidateSpotlight(applications, candidateProfiles) {
  const candidatesById = new Map(candidateProfiles.map((candidate) => [candidate.id, candidate]));
  const map = new Map();

  applications.forEach((application) => {
    const candidate = candidatesById.get(application.applicantId);
    if (!candidate) {
      return;
    }
    const existing = map.get(candidate.id) ?? {
      userId: candidate.id,
      name: `${candidate.firstName} ${candidate.lastName}`.trim(),
      email: candidate.email,
      headline: candidate.Profile?.headline ?? null,
      location: candidate.Profile?.location ?? null,
      availability: candidate.Profile?.availabilityStatus ?? null,
      trustScore:
        candidate.Profile?.trustScore == null ? null : Number(Number(candidate.Profile.trustScore).toFixed(1)),
      interviews: 0,
      notes: [],
      lastInteractionAt: null,
      activeApplication: null,
    };

    if (!existing.activeApplication || new Date(existing.activeApplication.updatedAt) < new Date(application.updatedAt)) {
      existing.activeApplication = {
        applicationId: application.id,
        stage: determineStageKey(application.status),
        status: application.status,
        targetType: application.targetType,
        targetId: application.targetId,
        submittedAt: application.submittedAt,
        decisionAt: application.decisionAt,
        updatedAt: application.updatedAt,
      };
    }

    if (Array.isArray(application.reviews)) {
      existing.interviews += application.reviews.filter((review) => review.stage === 'interview').length;
    }

    const metadata = normaliseMetadata(application.metadata);
    if (metadata.notes) {
      const noteText = Array.isArray(metadata.notes) ? metadata.notes : [metadata.notes];
      noteText.filter(Boolean).forEach((note) => existing.notes.push(note));
    }

    const latestTouchpoint = metadata.lastTouchpointAt ?? application.updatedAt ?? application.submittedAt;
    if (latestTouchpoint && (!existing.lastInteractionAt || new Date(latestTouchpoint) > new Date(existing.lastInteractionAt))) {
      existing.lastInteractionAt = latestTouchpoint;
    }

    map.set(candidate.id, existing);
  });

  return Array.from(map.values())
    .sort((a, b) => {
      const scoreA = a.trustScore ?? 0;
      const scoreB = b.trustScore ?? 0;
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      const interviewsA = a.interviews ?? 0;
      const interviewsB = b.interviews ?? 0;
      return interviewsB - interviewsA;
    })
    .slice(0, 6);
}

function buildMandatePortfolio(applications, projects) {
  const projectsById = new Map(projects.map((project) => [project.id, project.get({ plain: true })]));
  const mandateMap = new Map();

  applications
    .filter((application) => application.targetType === 'project' && projectsById.has(application.targetId))
    .forEach((application) => {
      const project = projectsById.get(application.targetId);
      const key = project.id;
      const mandate =
        mandateMap.get(key) ?? {
          id: project.id,
          title: project.title,
          status: project.status ?? 'active',
          location: project.location ?? 'Remote',
          budgetAmount: project.budgetAmount == null ? null : Number(project.budgetAmount),
          budgetCurrency: project.budgetCurrency ?? 'USD',
          stageCounts: Object.fromEntries(Object.keys(STAGE_BUCKETS).map((stage) => [stage, 0])),
          lastActivityAt: null,
          clientName: project.clientName ?? null,
          value: 0,
          openRoles: 0,
          fillProbability: null,
        };

      const stageKey = determineStageKey(application.status);
      mandate.stageCounts[stageKey] += 1;
      if (!['hired', 'rejected', 'withdrawn'].includes(application.status)) {
        mandate.openRoles += 1;
      }
      if (application.rateExpectation != null) {
        mandate.value += Number(application.rateExpectation) || 0;
      }
      const latestActivity = application.updatedAt ?? application.decisionAt ?? application.submittedAt;
      if (latestActivity && (!mandate.lastActivityAt || new Date(latestActivity) > new Date(mandate.lastActivityAt))) {
        mandate.lastActivityAt = latestActivity;
      }
      const decision = toDaysBetween(application.submittedAt, application.decisionAt);
      if (decision != null) {
        mandate.fillProbability = mandate.fillProbability == null ? 0 : mandate.fillProbability;
        mandate.fillProbability += decision;
      }

      mandateMap.set(key, mandate);
    });

  const mandates = Array.from(mandateMap.values()).map((mandate) => {
    const placementCount = mandate.stageCounts.placement ?? 0;
    const offerCount = mandate.stageCounts.offering ?? 0;
    const denominator = offerCount || 1;
    const probability = placementCount ? Math.min(1, placementCount / denominator) : 0;
    return {
      ...mandate,
      value: Number(mandate.value.toFixed(2)),
      fillProbability: Number((probability * 100).toFixed(1)),
    };
  });

  const totals = {
    activeMandates: mandates.filter((mandate) => mandate.status !== 'archived' && mandate.status !== 'closed').length,
    pausedMandates: mandates.filter((mandate) => mandate.status === 'paused').length,
    pipelineValue: Number(sumNumbers(mandates.map((mandate) => mandate.value)).toFixed(2)),
    averageAging:
      mandates.length
        ? Number(
            (
              sumNumbers(
                mandates.map((mandate) => {
                  if (!mandate.lastActivityAt) {
                    return 0;
                  }
                  const diffDays = (Date.now() - new Date(mandate.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24);
                  return Number.isFinite(diffDays) && diffDays > 0 ? diffDays : 0;
                }),
              ) / mandates.length
            ).toFixed(1),
          )
        : 0,
  };

  return { mandates, totals };
}

function computeOutreachPerformance(threads, lookbackDate, workspace) {
  const relevantThreads = threads.filter((thread) => {
    const metadata = normaliseMetadata(thread.metadata);
    const workspaceIds = [metadata.headhunterWorkspaceId, metadata.agencyWorkspaceId, metadata.providerWorkspaceId]
      .map(normaliseNumber)
      .filter(Boolean);
    const slug = metadata.headhunterWorkspaceSlug;
    if (workspaceIds.length) {
      return workspaceIds.includes(workspace.id);
    }
    if (slug && workspace.slug) {
      return slug === workspace.slug;
    }
    return !metadata.workspaceScope || metadata.workspaceScope === 'global';
  });

  const campaignCount = relevantThreads.length;
  const totalMessages = sumNumbers(relevantThreads.map((thread) => thread.messages?.length ?? 0));
  const responseDurations = [];
  const channelStats = new Map();

  relevantThreads.forEach((thread) => {
    const messages = [...(thread.messages ?? [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    let lastOutboundTime = null;

    messages.forEach((message) => {
      const metadata = normaliseMetadata(message.metadata);
      const direction = metadata.direction ?? (message.senderId === workspace.ownerId ? 'outbound' : null);
      const channel = metadata.channel ?? 'in-app';
      const key = channel.toLowerCase();
      const stats = channelStats.get(key) ?? { channel: key, sent: 0, responses: 0 };

      if (direction === 'outbound') {
        stats.sent += 1;
        lastOutboundTime = message.createdAt;
      } else if (direction === 'inbound') {
        stats.responses += 1;
        if (lastOutboundTime) {
          const diffHours =
            (new Date(message.createdAt).getTime() - new Date(lastOutboundTime).getTime()) / (1000 * 60 * 60);
          if (Number.isFinite(diffHours) && diffHours >= 0) {
            responseDurations.push(diffHours);
          }
        }
      }

      channelStats.set(key, stats);
    });
  });

  const averageResponseHours = responseDurations.length
    ? Number((sumNumbers(responseDurations) / responseDurations.length).toFixed(2))
    : null;

  const channelBreakdown = Array.from(channelStats.values()).map((entry) => ({
    channel: entry.channel,
    sent: entry.sent,
    responses: entry.responses,
    conversion: entry.sent ? Number((entry.responses / entry.sent).toFixed(2)) : 0,
  }));

  const latestCampaigns = relevantThreads
    .map((thread) => {
      const messages = [...(thread.messages ?? [])]
        .filter((message) => !lookbackDate || new Date(message.createdAt) >= lookbackDate)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const touchpoints = messages.length;
      const lastReply = messages
        .filter((message) => normaliseMetadata(message.metadata).direction === 'inbound')
        .map((message) => message.createdAt)
        .pop();
      const lastMessageAt = messages.at(-1)?.createdAt ?? thread.lastMessageAt;
      const metadata = normaliseMetadata(thread.metadata);
      const status = metadata.sequenceStatus ?? (lastReply ? 'active' : 'awaiting response');
      return {
        threadId: thread.id,
        subject: thread.subject ?? 'Prospect outreach',
        startedAt: thread.createdAt,
        lastTouchpointAt: lastMessageAt,
        lastReplyAt: lastReply ?? null,
        touchpoints,
        status,
      };
    })
    .slice(0, 10);

  const responseMessages = channelBreakdown.reduce((total, entry) => total + entry.responses, 0);

  return {
    lookbackDays: null,
    campaignCount,
    totalMessages,
    averageResponseHours,
    responseRate: totalMessages ? Number((responseMessages / totalMessages).toFixed(2)) : 0,
    averageTouchpoints: campaignCount ? Number((totalMessages / campaignCount).toFixed(1)) : 0,
    channelBreakdown,
    latestCampaigns,
  };
}

function buildPassOnNetwork(applications, candidateProfiles) {
  const candidatesById = new Map(candidateProfiles.map((candidate) => [candidate.id, candidate]));
  const entries = applications
    .filter((application) => ['rejected', 'withdrawn'].includes(application.status))
    .map((application) => {
      const candidate = candidatesById.get(application.applicantId);
      if (!candidate) {
        return null;
      }
      const metadata = normaliseMetadata(application.metadata);
      const referral = Array.isArray(metadata.passOnTargets) ? metadata.passOnTargets[0] : metadata.passOnTargets;
      return {
        applicantId: candidate.id,
        name: `${candidate.firstName} ${candidate.lastName}`.trim(),
        primarySkill: candidate.Profile?.skills ?? null,
        lastStage: determineStageKey(application.status),
        referredTo: referral?.company ?? referral?.workspace ?? metadata.referralDestination ?? null,
        nextStep: metadata.nextStep ?? 'Awaiting confirmation',
        sharedAt: metadata.sharedAt ?? application.updatedAt ?? application.decisionAt ?? application.createdAt,
        revenueShare:
          metadata.revenueShareAmount != null ? Number(Number(metadata.revenueShareAmount).toFixed(2)) : null,
      };
    })
    .filter(Boolean);

  return {
    totalCandidates: entries.length,
    openReferrals: entries.filter((entry) => !entry.nextStep || /awaiting/i.test(entry.nextStep)).length,
    revenueSharePipeline: Number(
      sumNumbers(entries.map((entry) => entry.revenueShare ?? 0)).toFixed(2),
    ),
    candidates: entries.slice(0, 10),
  };
}

function sanitizeHeadhunterPipelineItem(itemInstance) {
  if (!itemInstance) return null;
  const base = itemInstance.toPublicObject();
  const stage = itemInstance.get?.('stage') ?? itemInstance.stage ?? null;
  const candidate = itemInstance.get?.('candidate') ?? itemInstance.candidate ?? null;
  const notes = itemInstance.get?.('notes') ?? itemInstance.notes ?? [];
  const attachments = itemInstance.get?.('attachments') ?? itemInstance.attachments ?? [];
  const interviews = itemInstance.get?.('interviews') ?? itemInstance.interviews ?? [];
  const passOnShares = itemInstance.get?.('passOnShares') ?? itemInstance.passOnShares ?? [];
  const metadata = base.metadata ?? {};

  const normalizedNotes = Array.isArray(notes)
    ? notes.map((note) => {
        const plain = note.toPublicObject();
        const author = note.get?.('author') ?? note.author ?? null;
        return {
          ...plain,
          author: author
            ? {
                id: author.id,
                name:
                  [author.firstName, author.lastName].filter(Boolean).join(' ').trim() || author.email || null,
              }
            : null,
        };
      })
    : [];

  const normalizedAttachments = Array.isArray(attachments)
    ? attachments.map((attachment) => {
        const plain = attachment.toPublicObject();
        const uploader = attachment.get?.('uploader') ?? attachment.uploader ?? null;
        return {
          ...plain,
          uploader: uploader
            ? {
                id: uploader.id,
                name:
                  [uploader.firstName, uploader.lastName].filter(Boolean).join(' ').trim() || uploader.email || null,
              }
            : null,
        };
      })
    : [];

  const normalizedInterviews = Array.isArray(interviews)
    ? interviews.map((interview) => interview.toPublicObject())
    : [];

  const normalizedShares = Array.isArray(passOnShares)
    ? passOnShares.map((share) => {
        const plain = share.toPublicObject();
        const targetWorkspace = share.get?.('targetWorkspace') ?? share.targetWorkspace ?? null;
        return {
          ...plain,
          targetWorkspace: targetWorkspace
            ? {
                id: targetWorkspace.id,
                name: targetWorkspace.name,
                type: targetWorkspace.type,
              }
            : null,
        };
      })
    : [];

  const candidateProfile = candidate?.Profile ?? candidate?.profile ?? null;
  const candidateSummary = candidate
    ? {
        id: candidate.id,
        name: [candidate.firstName, candidate.lastName].filter(Boolean).join(' ').trim() || candidate.email,
        email: candidate.email,
        headline: candidateProfile?.headline ?? null,
        location: candidateProfile?.location ?? null,
        availability: candidateProfile?.availabilityStatus ?? null,
      }
    : null;

  const blockers = ensureArray(metadata.blockers);
  const readinessNumeric = toNumberOrNull(metadata.readiness);
  const readiness =
    readinessNumeric != null
      ? Number(readinessNumeric.toFixed(1))
      : metadata.readiness ?? null;

  const experience = {
    preferences: metadata.preferences ?? {},
    compensation: metadata.compensation ?? null,
    relocation: metadata.relocation ?? null,
    coachingNotes: ensureArray(metadata.coachingNotes),
    prepPacks: ensureArray(metadata.prepPacks),
  };

  return {
    ...base,
    stage: stage?.toPublicObject?.() ?? stage ?? null,
    candidate: candidateSummary,
    notes: normalizedNotes,
    attachments: normalizedAttachments,
    interviews: normalizedInterviews,
    passOnShares: normalizedShares,
    insights: {
      sentiment: metadata.sentiment ?? 'neutral',
      risk: metadata.risk ?? 'medium',
      readiness,
      wellbeing: metadata.wellbeing ?? null,
      blockers,
    },
    experience,
  };
}

function buildInterviewCoordinationFromItems(items) {
  const interviews = items.flatMap((item) =>
    (item.interviews ?? []).map((interview) => ({
      ...interview,
      pipelineItemId: item.id,
      candidate: item.candidate,
      stage: item.stage,
    })),
  );

  if (!interviews.length) {
    return {
      upcoming: [],
      summary: {
        totalScheduled: 0,
        completedThisWeek: 0,
        withPrepMaterials: 0,
        scorecardsLinked: 0,
      },
      timezoneStats: [],
    };
  }

  const sortedInterviews = [...interviews].sort((a, b) => {
    const aTime = new Date(a.scheduledAt ?? 0).getTime();
    const bTime = new Date(b.scheduledAt ?? 0).getTime();
    return aTime - bTime;
  });

  const upcoming = sortedInterviews
    .filter((interview) => interview.status !== 'cancelled')
    .slice(0, 12)
    .map((interview) => ({
      id: interview.id,
      pipelineItemId: interview.pipelineItemId,
      candidateName: interview.candidate?.name ?? 'Candidate',
      stageName: interview.stage?.name ?? null,
      interviewType: interview.interviewType,
      status: interview.status,
      scheduledAt: interview.scheduledAt,
      timezone: interview.timezone ?? 'UTC',
      host: interview.host,
      location: interview.location,
      dialIn: interview.dialIn,
      prepMaterials: interview.prepMaterials,
      scorecard: interview.scorecard,
    }));

  const summary = {
    totalScheduled: interviews.filter((interview) => interview.status === 'scheduled').length,
    completedThisWeek: interviews.filter(
      (interview) => interview.status === 'completed' && isWithinLastDays(interview.completedAt ?? interview.scheduledAt, 7),
    ).length,
    withPrepMaterials: interviews.filter((interview) => ensureArray(interview.prepMaterials).length > 0).length,
    scorecardsLinked: interviews.filter(
      (interview) => interview.scorecard && Object.keys(interview.scorecard).length > 0,
    ).length,
  };

function buildCalendar(applications, recentActivity, lookbackDate, options = {}) {
  const { lookbackDays = 30 } = options;
  const rawEvents = [];
  const timezoneCounts = interviews.reduce((accumulator, interview) => {
    const timezone = interview.timezone ?? 'UTC';
    accumulator[timezone] = (accumulator[timezone] ?? 0) + 1;
    return accumulator;
  }, {});

  const timezoneStats = Object.entries(timezoneCounts)
    .map(([timezone, count]) => ({ timezone, count }))
    .sort((a, b) => b.count - a.count);

  return { upcoming, summary, timezoneStats };
}

function buildCandidateExperienceVaultFromItems(items) {
  if (!items.length) {
    return {
      entries: [],
      readinessIndex: null,
      wellbeingAlerts: [],
      preferenceCoverage: 0,
      prepPackCount: 0,
      coachingNotesLogged: 0,
    };
  }

  const entries = items
    .map((item) => ({
      id: item.id,
      candidateName: item.candidate?.name ?? 'Candidate',
      stageName: item.stage?.name ?? null,
      stageType: item.stage?.stageType ?? null,
      readiness: item.insights?.readiness ?? null,
      wellbeing: item.insights?.wellbeing ?? null,
      lastTouchedAt: item.lastTouchedAt,
      nextStep: item.nextStep,
      preferences: item.experience?.preferences ?? {},
      compensation: item.experience?.compensation ?? null,
      relocation: item.experience?.relocation ?? null,
      prepPacks: ensureArray(item.experience?.prepPacks),
      coachingNotes: ensureArray(item.experience?.coachingNotes),
    }))
    .sort((a, b) => {
      const aTime = new Date(a.lastTouchedAt ?? 0).getTime();
      const bTime = new Date(b.lastTouchedAt ?? 0).getTime();
      return bTime - aTime;
    });

  const readinessScores = entries
    .map((entry) => toNumberOrNull(entry.readiness))
    .filter((value) => value != null);

  const readinessIndex = readinessScores.length
    ? Number((sumNumbers(readinessScores) / readinessScores.length).toFixed(1))
    : null;

  const wellbeingAlerts = entries
    .filter((entry) => {
      if (!entry.wellbeing) return false;
      const value = `${entry.wellbeing}`.toLowerCase();
      return ['fatigue', 'concern', 'at_risk', 'risk', 'low'].includes(value);
    })
    .map((entry) => ({
      candidateName: entry.candidateName,
      stageName: entry.stageName,
      wellbeing: entry.wellbeing,
      lastTouchedAt: entry.lastTouchedAt,
      nextStep: entry.nextStep,
    }));

  const interviewsThisWeek = rawEvents.filter((event) => /interview/i.test(event.label ?? '')).length;
  const offersPending = rawEvents.filter((event) => /offer/i.test(event.label ?? '')).length;
  const prepSessions = rawEvents.filter((event) => /prep|review/i.test(event.type ?? '')).length;
  const outreachBlocks = rawEvents.filter((event) => /outreach|sequence/i.test(event.label ?? '')).length;

  const targetDowntimeBlocks = Math.max(2, Math.ceil(lookbackDays / 7));
  const downtimeBlocks = Math.max(0, targetDowntimeBlocks - Math.min(targetDowntimeBlocks, prepSessions));

  return {
    upcoming,
    workload: {
      interviewsThisWeek,
      offersPending,
      prepSessions,
      outreachBlocks,
      downtimeBlocks,
    },
    density: {
      eventsPerWeek: lookbackDays
        ? Number(((rawEvents.length / lookbackDays) * 7).toFixed(1))
        : Number(rawEvents.length.toFixed(1)),
    },
    rawEvents: rawEvents.slice(0, 50),
  const preferenceCoverage = sumNumbers(entries.map((entry) => Object.keys(entry.preferences ?? {}).length));
  const prepPackCount = entries.filter((entry) => entry.prepPacks.length > 0).length;
  const coachingNotesLogged = sumNumbers(entries.map((entry) => entry.coachingNotes.length));

  return {
    entries: entries.slice(0, 12),
    readinessIndex,
    wellbeingAlerts,
    preferenceCoverage,
    prepPackCount,
    coachingNotesLogged,
  };
}

function buildPassOnExchangeFromItems(items) {
  const shares = items.flatMap((item) => {
    const estimatedValue = toNumberOrNull(item.estimatedValue) ?? 0;
    return (item.passOnShares ?? []).map((share) => {
      const rate = toNumberOrNull(share.revenueShareRate);
      const flat = toNumberOrNull(share.revenueShareFlat);
      const projectedValue = rate != null ? Number((estimatedValue * (rate / 100)).toFixed(2)) : flat ?? 0;
      return {
        id: share.id,
        pipelineItemId: item.id,
        candidateName: item.candidate?.name ?? 'Candidate',
        stageName: item.stage?.name ?? null,
        targetName: share.targetName,
        targetType: share.targetType,
        shareStatus: share.shareStatus,
        consentStatus: share.consentStatus,
        revenueShareRate: rate,
        revenueShareFlat: flat,
        projectedValue,
        sharedAt: share.sharedAt,
        targetWorkspace: share.targetWorkspace,
        notes: share.notes,
      };
    });
  });

  if (!shares.length) {
    return {
      shares: [],
      summary: {
        totalShares: 0,
        pendingConsent: 0,
        consentGranted: 0,
        activeShares: 0,
        accepted: 0,
        declined: 0,
        projectedRevenue: 0,
        averageRevenueShareRate: null,
      },
    };
  }

  const sortedShares = shares
    .slice()
    .sort((a, b) => new Date(b.sharedAt ?? 0).getTime() - new Date(a.sharedAt ?? 0).getTime());

  const pendingConsent = sortedShares.filter((share) => share.consentStatus === 'pending').length;
  const consentGranted = sortedShares.filter((share) => share.consentStatus === 'granted').length;
  const activeShares = sortedShares.filter((share) => share.shareStatus === 'shared').length;
  const accepted = sortedShares.filter((share) => share.shareStatus === 'accepted').length;
  const declined = sortedShares.filter((share) => share.shareStatus === 'declined').length;
  const projectedRevenue = Number(sumNumbers(sortedShares.map((share) => share.projectedValue ?? 0)).toFixed(2));
  const rates = sortedShares
    .map((share) => share.revenueShareRate)
    .filter((rate) => rate != null);
  const averageRate = rates.length ? Number((sumNumbers(rates) / rates.length).toFixed(2)) : null;

  return {
    shares: sortedShares.slice(0, 15),
    summary: {
      totalShares: sortedShares.length,
      pendingConsent,
      consentGranted,
      activeShares,
      accepted,
      declined,
      projectedRevenue,
      averageRevenueShareRate: averageRate,
    },
  };
}

function normaliseDayLabel(day) {
  if (!day) {
    return null;
  }
  return day.charAt(0).toUpperCase() + day.slice(1);
}

function summariseText(text, limit = 240) {
  if (!text) {
    return null;
  }
  const sanitized = text.toString().replace(/\s+/g, ' ').trim();
  if (!sanitized) {
    return null;
  }
  if (sanitized.length <= limit) {
    return sanitized;
  }
  return `${sanitized.slice(0, limit).trimEnd()}…`;
}

function extractVersionTag(tags = []) {
  const versionTag = tags.find((tag) => /^v\d+/i.test(String(tag)));
  if (!versionTag) {
    return 1;
  }
  const parsed = Number.parseInt(String(versionTag).replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : 1;
}

function computeFocusRecommendation(event) {
  if (!event || !event.date) {
    return null;
  }
  const eventDate = new Date(event.date);
  if (!Number.isFinite(eventDate.getTime())) {
    return null;
  }
  const start = new Date(eventDate.getTime() - 90 * 60 * 1000);
  const end = new Date(eventDate.getTime() - 30 * 60 * 1000);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
    return null;
  }
  return {
    label: `Prep for ${event.label}`,
    startTimeUtc: start.toISOString(),
    endTimeUtc: end.toISOString(),
    source: 'recommended',
  };
}

function buildIntelligenceHub({
  pipelineSummary,
  mandatePortfolio,
  outreachPerformance,
  agingBuckets,
  lookbackDays,
  recentActivity,
  workspaceSummary,
}) {
  const stageBreakdown = Array.isArray(pipelineSummary?.stageBreakdown) ? pipelineSummary.stageBreakdown : [];
  const totals = pipelineSummary?.totals ?? {};
  const currency = workspaceSummary?.defaultCurrency ?? 'USD';
  const pipelineValue = toNumber(mandatePortfolio?.totals?.pipelineValue);
  const placements = toNumber(stageBreakdown.find((stage) => stage.key === 'placement')?.count);
  const offers = toNumber(stageBreakdown.find((stage) => stage.key === 'offering')?.count);
  const interviewing = toNumber(stageBreakdown.find((stage) => stage.key === 'interviewing')?.count);
  const activeMandates = toNumber(mandatePortfolio?.totals?.activeMandates);
  const forecastedPlacements = placements + Math.round(offers * 0.65);
  const placementTarget = Math.max(activeMandates || 1, Math.ceil(activeMandates * 0.75) || 1);
  const pipelineTarget = Math.max(pipelineValue, activeMandates ? activeMandates * 150000 : 150000);
  const projectedFees = Number((pipelineValue * 0.22).toFixed(2));
  const activityTarget = Math.max(Math.round((lookbackDays / 7) * 50), 40);
  const actualActivity = toNumber(outreachPerformance?.totalMessages);
  const activityDelta = actualActivity - activityTarget;
  const conversionRate = pipelineSummary?.conversionRates?.placements ?? 0;
  const interviewToOffer = pipelineSummary?.conversionRates?.offers ?? 0;
  const velocityDays = pipelineSummary?.velocityDays ?? null;
  const candidateCoverage = activeMandates
    ? Number(((totals.active ?? 0) / activeMandates).toFixed(1))
    : null;

  const gaps = [];
  if (pipelineValue < pipelineTarget) {
    gaps.push({
      type: 'pipelineValue',
      label: 'Pipeline value',
      actual: pipelineValue,
      target: pipelineTarget,
      delta: Number((pipelineValue - pipelineTarget).toFixed(2)),
      currency,
    });
  }
  if (forecastedPlacements < placementTarget) {
    gaps.push({
      type: 'forecastedPlacements',
      label: 'Forecasted placements',
      actual: forecastedPlacements,
      target: placementTarget,
      delta: forecastedPlacements - placementTarget,
    });
  }
  if (activityDelta < 0) {
    gaps.push({
      type: 'activity',
      label: 'Activity goal',
      actual: actualActivity,
      target: activityTarget,
      delta: activityDelta,
    });
  }

  const recommendedActions = [];
  if (pipelineValue < pipelineTarget) {
    const shortfall = Math.max(0, pipelineTarget - pipelineValue);
    const suggestedMandates = Math.max(1, Math.ceil(shortfall / 75000));
    recommendedActions.push(
      `Add ${suggestedMandates} new mandates or upsell retainers to close the ${currency} ${shortfall.toLocaleString('en-US', {
        maximumFractionDigits: 0,
      })} pipeline gap.`,
    );
  }
  if (forecastedPlacements < placementTarget) {
    recommendedActions.push(
      `Advance offer negotiations on ${Math.max(1, placementTarget - forecastedPlacements)} priority candidates to hit placement targets.`,
    );
  }
  if (activityDelta < 0) {
    recommendedActions.push(
      `Schedule ${Math.abs(activityDelta)} additional outreach touchpoints to stay on pace for ${activityTarget} over the lookback.`,
    );
  }
  const stalledCount = toNumber(agingBuckets?.['30+']);
  if (stalledCount > 0) {
    recommendedActions.push(`Run a stall review on ${stalledCount} candidates aged 30+ days to unblock decisions.`);
  }

  const highlights = recentActivity.slice(0, 3).map((event) => ({
    label: event.description ?? event.label ?? `Update: ${event.stage}`,
    occurredAt: event.occurredAt,
    stage: event.stage,
  }));

  const blockers = [];
  if (stalledCount > 0) {
    blockers.push({
      label: 'Stalled pipeline',
      detail: `${stalledCount} candidates have been in stage for 30+ days`,
    });
  }
  if (activityDelta < 0) {
    blockers.push({
      label: 'Activity pace',
      detail: `${Math.abs(activityDelta)} fewer touchpoints than target`,
    });
  }

  const nextReviewAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const agenda = [
    {
      topic: 'Pipeline coverage',
      detail: `Current coverage ${candidateCoverage ?? '—'} vs. target ${Math.max(4, activeMandates * 3)}`,
    },
    {
      topic: 'Forecast & fees',
      detail: `Forecasted placements ${forecastedPlacements} • Projected fees ${currency} ${projectedFees.toLocaleString('en-US', {
        maximumFractionDigits: 0,
      })}`,
    },
    {
      topic: 'Outreach velocity',
      detail: `Touchpoints ${actualActivity} of ${activityTarget} goal • Avg response ${outreachPerformance?.averageResponseHours ?? '—'}h`,
    },
  ];

  return {
    metrics: {
      pipelineValue: { value: pipelineValue, target: pipelineTarget, currency },
      forecastedPlacements: { value: forecastedPlacements, target: placementTarget },
      projectedFees: { value: projectedFees, currency },
      activityGoal: { actual: actualActivity, target: activityTarget, delta: activityDelta },
    },
    scorecard: {
      conversionRate,
      interviewToOffer,
      velocityDays,
      coverageRate: candidateCoverage,
    },
    gaps,
    recommendedActions,
    weeklyReview: {
      nextReviewAt,
      highlights,
      blockers,
      agenda,
    },
  };
}

function buildCalendarOrchestration({
  calendar,
  availabilityWindows,
  workspaceSummary,
  clientPartnerships,
  lookbackDays,
}) {
  const timezone = workspaceSummary?.timezone ?? 'UTC';
  const windows = Array.isArray(availabilityWindows) ? availabilityWindows : [];
  const upcoming = Array.isArray(calendar?.upcoming) ? calendar.upcoming : [];
  const workload = calendar?.workload ?? {};

  const formattedWindows = windows.map((window) => {
    const channels = asArray(window.broadcastChannels).map((channel) => String(channel));
    return {
      id: window.id ?? null,
      dayOfWeek: window.dayOfWeek,
      dayLabel: normaliseDayLabel(window.dayOfWeek),
      startTimeUtc: window.startTimeUtc,
      endTimeUtc: window.endTimeUtc,
      availabilityType: window.availabilityType ?? 'interview',
      broadcastChannels: channels,
      metadata: window.metadata ?? {},
      label:
        window.startTimeUtc && window.endTimeUtc
          ? `${normaliseDayLabel(window.dayOfWeek)} ${window.startTimeUtc.slice(0, 5)}–${window.endTimeUtc.slice(0, 5)} ${timezone}`
          : normaliseDayLabel(window.dayOfWeek) ?? 'Availability',
    };
  });

  const scheduledFocusBlocks = formattedWindows
    .filter((window) => window.availabilityType === 'focus')
    .map((window) => ({
      label: `${window.dayLabel ?? 'Focus'} block`,
      startTimeUtc: window.startTimeUtc,
      endTimeUtc: window.endTimeUtc,
      source: 'scheduled',
    }));

  const recommendedFocusBlocks = scheduledFocusBlocks.length
    ? []
    : upcoming
        .filter((event) => event && /interview|presentation|briefing/i.test(event.label ?? ''))
        .map((event) => computeFocusRecommendation(event))
        .filter(Boolean)
        .slice(0, 3);

  const focusBlocks = [...scheduledFocusBlocks, ...recommendedFocusBlocks];

  const broadcastChannels = new Set();
  formattedWindows.forEach((window) => {
    window.broadcastChannels.forEach((channel) => broadcastChannels.add(channel));
  });
  if (workspaceSummary?.intakeEmail) {
    broadcastChannels.add('email');
  }

  const recipients = new Set();
  (clientPartnerships?.topContacts ?? [])
    .slice(0, 6)
    .forEach((contact) => {
      if (contact.email) {
        recipients.add(contact.email);
      } else if (contact.name) {
        recipients.add(contact.name);
      }
    });
  (workspaceSummary?.members ?? [])
    .slice(0, 6)
    .forEach((member) => {
      if (member.user?.email) {
        recipients.add(member.user.email);
      }
    });

  const interviewBlocks = upcoming.filter((event) => /interview/i.test(event.label ?? '')).length;
  const internalSyncs = upcoming.filter((event) => /sync|standup|retro/i.test(event.label ?? '')).length;

  const automation = [
    {
      name: 'Protect focus time',
      status: scheduledFocusBlocks.length ? 'active' : 'recommended',
      lastRunAt: scheduledFocusBlocks.length ? new Date().toISOString() : null,
    },
    {
      name: 'Broadcast availability',
      status: broadcastChannels.size ? 'active' : 'needs_setup',
      lastRunAt: windows.find((window) => window.metadata?.lastBroadcastAt)?.metadata?.lastBroadcastAt ?? null,
    },
  ];

  return {
    timezone,
    availability: {
      windows: formattedWindows,
      defaultWindow:
        formattedWindows.find((window) => window.availabilityType === 'interview')?.label ?? '09:00–18:00',
      broadcastChannels: Array.from(broadcastChannels),
      recipients: Array.from(recipients),
      nextBroadcastAt:
        windows.find((window) => window.metadata?.nextBroadcastAt)?.metadata?.nextBroadcastAt ??
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
    focusBlocks,
    sharedCalendars: (clientPartnerships?.topContacts ?? []).slice(0, 5).map((contact) => ({
      name: contact.name,
      email: contact.email,
      lastInteractionAt: contact.lastInteractionAt ?? null,
    })),
    utilization: {
      totalEvents: upcoming.length,
      interviewBlocks,
      internalSyncs,
      focusBlocks: focusBlocks.length,
      downtimeBlocks: workload.downtimeBlocks ?? Math.max(0, Math.ceil(lookbackDays / 7) - focusBlocks.length),
      eventsPerWeek: calendar?.density?.eventsPerWeek ?? null,
    },
    automation,
    upcoming,
  };
}

function buildKnowledgeBase(articles, workspaceSummary) {
  const slug = workspaceSummary?.slug?.toLowerCase?.();
  const filtered = (Array.isArray(articles) ? articles : [])
    .map((article) => ({ ...article }))
    .filter((article) => {
      if (!slug) {
        return true;
      }
      const tags = asArray(article.tags).map((tag) => String(tag).toLowerCase());
      if (!tags.length) {
        return true;
      }
      return tags.includes(slug) || tags.includes(`workspace:${slug}`) || tags.includes('headhunter');
    });

  const normalized = filtered.map((article) => {
    const tags = asArray(article.tags).map((tag) => String(tag));
    const collaborators = tags.filter((tag) => tag.startsWith('@')).map((tag) => tag.slice(1));
    const version = extractVersionTag(tags);
    const aiSummary = summariseText(article.summary ?? article.body, 260);
    return {
      id: article.id,
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      aiSummary,
      category: article.category,
      audience: article.audience,
      tags,
      version,
      collaborators,
      lastReviewedAt: article.lastReviewedAt,
      updatedAt: article.updatedAt,
      resourceLinks: asArray(article.resourceLinks),
    };
  });

  const categories = normalized.reduce((acc, article) => {
    const key = article.category ?? 'uncategorised';
    acc.set(key, (acc.get(key) ?? 0) + 1);
    return acc;
  }, new Map());

  const uniqueTags = new Set();
  normalized.forEach((article) => {
    article.tags.forEach((tag) => uniqueTags.add(tag));
  });

  const recentArticles = normalized
    .slice()
    .sort((a, b) => new Date(b.updatedAt ?? 0) - new Date(a.updatedAt ?? 0))
    .slice(0, 6);

  const playbooks = normalized
    .filter((article) => article.category === 'workflow' || article.tags.some((tag) => /playbook/i.test(tag)))
    .slice(0, 5);

  const contributors = Array.from(
    new Set(
      normalized
        .flatMap((article) => article.collaborators)
        .filter(Boolean),
    ),
  );

  return {
    totalArticles: normalized.length,
    categories: Array.from(categories.entries()).map(([name, count]) => ({ name, count })),
    recentArticles,
    playbooks,
    aiSummaries: recentArticles.map((article) => ({
      slug: article.slug,
      title: article.title,
      summary: article.aiSummary,
    })),
    collaboration: {
      contributors,
      lastUpdatedAt: recentArticles[0]?.updatedAt ?? null,
    },
    searchTags: Array.from(uniqueTags).slice(0, 12),
  };
}

function buildWellbeingTracker({
  pipelineSummary,
  agingBuckets,
  calendar,
  wellbeingLogs,
  workspaceSummary,
  lookbackDays,
  passOnNetwork,
}) {
  const logs = Array.isArray(wellbeingLogs) ? wellbeingLogs : [];
  const activeMembers = workspaceSummary?.memberCounts?.active ?? 0;
  const activeApplications = pipelineSummary?.totals?.active ?? 0;
  const workloadPerMember = activeMembers
    ? Number((activeApplications / activeMembers).toFixed(1))
    : activeApplications;

  const interviewsThisWeek = calendar?.workload?.interviewsThisWeek ?? 0;
  const offersPending = calendar?.workload?.offersPending ?? 0;
  const downtimeBlocks = calendar?.workload?.downtimeBlocks ?? Math.max(0, Math.ceil(lookbackDays / 7) - 1);

  const averageEnergy = average(logs.map((log) => log.energyScore));
  const averageStress = average(logs.map((log) => log.stressScore));
  const averageWorkload = average(logs.map((log) => log.workloadScore));
  const averageTravel = average(logs.map((log) => log.travelDays));
  const hydrationLevel = average(logs.map((log) => log.hydrationLevel));
  const latestLog = logs[0] ?? null;

  const derivedScore =
    averageEnergy != null && averageStress != null
      ? Math.max(0, Math.min(100, Math.round(averageEnergy * 10 - averageStress * 6 + 55)))
      : null;
  const wellbeingScore = latestLog?.wellbeingScore != null ? Number(latestLog.wellbeingScore) : derivedScore;

  const burnoutRisk = (() => {
    const stress = averageStress ?? latestLog?.stressScore ?? 0;
    if (stress >= 7 || workloadPerMember > 15 || downtimeBlocks < 2) {
      return 'high';
    }
    if (stress >= 5 || workloadPerMember > 12) {
      return 'medium';
    }
    return 'low';
  })();

  const reminders = [];
  if (downtimeBlocks < 2) {
    reminders.push('Protect at least two downtime blocks to prevent burnout.');
  }
  if (averageTravel != null && averageTravel > 3) {
    reminders.push('Schedule recovery days after travel-heavy weeks.');
  }
  if (hydrationLevel != null && hydrationLevel < 6) {
    reminders.push('Send hydration reminder via wellness stipend integration.');
  }
  if ((latestLog?.energyScore ?? 0) <= 5) {
    reminders.push('Check in with team member reporting low energy.');
  }

  const prompts = [
    'What was your highest leverage activity last week?',
    'Where can we automate or delegate to protect focus?',
    'What recovery ritual will you commit to before next stand-up?',
  ];

  const participationRate = activeMembers
    ? Number(((logs.length / activeMembers) * 100).toFixed(1))
    : logs.length
    ? 100
    : 0;

  const peakTravelDays = logs.reduce((max, log) => {
    const travel = Number(log.travelDays);
    if (!Number.isFinite(travel)) {
      return max;
    }
    return Math.max(max, travel);
  }, 0);

  return {
    metrics: {
      workloadPerMember,
      interviewsThisWeek,
      offersPending,
      downtimeBlocks,
      wellbeingScore,
      burnoutRisk,
      averageEnergy,
      averageStress,
      averageWorkload,
      averageTravel,
      hydrationLevel,
      participationRate,
    },
    reminders,
    prompts,
    latestCheckInAt: latestLog?.recordedAt ?? null,
    travel: {
      averageDays: averageTravel,
      peakDays: peakTravelDays,
    },
    integrations: [
      { name: 'Gympass', status: 'connected' },
      { name: 'Calm for Business', status: wellbeingScore != null && wellbeingScore < 70 ? 'recommended' : 'connected' },
      { name: 'Notion weekly reflections', status: 'connected' },
    ],
    supportSignals: {
      referralsAwaitingFollowUp: passOnNetwork?.openReferrals ?? 0,
      highRiskPipeline: toNumber(agingBuckets?.['30+']) + toNumber(agingBuckets?.['15-30']),
    },
  };
}

async function loadCandidateProfiles(applications) {
  const ids = Array.from(new Set(applications.map((application) => application.applicantId))).filter(Boolean);
  if (!ids.length) {
    return [];
  }
async function buildPipelineExecution({ workspaceId }) {
  await ensureWorkspacePipelineStages(workspaceId);

  const stages = await HeadhunterPipelineStage.findAll({
    where: { workspaceId },
    order: [['position', 'ASC']],
  });

  const baseResponse = {
    prospectPipeline: {
      stageSummaries: [],
      metrics: {
        activeCandidates: 0,
        averageScore: null,
        averageStageDays: null,
        attachmentsTracked: 0,
        notesCaptured: 0,
        remindersScheduled: 0,
        prepPacksSent: 0,
      },
      automations: {
        remindersScheduled: 0,
        interviewsQueued: 0,
        passOnReady: 0,
      },
      overview: {
        stageCount: stages.length,
        candidateCount: 0,
      },
    },
    board: {
      columns: [],
      updatedAt: new Date().toISOString(),
      automations: {
        remindersScheduled: 0,
        interviewsQueued: 0,
        passOnReady: 0,
      },
    },
    heatmap: {
      stages: [],
      overallSentiment: null,
      overallRisk: 'low',
    },
    interviewCoordination: {
      upcoming: [],
      summary: {
        totalScheduled: 0,
        completedThisWeek: 0,
        withPrepMaterials: 0,
        scorecardsLinked: 0,
      },
      timezoneStats: [],
    },
    candidateExperienceVault: {
      entries: [],
      readinessIndex: null,
      wellbeingAlerts: [],
      preferenceCoverage: 0,
      prepPackCount: 0,
      coachingNotesLogged: 0,
    },
    passOnExchange: {
      shares: [],
      summary: {
        totalShares: 0,
        pendingConsent: 0,
        consentGranted: 0,
        activeShares: 0,
        accepted: 0,
        declined: 0,
        projectedRevenue: 0,
        averageRevenueShareRate: null,
      },
    },
  };

  if (!stages.length) {
    return baseResponse;
  }

  const items = await HeadhunterPipelineItem.findAll({
    where: { workspaceId },
    include: [
      { model: HeadhunterPipelineStage, as: 'stage' },
      {
        model: User,
        as: 'candidate',
        attributes: ['id', 'firstName', 'lastName', 'email'],
        include: [
          {
            model: Profile,
            as: 'Profile',
            attributes: ['headline', 'location', 'availabilityStatus'],
            required: false,
          },
        ],
      },
      {
        model: HeadhunterPipelineNote,
        as: 'notes',
        required: false,
        include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName'] }],
      },
      {
        model: HeadhunterPipelineAttachment,
        as: 'attachments',
        required: false,
        include: [{ model: User, as: 'uploader', attributes: ['id', 'firstName', 'lastName'] }],
      },
      { model: HeadhunterPipelineInterview, as: 'interviews', required: false },
      {
        model: HeadhunterPassOnShare,
        as: 'passOnShares',
        required: false,
        include: [{ model: ProviderWorkspace, as: 'targetWorkspace', attributes: ['id', 'name', 'type'] }],
      },
    ],
    order: [
      ['stageEnteredAt', 'ASC'],
      ['updatedAt', 'DESC'],
    ],
  });

  const sanitizedItems = items.map(sanitizeHeadhunterPipelineItem).filter(Boolean);
  const sanitizedStages = stages.map((stage) => stage.toPublicObject());

  const now = new Date();

  const stageSummaries = sanitizedStages.map((stage) => {
    const stageItems = sanitizedItems.filter((item) => item.stageId === stage.id);
    const scores = stageItems.map((item) => toNumberOrNull(item.score)).filter((value) => value != null);
    const averageScore = scores.length ? Number((sumNumbers(scores) / scores.length).toFixed(1)) : null;
    const daysInStage = stageItems
      .map((item) => toDaysBetween(item.stageEnteredAt, now))
      .filter((value) => value != null);
    const averageDays = daysInStage.length ? Number((sumNumbers(daysInStage) / daysInStage.length).toFixed(1)) : null;
    const notesCount = sumNumbers(stageItems.map((item) => item.notes.length));
    const attachmentsCount = sumNumbers(stageItems.map((item) => item.attachments.length));
    const riskSummary = { low: 0, medium: 0, high: 0 };
    let sentimentTotal = 0;
    stageItems.forEach((item) => {
      const riskValue = `${item.insights?.risk ?? 'medium'}`.toLowerCase();
      if (riskValue === 'low') {
        riskSummary.low += 1;
      } else if (riskValue === 'high' || riskValue === 'critical') {
        riskSummary.high += 1;
      } else {
        riskSummary.medium += 1;
      }
      sentimentTotal += mapSentimentToScore(item.insights?.sentiment);
    });
    const averageSentiment = stageItems.length
      ? Number((sentimentTotal / stageItems.length).toFixed(2))
      : null;
    const dominantRisk = determineDominantRiskFromCounts(riskSummary);
    const blockerCount = sumNumbers(stageItems.map((item) => item.insights.blockers.length));

    return {
      stageId: stage.id,
      stageName: stage.name,
      stageType: stage.stageType,
      winProbability: stage.winProbability == null ? null : Number(stage.winProbability),
      totalCandidates: stageItems.length,
      averageScore,
      averageDaysInStage: averageDays,
      notesCaptured: notesCount,
      attachmentsTracked: attachmentsCount,
      dominantRisk,
      riskSummary,
      averageSentiment,
      blockerCount,
    };
  });

  const stageSummaryMap = new Map(stageSummaries.map((summary) => [summary.stageId, summary]));

  const boardColumns = sanitizedStages.map((stage) => {
    const stageItems = sanitizedItems.filter((item) => item.stageId === stage.id);
    const sortedItems = stageItems
      .slice()
      .sort((a, b) => (toNumberOrNull(b.score) ?? 0) - (toNumberOrNull(a.score) ?? 0));

    const cards = sortedItems.slice(0, 8).map((item) => ({
      id: item.id,
      candidateName: item.candidate?.name ?? 'Candidate',
      targetRole: item.targetRole ?? null,
      targetCompany: item.targetCompany ?? null,
      score: item.score,
      status: item.status,
      nextStep: item.nextStep,
      lastTouchedAt: item.lastTouchedAt,
      stageAgeDays: toDaysBetween(item.stageEnteredAt, now),
      estimatedValue: item.estimatedValue,
      expectedCloseDate: item.expectedCloseDate,
      attachments: item.attachments.length,
      notes: item.notes.length,
      interviews: item.interviews.length,
      passOnShares: item.passOnShares.length,
      sentiment: item.insights.sentiment,
      risk: item.insights.risk,
      readiness: item.insights.readiness,
      wellbeing: item.insights.wellbeing,
      blockers: item.insights.blockers,
    }));

    return {
      id: stage.id,
      name: stage.name,
      stageType: stage.stageType,
      winProbability: stage.winProbability,
      stats: stageSummaryMap.get(stage.id),
      items: cards,
    };
  });

  const metricsScores = sanitizedItems
    .map((item) => toNumberOrNull(item.score))
    .filter((value) => value != null);
  const metricsStageDurations = sanitizedItems
    .map((item) => toDaysBetween(item.stageEnteredAt, now))
    .filter((value) => value != null);

  const metrics = {
    activeCandidates: sanitizedItems.filter((item) => item.status === 'active').length,
    averageScore: metricsScores.length
      ? Number((sumNumbers(metricsScores) / metricsScores.length).toFixed(1))
      : null,
    averageStageDays: metricsStageDurations.length
      ? Number((sumNumbers(metricsStageDurations) / metricsStageDurations.length).toFixed(1))
      : null,
    attachmentsTracked: sumNumbers(sanitizedItems.map((item) => item.attachments.length)),
    notesCaptured: sumNumbers(sanitizedItems.map((item) => item.notes.length)),
    remindersScheduled: sanitizedItems.filter((item) => Boolean(item.nextStep)).length,
    prepPacksSent: sanitizedItems.filter((item) => ensureArray(item.experience?.prepPacks).length > 0).length,
  };

  const heatmapStages = stageSummaries.map((summary) => ({
    stageId: summary.stageId,
    stageName: summary.stageName,
    stageType: summary.stageType,
    candidateCount: summary.totalCandidates,
    averageScore: summary.averageScore,
    averageSentiment: summary.averageSentiment,
    dominantRisk: summary.dominantRisk,
    blockerCount: summary.blockerCount,
    riskSummary: summary.riskSummary,
  }));

  const sentimentValues = stageSummaries
    .map((summary) => summary.averageSentiment)
    .filter((value) => value != null);
  const overallSentiment = sentimentValues.length
    ? Number((sumNumbers(sentimentValues) / sentimentValues.length).toFixed(2))
    : null;
  const overallRisk = stageSummaries.some((summary) => summary.dominantRisk === 'high')
    ? 'high'
    : stageSummaries.some((summary) => summary.dominantRisk === 'medium')
    ? 'medium'
    : 'low';

  const interviewCoordination = buildInterviewCoordinationFromItems(sanitizedItems);
  const candidateExperienceVault = buildCandidateExperienceVaultFromItems(sanitizedItems);
  const passOnExchange = buildPassOnExchangeFromItems(sanitizedItems);

  const automations = {
    remindersScheduled: metrics.remindersScheduled,
    interviewsQueued: interviewCoordination.summary.totalScheduled ?? 0,
    passOnReady: passOnExchange.summary.totalShares ?? 0,
  };

  return {
    prospectPipeline: {
      stageSummaries,
      metrics,
      automations,
      overview: {
        stageCount: sanitizedStages.length,
        candidateCount: sanitizedItems.length,
      },
    },
    board: {
      columns: boardColumns,
      updatedAt: new Date().toISOString(),
      automations,
    },
    heatmap: {
      stages: heatmapStages,
      overallSentiment,
      overallRisk,
    },
    interviewCoordination,
    candidateExperienceVault,
    passOnExchange,
function toPlainRecord(record) {
  if (!record) {
    return null;
  }
  if (typeof record.get === 'function') {
    return record.get({ plain: true });
  }
  return record;
}

function ensureArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value == null) {
    return [];
  }
  if (typeof value === 'string') {
    return value.length ? [value] : [];
  }
  if (typeof value === 'object') {
    return Object.values(value)
      .flatMap((entry) => ensureArray(entry))
      .filter((item) => item != null && item !== '');
  }
  return [value];
}

function extractInsights(source) {
  if (!source) {
    return [];
  }
  if (Array.isArray(source)) {
    return source.filter(Boolean);
  }
  if (typeof source === 'object') {
    if (Array.isArray(source.insights)) {
      return source.insights.filter(Boolean);
    }
    if (Array.isArray(source.highlights)) {
      return source.highlights.filter(Boolean);
    }
    return Object.values(source)
      .flatMap((entry) => (Array.isArray(entry) ? entry : entry != null ? [entry] : []))
      .filter(Boolean)
      .map((entry) => (typeof entry === 'string' ? entry : JSON.stringify(entry)));
  }
  if (typeof source === 'string') {
    return source ? [source] : [];
  }
  return [];
}

function computeAverage(values, decimals = 1) {
  const filtered = values.filter((value) => Number.isFinite(value));
  if (!filtered.length) {
    return null;
  }
  const average = sumNumbers(filtered) / filtered.length;
  return Number(average.toFixed(decimals));
}

function computeCompTarget(profile) {
  const min = Number(profile.compensationTargetMin);
  const max = Number(profile.compensationTargetMax);
  if (Number.isFinite(min) && Number.isFinite(max)) {
    return (min + max) / 2;
  }
  if (Number.isFinite(min)) {
    return min;
  }
  if (Number.isFinite(max)) {
    return max;
  }
  const metadataTarget = Number(profile.metadata?.compensationTarget ?? profile.metadata?.compensation?.target);
  return Number.isFinite(metadataTarget) ? metadataTarget : null;
}

function buildProspectIntelligenceOverview(profiles, signals) {
  const relocationReadiness = profiles.reduce((acc, profile) => {
    const key = profile.relocationReadiness ?? 'unspecified';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const compTargets = profiles
    .map((profile) => computeCompTarget(profile))
    .filter((value) => Number.isFinite(value));
  const averageCompTarget = compTargets.length ? Number(computeAverage(compTargets, 0)) : null;

  const exclusivityConflicts = profiles.filter((profile) => profile.exclusivityConflict).length;
  const highIntentSignals = signals.filter((signal) => signal.intentLevel === 'high').length;

  const signalIntentBreakdown = signals.reduce((acc, signal) => {
    const key = signal.intentLevel ?? 'unknown';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const motivatorCounts = new Map();
  profiles.forEach((profile) => {
    ensureArray(profile.motivators).forEach((motivator) => {
      const label = typeof motivator === 'string' ? motivator.trim() : motivator;
      if (!label) {
        return;
      }
      const key = String(label);
      motivatorCounts.set(key, (motivatorCounts.get(key) ?? 0) + 1);
    });
  });

  const topMotivators = Array.from(motivatorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label, count }));

  return {
    profilesTracked: profiles.length,
    highIntentSignals,
    averageCompTarget,
    exclusivityConflicts,
    relocationReadiness,
    signalIntentBreakdown,
    topMotivators,
  };
}

function buildProspectTalentProfiles(profiles) {
  return [...profiles]
    .sort((a, b) => new Date(b.aggregatedAt ?? b.updatedAt ?? 0) - new Date(a.aggregatedAt ?? a.updatedAt ?? 0))
    .slice(0, 6)
    .map((profile) => {
      const candidate = profile.candidate ?? {};
      const name = [candidate.firstName, candidate.lastName].filter(Boolean).join(' ') || profile.metadata?.candidateName;
      const signals = ensureArray(profile.signals)
        .map((signal) => ({
          id: signal.id,
          signalType: signal.signalType,
          intentLevel: signal.intentLevel,
          summary: signal.summary,
          occurredAt: signal.occurredAt,
          source: signal.source,
        }))
        .sort((a, b) => new Date(b.occurredAt ?? 0) - new Date(a.occurredAt ?? 0))
        .slice(0, 4);

      return {
        id: profile.id,
        candidateId: profile.candidateId,
        name: name ?? 'Unknown candidate',
        email: candidate.email ?? null,
        headline: profile.headline ?? profile.primaryDiscipline ?? null,
        seniority: profile.seniorityLevel ?? null,
        availability: profile.availabilityStatus ?? null,
        motivators: ensureArray(profile.motivators).slice(0, 4),
        inflectionPoints: ensureArray(profile.inflectionPoints).slice(0, 4),
        aiHighlights: extractInsights(profile.aiHighlights).slice(0, 5),
        relocation: profile.relocationReadiness ?? 'unspecified',
        exclusivityConflict: Boolean(profile.exclusivityConflict),
        exclusivityNotes: profile.exclusivityNotes ?? null,
        compensation: {
          currency: profile.compensationCurrency ?? 'USD',
          min: profile.compensationTargetMin != null ? Number(profile.compensationTargetMin) : null,
          max: profile.compensationTargetMax != null ? Number(profile.compensationTargetMax) : null,
        },
        patents: ensureArray(profile.patents).length,
        publications: ensureArray(profile.publications).length,
        socialGraph: profile.socialGraph ?? {},
        signals,
      };
    });
}

function buildProspectingCockpit(searches, signals, profiles) {
  const savedSearches = searches.map((search) => {
    const alerts = ensureArray(search.alerts).map((alert) => ({
      id: alert.id,
      channel: alert.channel,
      status: alert.status,
      target: alert.target,
      lastTriggeredAt: alert.lastTriggeredAt,
      nextRunAt: alert.nextRunAt,
    }));

    const createdBy = search.createdBy
      ? {
          id: search.createdBy.id,
          name: `${search.createdBy.firstName ?? ''} ${search.createdBy.lastName ?? ''}`.trim() || null,
        }
      : null;

    return {
      id: search.id,
      name: search.name,
      description: search.description ?? null,
      filters: search.filters ?? {},
      skills: ensureArray(search.skills),
      diversityFocus: ensureArray(search.diversityFocus),
      cultureDrivers: ensureArray(search.cultureDrivers),
      industryTargets: ensureArray(search.industryTargets),
      isAlertEnabled: Boolean(search.isAlertEnabled),
      alertCadence: search.alertCadence ?? null,
      lastRunAt: search.lastRunAt ?? null,
      resultsCount: search.resultsCount ?? 0,
      alerts,
      createdBy,
    };
  });

  const activeAlerts = savedSearches
    .flatMap((search) =>
      search.alerts.map((alert) => ({
        ...alert,
        searchId: search.id,
        searchName: search.name,
      })),
    )
    .filter((alert) => alert.status === 'active')
    .sort((a, b) => new Date(b.lastTriggeredAt ?? 0) - new Date(a.lastTriggeredAt ?? 0))
    .slice(0, 10);

  const industryCoverage = new Map();
  savedSearches.forEach((search) => {
    ensureArray(search.industryTargets).forEach((industry) => {
      if (!industry) {
        return;
      }
      const key = String(industry).trim();
      if (!key) {
        return;
      }
      const entry = industryCoverage.get(key) ?? { industry: key, savedSearches: 0, totalResults: 0 };
      entry.savedSearches += 1;
      entry.totalResults += search.resultsCount ?? 0;
      industryCoverage.set(key, entry);
    });
  });

  const industryMaps = Array.from(industryCoverage.values())
    .map((entry) => ({
      industry: entry.industry,
      savedSearches: entry.savedSearches,
      totalResults: entry.totalResults,
      averageResults: entry.savedSearches ? Number((entry.totalResults / entry.savedSearches).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.totalResults - a.totalResults)
    .slice(0, 8);

  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  const signalStream = signals
    .map((signal) => {
      const profile = signal.profile ?? profileMap.get(signal.profileId) ?? {};
      const candidate = profile.candidate ?? {};
      return {
        id: signal.id,
        profileId: signal.profileId,
        candidateName:
          [candidate.firstName, candidate.lastName].filter(Boolean).join(' ') || profile.metadata?.candidateName || null,
        signalType: signal.signalType,
        intentLevel: signal.intentLevel,
        summary: signal.summary,
        occurredAt: signal.occurredAt,
        source: signal.source,
      };
    })
    .sort((a, b) => new Date(b.occurredAt ?? 0) - new Date(a.occurredAt ?? 0))
    .slice(0, 20);

  return {
    savedSearches,
    activeAlerts,
    industryMaps,
    signalStream,
  };
}

function buildCampaignStudioData(campaigns) {
  const formattedCampaigns = campaigns.map((campaign) => {
    const steps = ensureArray(campaign.steps)
      .map((step) => ({
        id: step.id,
        stepOrder: step.stepOrder,
        channel: step.channel,
        templateSubject: step.templateSubject ?? null,
        sendOffsetHours: step.sendOffsetHours ?? null,
        waitForReplyHours: step.waitForReplyHours ?? null,
        aiVariant: step.aiVariant ?? null,
        abTestGroup: step.abTestGroup ?? null,
        performance: step.performance ?? {},
      }))
      .sort((a, b) => (a.stepOrder ?? 0) - (b.stepOrder ?? 0));

    const rawResponseRate = campaign.responseRate != null ? Number(campaign.responseRate) : null;
    const rawConversionRate = campaign.conversionRate != null ? Number(campaign.conversionRate) : null;
    const responseRate =
      rawResponseRate != null && rawResponseRate <= 1
        ? Number((rawResponseRate * 100).toFixed(2))
        : rawResponseRate != null
        ? Number(rawResponseRate.toFixed(2))
        : null;
    const conversionRate =
      rawConversionRate != null && rawConversionRate <= 1
        ? Number((rawConversionRate * 100).toFixed(2))
        : rawConversionRate != null
        ? Number(rawConversionRate.toFixed(2))
        : null;

    return {
      id: campaign.id,
      name: campaign.name,
      persona: campaign.persona ?? null,
      goal: campaign.goal ?? null,
      status: campaign.status,
      aiBrief: campaign.aiBrief ?? null,
      channelMix: campaign.channelMix ?? {},
      launchDate: campaign.launchDate ?? null,
      responseRate,
      conversionRate,
      meetingsBooked: campaign.meetingsBooked ?? 0,
      steps,
    };
  });

  const channelStatsMap = new Map();
  formattedCampaigns.forEach((campaign) => {
    const seenChannels = new Set();
    campaign.steps.forEach((step) => {
      const key = (step.channel ?? 'other').toLowerCase();
      seenChannels.add(key);
      const stats = channelStatsMap.get(key) ?? { channel: key, steps: 0, campaignIds: new Set(), totalWaitHours: 0 };
      stats.steps += 1;
      stats.totalWaitHours += step.sendOffsetHours ?? 0;
      stats.campaignIds.add(campaign.id);
      channelStatsMap.set(key, stats);
    });

    if (!campaign.steps.length && campaign.channelMix) {
      Object.keys(campaign.channelMix).forEach((channel) => {
        const key = channel.toLowerCase();
        if (seenChannels.has(key)) {
          return;
        }
        const stats = channelStatsMap.get(key) ?? { channel: key, steps: 0, campaignIds: new Set(), totalWaitHours: 0 };
        stats.campaignIds.add(campaign.id);
        channelStatsMap.set(key, stats);
      });
    }
  });

  const channelBreakdown = Array.from(channelStatsMap.values()).map((entry) => ({
    channel: entry.channel,
    steps: entry.steps,
    campaigns: entry.campaignIds.size,
    averageWaitHours: entry.steps ? Number((entry.totalWaitHours / entry.steps).toFixed(1)) : null,
  }));

  const abTests = formattedCampaigns
    .flatMap((campaign) =>
      campaign.steps
        .filter((step) => step.abTestGroup)
        .map((step) => ({
          campaignId: campaign.id,
          campaignName: campaign.name,
          stepOrder: step.stepOrder,
          variant: step.abTestGroup,
          aiVariant: step.aiVariant,
          performance: step.performance,
        })),
    )
    .slice(0, 10);

  const responseRates = formattedCampaigns.map((campaign) => campaign.responseRate).filter((value) => value != null);
  const conversionRates = formattedCampaigns.map((campaign) => campaign.conversionRate).filter((value) => value != null);

  const aggregateMetrics = {
    totalCampaigns: formattedCampaigns.length,
    activeCampaigns: formattedCampaigns.filter((campaign) => campaign.status === 'active').length,
    averageResponseRate: responseRates.length ? Number((sumNumbers(responseRates) / responseRates.length).toFixed(2)) : null,
    averageConversionRate: conversionRates.length
      ? Number((sumNumbers(conversionRates) / conversionRates.length).toFixed(2))
      : null,
  };

  return {
    campaigns: formattedCampaigns,
    channelBreakdown,
    abTests,
    aggregateMetrics,
  };
}

function buildResearchCollaborationData(notes, tasks, profiles) {
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  const noteEntries = notes.map((note) => {
    const candidate = note.profile?.candidate ?? profileMap.get(note.profileId)?.candidate ?? {};
    return {
      id: note.id,
      title: note.title,
      body: note.body,
      visibility: note.visibility,
      isComplianceEvent: Boolean(note.isComplianceEvent),
      tags: ensureArray(note.tags).slice(0, 6),
      createdAt: note.createdAt,
      author: note.author
        ? {
            id: note.author.id,
            name: `${note.author.firstName ?? ''} ${note.author.lastName ?? ''}`.trim() || null,
          }
        : null,
      candidate: candidate && (candidate.firstName || candidate.lastName)
        ? {
            id: candidate.id,
            name: `${candidate.firstName ?? ''} ${candidate.lastName ?? ''}`.trim(),
          }
        : null,
    };
  });

  const taskEntries = tasks.map((task) => {
    const candidate = task.profile?.candidate ?? profileMap.get(task.profileId)?.candidate ?? {};
    return {
      id: task.id,
      title: task.title,
      description: task.description ?? null,
      status: task.status,
      priority: task.priority,
      dueAt: task.dueAt ?? null,
      metadata: task.metadata ?? {},
      assignee: task.assignee
        ? {
            id: task.assignee.id,
            name: `${task.assignee.firstName ?? ''} ${task.assignee.lastName ?? ''}`.trim() || null,
          }
        : null,
      createdBy: task.createdBy
        ? {
            id: task.createdBy.id,
            name: `${task.createdBy.firstName ?? ''} ${task.createdBy.lastName ?? ''}`.trim() || null,
          }
        : null,
      candidate: candidate && (candidate.firstName || candidate.lastName)
        ? {
            id: candidate.id,
            name: `${candidate.firstName ?? ''} ${candidate.lastName ?? ''}`.trim(),
          }
        : null,
    };
  });

  const taskSummary = taskEntries.reduce((acc, task) => {
    const key = task.status ?? 'unknown';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const complianceLog = noteEntries
    .filter((note) => note.isComplianceEvent)
    .map((note) => ({
      id: note.id,
      title: note.title,
      visibility: note.visibility,
      candidateName: note.candidate?.name ?? null,
      createdAt: note.createdAt,
    }));

  const guardrails = {
    restrictedNotes: noteEntries.filter((note) => note.visibility === 'restricted').length,
    complianceEvents: complianceLog.length,
    retentionReviews: taskEntries.filter((task) => Boolean(task.metadata?.retentionReview)).length,
  };

  return {
    notes: noteEntries.slice(0, 12),
    tasks: taskEntries.slice(0, 12),
    taskSummary,
    compliance: {
      guardrails,
      log: complianceLog.slice(0, 12),
    },
  };
}

function buildClientPartnerships(contactNotes) {
  if (!contactNotes.length) {
    return {
      totalClients: 0,
      engagedThisQuarter: 0,
      avgSatisfaction: null,
      topContacts: [],
    };
  }

  const contactMap = new Map();
  contactNotes.forEach((note) => {
    const subject = note.subject;
    if (!subject) {
      return;
    }
    const key = subject.id;
    const existing =
      contactMap.get(key) ?? {
        userId: subject.id,
        name: `${subject.firstName} ${subject.lastName}`.trim(),
        email: subject.email,
        company: null,
        lastInteractionAt: null,
        notes: [],
      };

    existing.notes.push(note.note);
    const latest = note.createdAt ?? note.updatedAt;
    if (latest && (!existing.lastInteractionAt || new Date(latest) > new Date(existing.lastInteractionAt))) {
      existing.lastInteractionAt = latest;
    }
    contactMap.set(key, existing);
  });

  const contacts = Array.from(contactMap.values()).sort((a, b) => {
    if (!a.lastInteractionAt && !b.lastInteractionAt) return 0;
    if (!a.lastInteractionAt) return 1;
    if (!b.lastInteractionAt) return -1;
    return new Date(b.lastInteractionAt) - new Date(a.lastInteractionAt);
  });

  const engagedThisQuarter = contacts.filter((contact) => {
    if (!contact.lastInteractionAt) return false;
    const diffDays = (Date.now() - new Date(contact.lastInteractionAt).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 90;
  }).length;

  return {
    totalClients: contacts.length,
    engagedThisQuarter,
    avgSatisfaction: null,
    topContacts: contacts.slice(0, 8),
  };
}

function buildClientManagementInsights(engagements = []) {
  const contractStatusCounts = {};
  let retainerTotal = 0;

  const retainers = [];
  const successFees = [];
  const mandates = [];

  engagements.forEach((engagement) => {
    const status = engagement.contractStatus ?? 'draft';
    contractStatusCounts[status] = (contractStatusCounts[status] ?? 0) + 1;

    const retainerAmount = normaliseNumber(engagement.retainerAmount);
    if (retainerAmount != null) {
      retainerTotal += retainerAmount;
    }

    const retainersForEngagement = {
      engagementId: engagement.id,
      clientName: engagement.clientName,
      retainerAmount: formatDecimal(retainerAmount),
      currency: engagement.retainerCurrency ?? 'USD',
      status,
      renewalDate: engagement.renewalDate ?? engagement.endDate ?? null,
      successFeePercentage: formatDecimal(engagement.successFeePercentage),
      accountManager: engagement.metadata?.accountManager ?? null,
    };
    retainers.push(retainersForEngagement);

    const engagementMandates = Array.isArray(engagement.mandates) ? engagement.mandates : [];
    engagementMandates.forEach((mandate) => {
      mandates.push({
        id: mandate.id,
        engagementId: engagement.id,
        clientName: engagement.clientName,
        title: mandate.title,
        status: mandate.status,
        openRoles: mandate.openRoles ?? 0,
        filledRoles: mandate.filledRoles ?? 0,
        pipelineValue: formatDecimal(mandate.pipelineValue),
        nextMilestoneAt: mandate.nextMilestoneAt ?? null,
      });
    });

    if (engagement.successFeePercentage != null) {
      const pct = normaliseNumber(engagement.successFeePercentage);
      const pipelineForecast = sumNumbers(
        engagementMandates.map((mandate) => normaliseNumber(mandate.forecastRevenue) ?? 0),
      );
      const projectedPayout = pct != null ? Number(((pct / 100) * pipelineForecast).toFixed(2)) : null;
      const lastPlacementAt = engagementMandates
        .map((mandate) => {
          const metadata = normaliseMetadata(mandate.metadata);
          return metadata.lastPlacementAt ?? mandate.updatedAt ?? mandate.nextMilestoneAt ?? null;
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b) - new Date(a))[0];

      successFees.push({
        engagementId: engagement.id,
        clientName: engagement.clientName,
        percentage: pct != null ? Number(pct.toFixed(2)) : null,
        trigger: engagement.successFeeTrigger ?? 'On placement',
        projectedPayout,
        lastPlacementAt: lastPlacementAt ?? null,
      });
    }
  });

  const upcomingRenewals = retainers
    .filter((entry) => entry.renewalDate)
    .sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate))
    .slice(0, 6);

  const successFeeAverage = successFees.length
    ? Number((sumNumbers(successFees.map((entry) => entry.percentage ?? 0)) / successFees.length).toFixed(2))
    : null;

  return {
    totals: {
      retainerValue: Number(retainerTotal.toFixed(2)),
      activeContracts: (contractStatusCounts.active ?? 0) + (contractStatusCounts.renewal_due ?? 0),
      successFeeAverage,
      mandatesInFlight: mandates.length,
    },
    contractStatus: Object.entries(contractStatusCounts).map(([status, count]) => ({ status, count })),
    retainers: upcomingRenewals,
    successFees,
    mandates: mandates.slice(0, 20),
  };
}

function buildPerformanceAnalyticsInsights(engagements = []) {
  const mandates = engagements.flatMap((engagement) => {
    const engagementMandates = Array.isArray(engagement.mandates) ? engagement.mandates : [];
    return engagementMandates.map((mandate) => ({ ...mandate, clientName: engagement.clientName }));
  });

  const submissionCount = sumNumbers(
    mandates.map((mandate) => {
      const metadata = normaliseMetadata(mandate.metadata);
      const fromMetadata = normaliseNumber(metadata.submissions);
      if (fromMetadata != null) {
        return fromMetadata;
      }
      return (mandate.openRoles ?? 0) + (mandate.filledRoles ?? 0);
    }),
  );
  const interviewCount = sumNumbers(
    mandates.map((mandate) => {
      const metadata = normaliseMetadata(mandate.metadata);
      const fromMetadata = normaliseNumber(metadata.interviews);
      if (fromMetadata != null) {
        return fromMetadata;
      }
      return Math.max(mandate.filledRoles ?? 0, 0);
    }),
  );
  const offersCount = sumNumbers(
    mandates.map((mandate) => {
      const metadata = normaliseMetadata(mandate.metadata);
      const fromMetadata = normaliseNumber(metadata.offers);
      if (fromMetadata != null) {
        return fromMetadata;
      }
      return Math.max(mandate.filledRoles ?? 0, 0);
    }),
  );
  const placementsCount = sumNumbers(mandates.map((mandate) => mandate.filledRoles ?? 0));
  const totalRoles = sumNumbers(
    mandates.map((mandate) => (mandate.openRoles ?? 0) + (mandate.filledRoles ?? 0)),
  );

  const placementRate = totalRoles
    ? Number(((placementsCount / totalRoles) * 100).toFixed(1))
    : 0;

  const avgTimeToSubmit = computeAverage(
    mandates
      .map((mandate) => normaliseNumber(mandate.avgTimeToSubmitDays))
      .filter((value) => value != null),
    1,
  );
  const interviewToOffer = computeAverage(
    mandates
      .map((mandate) => normaliseNumber(mandate.interviewToOfferDays))
      .filter((value) => value != null),
    1,
  );

  const retainerTotal = sumNumbers(engagements.map((engagement) => normaliseNumber(engagement.retainerAmount) ?? 0));
  const successFeePotential = sumNumbers(
    engagements.map((engagement) => {
      const pct = normaliseNumber(engagement.successFeePercentage);
      if (pct == null) {
        return 0;
      }
      const forecast = sumNumbers(
        (engagement.mandates ?? []).map((mandate) => normaliseNumber(mandate.forecastRevenue) ?? 0),
      );
      return (pct / 100) * forecast;
    }),
  );
  const revenueRecognized = sumNumbers(
    mandates.map((mandate) => normaliseNumber(mandate.revenueRecognized) ?? 0),
  );
  const totalRevenue = Number((retainerTotal + successFeePotential + revenueRecognized).toFixed(2));
  const pipelineValue = Number(
    sumNumbers(mandates.map((mandate) => normaliseNumber(mandate.pipelineValue) ?? 0)).toFixed(2),
  );

  const submissionToInterview = submissionCount
    ? Number(((interviewCount / submissionCount) * 100).toFixed(1))
    : null;
  const interviewToOfferRatio = interviewCount
    ? Number(((offersCount / interviewCount) * 100).toFixed(1))
    : null;
  const offerToPlacement = offersCount
    ? Number(((placementsCount / offersCount) * 100).toFixed(1))
    : null;

  const trendlineMap = new Map();
  mandates.forEach((mandate) => {
    const metadata = normaliseMetadata(mandate.metadata);
    const trendEntries = Array.isArray(metadata.performanceTrend) ? metadata.performanceTrend : [];
    trendEntries.forEach((entry) => {
      const period = entry.period ?? entry.month ?? 'current';
      const existing = trendlineMap.get(period) ?? { period, placements: 0, revenue: 0 };
      existing.placements += normaliseNumber(entry.placements) ?? 0;
      existing.revenue += normaliseNumber(entry.revenue) ?? 0;
      trendlineMap.set(period, existing);
    });
  });

  if (!trendlineMap.size && mandates.length) {
    trendlineMap.set('current', {
      period: 'current',
      placements: placementsCount,
      revenue: retainerTotal + revenueRecognized,
    });
    trendlineMap.set('next', {
      period: 'next',
      placements: Math.round(placementsCount * 0.6),
      revenue: pipelineValue * 0.4,
    });
  }

  const trendline = Array.from(trendlineMap.values())
    .map((entry) => ({
      period: entry.period,
      placements: Number((normaliseNumber(entry.placements) ?? 0).toFixed(0)),
      revenue: Number((normaliseNumber(entry.revenue) ?? 0).toFixed(2)),
    }))
    .sort((a, b) => (a.period > b.period ? 1 : -1));

  const sectorMap = new Map();
  engagements.forEach((engagement) => {
    const key = engagement.industry ?? 'General';
    const value = sectorMap.get(key) ?? { sector: key, activeMandates: 0, revenue: 0 };
    const engagementMandates = Array.isArray(engagement.mandates) ? engagement.mandates : [];
    value.activeMandates += engagementMandates.filter((mandate) => mandate.status !== 'closed').length;
    value.revenue += sumNumbers(
      engagementMandates.map((mandate) => normaliseNumber(mandate.forecastRevenue) ?? 0),
    );
    value.revenue += normaliseNumber(engagement.retainerAmount) ?? 0;
    sectorMap.set(key, value);
  });

  const sectorBreakdown = Array.from(sectorMap.values()).map((entry) => ({
    sector: entry.sector,
    activeMandates: entry.activeMandates,
    revenue: Number(entry.revenue.toFixed(2)),
  }));

  return {
    totals: {
      placementRate,
      timeToSubmit: avgTimeToSubmit,
      interviewToOffer,
      revenue: totalRevenue,
      pipelineValue,
    },
    ratios: {
      submissionToInterview,
      interviewToOffer: interviewToOfferRatio,
      offerToPlacement,
    },
    revenueBreakdown: [
      { label: 'Retainers', value: Number(retainerTotal.toFixed(2)) },
      { label: 'Success fees', value: Number(successFeePotential.toFixed(2)) },
      { label: 'Recognized mandate revenue', value: Number(revenueRecognized.toFixed(2)) },
    ],
    sectorBreakdown,
    trendline,
  };
}

function buildCalendarAvailabilityInsights(engagements = [], lookbackDate) {
  const events = engagements.flatMap((engagement) =>
    (engagement.scheduleEvents ?? []).map((event) => ({ ...event, clientName: engagement.clientName })),
  );

  const cutoff = lookbackDate ? new Date(lookbackDate) : null;

  const upcomingPersonal = events
    .filter((event) => event.scope === 'personal')
    .filter((event) => {
      if (!event.startAt) return false;
      if (!cutoff) return true;
      return new Date(event.startAt) >= cutoff;
    })
    .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
    .slice(0, 10)
    .map((event) => ({
      title: event.title,
      startAt: event.startAt,
      endAt: event.endAt,
      eventType: event.eventType,
      hostName: event.hostName ?? null,
      location: event.location ?? null,
    }));

  const sharedMap = new Map();
  events
    .filter((event) => event.scope === 'shared')
    .forEach((event) => {
      const key = event.clientName ?? 'Shared';
      const list = sharedMap.get(key) ?? [];
      list.push({
        title: event.title,
        startAt: event.startAt,
        eventType: event.eventType,
        hostName: event.hostName ?? null,
        location: event.location ?? null,
      });
      sharedMap.set(key, list);
    });

  const shared = Array.from(sharedMap.entries()).map(([clientName, entries]) => ({
    clientName,
    events: entries.sort((a, b) => new Date(a.startAt) - new Date(b.startAt)).slice(0, 5),
  }));

  const availabilitySlots = events
    .filter((event) => event.scope === 'availability')
    .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
    .slice(0, 12)
    .map((event) => ({
      title: event.title,
      startAt: event.startAt,
      endAt: event.endAt,
      hostName: event.hostName ?? null,
      clientName: event.clientName ?? null,
      channel: event.eventType,
    }));

  const availabilityHours = sumNumbers(
    availabilitySlots
      .map((slot) => computeHoursBetween(slot.startAt, slot.endAt))
      .filter((value) => value != null),
  );

  return {
    personal: { upcoming: upcomingPersonal },
    shared,
    availability: {
      slots: availabilitySlots,
      totalHours: Number((availabilityHours || 0).toFixed(1)),
    },
  };
}

function buildClientExcellenceInsights(engagements = [], contactSummary = {}) {
  const dashboards = engagements.map((engagement) => {
    const milestones = Array.isArray(engagement.milestones) ? engagement.milestones : [];
    const atRisk = milestones.some((milestone) => milestone.status === 'at_risk');
    const completedCount = milestones.filter((milestone) => milestone.status === 'completed').length;
    const health = atRisk ? 'at_risk' : completedCount === milestones.length && milestones.length ? 'completed' : 'on_track';
    const lastUpdate = milestones
      .map(
        (milestone) =>
          milestone.completedAt ?? milestone.dueDate ?? milestone.updatedAt ?? milestone.createdAt ?? null,
      )
      .filter(Boolean)
      .sort((a, b) => new Date(b) - new Date(a))[0];

    return {
      engagementId: engagement.id,
      clientName: engagement.clientName,
      health,
      summary: engagement.notes ?? engagement.metadata?.summary ?? null,
      updatedAt: lastUpdate ?? null,
      activeMandates: (engagement.mandates ?? []).length,
      retainerAmount: formatDecimal(engagement.retainerAmount),
    };
  });

  const milestoneUpdates = engagements
    .flatMap((engagement) =>
      (engagement.milestones ?? []).map((milestone) => ({
        engagementId: engagement.id,
        clientName: engagement.clientName,
        name: milestone.name,
        status: milestone.status,
        kind: milestone.kind,
        dueDate: milestone.dueDate,
        completedAt: milestone.completedAt,
        impactScore: formatDecimal(milestone.impactScore),
        summary: milestone.summary ?? milestone.details ?? null,
      })),
    )
    .sort((a, b) => {
      const left = a.completedAt ?? a.dueDate ?? 0;
      const right = b.completedAt ?? b.dueDate ?? 0;
      return new Date(right) - new Date(left);
    })
    .slice(0, 20);

  const roiNarratives = milestoneUpdates
    .filter((entry) => ['roi', 'story', 'health'].includes(entry.kind))
    .map((entry) => ({
      ...entry,
      narrative: entry.summary,
    }))
    .slice(0, 10);

  return {
    dashboards: dashboards.slice(0, 12),
    milestones: milestoneUpdates,
    roiNarratives,
    contactHighlights: (contactSummary.topContacts ?? []).slice(0, 5),
  };
}

function buildClientPortalsInsights(engagements = []) {
  const portals = engagements.flatMap((engagement) =>
    (engagement.portals ?? []).map((portal) => ({
      id: portal.id,
      engagementId: engagement.id,
      clientName: engagement.clientName,
      status: portal.status,
      inviteCount: portal.inviteCount ?? 0,
      activeUsers: portal.activeUsers ?? 0,
      lastLoginAt: portal.lastLoginAt ?? null,
      brandingTheme: portal.brandingTheme ?? 'standard',
      primaryColor: portal.primaryColor ?? '#1d4ed8',
      secondaryColor: portal.secondaryColor ?? '#1e293b',
      customDomain: portal.customDomain ?? null,
      autoReportFrequency: portal.autoReportFrequency ?? null,
    })),
  );

  const totals = {
    active: portals.filter((portal) => portal.status === 'active').length,
    invitesPending: sumNumbers(
      portals.map((portal) => Math.max((portal.inviteCount ?? 0) - (portal.activeUsers ?? 0), 0)),
    ),
    adoptionRate: portals.length
      ? Number(
          (
            sumNumbers(portals.map((portal) => portal.activeUsers ?? 0)) /
            Math.max(sumNumbers(portals.map((portal) => portal.inviteCount ?? 0)), 1)
          ).toFixed(2),
        )
      : null,
  };

  const brandingLibrary = portals.map((portal) => ({
    clientName: portal.clientName,
    theme: portal.brandingTheme,
    primaryColor: portal.primaryColor,
    secondaryColor: portal.secondaryColor,
    customDomain: portal.customDomain,
  }));

  const auditLog = engagements
    .flatMap((engagement) =>
      (engagement.portals ?? []).flatMap((portal) =>
        (portal.auditLogs ?? []).map((log) => ({
          id: log.id,
          portalId: portal.id,
          clientName: engagement.clientName,
          eventType: log.eventType,
          actorName: log.actorName ?? null,
          occurredAt: log.occurredAt,
          description: log.description ?? null,
        })),
      ),
    )
    .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
    .slice(0, 20);

  return {
    totals,
    portals,
    brandingLibrary,
    auditLog,
  };
}

function buildMandatePerformanceInsights(engagements = []) {
  const mandates = engagements.flatMap((engagement) =>
    (engagement.mandates ?? []).map((mandate) => ({ ...mandate, clientName: engagement.clientName })),
  );

  const submissions = sumNumbers(
    mandates.map((mandate) => {
      const metadata = normaliseMetadata(mandate.metadata);
      const fromMetadata = normaliseNumber(metadata.submissions);
      if (fromMetadata != null) {
        return fromMetadata;
      }
      return (mandate.openRoles ?? 0) + (mandate.filledRoles ?? 0);
    }),
  );
  const interviews = sumNumbers(
    mandates.map((mandate) => {
      const metadata = normaliseMetadata(mandate.metadata);
      const fromMetadata = normaliseNumber(metadata.interviews);
      if (fromMetadata != null) {
        return fromMetadata;
      }
      return Math.max(mandate.filledRoles ?? 0, 0);
    }),
  );
  const offers = sumNumbers(
    mandates.map((mandate) => {
      const metadata = normaliseMetadata(mandate.metadata);
      const fromMetadata = normaliseNumber(metadata.offers);
      if (fromMetadata != null) {
        return fromMetadata;
      }
      return Math.max(mandate.filledRoles ?? 0, 0);
    }),
  );
  const placements = sumNumbers(mandates.map((mandate) => mandate.filledRoles ?? 0));

  const diversityValues = mandates
    .map((mandate) => normaliseNumber(mandate.diversitySlatePct))
    .filter((value) => value != null);
  const qualityValues = mandates
    .map((mandate) => normaliseNumber(mandate.qualityScore))
    .filter((value) => value != null);

  const mandateEntries = mandates.map((mandate) => ({
    id: mandate.id,
    engagementId: mandate.engagementId,
    clientName: mandate.clientName,
    title: mandate.title,
    status: mandate.status,
    pipelineValue: formatDecimal(mandate.pipelineValue),
    forecastRevenue: formatDecimal(mandate.forecastRevenue),
    diversitySlatePct: formatDecimal(mandate.diversitySlatePct),
    qualityScore: formatDecimal(mandate.qualityScore),
    nextMilestoneAt: mandate.nextMilestoneAt ?? null,
  }));

  const reports = mandates
    .flatMap((mandate) => {
      const metadata = normaliseMetadata(mandate.metadata);
      const templates = Array.isArray(metadata.reportTemplates) ? metadata.reportTemplates : [];
      return templates.map((template) => ({
        mandateId: mandate.id,
        clientName: mandate.clientName,
        name: template.name ?? 'Pipeline summary',
        format: template.format ?? 'pdf',
        generatedAt: template.generatedAt ?? null,
      }));
    })
    .slice(0, 12);

  const forecasts = mandateEntries
    .filter((entry) => entry.forecastRevenue != null)
    .map((entry) => ({
      mandateId: entry.id,
      clientName: entry.clientName,
      expectedCloseDate: entry.nextMilestoneAt ?? null,
      revenue: entry.forecastRevenue,
    }));

  return {
    totals: { submissions, interviews, offers, placements },
    diversity: {
      averageSlatePct: diversityValues.length
        ? Number((sumNumbers(diversityValues) / diversityValues.length).toFixed(1))
        : null,
    },
    quality: {
      averageScore: qualityValues.length
        ? Number((sumNumbers(qualityValues) / qualityValues.length).toFixed(1))
        : null,
    },
    mandates: mandateEntries,
    reports,
    forecasts,
  };
}

function buildCommercialOperationsInsights(engagements = []) {
  const invoices = engagements.flatMap((engagement) =>
    (engagement.invoices ?? []).map((invoice) => ({
      ...invoice,
      clientName: engagement.clientName,
    })),
  );

  const outstanding = sumNumbers(
    invoices
      .filter((invoice) => ['draft', 'pending', 'sent', 'pending_payment'].includes((invoice.status ?? '').toLowerCase()))
      .map((invoice) => normaliseNumber(invoice.amount) ?? 0),
  );
  const overdue = sumNumbers(
    invoices
      .filter((invoice) => {
        if (!invoice.dueDate) return false;
        const status = (invoice.status ?? '').toLowerCase();
        if (!['sent', 'pending_payment', 'overdue'].includes(status)) {
          return false;
        }
        return new Date(invoice.dueDate) < new Date();
      })
      .map((invoice) => normaliseNumber(invoice.amount) ?? 0),
  );
  const paidThisQuarter = sumNumbers(
    invoices
      .filter((invoice) => {
        const status = (invoice.status ?? '').toLowerCase();
        if (!['paid', 'recognized'].includes(status)) {
          return false;
        }
        if (!invoice.paidDate) {
          return false;
        }
        const diffDays = (Date.now() - new Date(invoice.paidDate).getTime()) / (1000 * 60 * 60 * 24);
        return Number.isFinite(diffDays) && diffDays <= 90;
      })
      .map((invoice) => normaliseNumber(invoice.amount) ?? 0),
  );

  const upcomingInvoices = invoices
    .filter((invoice) => invoice.dueDate && new Date(invoice.dueDate) >= new Date())
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 10)
    .map((invoice) => ({
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName,
      amount: formatDecimal(invoice.amount),
      currency: invoice.currency ?? 'USD',
      dueDate: invoice.dueDate,
      status: invoice.status,
    }));

  const commissions = engagements.flatMap((engagement) =>
    (engagement.commissions ?? []).map((commission) => ({
      engagementId: engagement.id,
      clientName: engagement.clientName,
      partnerName: commission.partnerName,
      percentage: formatDecimal(commission.percentage),
      amount: formatDecimal(commission.amount),
      status: commission.status,
    })),
  );

  const retainerSchedule = engagements
    .map((engagement) => ({
      engagementId: engagement.id,
      clientName: engagement.clientName,
      retainerAmount: formatDecimal(engagement.retainerAmount),
      currency: engagement.retainerCurrency ?? 'USD',
      renewalDate: engagement.renewalDate ?? engagement.endDate ?? null,
      billingCadence: engagement.retainerBillingCadence ?? 'monthly',
    }))
    .sort((a, b) => {
      if (!a.renewalDate && !b.renewalDate) return 0;
      if (!a.renewalDate) return 1;
      if (!b.renewalDate) return -1;
      return new Date(a.renewalDate) - new Date(b.renewalDate);
    })
    .slice(0, 12);

  const integrations = Array.from(
    new Set(engagements.map((engagement) => engagement.accountingIntegration).filter(Boolean)),
  ).map((provider) => ({
    provider,
    status: 'connected',
  }));

  return {
    retainers: retainerSchedule,
    invoices: {
      totals: {
        outstanding: Number((outstanding || 0).toFixed(2)),
        overdue: Number((overdue || 0).toFixed(2)),
        paidThisQuarter: Number((paidThisQuarter || 0).toFixed(2)),
      },
      upcoming: upcomingInvoices,
    },
    commissions,
    integrations,
  };
}

function buildIssueResolutionDeskInsights(issueCases = []) {
  const resolutionDurations = issueCases
    .map((item) => computeHoursBetween(item.openedAt, item.resolvedAt))
    .filter((value) => value != null);

  const playbooksMap = new Map();
  issueCases.forEach((item) => {
    const key = item.playbookUsed ?? 'unassigned';
    const current = playbooksMap.get(key) ?? { name: key, usageCount: 0, lastUsedAt: null };
    current.usageCount += 1;
    const lastEvent = (item.events ?? [])
      .map((event) => event.occurredAt)
      .filter(Boolean)
      .sort((a, b) => new Date(b) - new Date(a))[0];
    const candidateDate = item.resolvedAt ?? lastEvent ?? item.updatedAt ?? item.openedAt;
    if (candidateDate && (!current.lastUsedAt || new Date(candidateDate) > new Date(current.lastUsedAt))) {
      current.lastUsedAt = candidateDate;
    }
    playbooksMap.set(key, current);
  });

  const playbooks = Array.from(playbooksMap.values()).map((entry) => ({
    name: entry.name,
    usageCount: entry.usageCount,
    lastUsedAt: entry.lastUsedAt,
  }));

  const cases = issueCases.map((item) => ({
    id: item.id,
    engagementId: item.engagementId,
    clientName: item.engagement?.clientName ?? null,
    caseType: item.caseType,
    status: item.status,
    severity: item.severity,
    priority: item.priority,
    openedAt: item.openedAt,
    resolvedAt: item.resolvedAt,
    playbookUsed: item.playbookUsed ?? null,
    escalatedTo: item.escalatedTo ?? null,
    outcome: item.outcome ?? null,
  }));

  const escalations = issueCases
    .filter((item) => item.escalatedTo)
    .map((item) => ({
      id: item.id,
      caseType: item.caseType,
      escalatedTo: item.escalatedTo,
      occurredAt: item.metadata?.escalatedAt ?? item.updatedAt ?? item.openedAt,
      status: item.status,
    }));

  const resolvedThisQuarter = issueCases.filter((item) => {
    if (!item.resolvedAt) {
      return false;
    }
    const diffDays = (Date.now() - new Date(item.resolvedAt).getTime()) / (1000 * 60 * 60 * 24);
    return Number.isFinite(diffDays) && diffDays <= 90;
  }).length;

  return {
    totals: {
      openCases: issueCases.filter((item) => ['open', 'in_progress', 'awaiting_client', 'escalated'].includes(item.status))
        .length,
      awaitingClient: issueCases.filter((item) => item.status === 'awaiting_client').length,
      resolvedThisQuarter,
      avgResolutionHours: computeAverage(resolutionDurations, 1),
    },
    cases: cases.slice(0, 25),
    escalations: escalations.slice(0, 15),
    playbooks,
  };
}

function buildPartnershipsInsights({ engagements = [], contactSummary = {}, issueCases = [], lookbackDate }) {
  const management = buildClientManagementInsights(engagements);
  const analytics = buildPerformanceAnalyticsInsights(engagements);
  const calendars = buildCalendarAvailabilityInsights(engagements, lookbackDate);
  const excellence = buildClientExcellenceInsights(engagements, contactSummary);
  const portals = buildClientPortalsInsights(engagements);
  const mandatePerformance = buildMandatePerformanceInsights(engagements);
  const commercialOperations = buildCommercialOperationsInsights(engagements);
  const issueResolution = buildIssueResolutionDeskInsights(issueCases);

  return {
    summary: contactSummary,
    topContacts: contactSummary.topContacts ?? [],
    management,
    analytics,
    calendars,
    excellence,
    portals,
    mandatePerformance,
    commercialOperations,
    issueResolution,
  };
}

function buildCalendar(applications, recentActivity, lookbackDate) {
  const rawEvents = [];

  applications.forEach((application) => {
    if (application.submittedAt) {
      rawEvents.push({
        type: 'submission',
        label: 'Application submitted',
        date: application.submittedAt,
        applicationId: application.id,
        stage: determineStageKey(application.status),
      });
    }
    if (application.decisionAt) {
      rawEvents.push({
        type: application.status,
        label: `Decision: ${application.status.replace('_', ' ')}`,
        date: application.decisionAt,
        applicationId: application.id,
        stage: determineStageKey(application.status),
      });
    }
    if (Array.isArray(application.reviews)) {
      application.reviews.forEach((review) => {
        if (review.decidedAt) {
          rawEvents.push({
            type: `review:${review.stage}`,
            label: `Review ${review.stage}`,
            date: review.decidedAt,
            applicationId: application.id,
            stage: review.stage,
          });
        }
      });
    }
  });

  recentActivity
    .filter((event) => event.occurredAt)
    .forEach((event) => {
      rawEvents.push({
        type: `activity:${event.stage}`,
        label: event.description ?? `Activity: ${event.stage}`,
        date: event.occurredAt,
        applicationId: event.applicationId,
        stage: event.stage,
      });
    });

  const upcoming = rawEvents
    .filter((event) => {
      const eventDate = new Date(event.date);
      if (!Number.isFinite(eventDate.getTime())) {
        return false;
      }
      return !lookbackDate || eventDate >= lookbackDate;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 12);

  const interviewsThisWeek = rawEvents.filter((event) => /interview/i.test(event.label)).length;
  const offersPending = rawEvents.filter((event) => /offer/i.test(event.label)).length;
  const prepSessions = rawEvents.filter((event) => /prep|review/.test(event.type)).length;

  return {
    upcoming,
    workload: {
      interviewsThisWeek,
      offersPending,
      prepSessions,
      downtimeBlocks: 0,
    },
  };
}

function buildActivityTimeline(recentActivity, outreachCampaigns) {
  const outreachEvents = outreachCampaigns.map((campaign) => ({
    type: 'outreach',
    stage: 'outreach',
    occurredAt: campaign.lastTouchpointAt ?? campaign.startedAt,
    label: campaign.subject,
    status: campaign.status,
  }));

  return [...recentActivity, ...outreachEvents]
    .filter((event) => event.occurredAt)
    .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
    .slice(0, 20)
    .map((event) => ({
      type: event.type,
      stage: event.stage,
      date: event.occurredAt,
      label: event.label ?? event.description ?? event.status ?? event.stage,
      status: event.status ?? event.stage,
    }));
}

async function loadProspectIntelligence(workspaceId, lookbackDate) {
  const [profileRecords, searchRecords, campaignRecords, noteRecords, taskRecords, signalRecords] = await Promise.all([
    ProspectIntelligenceProfile.findAll({
      where: { workspaceId },
      include: [
        {
          model: User,
          as: 'candidate',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: ProspectIntelligenceSignal,
          as: 'signals',
          required: false,
          where: lookbackDate ? { occurredAt: { [Op.gte]: lookbackDate } } : undefined,
          separate: true,
          order: [['occurredAt', 'DESC']],
          limit: 10,
        },
      ],
      order: [['aggregatedAt', 'DESC']],
    }),
    ProspectSearchDefinition.findAll({
      where: { workspaceId },
      include: [
        {
          model: ProspectSearchAlert,
          as: 'alerts',
          required: false,
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
      order: [['updatedAt', 'DESC']],
    }),
    ProspectCampaign.findAll({
      where: { workspaceId },
      include: [
        {
          model: ProspectCampaignStep,
          as: 'steps',
          required: false,
        },
      ],
      order: [
        ['status', 'ASC'],
        ['launchDate', 'DESC'],
      ],
    }),
    ProspectResearchNote.findAll({
      where: {
        workspaceId,
        ...(lookbackDate ? { createdAt: { [Op.gte]: lookbackDate } } : {}),
      },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName'],
        },
        {
          model: ProspectIntelligenceProfile,
          as: 'profile',
          include: [
            {
              model: User,
              as: 'candidate',
              attributes: ['id', 'firstName', 'lastName'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 40,
    }),
    ProspectResearchTask.findAll({
      where: { workspaceId },
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'firstName', 'lastName'],
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'firstName', 'lastName'],
        },
        {
          model: ProspectIntelligenceProfile,
          as: 'profile',
          include: [
            {
              model: User,
              as: 'candidate',
              attributes: ['id', 'firstName', 'lastName'],
            },
          ],
        },
      ],
      order: [
        ['status', 'ASC'],
        ['dueAt', 'ASC'],
      ],
      limit: 40,
    }),
    ProspectIntelligenceSignal.findAll({
      where: {
        workspaceId,
        ...(lookbackDate ? { occurredAt: { [Op.gte]: lookbackDate } } : {}),
      },
      include: [
        {
          model: ProspectIntelligenceProfile,
          as: 'profile',
          include: [
            {
              model: User,
              as: 'candidate',
              attributes: ['id', 'firstName', 'lastName'],
            },
          ],
        },
      ],
      order: [['occurredAt', 'DESC']],
      limit: 120,
    }),
  ]);

  const profiles = profileRecords.map(toPlainRecord).map((profile) => ({
    ...profile,
    signals: ensureArray(profile.signals),
  }));
  const searches = searchRecords.map(toPlainRecord).map((search) => ({
    ...search,
    alerts: ensureArray(search.alerts),
  }));
  const campaigns = campaignRecords.map(toPlainRecord).map((campaign) => ({
    ...campaign,
    steps: ensureArray(campaign.steps),
  }));
  const notes = noteRecords.map(toPlainRecord).map((note) => ({
    ...note,
    tags: ensureArray(note.tags),
  }));
  const tasks = taskRecords.map(toPlainRecord);
  const signals = signalRecords.map(toPlainRecord);

  return {
    overview: buildProspectIntelligenceOverview(profiles, signals),
    talentProfiles: buildProspectTalentProfiles(profiles),
    cockpit: buildProspectingCockpit(searches, signals, profiles),
    campaignStudio: buildCampaignStudioData(campaigns),
    researchCollaboration: buildResearchCollaborationData(notes, tasks, profiles),
  };
}

async function loadCandidateProfiles(applications) {
  const ids = Array.from(new Set(applications.map((application) => application.applicantId))).filter(Boolean);
  if (!ids.length) {
    return [];
  }

  const candidates = await User.findAll({
    where: { id: { [Op.in]: ids } },
    attributes: ['id', 'firstName', 'lastName', 'email'],
    include: [{ model: Profile }],
  });

  return candidates.map((candidate) => candidate.get({ plain: true }));
}

async function loadApplicationsWithReviews() {
  const records = await Application.findAll({
    include: [
      {
        model: ApplicationReview,
        as: 'reviews',
      },
    ],
    order: [['updatedAt', 'DESC']],
  });

  return records.map((record) => record.get({ plain: true }));
}

async function loadAvailabilityWindows(workspaceId) {
  const records = await ProviderAvailabilityWindow.findAll({
    where: { workspaceId },
    order: [
      ['dayOfWeek', 'ASC'],
      ['startTimeUtc', 'ASC'],
    ],
  });

  return records.map((record) => record.get({ plain: true }));
}

async function loadWellbeingLogs(workspaceId, lookbackDate) {
  const records = await ProviderWellbeingLog.findAll({
    where: {
      workspaceId,
      recordedAt: {
        [Op.gte]: lookbackDate,
      },
    },
    order: [['recordedAt', 'DESC']],
    limit: 60,
  });

  return records.map((record) => record.get({ plain: true }));
}

async function loadKnowledgeArticles(workspace, lookbackDate) {
  const articles = await SupportKnowledgeArticle.findAll({
    where: {
      [Op.or]: [
        { lastReviewedAt: null },
        {
          lastReviewedAt: {
            [Op.gte]: lookbackDate,
          },
        },
      ],
    },
    order: [['updatedAt', 'DESC']],
    limit: 50,
  });

  const plainArticles = articles.map((article) => article.get({ plain: true }));

  const slug = workspace?.slug?.toLowerCase?.();
  if (!slug) {
    return plainArticles;
  }

  return plainArticles.filter((article) => {
    const tags = asArray(article.tags).map((tag) => String(tag).toLowerCase());
    if (!tags.length) {
      return true;
    }
    return tags.includes(slug) || tags.includes(`workspace:${slug}`) || tags.includes('headhunter');
async function loadClientEngagements(workspaceId) {
  if (!workspaceId) {
    return [];
  }

  const records = await ClientEngagement.findAll({
    where: { workspaceId },
    include: [
      { model: ClientEngagementMandate, as: 'mandates' },
      { model: ClientEngagementMilestone, as: 'milestones' },
      {
        model: ClientEngagementPortal,
        as: 'portals',
        include: [
          {
            model: ClientEngagementPortalAuditLog,
            as: 'auditLogs',
            separate: true,
            order: [['occurredAt', 'DESC']],
            limit: 25,
          },
        ],
      },
      { model: EngagementInvoice, as: 'invoices' },
      { model: EngagementCommissionSplit, as: 'commissions' },
      { model: EngagementScheduleEvent, as: 'scheduleEvents' },
    ],
    order: [['clientName', 'ASC']],
  });

  return records.map((record) => {
    const plain = record.get({ plain: true });
    plain.mandates = Array.isArray(plain.mandates) ? plain.mandates : [];
    plain.milestones = Array.isArray(plain.milestones) ? plain.milestones : [];
    plain.portals = Array.isArray(plain.portals)
      ? plain.portals.map((portal) => ({
          ...portal,
          auditLogs: Array.isArray(portal.auditLogs) ? portal.auditLogs : [],
        }))
      : [];
    plain.invoices = Array.isArray(plain.invoices) ? plain.invoices : [];
    plain.commissions = Array.isArray(plain.commissions) ? plain.commissions : [];
    plain.scheduleEvents = Array.isArray(plain.scheduleEvents) ? plain.scheduleEvents : [];
    return plain;
  });
}

async function loadIssueResolutionCases(workspaceId, lookbackDate) {
  if (!workspaceId) {
    return [];
  }

  const where = { workspaceId };
  if (lookbackDate) {
    where.openedAt = { [Op.gte]: lookbackDate };
  }

  const cases = await IssueResolutionCase.findAll({
    where,
    include: [
      {
        model: IssueResolutionEvent,
        as: 'events',
        separate: true,
        order: [['occurredAt', 'DESC']],
        limit: 25,
      },
      {
        model: ClientEngagement,
        as: 'engagement',
        attributes: ['id', 'clientName'],
      },
    ],
    order: [['openedAt', 'DESC']],
  });

  return cases.map((record) => {
    const plain = record.get({ plain: true });
    plain.events = Array.isArray(plain.events) ? plain.events : [];
    return plain;
  });
}

async function loadWorkspace(options = {}) {
  const { workspaceId } = options;

  const workspace = await ProviderWorkspace.findByPk(workspaceId, {
    include: [
      {
        model: ProviderWorkspaceMember,
        as: 'members',
        include: [
          {
            model: User,
            as: 'member',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
        ],
      },
    ],
  });

  if (!workspace) {
    throw new NotFoundError('Headhunter workspace not found.');
  }

  return workspace;
}

async function loadAvailableWorkspaces() {
  const workspaces = await ProviderWorkspace.findAll({
    where: {
      type: { [Op.in]: ['agency', 'recruiter'] },
      isActive: true,
    },
    attributes: ['id', 'name', 'slug', 'type'],
    order: [['name', 'ASC']],
    limit: 25,
  });

  return workspaces.map((workspace) => workspace.get({ plain: true }));
}

async function resolveWorkspaceId(requestedWorkspaceId) {
  if (requestedWorkspaceId != null) {
    return Number(requestedWorkspaceId);
  }

  const fallback = await ProviderWorkspace.findOne({
    where: {
      type: { [Op.in]: ['agency', 'recruiter'] },
      isActive: true,
    },
    order: [['updatedAt', 'DESC']],
  });

  if (!fallback) {
    throw new NotFoundError('No headhunter workspaces are configured.');
  }

  return fallback.id;
}

export async function getDashboardSnapshot({ workspaceId: rawWorkspaceId, lookbackDays: rawLookbackDays } = {}) {
  const workspaceId = await resolveWorkspaceId(rawWorkspaceId);

  const lookback = Math.min(
    Math.max(Number.parseInt(rawLookbackDays ?? 30, 10) || 30, MIN_LOOKBACK_DAYS),
    MAX_LOOKBACK_DAYS,
  );

  const cacheKey = buildCacheKey('headhunter:dashboard', { workspaceId, lookback });

  return appCache.remember(cacheKey, DASHBOARD_CACHE_TTL_SECONDS, async () => {
    const workspace = await loadWorkspace({ workspaceId });
    const applications = await loadApplicationsWithReviews();

    const scopedApplications = applications.filter((application) => {
      const metadata = normaliseMetadata(application.metadata);
      const workspaceIds = [metadata.headhunterWorkspaceId, metadata.agencyWorkspaceId, metadata.providerWorkspaceId]
        .map(normaliseNumber)
        .filter(Boolean);
      const slug = metadata.headhunterWorkspaceSlug ?? metadata.workspaceSlug;
      if (workspaceIds.length) {
        return workspaceIds.includes(workspace.id);
      }
      if (slug && workspace.slug) {
        return slug === workspace.slug;
      }
      return false;
    });

    const dataset = scopedApplications.length ? scopedApplications : applications;
    const hasWorkspaceScopedData = scopedApplications.length > 0;
    const candidateProfiles = await loadCandidateProfiles(dataset);

    const stageBreakdown = buildStageBreakdown(dataset);
    const recentActivity = aggregateRecentActivity(dataset);
    const agingBuckets = computeAgingBuckets(dataset);
    const candidateSpotlight = buildCandidateSpotlight(dataset, candidateProfiles);

    const projectIds = Array.from(
      new Set(
        dataset
          .filter((application) => application.targetType === 'project')
          .map((application) => application.targetId),
      ),
    ).filter(Boolean);

    const lookbackDate = new Date(Date.now() - lookback * 24 * 60 * 60 * 1000);
    const [
      projects,
      threads,
      contactNotesRecords,
      availabilityWindows,
      wellbeingLogs,
      knowledgeArticles,
    ] = await Promise.all([
      projectIds.length ? Project.findAll({ where: { id: { [Op.in]: projectIds } } }) : [],
      MessageThread.findAll({
        where: {
          createdAt: {
            [Op.gte]: lookbackDate,
          },
        },
        include: [
          {
            model: Message,
            as: 'messages',
            required: false,
            where: {
              createdAt: {
                [Op.gte]: lookbackDate,
              },
            },
          },
        ],
        order: [['createdAt', 'DESC']],
      }),
      ProviderContactNote.findAll({
        where: { workspaceId: workspace.id },
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'firstName', 'lastName'],
          },
          {
            model: User,
            as: 'subject',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
        ],
        order: [['createdAt', 'DESC']],
      }),
      loadAvailabilityWindows(workspace.id),
      loadWellbeingLogs(workspace.id, lookbackDate),
      loadKnowledgeArticles(workspace.get({ plain: true }), lookbackDate),
    ]);

    const mandatePortfolio = buildMandatePortfolio(dataset, projects);

    const outreachPerformance = computeOutreachPerformance(threads, lookbackDate, workspace.get({ plain: true }));
    outreachPerformance.lookbackDays = lookback;

    const passOnNetwork = buildPassOnNetwork(dataset, candidateProfiles);

    const clientPartnerships = buildClientPartnerships(contactNotesRecords.map((note) => note.get({ plain: true })));

    const calendar = buildCalendar(dataset, recentActivity, lookbackDate, { lookbackDays: lookback });
    const [contactNoteRecords, engagements, issueCases] = await Promise.all([
      ProviderContactNote.findAll({
        where: { workspaceId: workspace.id },
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'firstName', 'lastName'],
          },
          {
            model: User,
            as: 'subject',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
        ],
        order: [['createdAt', 'DESC']],
      }),
      loadClientEngagements(workspace.id),
      loadIssueResolutionCases(workspace.id, lookbackDate),
    ]);

    const contactSummary = buildClientPartnerships(contactNoteRecords.map((note) => note.get({ plain: true })));
    const clientPartnerships = buildPartnershipsInsights({
      engagements,
      contactSummary,
      issueCases,
      lookbackDate,
    const prospectIntelligence = await loadProspectIntelligence(workspace.id, lookbackDate);

    const contactNotes = await ProviderContactNote.findAll({
      where: { workspaceId: workspace.id },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName'],
        },
        {
          model: User,
          as: 'subject',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const calendar = buildCalendar(dataset, recentActivity, lookbackDate);
    const activityTimeline = buildActivityTimeline(recentActivity, outreachPerformance.latestCampaigns);

    const pipelineExecution = await buildPipelineExecution({ workspaceId: workspace.id });

    const totalApplications = dataset.length;
    const activeApplications = dataset.filter((application) => !['hired', 'rejected', 'withdrawn'].includes(application.status));
    const closedApplications = totalApplications - activeApplications.length;

    const screeningRate = computePercentage(
      stageBreakdown.find((stage) => stage.key === 'screening')?.count ?? 0,
      stageBreakdown.find((stage) => stage.key === 'prospecting')?.count || totalApplications,
    );
    const interviewRate = computePercentage(
      stageBreakdown.find((stage) => stage.key === 'interviewing')?.count ?? 0,
      stageBreakdown.find((stage) => stage.key === 'screening')?.count || 1,
    );
    const offerRate = computePercentage(
      stageBreakdown.find((stage) => stage.key === 'offering')?.count ?? 0,
      stageBreakdown.find((stage) => stage.key === 'interviewing')?.count || 1,
    );
    const placementRate = computePercentage(
      stageBreakdown.find((stage) => stage.key === 'placement')?.count ?? 0,
      stageBreakdown.find((stage) => stage.key === 'offering')?.count || 1,
    );

    const decisionDurations = dataset
      .map((application) => toDaysBetween(application.submittedAt, application.decisionAt))
      .filter((value) => value != null);
    const averageDecisionTime = decisionDurations.length
      ? Number((sumNumbers(decisionDurations) / decisionDurations.length).toFixed(1))
      : null;

    const workspaceSummary = sanitizeWorkspace(workspace);
    const availableWorkspaces = await loadAvailableWorkspaces();

    const pipelineSummary = {
      totals: {
        applications: totalApplications,
        active: activeApplications.length,
        closed: closedApplications,
      },
      stageBreakdown,
      conversionRates: {
        screening: screeningRate,
        interviewing: interviewRate,
        offers: offerRate,
        placements: placementRate,
      },
      velocityDays: averageDecisionTime,
      averageTouchpoints: outreachPerformance.averageTouchpoints,
      agingBuckets,
      recentActivity,
    };

    const workspaceHealth = {
      coverageRatio:
        workspaceSummary.memberCounts.active
          ? Number((activeApplications.length / workspaceSummary.memberCounts.active).toFixed(1))
          : null,
      averageLoad:
        workspaceSummary.memberCounts.active
          ? Number(
              (
                sumNumbers(
                  stageBreakdown
                    .filter((stage) => ['prospecting', 'screening', 'interviewing'].includes(stage.key))
                    .map((stage) => stage.count),
                ) / workspaceSummary.memberCounts.active
              ).toFixed(1),
            )
          : null,
      candidateToMandate:
        mandatePortfolio.totals.activeMandates
          ? Number((activeApplications.length / mandatePortfolio.totals.activeMandates).toFixed(1))
          : null,
      badges: deriveWorkspaceBadges({
        conversionRates: pipelineSummary.conversionRates,
        memberCounts: workspaceSummary.memberCounts,
        mandateTotals: mandatePortfolio.totals,
      }),
      automationSignals: pipelineExecution.prospectPipeline.automations,
      riskSnapshot: pipelineExecution.heatmap,
      experienceHighlights: {
        readinessIndex: pipelineExecution.candidateExperienceVault.readinessIndex,
        wellbeingAlerts: pipelineExecution.candidateExperienceVault.wellbeingAlerts.length,
      },
    };

    const insights = buildIntelligenceHub({
      pipelineSummary,
      mandatePortfolio,
      outreachPerformance,
      agingBuckets,
      lookbackDays: lookback,
      recentActivity,
      workspaceSummary,
    });

    const calendarOrchestration = buildCalendarOrchestration({
      calendar,
      availabilityWindows,
      workspaceSummary,
      clientPartnerships,
      lookbackDays: lookback,
    });

    const knowledgeBase = buildKnowledgeBase(knowledgeArticles, workspaceSummary);

    const wellbeing = buildWellbeingTracker({
      pipelineSummary,
      agingBuckets,
      calendar,
      wellbeingLogs,
      workspaceSummary,
      lookbackDays: lookback,
      passOnNetwork,
    });

    const meta = {
      generatedAt: new Date().toISOString(),
      lookbackDays: lookback,
      requestedWorkspaceId: rawWorkspaceId ?? null,
      selectedWorkspaceId: workspace.id,
      hasWorkspaceScopedData,
      fallbackReason: hasWorkspaceScopedData
        ? null
        : 'No applications are tagged to this workspace. Displaying network-wide recruiting data.',
      availableWorkspaces,
    };

    return {
      workspaceSummary: {
        ...workspaceSummary,
        health: workspaceHealth,
      },
      pipelineSummary,
      pipelineExecution,
      candidateSpotlight,
      mandatePortfolio,
      outreachPerformance,
      passOnNetwork,
      clientPartnerships,
      activityTimeline,
      calendar,
      insights,
      calendarOrchestration,
      knowledgeBase,
      wellbeing,
      prospectIntelligence,
      meta,
    };
  });
}

export default {
  getDashboardSnapshot,
};
