import { DataTypes } from 'sequelize';
import * as messagingModels from './messagingModels.js';
import sequelizeClient, { sequelize as sharedSequelize } from './sequelizeClient.js';

export { sequelize as baseSequelize } from './sequelizeClient.js';

// messagingModels re-exports the shared sequelize instance, but test suites
// often stub the module with lightweight objects that only provide the bits
// they need (for example just a `getDialect` implementation). In those
// scenarios, attempting to call `.define` on the mocked value throws. We fall
// back to the raw client instance so model definition still succeeds during
// tests while continuing to share the same connection in production.
const sequelize =
  messagingModels?.sequelize && typeof messagingModels.sequelize.define === 'function'
    ? messagingModels.sequelize
    : sharedSequelize ?? sequelizeClient;
const dialect = typeof sequelize.getDialect === 'function' ? sequelize.getDialect() : 'postgres';
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const ModerationEventActions = [
  'message_flagged',
  'message_blocked',
  'message_removed',
  'participant_muted',
  'mute_expired',
  'manual_review',
  'status_change',
];

export const ModerationEventSeverities = ['low', 'medium', 'high', 'critical'];

export const ModerationEventStatuses = ['open', 'acknowledged', 'resolved', 'dismissed'];

export const ModerationEvent = sequelize.define(
  'ModerationEvent',
  {
    threadId: { type: DataTypes.INTEGER, allowNull: false },
    messageId: { type: DataTypes.INTEGER, allowNull: true },
    actorId: { type: DataTypes.INTEGER, allowNull: true },
    channelSlug: { type: DataTypes.STRING(120), allowNull: false },
    action: {
      type: DataTypes.ENUM(...ModerationEventActions),
      allowNull: false,
      defaultValue: 'message_flagged',
      validate: { isIn: [ModerationEventActions] },
    },
    severity: {
      type: DataTypes.ENUM(...ModerationEventSeverities),
      allowNull: false,
      defaultValue: 'medium',
      validate: { isIn: [ModerationEventSeverities] },
    },
    status: {
      type: DataTypes.ENUM(...ModerationEventStatuses),
      allowNull: false,
      defaultValue: 'open',
      validate: { isIn: [ModerationEventStatuses] },
    },
    reason: { type: DataTypes.STRING(500), allowNull: false },
    metadata: { type: jsonType, allowNull: true },
    resolvedBy: { type: DataTypes.INTEGER, allowNull: true },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'moderation_events',
    indexes: [
      { fields: ['status'] },
      { fields: ['severity'] },
      { fields: ['channelSlug'] },
      { fields: ['threadId'] },
      { fields: ['messageId'] },
      { fields: ['createdAt'] },
    ],
  },
);

ModerationEvent.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    threadId: plain.threadId,
    messageId: plain.messageId,
    actorId: plain.actorId,
    channelSlug: plain.channelSlug,
    action: plain.action,
    severity: plain.severity,
    status: plain.status,
    reason: plain.reason,
    metadata: plain.metadata,
    resolvedBy: plain.resolvedBy,
    resolvedAt: plain.resolvedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export default {
  ModerationEvent,
  ModerationEventActions,
  ModerationEventSeverities,
  ModerationEventStatuses,
};

export { sequelize };
