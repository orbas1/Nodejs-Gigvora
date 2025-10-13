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
} from '../models/index.js';
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

    const projects = projectIds.length ? await Project.findAll({ where: { id: { [Op.in]: projectIds } } }) : [];
    const mandatePortfolio = buildMandatePortfolio(dataset, projects);

    const lookbackDate = new Date(Date.now() - lookback * 24 * 60 * 60 * 1000);

    const threads = await MessageThread.findAll({
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
    });

    const outreachPerformance = computeOutreachPerformance(threads, lookbackDate, workspace.get({ plain: true }));
    outreachPerformance.lookbackDays = lookback;

    const passOnNetwork = buildPassOnNetwork(dataset, candidateProfiles);

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
    });

    const calendar = buildCalendar(dataset, recentActivity, lookbackDate);
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
      meta,
    };
  });
}

export default {
  getDashboardSnapshot,
};
