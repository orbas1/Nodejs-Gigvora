import { DataTypes, Op } from 'sequelize';
import sequelize from './sequelizeClient.js';

export { sequelize } from './sequelizeClient.js';

export const MESSAGE_CHANNEL_TYPES = ['support', 'project', 'contract', 'group', 'direct'];
export const MESSAGE_THREAD_STATES = ['active', 'archived', 'locked'];
export const MESSAGE_TYPES = ['text', 'file', 'system', 'event'];
export const SUPPORT_CASE_STATUSES = ['triage', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'];
export const SUPPORT_CASE_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const AUTO_REPLY_TEMPLATE_STATUSES = ['draft', 'active', 'disabled'];
export const AUTO_REPLY_RUN_STATUSES = ['success', 'error', 'skipped'];

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

const TWO_FACTOR_METHODS = ['email', 'app', 'sms'];
const USER_STATUSES = ['invited', 'active', 'suspended', 'archived', 'deleted'];

export const User = sequelize.define(
  'User',
  {
    firstName: { type: DataTypes.STRING(120), allowNull: false },
    lastName: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
    password: { type: DataTypes.STRING(255), allowNull: false },
    address: { type: DataTypes.STRING(255), allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    geoLocation: { type: jsonType, allowNull: true },
    age: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 13 } },
    phoneNumber: { type: DataTypes.STRING(30), allowNull: true },
    jobTitle: { type: DataTypes.STRING(120), allowNull: true },
    avatarUrl: { type: DataTypes.STRING(2048), allowNull: true },
    status: {
      type: DataTypes.ENUM(...USER_STATUSES),
      allowNull: false,
      defaultValue: 'active',
      validate: { isIn: [USER_STATUSES] },
    },
    lastSeenAt: { type: DataTypes.DATE, allowNull: true },
    userType: {
      type: DataTypes.ENUM('user', 'company', 'freelancer', 'agency', 'admin'),
      allowNull: false,
      defaultValue: 'user',
    },
    twoFactorEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    twoFactorMethod: {
      type: DataTypes.ENUM(...TWO_FACTOR_METHODS),
      allowNull: false,
      defaultValue: 'email',
    },
    lastLoginAt: { type: DataTypes.DATE, allowNull: true },
    googleId: { type: DataTypes.STRING(255), allowNull: true },
    memberships: { type: jsonType, allowNull: false, defaultValue: [] },
    primaryDashboard: { type: DataTypes.STRING(60), allowNull: true },
  },
  {
    tableName: 'users',
    indexes: [
      { fields: ['email'] },
      { fields: ['status'] },
      { fields: ['userType'] },
    ],
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

  const dialect = sequelize.getDialect();
  const likeOperator = ['postgres', 'postgresql'].includes(dialect) ? Op.iLike : Op.like;

  return MessageThread.findAll({
    where: { subject: { [likeOperator]: `%${normalized}%` } },
    limit: 20,
    order: [['subject', 'ASC']],
  });
};

export const MessageParticipant = sequelize.define(
  'MessageParticipant',
  {
    threadId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    role: {
      type: DataTypes.ENUM('owner', 'participant', 'support', 'system'),
      allowNull: false,
      defaultValue: 'participant',
      validate: { isIn: [['owner', 'participant', 'support', 'system']] },
    },
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
    isEdited: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    editedAt: { type: DataTypes.DATE, allowNull: true },
    deletedAt: { type: DataTypes.DATE, allowNull: true },
    deliveredAt: { type: DataTypes.DATE, allowNull: true },
    readAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'messages',
    paranoid: true,
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
    isEdited: plain.isEdited,
    editedAt: plain.editedAt,
    deletedAt: plain.deletedAt,
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
    mimeType: { type: DataTypes.STRING(128), allowNull: false, defaultValue: 'application/octet-stream' },
    fileSize: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    storageKey: { type: DataTypes.STRING(512), allowNull: false },
    checksum: { type: DataTypes.STRING(128), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'message_attachments',
    indexes: [{ fields: ['messageId'] }],
  },
);

export const MessageReadReceipt = sequelize.define(
  'MessageReadReceipt',
  {
    messageId: { type: DataTypes.INTEGER, allowNull: false },
    participantId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    deliveredAt: { type: DataTypes.DATE, allowNull: true },
    readAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'message_read_receipts',
    indexes: [
      { unique: true, fields: ['messageId', 'participantId'] },
      { fields: ['participantId'] },
      { fields: ['userId'] },
      { fields: ['readAt'] },
    ],
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

export const MessageLabel = sequelize.define(
  'MessageLabel',
  {
    name: { type: DataTypes.STRING(120), allowNull: false },
    slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    color: { type: DataTypes.STRING(32), allowNull: false, defaultValue: '#2563eb' },
    description: { type: DataTypes.STRING(400), allowNull: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'message_labels',
    indexes: [
      { unique: true, fields: ['slug'] },
      { fields: ['createdBy'] },
    ],
  },
);

MessageLabel.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    name: plain.name,
    slug: plain.slug,
    color: plain.color,
    description: plain.description,
    createdBy: plain.createdBy,
    metadata: plain.metadata,
  };
};

export const SavedReply = sequelize.define(
  'SavedReply',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(160), allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    category: { type: DataTypes.STRING(80), allowNull: true },
    shortcut: { type: DataTypes.STRING(40), allowNull: true },
    isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    metadata: { type: jsonType, allowNull: true },
    orderIndex: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: 'saved_replies',
    indexes: [
      { fields: ['userId'] },
      { unique: true, fields: ['userId', 'shortcut'] },
      { fields: ['userId', 'isDefault'] },
    ],
  },
);

SavedReply.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    title: plain.title,
    body: plain.body,
    category: plain.category,
    shortcut: plain.shortcut,
    isDefault: Boolean(plain.isDefault),
    orderIndex: Number(plain.orderIndex ?? 0),
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const MessageThreadLabel = sequelize.define(
  'MessageThreadLabel',
  {
    threadId: { type: DataTypes.INTEGER, allowNull: false },
    labelId: { type: DataTypes.INTEGER, allowNull: false },
    appliedBy: { type: DataTypes.INTEGER, allowNull: true },
    appliedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'message_thread_labels',
    indexes: [
      { unique: true, fields: ['threadId', 'labelId'] },
      { fields: ['labelId'] },
      { fields: ['threadId'] },
    ],
  },
);

MessageThreadLabel.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    threadId: plain.threadId,
    labelId: plain.labelId,
    appliedBy: plain.appliedBy,
    appliedAt: plain.appliedAt,
    metadata: plain.metadata,
  };
};

export const InboxPreference = sequelize.define(
  'InboxPreference',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    timezone: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'UTC' },
    workingHours: { type: jsonType, allowNull: true },
    notificationsEmail: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    notificationsPush: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    autoArchiveAfterDays: { type: DataTypes.INTEGER, allowNull: true },
    autoResponderEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    autoResponderMessage: { type: DataTypes.TEXT, allowNull: true },
    escalationKeywords: { type: jsonType, allowNull: true },
    defaultSavedReplyId: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'inbox_preferences',
    indexes: [
      { unique: true, fields: ['userId'] },
    ],
  },
);

InboxPreference.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    timezone: plain.timezone,
    workingHours: plain.workingHours ?? null,
    notificationsEmail: Boolean(plain.notificationsEmail),
    notificationsPush: Boolean(plain.notificationsPush),
    autoArchiveAfterDays:
      plain.autoArchiveAfterDays != null ? Number(plain.autoArchiveAfterDays) : null,
    autoResponderEnabled: Boolean(plain.autoResponderEnabled),
    autoResponderMessage: plain.autoResponderMessage ?? null,
    escalationKeywords: plain.escalationKeywords ?? null,
    defaultSavedReplyId: plain.defaultSavedReplyId ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const InboxRoutingRule = sequelize.define(
  'InboxRoutingRule',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    matchType: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'keyword' },
    criteria: { type: jsonType, allowNull: true },
    action: { type: jsonType, allowNull: true },
    enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    stopProcessing: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    priority: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: 'inbox_routing_rules',
    indexes: [
      { fields: ['userId'] },
      { fields: ['userId', 'enabled'] },
      { fields: ['userId', 'priority'] },
    ],
  },
);

InboxRoutingRule.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    name: plain.name,
    description: plain.description ?? null,
    matchType: plain.matchType,
    criteria: plain.criteria ?? null,
    action: plain.action ?? null,
    enabled: Boolean(plain.enabled),
    stopProcessing: Boolean(plain.stopProcessing),
    priority: Number(plain.priority ?? 0),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const UserAiProviderSetting = sequelize.define(
  'UserAiProviderSetting',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    provider: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'openai' },
    apiKey: { type: DataTypes.STRING(255), allowNull: true },
    model: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'gpt-4o-mini' },
    autoReplyEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    autoReplyInstructions: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'user_ai_provider_settings',
    indexes: [
      { unique: true, fields: ['userId', 'provider'] },
      { fields: ['provider'] },
      { fields: ['autoReplyEnabled'] },
    ],
  },
);

UserAiProviderSetting.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    provider: plain.provider,
    model: plain.model,
    autoReplyEnabled: Boolean(plain.autoReplyEnabled),
    autoReplyInstructions: plain.autoReplyInstructions ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const AiAutoReplyTemplate = sequelize.define(
  'AiAutoReplyTemplate',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: true },
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(120), allowNull: false },
    summary: { type: DataTypes.STRING(280), allowNull: true },
    tone: { type: DataTypes.STRING(40), allowNull: true },
    model: { type: DataTypes.STRING(120), allowNull: true },
    temperature: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0.35 },
    channels: { type: jsonType, allowNull: true },
    instructions: { type: DataTypes.TEXT, allowNull: false },
    sampleReply: { type: DataTypes.TEXT, allowNull: true },
    isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    status: {
      type: DataTypes.ENUM(...AUTO_REPLY_TEMPLATE_STATUSES),
      allowNull: false,
      defaultValue: 'active',
    },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'ai_auto_reply_templates',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['ownerId'] },
      { fields: ['status'] },
      { fields: ['isDefault'] },
    ],
  },
);

AiAutoReplyTemplate.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId ?? null,
    ownerId: plain.ownerId,
    title: plain.title,
    summary: plain.summary ?? null,
    tone: plain.tone ?? null,
    model: plain.model ?? null,
    temperature: typeof plain.temperature === 'number' ? plain.temperature : 0.35,
    channels: Array.isArray(plain.channels) ? plain.channels : plain.channels ?? [],
    instructions: plain.instructions,
    sampleReply: plain.sampleReply ?? null,
    isDefault: Boolean(plain.isDefault),
    status: plain.status,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const AiAutoReplyRun = sequelize.define(
  'AiAutoReplyRun',
  {
    templateId: { type: DataTypes.INTEGER, allowNull: true },
    workspaceId: { type: DataTypes.INTEGER, allowNull: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    threadId: { type: DataTypes.INTEGER, allowNull: true },
    messageId: { type: DataTypes.INTEGER, allowNull: true },
    provider: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'openai' },
    model: { type: DataTypes.STRING(120), allowNull: true },
    status: {
      type: DataTypes.ENUM(...AUTO_REPLY_RUN_STATUSES),
      allowNull: false,
      defaultValue: 'success',
    },
    responseLatencyMs: { type: DataTypes.INTEGER, allowNull: true },
    responsePreview: { type: DataTypes.STRING(280), allowNull: true },
    errorMessage: { type: DataTypes.STRING(500), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'ai_auto_reply_runs',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['userId'] },
      { fields: ['status'] },
      { fields: ['createdAt'] },
    ],
  },
);

AiAutoReplyRun.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    templateId: plain.templateId,
    workspaceId: plain.workspaceId,
    userId: plain.userId,
    threadId: plain.threadId,
    messageId: plain.messageId,
    provider: plain.provider,
    model: plain.model,
    status: plain.status,
    responseLatencyMs: plain.responseLatencyMs,
    responsePreview: plain.responsePreview ?? null,
    errorMessage: plain.errorMessage ?? null,
    metadata: plain.metadata ?? null,
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
Message.hasMany(MessageReadReceipt, { as: 'readReceipts', foreignKey: 'messageId' });
MessageReadReceipt.belongsTo(Message, { as: 'message', foreignKey: 'messageId' });
MessageParticipant.hasMany(MessageReadReceipt, { as: 'readReceipts', foreignKey: 'participantId' });
MessageReadReceipt.belongsTo(MessageParticipant, { as: 'participant', foreignKey: 'participantId' });
MessageReadReceipt.belongsTo(User, { as: 'user', foreignKey: 'userId' });

MessageThread.belongsToMany(MessageLabel, {
  through: MessageThreadLabel,
  foreignKey: 'threadId',
  otherKey: 'labelId',
  as: 'labels',
});

MessageLabel.belongsToMany(MessageThread, {
  through: MessageThreadLabel,
  foreignKey: 'labelId',
  otherKey: 'threadId',
  as: 'threads',
});

MessageThreadLabel.belongsTo(MessageThread, { foreignKey: 'threadId', as: 'thread' });
MessageThreadLabel.belongsTo(MessageLabel, { foreignKey: 'labelId', as: 'label' });
MessageThreadLabel.belongsTo(User, { as: 'appliedByUser', foreignKey: 'appliedBy' });

MessageThread.hasOne(SupportCase, { as: 'supportCase', foreignKey: 'threadId' });
SupportCase.belongsTo(MessageThread, { as: 'thread', foreignKey: 'threadId' });
SupportCase.belongsTo(User, { as: 'escalatedByUser', foreignKey: 'escalatedBy' });
SupportCase.belongsTo(User, { as: 'assignedAgent', foreignKey: 'assignedTo' });
SupportCase.belongsTo(User, { as: 'assignedByUser', foreignKey: 'assignedBy' });
SupportCase.belongsTo(User, { as: 'resolvedByUser', foreignKey: 'resolvedBy' });

UserAiProviderSetting.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(UserAiProviderSetting, { foreignKey: 'userId', as: 'aiProviderSettings' });

AiAutoReplyTemplate.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
User.hasMany(AiAutoReplyTemplate, { foreignKey: 'ownerId', as: 'autoReplyTemplates' });

AiAutoReplyRun.belongsTo(User, { foreignKey: 'userId', as: 'user' });
AiAutoReplyRun.belongsTo(AiAutoReplyTemplate, { foreignKey: 'templateId', as: 'template' });
AiAutoReplyTemplate.hasMany(AiAutoReplyRun, { foreignKey: 'templateId', as: 'runs' });

SavedReply.belongsTo(User, { as: 'owner', foreignKey: 'userId' });
User.hasMany(SavedReply, { as: 'savedReplies', foreignKey: 'userId' });

InboxPreference.belongsTo(User, { as: 'user', foreignKey: 'userId' });
InboxPreference.belongsTo(SavedReply, { as: 'defaultSavedReply', foreignKey: 'defaultSavedReplyId' });
User.hasOne(InboxPreference, { as: 'inboxPreference', foreignKey: 'userId' });

InboxRoutingRule.belongsTo(User, { as: 'owner', foreignKey: 'userId' });
User.hasMany(InboxRoutingRule, { as: 'inboxRoutingRules', foreignKey: 'userId' });

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
  MessageReadReceipt,
  MessageLabel,
  MessageThreadLabel,
  SupportCase,
  SavedReply,
  InboxPreference,
  InboxRoutingRule,
  UserAiProviderSetting,
  AiAutoReplyTemplate,
  AiAutoReplyRun,
};
