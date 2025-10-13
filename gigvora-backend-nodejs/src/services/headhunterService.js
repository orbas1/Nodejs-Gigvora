import { Op } from 'sequelize';
import {
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

function buildCalendar(applications, recentActivity, lookbackDate, options = {}) {
  const { lookbackDays = 30 } = options;
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
    const activityTimeline = buildActivityTimeline(recentActivity, outreachPerformance.latestCampaigns);

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
      meta,
    };
  });
}

export default {
  getDashboardSnapshot,
};
