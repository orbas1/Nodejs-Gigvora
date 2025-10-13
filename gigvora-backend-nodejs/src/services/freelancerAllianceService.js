import { Op } from 'sequelize';
import {
  User,
  AgencyAlliance,
  AgencyAllianceMember,
  AgencyAlliancePod,
  AgencyAlliancePodMember,
  AgencyAllianceResourceSlot,
  AgencyAllianceRateCard,
  AgencyAllianceRateCardApproval,
  AgencyAllianceRevenueSplit,
  ProviderWorkspace,
  ProviderWorkspaceMember,
} from '../models/index.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const CACHE_NAMESPACE = 'dashboard:freelancer:alliance';
const CACHE_TTL_SECONDS = 60;
const MAX_WEEKS_LOOKBACK = 12;
const HOURS_DECIMALS = 10;

function normalizeFreelancerId(value) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('freelancerId must be a positive integer.');
  }
  return numeric;
}

function sanitizeUser(userInstance) {
  if (!userInstance) return null;
  const user = userInstance.get?.({ plain: true }) ?? userInstance;
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
}

function sanitizeWorkspace(workspaceInstance) {
  if (!workspaceInstance) return null;
  const workspace = workspaceInstance.get?.({ plain: true }) ?? workspaceInstance;
  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    type: workspace.type,
    defaultCurrency: workspace.defaultCurrency,
  };
}

function sanitizeWorkspaceMember(memberInstance) {
  if (!memberInstance) return null;
  const member = memberInstance.get?.({ plain: true }) ?? memberInstance;
  return {
    id: member.id,
    workspaceId: member.workspaceId,
    userId: member.userId,
    role: member.role,
    status: member.status,
  };
}

function normalizeHours(value) {
  if (value == null) return 0;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.round((numeric + Number.EPSILON) * HOURS_DECIMALS) / HOURS_DECIMALS;
}

function sanitizeAllianceMember(instance) {
  if (!instance) return null;
  const base = instance.toPublicObject?.() ?? instance.get?.({ plain: true }) ?? instance;
  return {
    ...base,
    user: sanitizeUser(instance.get?.('user') ?? instance.user),
    workspace: sanitizeWorkspace(instance.get?.('workspace') ?? instance.workspace),
    workspaceMember: sanitizeWorkspaceMember(instance.get?.('workspaceMember') ?? instance.workspaceMember),
  };
}

function sanitizePodMember(instance) {
  if (!instance) return null;
  const base = instance.toPublicObject?.() ?? instance.get?.({ plain: true }) ?? instance;
  const member = instance.get?.('member') ?? instance.member;
  return {
    ...base,
    member: sanitizeAllianceMember(member),
  };
}

function sanitizePod(instance) {
  if (!instance) return null;
  const base = instance.toPublicObject?.() ?? instance.get?.({ plain: true }) ?? instance;
  const leadMember = instance.get?.('leadMember') ?? instance.leadMember;
  return {
    ...base,
    leadMember: sanitizeAllianceMember(leadMember),
    members: Array.isArray(instance.members)
      ? instance.members.map((member) => sanitizePodMember(member))
      : [],
  };
}

function sanitizeRateCardApproval(instance) {
  if (!instance) return null;
  const base = instance.toPublicObject?.() ?? instance.get?.({ plain: true }) ?? instance;
  return {
    ...base,
    approver: sanitizeUser(instance.get?.('approver') ?? instance.approver),
  };
}

function sanitizeRateCard(instance) {
  if (!instance) return null;
  const base = instance.toPublicObject?.() ?? instance.get?.({ plain: true }) ?? instance;
  return {
    ...base,
    rate: normalizeHours(base.rate),
    createdBy: sanitizeUser(instance.get?.('createdBy') ?? instance.createdBy),
    approvals: Array.isArray(instance.approvals)
      ? instance.approvals.map((approval) => sanitizeRateCardApproval(approval))
      : [],
  };
}

function sanitizeRevenueSplit(instance) {
  if (!instance) return null;
  const base = instance.toPublicObject?.() ?? instance.get?.({ plain: true }) ?? instance;
  return {
    ...base,
    createdBy: sanitizeUser(instance.get?.('createdBy') ?? instance.createdBy),
    approvedBy: sanitizeUser(instance.get?.('approvedBy') ?? instance.approvedBy),
  };
}

function sanitizeResourceSlot(instance) {
  if (!instance) return null;
  const base = instance.toPublicObject?.() ?? instance.get?.({ plain: true }) ?? instance;
  return {
    ...base,
    plannedHours: normalizeHours(base.plannedHours),
    bookedHours: normalizeHours(base.bookedHours),
    member: sanitizeAllianceMember(instance.get?.('member') ?? instance.member),
  };
}

function buildRateCardGroups(rateCards = []) {
  const grouped = new Map();
  rateCards
    .slice()
    .sort((a, b) => {
      if (a.serviceLine === b.serviceLine) {
        return b.version - a.version;
      }
      return a.serviceLine.localeCompare(b.serviceLine);
    })
    .forEach((card) => {
      const key = `${card.serviceLine}::${card.deliveryModel ?? ''}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(card);
    });

  return Array.from(grouped.values()).map((cards) => ({
    serviceLine: cards[0].serviceLine,
    deliveryModel: cards[0].deliveryModel,
    latest: cards[0],
    history: cards.slice(1),
    pendingApprovals: cards[0].approvals?.filter((approval) => approval.status === 'pending') ?? [],
  }));
}

function buildRevenueTimeline(revenueSplits = []) {
  return revenueSplits
    .slice()
    .sort((a, b) => new Date(b.effectiveFrom || 0) - new Date(a.effectiveFrom || 0));
}

function buildResourceCalendar(slots = []) {
  const grouped = new Map();
  slots.forEach((slot) => {
    if (!grouped.has(slot.weekStartDate)) {
      grouped.set(slot.weekStartDate, { weekStartDate: slot.weekStartDate, plannedHours: 0, bookedHours: 0, members: [] });
    }
    const week = grouped.get(slot.weekStartDate);
    week.plannedHours += slot.plannedHours;
    week.bookedHours += slot.bookedHours;
    if (slot.member) {
      week.members.push({
        memberId: slot.member.id,
        memberName: slot.member.user
          ? `${slot.member.user.firstName} ${slot.member.user.lastName}`.trim()
          : slot.member.workspace?.name ?? `Member #${slot.member.id}`,
        plannedHours: slot.plannedHours,
        bookedHours: slot.bookedHours,
        utilizationRate: slot.plannedHours > 0 ? Math.round((slot.bookedHours / slot.plannedHours) * 1000) / 10 : 0,
        role: slot.member.role,
        status: slot.member.status,
      });
    }
  });

  return Array.from(grouped.values())
    .map((week) => ({
      ...week,
      availableHours: normalizeHours(week.plannedHours - week.bookedHours),
      utilizationRate: week.plannedHours > 0 ? Math.round((week.bookedHours / week.plannedHours) * 1000) / 10 : 0,
    }))
    .sort((a, b) => new Date(a.weekStartDate) - new Date(b.weekStartDate));
}

function buildHeatmap(slots = [], allianceLookup = new Map()) {
  const grouped = new Map();
  slots.forEach((slot) => {
    if (!grouped.has(slot.weekStartDate)) {
      grouped.set(slot.weekStartDate, []);
    }
    grouped.get(slot.weekStartDate).push(slot);
  });

  return Array.from(grouped.entries())
    .map(([weekStartDate, items]) => {
      const totalsByAlliance = new Map();
      items.forEach((slot) => {
        if (!totalsByAlliance.has(slot.allianceId)) {
          totalsByAlliance.set(slot.allianceId, { plannedHours: 0, bookedHours: 0 });
        }
        const bucket = totalsByAlliance.get(slot.allianceId);
        bucket.plannedHours += slot.plannedHours;
        bucket.bookedHours += slot.bookedHours;
      });

      const allocations = Array.from(totalsByAlliance.entries())
        .map(([allianceId, { plannedHours, bookedHours }]) => {
          const alliance = allianceLookup.get(allianceId);
          const planned = normalizeHours(plannedHours);
          const booked = normalizeHours(bookedHours);
          return {
            allianceId,
            allianceName: alliance?.name ?? `Alliance #${allianceId}`,
            plannedHours: planned,
            bookedHours: booked,
            availableHours: normalizeHours(planned - booked),
            utilizationRate: planned > 0 ? Math.round((booked / planned) * 1000) / 10 : 0,
          };
        })
        .sort((a, b) => b.bookedHours - a.bookedHours || a.allianceName.localeCompare(b.allianceName));

      const totalPlannedHours = allocations.reduce((sum, item) => sum + item.plannedHours, 0);
      const totalBookedHours = allocations.reduce((sum, item) => sum + item.bookedHours, 0);

      return {
        weekStartDate,
        totalPlannedHours: normalizeHours(totalPlannedHours),
        totalBookedHours: normalizeHours(totalBookedHours),
        availableHours: normalizeHours(totalPlannedHours - totalBookedHours),
        utilizationRate: totalPlannedHours > 0 ? Math.round((totalBookedHours / totalPlannedHours) * 1000) / 10 : 0,
        allocations,
      };
    })
    .sort((a, b) => new Date(a.weekStartDate) - new Date(b.weekStartDate));
}

function buildAllianceSummary({
  alliance,
  membership,
  pods,
  rateCards,
  revenueSplits,
  resourceSlots,
}) {
  const sanitizedPods = pods.map((pod) => sanitizePod(pod));
  const sanitizedRateCards = rateCards.map((card) => sanitizeRateCard(card));
  const sanitizedRevenueSplits = revenueSplits.map((split) => sanitizeRevenueSplit(split));
  const sanitizedSlots = resourceSlots.map((slot) => sanitizeResourceSlot(slot));

  const rateCardGroups = buildRateCardGroups(sanitizedRateCards);
  const resourceCalendar = buildResourceCalendar(sanitizedSlots);

  const nextReview = resourceCalendar.length
    ? resourceCalendar[resourceCalendar.length - 1].weekStartDate
    : alliance.nextReviewAt;

  return {
    alliance: alliance.toPublicObject?.() ?? alliance,
    membership: sanitizeAllianceMember(membership),
    pods: sanitizedPods,
    rateCardGroups,
    revenueSplits: buildRevenueTimeline(sanitizedRevenueSplits),
    resourceCalendar,
    metrics: {
      totalPods: sanitizedPods.length,
      activeRateCards: sanitizedRateCards.filter((card) => card.status === 'active').length,
      pendingApprovals: rateCardGroups.reduce(
        (count, group) => count + (group.pendingApprovals?.length ?? 0),
        0,
      ),
      nextReviewAt: nextReview,
    },
  };
}

export async function getFreelancerAllianceDashboard(freelancerId, { bypassCache = false } = {}) {
  const normalizedFreelancerId = normalizeFreelancerId(freelancerId);
  const cacheKey = buildCacheKey(CACHE_NAMESPACE, { freelancerId: normalizedFreelancerId });

  if (!bypassCache) {
    const cached = appCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const freelancer = await User.findByPk(normalizedFreelancerId);
  if (!freelancer || freelancer.userType !== 'freelancer') {
    throw new NotFoundError('Freelancer not found.');
  }

  const memberships = await AgencyAllianceMember.findAll({
    where: { userId: normalizedFreelancerId },
    include: [
      {
        model: AgencyAlliance,
        as: 'alliance',
        include: [{ model: ProviderWorkspace, as: 'workspace' }],
      },
      { model: ProviderWorkspace, as: 'workspace' },
      { model: ProviderWorkspaceMember, as: 'workspaceMember' },
    ],
    order: [
      ['status', 'ASC'],
      ['joinDate', 'ASC'],
    ],
  });

  if (!memberships.length) {
    const empty = {
      freelancer: sanitizeUser(freelancer),
      alliances: [],
      resourceHeatmap: { weeks: [] },
      meta: {
        generatedAt: new Date().toISOString(),
        allianceCount: 0,
      },
    };
    appCache.set(cacheKey, empty, CACHE_TTL_SECONDS);
    return empty;
  }

  const allianceIds = [...new Set(memberships.map((membership) => membership.allianceId))];

  const [pods, rateCards, revenueSplits, resourceSlots] = await Promise.all([
    AgencyAlliancePod.findAll({
      where: { allianceId: { [Op.in]: allianceIds } },
      include: [
        {
          model: AgencyAllianceMember,
          as: 'leadMember',
          include: [
            { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
            { model: ProviderWorkspace, as: 'workspace', attributes: ['id', 'name', 'slug', 'type'] },
          ],
        },
        {
          model: AgencyAlliancePodMember,
          as: 'members',
          include: [
            {
              model: AgencyAllianceMember,
              as: 'member',
              include: [
                { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: ProviderWorkspace, as: 'workspace', attributes: ['id', 'name', 'slug', 'type'] },
              ],
            },
          ],
        },
      ],
    }),
    AgencyAllianceRateCard.findAll({
      where: { allianceId: { [Op.in]: allianceIds } },
      include: [
        { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
        {
          model: AgencyAllianceRateCardApproval,
          as: 'approvals',
          include: [{ model: User, as: 'approver', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        },
      ],
      order: [
        ['serviceLine', 'ASC'],
        ['version', 'DESC'],
      ],
    }),
    AgencyAllianceRevenueSplit.findAll({
      where: { allianceId: { [Op.in]: allianceIds } },
      include: [
        { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'approvedBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    }),
    (() => {
      const now = new Date();
      const cutoff = new Date(now.getTime() - MAX_WEEKS_LOOKBACK * 7 * 24 * 60 * 60 * 1000);
      return AgencyAllianceResourceSlot.findAll({
        where: {
          allianceId: { [Op.in]: allianceIds },
          weekStartDate: { [Op.gte]: cutoff.toISOString().slice(0, 10) },
        },
        include: [
          {
            model: AgencyAllianceMember,
            as: 'member',
            include: [
              { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
              { model: ProviderWorkspace, as: 'workspace', attributes: ['id', 'name', 'slug', 'type'] },
            ],
          },
        ],
        order: [['weekStartDate', 'ASC']],
      });
    })(),
  ]);

  const podsByAlliance = new Map();
  pods.forEach((pod) => {
    if (!podsByAlliance.has(pod.allianceId)) {
      podsByAlliance.set(pod.allianceId, []);
    }
    podsByAlliance.get(pod.allianceId).push(pod);
  });

  const rateCardsByAlliance = new Map();
  rateCards.forEach((card) => {
    if (!rateCardsByAlliance.has(card.allianceId)) {
      rateCardsByAlliance.set(card.allianceId, []);
    }
    rateCardsByAlliance.get(card.allianceId).push(card);
  });

  const revenueSplitsByAlliance = new Map();
  revenueSplits.forEach((split) => {
    if (!revenueSplitsByAlliance.has(split.allianceId)) {
      revenueSplitsByAlliance.set(split.allianceId, []);
    }
    revenueSplitsByAlliance.get(split.allianceId).push(split);
  });

  const resourceSlotsByAlliance = new Map();
  resourceSlots.forEach((slot) => {
    if (!resourceSlotsByAlliance.has(slot.allianceId)) {
      resourceSlotsByAlliance.set(slot.allianceId, []);
    }
    resourceSlotsByAlliance.get(slot.allianceId).push(slot);
  });

  const alliances = memberships.map((membership) => {
    const alliance = membership.get?.('alliance') ?? membership.alliance;
    return buildAllianceSummary({
      alliance,
      membership,
      pods: podsByAlliance.get(membership.allianceId) ?? [],
      rateCards: rateCardsByAlliance.get(membership.allianceId) ?? [],
      revenueSplits: revenueSplitsByAlliance.get(membership.allianceId) ?? [],
      resourceSlots: resourceSlotsByAlliance.get(membership.allianceId) ?? [],
    });
  });

  const allianceLookup = new Map(
    alliances.map((item) => [item.alliance.id, { name: item.alliance.name, status: item.alliance.status }]),
  );

  const sanitizedSlots = resourceSlots.map((slot) => sanitizeResourceSlot(slot));
  const resourceHeatmap = {
    weeks: buildHeatmap(sanitizedSlots, allianceLookup),
  };

  const payload = {
    freelancer: sanitizeUser(freelancer),
    alliances,
    resourceHeatmap,
    meta: {
      generatedAt: new Date().toISOString(),
      allianceCount: alliances.length,
    },
  };

  appCache.set(cacheKey, payload, CACHE_TTL_SECONDS);
  return payload;
}

export default {
  getFreelancerAllianceDashboard,
};
