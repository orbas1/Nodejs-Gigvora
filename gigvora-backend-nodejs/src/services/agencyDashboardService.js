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
      refreshedAt: new Date().toISOString(),
    };
  });
}

export default {
  getAgencyDashboard,
};

