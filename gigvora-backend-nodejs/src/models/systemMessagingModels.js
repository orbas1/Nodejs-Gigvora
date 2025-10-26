import { DataTypes, Op } from 'sequelize';
import sequelize from './sequelizeClient.js';

function resolveJsonType() {
  const dialect = sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;
}

const jsonType = resolveJsonType();

export const SYSTEM_STATUS_EVENT_STATUSES = ['operational', 'degraded', 'maintenance', 'incident', 'outage'];
export const SYSTEM_STATUS_EVENT_SEVERITIES = ['low', 'medium', 'notice', 'high', 'critical'];
export const FEEDBACK_PULSE_SURVEY_STATUSES = ['draft', 'active', 'archived'];

export const SystemStatusEvent = sequelize.define(
  'SystemStatusEvent',
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    eventKey: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    status: {
      type: DataTypes.ENUM(...SYSTEM_STATUS_EVENT_STATUSES),
      allowNull: false,
      defaultValue: 'operational',
    },
    severity: {
      type: DataTypes.ENUM(...SYSTEM_STATUS_EVENT_SEVERITIES),
      allowNull: false,
      defaultValue: 'low',
    },
    title: { type: DataTypes.STRING(255), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: true },
    impactedServices: { type: jsonType, allowNull: false, defaultValue: [] },
    metadata: { type: jsonType, allowNull: false, defaultValue: [] },
    nextSteps: { type: jsonType, allowNull: false, defaultValue: [] },
    actions: { type: jsonType, allowNull: false, defaultValue: [] },
    acknowledgementRequired: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    updatedById: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'system_status_events',
    underscored: true,
    defaultScope: {
      order: [
        ['publishedAt', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    },
    scopes: {
      published(now = new Date()) {
        return {
          where: {
            publishedAt: { [Op.lte]: now },
            [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: now } }],
          },
        };
      },
    },
  },
);

SystemStatusEvent.prototype.toToastPayload = function toToastPayload() {
  const plain = this.get({ plain: true });
  const normalizeArray = (value) => (Array.isArray(value) ? value : []);
  return {
    id: plain.id,
    eventKey: plain.eventKey,
    status: plain.status,
    severity: plain.severity,
    title: plain.title,
    message: plain.message ?? null,
    impactedServices: normalizeArray(plain.impactedServices),
    meta: normalizeArray(plain.metadata),
    nextSteps: normalizeArray(plain.nextSteps),
    actions: normalizeArray(plain.actions),
    acknowledgementRequired: Boolean(plain.acknowledgementRequired),
    publishedAt: plain.publishedAt ? new Date(plain.publishedAt).toISOString() : null,
    expiresAt: plain.expiresAt ? new Date(plain.expiresAt).toISOString() : null,
    resolvedAt: plain.resolvedAt ? new Date(plain.resolvedAt).toISOString() : null,
  };
};

export const SystemStatusAcknowledgement = sequelize.define(
  'SystemStatusAcknowledgement',
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    statusEventId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: SystemStatusEvent, key: 'id' },
    },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    acknowledgedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    channel: { type: DataTypes.STRING(80), allowNull: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  {
    tableName: 'system_status_acknowledgements',
    underscored: true,
    indexes: [
      { fields: ['status_event_id'] },
      { fields: ['user_id'] },
      { unique: true, fields: ['status_event_id', 'user_id'], name: 'system_status_acknowledgements_unique_status_user' },
    ],
  },
);

SystemStatusAcknowledgement.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    statusEventId: plain.statusEventId,
    userId: plain.userId,
    acknowledgedAt: plain.acknowledgedAt ? new Date(plain.acknowledgedAt).toISOString() : null,
    channel: plain.channel ?? null,
    metadata: plain.metadata ?? {},
  };
};

SystemStatusEvent.hasMany(SystemStatusAcknowledgement, {
  as: 'acknowledgements',
  foreignKey: 'statusEventId',
  onDelete: 'CASCADE',
});
SystemStatusAcknowledgement.belongsTo(SystemStatusEvent, {
  as: 'event',
  foreignKey: 'statusEventId',
  onDelete: 'CASCADE',
});

export const FeedbackPulseSurvey = sequelize.define(
  'FeedbackPulseSurvey',
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    pulseKey: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    status: {
      type: DataTypes.ENUM(...FEEDBACK_PULSE_SURVEY_STATUSES),
      allowNull: false,
      defaultValue: 'active',
    },
    question: { type: DataTypes.STRING(500), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    tags: { type: jsonType, allowNull: false, defaultValue: [] },
    segments: { type: jsonType, allowNull: false, defaultValue: [] },
    insights: { type: jsonType, allowNull: false, defaultValue: [] },
    trendLabel: { type: DataTypes.STRING(160), allowNull: true },
    trendValue: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    trendDelta: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    trendSampleSize: { type: DataTypes.INTEGER, allowNull: true },
    responseCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    lastResponseAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    updatedById: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'feedback_pulse_surveys',
    underscored: true,
  },
);

FeedbackPulseSurvey.prototype.toPulsePayload = function toPulsePayload() {
  const plain = this.get({ plain: true });
  const normaliseArray = (value) => (Array.isArray(value) ? value : []);
  const toNumber = (value) => (value == null ? null : Number.parseFloat(value));
  return {
    id: plain.id,
    pulseKey: plain.pulseKey,
    status: plain.status,
    question: plain.question,
    description: plain.description ?? null,
    tags: normaliseArray(plain.tags),
    segments: normaliseArray(plain.segments),
    insights: normaliseArray(plain.insights),
    trend: {
      label: plain.trendLabel ?? null,
      value: toNumber(plain.trendValue),
      delta: toNumber(plain.trendDelta),
      sampleSize: plain.trendSampleSize == null ? null : Number.parseInt(plain.trendSampleSize, 10),
    },
    responseCount: Number.parseInt(plain.responseCount ?? 0, 10),
    lastResponseAt: plain.lastResponseAt ? new Date(plain.lastResponseAt).toISOString() : null,
    metadata: plain.metadata ?? {},
  };
};

export const FeedbackPulseResponse = sequelize.define(
  'FeedbackPulseResponse',
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    surveyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: FeedbackPulseSurvey, key: 'id' },
    },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    score: { type: DataTypes.INTEGER, allowNull: false },
    tags: { type: jsonType, allowNull: false, defaultValue: [] },
    comment: { type: DataTypes.TEXT, allowNull: true },
    channel: { type: DataTypes.STRING(80), allowNull: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
    submittedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'feedback_pulse_responses',
    underscored: true,
  },
);

FeedbackPulseResponse.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const normaliseArray = (value) => (Array.isArray(value) ? value : []);
  return {
    id: plain.id,
    surveyId: plain.surveyId,
    userId: plain.userId ?? null,
    score: Number.parseInt(plain.score ?? 0, 10),
    tags: normaliseArray(plain.tags),
    comment: plain.comment ?? null,
    channel: plain.channel ?? null,
    metadata: plain.metadata ?? {},
    submittedAt: plain.submittedAt ? new Date(plain.submittedAt).toISOString() : null,
  };
};

FeedbackPulseSurvey.hasMany(FeedbackPulseResponse, {
  as: 'responses',
  foreignKey: 'surveyId',
  onDelete: 'CASCADE',
});
FeedbackPulseResponse.belongsTo(FeedbackPulseSurvey, {
  as: 'survey',
  foreignKey: 'surveyId',
  onDelete: 'CASCADE',
});

export default {
  SystemStatusEvent,
  SystemStatusAcknowledgement,
  FeedbackPulseSurvey,
  FeedbackPulseResponse,
  SYSTEM_STATUS_EVENT_STATUSES,
  SYSTEM_STATUS_EVENT_SEVERITIES,
  FEEDBACK_PULSE_SURVEY_STATUSES,
};
