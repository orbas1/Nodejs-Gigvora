import { DataTypes, Op } from 'sequelize';
import sequelize from './sequelizeClient.js';

export { sequelize } from './sequelizeClient.js';

export const MESSAGE_CHANNEL_TYPES = ['support', 'project', 'contract', 'group', 'direct'];
export const MESSAGE_THREAD_STATES = ['active', 'archived', 'locked'];
export const MESSAGE_TYPES = ['text', 'file', 'system', 'event'];
export const SUPPORT_CASE_STATUSES = ['triage', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'];
export const SUPPORT_CASE_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const User = sequelize.define(
  'User',
  {
    firstName: { type: DataTypes.STRING(120), allowNull: false },
    lastName: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
    password: { type: DataTypes.STRING(255), allowNull: false },
    address: { type: DataTypes.STRING(255), allowNull: true },
    age: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 13 } },
    userType: {
      type: DataTypes.ENUM('user', 'company', 'freelancer', 'agency', 'admin'),
      allowNull: false,
      defaultValue: 'user',
    },
  },
  {
    tableName: 'users',
    indexes: [{ fields: ['email'] }],
  },
);

export const MessageThread = sequelize.define(
  'MessageThread',
  {
    subject: { type: DataTypes.STRING(255), allowNull: true },
    channelType: {
      type: DataTypes.ENUM(...MESSAGE_CHANNEL_TYPES),
      allowNull: false,
      defaultValue: 'direct',
      validate: { isIn: [MESSAGE_CHANNEL_TYPES] },
    },
    state: {
      type: DataTypes.ENUM(...MESSAGE_THREAD_STATES),
      allowNull: false,
      defaultValue: 'active',
      validate: { isIn: [MESSAGE_THREAD_STATES] },
    },
    createdBy: { type: DataTypes.INTEGER, allowNull: false },
    metadata: { type: jsonType, allowNull: true },
    lastMessageAt: { type: DataTypes.DATE, allowNull: true },
    lastMessagePreview: { type: DataTypes.STRING(500), allowNull: true },
  },
  {
    tableName: 'message_threads',
    indexes: [
      { fields: ['channelType'] },
      { fields: ['state'] },
      { fields: ['createdBy'] },
      { fields: ['lastMessageAt'] },
    ],
  },
);

MessageThread.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    subject: plain.subject,
    channelType: plain.channelType,
    state: plain.state,
    createdBy: plain.createdBy,
    metadata: plain.metadata,
    lastMessageAt: plain.lastMessageAt,
    lastMessagePreview: plain.lastMessagePreview,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

MessageThread.searchByTerm = async function searchByTerm(term) {
  if (!term) return [];
  const normalized = term.trim();
  if (!normalized) return [];

  return MessageThread.findAll({
    where: { subject: { [Op.iLike ?? Op.like]: `%${normalized}%` } },
    limit: 20,
    order: [['subject', 'ASC']],
  });
};

export const MessageParticipant = sequelize.define(
  'MessageParticipant',
  {
    threadId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    role: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'participant' },
    notificationsEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    mutedUntil: { type: DataTypes.DATE, allowNull: true },
    lastReadAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'message_participants',
    indexes: [
      { unique: true, fields: ['threadId', 'userId'] },
      { fields: ['userId'] },
      { fields: ['threadId'] },
    ],
  },
);

export const Message = sequelize.define(
  'Message',
  {
    threadId: { type: DataTypes.INTEGER, allowNull: false },
    senderId: { type: DataTypes.INTEGER, allowNull: true },
    messageType: {
      type: DataTypes.ENUM(...MESSAGE_TYPES),
      allowNull: false,
      defaultValue: 'text',
      validate: { isIn: [MESSAGE_TYPES] },
    },
    body: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    deliveredAt: { type: DataTypes.DATE, allowNull: true },
    readAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'messages',
    indexes: [
      { fields: ['threadId', 'createdAt'] },
      { fields: ['senderId'] },
      { fields: ['messageType'] },
    ],
  },
);

Message.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    threadId: plain.threadId,
    senderId: plain.senderId,
    messageType: plain.messageType,
    body: plain.body,
    metadata: plain.metadata,
    deliveredAt: plain.deliveredAt,
    readAt: plain.readAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const MessageAttachment = sequelize.define(
  'MessageAttachment',
  {
    messageId: { type: DataTypes.INTEGER, allowNull: false },
    fileName: { type: DataTypes.STRING(255), allowNull: false },
    mimeType: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'application/octet-stream' },
    fileSize: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    storageKey: { type: DataTypes.STRING(255), allowNull: false },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'message_attachments',
    indexes: [{ fields: ['messageId'] }],
  },
);

export const SupportCase = sequelize.define(
  'SupportCase',
  {
    threadId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    status: {
      type: DataTypes.ENUM(...SUPPORT_CASE_STATUSES),
      allowNull: false,
      defaultValue: 'triage',
      validate: { isIn: [SUPPORT_CASE_STATUSES] },
    },
    priority: {
      type: DataTypes.ENUM(...SUPPORT_CASE_PRIORITIES),
      allowNull: false,
      defaultValue: 'medium',
      validate: { isIn: [SUPPORT_CASE_PRIORITIES] },
    },
    reason: { type: DataTypes.STRING(255), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    escalatedBy: { type: DataTypes.INTEGER, allowNull: true },
    escalatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    assignedTo: { type: DataTypes.INTEGER, allowNull: true },
    assignedBy: { type: DataTypes.INTEGER, allowNull: true },
    assignedAt: { type: DataTypes.DATE, allowNull: true },
    firstResponseAt: { type: DataTypes.DATE, allowNull: true },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
    resolvedBy: { type: DataTypes.INTEGER, allowNull: true },
    resolutionSummary: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'support_cases',
    indexes: [
      { fields: ['status'] },
      { fields: ['priority'] },
      { fields: ['assignedTo'] },
    ],
  },
);

SupportCase.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    threadId: plain.threadId,
    status: plain.status,
    priority: plain.priority,
    reason: plain.reason,
    metadata: plain.metadata,
    escalatedBy: plain.escalatedBy,
    escalatedAt: plain.escalatedAt,
    assignedTo: plain.assignedTo,
    assignedBy: plain.assignedBy,
    assignedAt: plain.assignedAt,
    firstResponseAt: plain.firstResponseAt,
    resolvedAt: plain.resolvedAt,
    resolvedBy: plain.resolvedBy,
    resolutionSummary: plain.resolutionSummary,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

MessageThread.hasMany(MessageParticipant, { as: 'participants', foreignKey: 'threadId' });
MessageThread.hasMany(MessageParticipant, { as: 'viewerParticipants', foreignKey: 'threadId' });
MessageParticipant.belongsTo(MessageThread, { as: 'thread', foreignKey: 'threadId' });
MessageParticipant.belongsTo(User, { as: 'user', foreignKey: 'userId' });

MessageThread.hasMany(Message, { as: 'messages', foreignKey: 'threadId' });
Message.belongsTo(MessageThread, { as: 'thread', foreignKey: 'threadId' });
Message.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });

Message.hasMany(MessageAttachment, { as: 'attachments', foreignKey: 'messageId' });
MessageAttachment.belongsTo(Message, { as: 'message', foreignKey: 'messageId' });

MessageThread.hasOne(SupportCase, { as: 'supportCase', foreignKey: 'threadId' });
SupportCase.belongsTo(MessageThread, { as: 'thread', foreignKey: 'threadId' });
SupportCase.belongsTo(User, { as: 'escalatedByUser', foreignKey: 'escalatedBy' });
SupportCase.belongsTo(User, { as: 'assignedAgent', foreignKey: 'assignedTo' });
SupportCase.belongsTo(User, { as: 'assignedByUser', foreignKey: 'assignedBy' });
SupportCase.belongsTo(User, { as: 'resolvedByUser', foreignKey: 'resolvedBy' });

export default {
  sequelize,
  MESSAGE_CHANNEL_TYPES,
  MESSAGE_THREAD_STATES,
  MESSAGE_TYPES,
  SUPPORT_CASE_STATUSES,
  SUPPORT_CASE_PRIORITIES,
  User,
  MessageThread,
  MessageParticipant,
  Message,
  MessageAttachment,
  SupportCase,
};
