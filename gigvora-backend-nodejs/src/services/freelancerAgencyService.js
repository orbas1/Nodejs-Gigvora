import { Op } from 'sequelize';
import {
  User,
  FreelancerProfile,
  ProviderWorkspace,
  AgencyCollaboration,
  AgencyCollaborationInvitation,
  AgencyRateCard,
  AgencyRateCardItem,
  AgencyRetainerNegotiation,
  AgencyRetainerEvent,
} from '../models/index.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const CACHE_NAMESPACE = 'freelancer:agency-collaborations';
const CACHE_TTL_SECONDS = 45;

const OPEN_NEGOTIATION_STATUSES = new Set(['in_discussion', 'awaiting_signature']);
const PIPELINE_NEGOTIATION_STATUSES = new Set(['draft', 'in_discussion', 'awaiting_signature']);

function normaliseFreelancerId(value) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('freelancerId must be a positive integer.');
  }
  return numeric;
}

function toPlain(instance) {
  if (!instance) return null;
  if (typeof instance.toPublicObject === 'function') {
    return instance.toPublicObject();
  }
  if (typeof instance.get === 'function') {
    return instance.get({ plain: true });
  }
  return { ...instance };
}

function parseDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function differenceInDays(from, to = new Date()) {
  const start = parseDate(from);
  const end = parseDate(to);
  if (!start || !end) return null;
  const diffMs = end.getTime() - start.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function differenceInHours(from, to) {
  const start = parseDate(from);
  const end = parseDate(to);
  if (!start || !end) return null;
  const diffMs = end.getTime() - start.getTime();
  return diffMs / (1000 * 60 * 60);
}

function sumNumbers(values) {
  return values.reduce((total, value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? total + numeric : total;
  }, 0);
}

function average(values) {
  if (!values.length) return 0;
  return sumNumbers(values) / values.length;
}

function sanitizeWorkspace(workspace) {
  const plain = toPlain(workspace);
  if (!plain) return null;
  return {
    id: plain.id,
    name: plain.name,
    slug: plain.slug,
    type: plain.type,
    timezone: plain.timezone,
    defaultCurrency: plain.defaultCurrency,
  };
}

function sanitizeInvitation(invitation) {
  const base = toPlain(invitation);
  if (!base) return null;
  const workspace = sanitizeWorkspace(invitation.agencyWorkspace);
  const sentBy = invitation.sentBy
    ? {
        id: invitation.sentBy.id,
        firstName: invitation.sentBy.firstName,
        lastName: invitation.sentBy.lastName,
        email: invitation.sentBy.email,
      }
    : null;
  const responseDueAt = base.responseDueAt ?? base.response_due_at;
  const dueDate = parseDate(responseDueAt);
  return {
    ...base,
    workspace,
    sentBy,
    responseDueAt: dueDate ? dueDate.toISOString() : null,
    isOverdue: dueDate ? dueDate.getTime() < Date.now() && base.status === 'pending' : false,
  };
}

function sanitizeRateCard(rateCard) {
  const base = toPlain(rateCard);
  const workspace = sanitizeWorkspace(rateCard.agencyWorkspace);
  const items = Array.isArray(rateCard.items)
    ? rateCard.items
        .map((item) => item.toPublicObject())
        .sort((a, b) => {
          if (a.sortOrder !== b.sortOrder) {
            return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
          }
          return (a.name ?? '').localeCompare(b.name ?? '');
        })
    : [];

  return {
    ...base,
    workspace,
    items,
  };
}

function collectDeliverables(collaboration) {
  const base = toPlain(collaboration);
  const workspace = sanitizeWorkspace(collaboration.agencyWorkspace);
  const items = Array.isArray(base.sharedDeliverablesDue) ? base.sharedDeliverablesDue : [];
  return items
    .map((item) => {
      const dueAt = parseDate(item.dueAt ?? item.due_at ?? item.dueDate);
      return {
        collaborationId: base.id,
        workspaceId: workspace?.id ?? null,
        workspaceName: workspace?.name ?? null,
        title: item.title ?? item.name ?? 'Deliverable',
        status: item.status ?? 'scheduled',
        owner: item.owner ?? item.assignee ?? null,
        notes: item.notes ?? item.summary ?? null,
        riskLevel: item.riskLevel ?? item.risk ?? 'normal',
        dueAt: dueAt ? dueAt.toISOString() : null,
      };
    })
    .filter((item) => item);
}

function collectMilestones(collaboration) {
  const snapshot = toPlain(collaboration)?.sharedDeliverySnapshot ?? {};
  const workspace = sanitizeWorkspace(collaboration.agencyWorkspace);
  const milestones = Array.isArray(snapshot?.milestones) ? snapshot.milestones : [];
  return milestones
    .map((milestone) => {
      const startAt = parseDate(milestone.startAt ?? milestone.start);
      const endAt = parseDate(milestone.endAt ?? milestone.end);
      return {
        collaborationId: collaboration.id,
        workspaceId: workspace?.id ?? null,
        workspaceName: workspace?.name ?? null,
        name: milestone.name ?? milestone.title ?? 'Milestone',
        phase: milestone.phase ?? milestone.type ?? null,
        startAt: startAt ? startAt.toISOString() : null,
        endAt: endAt ? endAt.toISOString() : null,
        owners: Array.isArray(milestone.owners) ? milestone.owners : [],
      };
    })
    .filter((item) => item);
}

function collectResources(collaboration, aggregate) {
  const plan = toPlain(collaboration)?.sharedResourcePlan ?? {};
  const roles = Array.isArray(plan?.roles) ? plan.roles : [];
  roles.forEach((role) => {
    const key = (role.role ?? role.name ?? 'Shared resource').toLowerCase();
    if (!aggregate.has(key)) {
      aggregate.set(key, {
        role: role.role ?? role.name ?? 'Shared resource',
        committedHours: 0,
        availableHours: 0,
        collaborators: new Set(),
      });
    }
    const entry = aggregate.get(key);
    entry.committedHours += Number(role.committedHours ?? role.capacity ?? 0);
    entry.availableHours += Number(role.availableHours ?? role.remaining ?? 0);
    const contributors = Array.isArray(role.collaborators) ? role.collaborators : [];
    contributors.forEach((name) => entry.collaborators.add(name));
  });
}

function sanitizeNegotiation(negotiation) {
  const base = toPlain(negotiation);
  if (!base) return null;
  const workspace = sanitizeWorkspace(negotiation.agencyWorkspace ?? negotiation.collaboration?.agencyWorkspace);
  const events = Array.isArray(negotiation.events)
    ? negotiation.events
        .map((event) => event.toPublicObject())
        .sort((a, b) => {
          const aDate = parseDate(a.occurredAt)?.getTime() ?? 0;
          const bDate = parseDate(b.occurredAt)?.getTime() ?? 0;
          return bDate - aDate;
        })
    : [];

  const lastAgencyMessageAt = parseDate(base.lastAgencyMessageAt);
  const lastFreelancerMessageAt = parseDate(base.lastFreelancerMessageAt);
  const responseCycleHours = differenceInHours(lastAgencyMessageAt, lastFreelancerMessageAt);

  return {
    ...base,
    workspace,
    events,
    responseCycleHours,
  };
}

function sanitizeCollaboration(collaboration) {
  const base = toPlain(collaboration);
  if (!base) return null;
  const workspace = sanitizeWorkspace(collaboration.agencyWorkspace);
  const negotiations = Array.isArray(collaboration.negotiations)
    ? collaboration.negotiations.map(sanitizeNegotiation).filter(Boolean)
    : [];
  const deliverables = collectDeliverables(collaboration);
  const milestones = collectMilestones(collaboration);
  const upcomingDeliverable = deliverables
    .filter((item) => item.dueAt)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())[0] ?? null;

  return {
    ...base,
    workspace,
    negotiations,
    deliverables,
    milestones,
    upcomingDeliverable,
  };
}

function buildSummary(collaborations, invitations, negotiations, rateCards) {
  const activeCollaborations = collaborations.filter((collab) => collab.status === 'active');
  const pendingInvitations = invitations.filter((invite) => invite.status === 'pending');
  const respondedInvites = invitations.filter((invite) => ['accepted', 'declined'].includes(invite.status));
  const acceptedInvites = invitations.filter((invite) => invite.status === 'accepted');
  const openNegotiations = negotiations.filter((negotiation) => OPEN_NEGOTIATION_STATUSES.has(negotiation.status));
  const pipelineNegotiations = negotiations.filter((negotiation) => PIPELINE_NEGOTIATION_STATUSES.has(negotiation.status));

  const monthlyRetainerValue = sumNumbers(activeCollaborations.map((collab) => collab.retainerAmountMonthly));
  const monthlyRetainerCurrency = activeCollaborations[0]?.currency ?? 'USD';
  const negotiationPipelineValue = sumNumbers(
    pipelineNegotiations.map((negotiation) => negotiation.proposedAmount ?? negotiation.forecastedAmount ?? 0),
  );
  const negotiationPipelineCurrency = pipelineNegotiations[0]?.currency ?? 'USD';
  const averageHealthScore = average(
    activeCollaborations
      .map((collab) => collab.healthScore)
      .filter((score) => Number.isFinite(score)),
  );
  const sharedProjects = sumNumbers(collaborations.map((collab) => collab.activeBriefsCount ?? 0));
  const sharedDeliverablesDue = collectDeliverablesForSummary(collaborations);

  const responseSamples = negotiations
    .map((negotiation) => negotiation.responseCycleHours)
    .filter((value) => Number.isFinite(value) && value >= 0);
  const responseTimeHours = responseSamples.length ? average(responseSamples) : null;

  const pendingRateCardShares = rateCards.reduce((count, card) => {
    if (!card.shareHistory) return count;
    const history = Array.isArray(card.shareHistory) ? card.shareHistory : [];
    const hasPending = history.some((entry) => (entry?.status ?? '').toLowerCase() === 'pending');
    return hasPending ? count + 1 : count;
  }, 0);

  const acceptanceRate = respondedInvites.length
    ? (acceptedInvites.length / respondedInvites.length) * 100
    : 0;

  return {
    activeCollaborations: activeCollaborations.length,
    monthlyRetainerValue,
    monthlyRetainerCurrency,
    pendingInvitations: pendingInvitations.length,
    openNegotiations: openNegotiations.length,
    negotiationPipelineValue,
    negotiationPipelineCurrency,
    averageHealthScore,
    sharedProjects,
    sharedDeliverablesDue,
    responseTimeHours,
    pendingRateCardShares,
    acceptanceRate,
  };
}

function collectDeliverablesForSummary(collaborations) {
  const now = Date.now();
  const horizon = now + 1000 * 60 * 60 * 24 * 30;
  return collaborations.reduce((total, collab) => {
    const deliverables = Array.isArray(collab.deliverables) ? collab.deliverables : [];
    const dueSoon = deliverables.filter((item) => {
      if (!item.dueAt) return false;
      const due = new Date(item.dueAt).getTime();
      return due >= now && due <= horizon;
    });
    return total + dueSoon.length;
  }, 0);
}

function buildDelivery(collaborations) {
  const deliverables = [];
  const milestones = [];
  const resourceAggregate = new Map();

  collaborations.forEach((collab) => {
    const sanitized = sanitizeCollaboration(collab);
    sanitized.deliverables?.forEach((item) => deliverables.push(item));
    sanitized.milestones?.forEach((item) => milestones.push(item));
    collectResources(collab, resourceAggregate);
  });

  deliverables.sort((a, b) => {
    const aTime = parseDate(a.dueAt)?.getTime() ?? Number.POSITIVE_INFINITY;
    const bTime = parseDate(b.dueAt)?.getTime() ?? Number.POSITIVE_INFINITY;
    return aTime - bTime;
  });

  milestones.sort((a, b) => {
    const aTime = parseDate(a.startAt)?.getTime() ?? Number.POSITIVE_INFINITY;
    const bTime = parseDate(b.startAt)?.getTime() ?? Number.POSITIVE_INFINITY;
    return aTime - bTime;
  });

  const resources = Array.from(resourceAggregate.values()).map((entry) => ({
    role: entry.role,
    committedHours: Math.round(entry.committedHours * 10) / 10,
    availableHours: Math.round(entry.availableHours * 10) / 10,
    collaborators: Array.from(entry.collaborators),
  }));

  return {
    deliverables,
    milestones,
    resources,
  };
}

function buildRenewals(collaborations) {
  const now = new Date();
  const upcoming = [];
  const atRisk = [];

  collaborations.forEach((collab) => {
    const base = toPlain(collab);
    const workspace = sanitizeWorkspace(collab.agencyWorkspace);
    const renewalDate = parseDate(base.renewalDate);
    if (!renewalDate) {
      return;
    }
    const daysUntil = differenceInDays(now, renewalDate);
    const entry = {
      collaborationId: base.id,
      workspace,
      renewalDate: renewalDate.toISOString(),
      monthlyValue: base.retainerAmountMonthly != null ? Number.parseFloat(base.retainerAmountMonthly) : null,
      currency: base.currency,
      healthScore: base.healthScore != null ? Number.parseFloat(base.healthScore) : null,
      atRiskDeliverables: base.atRiskDeliverablesCount ?? 0,
      forecastedUpsellValue:
        base.forecastedUpsellValue != null ? Number.parseFloat(base.forecastedUpsellValue) : null,
      forecastedUpsellCurrency: base.forecastedUpsellCurrency ?? base.currency,
    };

    if (daysUntil != null && daysUntil >= 0 && daysUntil <= 90) {
      upcoming.push(entry);
    }

    if ((entry.healthScore != null && entry.healthScore < 70) || entry.atRiskDeliverables > 0) {
      atRisk.push(entry);
    }
  });

  upcoming.sort((a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime());
  atRisk.sort((a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime());

  const totalActive = collaborations.filter((collab) => collab.status === 'active').length;
  const retentionScore = totalActive
    ? Math.max(0, Math.min(100, Math.round(((totalActive - atRisk.length) / totalActive) * 100)))
    : 100;

  return {
    upcoming,
    atRisk,
    retentionScore,
  };
}

function buildNegotiationsPayload(negotiations) {
  const list = negotiations.map(sanitizeNegotiation).filter(Boolean);
  const open = list.filter((item) => OPEN_NEGOTIATION_STATUSES.has(item.status));
  const recentEvents = [];
  list.forEach((negotiation) => {
    negotiation.events.slice(0, 5).forEach((event) => {
      recentEvents.push({
        negotiationId: negotiation.id,
        negotiationName: negotiation.name,
        workspace: negotiation.workspace,
        ...event,
      });
    });
  });
  recentEvents.sort((a, b) => {
    const aTime = parseDate(a.occurredAt)?.getTime() ?? 0;
    const bTime = parseDate(b.occurredAt)?.getTime() ?? 0;
    return bTime - aTime;
  });
  return { list, open, recentEvents: recentEvents.slice(0, 15) };
}

function buildCollaborationsPayload(collaborations) {
  const list = collaborations.map(sanitizeCollaboration).filter(Boolean);
  return {
    list,
    active: list.filter((item) => item.status === 'active'),
    paused: list.filter((item) => item.status === 'paused'),
    ended: list.filter((item) => item.status === 'ended'),
  };
}

function buildFreelancerProfile(userInstance, summary) {
  const user = userInstance.get({ plain: true });
  const profile = userInstance.FreelancerProfile?.get?.({ plain: true }) ?? null;
  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;

  const metrics = [
    {
      label: 'Active collaborations',
      value: summary.activeCollaborations,
    },
    {
      label: 'Monthly retainers',
      value: summary.monthlyRetainerValue,
      currency: summary.monthlyRetainerCurrency,
    },
    {
      label: 'Pipeline value',
      value: summary.negotiationPipelineValue,
      currency: summary.negotiationPipelineCurrency,
    },
  ];

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    name: fullName,
    title: profile?.title ?? null,
    hourlyRate: profile?.hourlyRate != null ? Number.parseFloat(profile.hourlyRate) : null,
    availability: profile?.availability ?? null,
    metrics,
  };
}

export async function getCollaborationsOverview({
  freelancerId,
  lookbackDays = 120,
  includeInactive = true,
} = {}) {
  const normalisedId = normaliseFreelancerId(freelancerId);
  const lookback = Number.isFinite(Number(lookbackDays)) ? Number(lookbackDays) : 120;
  const includeInactiveCollaborations = includeInactive !== false && includeInactive !== 'false';
  const since = new Date();
  since.setDate(since.getDate() - lookback);

  const cacheKey = buildCacheKey(CACHE_NAMESPACE, {
    freelancerId: normalisedId,
    lookback,
    includeInactive: includeInactiveCollaborations,
  });

  return appCache.remember(cacheKey, CACHE_TTL_SECONDS, async () => {
    const freelancer = await User.findByPk(normalisedId, {
      include: [{ model: FreelancerProfile }],
    });

    if (!freelancer) {
      throw new NotFoundError('Freelancer not found.');
    }

    const collaborationWhere = { freelancerId: normalisedId };
    if (!includeInactiveCollaborations) {
      collaborationWhere.status = { [Op.in]: ['invited', 'active'] };
    }

    const [collaborations, invitations, rateCards, negotiations] = await Promise.all([
      AgencyCollaboration.findAll({
        where: collaborationWhere,
        include: [
          { model: ProviderWorkspace, as: 'agencyWorkspace' },
          {
            model: AgencyRetainerNegotiation,
            as: 'negotiations',
            include: [
              {
                model: AgencyRetainerEvent,
                as: 'events',
                required: false,
                where: lookback
                  ? {
                      occurredAt: {
                        [Op.gte]: since,
                      },
                    }
                  : undefined,
                order: [['occurredAt', 'DESC']],
                separate: true,
                limit: 10,
              },
            ],
          },
        ],
        order: [
          ['status', 'ASC'],
          ['updatedAt', 'DESC'],
        ],
      }),
      AgencyCollaborationInvitation.findAll({
        where: {
          freelancerId: normalisedId,
          ...(lookback
            ? {
                createdAt: {
                  [Op.gte]: since,
                },
              }
            : {}),
        },
        include: [
          { model: ProviderWorkspace, as: 'agencyWorkspace' },
          { model: User, as: 'sentBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
        ],
        order: [['createdAt', 'DESC']],
      }),
      AgencyRateCard.findAll({
        where: { freelancerId: normalisedId },
        include: [
          { model: ProviderWorkspace, as: 'agencyWorkspace' },
          {
            model: AgencyRateCardItem,
            as: 'items',
            separate: true,
            order: [
              ['sortOrder', 'ASC'],
              ['name', 'ASC'],
            ],
          },
        ],
        order: [
          ['status', 'ASC'],
          ['updatedAt', 'DESC'],
        ],
      }),
      AgencyRetainerNegotiation.findAll({
        where: {
          freelancerId: normalisedId,
          ...(lookback
            ? {
                updatedAt: {
                  [Op.gte]: since,
                },
              }
            : {}),
        },
        include: [
          {
            model: AgencyCollaboration,
            as: 'collaboration',
            include: [{ model: ProviderWorkspace, as: 'agencyWorkspace' }],
          },
          { model: ProviderWorkspace, as: 'agencyWorkspace' },
          {
            model: AgencyRetainerEvent,
            as: 'events',
            required: false,
            where: lookback
              ? {
                  occurredAt: {
                    [Op.gte]: since,
                  },
                }
              : undefined,
            order: [['occurredAt', 'DESC']],
            separate: true,
            limit: 10,
          },
        ],
        order: [['updatedAt', 'DESC']],
      }),
    ]);

    const collaborationPayload = buildCollaborationsPayload(collaborations);
    const invitationPayload = invitations.map(sanitizeInvitation).filter(Boolean);
    const rateCardPayload = rateCards.map(sanitizeRateCard);
    const negotiationPayload = buildNegotiationsPayload(negotiations);

    const summary = buildSummary(
      collaborationPayload.list,
      invitationPayload,
      negotiationPayload.list,
      rateCardPayload,
    );
    const delivery = buildDelivery(collaborations);
    const renewals = buildRenewals(collaborations);

    const freelancerSummary = buildFreelancerProfile(freelancer, summary);

    return {
      freelancer: freelancerSummary,
      summary,
      invitations: {
        list: invitationPayload,
        pending: invitationPayload.filter((invite) => invite.status === 'pending'),
        responded: invitationPayload.filter((invite) => invite.status !== 'pending'),
      },
      collaborations: collaborationPayload,
      rateCards: rateCardPayload,
      negotiations: negotiationPayload,
      delivery,
      renewals,
    };
  });
}

export default {
  getCollaborationsOverview,
};

