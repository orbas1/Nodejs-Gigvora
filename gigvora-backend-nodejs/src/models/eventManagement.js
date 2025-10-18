import { DataTypes } from 'sequelize';
import sequelizeClient from './sequelizeClient.js';
import { buildLocationDetails } from '../utils/location.js';

const sequelize = sequelizeClient;
const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const USER_EVENT_STATUSES = [
  'draft',
  'planned',
  'registration_open',
  'in_progress',
  'completed',
  'cancelled',
  'archived',
];

export const USER_EVENT_FORMATS = ['virtual', 'in_person', 'hybrid'];
export const USER_EVENT_VISIBILITIES = ['private', 'invite_only', 'public'];
export const USER_EVENT_TASK_STATUSES = ['todo', 'in_progress', 'blocked', 'done'];
export const USER_EVENT_TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'];
export const USER_EVENT_GUEST_STATUSES = ['invited', 'confirmed', 'waitlisted', 'declined', 'checked_in'];
export const USER_EVENT_BUDGET_STATUSES = ['planned', 'committed', 'invoiced', 'paid', 'cancelled'];
export const USER_EVENT_ASSET_TYPES = ['image', 'document', 'presentation', 'video', 'link'];
export const USER_EVENT_ASSET_VISIBILITIES = ['internal', 'shared', 'public'];

export const UserEvent = sequelize.define(
  'UserEvent',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(180), allowNull: false },
    slug: { type: DataTypes.STRING(200), allowNull: true, unique: true },
    status: { type: DataTypes.ENUM(...USER_EVENT_STATUSES), allowNull: false, defaultValue: 'draft' },
    format: { type: DataTypes.ENUM(...USER_EVENT_FORMATS), allowNull: false, defaultValue: 'virtual' },
    visibility: { type: DataTypes.ENUM(...USER_EVENT_VISIBILITIES), allowNull: false, defaultValue: 'invite_only' },
    timezone: { type: DataTypes.STRING(60), allowNull: true },
    locationLabel: { type: DataTypes.STRING(255), allowNull: true },
    locationAddress: { type: DataTypes.STRING(255), allowNull: true },
    locationDetails: { type: jsonType, allowNull: true },
    startAt: { type: DataTypes.DATE, allowNull: true },
    endAt: { type: DataTypes.DATE, allowNull: true },
    registrationOpensAt: { type: DataTypes.DATE, allowNull: true },
    registrationClosesAt: { type: DataTypes.DATE, allowNull: true },
    capacity: { type: DataTypes.INTEGER, allowNull: true },
    registrationUrl: { type: DataTypes.STRING(255), allowNull: true },
    streamingUrl: { type: DataTypes.STRING(255), allowNull: true },
    bannerImageUrl: { type: DataTypes.STRING(255), allowNull: true },
    contactEmail: { type: DataTypes.STRING(180), allowNull: true },
    targetAudience: { type: DataTypes.STRING(255), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    goals: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'user_events',
    indexes: [
      { fields: ['ownerId'] },
      { fields: ['status'] },
      { fields: ['startAt'] },
    ],
  },
);

export const UserEventAgendaItem = sequelize.define(
  'UserEventAgendaItem',
  {
    eventId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    startAt: { type: DataTypes.DATE, allowNull: true },
    endAt: { type: DataTypes.DATE, allowNull: true },
    ownerName: { type: DataTypes.STRING(180), allowNull: true },
    ownerEmail: { type: DataTypes.STRING(180), allowNull: true },
    location: { type: DataTypes.STRING(180), allowNull: true },
    orderIndex: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'user_event_agenda_items', indexes: [{ fields: ['eventId'] }, { fields: ['startAt'] }] },
);

export const UserEventTask = sequelize.define(
  'UserEventTask',
  {
    eventId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    status: { type: DataTypes.ENUM(...USER_EVENT_TASK_STATUSES), allowNull: false, defaultValue: 'todo' },
    priority: { type: DataTypes.ENUM(...USER_EVENT_TASK_PRIORITIES), allowNull: false, defaultValue: 'medium' },
    ownerName: { type: DataTypes.STRING(180), allowNull: true },
    ownerEmail: { type: DataTypes.STRING(180), allowNull: true },
    assigneeId: { type: DataTypes.INTEGER, allowNull: true },
    dueAt: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'user_event_tasks', indexes: [{ fields: ['eventId'] }, { fields: ['status'] }, { fields: ['dueAt'] }] },
);

export const UserEventGuest = sequelize.define(
  'UserEventGuest',
  {
    eventId: { type: DataTypes.INTEGER, allowNull: false },
    fullName: { type: DataTypes.STRING(200), allowNull: false },
    email: { type: DataTypes.STRING(200), allowNull: true },
    company: { type: DataTypes.STRING(180), allowNull: true },
    role: { type: DataTypes.STRING(160), allowNull: true },
    ticketType: { type: DataTypes.STRING(120), allowNull: true },
    status: { type: DataTypes.ENUM(...USER_EVENT_GUEST_STATUSES), allowNull: false, defaultValue: 'invited' },
    seatsReserved: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    checkedInAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'user_event_guests', indexes: [{ fields: ['eventId'] }, { fields: ['status'] }, { fields: ['email'] }] },
);

export const UserEventBudgetItem = sequelize.define(
  'UserEventBudgetItem',
  {
    eventId: { type: DataTypes.INTEGER, allowNull: false },
    category: { type: DataTypes.STRING(160), allowNull: false },
    vendorName: { type: DataTypes.STRING(180), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    amountPlanned: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    amountActual: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING(6), allowNull: false, defaultValue: 'USD' },
    status: { type: DataTypes.ENUM(...USER_EVENT_BUDGET_STATUSES), allowNull: false, defaultValue: 'planned' },
    notes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'user_event_budget_items',
    indexes: [
      { fields: ['eventId'] },
      { fields: ['category'] },
      { fields: ['status'] },
    ],
  },
);

export const UserEventAsset = sequelize.define(
  'UserEventAsset',
  {
    eventId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(200), allowNull: false },
    assetType: { type: DataTypes.ENUM(...USER_EVENT_ASSET_TYPES), allowNull: false, defaultValue: 'image' },
    url: { type: DataTypes.STRING(255), allowNull: false },
    thumbnailUrl: { type: DataTypes.STRING(255), allowNull: true },
    visibility: { type: DataTypes.ENUM(...USER_EVENT_ASSET_VISIBILITIES), allowNull: false, defaultValue: 'internal' },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'user_event_assets', indexes: [{ fields: ['eventId'] }, { fields: ['assetType'] }] },
);

export const UserEventChecklistItem = sequelize.define(
  'UserEventChecklistItem',
  {
    eventId: { type: DataTypes.INTEGER, allowNull: false },
    label: { type: DataTypes.STRING(200), allowNull: false },
    isComplete: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    ownerName: { type: DataTypes.STRING(180), allowNull: true },
    dueAt: { type: DataTypes.DATE, allowNull: true },
    orderIndex: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    metadata: { type: jsonType, allowNull: true },
  },
  { tableName: 'user_event_checklist_items', indexes: [{ fields: ['eventId'] }, { fields: ['isComplete'] }] },
);

export function registerEventManagementAssociations({ User } = {}) {
  if (User) {
    User.hasMany(UserEvent, { as: 'events', foreignKey: 'ownerId' });
    UserEvent.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });
    UserEventTask.belongsTo(User, { as: 'assignee', foreignKey: 'assigneeId' });
  }

  UserEvent.hasMany(UserEventAgendaItem, { as: 'agenda', foreignKey: 'eventId', onDelete: 'CASCADE' });
  UserEventAgendaItem.belongsTo(UserEvent, { as: 'event', foreignKey: 'eventId' });

  UserEvent.hasMany(UserEventTask, { as: 'tasks', foreignKey: 'eventId', onDelete: 'CASCADE' });
  UserEventTask.belongsTo(UserEvent, { as: 'event', foreignKey: 'eventId' });

  UserEvent.hasMany(UserEventGuest, { as: 'guests', foreignKey: 'eventId', onDelete: 'CASCADE' });
  UserEventGuest.belongsTo(UserEvent, { as: 'event', foreignKey: 'eventId' });

  UserEvent.hasMany(UserEventBudgetItem, { as: 'budgetItems', foreignKey: 'eventId', onDelete: 'CASCADE' });
  UserEventBudgetItem.belongsTo(UserEvent, { as: 'event', foreignKey: 'eventId' });

  UserEvent.hasMany(UserEventAsset, { as: 'assets', foreignKey: 'eventId', onDelete: 'CASCADE' });
  UserEventAsset.belongsTo(UserEvent, { as: 'event', foreignKey: 'eventId' });

  UserEvent.hasMany(UserEventChecklistItem, { as: 'checklist', foreignKey: 'eventId', onDelete: 'CASCADE' });
  UserEventChecklistItem.belongsTo(UserEvent, { as: 'event', foreignKey: 'eventId' });
}

function pickDefined(value) {
  const entries = Object.entries(value).filter(([, v]) => v !== undefined);
  return Object.fromEntries(entries);
}

UserEvent.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const { locationDetails, ...rest } = plain;
  return {
    ...rest,
    locationDetails: buildLocationDetails(locationDetails ?? {
      label: plain.locationLabel,
      address: plain.locationAddress,
    }),
  };
};

UserEventAgendaItem.prototype.toPublicObject = function toPublicObject() {
  return this.get({ plain: true });
};

UserEventTask.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const assignee = this.get?.('assignee') ?? plain.assignee;
  return {
    ...plain,
    assignee: assignee
      ? pickDefined({
          id: assignee.id,
          firstName: assignee.firstName,
          lastName: assignee.lastName,
          email: assignee.email,
        })
      : null,
  };
};

UserEventGuest.prototype.toPublicObject = function toPublicObject() {
  return this.get({ plain: true });
};

UserEventBudgetItem.prototype.toPublicObject = function toPublicObject() {
  return this.get({ plain: true });
};

UserEventAsset.prototype.toPublicObject = function toPublicObject() {
  return this.get({ plain: true });
};

UserEventChecklistItem.prototype.toPublicObject = function toPublicObject() {
  return this.get({ plain: true });
};

export default {
  UserEvent,
  UserEventAgendaItem,
  UserEventTask,
  UserEventGuest,
  UserEventBudgetItem,
  UserEventAsset,
  UserEventChecklistItem,
  USER_EVENT_STATUSES,
  USER_EVENT_FORMATS,
  USER_EVENT_VISIBILITIES,
  USER_EVENT_TASK_STATUSES,
  USER_EVENT_TASK_PRIORITIES,
  USER_EVENT_GUEST_STATUSES,
  USER_EVENT_BUDGET_STATUSES,
  USER_EVENT_ASSET_TYPES,
  USER_EVENT_ASSET_VISIBILITIES,
  registerEventManagementAssociations,
};
