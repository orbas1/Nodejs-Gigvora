import { DataTypes } from 'sequelize';

import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const RELEASE_PIPELINE_STATUSES = Object.freeze(['draft', 'in_progress', 'ready_for_release', 'released', 'archived']);
export const RELEASE_PHASE_STATUSES = Object.freeze(['pending', 'in_progress', 'complete', 'blocked', 'attention', 'paused']);
export const RELEASE_SEGMENT_STATUSES = Object.freeze(['pending', 'rolling_out', 'complete', 'blocked', 'paused']);
export const RELEASE_CHECKLIST_STATUSES = Object.freeze(['pending', 'in_progress', 'complete', 'attention', 'blocked']);
export const RELEASE_MONITOR_STATUSES = Object.freeze(['passing', 'warning', 'info', 'attention', 'failing', 'unknown']);
export const RELEASE_PIPELINE_RUN_STATUSES = Object.freeze(['passed', 'failed', 'running']);

export const ReleasePipeline = sequelize.define(
  'ReleasePipeline',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    key: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    version: { type: DataTypes.STRING(60), allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    ownerName: { type: DataTypes.STRING(160), allowNull: true, field: 'owner_name' },
    ownerEmail: { type: DataTypes.STRING(160), allowNull: true, field: 'owner_email' },
    status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'in_progress' },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_active' },
    activePhaseKey: { type: DataTypes.STRING(120), allowNull: true, field: 'active_phase_key' },
    startedAt: { type: DataTypes.DATE, allowNull: true, field: 'started_at' },
    targetReleaseAt: { type: DataTypes.DATE, allowNull: true, field: 'target_release_at' },
    releasedAt: { type: DataTypes.DATE, allowNull: true, field: 'released_at' },
    releaseNotesUrl: { type: DataTypes.STRING(255), allowNull: true, field: 'release_notes_url' },
    releaseNotesRef: { type: DataTypes.STRING(160), allowNull: true, field: 'release_notes_ref' },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  {
    tableName: 'release_pipelines',
    underscored: true,
    indexes: [
      { fields: ['status'], name: 'release_pipelines_status_idx' },
    ],
  },
);

ReleasePipeline.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    key: plain.key,
    name: plain.name,
    version: plain.version ?? null,
    summary: plain.summary ?? null,
    ownerName: plain.ownerName ?? null,
    ownerEmail: plain.ownerEmail ?? null,
    status: plain.status,
    isActive: Boolean(plain.isActive),
    activePhaseKey: plain.activePhaseKey ?? null,
    startedAt: plain.startedAt?.toISOString?.() ?? null,
    targetReleaseAt: plain.targetReleaseAt?.toISOString?.() ?? null,
    releasedAt: plain.releasedAt?.toISOString?.() ?? null,
    releaseNotesUrl: plain.releaseNotesUrl ?? null,
    releaseNotesRef: plain.releaseNotesRef ?? null,
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt?.toISOString?.() ?? null,
    updatedAt: plain.updatedAt?.toISOString?.() ?? null,
  };
};

export const ReleasePhase = sequelize.define(
  'ReleasePhase',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    releaseId: { type: DataTypes.INTEGER, allowNull: false, field: 'release_id' },
    key: { type: DataTypes.STRING(120), allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    summary: { type: DataTypes.STRING(400), allowNull: true },
    ownerName: { type: DataTypes.STRING(160), allowNull: true, field: 'owner_name' },
    status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'pending' },
    coveragePercent: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0, field: 'coverage_percent' },
    orderIndex: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'order_index' },
    startedAt: { type: DataTypes.DATE, allowNull: true, field: 'started_at' },
    completedAt: { type: DataTypes.DATE, allowNull: true, field: 'completed_at' },
  },
  {
    tableName: 'release_phases',
    underscored: true,
    indexes: [
      { fields: ['release_id', 'key'], unique: true, name: 'release_phases_release_key_idx' },
      { fields: ['release_id', 'order_index'], name: 'release_phases_order_idx' },
    ],
  },
);

ReleasePhase.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    key: plain.key,
    name: plain.name,
    summary: plain.summary ?? null,
    owner: plain.ownerName ?? null,
    status: plain.status,
    coverage: plain.coveragePercent == null ? null : Number.parseFloat(plain.coveragePercent),
    order: plain.orderIndex ?? 0,
    startedAt: plain.startedAt?.toISOString?.() ?? null,
    completedAt: plain.completedAt?.toISOString?.() ?? null,
  };
};

export const ReleaseSegment = sequelize.define(
  'ReleaseSegment',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    releaseId: { type: DataTypes.INTEGER, allowNull: false, field: 'release_id' },
    key: { type: DataTypes.STRING(120), allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    summary: { type: DataTypes.STRING(400), allowNull: true },
    ownerName: { type: DataTypes.STRING(160), allowNull: true, field: 'owner_name' },
    status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'pending' },
    coveragePercent: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0, field: 'coverage_percent' },
  },
  {
    tableName: 'release_segments',
    underscored: true,
    indexes: [{ fields: ['release_id', 'key'], unique: true, name: 'release_segments_release_key_idx' }],
  },
);

ReleaseSegment.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    key: plain.key,
    name: plain.name,
    summary: plain.summary ?? null,
    owner: plain.ownerName ?? null,
    status: plain.status,
    coverage: plain.coveragePercent == null ? null : Number.parseFloat(plain.coveragePercent),
  };
};

export const ReleaseChecklistItem = sequelize.define(
  'ReleaseChecklistItem',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    releaseId: { type: DataTypes.INTEGER, allowNull: false, field: 'release_id' },
    key: { type: DataTypes.STRING(120), allowNull: false },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.STRING(400), allowNull: true },
    ownerName: { type: DataTypes.STRING(160), allowNull: true, field: 'owner_name' },
    status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'pending' },
    dueAt: { type: DataTypes.DATE, allowNull: true, field: 'due_at' },
    completedAt: { type: DataTypes.DATE, allowNull: true, field: 'completed_at' },
  },
  {
    tableName: 'release_checklist_items',
    underscored: true,
    indexes: [{ fields: ['release_id', 'key'], unique: true, name: 'release_checklist_release_key_idx' }],
  },
);

ReleaseChecklistItem.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    key: plain.key,
    name: plain.name,
    description: plain.description ?? null,
    owner: plain.ownerName ?? null,
    status: plain.status,
    dueAt: plain.dueAt?.toISOString?.() ?? null,
    completedAt: plain.completedAt?.toISOString?.() ?? null,
  };
};

export const ReleaseMonitor = sequelize.define(
  'ReleaseMonitor',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    releaseId: { type: DataTypes.INTEGER, allowNull: true, field: 'release_id' },
    monitorKey: { type: DataTypes.STRING(120), allowNull: false, unique: true, field: 'monitor_key' },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.STRING(400), allowNull: true },
    environment: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'production' },
    status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'unknown' },
    coveragePercent: { type: DataTypes.DECIMAL(5, 2), allowNull: true, field: 'coverage_percent' },
    metrics: { type: jsonType, allowNull: false, defaultValue: {} },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
    lastSampledAt: { type: DataTypes.DATE, allowNull: true, field: 'last_sampled_at' },
  },
  {
    tableName: 'release_monitors',
    underscored: true,
    indexes: [{ fields: ['environment'], name: 'release_monitors_environment_idx' }],
  },
);

ReleaseMonitor.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    key: plain.monitorKey,
    name: plain.name,
    description: plain.description ?? null,
    environment: plain.environment,
    status: plain.status,
    coverage: plain.coveragePercent == null ? null : Number.parseFloat(plain.coveragePercent),
    metrics: plain.metrics ?? {},
    metadata: plain.metadata ?? {},
    lastSampledAt: plain.lastSampledAt?.toISOString?.() ?? null,
  };
};

export const ReleaseEvent = sequelize.define(
  'ReleaseEvent',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    releaseId: { type: DataTypes.INTEGER, allowNull: true, field: 'release_id' },
    eventType: { type: DataTypes.STRING(80), allowNull: false, field: 'event_type' },
    resourceKey: { type: DataTypes.STRING(160), allowNull: true, field: 'resource_key' },
    status: { type: DataTypes.STRING(32), allowNull: true },
    summary: { type: DataTypes.STRING(400), allowNull: true },
    actorName: { type: DataTypes.STRING(160), allowNull: true, field: 'actor_name' },
    actorRole: { type: DataTypes.STRING(120), allowNull: true, field: 'actor_role' },
    payload: { type: jsonType, allowNull: false, defaultValue: {} },
    occurredAt: { type: DataTypes.DATE, allowNull: false, field: 'occurred_at' },
  },
  {
    tableName: 'release_events',
    underscored: true,
    indexes: [
      { fields: ['release_id', 'event_type'], name: 'release_events_release_type_idx' },
      { fields: ['occurred_at'], name: 'release_events_occurred_at_idx' },
    ],
  },
);

ReleaseEvent.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    releaseId: plain.releaseId ?? null,
    type: plain.eventType,
    resourceKey: plain.resourceKey ?? null,
    status: plain.status ?? null,
    summary: plain.summary ?? null,
    actorName: plain.actorName ?? null,
    actorRole: plain.actorRole ?? null,
    payload: plain.payload ?? {},
    occurredAt: plain.occurredAt?.toISOString?.() ?? null,
    createdAt: plain.createdAt?.toISOString?.() ?? null,
  };
};

export const ReleasePipelineRun = sequelize.define(
  'ReleasePipelineRun',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    releaseId: { type: DataTypes.INTEGER, allowNull: true, field: 'release_id' },
    pipelineKey: { type: DataTypes.STRING(120), allowNull: false, field: 'pipeline_key' },
    status: { type: DataTypes.STRING(32), allowNull: false },
    startedAt: { type: DataTypes.DATE, allowNull: false, field: 'started_at' },
    completedAt: { type: DataTypes.DATE, allowNull: true, field: 'completed_at' },
    durationMs: { type: DataTypes.INTEGER, allowNull: true, field: 'duration_ms' },
    tasks: { type: jsonType, allowNull: false, defaultValue: [] },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  {
    tableName: 'release_pipeline_runs',
    underscored: true,
    indexes: [{ fields: ['pipeline_key', 'started_at'], name: 'release_pipeline_runs_key_started_idx' }],
  },
);

ReleasePipelineRun.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    releaseId: plain.releaseId ?? null,
    pipelineKey: plain.pipelineKey,
    status: plain.status,
    startedAt: plain.startedAt?.toISOString?.() ?? null,
    completedAt: plain.completedAt?.toISOString?.() ?? null,
    durationMs: plain.durationMs == null ? null : Number.parseInt(plain.durationMs, 10),
    tasks: Array.isArray(plain.tasks) ? plain.tasks : [],
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt?.toISOString?.() ?? null,
    updatedAt: plain.updatedAt?.toISOString?.() ?? null,
  };
};

ReleasePipeline.hasMany(ReleasePhase, { foreignKey: 'releaseId', as: 'phases' });
ReleasePipeline.hasMany(ReleaseSegment, { foreignKey: 'releaseId', as: 'segments' });
ReleasePipeline.hasMany(ReleaseChecklistItem, { foreignKey: 'releaseId', as: 'checklist' });
ReleasePipeline.hasMany(ReleaseMonitor, { foreignKey: 'releaseId', as: 'monitors' });
ReleasePipeline.hasMany(ReleaseEvent, { foreignKey: 'releaseId', as: 'events' });
ReleasePipeline.hasMany(ReleasePipelineRun, { foreignKey: 'releaseId', as: 'pipelineRuns' });

ReleasePhase.belongsTo(ReleasePipeline, { foreignKey: 'releaseId', as: 'release' });
ReleaseSegment.belongsTo(ReleasePipeline, { foreignKey: 'releaseId', as: 'release' });
ReleaseChecklistItem.belongsTo(ReleasePipeline, { foreignKey: 'releaseId', as: 'release' });
ReleaseMonitor.belongsTo(ReleasePipeline, { foreignKey: 'releaseId', as: 'release' });
ReleaseEvent.belongsTo(ReleasePipeline, { foreignKey: 'releaseId', as: 'release' });
ReleasePipelineRun.belongsTo(ReleasePipeline, { foreignKey: 'releaseId', as: 'release' });

export default {
  sequelize,
  ReleasePipeline,
  ReleasePhase,
  ReleaseSegment,
  ReleaseChecklistItem,
  ReleaseMonitor,
  ReleaseEvent,
  ReleasePipelineRun,
};
