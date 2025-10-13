import {
  sequelize,
  Project,
  SprintCycle,
  SprintTask,
  SprintTaskDependency,
  SprintTaskTimeEntry,
  SprintRisk,
  ChangeRequest,
  User,
  SPRINT_STATUSES,
  SPRINT_TASK_STATUSES,
  SPRINT_TASK_PRIORITIES,
  SPRINT_RISK_STATUSES,
  SPRINT_RISK_IMPACTS,
  CHANGE_REQUEST_STATUSES,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const STATUS_LABELS = {
  backlog: 'Backlog',
  ready: 'Ready',
  in_progress: 'In Progress',
  review: 'Review',
  blocked: 'Blocked',
  done: 'Done',
};

const STATUS_ORDER = [...SPRINT_TASK_STATUSES];

function isValidDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

async function ensureProject(projectId) {
  const project = await Project.findByPk(projectId);
  if (!project) {
    throw new NotFoundError('Project not found.');
  }
  return project;
}

function coerceDate(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return isValidDate(date) ? date : null;
}

function coerceNumber(value, { min = -Infinity, max = Infinity, precision } = {}) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  if (numeric < min || numeric > max) {
    return null;
  }
  if (typeof precision === 'number') {
    return Number(numeric.toFixed(precision));
  }
  return numeric;
}

function sanitizeMetadata(value) {
  if (!value || typeof value !== 'object') {
    return null;
  }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    return null;
  }
}

function summariseTime(entries = []) {
  const summary = entries.reduce(
    (acc, entry) => {
      const minutes = Number(entry.minutesSpent) || 0;
      const rate = Number(entry.hourlyRate) || 0;
      if (!minutes) {
        return acc;
      }
      acc.totalMinutes += minutes;
      if (entry.billable) {
        acc.billableMinutes += minutes;
        acc.billableAmount += (minutes / 60) * rate;
      } else {
        acc.nonBillableMinutes += minutes;
      }
      return acc;
    },
    { totalMinutes: 0, billableMinutes: 0, nonBillableMinutes: 0, billableAmount: 0 },
  );
  const toHours = (minutes) => Number((minutes / 60).toFixed(2));
  return {
    totalMinutes: summary.totalMinutes,
    billableMinutes: summary.billableMinutes,
    nonBillableMinutes: summary.nonBillableMinutes,
    totalHours: toHours(summary.totalMinutes),
    billableHours: toHours(summary.billableMinutes),
    nonBillableHours: toHours(summary.nonBillableMinutes),
    billableAmount: Number(summary.billableAmount.toFixed(2)),
  };
}

function mapDependency(instance) {
  return instance?.toPublicObject?.() ?? instance;
}

function mapTimeEntry(instance) {
  const entry = instance?.toPublicObject?.() ?? instance;
  return {
    ...entry,
    startedAt: entry.startedAt ?? null,
    endedAt: entry.endedAt ?? null,
  };
}

function mapTask(instance) {
  if (!instance) {
    return null;
  }
  const task = instance.toPublicObject?.() ?? instance.get?.({ plain: true }) ?? instance;
  const dependencies = Array.isArray(instance.dependencies)
    ? instance.dependencies.map(mapDependency)
    : [];
  const dependents = Array.isArray(instance.dependents)
    ? instance.dependents.map(mapDependency)
    : [];
  const timeEntries = Array.isArray(instance.timeEntries)
    ? instance.timeEntries.map(mapTimeEntry)
    : [];
  const summary = summariseTime(timeEntries);
  return {
    ...task,
    dependencies,
    dependents,
    timeEntries,
    timeSummary: summary,
  };
}

function mapRisk(instance) {
  if (!instance) {
    return null;
  }
  const risk = instance.toPublicObject?.() ?? instance.get?.({ plain: true }) ?? instance;
  if (instance.owner) {
    const owner = instance.owner.get?.({ plain: true }) ?? instance.owner;
    risk.owner = owner
      ? {
          id: owner.id,
          firstName: owner.firstName,
          lastName: owner.lastName,
        }
      : null;
  }
  if (instance.sprint) {
    const sprint = instance.sprint.toPublicObject?.() ?? instance.sprint.get?.({ plain: true }) ?? null;
    risk.sprint = sprint ? { id: sprint.id, name: sprint.name, status: sprint.status } : null;
  }
  if (instance.task) {
    const task = instance.task.toPublicObject?.() ?? instance.task.get?.({ plain: true }) ?? null;
    risk.task = task ? { id: task.id, title: task.title, status: task.status } : null;
  }
  return risk;
}

function mapChangeRequest(instance) {
  if (!instance) {
    return null;
  }
  const change = instance.toPublicObject?.() ?? instance.get?.({ plain: true }) ?? instance;
  if (instance.requestedBy) {
    const requestedBy = instance.requestedBy.get?.({ plain: true }) ?? instance.requestedBy;
    change.requestedBy = requestedBy
      ? {
          id: requestedBy.id,
          firstName: requestedBy.firstName,
          lastName: requestedBy.lastName,
        }
      : null;
  }
  if (instance.approvedBy) {
    const approvedBy = instance.approvedBy.get?.({ plain: true }) ?? instance.approvedBy;
    change.approvedBy = approvedBy
      ? {
          id: approvedBy.id,
          firstName: approvedBy.firstName,
          lastName: approvedBy.lastName,
        }
      : null;
  }
  if (instance.sprint) {
    const sprint = instance.sprint.toPublicObject?.() ?? instance.sprint.get?.({ plain: true }) ?? null;
    change.sprint = sprint ? { id: sprint.id, name: sprint.name, status: sprint.status } : null;
  }
  return change;
}

function buildKanban(tasks) {
  return STATUS_ORDER.map((status) => {
    const columnTasks = tasks.filter((task) => task.status === status);
    const points = columnTasks.reduce((sum, task) => sum + (Number(task.storyPoints) || 0), 0);
    return {
      status,
      label: STATUS_LABELS[status] ?? status,
      tasks: columnTasks,
      totalStoryPoints: Number(points.toFixed(2)),
    };
  });
}

function buildTimeline(tasks, sprint) {
  const timelineItems = tasks
    .map((task) => {
      const start = task.startedAt ? new Date(task.startedAt) : sprint?.startDate ? new Date(sprint.startDate) : null;
      const end = task.dueDate ? new Date(task.dueDate) : sprint?.endDate ? new Date(sprint.endDate) : null;
      if (!isValidDate(start) && !isValidDate(end)) {
        return null;
      }
      return {
        id: task.id,
        title: task.title,
        status: task.status,
        start: isValidDate(start) ? start.toISOString() : null,
        end: isValidDate(end) ? end.toISOString() : null,
        storyPoints: task.storyPoints,
        dependencies: task.dependencies?.map((dependency) => dependency.dependsOnTaskId) ?? [],
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const aTime = a.start ? new Date(a.start).getTime() : Number.POSITIVE_INFINITY;
      const bTime = b.start ? new Date(b.start).getTime() : Number.POSITIVE_INFINITY;
      if (aTime === bTime) {
        return a.id - b.id;
      }
      return aTime - bTime;
    });
  return timelineItems;
}

function truncateDate(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function dateKey(date) {
  return truncateDate(date).toISOString().slice(0, 10);
}

function buildBurndown(sprint, tasks) {
  if (!sprint?.startDate || !sprint?.endDate) {
    return null;
  }
  const start = coerceDate(sprint.startDate);
  const end = coerceDate(sprint.endDate);
  if (!isValidDate(start) || !isValidDate(end) || start > end) {
    return null;
  }

  const totalPointsRaw = tasks.reduce((sum, task) => sum + (Number(task.storyPoints) || 0), 0);
  const totalPointsRounded = Number(totalPointsRaw.toFixed(2));
  const totalPoints = totalPointsRounded > 0 ? totalPointsRounded : tasks.length;

  const completionMap = tasks.reduce((acc, task) => {
    if (!task.completedAt) {
      return acc;
    }
    const completionDate = coerceDate(task.completedAt);
    if (!isValidDate(completionDate)) {
      return acc;
    }
    const key = dateKey(completionDate);
    const points = Number(task.storyPoints) || (totalPointsRaw ? 0 : 1);
    acc[key] = (acc[key] || 0) + points;
    return acc;
  }, {});

  const results = [];
  let remaining = totalPoints;
  const days = Math.max(1, Math.round((truncateDate(end) - truncateDate(start)) / 86400000));
  const totalSlots = days + 1;
  for (let i = 0; i < totalSlots; i += 1) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    const key = dateKey(current);
    const completedToday = completionMap[key] || 0;
    remaining = Math.max(0, remaining - completedToday);
    const idealRemaining = Number((totalPoints - (totalPoints / (totalSlots - 1 || 1)) * i).toFixed(2));
    results.push({
      date: key,
      remainingPoints: Number(remaining.toFixed(2)),
      completedToday: Number(completedToday.toFixed(2)),
      idealRemaining: idealRemaining < 0 ? 0 : idealRemaining,
    });
  }
  return {
    totalPoints,
    usesStoryPoints: totalPointsRounded > 0,
    entries: results,
  };
}

function buildSprintSnapshot(instance) {
  const sprint = instance.toPublicObject?.() ?? instance.get?.({ plain: true }) ?? instance;
  const tasks = Array.isArray(instance.tasks) ? instance.tasks.map(mapTask) : [];
  const risks = Array.isArray(instance.risks) ? instance.risks.map(mapRisk) : [];
  const changeRequests = Array.isArray(instance.changeRequests)
    ? instance.changeRequests.map(mapChangeRequest)
    : [];
  const totalPointsRaw = tasks.reduce((sum, task) => sum + (Number(task.storyPoints) || 0), 0);
  const usesStoryPoints = totalPointsRaw > 0;
  const completedPoints = tasks
    .filter((task) => task.status === 'done')
    .reduce((sum, task) => {
      const numeric = Number(task.storyPoints);
      if (usesStoryPoints && Number.isFinite(numeric) && numeric > 0) {
        return sum + numeric;
      }
      if (!usesStoryPoints) {
        return sum + 1;
      }
      return sum;
    }, 0);
  const totalPoints = usesStoryPoints ? totalPointsRaw : tasks.length;
  const kanban = buildKanban(tasks);
  const timeline = buildTimeline(tasks, sprint);
  const burndown = buildBurndown(sprint, tasks);
  const timeSummary = summariseTime(tasks.flatMap((task) => task.timeEntries ?? []));

  return {
    ...sprint,
    metrics: {
      totalTasks: tasks.length,
      completedTasks: tasks.filter((task) => task.status === 'done').length,
      totalStoryPoints: usesStoryPoints ? Number(totalPointsRaw.toFixed(2)) : tasks.length,
      completedStoryPoints: usesStoryPoints
        ? Number(completedPoints.toFixed(2))
        : completedPoints,
      openRisks: risks.filter((risk) => risk.status === 'open' || risk.status === 'mitigating').length,
      pendingChangeRequests: changeRequests.filter((change) => change.status === 'pending_approval').length,
      timeSummary,
    },
    kanban,
    tasks,
    timeline,
    burndown,
    risks,
    changeRequests,
  };
}

export async function getProjectWorkManagement(projectId) {
  const project = await ensureProject(projectId);
  const [sprintInstances, backlogInstances, riskInstances, changeInstances] = await Promise.all([
    SprintCycle.findAll({
      where: { projectId },
      order: [
        ['startDate', 'ASC'],
        ['id', 'ASC'],
      ],
      include: [
        {
          model: SprintTask,
          as: 'tasks',
          include: [
            { model: SprintTaskDependency, as: 'dependencies' },
            { model: SprintTaskDependency, as: 'dependents' },
            { model: SprintTaskTimeEntry, as: 'timeEntries' },
          ],
        },
        { model: SprintRisk, as: 'risks', include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName'] }] },
        {
          model: ChangeRequest,
          as: 'changeRequests',
          include: [
            { model: User, as: 'requestedBy', attributes: ['id', 'firstName', 'lastName'] },
            { model: User, as: 'approvedBy', attributes: ['id', 'firstName', 'lastName'] },
          ],
        },
      ],
    }),
    SprintTask.findAll({
      where: { projectId, sprintId: null },
      order: [
        ['priority', 'DESC'],
        ['sequence', 'ASC'],
        ['id', 'ASC'],
      ],
      include: [
        { model: SprintTaskDependency, as: 'dependencies' },
        { model: SprintTaskDependency, as: 'dependents' },
        { model: SprintTaskTimeEntry, as: 'timeEntries' },
      ],
    }),
    SprintRisk.findAll({
      where: { projectId },
      order: [
        ['status', 'ASC'],
        ['id', 'ASC'],
      ],
      include: [
        { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName'] },
        { model: SprintCycle, as: 'sprint', attributes: ['id', 'name', 'status'] },
        { model: SprintTask, as: 'task', attributes: ['id', 'title', 'status'] },
      ],
    }),
    ChangeRequest.findAll({
      where: { projectId },
      order: [
        ['status', 'ASC'],
        ['createdAt', 'DESC'],
      ],
      include: [
        { model: SprintCycle, as: 'sprint', attributes: ['id', 'name', 'status'] },
        { model: User, as: 'requestedBy', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'approvedBy', attributes: ['id', 'firstName', 'lastName'] },
      ],
    }),
  ]);

  const sprints = sprintInstances.map(buildSprintSnapshot);
  const backlog = backlogInstances.map(mapTask);
  const backlogSummary = {
    totalTasks: backlog.length,
    readyForPlanning: backlog.filter((task) => task.status === 'ready').length,
    totalStoryPoints: Number(
      backlog.reduce((sum, task) => sum + (Number(task.storyPoints) || 0), 0).toFixed(2),
    ),
  };
  const risks = riskInstances.map(mapRisk);
  const changeRequests = changeInstances.map(mapChangeRequest);
  const summary = {
    totalSprints: sprints.length,
    activeSprints: sprints.filter((sprint) => sprint.status === 'active').length,
    openRisks: risks.filter((risk) => risk.status === 'open' || risk.status === 'mitigating').length,
    pendingApprovals: changeRequests.filter((change) => change.status === 'pending_approval').length,
    backlogReady: backlogSummary.readyForPlanning,
  };

  return {
    project: project.toPublicObject?.() ?? project.get({ plain: true }),
    summary,
    sprints,
    backlog,
    backlogSummary,
    risks,
    changeRequests,
  };
}

export async function createSprint(projectId, payload = {}, { actorId } = {}) {
  const project = await ensureProject(projectId);
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  if (!name) {
    throw new ValidationError('Sprint name is required.');
  }
  const status =
    typeof payload.status === 'string' && SPRINT_STATUSES.includes(payload.status.trim())
      ? payload.status.trim()
      : 'planning';
  const startDate = coerceDate(payload.startDate);
  const endDate = coerceDate(payload.endDate);
  if (startDate && endDate && startDate > endDate) {
    throw new ValidationError('Sprint end date must be after the start date.');
  }
  const velocityTarget = coerceNumber(payload.velocityTarget, { min: 0, max: 10000, precision: 2 });

  return sequelize.transaction(async (transaction) => {
    const sprint = await SprintCycle.create(
      {
        projectId: project.id,
        name,
        goal: payload.goal ?? null,
        status,
        startDate,
        endDate,
        velocityTarget,
        createdById: actorId ?? null,
        updatedById: actorId ?? null,
      },
      { transaction },
    );
    return buildSprintSnapshot(await sprint.reload({ transaction, include: [{ model: SprintTask, as: 'tasks' }] }));
  });
}

function normalizeTaskStatus(status) {
  if (typeof status !== 'string') {
    return 'backlog';
  }
  const trimmed = status.trim();
  return STATUS_ORDER.includes(trimmed) ? trimmed : 'backlog';
}

function normalizeTaskPriority(priority) {
  if (typeof priority !== 'string') {
    return 'medium';
  }
  const trimmed = priority.trim();
  return SPRINT_TASK_PRIORITIES.includes(trimmed) ? trimmed : 'medium';
}

export async function createSprintTask(projectId, payload = {}, { actorId } = {}) {
  const project = await ensureProject(projectId);
  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  if (!title) {
    throw new ValidationError('Task title is required.');
  }
  let sprintId = payload.sprintId || null;
  if (sprintId != null) {
    const sprint = await SprintCycle.findOne({ where: { id: sprintId, projectId: project.id } });
    if (!sprint) {
      throw new ValidationError('Sprint not found for this project.');
    }
    sprintId = sprint.id;
  }
  const storyPoints = coerceNumber(payload.storyPoints, { min: 0, max: 1000, precision: 2 });
  const dueDate = coerceDate(payload.dueDate);
  const startedAt = coerceDate(payload.startedAt);
  const completedAt = coerceDate(payload.completedAt);

  return sequelize.transaction(async (transaction) => {
    const task = await SprintTask.create(
      {
        projectId: project.id,
        sprintId,
        title,
        description: payload.description ?? null,
        status: normalizeTaskStatus(payload.status),
        type: payload.type ?? null,
        priority: normalizeTaskPriority(payload.priority),
        storyPoints,
        sequence: payload.sequence == null ? null : Number(payload.sequence) || null,
        assigneeId: payload.assigneeId ?? null,
        reporterId: payload.reporterId ?? actorId ?? null,
        dueDate,
        startedAt,
        completedAt,
        blockedReason: payload.blockedReason ?? null,
        metadata: sanitizeMetadata(payload.metadata),
      },
      { transaction },
    );

    if (Array.isArray(payload.dependencies)) {
      const pairs = payload.dependencies
        .map((dependencyId) => Number(dependencyId))
        .filter((dependencyId) => Number.isInteger(dependencyId) && dependencyId > 0 && dependencyId !== task.id);
      const unique = [...new Set(pairs)];
      if (unique.length) {
        const relatedTasks = await SprintTask.findAll({
          where: { id: unique, projectId: project.id },
          transaction,
        });
        const validIds = relatedTasks.map((related) => related.id);
        if (validIds.length) {
          await SprintTaskDependency.bulkCreate(
            validIds.map((dependsOnTaskId) => ({ taskId: task.id, dependsOnTaskId })),
            { transaction, ignoreDuplicates: true },
          );
        }
      }
    }

    const created = await SprintTask.findByPk(task.id, {
      include: [
        { model: SprintTaskDependency, as: 'dependencies' },
        { model: SprintTaskDependency, as: 'dependents' },
        { model: SprintTaskTimeEntry, as: 'timeEntries' },
      ],
      transaction,
    });
    return mapTask(created);
  });
}

export async function updateSprintTask(projectId, taskId, payload = {}, { actorId } = {}) {
  await ensureProject(projectId);
  const task = await SprintTask.findOne({ where: { id: taskId, projectId } });
  if (!task) {
    throw new NotFoundError('Task not found.');
  }
  const updates = {};
  if (payload.title !== undefined) {
    const title = typeof payload.title === 'string' ? payload.title.trim() : '';
    if (!title) {
      throw new ValidationError('Task title cannot be empty.');
    }
    updates.title = title;
  }
  if (payload.description !== undefined) updates.description = payload.description ?? null;
  if (payload.status !== undefined) {
    updates.status = normalizeTaskStatus(payload.status);
    if (updates.status === 'done' && !payload.completedAt && !task.completedAt) {
      updates.completedAt = new Date();
    }
    if (updates.status !== 'done' && payload.completedAt === null) {
      updates.completedAt = null;
    }
  }
  if (payload.priority !== undefined) updates.priority = normalizeTaskPriority(payload.priority);
  if (payload.type !== undefined) updates.type = payload.type ?? null;
  if (payload.storyPoints !== undefined) {
    const storyPoints = coerceNumber(payload.storyPoints, { min: 0, max: 1000, precision: 2 });
    if (storyPoints != null) {
      updates.storyPoints = storyPoints;
    } else if (payload.storyPoints === null) {
      updates.storyPoints = null;
    }
  }
  if (payload.sequence !== undefined) {
    updates.sequence = payload.sequence == null ? null : Number(payload.sequence) || null;
  }
  if (payload.assigneeId !== undefined) updates.assigneeId = payload.assigneeId ?? null;
  if (payload.reporterId !== undefined) updates.reporterId = payload.reporterId ?? task.reporterId ?? actorId ?? null;
  if (payload.sprintId !== undefined) {
    if (payload.sprintId === null) {
      updates.sprintId = null;
    } else {
      const sprint = await SprintCycle.findOne({ where: { id: payload.sprintId, projectId } });
      if (!sprint) {
        throw new ValidationError('Sprint not found for this project.');
      }
      updates.sprintId = sprint.id;
    }
  }
  if (payload.dueDate !== undefined) updates.dueDate = coerceDate(payload.dueDate);
  if (payload.startedAt !== undefined) updates.startedAt = coerceDate(payload.startedAt);
  if (payload.completedAt !== undefined) updates.completedAt = coerceDate(payload.completedAt);
  if (payload.blockedReason !== undefined) updates.blockedReason = payload.blockedReason ?? null;
  if (payload.metadata !== undefined) updates.metadata = sanitizeMetadata(payload.metadata);

  return sequelize.transaction(async (transaction) => {
    await task.update(updates, { transaction });
    if (payload.dependencies) {
      await SprintTaskDependency.destroy({ where: { taskId: task.id }, transaction });
      const pairs = payload.dependencies
        .map((dependencyId) => Number(dependencyId))
        .filter((dependencyId) => Number.isInteger(dependencyId) && dependencyId > 0 && dependencyId !== task.id);
      const unique = [...new Set(pairs)];
      if (unique.length) {
        const relatedTasks = await SprintTask.findAll({
          where: { id: unique, projectId },
          transaction,
        });
        const validIds = relatedTasks.map((related) => related.id);
        if (validIds.length) {
          await SprintTaskDependency.bulkCreate(
            validIds.map((dependsOnTaskId) => ({ taskId: task.id, dependsOnTaskId })),
            { transaction, ignoreDuplicates: true },
          );
        }
      }
    }
    const updated = await SprintTask.findByPk(task.id, {
      include: [
        { model: SprintTaskDependency, as: 'dependencies' },
        { model: SprintTaskDependency, as: 'dependents' },
        { model: SprintTaskTimeEntry, as: 'timeEntries' },
      ],
      transaction,
    });
    return mapTask(updated);
  });
}

export async function logTaskTime(projectId, taskId, payload = {}, { actorId } = {}) {
  await ensureProject(projectId);
  const task = await SprintTask.findOne({ where: { id: taskId, projectId } });
  if (!task) {
    throw new NotFoundError('Task not found.');
  }
  const userId = payload.userId ?? actorId;
  if (!userId) {
    throw new ValidationError('A userId is required to log time.');
  }
  let minutes = coerceNumber(payload.minutesSpent, { min: 1, max: 24 * 60 });
  const startedAt = coerceDate(payload.startedAt);
  const endedAt = coerceDate(payload.endedAt);
  if (!minutes && startedAt && endedAt) {
    const diff = Math.round((endedAt - startedAt) / 60000);
    if (diff > 0) {
      minutes = diff;
    }
  }
  if (!minutes) {
    throw new ValidationError('minutesSpent or a valid time range must be provided.');
  }
  const billable = Boolean(payload.billable);
  const hourlyRate = coerceNumber(payload.hourlyRate, { min: 0, max: 10000, precision: 2 });

  return sequelize.transaction(async (transaction) => {
    const entry = await SprintTaskTimeEntry.create(
      {
        taskId: task.id,
        userId,
        startedAt,
        endedAt,
        minutesSpent: minutes,
        billable,
        hourlyRate,
        notes: payload.notes ?? null,
        approvedAt: null,
      },
      { transaction },
    );
    const refreshed = await SprintTask.findByPk(task.id, {
      include: [
        { model: SprintTaskDependency, as: 'dependencies' },
        { model: SprintTaskDependency, as: 'dependents' },
        { model: SprintTaskTimeEntry, as: 'timeEntries' },
      ],
      transaction,
    });
    return {
      entry: mapTimeEntry(entry),
      task: mapTask(refreshed),
    };
  });
}

export async function createRisk(projectId, payload = {}, { actorId } = {}) {
  const project = await ensureProject(projectId);
  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  if (!title) {
    throw new ValidationError('Risk title is required.');
  }
  let sprintId = payload.sprintId ?? null;
  if (sprintId != null) {
    const sprint = await SprintCycle.findOne({ where: { id: sprintId, projectId: project.id } });
    if (!sprint) {
      throw new ValidationError('Sprint not found for this project.');
    }
    sprintId = sprint.id;
  }
  let taskId = payload.taskId ?? null;
  if (taskId != null) {
    const task = await SprintTask.findOne({ where: { id: taskId, projectId: project.id } });
    if (!task) {
      throw new ValidationError('Task not found for this project.');
    }
    taskId = task.id;
  }
  const probability = coerceNumber(payload.probability, { min: 0, max: 1, precision: 2 });
  const severityScore = coerceNumber(payload.severityScore, { min: 0, max: 100, precision: 2 });
  const status = typeof payload.status === 'string' ? payload.status.trim() : 'open';
  const impact = typeof payload.impact === 'string' ? payload.impact.trim() : 'medium';

  return sequelize.transaction(async (transaction) => {
    const risk = await SprintRisk.create(
      {
        projectId: project.id,
        sprintId,
        taskId,
        title,
        description: payload.description ?? null,
        probability,
        impact: SPRINT_RISK_IMPACTS.includes(impact) ? impact : 'medium',
        severityScore,
        mitigationPlan: payload.mitigationPlan ?? null,
        ownerId: payload.ownerId ?? actorId ?? null,
        status: SPRINT_RISK_STATUSES.includes(status) ? status : 'open',
        loggedAt: coerceDate(payload.loggedAt) ?? new Date(),
        reviewAt: coerceDate(payload.reviewAt),
        metadata: sanitizeMetadata(payload.metadata),
      },
      { transaction },
    );
    const created = await SprintRisk.findByPk(risk.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName'] },
        { model: SprintCycle, as: 'sprint', attributes: ['id', 'name', 'status'] },
        { model: SprintTask, as: 'task', attributes: ['id', 'title', 'status'] },
      ],
      transaction,
    });
    return mapRisk(created);
  });
}

export async function updateRisk(projectId, riskId, payload = {}, { actorId } = {}) {
  await ensureProject(projectId);
  const risk = await SprintRisk.findOne({ where: { id: riskId, projectId } });
  if (!risk) {
    throw new NotFoundError('Risk not found.');
  }
  const updates = {};
  if (payload.title !== undefined) {
    const title = typeof payload.title === 'string' ? payload.title.trim() : '';
    if (!title) {
      throw new ValidationError('Risk title cannot be empty.');
    }
    updates.title = title;
  }
  if (payload.description !== undefined) updates.description = payload.description ?? null;
  if (payload.probability !== undefined) {
    const probability = coerceNumber(payload.probability, { min: 0, max: 1, precision: 2 });
    updates.probability = probability;
  }
  if (payload.severityScore !== undefined) {
    const severityScore = coerceNumber(payload.severityScore, { min: 0, max: 100, precision: 2 });
    updates.severityScore = severityScore;
  }
  if (payload.impact !== undefined) {
    const impact = typeof payload.impact === 'string' ? payload.impact.trim() : 'medium';
    updates.impact = SPRINT_RISK_IMPACTS.includes(impact) ? impact : risk.impact;
  }
  if (payload.status !== undefined) {
    const status = typeof payload.status === 'string' ? payload.status.trim() : 'open';
    updates.status = SPRINT_RISK_STATUSES.includes(status) ? status : risk.status;
  }
  if (payload.mitigationPlan !== undefined) updates.mitigationPlan = payload.mitigationPlan ?? null;
  if (payload.ownerId !== undefined) updates.ownerId = payload.ownerId ?? actorId ?? null;
  if (payload.loggedAt !== undefined) updates.loggedAt = coerceDate(payload.loggedAt);
  if (payload.reviewAt !== undefined) updates.reviewAt = coerceDate(payload.reviewAt);
  if (payload.metadata !== undefined) updates.metadata = sanitizeMetadata(payload.metadata);
  if (payload.sprintId !== undefined) {
    if (payload.sprintId === null) {
      updates.sprintId = null;
    } else {
      const sprint = await SprintCycle.findOne({ where: { id: payload.sprintId, projectId } });
      if (!sprint) {
        throw new ValidationError('Sprint not found for this project.');
      }
      updates.sprintId = sprint.id;
    }
  }
  if (payload.taskId !== undefined) {
    if (payload.taskId === null) {
      updates.taskId = null;
    } else {
      const task = await SprintTask.findOne({ where: { id: payload.taskId, projectId } });
      if (!task) {
        throw new ValidationError('Task not found for this project.');
      }
      updates.taskId = task.id;
    }
  }

  await risk.update(updates);
  const updated = await SprintRisk.findByPk(risk.id, {
    include: [
      { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName'] },
      { model: SprintCycle, as: 'sprint', attributes: ['id', 'name', 'status'] },
      { model: SprintTask, as: 'task', attributes: ['id', 'title', 'status'] },
    ],
  });
  return mapRisk(updated);
}

export async function createChangeRequest(projectId, payload = {}, { actorId } = {}) {
  const project = await ensureProject(projectId);
  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  if (!title) {
    throw new ValidationError('Change request title is required.');
  }
  let sprintId = payload.sprintId ?? null;
  if (sprintId != null) {
    const sprint = await SprintCycle.findOne({ where: { id: sprintId, projectId: project.id } });
    if (!sprint) {
      throw new ValidationError('Sprint not found for this project.');
    }
    sprintId = sprint.id;
  }
  const status = typeof payload.status === 'string' ? payload.status.trim() : 'pending_approval';

  const change = await ChangeRequest.create({
    projectId: project.id,
    sprintId,
    title,
    description: payload.description ?? null,
    status: CHANGE_REQUEST_STATUSES.includes(status) ? status : 'pending_approval',
    requestedById: payload.requestedById ?? actorId ?? null,
    approvedById: null,
    approvedAt: null,
    approvalMetadata: sanitizeMetadata(payload.approvalMetadata),
    eSignDocumentUrl: payload.eSignDocumentUrl ?? null,
    eSignAuditTrail: sanitizeMetadata(payload.eSignAuditTrail),
    changeImpact: sanitizeMetadata(payload.changeImpact),
    decisionNotes: payload.decisionNotes ?? null,
  });

  const created = await ChangeRequest.findByPk(change.id, {
    include: [
      { model: SprintCycle, as: 'sprint', attributes: ['id', 'name', 'status'] },
      { model: User, as: 'requestedBy', attributes: ['id', 'firstName', 'lastName'] },
      { model: User, as: 'approvedBy', attributes: ['id', 'firstName', 'lastName'] },
    ],
  });
  return mapChangeRequest(created);
}

export async function approveChangeRequest(projectId, changeRequestId, payload = {}, { actorId } = {}) {
  await ensureProject(projectId);
  const changeRequest = await ChangeRequest.findOne({ where: { id: changeRequestId, projectId } });
  if (!changeRequest) {
    throw new NotFoundError('Change request not found.');
  }
  if (changeRequest.status === 'approved') {
    return mapChangeRequest(changeRequest);
  }
  const approverId = payload.approvedById ?? actorId;
  if (!approverId) {
    throw new ValidationError('approvedById is required to approve a change request.');
  }
  const status = typeof payload.status === 'string' ? payload.status.trim() : 'approved';
  const allowedStatus = ['approved', 'rejected'];
  const nextStatus = allowedStatus.includes(status) ? status : 'approved';

  const existingApprovalMetadata = sanitizeMetadata(changeRequest.approvalMetadata) ?? {};
  const incomingApprovalMetadata = sanitizeMetadata(payload.approvalMetadata) ?? {};
  const mergedApprovalMetadata =
    Object.keys(existingApprovalMetadata).length || Object.keys(incomingApprovalMetadata).length
      ? { ...existingApprovalMetadata, ...incomingApprovalMetadata }
      : null;
  const nextAuditTrail = sanitizeMetadata(payload.eSignAuditTrail) ?? changeRequest.eSignAuditTrail ?? null;

  await changeRequest.update({
    status: nextStatus,
    approvedById: approverId,
    approvedAt: new Date(),
    approvalMetadata: mergedApprovalMetadata,
    eSignDocumentUrl: payload.eSignDocumentUrl ?? changeRequest.eSignDocumentUrl,
    eSignAuditTrail: nextAuditTrail,
    decisionNotes: payload.decisionNotes ?? changeRequest.decisionNotes,
  });

  const updated = await ChangeRequest.findByPk(changeRequest.id, {
    include: [
      { model: SprintCycle, as: 'sprint', attributes: ['id', 'name', 'status'] },
      { model: User, as: 'requestedBy', attributes: ['id', 'firstName', 'lastName'] },
      { model: User, as: 'approvedBy', attributes: ['id', 'firstName', 'lastName'] },
    ],
  });
  return mapChangeRequest(updated);
}

export default {
  getProjectWorkManagement,
  createSprint,
  createSprintTask,
  updateSprintTask,
  logTaskTime,
  createRisk,
  updateRisk,
  createChangeRequest,
  approveChangeRequest,
};
