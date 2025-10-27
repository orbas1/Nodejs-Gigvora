import { DataTypes } from 'sequelize';

import sequelize from './sequelizeClient.js';

function resolveJsonType() {
  const dialect = sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;
}

const jsonType = resolveJsonType();

const normaliseNumber = (value) => {
  if (value == null) {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const normaliseDecimal = (value, precision = 4) => {
  if (value == null) {
    return 0;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Number.parseFloat(numeric.toFixed(precision));
};

export const ReleaseRollout = sequelize.define(
  'ReleaseRollout',
  {
    id: { type: DataTypes.UUID, allowNull: false, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    version: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'draft' },
    generatedAt: { type: DataTypes.DATE, allowNull: false },
    releaseNotesPath: { type: DataTypes.STRING(255), allowNull: true },
    pipelineId: { type: DataTypes.STRING(80), allowNull: true },
    pipelineName: { type: DataTypes.STRING(160), allowNull: true },
    pipelineStatus: { type: DataTypes.STRING(32), allowNull: true },
    pipelineFinishedAt: { type: DataTypes.DATE, allowNull: true },
    pipelineDurationMs: { type: DataTypes.INTEGER, allowNull: true },
    qualityStatus: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'unknown' },
    telemetryErrorBudgetRemaining: { type: DataTypes.DECIMAL(5, 4), allowNull: true },
    telemetryP0Incidents: { type: DataTypes.INTEGER, allowNull: true },
    telemetryLatencyP99Ms: { type: DataTypes.INTEGER, allowNull: true },
    telemetryRegressionAlerts: { type: jsonType, allowNull: false, defaultValue: [] },
  },
  {
    tableName: 'release_rollouts',
    underscored: true,
    indexes: [
      { unique: true, fields: ['version'] },
      { fields: ['status'] },
      { fields: ['generated_at'] },
    ],
  },
);

export const ReleaseRolloutPipelineStep = sequelize.define(
  'ReleaseRolloutPipelineStep',
  {
    id: { type: DataTypes.UUID, allowNull: false, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    rolloutId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'release_rollouts', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    sequence: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    stepId: { type: DataTypes.STRING(80), allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'pending' },
    durationMs: { type: DataTypes.INTEGER, allowNull: true },
    commands: { type: jsonType, allowNull: false, defaultValue: [] },
  },
  {
    tableName: 'release_rollout_pipeline_steps',
    underscored: true,
    indexes: [
      { fields: ['rollout_id'] },
      { fields: ['sequence'] },
    ],
  },
);

export const ReleaseRolloutQualityGate = sequelize.define(
  'ReleaseRolloutQualityGate',
  {
    id: { type: DataTypes.UUID, allowNull: false, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    rolloutId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'release_rollouts', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    sequence: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    name: { type: DataTypes.STRING(160), allowNull: false },
    status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'pending' },
    evidence: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'release_rollout_quality_gates',
    underscored: true,
    indexes: [
      { fields: ['rollout_id'] },
      { fields: ['sequence'] },
    ],
  },
);

export const ReleaseRolloutCohort = sequelize.define(
  'ReleaseRolloutCohort',
  {
    id: { type: DataTypes.UUID, allowNull: false, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    rolloutId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'release_rollouts', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    sequence: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    name: { type: DataTypes.STRING(120), allowNull: false },
    targetPercentage: { type: DataTypes.DECIMAL(6, 4), allowNull: false, defaultValue: 0 },
    currentPercentage: { type: DataTypes.DECIMAL(6, 4), allowNull: false, defaultValue: 0 },
    errorBudgetRemaining: { type: DataTypes.DECIMAL(6, 4), allowNull: false, defaultValue: 1 },
    health: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'healthy' },
    notes: { type: jsonType, allowNull: false, defaultValue: [] },
  },
  {
    tableName: 'release_rollout_cohorts',
    underscored: true,
    indexes: [
      { fields: ['rollout_id'] },
      { fields: ['sequence'] },
    ],
  },
);

ReleaseRollout.hasMany(ReleaseRolloutPipelineStep, {
  as: 'pipelineSteps',
  foreignKey: 'rolloutId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
  hooks: true,
});
ReleaseRolloutPipelineStep.belongsTo(ReleaseRollout, { as: 'rollout', foreignKey: 'rolloutId', targetKey: 'id' });

ReleaseRollout.hasMany(ReleaseRolloutQualityGate, {
  as: 'qualityGates',
  foreignKey: 'rolloutId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
  hooks: true,
});
ReleaseRolloutQualityGate.belongsTo(ReleaseRollout, { as: 'rollout', foreignKey: 'rolloutId', targetKey: 'id' });

ReleaseRollout.hasMany(ReleaseRolloutCohort, {
  as: 'cohorts',
  foreignKey: 'rolloutId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
  hooks: true,
});
ReleaseRolloutCohort.belongsTo(ReleaseRollout, { as: 'rollout', foreignKey: 'rolloutId', targetKey: 'id' });

ReleaseRolloutPipelineStep.prototype.toPipelineStep = function toPipelineStep() {
  const plain = this.get({ plain: true });
  return {
    id: plain.stepId,
    name: plain.name,
    status: plain.status,
    durationMs: normaliseNumber(plain.durationMs),
    commands: Array.isArray(plain.commands) ? plain.commands : [],
    sequence: plain.sequence ?? 0,
  };
};

ReleaseRolloutQualityGate.prototype.toQualityGate = function toQualityGate() {
  const plain = this.get({ plain: true });
  return {
    name: plain.name,
    status: plain.status,
    evidence: plain.evidence ?? '',
    sequence: plain.sequence ?? 0,
  };
};

ReleaseRolloutCohort.prototype.toCohort = function toCohort() {
  const plain = this.get({ plain: true });
  return {
    name: plain.name,
    targetPercentage: normaliseDecimal(plain.targetPercentage),
    currentPercentage: normaliseDecimal(plain.currentPercentage),
    errorBudgetRemaining: normaliseDecimal(plain.errorBudgetRemaining),
    health: plain.health,
    notes: Array.isArray(plain.notes) ? plain.notes : [],
    sequence: plain.sequence ?? 0,
  };
};

ReleaseRollout.prototype.toMonitoringPayload = function toMonitoringPayload() {
  const plain = this.get({ plain: true });
  const pipelineSteps = Array.isArray(plain.pipelineSteps)
    ? plain.pipelineSteps
        .map((step) =>
          typeof step.toPipelineStep === 'function'
            ? step.toPipelineStep()
            : {
                id: step.stepId,
                name: step.name,
                status: step.status,
                durationMs: normaliseNumber(step.durationMs),
                commands: Array.isArray(step.commands) ? step.commands : [],
                sequence: step.sequence ?? 0,
              },
        )
        .sort((a, b) => a.sequence - b.sequence)
        .map(({ sequence, ...rest }) => rest)
    : [];

  const qualityGates = Array.isArray(plain.qualityGates)
    ? plain.qualityGates
        .map((gate) =>
          typeof gate.toQualityGate === 'function'
            ? gate.toQualityGate()
            : {
                name: gate.name,
                status: gate.status,
                evidence: gate.evidence ?? '',
                sequence: gate.sequence ?? 0,
              },
        )
        .sort((a, b) => a.sequence - b.sequence)
        .map(({ sequence, ...rest }) => rest)
    : [];

  const cohorts = Array.isArray(plain.cohorts)
    ? plain.cohorts
        .map((cohort) =>
          typeof cohort.toCohort === 'function'
            ? cohort.toCohort()
            : {
                name: cohort.name,
                targetPercentage: normaliseDecimal(cohort.targetPercentage),
                currentPercentage: normaliseDecimal(cohort.currentPercentage),
                errorBudgetRemaining: normaliseDecimal(cohort.errorBudgetRemaining),
                health: cohort.health,
                notes: Array.isArray(cohort.notes) ? cohort.notes : [],
                sequence: cohort.sequence ?? 0,
              },
        )
        .sort((a, b) => a.sequence - b.sequence)
        .map(({ sequence, ...rest }) => rest)
    : [];

  return {
    version: plain.version,
    status: plain.status,
    generatedAt: plain.generatedAt?.toISOString?.() ?? null,
    releaseNotesPath: plain.releaseNotesPath ?? null,
    pipeline: {
      id: plain.pipelineId,
      name: plain.pipelineName,
      status: plain.pipelineStatus,
      finishedAt: plain.pipelineFinishedAt?.toISOString?.() ?? null,
      durationMs: normaliseNumber(plain.pipelineDurationMs),
      steps: pipelineSteps,
    },
    quality: {
      status: plain.qualityStatus,
      gates: qualityGates,
    },
    telemetry: {
      errorBudgetRemaining: normaliseDecimal(plain.telemetryErrorBudgetRemaining),
      p0Incidents: normaliseNumber(plain.telemetryP0Incidents) ?? 0,
      latencyP99Ms: normaliseNumber(plain.telemetryLatencyP99Ms),
      regressionAlerts: Array.isArray(plain.telemetryRegressionAlerts)
        ? plain.telemetryRegressionAlerts
        : [],
    },
    cohorts,
  };
};

export default ReleaseRollout;
