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
  GigPackage,
  GigAddon,
  GigMediaAsset,
  GigPerformanceSnapshot,
  GigOrder,
  GigBundle,
  GigBundleItem,
  GigUpsell,
  AgencyAlliance,
  AgencyAllianceMember,
  AgencyAllianceRateCard,
  AgencyAllianceRevenueSplit,
  PartnerEngagement,
  PipelineCampaign,
  PipelineDeal,
  PipelineFollowUp,
  PipelineProposal,
  RecruitingCalendarEvent,
  EmployerBrandAsset,
  ClientSuccessPlaybook,
  ClientSuccessEnrollment,
  ClientSuccessEvent,
  ClientSuccessReferral,
  ClientSuccessReviewNudge,
  ClientSuccessAffiliateLink,
  Job,
  User,
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

function toPlainValue(record) {
  if (!record) {
    return null;
  }
  if (typeof record.toPublicObject === 'function') {
    return record.toPublicObject();
  }
  if (typeof record.toBuilderObject === 'function') {
    return record.toBuilderObject();
  }
  if (typeof record.get === 'function') {
    return record.get({ plain: true });
  }
  return { ...record };
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(start, end) {
  const from = parseDate(start);
  const to = parseDate(end);
  if (!from || !to) return null;
  const diff = to.getTime() - from.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function groupByKey(items, key) {
  const map = new Map();
  items.forEach((item) => {
    if (!item || item[key] == null) {
      return;
    }
    const groupKey = item[key];
    if (!map.has(groupKey)) {
      map.set(groupKey, []);
    }
    map.get(groupKey).push(item);
  });
  return map;
}

function centsToAmount(value) {
  if (value == null) {
    return 0;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.round((numeric / 100) * 100) / 100;
}

function safePercentage(numerator, denominator) {
  if (!denominator) return 0;
  const rate = (numerator / denominator) * 100;
  return Math.round((rate + Number.EPSILON) * 10) / 10;
}

function collectAllianceMembersByAlliance(members) {
  const grouped = new Map();
  members.forEach((member) => {
    if (!member || member.allianceId == null) return;
    if (!grouped.has(member.allianceId)) {
      grouped.set(member.allianceId, []);
    }
    grouped.get(member.allianceId).push(member);
  });
  return grouped;
}

function buildGigStudioInsights({
  gigs,
  packages,
  addons,
  mediaAssets,
  performanceSnapshots,
  orders,
  bundles,
  bundleItems,
  upsells,
  alliances,
  allianceMembers,
}) {
  const packagesByGig = groupByKey(packages, 'gigId');
  const addonsByGig = groupByKey(addons, 'gigId');
  const ordersByGig = groupByKey(orders, 'gigId');
  const bundleItemsByBundle = groupByKey(bundleItems, 'bundleId');

  const heroAssetByGig = new Map();
  mediaAssets.forEach((asset) => {
    if (asset.gigId == null || heroAssetByGig.has(asset.gigId)) {
      return;
    }
    heroAssetByGig.set(asset.gigId, asset);
  });

  const performanceByGig = new Map();
  performanceSnapshots.forEach((snapshot) => {
    if (snapshot.gigId == null) return;
    if (!performanceByGig.has(snapshot.gigId)) {
      performanceByGig.set(snapshot.gigId, snapshot);
    }
  });

  const formattedGigs = gigs.map((gig) => {
    const gigOrders = ordersByGig.get(gig.id) ?? [];
    const openOrders = gigOrders.filter((order) => !['completed', 'cancelled'].includes(order.status));
    return {
      ...gig,
      packages: packagesByGig.get(gig.id) ?? [],
      addons: addonsByGig.get(gig.id) ?? [],
      heroAsset: heroAssetByGig.get(gig.id) ?? null,
      latestPerformance: performanceByGig.get(gig.id) ?? null,
      orders: {
        total: gigOrders.length,
        open: openOrders.length,
      },
    };
  });

  const bundleSummaries = bundles.map((bundle) => ({
    ...bundle,
    priceAmount: centsToAmount(bundle.priceCents),
    items: (bundleItemsByBundle.get(bundle.id) ?? []).sort((a, b) => a.orderIndex - b.orderIndex),
  }));

  const upsellSummaries = upsells.map((upsell) => ({
    ...upsell,
    estimatedValueAmount: centsToAmount(upsell.estimatedValueCents),
  }));

  const totalOrders = orders.length;
  const completedWithDue = orders.filter((order) => order.completedAt && order.dueAt);
  const onTime = completedWithDue.filter((order) => {
    const completed = parseDate(order.completedAt);
    const due = parseDate(order.dueAt);
    return completed && due && completed.getTime() <= due.getTime();
  });
  const deliveryDurations = completedWithDue
    .map((order) => daysBetween(order.submittedAt ?? order.createdAt, order.completedAt))
    .filter((value) => Number.isFinite(value) && value != null);

  const backlog = orders.filter((order) => !['completed', 'cancelled'].includes(order.status));
  const breaches = orders.filter((order) => {
    const due = parseDate(order.dueAt);
    if (!due) return false;
    if (['completed', 'cancelled'].includes(order.status)) {
      const completed = parseDate(order.completedAt);
      return completed && completed.getTime() > due.getTime();
    }
    const now = new Date();
    return now.getTime() > due.getTime();
  });

  const alliancesById = new Map(alliances.map((alliance) => [alliance.id, alliance]));
  const membersByAlliance = collectAllianceMembersByAlliance(allianceMembers);
  const rosterAlliances = alliances.filter((alliance) =>
    ['delivery_pod', 'managed_service'].includes(alliance.allianceType ?? ''),
  );

  const rosters = rosterAlliances.map((alliance) => {
    const members = (membersByAlliance.get(alliance.id) ?? []).map((member) => ({
      id: member.id,
      role: member.role,
      status: member.status,
      commitmentHours: member.commitmentHours,
      revenueSharePercent: member.revenueSharePercent,
      user: member.user
        ? {
            id: member.user.id,
            firstName: member.user.firstName,
            lastName: member.user.lastName,
          }
        : null,
    }));
    return {
      id: alliance.id,
      name: alliance.name,
      status: alliance.status,
      allianceType: alliance.allianceType,
      focusAreas: alliance.focusAreas ?? [],
      members,
    };
  });

  const summary = {
    managedGigs: formattedGigs.filter((gig) => gig.status === 'active' || gig.status === 'in_delivery').length,
    totalGigs: formattedGigs.length,
    packages: packages.length,
    addons: addons.length,
    hybridBundles: bundleSummaries.filter((bundle) => bundle.status === 'live').length,
    upsellPrograms: upsellSummaries.filter((upsell) => upsell.status === 'running' || upsell.status === 'pilot').length,
    activeOrders: backlog.length,
    onTimeRate: safePercentage(onTime.length, completedWithDue.length || totalOrders || 0),
    averageDeliveryDays: deliveryDurations.length ? Math.round((average(deliveryDurations) + Number.EPSILON) * 10) / 10 : 0,
    breaches: breaches.length,
  };

  const deliverables = {
    totalDeliverables: bundleItems.length,
    backlog: backlog.length,
    breaches: breaches.length,
    activeContracts: completedWithDue.length + backlog.length,
    upcomingDue: orders.filter((order) => {
      const due = parseDate(order.dueAt);
      if (!due) return false;
      if (['completed', 'cancelled'].includes(order.status)) return false;
      const now = new Date();
      const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }).length,
  };

  return {
    summary,
    gigs: formattedGigs,
    bundles: bundleSummaries,
    upsells: upsellSummaries,
    deliverables,
    rosters,
    alliances: Array.from(alliancesById.values()),
  };
}

function buildPartnerProgramInsights({ alliances, allianceMembers, rateCards, revenueSplits, partnerEngagements }) {
  const membersByAlliance = collectAllianceMembersByAlliance(allianceMembers);
  const allianceSummaries = alliances.map((alliance) => {
    const members = membersByAlliance.get(alliance.id) ?? [];
    return {
      ...alliance,
      memberCount: members.length,
      leadCount: members.filter((member) => member.role === 'lead').length,
    };
  });

  const engagementsByType = {};
  partnerEngagements.forEach((engagement) => {
    const key = engagement.partnerType ?? 'unspecified';
    if (!engagementsByType[key]) {
      engagementsByType[key] = { count: 0, touchpoints: 0, conversionRateSamples: [] };
    }
    engagementsByType[key].count += 1;
    engagementsByType[key].touchpoints += normaliseNumber(engagement.touchpoints, 0);
    if (engagement.conversionRate != null) {
      engagementsByType[key].conversionRateSamples.push(Number(engagement.conversionRate));
    }
  });

  const engagements = Object.entries(engagementsByType).map(([partnerType, details]) => ({
    partnerType,
    count: details.count,
    touchpoints: details.touchpoints,
    averageConversionRate: details.conversionRateSamples.length
      ? Math.round((average(details.conversionRateSamples) + Number.EPSILON) * 10) / 10
      : 0,
  }));

  const summary = {
    alliances: alliances.length,
    activeAlliances: allianceSummaries.filter((alliance) => alliance.status === 'active').length,
    partnerEngagements: partnerEngagements.length,
    averageConversionRate:
      partnerEngagements.length
        ? Math.round(
            (average(
              partnerEngagements
                .map((item) => (item.conversionRate != null ? Number(item.conversionRate) : null))
                .filter((value) => value != null),
            ) || 0 + Number.EPSILON) * 10,
          ) / 10
        : 0,
    pendingRateCards: rateCards.filter((card) => card.status === 'draft' || card.status === 'in_review').length,
    activeRateCards: rateCards.filter((card) => card.status === 'active').length,
    activeRevenueSplits: revenueSplits.filter((split) => split.status === 'active').length,
  };

  return {
    summary,
    alliances: allianceSummaries,
    engagements,
    rateCards,
    revenueSplits,
  };
}

function buildMarketingAutomationInsights({ campaigns, deals, followUps, proposals, events, landingPages }) {
  const openDeals = deals.filter((deal) => deal.status === 'open');
  const wonDeals = deals.filter((deal) => deal.status === 'won');
  const totalPipelineValue = deals.reduce((total, deal) => total + normaliseNumber(deal.pipelineValue, 0), 0);
  const winProbabilitySamples = deals
    .map((deal) => (deal.winProbability != null ? Number(deal.winProbability) : null))
    .filter((value) => value != null);
  const followUpsDueSoon = followUps.filter((followUp) => {
    if (followUp.status === 'completed' || followUp.status === 'cancelled') return false;
    const due = parseDate(followUp.dueAt);
    if (!due) return false;
    const now = new Date();
    const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 14;
  });

  const webinarEvents = events.filter((event) =>
    (event.eventType ?? '').toLowerCase().includes('webinar') || (event.metadata?.format ?? '') === 'webinar',
  );

  const summary = {
    activeCampaigns: campaigns.filter((campaign) => campaign.status === 'active').length,
    totalCampaigns: campaigns.length,
    openDeals: openDeals.length,
    wonDeals: wonDeals.length,
    totalPipelineValue,
    averageWinProbability: winProbabilitySamples.length
      ? Math.round((average(winProbabilitySamples) + Number.EPSILON) * 10) / 10
      : 0,
    followUpsDueSoon: followUpsDueSoon.length,
    liveLandingPages: landingPages.filter((asset) => asset.status === 'published').length,
  };

  return {
    summary,
    campaigns,
    deals,
    followUps,
    proposals,
    events,
    landingPages,
    webinars: webinarEvents,
  };
}

function buildClientAdvocacyInsights({
  playbooks,
  enrollments,
  events,
  referrals,
  reviewNudges,
  affiliateLinks,
  gigs,
}) {
  const activePlaybooks = playbooks.filter((playbook) => playbook.isActive !== false);
  const activeEnrollments = enrollments.filter((enrollment) => enrollment.status === 'in_progress' || enrollment.status === 'pending');
  const completedEnrollments = enrollments.filter((enrollment) => enrollment.status === 'completed');

  const nudgesResponded = reviewNudges.filter((nudge) => nudge.responseAt);
  const rewardValue = referrals.reduce((total, referral) => total + normaliseNumber(referral.rewardValueAmount, 0), 0);
  const affiliateConversions = affiliateLinks.reduce((total, link) => total + normaliseNumber(link.totalConversions, 0), 0);

  const summary = {
    activePlaybooks: activePlaybooks.length,
    totalPlaybooks: playbooks.length,
    enrollmentsInFlight: activeEnrollments.length,
    enrollmentsCompleted: completedEnrollments.length,
    reviewResponseRate: safePercentage(nudgesResponded.length, reviewNudges.length),
    referralCount: referrals.length,
    referralRewardValue: rewardValue,
    affiliatePrograms: affiliateLinks.length,
    affiliateConversions,
  };

  const storytellingKits = gigs
    .filter((gig) => gig.csatScore != null)
    .map((gig) => ({
      id: gig.id,
      title: gig.title,
      csatScore: gig.csatScore,
      csatResponseCount: gig.csatResponseCount,
      clientName: gig.clientName,
    }));

  return {
    summary,
    playbooks,
    enrollments,
    events,
    referrals,
    reviewNudges,
    affiliateLinks,
    storytellingKits,
  };
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

    const gigIds = gigSummaries.map((gig) => gig.id).filter((id) => Number.isInteger(id));
    const workspaceOwnerId = workspace?.ownerId ?? null;

    let gigPackageRows = [];
    let gigAddonRows = [];
    let gigMediaRows = [];
    let gigPerformanceRows = [];
    let gigOrderRows = [];

    if (gigIds.length) {
      [gigPackageRows, gigAddonRows, gigMediaRows, gigPerformanceRows, gigOrderRows] = await Promise.all([
        GigPackage.findAll({
          where: { gigId: { [Op.in]: gigIds } },
          order: [
            ['gigId', 'ASC'],
            ['priceAmount', 'ASC'],
          ],
        }),
        GigAddon.findAll({
          where: { gigId: { [Op.in]: gigIds } },
          order: [
            ['gigId', 'ASC'],
            ['priceAmount', 'ASC'],
          ],
        }),
        GigMediaAsset.findAll({
          where: { gigId: { [Op.in]: gigIds } },
          order: [['displayOrder', 'ASC']],
        }),
        GigPerformanceSnapshot.findAll({
          where: { gigId: { [Op.in]: gigIds } },
          order: [['snapshotDate', 'DESC']],
        }),
        GigOrder.findAll({
          where: {
            gigId: { [Op.in]: gigIds },
            createdAt: { [Op.gte]: lookbackDate },
          },
          order: [['createdAt', 'DESC']],
        }),
      ]);
    }

    const gigBundleRows = workspaceOwnerId
      ? await GigBundle.findAll({ where: { freelancerId: workspaceOwnerId }, order: [['createdAt', 'DESC']] })
      : [];
    const bundleIds = gigBundleRows.map((bundle) => bundle.id).filter((id) => Number.isInteger(id));
    const gigBundleItemRows = bundleIds.length
      ? await GigBundleItem.findAll({
          where: { bundleId: { [Op.in]: bundleIds } },
          order: [['orderIndex', 'ASC']],
        })
      : [];
    const gigUpsellRows = workspaceOwnerId
      ? await GigUpsell.findAll({ where: { freelancerId: workspaceOwnerId }, order: [['createdAt', 'DESC']] })
      : [];

    const alliances = workspaceIdFilter
      ? await AgencyAlliance.findAll({
          where: { workspaceId: workspaceIdFilter },
          order: [['createdAt', 'DESC']],
        })
      : [];
    const allianceIds = alliances.map((alliance) => alliance.id).filter((id) => Number.isInteger(id));
    const allianceMemberRows = allianceIds.length
      ? await AgencyAllianceMember.findAll({
          where: { allianceId: { [Op.in]: allianceIds } },
          include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }],
        })
      : [];
    const allianceRateCardRows = allianceIds.length
      ? await AgencyAllianceRateCard.findAll({
          where: { allianceId: { [Op.in]: allianceIds } },
          order: [['version', 'DESC']],
        })
      : [];
    const allianceRevenueSplitRows = allianceIds.length
      ? await AgencyAllianceRevenueSplit.findAll({
          where: { allianceId: { [Op.in]: allianceIds } },
          order: [['createdAt', 'DESC']],
        })
      : [];
    const partnerEngagementRows = workspaceIdFilter
      ? await PartnerEngagement.findAll({
          where: { workspaceId: workspaceIdFilter },
          order: [['lastInteractionAt', 'DESC']],
        })
      : [];

    const pipelineOwnerId = workspace ? workspace.id : null;
    let campaignRows = [];
    let dealRows = [];
    let followUpRows = [];
    if (pipelineOwnerId) {
      [campaignRows, dealRows, followUpRows] = await Promise.all([
        PipelineCampaign.findAll({
          where: { ownerId: pipelineOwnerId, ownerType: 'agency' },
          order: [['createdAt', 'DESC']],
          limit: 50,
        }),
        PipelineDeal.findAll({
          where: { ownerId: pipelineOwnerId, ownerType: 'agency' },
          order: [['createdAt', 'DESC']],
          limit: 100,
        }),
        PipelineFollowUp.findAll({
          where: { ownerId: pipelineOwnerId, ownerType: 'agency' },
          order: [['dueAt', 'ASC']],
          limit: 100,
        }),
      ]);
    }
    const dealIds = dealRows.map((deal) => deal.id).filter((id) => Number.isInteger(id));
    const proposalRows = dealIds.length
      ? await PipelineProposal.findAll({ where: { dealId: { [Op.in]: dealIds } }, order: [['createdAt', 'DESC']] })
      : [];

    const eventRowsMarketing = workspaceIdFilter
      ? await RecruitingCalendarEvent.findAll({
          where: { workspaceId: workspaceIdFilter },
          order: [['startsAt', 'ASC']],
          limit: 50,
        })
      : [];
    const landingPageRows = workspaceIdFilter
      ? await EmployerBrandAsset.findAll({
          where: { workspaceId: workspaceIdFilter },
          order: [['createdAt', 'DESC']],
          limit: 50,
        })
      : [];

    let playbookRows = [];
    let enrollmentRows = [];
    let clientEventRows = [];
    let referralRows = [];
    let reviewNudgeRows = [];
    let affiliateLinkRows = [];
    if (workspaceOwnerId) {
      [playbookRows, enrollmentRows, clientEventRows, referralRows, reviewNudgeRows, affiliateLinkRows] = await Promise.all([
        ClientSuccessPlaybook.findAll({ where: { freelancerId: workspaceOwnerId }, order: [['createdAt', 'DESC']] }),
        ClientSuccessEnrollment.findAll({ where: { freelancerId: workspaceOwnerId }, order: [['createdAt', 'DESC']] }),
        ClientSuccessEvent.findAll({ where: { freelancerId: workspaceOwnerId }, order: [['createdAt', 'DESC']], limit: 100 }),
        ClientSuccessReferral.findAll({ where: { freelancerId: workspaceOwnerId }, order: [['createdAt', 'DESC']], limit: 100 }),
        ClientSuccessReviewNudge.findAll({ where: { freelancerId: workspaceOwnerId }, order: [['createdAt', 'DESC']], limit: 100 }),
        ClientSuccessAffiliateLink.findAll({ where: { freelancerId: workspaceOwnerId }, order: [['createdAt', 'DESC']], limit: 100 }),
      ]);
    }

    const gigPackages = gigPackageRows.map((row) => row.toBuilderObject());
    const gigAddons = gigAddonRows.map((row) => row.toBuilderObject());
    const gigMediaAssets = gigMediaRows.map((row) => row.toBuilderObject());
    const gigPerformanceSnapshots = gigPerformanceRows.map((row) => row.toBuilderObject());
    const gigOrders = gigOrderRows.map((row) => row.toPublicObject());
    const gigBundles = gigBundleRows.map((row) => row.toPublicObject());
    const gigBundleItems = gigBundleItemRows.map((row) => row.toPublicObject());
    const gigUpsells = gigUpsellRows.map((row) => row.toPublicObject());

    const allianceRecords = alliances.map((alliance) => alliance.toPublicObject());
    const allianceMemberRecords = allianceMemberRows.map((member) => {
      const plain = member.get({ plain: true });
      return {
        ...plain,
        commitmentHours: plain.commitmentHours != null ? Number.parseFloat(plain.commitmentHours) : null,
        revenueSharePercent: plain.revenueSharePercent != null ? Number.parseFloat(plain.revenueSharePercent) : null,
      };
    });
    const allianceRateCards = allianceRateCardRows.map((row) => row.toPublicObject());
    const allianceRevenueSplits = allianceRevenueSplitRows.map((row) => row.toPublicObject());
    const partnerEngagements = partnerEngagementRows.map((row) => {
      const plain = toPlainValue(row);
      return {
        ...plain,
        conversionRate: plain?.conversionRate != null ? Number(plain.conversionRate) : null,
        touchpoints: normaliseNumber(plain?.touchpoints, 0),
      };
    });

    const campaigns = campaignRows.map((row) => row.toPublicObject());
    const deals = dealRows.map((row) => row.toPublicObject());
    const followUps = followUpRows.map((row) => row.toPublicObject());
    const proposals = proposalRows.map((row) => row.toPublicObject());
    const marketingEvents = eventRowsMarketing.map((row) => toPlainValue(row));
    const landingPages = landingPageRows.map((row) => {
      const plain = toPlainValue(row);
      return {
        ...plain,
        engagementScore: plain?.engagementScore != null ? Number(plain.engagementScore) : null,
      };
    });

    const playbooks = playbookRows.map((row) => row.toPublicObject());
    const enrollments = enrollmentRows.map((row) => row.toPublicObject());
    const clientEvents = clientEventRows.map((row) => row.toPublicObject());
    const referrals = referralRows.map((row) => {
      const plain = row.toPublicObject();
      return {
        ...plain,
        rewardValueAmount: plain.rewardValueCents != null ? centsToAmount(plain.rewardValueCents) : 0,
      };
    });
    const reviewNudges = reviewNudgeRows.map((row) => row.toPublicObject());
    const affiliateLinks = affiliateLinkRows.map((row) => row.toPublicObject());

    const studioInsights = buildGigStudioInsights({
      gigs: gigSummaries,
      packages: gigPackages,
      addons: gigAddons,
      mediaAssets: gigMediaAssets,
      performanceSnapshots: gigPerformanceSnapshots,
      orders: gigOrders,
      bundles: gigBundles,
      bundleItems: gigBundleItems,
      upsells: gigUpsells,
      alliances: allianceRecords,
      allianceMembers: allianceMemberRecords,
    });

    const partnerProgramInsights = buildPartnerProgramInsights({
      alliances: allianceRecords,
      allianceMembers: allianceMemberRecords,
      rateCards: allianceRateCards,
      revenueSplits: allianceRevenueSplits,
      partnerEngagements,
    });

    const marketingAutomationInsights = buildMarketingAutomationInsights({
      campaigns,
      deals,
      followUps,
      proposals,
      events: marketingEvents,
      landingPages,
    });

    const clientAdvocacyInsights = buildClientAdvocacyInsights({
      playbooks,
      enrollments,
      events: clientEvents,
      referrals,
      reviewNudges,
      affiliateLinks,
      gigs: gigSummaries,
    });

    const totalClients = new Set(formattedNotes.map((note) => note.subjectUserId)).size;

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
      marketplaceLeadership: {
        studio: studioInsights,
        partnerPrograms: partnerProgramInsights,
        marketingAutomation: marketingAutomationInsights,
        clientAdvocacy: clientAdvocacyInsights,
      },
      refreshedAt: new Date().toISOString(),
    };
  });
}

export default {
  getAgencyDashboard,
};

