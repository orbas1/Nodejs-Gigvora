import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

export { sequelize } from './sequelizeClient.js';

const jsonType = ['postgres', 'postgresql'].includes(sequelize.getDialect()) ? DataTypes.JSONB : DataTypes.JSON;

function ensureModel(name, attributes, options = {}) {
  if (sequelize.models[name]) {
    return sequelize.models[name];
  }
  return sequelize.define(name, attributes, options);
}

export const SupportPlaybook = ensureModel(
  'SupportPlaybook',
  {
    slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: true },
    stage: { type: DataTypes.STRING(60), allowNull: true },
    persona: { type: DataTypes.STRING(80), allowNull: true },
    channel: { type: DataTypes.STRING(80), allowNull: true },
    csatImpact: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'support_playbooks' },
);

export const SupportPlaybookStep = ensureModel(
  'SupportPlaybookStep',
  {
    playbookId: { type: DataTypes.INTEGER, allowNull: false },
    stepNumber: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    instructions: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'support_playbook_steps' },
);

export const FreelancerTimelinePost = ensureModel(
  'FreelancerTimelinePost',
  {
    freelancerId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    status: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'draft' },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    scheduledAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'freelancer_timeline_posts' },
);

export const CompanyTimelinePost = ensureModel(
  'CompanyTimelinePost',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    authorId: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    status: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'draft' },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    scheduledFor: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'company_timeline_posts' },
);

export const AdminTimelineEvent = ensureModel(
  'AdminTimelineEvent',
  {
    timelineId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    status: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'planned' },
    startDate: { type: DataTypes.DATE, allowNull: true },
    endDate: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'admin_timeline_events' },
);

export const AnalyticsEvent = ensureModel(
  'AnalyticsEvent',
  {
    eventName: { type: DataTypes.STRING(255), allowNull: false },
    occurredAt: { type: DataTypes.DATE, allowNull: false },
    ingestedAt: { type: DataTypes.DATE, allowNull: true },
    actorType: { type: DataTypes.STRING(80), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'analytics_events' },
);

export const UserEvent = ensureModel(
  'UserEvent',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    status: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'planned' },
    format: { type: DataTypes.STRING(60), allowNull: true },
    visibility: { type: DataTypes.STRING(60), allowNull: true },
    startAt: { type: DataTypes.DATE, allowNull: false },
    endAt: { type: DataTypes.DATE, allowNull: true },
    capacity: { type: DataTypes.INTEGER, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'user_events' },
);

export const UserEventGuest = ensureModel(
  'UserEventGuest',
  {
    eventId: { type: DataTypes.INTEGER, allowNull: false },
    fullName: { type: DataTypes.STRING(255), allowNull: false },
    seatsReserved: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    status: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'invited' },
  },
  { tableName: 'user_event_guests' },
);

export const UserEventTask = ensureModel(
  'UserEventTask',
  {
    eventId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    status: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'open' },
    priority: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'medium' },
    dueAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'user_event_tasks' },
);

export default {
  SupportPlaybook,
  SupportPlaybookStep,
  FreelancerTimelinePost,
  CompanyTimelinePost,
  AdminTimelineEvent,
  AnalyticsEvent,
  UserEvent,
  UserEventGuest,
  UserEventTask,
};
