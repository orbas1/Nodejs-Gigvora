import { DataTypes, Op } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const PLATFORM_STATUS_SEVERITIES = Object.freeze([
  'operational',
  'maintenance',
  'degraded',
  'partial_outage',
  'outage',
]);

const SEVERITY_RANK = PLATFORM_STATUS_SEVERITIES.reduce((acc, value, index) => {
  acc.set(value, index);
  return acc;
}, new Map());

export const PLATFORM_MAINTENANCE_IMPACTS = Object.freeze(['informational', 'minor', 'major']);
export const PLATFORM_FEEDBACK_PROMPT_STATUSES = Object.freeze(['draft', 'active', 'paused', 'archived']);
export const PLATFORM_FEEDBACK_PROMPT_CHANNELS = Object.freeze(['web', 'mobile', 'email', 'omni']);

export const PlatformStatusReport = sequelize.define(
  'PlatformStatusReport',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    severity: {
      type: DataTypes.ENUM(...PLATFORM_STATUS_SEVERITIES),
      allowNull: false,
      defaultValue: 'operational',
    },
    headline: { type: DataTypes.STRING(255), allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: false },
    statusPageUrl: { type: DataTypes.STRING(512), allowNull: true },
    source: { type: DataTypes.STRING(128), allowNull: true },
    occurredAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'platform_status_reports',
    underscored: true,
    indexes: [
      { fields: ['occurred_at'] },
      { fields: ['severity'] },
    ],
  },
);

export const PlatformStatusIncident = sequelize.define(
  'PlatformStatusIncident',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    reportId: { type: DataTypes.INTEGER, allowNull: false },
    externalId: { type: DataTypes.STRING(128), allowNull: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    status: { type: DataTypes.STRING(64), allowNull: false, defaultValue: 'investigating' },
    severity: {
      type: DataTypes.ENUM(...PLATFORM_STATUS_SEVERITIES),
      allowNull: false,
      defaultValue: 'degraded',
    },
    impactSummary: { type: DataTypes.TEXT, allowNull: true },
    services: { type: jsonType, allowNull: false, defaultValue: [] },
    startedAt: { type: DataTypes.DATE, allowNull: true },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
    lastNotifiedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'platform_status_incidents',
    underscored: true,
    indexes: [
      { fields: ['report_id'] },
      { fields: ['severity'] },
      { fields: ['status'] },
    ],
  },
);

export const PlatformStatusMaintenance = sequelize.define(
  'PlatformStatusMaintenance',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    reportId: { type: DataTypes.INTEGER, allowNull: false },
    externalId: { type: DataTypes.STRING(128), allowNull: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    status: { type: DataTypes.STRING(64), allowNull: false, defaultValue: 'scheduled' },
    impact: {
      type: DataTypes.ENUM(...PLATFORM_MAINTENANCE_IMPACTS),
      allowNull: false,
      defaultValue: 'minor',
    },
    services: { type: jsonType, allowNull: false, defaultValue: [] },
    startsAt: { type: DataTypes.DATE, allowNull: true },
    endsAt: { type: DataTypes.DATE, allowNull: true },
    impactSummary: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'platform_status_maintenances',
    underscored: true,
    indexes: [
      { fields: ['report_id'] },
      { fields: ['status'] },
      { fields: ['starts_at'] },
    ],
  },
);

export const PlatformFeedbackPrompt = sequelize.define(
  'PlatformFeedbackPrompt',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    slug: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
      set(value) {
        if (typeof value === 'string') {
          this.setDataValue(
            'slug',
            value
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9-_]+/g, '-'),
          );
        } else {
          this.setDataValue('slug', value);
        }
      },
    },
    question: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...PLATFORM_FEEDBACK_PROMPT_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
    },
    channel: {
      type: DataTypes.ENUM(...PLATFORM_FEEDBACK_PROMPT_CHANNELS),
      allowNull: false,
      defaultValue: 'web',
    },
    audiences: { type: jsonType, allowNull: false, defaultValue: [] },
    responseOptions: { type: jsonType, allowNull: false, defaultValue: [] },
    cooldownHours: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 168 },
    snoozeMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 240 },
    autoOpenDelaySeconds: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 8 },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
    activeFrom: { type: DataTypes.DATE, allowNull: true },
    activeUntil: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'platform_feedback_prompts',
    underscored: true,
    indexes: [
      { fields: ['status'] },
      { fields: ['channel'] },
      { unique: true, fields: ['slug'] },
    ],
  },
);

export const PlatformFeedbackResponse = sequelize.define(
  'PlatformFeedbackResponse',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    promptId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    sessionFingerprint: { type: DataTypes.STRING(128), allowNull: true },
    rating: { type: DataTypes.STRING(32), allowNull: false },
    comment: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
    submittedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'platform_feedback_responses',
    underscored: true,
    indexes: [
      { fields: ['prompt_id'] },
      { fields: ['user_id'] },
      { fields: ['session_fingerprint'] },
      { fields: ['submitted_at'] },
    ],
  },
);

export const PlatformFeedbackPromptState = sequelize.define(
  'PlatformFeedbackPromptState',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    promptId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    sessionFingerprint: { type: DataTypes.STRING(128), allowNull: true },
    snoozedUntil: { type: DataTypes.DATE, allowNull: true },
    respondedAt: { type: DataTypes.DATE, allowNull: true },
    totalResponses: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    lastRating: { type: DataTypes.STRING(32), allowNull: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  {
    tableName: 'platform_feedback_prompt_states',
    underscored: true,
    indexes: [
      { unique: true, fields: ['prompt_id', 'user_id'] },
      { unique: true, fields: ['prompt_id', 'session_fingerprint'] },
      { fields: ['snoozed_until'] },
      { fields: ['responded_at'] },
    ],
  },
);

PlatformStatusReport.hasMany(PlatformStatusIncident, { as: 'incidents', foreignKey: 'reportId', onDelete: 'CASCADE' });
PlatformStatusReport.hasMany(PlatformStatusMaintenance, { as: 'maintenances', foreignKey: 'reportId', onDelete: 'CASCADE' });
PlatformStatusIncident.belongsTo(PlatformStatusReport, { as: 'report', foreignKey: 'reportId' });
PlatformStatusMaintenance.belongsTo(PlatformStatusReport, { as: 'report', foreignKey: 'reportId' });

PlatformFeedbackPrompt.hasMany(PlatformFeedbackResponse, { as: 'responses', foreignKey: 'promptId', onDelete: 'CASCADE' });
PlatformFeedbackPrompt.hasMany(PlatformFeedbackPromptState, { as: 'states', foreignKey: 'promptId', onDelete: 'CASCADE' });
PlatformFeedbackResponse.belongsTo(PlatformFeedbackPrompt, { as: 'prompt', foreignKey: 'promptId' });
PlatformFeedbackPromptState.belongsTo(PlatformFeedbackPrompt, { as: 'prompt', foreignKey: 'promptId' });

function normaliseServiceList(raw) {
  if (!Array.isArray(raw)) {
    return [];
  }
  return Array.from(
    new Set(
      raw
        .map((value) => (typeof value === 'string' ? value.trim() : null))
        .filter((value) => value && value.length > 0 && value.length <= 160),
    ),
  );
}

function normaliseResponseOptions(raw) {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((option) => {
      if (!option || typeof option !== 'object') {
        return null;
      }
      const value = typeof option.value === 'string' ? option.value.trim() : null;
      if (!value) {
        return null;
      }
      return {
        value,
        label: typeof option.label === 'string' && option.label.trim().length > 0 ? option.label.trim() : value,
        emoji:
          typeof option.emoji === 'string' && option.emoji.trim().length > 0 && option.emoji.trim().length <= 8
            ? option.emoji.trim()
            : null,
        description:
          typeof option.description === 'string' && option.description.trim().length > 0
            ? option.description.trim()
            : null,
      };
    })
    .filter(Boolean);
}

PlatformStatusIncident.addHook('beforeValidate', (incident) => {
  incident.services = normaliseServiceList(incident.services);
  if (!PLATFORM_STATUS_SEVERITIES.includes(incident.severity)) {
    incident.severity = 'degraded';
  }
  if (incident.status) {
    incident.status = `${incident.status}`.trim().toLowerCase();
  }
});

PlatformStatusMaintenance.addHook('beforeValidate', (maintenance) => {
  maintenance.services = normaliseServiceList(maintenance.services);
  if (!PLATFORM_MAINTENANCE_IMPACTS.includes(maintenance.impact)) {
    maintenance.impact = 'minor';
  }
  if (maintenance.status) {
    maintenance.status = `${maintenance.status}`.trim().toLowerCase();
  }
});

PlatformFeedbackPrompt.addHook('beforeValidate', (prompt) => {
  if (!PLATFORM_FEEDBACK_PROMPT_STATUSES.includes(prompt.status)) {
    prompt.status = 'draft';
  }
  if (!PLATFORM_FEEDBACK_PROMPT_CHANNELS.includes(prompt.channel)) {
    prompt.channel = 'web';
  }
  prompt.audiences = normaliseServiceList(prompt.audiences).map((value) => value.toLowerCase());
  prompt.responseOptions = normaliseResponseOptions(prompt.responseOptions);
  if (!prompt.metadata || typeof prompt.metadata !== 'object') {
    prompt.metadata = {};
  }
});

PlatformFeedbackResponse.addHook('beforeValidate', (response) => {
  if (response.rating) {
    response.rating = `${response.rating}`.trim().toLowerCase();
  }
  if (response.sessionFingerprint) {
    response.sessionFingerprint = `${response.sessionFingerprint}`.trim().slice(0, 120);
  }
  if (!response.metadata || typeof response.metadata !== 'object') {
    response.metadata = {};
  }
});

PlatformFeedbackPromptState.addHook('beforeValidate', (state) => {
  if (state.sessionFingerprint) {
    state.sessionFingerprint = `${state.sessionFingerprint}`.trim().slice(0, 120);
  }
  if (!state.metadata || typeof state.metadata !== 'object') {
    state.metadata = {};
  }
});

PlatformStatusIncident.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    externalId: plain.externalId ?? null,
    title: plain.title,
    status: plain.status,
    severity: plain.severity,
    impactSummary: plain.impactSummary ?? null,
    services: normaliseServiceList(plain.services),
    startedAt: plain.startedAt ? new Date(plain.startedAt).toISOString() : null,
    resolvedAt: plain.resolvedAt ? new Date(plain.resolvedAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
  };
};

PlatformStatusMaintenance.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    externalId: plain.externalId ?? null,
    title: plain.title,
    status: plain.status,
    impact: plain.impact,
    impactSummary: plain.impactSummary ?? null,
    services: normaliseServiceList(plain.services),
    startsAt: plain.startsAt ? new Date(plain.startsAt).toISOString() : null,
    endsAt: plain.endsAt ? new Date(plain.endsAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
  };
};

PlatformStatusReport.prototype.toSummary = function toSummary() {
  const plain = this.get({ plain: true });
  const incidents = Array.isArray(plain.incidents)
    ? plain.incidents.map((incident) =>
        incident instanceof PlatformStatusIncident ? incident.toPublicObject() : PlatformStatusIncident.build(incident).toPublicObject(),
      )
    : [];
  const maintenances = Array.isArray(plain.maintenances)
    ? plain.maintenances.map((maintenance) =>
        maintenance instanceof PlatformStatusMaintenance
          ? maintenance.toPublicObject()
          : PlatformStatusMaintenance.build(maintenance).toPublicObject(),
      )
    : [];

  const activeIncidents = incidents.filter((incident) => !incident.resolvedAt);
  const upcomingMaintenance = maintenances.filter((maintenance) => {
    if (!maintenance.startsAt) {
      return false;
    }
    const start = new Date(maintenance.startsAt);
    if (!Number.isFinite(start.getTime())) {
      return false;
    }
    const now = new Date();
    return start.getTime() - now.getTime() <= 1000 * 60 * 60 * 24 && maintenance.status !== 'completed';
  });

  const services = normaliseServiceList([
    ...(plain.services ?? []),
    ...activeIncidents.flatMap((incident) => incident.services ?? []),
    ...upcomingMaintenance.flatMap((maintenance) => maintenance.services ?? []),
  ]);

  const severityCandidate = [plain.severity, ...activeIncidents.map((incident) => incident.severity ?? 'operational')];
  const resolvedSeverity = severityCandidate.reduce((current, value) => {
    if (!PLATFORM_STATUS_SEVERITIES.includes(value)) {
      return current;
    }
    if (!current) {
      return value;
    }
    return SEVERITY_RANK.get(value) > SEVERITY_RANK.get(current) ? value : current;
  }, 'operational');

  const headline = plain.headline || (activeIncidents[0] ? activeIncidents[0].title : 'All systems operational');
  const summary = plain.summary ||
    (activeIncidents[0]?.impactSummary || 'Everything is operating normally.');

  return {
    id: plain.id,
    severity: resolvedSeverity,
    headline,
    summary,
    statusPageUrl: plain.statusPageUrl ?? null,
    source: plain.source ?? null,
    occurredAt: plain.occurredAt ? new Date(plain.occurredAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
    services,
    incidents: activeIncidents,
    maintenances: upcomingMaintenance,
    fingerprint: [
      resolvedSeverity,
      plain.occurredAt ? new Date(plain.occurredAt).getTime() : null,
      activeIncidents.map((incident) => `${incident.id ?? incident.externalId ?? incident.title}-${incident.updatedAt ?? ''}`).join('|'),
      upcomingMaintenance
        .map((maintenance) => `${maintenance.id ?? maintenance.externalId ?? maintenance.title}-${maintenance.startsAt ?? ''}`)
        .join('|'),
    ]
      .filter(Boolean)
      .join('::') || resolvedSeverity,
  };
};

PlatformFeedbackPrompt.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    slug: plain.slug,
    question: plain.question,
    description: plain.description ?? null,
    status: plain.status,
    channel: plain.channel,
    responseOptions: normaliseResponseOptions(plain.responseOptions),
    cooldownHours: plain.cooldownHours,
    snoozeMinutes: plain.snoozeMinutes,
    autoOpenDelaySeconds: plain.autoOpenDelaySeconds,
    metadata: plain.metadata ?? {},
  };
};

PlatformFeedbackPromptState.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    promptId: plain.promptId,
    userId: plain.userId ?? null,
    sessionFingerprint: plain.sessionFingerprint ?? null,
    snoozedUntil: plain.snoozedUntil ? new Date(plain.snoozedUntil).toISOString() : null,
    respondedAt: plain.respondedAt ? new Date(plain.respondedAt).toISOString() : null,
    totalResponses: plain.totalResponses ?? 0,
    lastRating: plain.lastRating ?? null,
    metadata: plain.metadata ?? {},
  };
};

PlatformFeedbackResponse.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    promptId: plain.promptId,
    userId: plain.userId ?? null,
    sessionFingerprint: plain.sessionFingerprint ?? null,
    rating: plain.rating,
    comment: plain.comment ?? null,
    metadata: plain.metadata ?? {},
    submittedAt: plain.submittedAt ? new Date(plain.submittedAt).toISOString() : null,
  };
};

export async function findActivePlatformStatusReport({
  includeIncidents = true,
  includeMaintenances = true,
  transaction,
} = {}) {
  const include = [];
  if (includeIncidents) {
    include.push({
      model: PlatformStatusIncident,
      as: 'incidents',
      separate: false,
      required: false,
      order: [['updatedAt', 'DESC']],
    });
  }
  if (includeMaintenances) {
    include.push({
      model: PlatformStatusMaintenance,
      as: 'maintenances',
      separate: false,
      required: false,
      order: [['startsAt', 'ASC']],
    });
  }

  return PlatformStatusReport.findOne({
    order: [
      ['occurredAt', 'DESC'],
      ['createdAt', 'DESC'],
    ],
    include,
    transaction,
  });
}

export async function findPromptStateForActor({ promptId, userId = null, sessionFingerprint = null, transaction } = {}) {
  if (!promptId) {
    return null;
  }
  const where = { promptId };
  if (userId) {
    where[Op.or] = [{ userId }];
  }
  if (sessionFingerprint) {
    where[Op.or] = [...(where[Op.or] ?? []), { sessionFingerprint }];
  }
  return PlatformFeedbackPromptState.findOne({ where, transaction });
}

export default PlatformStatusReport;
