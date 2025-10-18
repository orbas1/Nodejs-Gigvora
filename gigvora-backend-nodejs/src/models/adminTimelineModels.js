import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const ADMIN_TIMELINE_STATUSES = Object.freeze(['draft', 'active', 'archived']);
export const ADMIN_TIMELINE_VISIBILITIES = Object.freeze(['internal', 'partners', 'public']);
export const ADMIN_TIMELINE_EVENT_STATUSES = Object.freeze(['planned', 'in_progress', 'blocked', 'complete']);
export const ADMIN_TIMELINE_EVENT_TYPES = Object.freeze(['milestone', 'announcement', 'release', 'checkpoint', 'handoff']);

export const AdminTimeline = sequelize.define(
  'AdminTimeline',
  {
    name: { type: DataTypes.STRING(200), allowNull: false },
    slug: { type: DataTypes.STRING(220), allowNull: false, unique: true },
    summary: { type: DataTypes.STRING(400), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    timelineType: { type: DataTypes.STRING(80), allowNull: true },
    status: {
      type: DataTypes.ENUM(...ADMIN_TIMELINE_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
    },
    visibility: {
      type: DataTypes.ENUM(...ADMIN_TIMELINE_VISIBILITIES),
      allowNull: false,
      defaultValue: 'internal',
    },
    startDate: { type: DataTypes.DATE, allowNull: true },
    endDate: { type: DataTypes.DATE, allowNull: true },
    heroImageUrl: { type: DataTypes.STRING(500), allowNull: true },
    thumbnailUrl: { type: DataTypes.STRING(500), allowNull: true },
    tags: { type: jsonType, allowNull: false, defaultValue: [] },
    settings: { type: jsonType, allowNull: false, defaultValue: {} },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
    updatedBy: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'admin_timelines',
    indexes: [
      { unique: true, fields: ['slug'] },
      { fields: ['status'] },
      { fields: ['visibility'] },
      { fields: ['timelineType'] },
    ],
  },
);

AdminTimeline.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const creator = this.get?.('creator') ?? null;
  const updater = this.get?.('updater') ?? null;
  const events = Array.isArray(this.get?.('events')) ? this.get('events') : plain.events ?? [];

  return {
    id: plain.id,
    name: plain.name,
    slug: plain.slug,
    summary: plain.summary ?? null,
    description: plain.description ?? null,
    timelineType: plain.timelineType ?? null,
    status: plain.status,
    visibility: plain.visibility,
    startDate: plain.startDate ?? null,
    endDate: plain.endDate ?? null,
    heroImageUrl: plain.heroImageUrl ?? null,
    thumbnailUrl: plain.thumbnailUrl ?? null,
    tags: Array.isArray(plain.tags) ? plain.tags : [],
    settings: plain.settings ?? {},
    createdBy: plain.createdBy ?? null,
    updatedBy: plain.updatedBy ?? null,
    creator: creator
      ? {
          id: creator.id,
          firstName: creator.firstName,
          lastName: creator.lastName,
          email: creator.email,
        }
      : null,
    updater: updater
      ? {
          id: updater.id,
          firstName: updater.firstName,
          lastName: updater.lastName,
          email: updater.email,
        }
      : null,
    events: events.map((event) =>
      typeof event?.toPublicObject === 'function' ? event.toPublicObject() : event,
    ),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const AdminTimelineEvent = sequelize.define(
  'AdminTimelineEvent',
  {
    timelineId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    summary: { type: DataTypes.STRING(500), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    eventType: {
      type: DataTypes.ENUM(...ADMIN_TIMELINE_EVENT_TYPES),
      allowNull: false,
      defaultValue: 'milestone',
    },
    status: {
      type: DataTypes.ENUM(...ADMIN_TIMELINE_EVENT_STATUSES),
      allowNull: false,
      defaultValue: 'planned',
    },
    startDate: { type: DataTypes.DATE, allowNull: true },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    endDate: { type: DataTypes.DATE, allowNull: true },
    ownerId: { type: DataTypes.INTEGER, allowNull: true },
    ownerName: { type: DataTypes.STRING(160), allowNull: true },
    ownerEmail: { type: DataTypes.STRING(160), allowNull: true },
    location: { type: DataTypes.STRING(160), allowNull: true },
    ctaLabel: { type: DataTypes.STRING(80), allowNull: true },
    ctaUrl: { type: DataTypes.STRING(500), allowNull: true },
    tags: { type: jsonType, allowNull: false, defaultValue: [] },
    attachments: { type: jsonType, allowNull: false, defaultValue: [] },
    orderIndex: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  {
    tableName: 'admin_timeline_events',
    indexes: [
      { fields: ['timelineId'] },
      { fields: ['timelineId', 'orderIndex'] },
      { fields: ['status'] },
      { fields: ['eventType'] },
    ],
  },
);

AdminTimelineEvent.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    timelineId: plain.timelineId,
    title: plain.title,
    summary: plain.summary ?? null,
    description: plain.description ?? null,
    eventType: plain.eventType,
    status: plain.status,
    startDate: plain.startDate ?? null,
    dueDate: plain.dueDate ?? null,
    endDate: plain.endDate ?? null,
    ownerId: plain.ownerId ?? null,
    ownerName: plain.ownerName ?? null,
    ownerEmail: plain.ownerEmail ?? null,
    location: plain.location ?? null,
    ctaLabel: plain.ctaLabel ?? null,
    ctaUrl: plain.ctaUrl ?? null,
    tags: Array.isArray(plain.tags) ? plain.tags : [],
    attachments: Array.isArray(plain.attachments) ? plain.attachments : [],
    orderIndex: plain.orderIndex ?? 0,
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export function registerAdminTimelineAssociations({ User }) {
  AdminTimeline.hasMany(AdminTimelineEvent, {
    as: 'events',
    foreignKey: 'timelineId',
    onDelete: 'CASCADE',
    hooks: true,
  });

  AdminTimelineEvent.belongsTo(AdminTimeline, { as: 'timeline', foreignKey: 'timelineId' });

  AdminTimeline.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
  AdminTimeline.belongsTo(User, { as: 'updater', foreignKey: 'updatedBy' });
}
