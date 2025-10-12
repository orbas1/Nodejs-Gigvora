import { Op } from 'sequelize';
import {
  sequelize,
  User,
  Profile,
  FreelancerProfile,
  FreelancerAssignmentMetric,
  Project,
  AutoAssignQueueEntry,
  SearchSubscription,
  ProjectAssignmentEvent,
} from '../models/index.js';
import { NotFoundError } from '../utils/errors.js';

function toPlain(instance) {
  if (!instance) {
    return null;
  }
  if (typeof instance.toPublicObject === 'function') {
    return instance.toPublicObject();
  }
  return instance.get({ plain: true });
}

function summarizeStatuses(entries = []) {
  return entries.reduce(
    (acc, entry) => {
      const status = entry.status ?? 'unknown';
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    },
    {},
  );
}

function resolveNextAction(entries = []) {
  const timestamps = entries
    .map((entry) => entry.expiresAt || entry.notifiedAt || entry.createdAt)
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value));
  if (!timestamps.length) {
    return null;
  }
  return new Date(Math.min(...timestamps));
}

function sumBudget(projects = []) {
  return projects.reduce((acc, project) => {
    const amount = Number(project.budgetAmount ?? 0);
    return acc + (Number.isFinite(amount) ? amount : 0);
  }, 0);
}

function classifyProjects(projects = []) {
  return projects.reduce(
    (acc, project) => {
      const statusKey = project.status ?? 'unspecified';
      acc.status[statusKey] = (acc.status[statusKey] ?? 0) + 1;
      if (['open', 'in_progress'].includes(project.status)) {
        acc.active += 1;
      }
      return acc;
    },
    { active: 0, status: {} },
  );
}

function mapQueueEntries(entries = []) {
  return entries.map((entry) => {
    const plain = toPlain(entry);
    if (entry.project) {
      plain.project = toPlain(entry.project);
    }
    return plain;
  });
}

function aggregateProjectQueues(entries = []) {
  const grouped = new Map();
  for (const entry of entries) {
    const projectId = entry.project?.id ?? entry.targetId;
    if (!projectId) continue;
    if (!grouped.has(projectId)) {
      grouped.set(projectId, { project: entry.project ? toPlain(entry.project) : null, entries: [] });
    }
    grouped.get(projectId).entries.push(entry);
  }
  return Array.from(grouped.values()).map((group) => ({
    project: group.project,
    entries: mapQueueEntries(group.entries),
    stats: summarizeStatuses(group.entries.map((entry) => entry.toPublicObject?.() ?? entry.get?.({ plain: true }) ?? entry)),
  }));
}

function decorateUser(user) {
  const plain = toPlain(user);
  const profile = user.Profile ? toPlain(user.Profile) : null;
  const freelancerProfile = user.FreelancerProfile ? toPlain(user.FreelancerProfile) : null;
  const metric = user.assignmentMetric ? user.assignmentMetric.toPublicObject() : null;
  return {
    id: plain.id,
    firstName: plain.firstName,
    lastName: plain.lastName,
    email: plain.email,
    userType: plain.userType,
    profile,
    freelancerProfile,
    assignmentMetric: metric,
  };
}

export async function getDashboardOverview(userId) {
  if (!userId) {
    throw new NotFoundError('User not found.');
  }

  const user = await User.findByPk(userId, {
    include: [
      { model: Profile, required: false },
      { model: FreelancerProfile, required: false },
      { model: FreelancerAssignmentMetric, as: 'assignmentMetric', required: false },
    ],
  });

  if (!user) {
    throw new NotFoundError('User not found.');
  }

  const [savedSearches, ownedProjects, projectStatusSummary] = await Promise.all([
    SearchSubscription.findAll({
      where: { userId },
      order: [['updatedAt', 'DESC']],
      limit: 6,
    }),
    Project.findAll({
      where: { ownerId: userId },
      order: [['updatedAt', 'DESC']],
      limit: 6,
    }),
    Project.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: { ownerId: userId },
      group: ['status'],
    }),
  ]);

  const ownedProjectIds = ownedProjects.map((project) => project.id);

  const [projectQueueRaw, freelancerQueueRaw, activityFeedRaw] = await Promise.all([
    ownedProjectIds.length
      ? AutoAssignQueueEntry.findAll({
          where: {
            targetType: 'project',
            targetId: { [Op.in]: ownedProjectIds },
          },
          include: [{ model: Project, as: 'project' }],
          order: [['createdAt', 'DESC']],
          limit: 25,
        })
      : [],
    user.userType === 'freelancer'
      ? AutoAssignQueueEntry.findAll({
          where: { freelancerId: userId },
          include: [{ model: Project, as: 'project' }],
          order: [['createdAt', 'DESC']],
          limit: 12,
        })
      : [],
    ownedProjectIds.length
      ? ProjectAssignmentEvent.findAll({
          where: { projectId: { [Op.in]: ownedProjectIds } },
          order: [['createdAt', 'DESC']],
          limit: 20,
        })
      : [],
  ]);

  const projectQueueEntries = Array.isArray(projectQueueRaw)
    ? projectQueueRaw.map((entry) => entry)
    : [];
  const freelancerQueueEntries = Array.isArray(freelancerQueueRaw)
    ? freelancerQueueRaw.map((entry) => entry)
    : [];

  const projectQueuePublic = mapQueueEntries(projectQueueEntries);
  const freelancerQueuePublic = mapQueueEntries(freelancerQueueEntries);

  const queueMetrics = {
    projects: {
      totalEntries: projectQueuePublic.length,
      stats: summarizeStatuses(projectQueuePublic),
      nextActionAt: resolveNextAction(projectQueuePublic),
      queues: aggregateProjectQueues(projectQueueEntries),
    },
    freelancer: user.userType === 'freelancer'
      ? {
          totalEntries: freelancerQueuePublic.length,
          stats: summarizeStatuses(freelancerQueuePublic),
          nextActionAt: resolveNextAction(freelancerQueuePublic),
          entries: freelancerQueuePublic,
        }
      : null,
  };

  const projectsPlain = ownedProjects.map((project) => project.toPublicObject());
  const projectClassification = classifyProjects(projectsPlain);
  const projectStatus = projectStatusSummary.reduce((acc, row) => {
    const plain = row.get({ plain: true });
    acc[plain.status ?? 'unspecified'] = Number.parseInt(plain.count, 10) || 0;
    return acc;
  }, {});

  const overview = {
    user: decorateUser(user),
    focus: user.userType === 'freelancer' ? 'freelancer' : 'client',
    summary: {
      activeProjects: projectClassification.active,
      savedSearches: savedSearches.length,
      incomingAssignments: queueMetrics.freelancer?.stats?.pending ?? 0,
      autoAssignInFlight: queueMetrics.projects.stats.pending ?? 0,
      portfolioValue: sumBudget(projectsPlain),
    },
    projects: {
      items: projectsPlain,
      statusBreakdown: projectStatus,
      budgetTotal: sumBudget(projectsPlain),
    },
    queue: queueMetrics,
    savedSearches: {
      total: savedSearches.length,
      items: savedSearches.map((item) => item.toPublicObject()),
    },
    activity: {
      events: activityFeedRaw.map((event) => event.toPublicObject()),
    },
  };

  return overview;
}

export default {
  getDashboardOverview,
};
