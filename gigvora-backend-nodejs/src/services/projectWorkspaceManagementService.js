import {
  projectGigManagementSequelize,
  Project,
  ProjectWorkspace,
  ProjectIntegration,
  ProjectWorkspaceBudgetLine,
  ProjectWorkspaceObjective,
  ProjectWorkspaceTask,
  ProjectWorkspaceMeeting,
  ProjectWorkspaceCalendarEvent,
  ProjectWorkspaceRoleAssignment,
  ProjectWorkspaceSubmission,
  ProjectWorkspaceInvite,
  ProjectWorkspaceHrRecord,
  ProjectWorkspaceTimeEntry,
  ProjectWorkspaceObject,
  ProjectWorkspaceDocument,
  ProjectWorkspaceChatMessage,
  WORKSPACE_BUDGET_STATUSES,
  WORKSPACE_TASK_STATUSES,
  WORKSPACE_TASK_PRIORITIES,
  WORKSPACE_MEETING_STATUSES,
  WORKSPACE_INVITE_STATUSES,
  WORKSPACE_ROLE_STATUSES,
  WORKSPACE_SUBMISSION_STATUSES,
  WORKSPACE_HR_STATUSES,
  WORKSPACE_TIME_ENTRY_STATUSES,
  WORKSPACE_OBJECT_TYPES,
  PROJECT_INTEGRATION_STATUSES,
} from '../models/projectGigManagementModels.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const DEFAULT_INTEGRATIONS = [
  { provider: 'slack', metadata: { channel: '#project-room' } },
  { provider: 'github', metadata: { repository: 'gigvora/example-project' } },
  { provider: 'google_drive', metadata: { folder: 'Project workspace' } },
];

let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    await projectGigManagementSequelize.authenticate();
    initialized = true;
  }
}

function toPlain(instance) {
  if (!instance) {
    return null;
  }
  return instance.get({ plain: true });
}

function requireString(value, field, { allowEmpty = false } = {}) {
  if (value === undefined || value === null) {
    throw new ValidationError(`${field} is required.`);
  }
  const trimmed = String(value).trim();
  if (!allowEmpty && trimmed.length === 0) {
    throw new ValidationError(`${field} is required.`);
  }
  return trimmed;
}

function optionalString(value) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed.length === 0 ? null : trimmed;
}

function parseNumber(value, { allowNull = true, min = null, max = null } = {}) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === '') {
    if (allowNull) {
      return null;
    }
    throw new ValidationError('Numeric value is required.');
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new ValidationError('Numeric value is required.');
  }
  if (min != null && number < min) {
    throw new ValidationError(`Value must be >= ${min}.`);
  }
  if (max != null && number > max) {
    throw new ValidationError(`Value must be <= ${max}.`);
  }
  return number;
}

function parseBoolean(value) {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === null) {
    return null;
  }
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no'].includes(normalized)) {
    return false;
  }
  throw new ValidationError('Boolean value expected.');
}

function parseDateValue(value, { allowNull = true, dateOnly = false } = {}) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === '') {
    if (allowNull) {
      return null;
    }
    throw new ValidationError('Date value is required.');
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError('Invalid date value.');
  }
  if (dateOnly) {
    return date.toISOString().slice(0, 10);
  }
  return date;
}

function ensureEnum(value, allowed, field, { allowNull = false, defaultValue = null } = {}) {
  if (value === undefined) {
    if (!allowNull && defaultValue == null) {
      throw new ValidationError(`${field} is required.`);
    }
    return defaultValue;
  }
  if (value === null) {
    if (allowNull) {
      return null;
    }
    throw new ValidationError(`${field} is required.`);
  }
  const normalized = String(value).trim().toLowerCase();
  const match = allowed.find((entry) => entry.toLowerCase() === normalized);
  if (!match) {
    throw new ValidationError(`${field} must be one of: ${allowed.join(', ')}.`);
  }
  return match;
}

async function ensureWorkspace(projectId, { transaction } = {}) {
  const project = await Project.findByPk(projectId, { transaction });
  if (!project) {
    throw new NotFoundError('Project not found.');
  }

  let workspace = await ProjectWorkspace.findOne({ where: { projectId }, transaction, lock: transaction?.LOCK?.UPDATE });
  if (!workspace) {
    workspace = await ProjectWorkspace.create(
      {
        projectId,
        status: 'planning',
        progressPercent: 0,
        riskLevel: 'low',
        nextMilestone: null,
        notes: null,
      },
      { transaction },
    );
  }

  await Promise.all(
    DEFAULT_INTEGRATIONS.map(async (integration) => {
      await ProjectIntegration.findOrCreate({
        where: { projectId, provider: integration.provider },
        defaults: { ...integration, status: 'connected', projectId },
        transaction,
        lock: transaction?.LOCK?.UPDATE,
      });
    }),
  );

  return { project, workspace };
}

function normalizeNumeric(record, fields = []) {
  if (!record) {
    return record;
  }
  fields.forEach((field) => {
    if (record[field] != null) {
      const parsed = Number(record[field]);
      record[field] = Number.isFinite(parsed) ? parsed : null;
    }
  });
  return record;
}

function buildSummary({ project, workspace, budgets, tasks, timeEntries, objectives, invites, meetings }) {
  const totalBudgetPlanned = budgets.reduce((sum, item) => sum + (Number(item.plannedAmount) || 0), 0);
  const totalBudgetActual = budgets.reduce((sum, item) => sum + (Number(item.actualAmount) || 0), 0);
  const completedTasks = tasks.filter((task) => task.status === 'completed').length;
  const activeTasks = tasks.filter((task) => task.status !== 'completed' && task.status !== 'cancelled').length;
  const totalTimeHours = timeEntries.reduce((sum, entry) => sum + (Number(entry.hours) || 0), 0);
  const acceptedInvites = invites.filter((invite) => invite.status === 'accepted').length;
  const upcomingMeeting = meetings
    .map((meeting) => ({ meeting, date: meeting.scheduledAt ? new Date(meeting.scheduledAt) : null }))
    .filter((entry) => entry.date && entry.date.getTime() >= Date.now())
    .sort((a, b) => a.date - b.date)[0]?.meeting;

  return {
    projectId: project.id,
    projectTitle: project.title,
    workspaceId: workspace.id,
    budget: {
      planned: totalBudgetPlanned,
      actual: totalBudgetActual,
    },
    tasks: {
      total: tasks.length,
      completed: completedTasks,
      active: activeTasks,
    },
    time: {
      totalHours: totalTimeHours,
    },
    objectives: {
      total: objectives.length,
      atRisk: objectives.filter((objective) => (objective.status || '').includes('risk')).length,
    },
    collaboration: {
      invitesSent: invites.length,
      invitesAccepted: acceptedInvites,
    },
    nextMeeting: upcomingMeeting
      ? {
          id: upcomingMeeting.id,
          title: upcomingMeeting.title,
          scheduledAt: upcomingMeeting.scheduledAt,
          organizer: upcomingMeeting.organizerName,
        }
      : null,
  };
}

function buildTimeline(tasks, events) {
  const dates = [];
  tasks.forEach((task) => {
    if (task.startDate) {
      dates.push(new Date(task.startDate));
    }
    if (task.dueDate) {
      dates.push(new Date(task.dueDate));
    }
  });
  events.forEach((event) => {
    if (event.startAt) {
      dates.push(new Date(event.startAt));
    }
    if (event.endAt) {
      dates.push(new Date(event.endAt));
    }
  });
  if (!dates.length) {
    return null;
  }
  const ordered = dates.filter((date) => Number.isFinite(date.getTime())).sort((a, b) => a - b);
  if (!ordered.length) {
    return null;
  }
  return {
    startDate: ordered[0],
    endDate: ordered[ordered.length - 1],
  };
}

const ENTITY_CONFIG = {
  'budget-lines': {
    model: ProjectWorkspaceBudgetLine,
    label: 'Budget line',
    numericFields: ['plannedAmount', 'actualAmount'],
    prepare(payload, { isUpdate = false } = {}) {
      const result = {};
      if (!isUpdate || payload.category !== undefined) {
        result.category = requireString(payload.category, 'category');
      }
      if (!isUpdate || payload.label !== undefined) {
        result.label = requireString(payload.label, 'label');
      }
      if (payload.description !== undefined) {
        result.description = optionalString(payload.description);
      }
      if (payload.ownerName !== undefined) {
        result.ownerName = optionalString(payload.ownerName);
      }
      if (payload.notes !== undefined) {
        result.notes = optionalString(payload.notes);
      }
      if (payload.currency !== undefined) {
        result.currency = requireString(payload.currency, 'currency', { allowEmpty: false });
      }
      if (payload.status !== undefined) {
        result.status = ensureEnum(payload.status, WORKSPACE_BUDGET_STATUSES, 'status');
      }
      if (payload.plannedAmount !== undefined) {
        result.plannedAmount = parseNumber(payload.plannedAmount, { allowNull: false, min: 0 });
      }
      if (payload.actualAmount !== undefined) {
        result.actualAmount = parseNumber(payload.actualAmount, { allowNull: true, min: 0 });
      }
      if (payload.metadata !== undefined) {
        result.metadata = payload.metadata ?? null;
      }
      return result;
    },
  },
  objectives: {
    model: ProjectWorkspaceObjective,
    label: 'Objective',
    numericFields: ['targetValue', 'currentValue', 'weight'],
    prepare(payload, { isUpdate = false } = {}) {
      const result = {};
      if (!isUpdate || payload.title !== undefined) {
        result.title = requireString(payload.title, 'title');
      }
      if (payload.description !== undefined) {
        result.description = optionalString(payload.description);
      }
      if (payload.ownerName !== undefined) {
        result.ownerName = optionalString(payload.ownerName);
      }
      if (payload.metric !== undefined) {
        result.metric = optionalString(payload.metric);
      }
      if (payload.targetValue !== undefined) {
        result.targetValue = parseNumber(payload.targetValue, { allowNull: true, min: 0 });
      }
      if (payload.currentValue !== undefined) {
        result.currentValue = parseNumber(payload.currentValue, { allowNull: true, min: 0 });
      }
      if (payload.status !== undefined) {
        result.status = requireString(payload.status, 'status');
      }
      if (payload.dueDate !== undefined) {
        result.dueDate = parseDateValue(payload.dueDate);
      }
      if (payload.weight !== undefined) {
        result.weight = parseNumber(payload.weight, { allowNull: true, min: 0 });
      }
      if (payload.metadata !== undefined) {
        result.metadata = payload.metadata ?? null;
      }
      return result;
    },
  },
  tasks: {
    model: ProjectWorkspaceTask,
    label: 'Task',
    numericFields: ['estimatedHours', 'loggedHours', 'progressPercent'],
    prepare(payload, { isUpdate = false } = {}) {
      const result = {};
      if (!isUpdate || payload.title !== undefined) {
        result.title = requireString(payload.title, 'title');
      }
      if (payload.description !== undefined) {
        result.description = optionalString(payload.description);
      }
      if (payload.status !== undefined) {
        result.status = ensureEnum(payload.status, WORKSPACE_TASK_STATUSES, 'status');
      }
      if (payload.priority !== undefined) {
        result.priority = ensureEnum(payload.priority, WORKSPACE_TASK_PRIORITIES, 'priority');
      }
      if (payload.lane !== undefined) {
        result.lane = optionalString(payload.lane);
      }
      if (payload.assigneeName !== undefined) {
        result.assigneeName = optionalString(payload.assigneeName);
      }
      if (payload.assigneeEmail !== undefined) {
        result.assigneeEmail = optionalString(payload.assigneeEmail);
      }
      if (payload.startDate !== undefined) {
        result.startDate = parseDateValue(payload.startDate);
      }
      if (payload.dueDate !== undefined) {
        result.dueDate = parseDateValue(payload.dueDate);
      }
      if (payload.estimatedHours !== undefined) {
        result.estimatedHours = parseNumber(payload.estimatedHours, { allowNull: true, min: 0 });
      }
      if (payload.loggedHours !== undefined) {
        result.loggedHours = parseNumber(payload.loggedHours, { allowNull: true, min: 0 });
      }
      if (payload.progressPercent !== undefined) {
        result.progressPercent = parseNumber(payload.progressPercent, { allowNull: false, min: 0, max: 100 });
      }
      if (payload.dependencies !== undefined) {
        result.dependencies = Array.isArray(payload.dependencies) ? payload.dependencies : payload.dependencies ?? null;
      }
      if (payload.tags !== undefined) {
        result.tags = Array.isArray(payload.tags) ? payload.tags : payload.tags ?? null;
      }
      if (payload.metadata !== undefined) {
        result.metadata = payload.metadata ?? null;
      }
      return result;
    },
  },
  meetings: {
    model: ProjectWorkspaceMeeting,
    label: 'Meeting',
    prepare(payload, { isUpdate = false } = {}) {
      const result = {};
      if (!isUpdate || payload.title !== undefined) {
        result.title = requireString(payload.title, 'title');
      }
      if (!isUpdate || payload.scheduledAt !== undefined) {
        result.scheduledAt = parseDateValue(payload.scheduledAt, { allowNull: false });
      }
      if (payload.agenda !== undefined) {
        result.agenda = optionalString(payload.agenda);
      }
      if (payload.status !== undefined) {
        result.status = ensureEnum(payload.status, WORKSPACE_MEETING_STATUSES, 'status');
      }
      if (payload.durationMinutes !== undefined) {
        result.durationMinutes = parseNumber(payload.durationMinutes, { allowNull: false, min: 15 });
      }
      if (payload.location !== undefined) {
        result.location = optionalString(payload.location);
      }
      if (payload.meetingLink !== undefined) {
        result.meetingLink = optionalString(payload.meetingLink);
      }
      if (payload.organizerName !== undefined) {
        result.organizerName = optionalString(payload.organizerName);
      }
      if (payload.notes !== undefined) {
        result.notes = optionalString(payload.notes);
      }
      if (payload.followUpItems !== undefined) {
        result.followUpItems = Array.isArray(payload.followUpItems)
          ? payload.followUpItems
          : payload.followUpItems ?? null;
      }
      if (payload.recurrenceRule !== undefined) {
        result.recurrenceRule = optionalString(payload.recurrenceRule);
      }
      if (payload.metadata !== undefined) {
        result.metadata = payload.metadata ?? null;
      }
      return result;
    },
  },
  'calendar-events': {
    model: ProjectWorkspaceCalendarEvent,
    label: 'Calendar event',
    prepare(payload, { isUpdate = false } = {}) {
      const result = {};
      if (!isUpdate || payload.title !== undefined) {
        result.title = requireString(payload.title, 'title');
      }
      if (!isUpdate || payload.startAt !== undefined) {
        result.startAt = parseDateValue(payload.startAt, { allowNull: false });
      }
      if (payload.endAt !== undefined) {
        result.endAt = parseDateValue(payload.endAt);
      }
      if (payload.eventType !== undefined) {
        result.eventType = requireString(payload.eventType, 'eventType');
      }
      if (payload.visibility !== undefined) {
        result.visibility = requireString(payload.visibility, 'visibility');
      }
      if (payload.location !== undefined) {
        result.location = optionalString(payload.location);
      }
      if (payload.description !== undefined) {
        result.description = optionalString(payload.description);
      }
      if (payload.attendees !== undefined) {
        result.attendees = Array.isArray(payload.attendees) ? payload.attendees : payload.attendees ?? null;
      }
      if (payload.reminderMinutesBefore !== undefined) {
        result.reminderMinutesBefore = parseNumber(payload.reminderMinutesBefore, { allowNull: true, min: 0 });
      }
      if (payload.metadata !== undefined) {
        result.metadata = payload.metadata ?? null;
      }
      return result;
    },
  },
  'role-assignments': {
    model: ProjectWorkspaceRoleAssignment,
    label: 'Role assignment',
    numericFields: ['allocationPercent'],
    prepare(payload, { isUpdate = false } = {}) {
      const result = {};
      if (!isUpdate || payload.roleName !== undefined) {
        result.roleName = requireString(payload.roleName, 'roleName');
      }
      if (payload.description !== undefined) {
        result.description = optionalString(payload.description);
      }
      if (payload.memberName !== undefined) {
        result.memberName = optionalString(payload.memberName);
      }
      if (payload.memberEmail !== undefined) {
        result.memberEmail = optionalString(payload.memberEmail);
      }
      if (payload.status !== undefined) {
        result.status = ensureEnum(payload.status, WORKSPACE_ROLE_STATUSES, 'status');
      }
      if (payload.allocationPercent !== undefined) {
        result.allocationPercent = parseNumber(payload.allocationPercent, { allowNull: true, min: 0, max: 100 });
      }
      if (payload.permissions !== undefined) {
        result.permissions = Array.isArray(payload.permissions) ? payload.permissions : payload.permissions ?? null;
      }
      if (payload.metadata !== undefined) {
        result.metadata = payload.metadata ?? null;
      }
      return result;
    },
  },
  submissions: {
    model: ProjectWorkspaceSubmission,
    label: 'Submission',
    prepare(payload, { isUpdate = false } = {}) {
      const result = {};
      if (!isUpdate || payload.title !== undefined) {
        result.title = requireString(payload.title, 'title');
      }
      if (payload.submissionType !== undefined) {
        result.submissionType = requireString(payload.submissionType, 'submissionType');
      }
      if (payload.status !== undefined) {
        result.status = ensureEnum(payload.status, WORKSPACE_SUBMISSION_STATUSES, 'status');
      }
      if (payload.dueAt !== undefined) {
        result.dueAt = parseDateValue(payload.dueAt);
      }
      if (payload.submittedAt !== undefined) {
        result.submittedAt = parseDateValue(payload.submittedAt);
      }
      if (payload.submittedByName !== undefined) {
        result.submittedByName = optionalString(payload.submittedByName);
      }
      if (payload.submittedByEmail !== undefined) {
        result.submittedByEmail = optionalString(payload.submittedByEmail);
      }
      if (payload.assetUrl !== undefined) {
        result.assetUrl = optionalString(payload.assetUrl);
      }
      if (payload.notes !== undefined) {
        result.notes = optionalString(payload.notes);
      }
      if (payload.metadata !== undefined) {
        result.metadata = payload.metadata ?? null;
      }
      return result;
    },
  },
  invites: {
    model: ProjectWorkspaceInvite,
    label: 'Invite',
    prepare(payload, { isUpdate = false } = {}) {
      const result = {};
      if (!isUpdate || payload.email !== undefined) {
        result.email = requireString(payload.email, 'email');
      }
      if (!isUpdate || payload.role !== undefined) {
        result.role = requireString(payload.role, 'role');
      }
      if (payload.status !== undefined) {
        result.status = ensureEnum(payload.status, WORKSPACE_INVITE_STATUSES, 'status');
      }
      if (payload.invitedByName !== undefined) {
        result.invitedByName = optionalString(payload.invitedByName);
      }
      if (payload.invitedByEmail !== undefined) {
        result.invitedByEmail = optionalString(payload.invitedByEmail);
      }
      if (payload.message !== undefined) {
        result.message = optionalString(payload.message);
      }
      if (payload.invitedAt !== undefined) {
        result.invitedAt = parseDateValue(payload.invitedAt, { allowNull: false });
      }
      if (payload.respondedAt !== undefined) {
        result.respondedAt = parseDateValue(payload.respondedAt);
      }
      if (payload.metadata !== undefined) {
        result.metadata = payload.metadata ?? null;
      }
      return result;
    },
  },
  'hr-records': {
    model: ProjectWorkspaceHrRecord,
    label: 'HR record',
    numericFields: ['hourlyRate', 'weeklyCapacityHours', 'allocationPercent'],
    prepare(payload, { isUpdate = false } = {}) {
      const result = {};
      if (!isUpdate || payload.memberName !== undefined) {
        result.memberName = requireString(payload.memberName, 'memberName');
      }
      if (payload.roleTitle !== undefined) {
        result.roleTitle = optionalString(payload.roleTitle);
      }
      if (payload.employmentType !== undefined) {
        result.employmentType = requireString(payload.employmentType, 'employmentType');
      }
      if (payload.status !== undefined) {
        result.status = ensureEnum(payload.status, WORKSPACE_HR_STATUSES, 'status');
      }
      if (payload.startDate !== undefined) {
        result.startDate = parseDateValue(payload.startDate);
      }
      if (payload.endDate !== undefined) {
        result.endDate = parseDateValue(payload.endDate);
      }
      if (payload.hourlyRate !== undefined) {
        result.hourlyRate = parseNumber(payload.hourlyRate, { allowNull: true, min: 0 });
      }
      if (payload.weeklyCapacityHours !== undefined) {
        result.weeklyCapacityHours = parseNumber(payload.weeklyCapacityHours, { allowNull: true, min: 0 });
      }
      if (payload.allocationPercent !== undefined) {
        result.allocationPercent = parseNumber(payload.allocationPercent, { allowNull: true, min: 0, max: 100 });
      }
      if (payload.notes !== undefined) {
        result.notes = optionalString(payload.notes);
      }
      if (payload.metadata !== undefined) {
        result.metadata = payload.metadata ?? null;
      }
      return result;
    },
  },
  'time-entries': {
    model: ProjectWorkspaceTimeEntry,
    label: 'Time entry',
    numericFields: ['hours'],
    prepare(payload, { isUpdate = false } = {}) {
      const result = {};
      if (!isUpdate || payload.memberName !== undefined) {
        result.memberName = requireString(payload.memberName, 'memberName');
      }
      if (!isUpdate || payload.entryDate !== undefined) {
        result.entryDate = parseDateValue(payload.entryDate, { allowNull: false, dateOnly: true });
      }
      if (payload.hours !== undefined) {
        result.hours = parseNumber(payload.hours, { allowNull: false, min: 0 });
      }
      if (payload.billable !== undefined) {
        result.billable = parseBoolean(payload.billable);
      }
      if (payload.status !== undefined) {
        result.status = ensureEnum(payload.status, WORKSPACE_TIME_ENTRY_STATUSES, 'status');
      }
      if (payload.notes !== undefined) {
        result.notes = optionalString(payload.notes);
      }
      if (payload.approvedByName !== undefined) {
        result.approvedByName = optionalString(payload.approvedByName);
      }
      if (payload.metadata !== undefined) {
        result.metadata = payload.metadata ?? null;
      }
      return result;
    },
  },
  objects: {
    model: ProjectWorkspaceObject,
    label: 'Workspace object',
    prepare(payload, { isUpdate = false } = {}) {
      const result = {};
      if (!isUpdate || payload.objectType !== undefined) {
        result.objectType = ensureEnum(payload.objectType, WORKSPACE_OBJECT_TYPES, 'objectType');
      }
      if (!isUpdate || payload.label !== undefined) {
        result.label = requireString(payload.label, 'label');
      }
      if (payload.description !== undefined) {
        result.description = optionalString(payload.description);
      }
      if (payload.ownerName !== undefined) {
        result.ownerName = optionalString(payload.ownerName);
      }
      if (payload.quantity !== undefined) {
        result.quantity = parseNumber(payload.quantity, { allowNull: true, min: 0 });
      }
      if (payload.unit !== undefined) {
        result.unit = optionalString(payload.unit);
      }
      if (payload.status !== undefined) {
        result.status = optionalString(payload.status);
      }
      if (payload.metadata !== undefined) {
        result.metadata = payload.metadata ?? null;
      }
      return result;
    },
  },
  documents: {
    model: ProjectWorkspaceDocument,
    label: 'Document',
    prepare(payload, { isUpdate = false } = {}) {
      const result = {};
      if (!isUpdate || payload.name !== undefined) {
        result.name = requireString(payload.name, 'name');
      }
      if (!isUpdate || payload.category !== undefined) {
        result.category = requireString(payload.category, 'category');
      }
      if (!isUpdate || payload.storageUrl !== undefined) {
        result.storageUrl = requireString(payload.storageUrl, 'storageUrl');
      }
      if (payload.thumbnailUrl !== undefined) {
        result.thumbnailUrl = optionalString(payload.thumbnailUrl);
      }
      if (payload.sizeBytes !== undefined) {
        result.sizeBytes = parseNumber(payload.sizeBytes, { allowNull: true, min: 0 });
      }
      if (payload.visibility !== undefined) {
        result.visibility = requireString(payload.visibility, 'visibility');
      }
      if (payload.ownerName !== undefined) {
        result.ownerName = optionalString(payload.ownerName);
      }
      if (payload.version !== undefined) {
        result.version = optionalString(payload.version);
      }
      if (payload.notes !== undefined) {
        result.notes = optionalString(payload.notes);
      }
      if (payload.metadata !== undefined) {
        result.metadata = payload.metadata ?? null;
      }
      return result;
    },
  },
  'chat-messages': {
    model: ProjectWorkspaceChatMessage,
    label: 'Chat message',
    prepare(payload, { isUpdate = false } = {}) {
      const result = {};
      if (!isUpdate || payload.channel !== undefined) {
        result.channel = requireString(payload.channel ?? 'general', 'channel');
      }
      if (!isUpdate || payload.authorName !== undefined) {
        result.authorName = requireString(payload.authorName, 'authorName');
      }
      if (!isUpdate || payload.body !== undefined) {
        result.body = requireString(payload.body, 'body');
      }
      if (payload.authorRole !== undefined) {
        result.authorRole = optionalString(payload.authorRole);
      }
      if (payload.postedAt !== undefined) {
        result.postedAt = parseDateValue(payload.postedAt, { allowNull: false });
      }
      if (payload.pinned !== undefined) {
        result.pinned = parseBoolean(payload.pinned);
      }
      if (payload.metadata !== undefined) {
        result.metadata = payload.metadata ?? null;
      }
      return result;
    },
  },
};

async function listWorkspaceProjects() {
  await ensureInitialized();
  const projects = await Project.findAll({
    include: [{ model: ProjectWorkspace, as: 'workspace' }],
    order: [
      ['updatedAt', 'DESC'],
      ['createdAt', 'DESC'],
    ],
  });
  return projects.map((project) => {
    const plain = project.get({ plain: true });
    return {
      id: plain.id,
      title: plain.title,
      status: plain.status,
      workspaceId: plain.workspace?.id ?? null,
      progressPercent: plain.workspace?.progressPercent ?? null,
      riskLevel: plain.workspace?.riskLevel ?? null,
    };
  });
}

async function getProjectWorkspaceManagement(projectId) {
  await ensureInitialized();
  if (!projectId) {
    throw new ValidationError('projectId is required.');
  }

  const { project, workspace } = await ensureWorkspace(projectId);

  const [budgetLines, objectives, tasks, meetings, calendarEvents, roleAssignments, submissions, invites, hrRecords, timeEntries, objects, documents, chatMessages, integrations] = await Promise.all([
    ProjectWorkspaceBudgetLine.findAll({ where: { workspaceId: workspace.id }, order: [['category', 'ASC'], ['label', 'ASC']] }),
    ProjectWorkspaceObjective.findAll({ where: { workspaceId: workspace.id }, order: [['dueDate', 'ASC'], ['title', 'ASC']] }),
    ProjectWorkspaceTask.findAll({
      where: { workspaceId: workspace.id },
      order: [
        ['priority', 'DESC'],
        ['dueDate', 'ASC'],
        ['title', 'ASC'],
      ],
    }),
    ProjectWorkspaceMeeting.findAll({ where: { workspaceId: workspace.id }, order: [['scheduledAt', 'ASC']] }),
    ProjectWorkspaceCalendarEvent.findAll({ where: { workspaceId: workspace.id }, order: [['startAt', 'ASC']] }),
    ProjectWorkspaceRoleAssignment.findAll({ where: { workspaceId: workspace.id }, order: [['roleName', 'ASC']] }),
    ProjectWorkspaceSubmission.findAll({ where: { workspaceId: workspace.id }, order: [['dueAt', 'ASC'], ['title', 'ASC']] }),
    ProjectWorkspaceInvite.findAll({ where: { workspaceId: workspace.id }, order: [['invitedAt', 'DESC']] }),
    ProjectWorkspaceHrRecord.findAll({ where: { workspaceId: workspace.id }, order: [['memberName', 'ASC']] }),
    ProjectWorkspaceTimeEntry.findAll({ where: { workspaceId: workspace.id }, order: [['entryDate', 'DESC']] }),
    ProjectWorkspaceObject.findAll({ where: { workspaceId: workspace.id }, order: [['objectType', 'ASC'], ['label', 'ASC']] }),
    ProjectWorkspaceDocument.findAll({ where: { workspaceId: workspace.id }, order: [['createdAt', 'DESC']] }),
    ProjectWorkspaceChatMessage.findAll({ where: { workspaceId: workspace.id }, order: [['postedAt', 'DESC']] }),
    ProjectIntegration.findAll({ where: { projectId: project.id }, order: [['provider', 'ASC']] }),
  ]);

  const budgetsPlain = budgetLines.map((record) => normalizeNumeric(toPlain(record), ['plannedAmount', 'actualAmount']));
  const objectivesPlain = objectives.map((record) => normalizeNumeric(toPlain(record), ['targetValue', 'currentValue', 'weight']));
  const tasksPlain = tasks.map((record) => normalizeNumeric(toPlain(record), ['estimatedHours', 'loggedHours', 'progressPercent']));
  const meetingsPlain = meetings.map((record) => toPlain(record));
  const eventsPlain = calendarEvents.map((record) => toPlain(record));
  const rolesPlain = roleAssignments.map((record) => normalizeNumeric(toPlain(record), ['allocationPercent']));
  const submissionsPlain = submissions.map((record) => toPlain(record));
  const invitesPlain = invites.map((record) => toPlain(record));
  const hrPlain = hrRecords.map((record) =>
    normalizeNumeric(toPlain(record), ['hourlyRate', 'weeklyCapacityHours', 'allocationPercent']),
  );
  const timeEntriesPlain = timeEntries.map((record) => normalizeNumeric(toPlain(record), ['hours']));
  const objectsPlain = objects.map((record) => normalizeNumeric(toPlain(record), ['quantity']));
  const documentsPlain = documents.map((record) => normalizeNumeric(toPlain(record), ['sizeBytes']));
  const chatPlain = chatMessages.map((record) => toPlain(record));
  const integrationsPlain = integrations.map((record) => toPlain(record));

  const summary = buildSummary({
    project: toPlain(project),
    workspace: toPlain(workspace),
    budgets: budgetsPlain,
    tasks: tasksPlain,
    timeEntries: timeEntriesPlain,
    objectives: objectivesPlain,
    invites: invitesPlain,
    meetings: meetingsPlain,
  });

  const timeline = buildTimeline(tasksPlain, eventsPlain);

  return {
    project: toPlain(project),
    workspace: toPlain(workspace),
    summary,
    timeline,
    budgets: budgetsPlain,
    objectives: objectivesPlain,
    tasks: tasksPlain,
    meetings: meetingsPlain,
    calendarEvents: eventsPlain,
    roleAssignments: rolesPlain,
    submissions: submissionsPlain,
    invites: invitesPlain,
    hrRecords: hrPlain,
    timeEntries: timeEntriesPlain,
    workspaceObjects: objectsPlain,
    documents: documentsPlain,
    chatMessages: chatPlain,
    integrations: integrationsPlain,
  };
}

async function mutateWorkspaceEntity(projectId, entity, payload = {}, { recordId, isUpdate = false, isDelete = false } = {}) {
  await ensureInitialized();
  if (!entity || !ENTITY_CONFIG[entity]) {
    throw new ValidationError('Unsupported workspace entity.');
  }
  if (!projectId) {
    throw new ValidationError('projectId is required.');
  }

  const config = ENTITY_CONFIG[entity];
  const { workspace } = await ensureWorkspace(projectId);
  const transaction = await projectGigManagementSequelize.transaction();
  try {
    let record = null;
    if (isDelete) {
      if (!recordId) {
        throw new ValidationError('recordId is required for delete operations.');
      }
      const existing = await config.model.findOne({
        where: { id: recordId, workspaceId: workspace.id },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!existing) {
        throw new NotFoundError(`${config.label} not found.`);
      }
      await existing.destroy({ transaction });
      await transaction.commit();
      return { success: true };
    }

    const updates = config.prepare(payload, { isUpdate });
    updates.workspaceId = workspace.id;

    if (isUpdate) {
      if (!recordId) {
        throw new ValidationError('recordId is required for update operations.');
      }
      const existing = await config.model.findOne({
        where: { id: recordId, workspaceId: workspace.id },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!existing) {
        throw new NotFoundError(`${config.label} not found.`);
      }
      await existing.update(updates, { transaction });
      record = existing;
    } else {
      record = await config.model.create(updates, { transaction });
    }

    await transaction.commit();
    const plain = toPlain(record);
    return config.numericFields ? normalizeNumeric(plain, config.numericFields) : plain;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function updateIntegration(projectId, recordId, payload = {}) {
  await ensureInitialized();
  if (!projectId) {
    throw new ValidationError('projectId is required.');
  }
  if (!recordId) {
    throw new ValidationError('recordId is required.');
  }
  const integration = await ProjectIntegration.findOne({ where: { id: recordId, projectId } });
  if (!integration) {
    throw new NotFoundError('Integration not found.');
  }
  const updates = {};
  if (payload.status !== undefined) {
    updates.status = ensureEnum(payload.status, PROJECT_INTEGRATION_STATUSES, 'status');
  }
  if (payload.connectedAt !== undefined) {
    updates.connectedAt = parseDateValue(payload.connectedAt);
  }
  if (payload.metadata !== undefined) {
    updates.metadata = payload.metadata ?? null;
  }
  await integration.update(updates);
  return toPlain(integration);
}

async function updateWorkspaceSummary(projectId, payload = {}) {
  await ensureInitialized();
  if (!projectId) {
    throw new ValidationError('projectId is required.');
  }
  const { project, workspace } = await ensureWorkspace(projectId);

  const projectUpdates = {};
  if (payload.title !== undefined) {
    projectUpdates.title = requireString(payload.title, 'title');
  }
  if (payload.description !== undefined) {
    projectUpdates.description = optionalString(payload.description);
  }
  if (Object.keys(projectUpdates).length > 0) {
    await project.update(projectUpdates);
  }

  const workspaceUpdates = {};
  if (payload.status !== undefined) {
    workspaceUpdates.status = ensureEnum(payload.status, ['planning', 'in_progress', 'at_risk', 'completed', 'on_hold'], 'status');
  }
  if (payload.progressPercent !== undefined) {
    workspaceUpdates.progressPercent = parseNumber(payload.progressPercent, { allowNull: false, min: 0, max: 100 });
  }
  if (payload.riskLevel !== undefined) {
    workspaceUpdates.riskLevel = ensureEnum(payload.riskLevel, ['low', 'medium', 'high'], 'riskLevel');
  }
  if (payload.nextMilestone !== undefined) {
    workspaceUpdates.nextMilestone = optionalString(payload.nextMilestone);
  }
  if (payload.nextMilestoneDueAt !== undefined) {
    workspaceUpdates.nextMilestoneDueAt = parseDateValue(payload.nextMilestoneDueAt);
  }
  if (payload.notes !== undefined) {
    workspaceUpdates.notes = optionalString(payload.notes);
  }
  if (Object.keys(workspaceUpdates).length > 0) {
    await workspace.update(workspaceUpdates);
  }

  return getProjectWorkspaceManagement(projectId);
}

export async function getWorkspaceProjectsList() {
  return listWorkspaceProjects();
}

export async function getWorkspaceManagementSnapshot(projectId) {
  return getProjectWorkspaceManagement(projectId);
}

export async function createWorkspaceEntity(projectId, entity, payload = {}) {
  return mutateWorkspaceEntity(projectId, entity, payload, { isUpdate: false });
}

export async function updateWorkspaceEntity(projectId, entity, recordId, payload = {}) {
  if (entity === 'integrations') {
    return updateIntegration(projectId, recordId, payload);
  }
  if (entity === 'summary') {
    return updateWorkspaceSummary(projectId, payload);
  }
  return mutateWorkspaceEntity(projectId, entity, payload, { recordId, isUpdate: true });
}

export async function deleteWorkspaceEntity(projectId, entity, recordId) {
  return mutateWorkspaceEntity(projectId, entity, {}, { recordId, isDelete: true, isUpdate: false });
}

export default {
  getWorkspaceProjectsList,
  getWorkspaceManagementSnapshot,
  createWorkspaceEntity,
  updateWorkspaceEntity,
  deleteWorkspaceEntity,
};
