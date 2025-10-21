import { DataTypes } from 'sequelize';
import {
  projectGigManagementSequelize,
  Project,
  ProjectWorkspace,
  ProjectCollaborator,
  WORKSPACE_BUDGET_STATUSES,
  WORKSPACE_TASK_STATUSES,
  WORKSPACE_TASK_PRIORITIES,
  WORKSPACE_MEETING_STATUSES,
  WORKSPACE_INVITE_STATUSES,
  WORKSPACE_ROLE_STATUSES,
  WORKSPACE_SUBMISSION_STATUSES,
  WORKSPACE_HR_STATUSES,
} from './projectGigManagementModels.js';

const dialect = projectGigManagementSequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

function safeJsonObject(value, fallback = {}) {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'object') {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function toIso(dateValue) {
  if (!dateValue) {
    return null;
  }
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

export const ProjectBudgetLine = projectGigManagementSequelize.define(
  'PgmProjectBudgetLine',
  {
    label: { type: DataTypes.STRING(180), allowNull: false },
    category: { type: DataTypes.STRING(80), allowNull: false },
    plannedAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    actualAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING(6), allowNull: false, defaultValue: 'USD' },
    status: {
      type: DataTypes.ENUM(...WORKSPACE_BUDGET_STATUSES),
      allowNull: false,
      defaultValue: WORKSPACE_BUDGET_STATUSES[0],
    },
    ownerId: { type: DataTypes.INTEGER, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  { tableName: 'pgm_project_budget_lines', underscored: true },
);

export const ProjectDeliverable = projectGigManagementSequelize.define(
  'PgmProjectDeliverable',
  {
    title: { type: DataTypes.STRING(180), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM('draft', 'in_review', 'approved', 'delivered'),
      allowNull: false,
      defaultValue: 'draft',
    },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    submissionUrl: { type: DataTypes.STRING(255), allowNull: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  { tableName: 'pgm_project_deliverables', underscored: true },
);

export const ProjectTask = projectGigManagementSequelize.define(
  'PgmProjectTask',
  {
    title: { type: DataTypes.STRING(180), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...WORKSPACE_TASK_STATUSES),
      allowNull: false,
      defaultValue: WORKSPACE_TASK_STATUSES[0],
    },
    priority: {
      type: DataTypes.ENUM(...WORKSPACE_TASK_PRIORITIES),
      allowNull: false,
      defaultValue: WORKSPACE_TASK_PRIORITIES[1],
    },
    startDate: { type: DataTypes.DATE, allowNull: true },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    estimatedHours: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  { tableName: 'pgm_project_tasks', underscored: true },
);

export const ProjectTaskAssignment = projectGigManagementSequelize.define(
  'PgmProjectTaskAssignment',
  {
    assigneeName: { type: DataTypes.STRING(180), allowNull: false },
    assigneeEmail: { type: DataTypes.STRING(180), allowNull: true },
    assigneeRole: { type: DataTypes.STRING(120), allowNull: true },
    allocationHours: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    status: {
      type: DataTypes.ENUM('assigned', 'accepted', 'in_progress', 'completed'),
      allowNull: false,
      defaultValue: 'assigned',
    },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  { tableName: 'pgm_project_task_assignments', underscored: true },
);

export const ProjectTaskDependency = projectGigManagementSequelize.define(
  'PgmProjectTaskDependency',
  {
    dependsOnTaskId: { type: DataTypes.INTEGER, allowNull: false },
    lagDays: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { tableName: 'pgm_project_task_dependencies', underscored: true },
);

export const ProjectChatChannel = projectGigManagementSequelize.define(
  'PgmProjectChatChannel',
  {
    name: { type: DataTypes.STRING(120), allowNull: false },
    topic: { type: DataTypes.STRING(255), allowNull: true },
    isPrivate: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  { tableName: 'pgm_project_chat_channels', underscored: true },
);

export const ProjectChatMessage = projectGigManagementSequelize.define(
  'PgmProjectChatMessage',
  {
    authorName: { type: DataTypes.STRING(180), allowNull: false },
    authorRole: { type: DataTypes.STRING(120), allowNull: true },
    body: { type: DataTypes.TEXT, allowNull: false },
    pinned: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  { tableName: 'pgm_project_chat_messages', underscored: true },
);

export const ProjectTimelineEntry = projectGigManagementSequelize.define(
  'PgmProjectTimelineEntry',
  {
    title: { type: DataTypes.STRING(180), allowNull: false },
    entryType: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'milestone' },
    occurredAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  { tableName: 'pgm_project_timeline_entries', underscored: true },
);

export const ProjectMeeting = projectGigManagementSequelize.define(
  'PgmProjectMeeting',
  {
    title: { type: DataTypes.STRING(180), allowNull: false },
    agenda: { type: DataTypes.TEXT, allowNull: true },
    scheduledAt: { type: DataTypes.DATE, allowNull: false },
    durationMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 30 },
    location: { type: DataTypes.STRING(180), allowNull: true },
    meetingLink: { type: DataTypes.STRING(255), allowNull: true },
    status: {
      type: DataTypes.ENUM(...WORKSPACE_MEETING_STATUSES),
      allowNull: false,
      defaultValue: WORKSPACE_MEETING_STATUSES[0],
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'pgm_project_meetings', underscored: true },
);

export const ProjectMeetingAttendee = projectGigManagementSequelize.define(
  'PgmProjectMeetingAttendee',
  {
    name: { type: DataTypes.STRING(180), allowNull: false },
    email: { type: DataTypes.STRING(180), allowNull: true },
    role: { type: DataTypes.STRING(120), allowNull: true },
    responseStatus: {
      type: DataTypes.ENUM('invited', 'accepted', 'declined', 'tentative'),
      allowNull: false,
      defaultValue: 'invited',
    },
  },
  { tableName: 'pgm_project_meeting_attendees', underscored: true },
);

export const ProjectCalendarEvent = projectGigManagementSequelize.define(
  'PgmProjectCalendarEvent',
  {
    title: { type: DataTypes.STRING(180), allowNull: false },
    category: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'event' },
    startAt: { type: DataTypes.DATE, allowNull: false },
    endAt: { type: DataTypes.DATE, allowNull: true },
    allDay: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    location: { type: DataTypes.STRING(180), allowNull: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  { tableName: 'pgm_project_calendar_events', underscored: true },
);

export const ProjectRoleDefinition = projectGigManagementSequelize.define(
  'PgmProjectRoleDefinition',
  {
    name: { type: DataTypes.STRING(120), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    seatLimit: { type: DataTypes.INTEGER, allowNull: true },
    permissions: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  { tableName: 'pgm_project_roles', underscored: true },
);

export const ProjectRoleAssignment = projectGigManagementSequelize.define(
  'PgmProjectRoleAssignment',
  {
    collaboratorId: { type: DataTypes.INTEGER, allowNull: true },
    collaboratorName: { type: DataTypes.STRING(180), allowNull: false },
    collaboratorEmail: { type: DataTypes.STRING(180), allowNull: true },
    status: {
      type: DataTypes.ENUM(...WORKSPACE_ROLE_STATUSES),
      allowNull: false,
      defaultValue: WORKSPACE_ROLE_STATUSES[0],
    },
  },
  { tableName: 'pgm_project_role_assignments', underscored: true },
);

export const ProjectSubmission = projectGigManagementSequelize.define(
  'PgmProjectSubmission',
  {
    title: { type: DataTypes.STRING(180), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...WORKSPACE_SUBMISSION_STATUSES),
      allowNull: false,
      defaultValue: WORKSPACE_SUBMISSION_STATUSES[0],
    },
    submittedAt: { type: DataTypes.DATE, allowNull: true },
    submissionUrl: { type: DataTypes.STRING(255), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'pgm_project_submissions', underscored: true },
);

export const ProjectFile = projectGigManagementSequelize.define(
  'PgmProjectFile',
  {
    label: { type: DataTypes.STRING(180), allowNull: false },
    storageUrl: { type: DataTypes.STRING(255), allowNull: false },
    sizeBytes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    fileType: { type: DataTypes.STRING(60), allowNull: true },
    uploadedBy: { type: DataTypes.STRING(180), allowNull: true },
    visibility: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'internal' },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  { tableName: 'pgm_project_files', underscored: true },
);

export const ProjectInvitation = projectGigManagementSequelize.define(
  'PgmProjectInvitation',
  {
    email: { type: DataTypes.STRING(180), allowNull: false },
    role: { type: DataTypes.STRING(120), allowNull: false },
    status: {
      type: DataTypes.ENUM(...WORKSPACE_INVITE_STATUSES),
      allowNull: false,
      defaultValue: WORKSPACE_INVITE_STATUSES[0],
    },
    token: { type: DataTypes.STRING(120), allowNull: true },
    invitedBy: { type: DataTypes.STRING(180), allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  { tableName: 'pgm_project_invitations', underscored: true },
);

export const ProjectHrRecord = projectGigManagementSequelize.define(
  'PgmProjectHrRecord',
  {
    fullName: { type: DataTypes.STRING(180), allowNull: false },
    position: { type: DataTypes.STRING(120), allowNull: false },
    status: {
      type: DataTypes.ENUM(...WORKSPACE_HR_STATUSES),
      allowNull: false,
      defaultValue: WORKSPACE_HR_STATUSES[0],
    },
    startDate: { type: DataTypes.DATE, allowNull: true },
    endDate: { type: DataTypes.DATE, allowNull: true },
    compensation: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    allocationPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  { tableName: 'pgm_project_hr_records', underscored: true },
);

ProjectBudgetLine.prototype.reconcileActuals = async function reconcileActuals(actualAmount, { updatedBy } = {}) {
  const numeric = Number(actualAmount);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new TypeError('Actual amount must be a positive number');
  }

  this.actualAmount = numeric;
  this.metadata = {
    ...safeJsonObject(this.metadata, {}),
    reconciledAt: new Date().toISOString(),
    reconciledBy: updatedBy ?? this.metadata?.reconciledBy ?? null,
  };
  await this.save();
  return this;
};

ProjectBudgetLine.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    projectId: plain.projectId,
    label: plain.label,
    category: plain.category,
    plannedAmount: Number(plain.plannedAmount),
    actualAmount: Number(plain.actualAmount),
    currency: plain.currency,
    status: plain.status,
    ownerId: plain.ownerId ?? null,
    notes: plain.notes ?? '',
    metadata: safeJsonObject(plain.metadata, {}),
    createdAt: toIso(plain.createdAt),
    updatedAt: toIso(plain.updatedAt),
  };
};

ProjectDeliverable.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    projectId: plain.projectId,
    title: plain.title,
    description: plain.description ?? '',
    status: plain.status,
    dueDate: toIso(plain.dueDate),
    submissionUrl: plain.submissionUrl ?? '',
    metadata: safeJsonObject(plain.metadata, {}),
    createdAt: toIso(plain.createdAt),
    updatedAt: toIso(plain.updatedAt),
  };
};

ProjectTask.prototype.markComplete = async function markComplete({ completedAt = new Date(), completedBy } = {}) {
  if (this.status === 'completed') {
    return this;
  }
  this.status = 'completed';
  this.completedAt = completedAt;
  this.metadata = {
    ...safeJsonObject(this.metadata, {}),
    completedBy: completedBy ?? this.metadata?.completedBy ?? null,
  };
  await this.save();
  return this;
};

ProjectTask.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    projectId: plain.projectId,
    title: plain.title,
    description: plain.description ?? '',
    status: plain.status,
    priority: plain.priority,
    startDate: toIso(plain.startDate),
    dueDate: toIso(plain.dueDate),
    estimatedHours: plain.estimatedHours == null ? null : Number(plain.estimatedHours),
    completedAt: toIso(plain.completedAt),
    metadata: safeJsonObject(plain.metadata, {}),
    createdAt: toIso(plain.createdAt),
    updatedAt: toIso(plain.updatedAt),
  };
};

ProjectTaskAssignment.prototype.accept = async function acceptAssignment({ acceptedBy } = {}) {
  if (this.status !== 'accepted') {
    this.status = 'accepted';
    this.metadata = {
      ...safeJsonObject(this.metadata, {}),
      acceptedBy: acceptedBy ?? this.metadata?.acceptedBy ?? null,
      acceptedAt: new Date().toISOString(),
    };
    await this.save();
  }
  return this;
};

ProjectTaskAssignment.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    taskId: plain.taskId,
    assigneeName: plain.assigneeName,
    assigneeEmail: plain.assigneeEmail ?? '',
    assigneeRole: plain.assigneeRole ?? '',
    allocationHours: plain.allocationHours == null ? null : Number(plain.allocationHours),
    status: plain.status,
    metadata: safeJsonObject(plain.metadata, {}),
    createdAt: toIso(plain.createdAt),
    updatedAt: toIso(plain.updatedAt),
  };
};

ProjectTaskDependency.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    taskId: plain.taskId,
    dependsOnTaskId: plain.dependsOnTaskId,
    lagDays: plain.lagDays,
    createdAt: toIso(plain.createdAt),
    updatedAt: toIso(plain.updatedAt),
  };
};

ProjectChatChannel.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    projectId: plain.projectId,
    name: plain.name,
    topic: plain.topic ?? '',
    isPrivate: Boolean(plain.isPrivate),
    metadata: safeJsonObject(plain.metadata, {}),
    createdAt: toIso(plain.createdAt),
    updatedAt: toIso(plain.updatedAt),
  };
};

ProjectChatMessage.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    channelId: plain.channelId,
    authorName: plain.authorName,
    authorRole: plain.authorRole ?? '',
    body: plain.body,
    pinned: Boolean(plain.pinned),
    metadata: safeJsonObject(plain.metadata, {}),
    createdAt: toIso(plain.createdAt),
    updatedAt: toIso(plain.updatedAt),
  };
};

ProjectTimelineEntry.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    projectId: plain.projectId,
    workspaceId: plain.workspaceId ?? null,
    title: plain.title,
    entryType: plain.entryType,
    occurredAt: toIso(plain.occurredAt),
    notes: plain.notes ?? '',
    metadata: safeJsonObject(plain.metadata, {}),
    createdAt: toIso(plain.createdAt),
    updatedAt: toIso(plain.updatedAt),
  };
};

ProjectMeeting.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    projectId: plain.projectId,
    title: plain.title,
    agenda: plain.agenda ?? '',
    scheduledAt: toIso(plain.scheduledAt),
    durationMinutes: plain.durationMinutes,
    location: plain.location ?? '',
    meetingLink: plain.meetingLink ?? '',
    status: plain.status,
    notes: plain.notes ?? '',
    createdAt: toIso(plain.createdAt),
    updatedAt: toIso(plain.updatedAt),
  };
};

ProjectMeetingAttendee.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    meetingId: plain.meetingId,
    name: plain.name,
    email: plain.email ?? '',
    role: plain.role ?? '',
    responseStatus: plain.responseStatus,
    createdAt: toIso(plain.createdAt),
    updatedAt: toIso(plain.updatedAt),
  };
};

ProjectCalendarEvent.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    projectId: plain.projectId,
    title: plain.title,
    category: plain.category,
    startAt: toIso(plain.startAt),
    endAt: toIso(plain.endAt),
    allDay: Boolean(plain.allDay),
    location: plain.location ?? '',
    metadata: safeJsonObject(plain.metadata, {}),
    createdAt: toIso(plain.createdAt),
    updatedAt: toIso(plain.updatedAt),
  };
};

ProjectRoleDefinition.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    projectId: plain.projectId,
    name: plain.name,
    description: plain.description ?? '',
    seatLimit: plain.seatLimit,
    permissions: safeJsonObject(plain.permissions, {}),
    createdAt: toIso(plain.createdAt),
    updatedAt: toIso(plain.updatedAt),
  };
};

ProjectRoleAssignment.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    roleId: plain.roleId,
    collaboratorId: plain.collaboratorId ?? null,
    collaboratorName: plain.collaboratorName,
    collaboratorEmail: plain.collaboratorEmail ?? '',
    status: plain.status,
    createdAt: toIso(plain.createdAt),
    updatedAt: toIso(plain.updatedAt),
  };
};

ProjectSubmission.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    projectId: plain.projectId,
    title: plain.title,
    description: plain.description ?? '',
    status: plain.status,
    submittedAt: toIso(plain.submittedAt),
    submissionUrl: plain.submissionUrl ?? '',
    notes: plain.notes ?? '',
    createdAt: toIso(plain.createdAt),
    updatedAt: toIso(plain.updatedAt),
  };
};

ProjectFile.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    projectId: plain.projectId,
    label: plain.label,
    storageUrl: plain.storageUrl,
    sizeBytes: plain.sizeBytes,
    fileType: plain.fileType ?? '',
    uploadedBy: plain.uploadedBy ?? '',
    visibility: plain.visibility,
    metadata: safeJsonObject(plain.metadata, {}),
    createdAt: toIso(plain.createdAt),
    updatedAt: toIso(plain.updatedAt),
  };
};

ProjectInvitation.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    projectId: plain.projectId,
    email: plain.email,
    role: plain.role,
    status: plain.status,
    token: plain.token ?? null,
    invitedBy: plain.invitedBy ?? null,
    expiresAt: toIso(plain.expiresAt),
    metadata: safeJsonObject(plain.metadata, {}),
    createdAt: toIso(plain.createdAt),
    updatedAt: toIso(plain.updatedAt),
  };
};

ProjectHrRecord.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    projectId: plain.projectId,
    fullName: plain.fullName,
    position: plain.position,
    status: plain.status,
    startDate: toIso(plain.startDate),
    endDate: toIso(plain.endDate),
    compensation: plain.compensation == null ? null : Number(plain.compensation),
    allocationPercent: plain.allocationPercent == null ? null : Number(plain.allocationPercent),
    metadata: safeJsonObject(plain.metadata, {}),
    createdAt: toIso(plain.createdAt),
    updatedAt: toIso(plain.updatedAt),
  };
};

ProjectWorkspace.prototype.toDashboardSummary = function toDashboardSummary({
  includeRisks = false,
} = {}) {
  const plain = this.get({ plain: true });
  const summary = {
    id: plain.id,
    projectId: plain.projectId,
    status: plain.status,
    progressPercent: Number(plain.progressPercent ?? 0),
    riskLevel: plain.riskLevel,
    nextMilestone: plain.nextMilestone ?? '',
    nextMilestoneDueAt: toIso(plain.nextMilestoneDueAt),
    notes: plain.notes ?? '',
    metrics: safeJsonObject(plain.metrics, {}),
    createdAt: toIso(plain.createdAt),
    updatedAt: toIso(plain.updatedAt),
  };

  if (includeRisks) {
    summary.metrics = {
      ...summary.metrics,
      outstandingDeliverables: summary.metrics?.outstandingDeliverables ?? 0,
      blockedTasks: summary.metrics?.blockedTasks ?? 0,
    };
  }

  return summary;
};

ProjectWorkspace.prototype.recalculateProgressFromTasks = async function recalculateProgressFromTasks(
  { transaction } = {},
) {
  const totalTasks = await ProjectTask.count({ where: { projectId: this.projectId }, transaction });
  if (totalTasks === 0) {
    this.progressPercent = 0;
    await this.save({ transaction });
    return this;
  }

  const completedTasks = await ProjectTask.count({
    where: { projectId: this.projectId, status: 'completed' },
    transaction,
  });

  this.progressPercent = Number(((completedTasks / totalTasks) * 100).toFixed(2));
  await this.save({ transaction });
  return this;
};

Project.hasMany(ProjectBudgetLine, { as: 'budgetLines', foreignKey: 'projectId', onDelete: 'CASCADE' });
ProjectBudgetLine.belongsTo(Project, { foreignKey: 'projectId' });

Project.hasMany(ProjectDeliverable, { as: 'deliverables', foreignKey: 'projectId', onDelete: 'CASCADE' });
ProjectDeliverable.belongsTo(Project, { foreignKey: 'projectId' });

Project.hasMany(ProjectTask, { as: 'tasks', foreignKey: 'projectId', onDelete: 'CASCADE' });
ProjectTask.belongsTo(Project, { foreignKey: 'projectId' });

ProjectTask.hasMany(ProjectTaskAssignment, { as: 'assignments', foreignKey: 'taskId', onDelete: 'CASCADE' });
ProjectTaskAssignment.belongsTo(ProjectTask, { foreignKey: 'taskId' });

ProjectTask.hasMany(ProjectTaskDependency, { as: 'dependencies', foreignKey: 'taskId', onDelete: 'CASCADE' });
ProjectTaskDependency.belongsTo(ProjectTask, { foreignKey: 'taskId' });
ProjectTaskDependency.belongsTo(ProjectTask, { as: 'prerequisite', foreignKey: 'dependsOnTaskId' });

Project.hasMany(ProjectChatChannel, { as: 'chatChannels', foreignKey: 'projectId', onDelete: 'CASCADE' });
ProjectChatChannel.belongsTo(Project, { foreignKey: 'projectId' });

ProjectChatChannel.hasMany(ProjectChatMessage, { as: 'messages', foreignKey: 'channelId', onDelete: 'CASCADE' });
ProjectChatMessage.belongsTo(ProjectChatChannel, { foreignKey: 'channelId' });

Project.hasMany(ProjectTimelineEntry, { as: 'timelineEntries', foreignKey: 'projectId', onDelete: 'CASCADE' });
ProjectTimelineEntry.belongsTo(Project, { foreignKey: 'projectId' });

Project.hasMany(ProjectMeeting, { as: 'meetings', foreignKey: 'projectId', onDelete: 'CASCADE' });
ProjectMeeting.belongsTo(Project, { foreignKey: 'projectId' });

ProjectMeeting.hasMany(ProjectMeetingAttendee, { as: 'attendees', foreignKey: 'meetingId', onDelete: 'CASCADE' });
ProjectMeetingAttendee.belongsTo(ProjectMeeting, { foreignKey: 'meetingId' });

Project.hasMany(ProjectCalendarEvent, { as: 'calendarEvents', foreignKey: 'projectId', onDelete: 'CASCADE' });
ProjectCalendarEvent.belongsTo(Project, { foreignKey: 'projectId' });

Project.hasMany(ProjectRoleDefinition, { as: 'roleDefinitions', foreignKey: 'projectId', onDelete: 'CASCADE' });
ProjectRoleDefinition.belongsTo(Project, { foreignKey: 'projectId' });

ProjectRoleDefinition.hasMany(ProjectRoleAssignment, { as: 'assignments', foreignKey: 'roleId', onDelete: 'CASCADE' });
ProjectRoleAssignment.belongsTo(ProjectRoleDefinition, { foreignKey: 'roleId' });

Project.hasMany(ProjectSubmission, { as: 'submissions', foreignKey: 'projectId', onDelete: 'CASCADE' });
ProjectSubmission.belongsTo(Project, { foreignKey: 'projectId' });

Project.hasMany(ProjectFile, { as: 'files', foreignKey: 'projectId', onDelete: 'CASCADE' });
ProjectFile.belongsTo(Project, { foreignKey: 'projectId' });

Project.hasMany(ProjectHrRecord, { as: 'hrRecords', foreignKey: 'projectId', onDelete: 'CASCADE' });
ProjectHrRecord.belongsTo(Project, { foreignKey: 'projectId' });

ProjectWorkspace.hasMany(ProjectTimelineEntry, { as: 'workspaceTimeline', foreignKey: 'workspaceId', onDelete: 'CASCADE' });
ProjectTimelineEntry.belongsTo(ProjectWorkspace, { foreignKey: 'workspaceId' });

ProjectCollaborator.hasMany(ProjectRoleAssignment, { as: 'roleAssignments', foreignKey: 'collaboratorId' });
ProjectRoleAssignment.belongsTo(ProjectCollaborator, { foreignKey: 'collaboratorId' });

export async function syncProjectWorkspaceModels(options = {}) {
  await projectGigManagementSequelize.sync({ alter: false, ...options });
}

export default {
  ProjectBudgetLine,
  ProjectDeliverable,
  ProjectTask,
  ProjectTaskAssignment,
  ProjectTaskDependency,
  ProjectChatChannel,
  ProjectChatMessage,
  ProjectTimelineEntry,
  ProjectMeeting,
  ProjectMeetingAttendee,
  ProjectCalendarEvent,
  ProjectRoleDefinition,
  ProjectRoleAssignment,
  ProjectSubmission,
  ProjectFile,
  ProjectInvitation,
  ProjectHrRecord,
  syncProjectWorkspaceModels,
};
