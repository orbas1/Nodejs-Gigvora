import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const AgencyAiConfiguration = sequelize.define(
  'AgencyAiConfiguration',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    provider: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'openai' },
    defaultModel: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'gpt-4o-mini' },
    autoReplyEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    autoReplyInstructions: { type: DataTypes.TEXT, allowNull: true },
    autoReplyChannels: { type: jsonType, allowNull: true },
    autoReplyTemperature: { type: DataTypes.DECIMAL(4, 2), allowNull: false, defaultValue: 0.35 },
    autoReplyResponseTimeGoal: { type: DataTypes.INTEGER, allowNull: true },
    autoBidEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    autoBidStrategy: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'balanced' },
    autoBidMinBudget: { type: DataTypes.INTEGER, allowNull: true },
    autoBidMaxBudget: { type: DataTypes.INTEGER, allowNull: true },
    autoBidMarkup: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    autoBidAutoSubmit: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    autoBidGuardrails: { type: jsonType, allowNull: true },
    apiKeyCiphertext: { type: DataTypes.TEXT, allowNull: true },
    apiKeyDigest: { type: DataTypes.STRING(128), allowNull: true },
    apiKeyFingerprint: { type: DataTypes.STRING(120), allowNull: true },
    apiKeyUpdatedAt: { type: DataTypes.DATE, allowNull: true },
    analyticsSnapshot: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'agency_ai_configurations',
    indexes: [{ unique: true, fields: ['workspaceId'] }],
  },
);

AgencyAiConfiguration.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    provider: plain.provider,
    defaultModel: plain.defaultModel,
    autoReplyEnabled: Boolean(plain.autoReplyEnabled),
    autoReplyInstructions: plain.autoReplyInstructions ?? null,
    autoReplyChannels: Array.isArray(plain.autoReplyChannels) ? [...plain.autoReplyChannels] : null,
    autoReplyTemperature:
      plain.autoReplyTemperature == null ? null : Number.parseFloat(plain.autoReplyTemperature),
    autoReplyResponseTimeGoal: plain.autoReplyResponseTimeGoal ?? null,
    autoBidEnabled: Boolean(plain.autoBidEnabled),
    autoBidStrategy: plain.autoBidStrategy,
    autoBidMinBudget: plain.autoBidMinBudget ?? null,
    autoBidMaxBudget: plain.autoBidMaxBudget ?? null,
    autoBidMarkup: plain.autoBidMarkup == null ? null : Number.parseFloat(plain.autoBidMarkup),
    autoBidAutoSubmit: Boolean(plain.autoBidAutoSubmit),
    autoBidGuardrails: plain.autoBidGuardrails ?? null,
    apiKeyConfigured: Boolean(plain.apiKeyCiphertext),
    apiKeyFingerprint: plain.apiKeyFingerprint ?? null,
    apiKeyUpdatedAt: plain.apiKeyUpdatedAt ?? null,
    analyticsSnapshot: plain.analyticsSnapshot ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const AgencyAutoBidTemplate = sequelize.define(
  'AgencyAutoBidTemplate',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'active' },
    responseSlaHours: { type: DataTypes.INTEGER, allowNull: true },
    deliveryWindowDays: { type: DataTypes.INTEGER, allowNull: true },
    bidCeiling: { type: DataTypes.INTEGER, allowNull: true },
    markupPercent: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    targetRoles: { type: jsonType, allowNull: true },
    scopeKeywords: { type: jsonType, allowNull: true },
    guardrails: { type: jsonType, allowNull: true },
    attachments: { type: jsonType, allowNull: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
    updatedBy: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'agency_auto_bid_templates',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['workspaceId', 'status'] },
    ],
  },
);

AgencyAutoBidTemplate.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    name: plain.name,
    description: plain.description ?? null,
    status: plain.status,
    responseSlaHours: plain.responseSlaHours ?? null,
    deliveryWindowDays: plain.deliveryWindowDays ?? null,
    bidCeiling: plain.bidCeiling ?? null,
    markupPercent: plain.markupPercent == null ? null : Number.parseFloat(plain.markupPercent),
    targetRoles: Array.isArray(plain.targetRoles) ? plain.targetRoles : [],
    scopeKeywords: Array.isArray(plain.scopeKeywords) ? plain.scopeKeywords : [],
    guardrails: plain.guardrails ?? null,
    attachments: Array.isArray(plain.attachments) ? plain.attachments : [],
    createdBy: plain.createdBy ?? null,
    updatedBy: plain.updatedBy ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export default {
  AgencyAiConfiguration,
  AgencyAutoBidTemplate,
};
