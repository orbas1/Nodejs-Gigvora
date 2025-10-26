import {
  sequelize,
  Project,
  ProjectWorkspaceTimeline,
  ProjectWorkspaceTask,
  ProjectWorkspaceTaskAssignment,
  ProjectWorkspaceBudgetLine,
  ProjectWorkspaceObject,
  ProjectWorkspaceTimelineEvent,
  ProjectWorkspaceMeeting,
  ProjectWorkspaceCalendarEntry,
  ProjectWorkspaceRole,
  ProjectWorkspaceSubmission,
  ProjectWorkspaceInvite,
  ProjectWorkspaceHrRecord,
  ProjectWorkspaceTimeLog,
  ProjectWorkspaceTarget,
  ProjectWorkspaceObjective,
  ProjectWorkspaceMessage,
  ProjectWorkspaceConversation,
  ProjectWorkspaceFile,
  ProjectWorkspaceBrief,
  WORKSPACE_MEETING_STATUSES,
} from '../models/index.js';
import {
  seedWorkspaceOperationsArtifacts,
  mapWorkspaceTaskWithAssignments,
  mapWorkspaceConversation,
  groupWorkspaceMessagesByConversation,
} from './workspaceOperationsShared.js';
import { initializeWorkspaceForProject } from './projectWorkspaceService.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

function normalizeText(value) {
  if (value == null) {
    return null;
  }
  const text = String(value).trim();
  return text.length === 0 ? null : text;
}

function requireText(value, fieldName) {
  const text = normalizeText(value);
  if (!text) {
    throw new ValidationError(`${fieldName} is required.`);
  }
  return text;
}

function parseDateValue(value, fieldName, { allowNull = true } = {}) {
  if (value == null || value === '') {
    if (allowNull) {
      return null;
    }
    throw new ValidationError(`${fieldName} must be a valid date.`);
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date.`);
  }
  return date;
}

function parseNumberValue(value, fieldName, { allowNull = true } = {}) {
  if (value == null || value === '') {
    if (allowNull) {
      return null;
    }
    throw new ValidationError(`${fieldName} is required.`);
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError(`${fieldName} must be numeric.`);
  }
  return numeric;
}

function parseIntegerValue(value, fieldName, { allowNull = true } = {}) {
  const numeric = parseNumberValue(value, fieldName, { allowNull });
  if (numeric == null) {
    return null;
  }
  if (!Number.isInteger(numeric)) {
    throw new ValidationError(`${fieldName} must be an integer.`);
  }
  return numeric;
}

function parsePercentValue(value, fieldName, { allowNull = true } = {}) {
  const numeric = parseNumberValue(value, fieldName, { allowNull });
  if (numeric == null) {
    return null;
  }
  if (numeric <= 0) {
    return 0;
  }
  if (numeric >= 100) {
    return 100;
  }
  return Number(numeric);
}

function normalizeArray(input) {
  if (input == null) {
    return [];
  }
  if (Array.isArray(input)) {
    return input
      .map((item) => normalizeText(item))
      .filter((value) => value != null);
  }
  if (typeof input === 'string') {
    return input
      .split(/\r?\n|,/)
      .map((value) => normalizeText(value))
      .filter((value) => value != null);
  }
  return [];
}

function normalizeEnumValue(value, allowedValues, fieldName) {
  if (value == null) {
    return null;
  }
  const normalized = normalizeText(value);
  if (!normalized || !allowedValues.includes(normalized)) {
    throw new ValidationError(`${fieldName} must be one of: ${allowedValues.join(', ')}.`);
  }
  return normalized;
}

function requireEnumValue(value, allowedValues, fieldName) {
  const normalized = normalizeEnumValue(value, allowedValues, fieldName);
  if (!normalized) {
    throw new ValidationError(`${fieldName} is required.`);
  }
  return normalized;
}

function parseBooleanValue(value, defaultValue = false) {
  if (value == null) {
    return defaultValue;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no', 'n', 'off'].includes(normalized)) {
    return false;
  }
  return defaultValue;
}

function computeDurationMinutes(startedAt, endedAt) {
  if (!startedAt || !endedAt) {
    return null;
  }
  const start = new Date(startedAt);
  const end = new Date(endedAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }
  const diff = Math.max(0, end.getTime() - start.getTime());
  return Math.round(diff / (1000 * 60));
}

async function touchWorkspace(workspace, { transaction, actorId } = {}) {
  await workspace.update({ lastActivityAt: new Date(), updatedById: actorId ?? null }, { transaction });
}

async function ensureWorkspace(projectId, { transaction, actorId } = {}) {
  if (!projectId) {
    throw new ValidationError('projectId is required.');
  }
  const project = await Project.findByPk(projectId, { transaction, lock: transaction?.LOCK?.UPDATE });
  if (!project) {
    throw new NotFoundError('Project not found.');
  }
  const workspace = await initializeWorkspaceForProject(project, { transaction, actorId });
  return { project, workspace };
}

export async function getProjectOperations(projectId) {
  const { project, workspace } = await ensureWorkspace(projectId);

  await sequelize.transaction(async (transaction) => {
    await seedWorkspaceOperationsArtifacts(workspace, { project, transaction });
  });

  await workspace.reload();

  const [timelineInstance, tasks, budgets, objects, timelineEvents, meetings, calendarEntries, roles, submissions, invites, hrRecords, timeLogs, targets, objectives, brief, files, conversations, messages] =
    await Promise.all([
      ProjectWorkspaceTimeline.findOne({ where: { workspaceId: workspace.id } }),
      ProjectWorkspaceTask.findAll({
        where: { workspaceId: workspace.id },
        include: [{ model: ProjectWorkspaceTaskAssignment, as: 'assignments' }],
        order: [
          ['startDate', 'ASC'],
          ['createdAt', 'ASC'],
        ],
      }),
      ProjectWorkspaceBudgetLine.findAll({ where: { workspaceId: workspace.id }, order: [['createdAt', 'ASC']] }),
      ProjectWorkspaceObject.findAll({ where: { workspaceId: workspace.id }, order: [['dueAt', 'ASC']] }),
      ProjectWorkspaceTimelineEvent.findAll({ where: { workspaceId: workspace.id }, order: [['eventDate', 'ASC']] }),
      ProjectWorkspaceMeeting.findAll({ where: { workspaceId: workspace.id }, order: [['startAt', 'ASC']] }),
      ProjectWorkspaceCalendarEntry.findAll({ where: { workspaceId: workspace.id }, order: [['startAt', 'ASC']] }),
      ProjectWorkspaceRole.findAll({ where: { workspaceId: workspace.id }, order: [['roleName', 'ASC']] }),
      ProjectWorkspaceSubmission.findAll({ where: { workspaceId: workspace.id }, order: [['submittedAt', 'DESC'], ['createdAt', 'DESC']] }),
      ProjectWorkspaceInvite.findAll({ where: { workspaceId: workspace.id }, order: [['invitedAt', 'DESC']] }),
      ProjectWorkspaceHrRecord.findAll({ where: { workspaceId: workspace.id }, order: [['memberName', 'ASC']] }),
      ProjectWorkspaceTimeLog.findAll({ where: { workspaceId: workspace.id }, order: [['startedAt', 'DESC']] }),
      ProjectWorkspaceTarget.findAll({ where: { workspaceId: workspace.id }, order: [['dueAt', 'ASC']] }),
      ProjectWorkspaceObjective.findAll({ where: { workspaceId: workspace.id }, order: [['dueAt', 'ASC']] }),
      ProjectWorkspaceBrief.findOne({ where: { workspaceId: workspace.id } }),
      ProjectWorkspaceFile.findAll({ where: { workspaceId: workspace.id }, order: [['updatedAt', 'DESC']] }),
      ProjectWorkspaceConversation.findAll({
        where: { workspaceId: workspace.id },
        order: [
          ['priority', 'DESC'],
          ['updatedAt', 'DESC'],
        ],
      }),
      ProjectWorkspaceMessage.findAll({
        where: { workspaceId: workspace.id },
        order: [
          ['conversationId', 'ASC'],
          ['postedAt', 'ASC'],
        ],
      }),
    ]);

  const messagesByConversationId = groupWorkspaceMessagesByConversation(messages);

  const tasksPayload = tasks.map((task) => mapWorkspaceTaskWithAssignments(task));
  const budgetsPayload = budgets.map((item) => item.toPublicObject());
  const objectsPayload = objects.map((item) => item.toPublicObject());
  const timelineEventsPayload = timelineEvents.map((item) => item.toPublicObject());
  const meetingsPayload = meetings.map((item) => item.toPublicObject());
  const calendarPayload = calendarEntries.map((item) => item.toPublicObject());
  const rolesPayload = roles.map((item) => item.toPublicObject());
  const submissionsPayload = submissions.map((item) => item.toPublicObject());
  const invitesPayload = invites.map((item) => item.toPublicObject());
  const hrPayload = hrRecords.map((item) => item.toPublicObject());
  const timeLogsPayload = timeLogs.map((item) => item.toPublicObject());
  const targetsPayload = targets.map((item) => item.toPublicObject());
  const objectivesPayload = objectives.map((item) => item.toPublicObject());
  const filesPayload = files.map((item) => item.toPublicObject());
  const conversationsPayload = conversations.map((conversation) =>
    mapWorkspaceConversation(conversation, messagesByConversationId),
  );

  const plannedBudgetCents = budgetsPayload.reduce((total, line) => total + (line.plannedAmountCents ?? 0), 0);
  const actualBudgetCents = budgetsPayload.reduce((total, line) => total + (line.actualAmountCents ?? 0), 0);
  const totalWorkloadHours = tasksPayload.reduce((total, task) => total + (task.workloadHours ?? 0), 0);
  const totalLoggedMinutes = timeLogsPayload.reduce((total, log) => total + (log.durationMinutes ?? 0), 0);
  const openTasks = tasksPayload.filter((task) => task.status !== 'completed').length;
  const upcomingMeetings = meetingsPayload.filter((meeting) => {
    const startAt = meeting.startAt ? new Date(meeting.startAt).getTime() : 0;
    return startAt > Date.now();
  }).length;
  const upcomingTimelineEvents = timelineEventsPayload.filter((event) => {
    const eventDate = event.eventDate ? new Date(event.eventDate).getTime() : 0;
    return eventDate > Date.now();
  }).length;

  const metrics = {
    plannedBudgetCents,
    actualBudgetCents,
    totalWorkloadHours,
    totalLoggedHours: totalLoggedMinutes / 60,
    openTasks,
    upcomingMeetings,
    upcomingTimelineEvents,
    activeTargets: targetsPayload.filter((target) => target.status !== 'completed').length,
  };

  return {
    project: project.toPublicObject(),
    workspace: workspace.toPublicObject(),
    timeline: timelineInstance ? timelineInstance.toPublicObject() : null,
    tasks: tasksPayload,
    budgets: budgetsPayload,
    objects: objectsPayload,
    timelineEvents: timelineEventsPayload,
    meetings: meetingsPayload,
    calendarEntries: calendarPayload,
    roles: rolesPayload,
    submissions: submissionsPayload,
    invites: invitesPayload,
    hrRecords: hrPayload,
    timeLogs: timeLogsPayload,
    targets: targetsPayload,
    objectives: objectivesPayload,
    conversations: conversationsPayload,
    files: filesPayload,
    brief: brief ? brief.toPublicObject() : null,
    metrics,
  };
}

export async function updateProjectOperations(projectId, payload = {}, { actorId } = {}) {
  await sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });

    let timeline = await ProjectWorkspaceTimeline.findOne({
      where: { workspaceId: workspace.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!timeline) {
      timeline = await ProjectWorkspaceTimeline.create(
        {
          workspaceId: workspace.id,
          name: 'Workspace timeline',
          timezone: 'UTC',
        },
        { transaction },
      );
    }

    if (payload.timeline) {
      const updates = {};
      if (payload.timeline.name !== undefined) {
        updates.name = requireText(payload.timeline.name, 'timeline.name');
      }
      if (payload.timeline.timezone !== undefined) {
        updates.timezone = requireText(payload.timeline.timezone, 'timeline.timezone');
      }
      if (payload.timeline.ownerName !== undefined) {
        updates.ownerName = normalizeText(payload.timeline.ownerName);
      }
      if (payload.timeline.startDate !== undefined) {
        updates.startDate = parseDateValue(payload.timeline.startDate, 'timeline.startDate');
      }
      if (payload.timeline.endDate !== undefined) {
        updates.endDate = parseDateValue(payload.timeline.endDate, 'timeline.endDate');
      }
      if (payload.timeline.baselineStartDate !== undefined) {
        updates.baselineStartDate = parseDateValue(payload.timeline.baselineStartDate, 'timeline.baselineStartDate');
      }
      if (payload.timeline.baselineEndDate !== undefined) {
        updates.baselineEndDate = parseDateValue(payload.timeline.baselineEndDate, 'timeline.baselineEndDate');
      }
      if (payload.timeline.metadata !== undefined) {
        updates.metadata = payload.timeline.metadata ?? null;
      }
      if (Object.keys(updates).length > 0) {
        await timeline.update(updates, { transaction });
      }
    }

    if (payload.workspace) {
      const updates = {};
      if (payload.workspace.status !== undefined) {
        updates.status = requireText(payload.workspace.status, 'workspace.status');
      }
      if (payload.workspace.progressPercent !== undefined) {
        updates.progressPercent = parsePercentValue(payload.workspace.progressPercent, 'workspace.progressPercent', {
          allowNull: false,
        });
      }
      if (payload.workspace.healthScore !== undefined) {
        updates.healthScore = parseNumberValue(payload.workspace.healthScore, 'workspace.healthScore');
      }
      if (payload.workspace.velocityScore !== undefined) {
        updates.velocityScore = parseNumberValue(payload.workspace.velocityScore, 'workspace.velocityScore');
      }
      if (payload.workspace.riskLevel !== undefined) {
        updates.riskLevel = requireText(payload.workspace.riskLevel, 'workspace.riskLevel');
      }
      if (payload.workspace.billingStatus !== undefined) {
        updates.billingStatus = normalizeText(payload.workspace.billingStatus);
      }
      if (payload.workspace.nextMilestone !== undefined) {
        updates.nextMilestone = normalizeText(payload.workspace.nextMilestone);
      }
      if (payload.workspace.nextMilestoneDueAt !== undefined) {
        updates.nextMilestoneDueAt = parseDateValue(payload.workspace.nextMilestoneDueAt, 'workspace.nextMilestoneDueAt');
      }
      if (payload.workspace.metricsSnapshot !== undefined) {
        updates.metricsSnapshot = payload.workspace.metricsSnapshot ?? null;
      }
      if (Object.keys(updates).length > 0) {
        await workspace.update(updates, { transaction });
      }
    }

    await touchWorkspace(workspace, { transaction, actorId });
  });

  return getProjectOperations(projectId);
}

export async function addProjectTask(projectId, payload = {}, { actorId } = {}) {
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const task = await ProjectWorkspaceTask.create(
      {
        workspaceId: workspace.id,
        title: requireText(payload.title, 'title'),
        description: normalizeText(payload.description),
        ownerName: normalizeText(payload.ownerName) ?? 'Unassigned',
        ownerType: normalizeText(payload.ownerType) ?? 'workspace_member',
        startDate: parseDateValue(payload.startDate, 'startDate'),
        endDate: parseDateValue(payload.endDate, 'endDate'),
        status: normalizeText(payload.status) ?? 'planned',
        lane: normalizeText(payload.lane) ?? 'Delivery',
        progressPercent: parsePercentValue(payload.progressPercent ?? 0, 'progressPercent'),
        workloadHours: parseNumberValue(payload.workloadHours ?? null, 'workloadHours'),
        color: normalizeText(payload.color) ?? '#6366f1',
        priority: normalizeText(payload.priority) ?? 'normal',
        dependencies: Array.isArray(payload.dependencies) ? payload.dependencies : [],
        metadata: payload.metadata ?? null,
      },
      { transaction },
    );

    if (Array.isArray(payload.assignments) && payload.assignments.length > 0) {
      const assignments = payload.assignments.map((assignment) => ({
        workspaceId: workspace.id,
        taskId: task.id,
        assigneeName: requireText(assignment.assigneeName ?? 'Unassigned', 'assignment.assigneeName'),
        assigneeRole: normalizeText(assignment.assigneeRole),
        allocationPercent: parsePercentValue(assignment.allocationPercent ?? null, 'assignment.allocationPercent'),
        hoursCommitted: parseNumberValue(assignment.hoursCommitted ?? null, 'assignment.hoursCommitted'),
        status: normalizeText(assignment.status) ?? 'active',
        notes: normalizeText(assignment.notes),
      }));
      await ProjectWorkspaceTaskAssignment.bulkCreate(assignments, { transaction });
    }

    await touchWorkspace(workspace, { transaction, actorId });

    const taskWithAssignments = await ProjectWorkspaceTask.findByPk(task.id, {
      include: [{ model: ProjectWorkspaceTaskAssignment, as: 'assignments' }],
      transaction,
    });

    return mapWorkspaceTaskWithAssignments(taskWithAssignments);
  });
}

export async function updateProjectTask(projectId, taskId, payload = {}, { actorId } = {}) {
  if (!taskId) {
    throw new ValidationError('taskId is required.');
  }

  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const task = await ProjectWorkspaceTask.findOne({
      where: { id: taskId, workspaceId: workspace.id },
      include: [{ model: ProjectWorkspaceTaskAssignment, as: 'assignments' }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!task) {
      throw new NotFoundError('Task not found.');
    }

    const updates = {};
    if (payload.title !== undefined) {
      updates.title = requireText(payload.title, 'title');
    }
    if (payload.description !== undefined) {
      updates.description = normalizeText(payload.description);
    }
    if (payload.ownerName !== undefined) {
      updates.ownerName = normalizeText(payload.ownerName);
    }
    if (payload.ownerType !== undefined) {
      updates.ownerType = normalizeText(payload.ownerType);
    }
    if (payload.startDate !== undefined) {
      updates.startDate = parseDateValue(payload.startDate, 'startDate');
    }
    if (payload.endDate !== undefined) {
      updates.endDate = parseDateValue(payload.endDate, 'endDate');
    }
    if (payload.status !== undefined) {
      updates.status = requireText(payload.status, 'status');
    }
    if (payload.lane !== undefined) {
      updates.lane = normalizeText(payload.lane);
    }
    if (payload.progressPercent !== undefined) {
      updates.progressPercent = parsePercentValue(payload.progressPercent, 'progressPercent');
    }
    if (payload.workloadHours !== undefined) {
      updates.workloadHours = parseNumberValue(payload.workloadHours, 'workloadHours');
    }
    if (payload.color !== undefined) {
      updates.color = normalizeText(payload.color);
    }
    if (payload.priority !== undefined) {
      updates.priority = normalizeText(payload.priority);
    }
    if (payload.dependencies !== undefined) {
      updates.dependencies = Array.isArray(payload.dependencies) ? payload.dependencies : [];
    }
    if (payload.metadata !== undefined) {
      updates.metadata = payload.metadata ?? null;
    }

    if (Object.keys(updates).length > 0) {
      await task.update(updates, { transaction });
    }

    if (Array.isArray(payload.assignments)) {
      await ProjectWorkspaceTaskAssignment.destroy({ where: { taskId: task.id }, transaction });
      if (payload.assignments.length > 0) {
        const assignments = payload.assignments.map((assignment) => ({
          workspaceId: workspace.id,
          taskId: task.id,
          assigneeName: requireText(assignment.assigneeName ?? 'Unassigned', 'assignment.assigneeName'),
          assigneeRole: normalizeText(assignment.assigneeRole),
          allocationPercent: parsePercentValue(assignment.allocationPercent ?? null, 'assignment.allocationPercent'),
          hoursCommitted: parseNumberValue(assignment.hoursCommitted ?? null, 'assignment.hoursCommitted'),
          status: normalizeText(assignment.status) ?? 'active',
          notes: normalizeText(assignment.notes),
        }));
        await ProjectWorkspaceTaskAssignment.bulkCreate(assignments, { transaction });
      }
    }

    await touchWorkspace(workspace, { transaction, actorId });

    const refreshed = await ProjectWorkspaceTask.findByPk(task.id, {
      include: [{ model: ProjectWorkspaceTaskAssignment, as: 'assignments' }],
      transaction,
    });

    return mapWorkspaceTaskWithAssignments(refreshed);
  });
}

export async function removeProjectTask(projectId, taskId, { actorId } = {}) {
  if (!taskId) {
    throw new ValidationError('taskId is required.');
  }

  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const task = await ProjectWorkspaceTask.findOne({ where: { id: taskId, workspaceId: workspace.id }, transaction });
    if (!task) {
      throw new NotFoundError('Task not found.');
    }
    await ProjectWorkspaceTaskAssignment.destroy({ where: { taskId }, transaction });
    await task.destroy({ transaction });
    await touchWorkspace(workspace, { transaction, actorId });
    return { success: true };
  });
}

export async function createProjectBudget(projectId, payload = {}, { actorId } = {}) {
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const budget = await ProjectWorkspaceBudgetLine.create(
      {
        workspaceId: workspace.id,
        category: requireText(payload.category, 'category'),
        description: normalizeText(payload.description),
        plannedAmountCents: parseIntegerValue(payload.plannedAmountCents, 'plannedAmountCents', { allowNull: false }),
        actualAmountCents: parseIntegerValue(payload.actualAmountCents ?? null, 'actualAmountCents'),
        currency: normalizeText(payload.currency)?.toUpperCase() ?? 'USD',
        status: normalizeText(payload.status) ?? 'planned',
        ownerName: normalizeText(payload.ownerName),
        approvalsRequired: parseIntegerValue(payload.approvalsRequired ?? null, 'approvalsRequired'),
        notes: normalizeText(payload.notes),
      },
      { transaction },
    );

    await touchWorkspace(workspace, { transaction, actorId });
    return budget.toPublicObject();
  });
}

export async function updateProjectBudget(projectId, budgetId, payload = {}, { actorId } = {}) {
  if (!budgetId) {
    throw new ValidationError('budgetId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const budget = await ProjectWorkspaceBudgetLine.findOne({
      where: { id: budgetId, workspaceId: workspace.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!budget) {
      throw new NotFoundError('Budget line not found.');
    }

    const updates = {};
    if (payload.category !== undefined) {
      updates.category = requireText(payload.category, 'category');
    }
    if (payload.description !== undefined) {
      updates.description = normalizeText(payload.description);
    }
    if (payload.plannedAmountCents !== undefined) {
      updates.plannedAmountCents = parseIntegerValue(payload.plannedAmountCents, 'plannedAmountCents', {
        allowNull: false,
      });
    }
    if (payload.actualAmountCents !== undefined) {
      updates.actualAmountCents = parseIntegerValue(payload.actualAmountCents, 'actualAmountCents');
    }
    if (payload.currency !== undefined) {
      updates.currency = requireText(payload.currency, 'currency').toUpperCase();
    }
    if (payload.status !== undefined) {
      updates.status = requireText(payload.status, 'status');
    }
    if (payload.ownerName !== undefined) {
      updates.ownerName = normalizeText(payload.ownerName);
    }
    if (payload.approvalsRequired !== undefined) {
      updates.approvalsRequired = parseIntegerValue(payload.approvalsRequired, 'approvalsRequired');
    }
    if (payload.notes !== undefined) {
      updates.notes = normalizeText(payload.notes);
    }

    if (Object.keys(updates).length > 0) {
      await budget.update(updates, { transaction });
    }

    await touchWorkspace(workspace, { transaction, actorId });
    return budget.toPublicObject();
  });
}

export async function deleteProjectBudget(projectId, budgetId, { actorId } = {}) {
  if (!budgetId) {
    throw new ValidationError('budgetId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const budget = await ProjectWorkspaceBudgetLine.findOne({ where: { id: budgetId, workspaceId: workspace.id }, transaction });
    if (!budget) {
      throw new NotFoundError('Budget line not found.');
    }
    await budget.destroy({ transaction });
    await touchWorkspace(workspace, { transaction, actorId });
    return { success: true };
  });
}

export async function createProjectObject(projectId, payload = {}, { actorId } = {}) {
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const object = await ProjectWorkspaceObject.create(
      {
        workspaceId: workspace.id,
        name: requireText(payload.name, 'name'),
        type: normalizeText(payload.type) ?? 'artifact',
        status: normalizeText(payload.status) ?? 'draft',
        ownerName: normalizeText(payload.ownerName),
        summary: normalizeText(payload.summary),
        dueAt: parseDateValue(payload.dueAt, 'dueAt'),
        tags: normalizeArray(payload.tags),
        metadata: payload.metadata ?? null,
      },
      { transaction },
    );
    await touchWorkspace(workspace, { transaction, actorId });
    return object.toPublicObject();
  });
}

export async function updateProjectObject(projectId, objectId, payload = {}, { actorId } = {}) {
  if (!objectId) {
    throw new ValidationError('objectId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const object = await ProjectWorkspaceObject.findOne({
      where: { id: objectId, workspaceId: workspace.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!object) {
      throw new NotFoundError('Workspace object not found.');
    }

    const updates = {};
    if (payload.name !== undefined) {
      updates.name = requireText(payload.name, 'name');
    }
    if (payload.type !== undefined) {
      updates.type = requireText(payload.type, 'type');
    }
    if (payload.status !== undefined) {
      updates.status = requireText(payload.status, 'status');
    }
    if (payload.ownerName !== undefined) {
      updates.ownerName = normalizeText(payload.ownerName);
    }
    if (payload.summary !== undefined) {
      updates.summary = normalizeText(payload.summary);
    }
    if (payload.dueAt !== undefined) {
      updates.dueAt = parseDateValue(payload.dueAt, 'dueAt');
    }
    if (payload.tags !== undefined) {
      updates.tags = normalizeArray(payload.tags);
    }
    if (payload.metadata !== undefined) {
      updates.metadata = payload.metadata ?? null;
    }

    if (Object.keys(updates).length > 0) {
      await object.update(updates, { transaction });
    }

    await touchWorkspace(workspace, { transaction, actorId });
    return object.toPublicObject();
  });
}

export async function deleteProjectObject(projectId, objectId, { actorId } = {}) {
  if (!objectId) {
    throw new ValidationError('objectId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const object = await ProjectWorkspaceObject.findOne({ where: { id: objectId, workspaceId: workspace.id }, transaction });
    if (!object) {
      throw new NotFoundError('Workspace object not found.');
    }
    await object.destroy({ transaction });
    await touchWorkspace(workspace, { transaction, actorId });
    return { success: true };
  });
}

export async function createProjectTimelineEvent(projectId, payload = {}, { actorId } = {}) {
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const event = await ProjectWorkspaceTimelineEvent.create(
      {
        workspaceId: workspace.id,
        title: requireText(payload.title, 'title'),
        description: normalizeText(payload.description),
        eventDate: parseDateValue(payload.eventDate, 'eventDate', { allowNull: false }),
        eventType: normalizeText(payload.eventType) ?? 'milestone',
        ownerName: normalizeText(payload.ownerName),
        milestone: parseBooleanValue(payload.milestone, false),
        color: normalizeText(payload.color),
        metadata: payload.metadata ?? null,
      },
      { transaction },
    );
    await touchWorkspace(workspace, { transaction, actorId });
    return event.toPublicObject();
  });
}

export async function updateProjectTimelineEvent(projectId, eventId, payload = {}, { actorId } = {}) {
  if (!eventId) {
    throw new ValidationError('eventId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const event = await ProjectWorkspaceTimelineEvent.findOne({
      where: { id: eventId, workspaceId: workspace.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!event) {
      throw new NotFoundError('Timeline event not found.');
    }

    const updates = {};
    if (payload.title !== undefined) {
      updates.title = requireText(payload.title, 'title');
    }
    if (payload.description !== undefined) {
      updates.description = normalizeText(payload.description);
    }
    if (payload.eventDate !== undefined) {
      updates.eventDate = parseDateValue(payload.eventDate, 'eventDate', { allowNull: false });
    }
    if (payload.eventType !== undefined) {
      updates.eventType = requireText(payload.eventType, 'eventType');
    }
    if (payload.ownerName !== undefined) {
      updates.ownerName = normalizeText(payload.ownerName);
    }
    if (payload.milestone !== undefined) {
      updates.milestone = parseBooleanValue(payload.milestone, false);
    }
    if (payload.color !== undefined) {
      updates.color = normalizeText(payload.color);
    }
    if (payload.metadata !== undefined) {
      updates.metadata = payload.metadata ?? null;
    }

    if (Object.keys(updates).length > 0) {
      await event.update(updates, { transaction });
    }

    await touchWorkspace(workspace, { transaction, actorId });
    return event.toPublicObject();
  });
}

export async function deleteProjectTimelineEvent(projectId, eventId, { actorId } = {}) {
  if (!eventId) {
    throw new ValidationError('eventId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const event = await ProjectWorkspaceTimelineEvent.findOne({ where: { id: eventId, workspaceId: workspace.id }, transaction });
    if (!event) {
      throw new NotFoundError('Timeline event not found.');
    }
    await event.destroy({ transaction });
    await touchWorkspace(workspace, { transaction, actorId });
    return { success: true };
  });
}

export async function createProjectMeeting(projectId, payload = {}, { actorId } = {}) {
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const status = normalizeEnumValue(payload.status, WORKSPACE_MEETING_STATUSES, 'status');
    const meeting = await ProjectWorkspaceMeeting.create(
      {
        workspaceId: workspace.id,
        title: requireText(payload.title, 'title'),
        agenda: normalizeText(payload.agenda),
        location: normalizeText(payload.location),
        startAt: parseDateValue(payload.startAt, 'startAt', { allowNull: false }),
        endAt: parseDateValue(payload.endAt, 'endAt'),
        hostName: normalizeText(payload.hostName),
        attendees: normalizeArray(payload.attendees),
        meetingUrl: normalizeText(payload.meetingUrl),
        recordingUrl: normalizeText(payload.recordingUrl),
        notes: normalizeText(payload.notes),
        ...(status ? { status } : {}),
      },
      { transaction },
    );
    await touchWorkspace(workspace, { transaction, actorId });
    return meeting.toPublicObject();
  });
}

export async function updateProjectMeeting(projectId, meetingId, payload = {}, { actorId } = {}) {
  if (!meetingId) {
    throw new ValidationError('meetingId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const meeting = await ProjectWorkspaceMeeting.findOne({
      where: { id: meetingId, workspaceId: workspace.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!meeting) {
      throw new NotFoundError('Meeting not found.');
    }

    const updates = {};
    if (payload.title !== undefined) {
      updates.title = requireText(payload.title, 'title');
    }
    if (payload.agenda !== undefined) {
      updates.agenda = normalizeText(payload.agenda);
    }
    if (payload.location !== undefined) {
      updates.location = normalizeText(payload.location);
    }
    if (payload.startAt !== undefined) {
      updates.startAt = parseDateValue(payload.startAt, 'startAt', { allowNull: false });
    }
    if (payload.endAt !== undefined) {
      updates.endAt = parseDateValue(payload.endAt, 'endAt');
    }
    if (payload.hostName !== undefined) {
      updates.hostName = normalizeText(payload.hostName);
    }
    if (payload.attendees !== undefined) {
      updates.attendees = normalizeArray(payload.attendees);
    }
    if (payload.meetingUrl !== undefined) {
      updates.meetingUrl = normalizeText(payload.meetingUrl);
    }
    if (payload.recordingUrl !== undefined) {
      updates.recordingUrl = normalizeText(payload.recordingUrl);
    }
    if (payload.notes !== undefined) {
      updates.notes = normalizeText(payload.notes);
    }
    if (payload.status !== undefined) {
      updates.status = requireEnumValue(payload.status, WORKSPACE_MEETING_STATUSES, 'status');
    }

    if (Object.keys(updates).length > 0) {
      await meeting.update(updates, { transaction });
    }

    await touchWorkspace(workspace, { transaction, actorId });
    return meeting.toPublicObject();
  });
}

export async function deleteProjectMeeting(projectId, meetingId, { actorId } = {}) {
  if (!meetingId) {
    throw new ValidationError('meetingId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const meeting = await ProjectWorkspaceMeeting.findOne({ where: { id: meetingId, workspaceId: workspace.id }, transaction });
    if (!meeting) {
      throw new NotFoundError('Meeting not found.');
    }
    await meeting.destroy({ transaction });
    await touchWorkspace(workspace, { transaction, actorId });
    return { success: true };
  });
}

export async function createProjectCalendarEntry(projectId, payload = {}, { actorId } = {}) {
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const entry = await ProjectWorkspaceCalendarEntry.create(
      {
        workspaceId: workspace.id,
        title: requireText(payload.title, 'title'),
        startAt: parseDateValue(payload.startAt, 'startAt', { allowNull: false }),
        endAt: parseDateValue(payload.endAt, 'endAt'),
        eventType: normalizeText(payload.eventType) ?? 'event',
        ownerName: normalizeText(payload.ownerName),
        visibility: normalizeText(payload.visibility) ?? 'workspace',
        metadata: payload.metadata ?? null,
      },
      { transaction },
    );
    await touchWorkspace(workspace, { transaction, actorId });
    return entry.toPublicObject();
  });
}

export async function updateProjectCalendarEntry(projectId, entryId, payload = {}, { actorId } = {}) {
  if (!entryId) {
    throw new ValidationError('entryId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const entry = await ProjectWorkspaceCalendarEntry.findOne({
      where: { id: entryId, workspaceId: workspace.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!entry) {
      throw new NotFoundError('Calendar entry not found.');
    }

    const updates = {};
    if (payload.title !== undefined) {
      updates.title = requireText(payload.title, 'title');
    }
    if (payload.startAt !== undefined) {
      updates.startAt = parseDateValue(payload.startAt, 'startAt', { allowNull: false });
    }
    if (payload.endAt !== undefined) {
      updates.endAt = parseDateValue(payload.endAt, 'endAt');
    }
    if (payload.eventType !== undefined) {
      updates.eventType = requireText(payload.eventType, 'eventType');
    }
    if (payload.ownerName !== undefined) {
      updates.ownerName = normalizeText(payload.ownerName);
    }
    if (payload.visibility !== undefined) {
      updates.visibility = requireText(payload.visibility, 'visibility');
    }
    if (payload.metadata !== undefined) {
      updates.metadata = payload.metadata ?? null;
    }

    if (Object.keys(updates).length > 0) {
      await entry.update(updates, { transaction });
    }

    await touchWorkspace(workspace, { transaction, actorId });
    return entry.toPublicObject();
  });
}

export async function deleteProjectCalendarEntry(projectId, entryId, { actorId } = {}) {
  if (!entryId) {
    throw new ValidationError('entryId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const entry = await ProjectWorkspaceCalendarEntry.findOne({ where: { id: entryId, workspaceId: workspace.id }, transaction });
    if (!entry) {
      throw new NotFoundError('Calendar entry not found.');
    }
    await entry.destroy({ transaction });
    await touchWorkspace(workspace, { transaction, actorId });
    return { success: true };
  });
}

export async function createProjectRole(projectId, payload = {}, { actorId } = {}) {
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const role = await ProjectWorkspaceRole.create(
      {
        workspaceId: workspace.id,
        roleName: requireText(payload.roleName, 'roleName'),
        memberName: requireText(payload.memberName, 'memberName'),
        responsibilities: normalizeText(payload.responsibilities),
        permissions: normalizeArray(payload.permissions),
        contactEmail: normalizeText(payload.contactEmail),
        contactPhone: normalizeText(payload.contactPhone),
        avatarUrl: normalizeText(payload.avatarUrl),
      },
      { transaction },
    );
    await touchWorkspace(workspace, { transaction, actorId });
    return role.toPublicObject();
  });
}

export async function updateProjectRole(projectId, roleId, payload = {}, { actorId } = {}) {
  if (!roleId) {
    throw new ValidationError('roleId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const role = await ProjectWorkspaceRole.findOne({
      where: { id: roleId, workspaceId: workspace.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!role) {
      throw new NotFoundError('Role not found.');
    }

    const updates = {};
    if (payload.roleName !== undefined) {
      updates.roleName = requireText(payload.roleName, 'roleName');
    }
    if (payload.memberName !== undefined) {
      updates.memberName = requireText(payload.memberName, 'memberName');
    }
    if (payload.responsibilities !== undefined) {
      updates.responsibilities = normalizeText(payload.responsibilities);
    }
    if (payload.permissions !== undefined) {
      updates.permissions = normalizeArray(payload.permissions);
    }
    if (payload.contactEmail !== undefined) {
      updates.contactEmail = normalizeText(payload.contactEmail);
    }
    if (payload.contactPhone !== undefined) {
      updates.contactPhone = normalizeText(payload.contactPhone);
    }
    if (payload.avatarUrl !== undefined) {
      updates.avatarUrl = normalizeText(payload.avatarUrl);
    }

    if (Object.keys(updates).length > 0) {
      await role.update(updates, { transaction });
    }

    await touchWorkspace(workspace, { transaction, actorId });
    return role.toPublicObject();
  });
}

export async function deleteProjectRole(projectId, roleId, { actorId } = {}) {
  if (!roleId) {
    throw new ValidationError('roleId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const role = await ProjectWorkspaceRole.findOne({ where: { id: roleId, workspaceId: workspace.id }, transaction });
    if (!role) {
      throw new NotFoundError('Role not found.');
    }
    await role.destroy({ transaction });
    await touchWorkspace(workspace, { transaction, actorId });
    return { success: true };
  });
}

export async function createProjectSubmission(projectId, payload = {}, { actorId } = {}) {
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const submission = await ProjectWorkspaceSubmission.create(
      {
        workspaceId: workspace.id,
        title: requireText(payload.title, 'title'),
        description: normalizeText(payload.description),
        status: normalizeText(payload.status) ?? 'draft',
        submittedAt: parseDateValue(payload.submittedAt, 'submittedAt'),
        reviewerName: normalizeText(payload.reviewerName),
        decisionAt: parseDateValue(payload.decisionAt, 'decisionAt'),
        decisionNotes: normalizeText(payload.decisionNotes),
        attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
        ownerName: normalizeText(payload.ownerName),
      },
      { transaction },
    );
    await touchWorkspace(workspace, { transaction, actorId });
    return submission.toPublicObject();
  });
}

export async function updateProjectSubmission(projectId, submissionId, payload = {}, { actorId } = {}) {
  if (!submissionId) {
    throw new ValidationError('submissionId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const submission = await ProjectWorkspaceSubmission.findOne({
      where: { id: submissionId, workspaceId: workspace.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!submission) {
      throw new NotFoundError('Submission not found.');
    }

    const updates = {};
    if (payload.title !== undefined) {
      updates.title = requireText(payload.title, 'title');
    }
    if (payload.description !== undefined) {
      updates.description = normalizeText(payload.description);
    }
    if (payload.status !== undefined) {
      updates.status = requireText(payload.status, 'status');
    }
    if (payload.submittedAt !== undefined) {
      updates.submittedAt = parseDateValue(payload.submittedAt, 'submittedAt');
    }
    if (payload.reviewerName !== undefined) {
      updates.reviewerName = normalizeText(payload.reviewerName);
    }
    if (payload.decisionAt !== undefined) {
      updates.decisionAt = parseDateValue(payload.decisionAt, 'decisionAt');
    }
    if (payload.decisionNotes !== undefined) {
      updates.decisionNotes = normalizeText(payload.decisionNotes);
    }
    if (payload.attachments !== undefined) {
      updates.attachments = Array.isArray(payload.attachments) ? payload.attachments : [];
    }
    if (payload.ownerName !== undefined) {
      updates.ownerName = normalizeText(payload.ownerName);
    }

    if (Object.keys(updates).length > 0) {
      await submission.update(updates, { transaction });
    }

    await touchWorkspace(workspace, { transaction, actorId });
    return submission.toPublicObject();
  });
}

export async function deleteProjectSubmission(projectId, submissionId, { actorId } = {}) {
  if (!submissionId) {
    throw new ValidationError('submissionId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const submission = await ProjectWorkspaceSubmission.findOne({
      where: { id: submissionId, workspaceId: workspace.id },
      transaction,
    });
    if (!submission) {
      throw new NotFoundError('Submission not found.');
    }
    await submission.destroy({ transaction });
    await touchWorkspace(workspace, { transaction, actorId });
    return { success: true };
  });
}

export async function createProjectInvite(projectId, payload = {}, { actorId } = {}) {
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const invite = await ProjectWorkspaceInvite.create(
      {
        workspaceId: workspace.id,
        email: requireText(payload.email, 'email'),
        roleName: requireText(payload.roleName, 'roleName'),
        status: normalizeText(payload.status) ?? 'pending',
        invitedBy: normalizeText(payload.invitedBy),
        invitedAt: parseDateValue(payload.invitedAt, 'invitedAt') ?? new Date(),
        expiresAt: parseDateValue(payload.expiresAt, 'expiresAt'),
        acceptedAt: parseDateValue(payload.acceptedAt, 'acceptedAt'),
        token: normalizeText(payload.token),
        metadata: payload.metadata ?? null,
      },
      { transaction },
    );
    await touchWorkspace(workspace, { transaction, actorId });
    return invite.toPublicObject();
  });
}

export async function updateProjectInvite(projectId, inviteId, payload = {}, { actorId } = {}) {
  if (!inviteId) {
    throw new ValidationError('inviteId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const invite = await ProjectWorkspaceInvite.findOne({
      where: { id: inviteId, workspaceId: workspace.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!invite) {
      throw new NotFoundError('Invite not found.');
    }

    const updates = {};
    if (payload.email !== undefined) {
      updates.email = requireText(payload.email, 'email');
    }
    if (payload.roleName !== undefined) {
      updates.roleName = requireText(payload.roleName, 'roleName');
    }
    if (payload.status !== undefined) {
      updates.status = requireText(payload.status, 'status');
    }
    if (payload.invitedBy !== undefined) {
      updates.invitedBy = normalizeText(payload.invitedBy);
    }
    if (payload.invitedAt !== undefined) {
      updates.invitedAt = parseDateValue(payload.invitedAt, 'invitedAt');
    }
    if (payload.expiresAt !== undefined) {
      updates.expiresAt = parseDateValue(payload.expiresAt, 'expiresAt');
    }
    if (payload.acceptedAt !== undefined) {
      updates.acceptedAt = parseDateValue(payload.acceptedAt, 'acceptedAt');
    }
    if (payload.token !== undefined) {
      updates.token = normalizeText(payload.token);
    }
    if (payload.metadata !== undefined) {
      updates.metadata = payload.metadata ?? null;
    }

    if (Object.keys(updates).length > 0) {
      await invite.update(updates, { transaction });
    }

    await touchWorkspace(workspace, { transaction, actorId });
    return invite.toPublicObject();
  });
}

export async function deleteProjectInvite(projectId, inviteId, { actorId } = {}) {
  if (!inviteId) {
    throw new ValidationError('inviteId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const invite = await ProjectWorkspaceInvite.findOne({ where: { id: inviteId, workspaceId: workspace.id }, transaction });
    if (!invite) {
      throw new NotFoundError('Invite not found.');
    }
    await invite.destroy({ transaction });
    await touchWorkspace(workspace, { transaction, actorId });
    return { success: true };
  });
}

export async function createProjectHrRecord(projectId, payload = {}, { actorId } = {}) {
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const record = await ProjectWorkspaceHrRecord.create(
      {
        workspaceId: workspace.id,
        memberName: requireText(payload.memberName, 'memberName'),
        roleName: requireText(payload.roleName, 'roleName'),
        employmentType: normalizeText(payload.employmentType) ?? 'contractor',
        hourlyRateCents: parseIntegerValue(payload.hourlyRateCents ?? null, 'hourlyRateCents'),
        capacityHours: parseNumberValue(payload.capacityHours ?? null, 'capacityHours'),
        utilizationPercent: parsePercentValue(payload.utilizationPercent ?? null, 'utilizationPercent'),
        status: normalizeText(payload.status) ?? 'active',
        managerName: normalizeText(payload.managerName),
        notes: normalizeText(payload.notes),
        metadata: payload.metadata ?? null,
      },
      { transaction },
    );
    await touchWorkspace(workspace, { transaction, actorId });
    return record.toPublicObject();
  });
}

export async function updateProjectHrRecord(projectId, recordId, payload = {}, { actorId } = {}) {
  if (!recordId) {
    throw new ValidationError('recordId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const record = await ProjectWorkspaceHrRecord.findOne({
      where: { id: recordId, workspaceId: workspace.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!record) {
      throw new NotFoundError('HR record not found.');
    }

    const updates = {};
    if (payload.memberName !== undefined) {
      updates.memberName = requireText(payload.memberName, 'memberName');
    }
    if (payload.roleName !== undefined) {
      updates.roleName = requireText(payload.roleName, 'roleName');
    }
    if (payload.employmentType !== undefined) {
      updates.employmentType = requireText(payload.employmentType, 'employmentType');
    }
    if (payload.hourlyRateCents !== undefined) {
      updates.hourlyRateCents = parseIntegerValue(payload.hourlyRateCents, 'hourlyRateCents');
    }
    if (payload.capacityHours !== undefined) {
      updates.capacityHours = parseNumberValue(payload.capacityHours, 'capacityHours');
    }
    if (payload.utilizationPercent !== undefined) {
      updates.utilizationPercent = parsePercentValue(payload.utilizationPercent, 'utilizationPercent');
    }
    if (payload.status !== undefined) {
      updates.status = requireText(payload.status, 'status');
    }
    if (payload.managerName !== undefined) {
      updates.managerName = normalizeText(payload.managerName);
    }
    if (payload.notes !== undefined) {
      updates.notes = normalizeText(payload.notes);
    }
    if (payload.metadata !== undefined) {
      updates.metadata = payload.metadata ?? null;
    }

    if (Object.keys(updates).length > 0) {
      await record.update(updates, { transaction });
    }

    await touchWorkspace(workspace, { transaction, actorId });
    return record.toPublicObject();
  });
}

export async function deleteProjectHrRecord(projectId, recordId, { actorId } = {}) {
  if (!recordId) {
    throw new ValidationError('recordId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const record = await ProjectWorkspaceHrRecord.findOne({ where: { id: recordId, workspaceId: workspace.id }, transaction });
    if (!record) {
      throw new NotFoundError('HR record not found.');
    }
    await record.destroy({ transaction });
    await touchWorkspace(workspace, { transaction, actorId });
    return { success: true };
  });
}

export async function createProjectTimeLog(projectId, payload = {}, { actorId } = {}) {
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const startedAt = parseDateValue(payload.startedAt, 'startedAt', { allowNull: false });
    const endedAt = parseDateValue(payload.endedAt, 'endedAt');
    const durationMinutes = payload.durationMinutes
      ? parseIntegerValue(payload.durationMinutes, 'durationMinutes')
      : computeDurationMinutes(startedAt, endedAt);

    const log = await ProjectWorkspaceTimeLog.create(
      {
        workspaceId: workspace.id,
        taskId: payload.taskId ? Number(payload.taskId) : null,
        memberName: requireText(payload.memberName, 'memberName'),
        startedAt,
        endedAt,
        durationMinutes,
        billable: parseBooleanValue(payload.billable, true),
        rateCents: parseIntegerValue(payload.rateCents ?? null, 'rateCents'),
        notes: normalizeText(payload.notes),
      },
      { transaction },
    );
    await touchWorkspace(workspace, { transaction, actorId });
    return log.toPublicObject();
  });
}

export async function updateProjectTimeLog(projectId, logId, payload = {}, { actorId } = {}) {
  if (!logId) {
    throw new ValidationError('timeLogId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const log = await ProjectWorkspaceTimeLog.findOne({
      where: { id: logId, workspaceId: workspace.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!log) {
      throw new NotFoundError('Time log not found.');
    }

    const updates = {};
    if (payload.taskId !== undefined) {
      updates.taskId = payload.taskId ? Number(payload.taskId) : null;
    }
    if (payload.memberName !== undefined) {
      updates.memberName = requireText(payload.memberName, 'memberName');
    }
    if (payload.startedAt !== undefined) {
      updates.startedAt = parseDateValue(payload.startedAt, 'startedAt', { allowNull: false });
    }
    if (payload.endedAt !== undefined) {
      updates.endedAt = parseDateValue(payload.endedAt, 'endedAt');
    }
    if (payload.durationMinutes !== undefined) {
      updates.durationMinutes = parseIntegerValue(payload.durationMinutes, 'durationMinutes');
    }
    if (payload.billable !== undefined) {
      updates.billable = parseBooleanValue(payload.billable, true);
    }
    if (payload.rateCents !== undefined) {
      updates.rateCents = parseIntegerValue(payload.rateCents, 'rateCents');
    }
    if (payload.notes !== undefined) {
      updates.notes = normalizeText(payload.notes);
    }

    if (updates.startedAt && updates.endedAt && payload.durationMinutes === undefined) {
      updates.durationMinutes = computeDurationMinutes(updates.startedAt, updates.endedAt);
    }

    if (Object.keys(updates).length > 0) {
      await log.update(updates, { transaction });
    }

    await touchWorkspace(workspace, { transaction, actorId });
    return log.toPublicObject();
  });
}

export async function deleteProjectTimeLog(projectId, logId, { actorId } = {}) {
  if (!logId) {
    throw new ValidationError('timeLogId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const log = await ProjectWorkspaceTimeLog.findOne({ where: { id: logId, workspaceId: workspace.id }, transaction });
    if (!log) {
      throw new NotFoundError('Time log not found.');
    }
    await log.destroy({ transaction });
    await touchWorkspace(workspace, { transaction, actorId });
    return { success: true };
  });
}

export async function createProjectTarget(projectId, payload = {}, { actorId } = {}) {
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const target = await ProjectWorkspaceTarget.create(
      {
        workspaceId: workspace.id,
        name: requireText(payload.name, 'name'),
        description: normalizeText(payload.description),
        targetValue: parseNumberValue(payload.targetValue ?? null, 'targetValue'),
        currentValue: parseNumberValue(payload.currentValue ?? null, 'currentValue'),
        unit: normalizeText(payload.unit),
        dueAt: parseDateValue(payload.dueAt, 'dueAt'),
        status: normalizeText(payload.status) ?? 'on_track',
        ownerName: normalizeText(payload.ownerName),
        trend: normalizeText(payload.trend),
      },
      { transaction },
    );
    await touchWorkspace(workspace, { transaction, actorId });
    return target.toPublicObject();
  });
}

export async function updateProjectTarget(projectId, targetId, payload = {}, { actorId } = {}) {
  if (!targetId) {
    throw new ValidationError('targetId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const target = await ProjectWorkspaceTarget.findOne({
      where: { id: targetId, workspaceId: workspace.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!target) {
      throw new NotFoundError('Target not found.');
    }

    const updates = {};
    if (payload.name !== undefined) {
      updates.name = requireText(payload.name, 'name');
    }
    if (payload.description !== undefined) {
      updates.description = normalizeText(payload.description);
    }
    if (payload.targetValue !== undefined) {
      updates.targetValue = parseNumberValue(payload.targetValue, 'targetValue');
    }
    if (payload.currentValue !== undefined) {
      updates.currentValue = parseNumberValue(payload.currentValue, 'currentValue');
    }
    if (payload.unit !== undefined) {
      updates.unit = normalizeText(payload.unit);
    }
    if (payload.dueAt !== undefined) {
      updates.dueAt = parseDateValue(payload.dueAt, 'dueAt');
    }
    if (payload.status !== undefined) {
      updates.status = requireText(payload.status, 'status');
    }
    if (payload.ownerName !== undefined) {
      updates.ownerName = normalizeText(payload.ownerName);
    }
    if (payload.trend !== undefined) {
      updates.trend = normalizeText(payload.trend);
    }

    if (Object.keys(updates).length > 0) {
      await target.update(updates, { transaction });
    }

    await touchWorkspace(workspace, { transaction, actorId });
    return target.toPublicObject();
  });
}

export async function deleteProjectTarget(projectId, targetId, { actorId } = {}) {
  if (!targetId) {
    throw new ValidationError('targetId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const target = await ProjectWorkspaceTarget.findOne({ where: { id: targetId, workspaceId: workspace.id }, transaction });
    if (!target) {
      throw new NotFoundError('Target not found.');
    }
    await target.destroy({ transaction });
    await touchWorkspace(workspace, { transaction, actorId });
    return { success: true };
  });
}

export async function createProjectObjective(projectId, payload = {}, { actorId } = {}) {
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const objective = await ProjectWorkspaceObjective.create(
      {
        workspaceId: workspace.id,
        title: requireText(payload.title, 'title'),
        description: normalizeText(payload.description),
        status: normalizeText(payload.status) ?? 'in_progress',
        ownerName: normalizeText(payload.ownerName),
        dueAt: parseDateValue(payload.dueAt, 'dueAt'),
        progressPercent: parsePercentValue(payload.progressPercent ?? null, 'progressPercent'),
        keyResults: Array.isArray(payload.keyResults) ? payload.keyResults : [],
      },
      { transaction },
    );
    await touchWorkspace(workspace, { transaction, actorId });
    return objective.toPublicObject();
  });
}

export async function updateProjectObjective(projectId, objectiveId, payload = {}, { actorId } = {}) {
  if (!objectiveId) {
    throw new ValidationError('objectiveId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const objective = await ProjectWorkspaceObjective.findOne({
      where: { id: objectiveId, workspaceId: workspace.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!objective) {
      throw new NotFoundError('Objective not found.');
    }

    const updates = {};
    if (payload.title !== undefined) {
      updates.title = requireText(payload.title, 'title');
    }
    if (payload.description !== undefined) {
      updates.description = normalizeText(payload.description);
    }
    if (payload.status !== undefined) {
      updates.status = requireText(payload.status, 'status');
    }
    if (payload.ownerName !== undefined) {
      updates.ownerName = normalizeText(payload.ownerName);
    }
    if (payload.dueAt !== undefined) {
      updates.dueAt = parseDateValue(payload.dueAt, 'dueAt');
    }
    if (payload.progressPercent !== undefined) {
      updates.progressPercent = parsePercentValue(payload.progressPercent, 'progressPercent');
    }
    if (payload.keyResults !== undefined) {
      updates.keyResults = Array.isArray(payload.keyResults) ? payload.keyResults : [];
    }

    if (Object.keys(updates).length > 0) {
      await objective.update(updates, { transaction });
    }

    await touchWorkspace(workspace, { transaction, actorId });
    return objective.toPublicObject();
  });
}

export async function deleteProjectObjective(projectId, objectiveId, { actorId } = {}) {
  if (!objectiveId) {
    throw new ValidationError('objectiveId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const objective = await ProjectWorkspaceObjective.findOne({
      where: { id: objectiveId, workspaceId: workspace.id },
      transaction,
    });
    if (!objective) {
      throw new NotFoundError('Objective not found.');
    }
    await objective.destroy({ transaction });
    await touchWorkspace(workspace, { transaction, actorId });
    return { success: true };
  });
}

export async function createConversationMessage(projectId, conversationId, payload = {}, { actorId } = {}) {
  if (!conversationId) {
    throw new ValidationError('conversationId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const conversation = await ProjectWorkspaceConversation.findOne({
      where: { id: conversationId, workspaceId: workspace.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!conversation) {
      throw new NotFoundError('Conversation not found.');
    }

    const message = await ProjectWorkspaceMessage.create(
      {
        workspaceId: workspace.id,
        conversationId: conversation.id,
        authorName: requireText(payload.authorName ?? payload.author ?? 'Workspace operator', 'authorName'),
        body: requireText(payload.body, 'body'),
        postedAt: parseDateValue(payload.postedAt ?? new Date(), 'postedAt'),
        attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
      },
      { transaction },
    );

    await conversation.update(
      {
        lastMessagePreview: message.body.slice(0, 300),
        lastMessageAt: message.postedAt,
        unreadCount: 0,
      },
      { transaction },
    );

    await touchWorkspace(workspace, { transaction, actorId });
    return message.toPublicObject();
  });
}

export async function createProjectFile(projectId, payload = {}, { actorId } = {}) {
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const file = await ProjectWorkspaceFile.create(
      {
        workspaceId: workspace.id,
        name: requireText(payload.name, 'name'),
        category: normalizeText(payload.category) ?? 'asset',
        fileType: normalizeText(payload.fileType) ?? 'application/octet-stream',
        storageProvider: normalizeText(payload.storageProvider) ?? 's3',
        storagePath: requireText(payload.storagePath ?? payload.path ?? `/projects/${workspace.projectId ?? projectId}/assets/${Date.now()}`, 'storagePath'),
        version: normalizeText(payload.version),
        sizeBytes: parseIntegerValue(payload.sizeBytes ?? null, 'sizeBytes'),
        tags: normalizeArray(payload.tags),
        permissions: payload.permissions ?? null,
        watermarkSettings: payload.watermarkSettings ?? null,
      },
      { transaction },
    );
    await touchWorkspace(workspace, { transaction, actorId });
    return file.toPublicObject();
  });
}

export async function updateProjectFile(projectId, fileId, payload = {}, { actorId } = {}) {
  if (!fileId) {
    throw new ValidationError('fileId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const file = await ProjectWorkspaceFile.findOne({
      where: { id: fileId, workspaceId: workspace.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!file) {
      throw new NotFoundError('File not found.');
    }

    const updates = {};
    if (payload.name !== undefined) {
      updates.name = requireText(payload.name, 'name');
    }
    if (payload.category !== undefined) {
      updates.category = requireText(payload.category, 'category');
    }
    if (payload.fileType !== undefined) {
      updates.fileType = requireText(payload.fileType, 'fileType');
    }
    if (payload.storageProvider !== undefined) {
      updates.storageProvider = requireText(payload.storageProvider, 'storageProvider');
    }
    if (payload.storagePath !== undefined) {
      updates.storagePath = requireText(payload.storagePath, 'storagePath');
    }
    if (payload.version !== undefined) {
      updates.version = normalizeText(payload.version);
    }
    if (payload.sizeBytes !== undefined) {
      updates.sizeBytes = parseIntegerValue(payload.sizeBytes, 'sizeBytes');
    }
    if (payload.tags !== undefined) {
      updates.tags = normalizeArray(payload.tags);
    }
    if (payload.permissions !== undefined) {
      updates.permissions = payload.permissions ?? null;
    }
    if (payload.watermarkSettings !== undefined) {
      updates.watermarkSettings = payload.watermarkSettings ?? null;
    }

    if (Object.keys(updates).length > 0) {
      await file.update(updates, { transaction });
    }

    await touchWorkspace(workspace, { transaction, actorId });
    return file.toPublicObject();
  });
}

export async function deleteProjectFile(projectId, fileId, { actorId } = {}) {
  if (!fileId) {
    throw new ValidationError('fileId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const { workspace } = await ensureWorkspace(projectId, { transaction, actorId });
    const file = await ProjectWorkspaceFile.findOne({ where: { id: fileId, workspaceId: workspace.id }, transaction });
    if (!file) {
      throw new NotFoundError('File not found.');
    }
    await file.destroy({ transaction });
    await touchWorkspace(workspace, { transaction, actorId });
    return { success: true };
  });
}

export default {
  getProjectOperations,
  updateProjectOperations,
  addProjectTask,
  updateProjectTask,
  removeProjectTask,
  createProjectBudget,
  updateProjectBudget,
  deleteProjectBudget,
  createProjectObject,
  updateProjectObject,
  deleteProjectObject,
  createProjectTimelineEvent,
  updateProjectTimelineEvent,
  deleteProjectTimelineEvent,
  createProjectMeeting,
  updateProjectMeeting,
  deleteProjectMeeting,
  createProjectCalendarEntry,
  updateProjectCalendarEntry,
  deleteProjectCalendarEntry,
  createProjectRole,
  updateProjectRole,
  deleteProjectRole,
  createProjectSubmission,
  updateProjectSubmission,
  deleteProjectSubmission,
  createProjectInvite,
  updateProjectInvite,
  deleteProjectInvite,
  createProjectHrRecord,
  updateProjectHrRecord,
  deleteProjectHrRecord,
  createProjectTimeLog,
  updateProjectTimeLog,
  deleteProjectTimeLog,
  createProjectTarget,
  updateProjectTarget,
  deleteProjectTarget,
  createProjectObjective,
  updateProjectObjective,
  deleteProjectObjective,
  createConversationMessage,
  createProjectFile,
  updateProjectFile,
  deleteProjectFile,
};

