import { DataTypes } from 'sequelize';

import sequelize from './sequelizeClient.js';

function resolveJsonType() {
  const dialect = sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;
}

const jsonType = resolveJsonType();

export const MonitoringInsightsSnapshot = sequelize.define(
  'MonitoringInsightsSnapshot',
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    timeframe: { type: DataTypes.STRING(16), allowNull: false },
    capturedAt: { type: DataTypes.DATE, allowNull: false },
    totalReach: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    totalReachDelta: { type: DataTypes.DECIMAL(8, 4), allowNull: false, defaultValue: 0 },
    engagementRate: { type: DataTypes.DECIMAL(6, 4), allowNull: false, defaultValue: 0 },
    engagementRateDelta: { type: DataTypes.DECIMAL(6, 4), allowNull: false, defaultValue: 0 },
    conversionLift: { type: DataTypes.DECIMAL(6, 4), allowNull: false, defaultValue: 0 },
    conversionLiftDelta: { type: DataTypes.DECIMAL(6, 4), allowNull: false, defaultValue: 0 },
    anomalyCoverage: { type: DataTypes.DECIMAL(6, 4), allowNull: false, defaultValue: 0 },
    anomalyCoverageDelta: { type: DataTypes.DECIMAL(6, 4), allowNull: false, defaultValue: 0 },
    timeline: { type: jsonType, allowNull: false, defaultValue: [] },
    personas: { type: jsonType, allowNull: false, defaultValue: [] },
    anomalies: { type: jsonType, allowNull: false, defaultValue: [] },
    roadmap: { type: jsonType, allowNull: false, defaultValue: [] },
    narratives: { type: jsonType, allowNull: false, defaultValue: [] },
    journeys: { type: jsonType, allowNull: false, defaultValue: [] },
    qa: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  {
    tableName: 'monitoring_insight_snapshots',
    underscored: true,
    indexes: [
      { fields: ['timeframe'] },
      { fields: ['captured_at'] },
    ],
  },
);

MonitoringInsightsSnapshot.prototype.toOverviewPayload = function toOverviewPayload() {
  const plain = this.get({ plain: true });
  return {
    timeframe: plain.timeframe,
    capturedAt: plain.capturedAt?.toISOString?.() ?? null,
    summary: {
      totalReach: Number(plain.totalReach ?? 0),
      totalReachDelta: Number.parseFloat(plain.totalReachDelta ?? 0),
      engagementRate: Number.parseFloat(plain.engagementRate ?? 0),
      engagementRateDelta: Number.parseFloat(plain.engagementRateDelta ?? 0),
      conversionLift: Number.parseFloat(plain.conversionLift ?? 0),
      conversionLiftDelta: Number.parseFloat(plain.conversionLiftDelta ?? 0),
      anomalyCoverage: Number.parseFloat(plain.anomalyCoverage ?? 0),
      anomalyCoverageDelta: Number.parseFloat(plain.anomalyCoverageDelta ?? 0),
    },
    timeline: Array.isArray(plain.timeline) ? plain.timeline : [],
    personas: Array.isArray(plain.personas) ? plain.personas : [],
    anomalies: Array.isArray(plain.anomalies) ? plain.anomalies : [],
    roadmap: Array.isArray(plain.roadmap) ? plain.roadmap : [],
    narratives: Array.isArray(plain.narratives) ? plain.narratives : [],
    journeys: Array.isArray(plain.journeys) ? plain.journeys : [],
    qa: plain.qa ?? {},
  };
};

export const MonitoringMetric = sequelize.define(
  'MonitoringMetric',
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    metricKey: { type: DataTypes.STRING(80), allowNull: false },
    label: { type: DataTypes.STRING(160), allowNull: false },
    value: { type: DataTypes.DECIMAL(10, 4), allowNull: false, defaultValue: 0 },
    delta: { type: DataTypes.DECIMAL(8, 4), allowNull: false, defaultValue: 0 },
    sampleSize: { type: DataTypes.INTEGER, allowNull: true },
    narrative: { type: DataTypes.TEXT, allowNull: true },
    sparkline: { type: jsonType, allowNull: false, defaultValue: [] },
    tags: { type: jsonType, allowNull: false, defaultValue: [] },
    persona: { type: DataTypes.STRING(80), allowNull: true },
    personaLabel: { type: DataTypes.STRING(160), allowNull: true },
    channel: { type: DataTypes.STRING(80), allowNull: true },
    channelLabel: { type: DataTypes.STRING(160), allowNull: true },
    timeframe: { type: DataTypes.STRING(16), allowNull: false, defaultValue: '30d' },
    compareTo: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'previous_period' },
    includeBenchmarks: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: 'monitoring_metrics',
    underscored: true,
    indexes: [
      { fields: ['metric_key'] },
      { fields: ['persona'] },
      { fields: ['channel'] },
      { fields: ['timeframe'] },
    ],
  },
);

MonitoringMetric.prototype.toExplorerMetric = function toExplorerMetric() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    key: plain.metricKey,
    label: plain.label,
    value: plain.value == null ? 0 : Number.parseFloat(plain.value),
    delta: plain.delta == null ? 0 : Number.parseFloat(plain.delta),
    sampleSize: plain.sampleSize == null ? null : Number.parseInt(plain.sampleSize, 10),
    narrative: plain.narrative ?? '',
    sparkline: Array.isArray(plain.sparkline) ? plain.sparkline : [],
    tags: Array.isArray(plain.tags) ? plain.tags : [],
    persona: plain.persona ?? null,
    personaLabel: plain.personaLabel ?? null,
    channel: plain.channel ?? null,
    channelLabel: plain.channelLabel ?? null,
    timeframe: plain.timeframe,
    compareTo: plain.compareTo,
    includeBenchmarks: Boolean(plain.includeBenchmarks),
  };
};

export const MonitoringMetricAlert = sequelize.define(
  'MonitoringMetricAlert',
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    metricKey: { type: DataTypes.STRING(80), allowNull: false },
    title: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'watching' },
    threshold: { type: DataTypes.DECIMAL(10, 4), allowNull: true },
    value: { type: DataTypes.DECIMAL(10, 4), allowNull: true },
    severity: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'medium' },
    timeframe: { type: DataTypes.STRING(16), allowNull: false, defaultValue: '30d' },
    persona: { type: DataTypes.STRING(80), allowNull: true },
    channel: { type: DataTypes.STRING(80), allowNull: true },
  },
  {
    tableName: 'monitoring_metric_alerts',
    underscored: true,
    indexes: [
      { fields: ['metric_key'] },
      { fields: ['timeframe'] },
      { fields: ['severity'] },
    ],
  },
);

MonitoringMetricAlert.prototype.toExplorerAlert = function toExplorerAlert() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    metricKey: plain.metricKey,
    title: plain.title,
    description: plain.description,
    status: plain.status,
    threshold: plain.threshold == null ? null : Number.parseFloat(plain.threshold),
    value: plain.value == null ? null : Number.parseFloat(plain.value),
    severity: plain.severity,
    timeframe: plain.timeframe,
    persona: plain.persona ?? null,
    channel: plain.channel ?? null,
  };
};

export const MonitoringMetricsSavedView = sequelize.define(
  'MonitoringMetricsSavedView',
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING(160), allowNull: false },
    timeframe: { type: DataTypes.STRING(16), allowNull: false, defaultValue: '30d' },
    query: { type: jsonType, allowNull: false, defaultValue: {} },
    createdBy: { type: DataTypes.STRING(120), allowNull: true },
  },
  {
    tableName: 'monitoring_metric_views',
    underscored: true,
    indexes: [
      { fields: ['name'], unique: true },
    ],
  },
);

MonitoringMetricsSavedView.prototype.toExplorerView = function toExplorerView() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    name: plain.name,
    timeframe: plain.timeframe,
    query: plain.query ?? {},
    createdBy: plain.createdBy ?? null,
    createdAt: plain.createdAt?.toISOString?.() ?? null,
    updatedAt: plain.updatedAt?.toISOString?.() ?? null,
  };
};

export const MonitoringAuditEvent = sequelize.define(
  'MonitoringAuditEvent',
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    severity: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'medium' },
    action: { type: DataTypes.STRING(160), allowNull: false },
    summary: { type: DataTypes.STRING(400), allowNull: false },
    actorName: { type: DataTypes.STRING(160), allowNull: false },
    actorType: { type: DataTypes.STRING(80), allowNull: false },
    resourceKey: { type: DataTypes.STRING(160), allowNull: false },
    resourceLabel: { type: DataTypes.STRING(160), allowNull: false },
    resourceType: { type: DataTypes.STRING(80), allowNull: false },
    occurredAt: { type: DataTypes.DATE, allowNull: false },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
    relatedIncidents: { type: jsonType, allowNull: false, defaultValue: [] },
  },
  {
    tableName: 'monitoring_audit_events',
    underscored: true,
    indexes: [
      { fields: ['severity'] },
      { fields: ['actor_type'] },
      { fields: ['resource_type'] },
      { fields: ['occurred_at'] },
    ],
  },
);

MonitoringAuditEvent.prototype.toViewerEvent = function toViewerEvent() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    severity: plain.severity,
    action: plain.action,
    summary: plain.summary,
    actor: {
      name: plain.actorName,
      type: plain.actorType,
    },
    resource: {
      key: plain.resourceKey,
      label: plain.resourceLabel,
      type: plain.resourceType,
    },
    timestamp: plain.occurredAt?.toISOString?.() ?? null,
    metadata: plain.metadata ?? {},
    relatedIncidents: Array.isArray(plain.relatedIncidents) ? plain.relatedIncidents : [],
  };
};

export const MonitoringAuditSummary = sequelize.define(
  'MonitoringAuditSummary',
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    timeframe: { type: DataTypes.STRING(16), allowNull: false, unique: true },
    totalEvents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    criticalEvents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    medianResponseMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    compliancePosture: { type: DataTypes.STRING(320), allowNull: false },
    residualRiskNarrative: { type: DataTypes.STRING(400), allowNull: false },
  },
  {
    tableName: 'monitoring_audit_summaries',
    underscored: true,
  },
);

MonitoringAuditSummary.prototype.toViewerSummary = function toViewerSummary() {
  const plain = this.get({ plain: true });
  return {
    timeframe: plain.timeframe,
    total: plain.totalEvents ?? 0,
    critical: plain.criticalEvents ?? 0,
    medianResponseMinutes: plain.medianResponseMinutes ?? 0,
    compliancePosture: plain.compliancePosture,
    residualRiskNarrative: plain.residualRiskNarrative,
  };
};

export default {
  sequelize,
  MonitoringInsightsSnapshot,
  MonitoringMetric,
  MonitoringMetricAlert,
  MonitoringMetricsSavedView,
  MonitoringAuditEvent,
  MonitoringAuditSummary,
};
