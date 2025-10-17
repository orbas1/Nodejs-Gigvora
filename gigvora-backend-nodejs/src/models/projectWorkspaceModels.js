import { DataTypes } from 'sequelize';
import {
  projectGigManagementSequelize,
  Project,
  ProjectWorkspace,
  ProjectCollaborator,
} from './projectGigManagementModels.js';

const dialect = projectGigManagementSequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const ProjectBudgetLine = projectGigManagementSequelize.define(
  'PgmProjectBudgetLine',
  {
    label: { type: DataTypes.STRING(180), allowNull: false },
    category: { type: DataTypes.STRING(80), allowNull: false },
    plannedAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    actualAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING(6), allowNull: false, defaultValue: 'USD' },
    status: {
      type: DataTypes.ENUM('planned', 'approved', 'in_progress', 'complete'),
      allowNull: false,
      defaultValue: 'planned',
    },
    ownerId: { type: DataTypes.INTEGER, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
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
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_project_deliverables', underscored: true },
);

export const ProjectTask = projectGigManagementSequelize.define(
  'PgmProjectTask',
  {
    title: { type: DataTypes.STRING(180), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM('backlog', 'in_progress', 'blocked', 'completed'),
      allowNull: false,
      defaultValue: 'backlog',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'medium',
    },
    startDate: { type: DataTypes.DATE, allowNull: true },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    estimatedHours: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
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
    metadata: { type: jsonType, allowNull: true },
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
    metadata: { type: jsonType, allowNull: true },
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
    metadata: { type: jsonType, allowNull: true },
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
    metadata: { type: jsonType, allowNull: true },
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
      type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'scheduled',
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
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_project_calendar_events', underscored: true },
);

export const ProjectRoleDefinition = projectGigManagementSequelize.define(
  'PgmProjectRoleDefinition',
  {
    name: { type: DataTypes.STRING(120), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    seatLimit: { type: DataTypes.INTEGER, allowNull: true },
    permissions: { type: jsonType, allowNull: true },
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
      type: DataTypes.ENUM('invited', 'active', 'inactive'),
      allowNull: false,
      defaultValue: 'invited',
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
      type: DataTypes.ENUM('draft', 'submitted', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'draft',
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
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_project_files', underscored: true },
);

export const ProjectInvitation = projectGigManagementSequelize.define(
  'PgmProjectInvitation',
  {
    email: { type: DataTypes.STRING(180), allowNull: false },
    role: { type: DataTypes.STRING(120), allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'declined', 'expired'),
      allowNull: false,
      defaultValue: 'pending',
    },
    token: { type: DataTypes.STRING(120), allowNull: true },
    invitedBy: { type: DataTypes.STRING(180), allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_project_invitations', underscored: true },
);

export const ProjectHrRecord = projectGigManagementSequelize.define(
  'PgmProjectHrRecord',
  {
    fullName: { type: DataTypes.STRING(180), allowNull: false },
    position: { type: DataTypes.STRING(120), allowNull: false },
    status: {
      type: DataTypes.ENUM('prospect', 'active', 'offboarded'),
      allowNull: false,
      defaultValue: 'prospect',
    },
    startDate: { type: DataTypes.DATE, allowNull: true },
    endDate: { type: DataTypes.DATE, allowNull: true },
    compensation: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    allocationPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'pgm_project_hr_records', underscored: true },
);

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

Project.hasMany(ProjectInvitation, { as: 'invitations', foreignKey: 'projectId', onDelete: 'CASCADE' });
ProjectInvitation.belongsTo(Project, { foreignKey: 'projectId' });

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
