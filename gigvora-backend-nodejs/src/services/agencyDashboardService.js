import { Op } from 'sequelize';
import {
  ProviderWorkspace,
  ProviderWorkspaceMember,
  ProviderWorkspaceInvite,
  ProviderContactNote,
  Project,
  AutoAssignQueueEntry,
  ProjectAssignmentEvent,
  EscrowTransaction,
  AgencyProfile,
  Profile,
  Gig,
  Job,
  User,
  TalentCandidate,
  TalentInterview,
  TalentOffer,
  TalentPipelineMetric,
  PeopleOpsPolicy,
  PeopleOpsPerformanceReview,
  PeopleOpsSkillMatrixEntry,
  PeopleOpsWellbeingSnapshot,
  InternalOpportunity,
  InternalOpportunityMatch,
  MemberBrandingAsset,
  MemberBrandingApproval,
  MemberBrandingMetric,
} from '../models/index.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import { NotFoundError } from '../utils/errors.js';

const ACTIVE_MEMBER_STATUSES = ['active'];
const PROJECT_STATUS_BUCKETS = {
  active: ['active', 'in_progress', 'delivery', 'executing'],
  planning: ['draft', 'planning', 'scoping', 'proposal'],
  atRisk: ['delayed', 'blocked', 'on_hold', 'at_risk'],
  completed: ['completed', 'closed', 'archived'],
};

function sanitizeWorkspaceRecord(workspace) {
  if (!workspace) return null;
  const plain = workspace.get({ plain: true });
  return {
    id: plain.id,
    ownerId: plain.ownerId,
    name: plain.name,
    slug: plain.slug,
    type: plain.type,
    timezone: plain.timezone,
    defaultCurrency: plain.defaultCurrency,
    intakeEmail: plain.intakeEmail,
    isActive: plain.isActive,
    settings: plain.settings ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function toPlain(instance) {
  if (!instance) return null;
  if (typeof instance.toPublicObject === 'function') {
    return instance.toPublicObject();
  }
  return instance.get ? instance.get({ plain: true }) : instance;
}

function normaliseNumber(value, fallback = 0) {
  if (value == null) return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function sumNumbers(values) {
  return values.reduce((total, value) => total + normaliseNumber(value, 0), 0);
}

function average(values) {
  if (!values.length) {
    return 0;
  }
  return sumNumbers(values) / values.length;
}

function bucketiseProjectStatus(status) {
  if (!status) return 'unspecified';
  const normalised = String(status).toLowerCase();
  for (const [bucket, statuses] of Object.entries(PROJECT_STATUS_BUCKETS)) {
    if (statuses.includes(normalised)) {
      return bucket;
    }
  }
  return normalised;
}

function formatMember(member, profileMap) {
  const plain = toPlain(member);
  const userProfile = profileMap.get(plain.userId) ?? null;
  const user = member.member ? member.member.get({ plain: true }) : null;

  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    userId: plain.userId,
    role: plain.role,
    status: plain.status,
    invitedById: plain.invitedById,
    joinedAt: plain.joinedAt,
    lastActiveAt: plain.lastActiveAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    user: user
      ? {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        }
      : null,
    availability: userProfile
      ? {
          status: userProfile.availabilityStatus ?? 'limited',
          availableHoursPerWeek: normaliseNumber(userProfile.availableHoursPerWeek, null),
        }
      : { status: 'unknown', availableHoursPerWeek: null },
  };
}

function buildMembersSummary(members, invites) {
  const totalMembers = members.length;
  const activeMembers = members.filter((member) => ACTIVE_MEMBER_STATUSES.includes(member.status)).length;
  const benchMembers = members.filter((member) => member.availability.status === 'available').length;
  const capacitySamples = members
    .map((member) => member.availability.availableHoursPerWeek)
    .filter((hours) => Number.isFinite(hours) && hours > 0);

  const utilisationDenominator = activeMembers || members.length || 1;
  const engagedMembers = members.filter((member) => ['limited', 'unavailable', 'on_leave'].includes(member.availability.status))
    .length;

  return {
    total: totalMembers,
    active: activeMembers,
    bench: benchMembers,
    pendingInvites: invites.filter((invite) => invite.status === 'pending').length,
    utilizationRate: utilisationDenominator ? Math.round((engagedMembers / utilisationDenominator) * 1000) / 10 : 0,
    averageWeeklyCapacity: capacitySamples.length
      ? Math.round((average(capacitySamples) + Number.EPSILON) * 10) / 10
      : 0,
  };
}

function aggregateProjects(projects) {
  const statusCounts = {};
  const bucketCounts = { active: 0, planning: 0, atRisk: 0, completed: 0 };
  const budgets = [];
  let autoAssignEnabled = 0;
  let autoAssignQueueSize = 0;

  projects.forEach((project) => {
    const normalisedStatus = bucketiseProjectStatus(project.status);
    statusCounts[normalisedStatus] = (statusCounts[normalisedStatus] ?? 0) + 1;

    if (bucketCounts[normalisedStatus] !== undefined) {
      bucketCounts[normalisedStatus] += 1;
    }

    if (project.budgetAmount != null) {
      budgets.push(normaliseNumber(project.budgetAmount));
    }

    if (project.autoAssignEnabled) {
      autoAssignEnabled += 1;
      autoAssignQueueSize += normaliseNumber(project.autoAssignLastQueueSize);
    }
  });

  const totalBudget = sumNumbers(budgets);

  return {
    total: projects.length,
    buckets: bucketCounts,
    statuses: statusCounts,
    totalBudget,
    averageBudget: budgets.length ? totalBudget / budgets.length : 0,
    autoAssignEnabled,
    autoAssignQueueSize,
  };
}

function aggregateQueueEntries(entries, freelancerMap) {
  const statusCounts = {};
  const groupedByFreelancer = new Map();

  entries.forEach((entry) => {
    statusCounts[entry.status] = (statusCounts[entry.status] ?? 0) + 1;
    if (!groupedByFreelancer.has(entry.freelancerId)) {
      groupedByFreelancer.set(entry.freelancerId, []);
    }
    groupedByFreelancer.get(entry.freelancerId).push(entry);
  });

  const ranked = Array.from(groupedByFreelancer.entries())
    .map(([freelancerId, items]) => {
      const topScore = Math.max(...items.map((item) => normaliseNumber(item.score)));
      const pendingCount = items.filter((item) => item.status === 'pending').length;
      const acceptedCount = items.filter((item) => item.status === 'accepted').length;
      const freelancer = freelancerMap.get(freelancerId) ?? null;
      return {
        freelancerId,
        pendingCount,
        acceptedCount,
        topScore,
        freelancer: freelancer
          ? {
              id: freelancer.id,
              firstName: freelancer.firstName,
              lastName: freelancer.lastName,
              email: freelancer.email,
            }
          : null,
      };
    })
    .sort((a, b) => b.topScore - a.topScore)
    .slice(0, 5);

  return {
    statuses: statusCounts,
    topCandidates: ranked,
  };
}

function aggregateFinancials(transactions) {
  let inEscrow = 0;
  let released = 0;
  let outstanding = 0;
  let latestCurrency = 'USD';

  transactions.forEach((transaction) => {
    latestCurrency = transaction.currencyCode ?? latestCurrency;
    const amount = normaliseNumber(transaction.amount);
    switch (transaction.status) {
      case 'released':
        released += amount;
        break;
      case 'refunded':
      case 'cancelled':
        break;
      default:
        if (transaction.status === 'in_escrow' || transaction.status === 'funded') {
          inEscrow += amount;
        }
        if (transaction.status !== 'released') {
          outstanding += amount;
        }
        break;
    }
  });

  return {
    inEscrow,
    released,
    outstanding,
    currency: latestCurrency,
  };
}

function ensureArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function calculateDaysBetween(start, end) {
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.valueOf()) || Number.isNaN(endDate.valueOf())) {
    return null;
  }
  const diffMs = endDate.getTime() - startDate.getTime();
  return diffMs > 0 ? diffMs / (1000 * 60 * 60 * 24) : 0;
}

function formatRate(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
}

function buildTalentCrmSummary(candidates, interviews, offers, metrics) {
  const now = new Date();
  const stageCounts = {};
  const typeCounts = {};
  const diversityCounts = {};
  let signedOffers = 0;
  let sentOffers = 0;
  let scheduledInterviews = 0;
  let totalTimeToFill = 0;
  let timeToFillSamples = 0;

  const candidateList = candidates
    .map((candidate) => candidate.toPublicObject())
    .sort((a, b) => new Date(b.updatedAt ?? b.createdAt ?? 0) - new Date(a.updatedAt ?? a.createdAt ?? 0));

  candidateList.forEach((candidate) => {
    stageCounts[candidate.pipelineStage ?? 'unknown'] = (stageCounts[candidate.pipelineStage ?? 'unknown'] ?? 0) + 1;
    typeCounts[candidate.candidateType ?? 'unspecified'] = (typeCounts[candidate.candidateType ?? 'unspecified'] ?? 0) + 1;

    ensureArray(candidate.diversityTags).forEach((tag) => {
      diversityCounts[tag] = (diversityCounts[tag] ?? 0) + 1;
    });

    if (candidate.hiredAt) {
      const days = candidate.timeToFillDays ?? calculateDaysBetween(candidate.createdAt, candidate.hiredAt);
      if (Number.isFinite(days)) {
        totalTimeToFill += Number(days);
        timeToFillSamples += 1;
      }
    }
  });

  const interviewList = interviews
    .map((interview) => interview.toPublicObject())
    .sort((a, b) => new Date(a.scheduledAt ?? 0) - new Date(b.scheduledAt ?? 0));

  const upcomingInterviews = interviewList
    .filter((interview) => {
      if (interview.status !== 'scheduled' && interview.status !== 'feedback_pending') return false;
      const scheduledAt = new Date(interview.scheduledAt ?? 0);
      return !Number.isNaN(scheduledAt.valueOf()) && scheduledAt >= now;
    })
    .slice(0, 6);

  const recentInterviews = interviewList.slice(-6).reverse();

  const offerList = offers
    .map((offer) => offer.toPublicObject())
    .sort((a, b) => new Date(b.sentAt ?? b.createdAt ?? 0) - new Date(a.sentAt ?? a.createdAt ?? 0));

  offerList.forEach((offer) => {
    if (offer.status === 'sent' || offer.status === 'signed') {
      sentOffers += 1;
    }
    if (offer.status === 'signed') {
      signedOffers += 1;
    }
  });

  interviewList.forEach((interview) => {
    if (interview.status === 'scheduled' || interview.status === 'feedback_pending') {
      scheduledInterviews += 1;
    }
  });

  const metricList = metrics
    .map((metric) => metric.toPublicObject())
    .sort((a, b) => new Date(b.periodEndDate ?? 0) - new Date(a.periodEndDate ?? 0));

  const latestMetric = metricList[0] ?? null;

  return {
    totals: {
      candidates: candidateList.length,
      interviewsScheduled: scheduledInterviews,
      offersSent: sentOffers,
      offersSigned: signedOffers,
    },
    stageCounts,
    typeCounts,
    diversityBreakdown: diversityCounts,
    averageTimeToFillDays: timeToFillSamples ? totalTimeToFill / timeToFillSamples : 0,
    conversionRate: formatRate(signedOffers, candidateList.length || 0),
    recentCandidates: candidateList.slice(0, 6),
    upcomingInterviews,
    recentInterviews,
    offerWorkflows: offerList.slice(0, 6),
    pipelineAnalytics: {
      latest: latestMetric,
      history: metricList.slice(0, 6),
    },
  };
}

function buildPeopleOpsSummary(policies, reviews, skills, wellbeing) {
  const policyList = policies
    .map((policy) => policy.toPublicObject())
    .sort((a, b) => new Date(b.updatedAt ?? 0) - new Date(a.updatedAt ?? 0));

  const reviewList = reviews
    .map((review) => review.toPublicObject())
    .sort((a, b) => new Date(b.dueAt ?? b.updatedAt ?? 0) - new Date(a.dueAt ?? a.updatedAt ?? 0));

  const skillList = skills
    .map((entry) => entry.toPublicObject())
    .sort((a, b) => new Date(b.updatedAt ?? 0) - new Date(a.updatedAt ?? 0));

  const wellbeingList = wellbeing
    .map((snapshot) => snapshot.toPublicObject())
    .sort((a, b) => new Date(b.capturedAt ?? 0) - new Date(a.capturedAt ?? 0));

  const activePolicies = policyList.filter((policy) => policy.status === 'active');
  const acknowledgementRate = policyList.length
    ? formatRate(
        policyList.reduce((total, policy) => total + Math.min(policy.acknowledgedCount ?? 0, policy.audienceCount ?? 0), 0),
        policyList.reduce((total, policy) => total + (policy.audienceCount ?? 0), 0) || 0,
      )
    : 0;

  const outstandingReviews = reviewList.filter((review) => !['completed', 'closed'].includes(review.status));
  const completedReviews = reviewList.filter((review) => ['completed', 'closed'].includes(review.status));

  const skillsCoverage = {};
  const skillGaps = [];
  skillList.forEach((entry) => {
    const category = entry.skillCategory ?? 'General';
    if (!skillsCoverage[category]) {
      skillsCoverage[category] = { total: 0, ready: 0, needsGrowth: 0 };
    }
    skillsCoverage[category].total += 1;
    if (entry.targetLevel && entry.proficiencyLevel != null && entry.proficiencyLevel < entry.targetLevel) {
      skillsCoverage[category].needsGrowth += 1;
      skillGaps.push(entry);
    } else {
      skillsCoverage[category].ready += 1;
    }
  });

  const wellbeingScores = wellbeingList.map((entry) => Number(entry.wellbeingScore) || 0);
  const wellbeingAverage = wellbeingScores.length
    ? Math.round((wellbeingScores.reduce((sum, score) => sum + score, 0) / wellbeingScores.length) * 10) / 10
    : 0;
  const wellbeingRiskCounts = wellbeingList.reduce(
    (acc, entry) => {
      const key = entry.riskLevel ?? 'low';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    { low: 0, medium: 0, high: 0, critical: 0 },
  );
  const wellbeingAtRisk = (wellbeingRiskCounts.high ?? 0) + (wellbeingRiskCounts.critical ?? 0);

  return {
    policies: {
      list: policyList.slice(0, 6),
      total: policyList.length,
      active: activePolicies.length,
      acknowledgementRate,
    },
    performance: {
      outstanding: outstandingReviews.length,
      completed: completedReviews.length,
      reviews: reviewList.slice(0, 6),
    },
    skills: {
      entries: skillList.slice(0, 10),
      coverage: skillsCoverage,
      gaps: skillGaps.slice(0, 6),
    },
    wellbeing: {
      averageScore: wellbeingAverage,
      riskCounts: wellbeingRiskCounts,
      atRisk: wellbeingAtRisk,
      snapshots: wellbeingList.slice(0, 6),
    },
  };
}

function buildOpportunityBoardSummary(opportunities, matches) {
  const opportunityList = opportunities
    .map((opportunity) => opportunity.toPublicObject())
    .sort((a, b) => new Date(a.startDate ?? 0) - new Date(b.startDate ?? 0));

  const matchList = matches
    .map((match) => match.toPublicObject())
    .sort((a, b) => new Date(b.notifiedAt ?? b.createdAt ?? 0) - new Date(a.notifiedAt ?? a.createdAt ?? 0));

  const open = opportunityList.filter((opportunity) => ['open', 'matched'].includes(opportunity.status)).length;
  const filled = opportunityList.filter((opportunity) => opportunity.status === 'filled').length;
  const averageMatchScore = matchList.length
    ? Math.round(
        (matchList.reduce((total, match) => total + (Number(match.matchScore) || 0), 0) / matchList.length) * 10,
      ) / 10
    : 0;
  const mobileAlerts = matchList.filter((match) => match.isMobileAlert).length;
  const acceptedMatches = matchList.filter((match) => match.status === 'accepted').length;

  const upcoming = opportunityList
    .filter((opportunity) => ['open', 'matched'].includes(opportunity.status))
    .slice(0, 6);

  return {
    summary: {
      open,
      filled,
      averageMatchScore,
      mobileAlerts,
      acceptedMatches,
    },
    opportunities: upcoming,
    matches: matchList.slice(0, 6),
  };
}

function buildBrandingSummary(assets, approvals, metrics) {
  const assetList = assets
    .map((asset) => asset.toPublicObject())
    .sort((a, b) => new Date(b.updatedAt ?? b.createdAt ?? 0) - new Date(a.updatedAt ?? a.createdAt ?? 0));

  const approvalList = approvals
    .map((approval) => approval.toPublicObject())
    .sort((a, b) => new Date(b.requestedAt ?? 0) - new Date(a.requestedAt ?? 0));

  const metricList = metrics
    .map((metric) => metric.toPublicObject())
    .sort((a, b) => new Date(b.metricDate ?? 0) - new Date(a.metricDate ?? 0));

  const pendingApprovals = approvalList.filter((approval) => approval.status === 'pending');
  const publishedAssets = assetList.filter((asset) => asset.status === 'published');

  const totals = metricList.reduce(
    (acc, metric) => {
      acc.reach += Number(metric.reach) || 0;
      acc.engagements += Number(metric.engagements) || 0;
      acc.clicks += Number(metric.clicks) || 0;
      acc.leadsAttributed += Number(metric.leadsAttributed) || 0;
      return acc;
    },
    { reach: 0, engagements: 0, clicks: 0, leadsAttributed: 0 },
  );

  return {
    assets: assetList.slice(0, 6),
    totals: {
      assets: assetList.length,
      published: publishedAssets.length,
    },
    approvals: {
      pending: pendingApprovals.length,
      queue: pendingApprovals.slice(0, 6),
    },
    metrics: {
      totals,
      recent: metricList.slice(0, 6),
    },
  };
}

function buildHrManagementSummary(members, candidates, policies) {
  const activeHeadcount = members.filter((member) => member.status === 'active').length;
  const contractors = members.filter((member) => (member.role ?? '').toLowerCase().includes('contract')).length;
  const onboarding = candidates.filter((candidate) => candidate.status === 'hired' && candidate.onboardingStatus !== 'completed').length;
  const exitsInProgress = candidates.filter(
    (candidate) => candidate.exitWorkflowStatus && !['not_applicable', 'completed'].includes(candidate.exitWorkflowStatus),
  ).length;
  const complianceOutstanding = policies.reduce((total, policy) => {
    const outstanding = Math.max((policy.audienceCount ?? 0) - (policy.acknowledgedCount ?? 0), 0);
    return total + outstanding;
  }, 0);

  return {
    activeHeadcount,
    contractors,
    onboarding,
    exitsInProgress,
    complianceOutstanding,
  };
}

function buildCapacityPlanningSummary(membersSummary, metrics, opportunities) {
  const latestMetric = metrics[0] ?? null;
  const openRoles = latestMetric?.openRoles ?? 0;
  const benchCapacityHours = latestMetric?.benchCapacityHours ?? membersSummary.averageWeeklyCapacity * (membersSummary.bench ?? 0);
  const hiringVelocity = latestMetric?.hiringVelocity ?? 0;
  const utilizationRate = membersSummary.utilizationRate ?? 0;
  const upcomingStarts = opportunities.filter((opportunity) => {
    if (!opportunity.startDate) return false;
    const startDate = new Date(opportunity.startDate);
    if (Number.isNaN(startDate.valueOf())) return false;
    const now = new Date();
    const diff = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  }).length;

  return {
    openRoles,
    benchCapacityHours,
    hiringVelocity,
    utilizationRate,
    upcomingStarts,
  };
}

function buildInternalMarketplaceSummary(members, opportunities, matches) {
  const benchAvailable = members.filter((member) => member.availability?.status === 'available').length;
  const openOpportunities = opportunities.filter((opportunity) => ['open', 'matched'].includes(opportunity.status)).length;
  const activeMatches = matches.filter((match) => ['new', 'contacted', 'accepted'].includes(match.status)).length;
  const acceptedMatches = matches.filter((match) => match.status === 'accepted').length;

  return {
    benchAvailable,
    openOpportunities,
    activeMatches,
    acceptedMatches,
  };
}

function filterProjectsForWorkspace(projects, workspace) {
  if (!workspace) {
    return { projects, scope: 'global' };
  }

  const scoped = projects.filter((project) => {
    const settings = project.autoAssignSettings ?? {};
    if (settings.workspaceId && Number(settings.workspaceId) === workspace.id) {
      return true;
    }
    if (settings.workspaceSlug && settings.workspaceSlug === workspace.slug) {
      return true;
    }
    if (settings.workspace && Number(settings.workspace?.id) === workspace.id) {
      return true;
    }
    if (settings.metadata?.workspaceId && Number(settings.metadata.workspaceId) === workspace.id) {
      return true;
    }
    return false;
  });

  if (scoped.length) {
    return { projects: scoped, scope: 'workspace' };
  }

  return { projects, scope: 'global_fallback' };
}

export async function getAgencyDashboard({ workspaceId, workspaceSlug, lookbackDays = 90 } = {}) {
  const parsedLookback = Number.isFinite(Number(lookbackDays)) && Number(lookbackDays) > 0 ? Number(lookbackDays) : 90;

  let workspace = null;
  if (workspaceId || workspaceSlug) {
    const where = {};
    if (workspaceId) where.id = workspaceId;
    if (workspaceSlug) where.slug = workspaceSlug;
    workspace = await ProviderWorkspace.findOne({ where });
    if (!workspace) {
      throw new NotFoundError('Agency workspace not found.');
    }
  }

  if (!workspace) {
    workspace = await ProviderWorkspace.findOne({ where: { type: 'agency' }, order: [['createdAt', 'ASC']] });
  }

  const cacheKey = buildCacheKey('agency:dashboard', {
    workspace: workspace ? workspace.id : 'none',
    lookbackDays: parsedLookback,
  });

  return appCache.remember(cacheKey, 60, async () => {
    const now = new Date();
    const lookbackDate = new Date(now.getTime() - parsedLookback * 24 * 60 * 60 * 1000);

    const workspaceIdFilter = workspace ? workspace.id : null;

    let memberRows = [];
    let inviteRows = [];
    let noteRows = [];
    let talentCandidateRows = [];
    let talentInterviewRows = [];
    let talentOfferRows = [];
    let talentPipelineMetricRows = [];
    let peopleOpsPolicyRows = [];
    let peopleOpsReviewRows = [];
    let peopleOpsSkillRows = [];
    let peopleOpsWellbeingRows = [];
    let internalOpportunityRows = [];
    let internalMatchRows = [];
    let brandingAssetRows = [];
    let brandingApprovalRows = [];
    let brandingMetricRows = [];

    if (workspaceIdFilter) {
      [memberRows, inviteRows, noteRows] = await Promise.all([
        ProviderWorkspaceMember.findAll({
          where: { workspaceId: workspaceIdFilter },
          include: [{ model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email'] }],
          order: [['role', 'ASC']],
        }),
        ProviderWorkspaceInvite.findAll({
          where: { workspaceId: workspaceIdFilter },
          order: [['createdAt', 'DESC']],
        }),
        ProviderContactNote.findAll({
          where: { workspaceId: workspaceIdFilter },
          include: [
            { model: User, as: 'author', attributes: ['id', 'firstName', 'lastName'] },
            { model: User, as: 'subject', attributes: ['id', 'firstName', 'lastName', 'email'] },
          ],
          order: [['createdAt', 'DESC']],
          limit: 10,
        }),
      ]);

      [
        talentCandidateRows,
        talentInterviewRows,
        talentOfferRows,
        talentPipelineMetricRows,
        peopleOpsPolicyRows,
        peopleOpsReviewRows,
        peopleOpsSkillRows,
        peopleOpsWellbeingRows,
        internalOpportunityRows,
        internalMatchRows,
        brandingAssetRows,
        brandingApprovalRows,
        brandingMetricRows,
      ] = await Promise.all([
        TalentCandidate.findAll({
          where: { workspaceId: workspaceIdFilter },
          order: [['updatedAt', 'DESC']],
          limit: 200,
        }),
        TalentInterview.findAll({
          where: { workspaceId: workspaceIdFilter },
          order: [['scheduledAt', 'ASC']],
          limit: 120,
        }),
        TalentOffer.findAll({
          where: { workspaceId: workspaceIdFilter },
          order: [['updatedAt', 'DESC']],
          limit: 120,
        }),
        TalentPipelineMetric.findAll({
          where: { workspaceId: workspaceIdFilter },
          order: [['periodEndDate', 'DESC']],
          limit: 12,
        }),
        PeopleOpsPolicy.findAll({
          where: { workspaceId: workspaceIdFilter },
          order: [['updatedAt', 'DESC']],
          limit: 60,
        }),
        PeopleOpsPerformanceReview.findAll({
          where: { workspaceId: workspaceIdFilter },
          order: [['dueAt', 'DESC']],
          limit: 100,
        }),
        PeopleOpsSkillMatrixEntry.findAll({
          where: { workspaceId: workspaceIdFilter },
          order: [['updatedAt', 'DESC']],
          limit: 200,
        }),
        PeopleOpsWellbeingSnapshot.findAll({
          where: { workspaceId: workspaceIdFilter },
          order: [['capturedAt', 'DESC']],
          limit: 120,
        }),
        InternalOpportunity.findAll({
          where: { workspaceId: workspaceIdFilter },
          order: [['createdAt', 'DESC']],
          limit: 120,
        }),
        InternalOpportunityMatch.findAll({
          where: { workspaceId: workspaceIdFilter },
          order: [['notifiedAt', 'DESC']],
          limit: 200,
        }),
        MemberBrandingAsset.findAll({
          where: { workspaceId: workspaceIdFilter },
          order: [['updatedAt', 'DESC']],
          limit: 120,
        }),
        MemberBrandingApproval.findAll({
          include: [{ model: MemberBrandingAsset, as: 'asset' }],
          where: {
            '$asset.workspaceId$': workspaceIdFilter,
          },
          order: [['requestedAt', 'DESC']],
          limit: 120,
        }),
        MemberBrandingMetric.findAll({
          include: [{ model: MemberBrandingAsset, as: 'asset' }],
          where: {
            '$asset.workspaceId$': workspaceIdFilter,
          },
          order: [['metricDate', 'DESC']],
          limit: 120,
        }),
      ]);
    }

    const profileRows = workspaceIdFilter && memberRows.length
      ? await Profile.findAll({ where: { userId: { [Op.in]: memberRows.map((member) => member.userId) } } })
      : [];

    const [projectRows, gigRows, jobRows, agencyProfile] = await Promise.all([
      Project.findAll({ order: [['updatedAt', 'DESC']] }),
      Gig.findAll({ order: [['createdAt', 'DESC']], limit: 10 }),
      Job.findAll({ order: [['createdAt', 'DESC']], limit: 10 }),
      workspace && workspace.ownerId
        ? AgencyProfile.findOne({ where: { userId: workspace.ownerId } })
        : null,
    ]);

    const profilesByUserId = new Map(profileRows.map((profile) => [profile.userId, profile.get({ plain: true })]));

    const formattedMembers = memberRows.map((member) => formatMember(member, profilesByUserId));
    const formattedInvites = inviteRows.map((invite) => toPlain(invite));
    const formattedNotes = noteRows.map((note) => toPlain(note));

    const projectPlain = projectRows.map((project) => project.toPublicObject());
    const { projects: scopedProjects, scope } = filterProjectsForWorkspace(projectPlain, workspaceIdFilter ? workspace : null);

    const projectIds = scopedProjects.map((project) => project.id);

    const [queueRows, eventRows, escrowRows, gigTransactions] = await Promise.all([
      projectIds.length
        ? AutoAssignQueueEntry.findAll({
            where: {
              targetType: 'project',
              targetId: { [Op.in]: projectIds },
              createdAt: { [Op.gte]: lookbackDate },
            },
            order: [['createdAt', 'DESC']],
          })
        : [],
      projectIds.length
        ? ProjectAssignmentEvent.findAll({
            where: { projectId: { [Op.in]: projectIds }, createdAt: { [Op.gte]: lookbackDate } },
            include: [{ model: User, as: 'actor', attributes: ['id', 'firstName', 'lastName'] }],
            order: [['createdAt', 'DESC']],
            limit: 20,
          })
        : [],
      projectIds.length
        ? EscrowTransaction.findAll({
            where: {
              projectId: { [Op.in]: projectIds },
              createdAt: { [Op.gte]: lookbackDate },
            },
            order: [['createdAt', 'DESC']],
          })
        : [],
      workspaceIdFilter
        ? EscrowTransaction.findAll({
            where: {
              gigId: { [Op.not]: null },
              createdAt: { [Op.gte]: lookbackDate },
            },
            order: [['createdAt', 'DESC']],
            limit: 20,
          })
        : [],
    ]);

    const freelancerIds = [...new Set(queueRows.map((entry) => entry.freelancerId))];
    const freelancerRecords = freelancerIds.length
      ? await User.findAll({ where: { id: { [Op.in]: freelancerIds } }, attributes: ['id', 'firstName', 'lastName', 'email'] })
      : [];
    const freelancerMap = new Map(freelancerRecords.map((freelancer) => [freelancer.id, freelancer.get({ plain: true })]));

    const queueEntries = queueRows.map((entry) => entry.toPublicObject());
    const queueSummary = aggregateQueueEntries(queueEntries, freelancerMap);

    const projectSummary = aggregateProjects(scopedProjects);
    const membersSummary = buildMembersSummary(formattedMembers, formattedInvites);
    const financialSummary = aggregateFinancials(escrowRows.map((row) => row.toPublicObject()));

    const agencyProfilePlain = agencyProfile ? agencyProfile.get({ plain: true }) : null;

    const formattedProjects = scopedProjects.map((project) => ({
      id: project.id,
      title: project.title,
      status: project.status,
      budgetAmount: project.budgetAmount,
      budgetCurrency: project.budgetCurrency,
      autoAssignEnabled: project.autoAssignEnabled,
      autoAssignStatus: project.autoAssignStatus,
      updatedAt: project.updatedAt,
      createdAt: project.createdAt,
    }));

    const formattedEvents = eventRows.map((event) => {
      const plain = event.toPublicObject();
      const actor = event.actor ? event.actor.get({ plain: true }) : null;
      return {
        ...plain,
        actor: actor
          ? {
              id: actor.id,
              firstName: actor.firstName,
              lastName: actor.lastName,
            }
          : null,
      };
    });

    const gigSummaries = gigRows.map((gig) => toPlain(gig));
    const jobSummaries = jobRows.map((job) => toPlain(job));

    const totalClients = new Set(formattedNotes.map((note) => note.subjectUserId)).size;

    const talentCrm = buildTalentCrmSummary(
      talentCandidateRows,
      talentInterviewRows,
      talentOfferRows,
      talentPipelineMetricRows,
    );
    const peopleOps = buildPeopleOpsSummary(
      peopleOpsPolicyRows,
      peopleOpsReviewRows,
      peopleOpsSkillRows,
      peopleOpsWellbeingRows,
    );
    const opportunityBoard = buildOpportunityBoardSummary(internalOpportunityRows, internalMatchRows);
    const branding = buildBrandingSummary(brandingAssetRows, brandingApprovalRows, brandingMetricRows);

    const talentCandidatePlain = talentCandidateRows.map((candidate) => candidate.toPublicObject());
    const peopleOpsPolicyPlain = peopleOpsPolicyRows.map((policy) => policy.toPublicObject());

    const hrManagement = buildHrManagementSummary(formattedMembers, talentCandidatePlain, peopleOpsPolicyPlain);
    const capacityPlanning = buildCapacityPlanningSummary(
      membersSummary,
      talentCrm.pipelineAnalytics.history,
      opportunityBoard.opportunities ?? [],
    );
    const internalMarketplace = buildInternalMarketplaceSummary(
      formattedMembers,
      opportunityBoard.opportunities ?? [],
      opportunityBoard.matches ?? [],
    );

    const talentLifecycleSummary = {
      totalCandidates: talentCrm.totals.candidates,
      conversionRate: talentCrm.conversionRate,
      wellbeingScore: peopleOps.wellbeing.averageScore,
      atRisk: peopleOps.wellbeing.atRisk,
      openInternalOpportunities: opportunityBoard.summary.open,
      brandingReach: branding.metrics.totals.reach,
    };

    return {
      workspace: workspace ? sanitizeWorkspaceRecord(workspace) : null,
      agencyProfile: agencyProfilePlain,
      scope,
      summary: {
        members: membersSummary,
        projects: projectSummary,
        pipeline: queueSummary,
        financials: financialSummary,
        clients: {
          active: totalClients,
          notes: formattedNotes.length,
        },
        gigs: {
          total: gigSummaries.length,
        },
        jobs: {
          total: jobSummaries.length,
        },
      },
      members: {
        list: formattedMembers,
        invites: formattedInvites,
      },
      projects: {
        list: formattedProjects,
        events: formattedEvents,
      },
      contactNotes: formattedNotes,
      gigs: gigSummaries,
      jobs: jobSummaries,
      financials: escrowRows.map((row) => row.toPublicObject()),
      gigFinancials: gigTransactions.map((row) => row.toPublicObject()),
      talentLifecycle: {
        summary: talentLifecycleSummary,
        crm: talentCrm,
        peopleOps,
        opportunityBoard,
        branding,
        hrManagement,
        capacityPlanning,
        internalMarketplace,
      },
      refreshedAt: new Date().toISOString(),
    };
  });
}

export default {
  getAgencyDashboard,
};

