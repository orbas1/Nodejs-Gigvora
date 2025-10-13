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
  ProspectIntelligenceProfile,
  ProspectIntelligenceSignal,
  ProspectSearchDefinition,
  ProspectSearchAlert,
  ProspectCampaign,
  ProspectCampaignStep,
  ProspectResearchNote,
  ProspectResearchTask,
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

    const clientPartnerships = buildClientPartnerships(contactNotes.map((note) => note.get({ plain: true })));

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
      prospectIntelligence,
      meta,
    };
  });
}

export default {
  getDashboardSnapshot,
};
