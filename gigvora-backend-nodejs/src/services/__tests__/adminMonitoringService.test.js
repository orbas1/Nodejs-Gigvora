import { promises as fs } from 'node:fs';
import path from 'node:path';

import { Sequelize, DataTypes } from 'sequelize';

import * as service from '../adminMonitoringService.js';

describe('adminMonitoringService', () => {
  const sequelize = new Sequelize('sqlite::memory:', { logging: false });

  const MonitoringInsightsSnapshot = sequelize.define(
    'MonitoringInsightsSnapshot',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
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
      timeline: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      personas: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      anomalies: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      roadmap: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      narratives: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      journeys: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      qa: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
    },
    { underscored: true, tableName: 'monitoring_insight_snapshots' },
  );

  MonitoringInsightsSnapshot.prototype.toOverviewPayload = function () {
    const plain = this.get({ plain: true });
    return {
      timeframe: plain.timeframe,
      capturedAt: plain.capturedAt.toISOString(),
      summary: {
        totalReach: Number(plain.totalReach),
        totalReachDelta: Number.parseFloat(plain.totalReachDelta),
        engagementRate: Number.parseFloat(plain.engagementRate),
        engagementRateDelta: Number.parseFloat(plain.engagementRateDelta),
        conversionLift: Number.parseFloat(plain.conversionLift),
        conversionLiftDelta: Number.parseFloat(plain.conversionLiftDelta),
        anomalyCoverage: Number.parseFloat(plain.anomalyCoverage),
        anomalyCoverageDelta: Number.parseFloat(plain.anomalyCoverageDelta),
      },
      timeline: plain.timeline,
      personas: plain.personas,
      anomalies: plain.anomalies,
      roadmap: plain.roadmap,
      narratives: plain.narratives,
      journeys: plain.journeys,
      qa: plain.qa,
    };
  };

  const MonitoringMetric = sequelize.define(
    'MonitoringMetric',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      metricKey: { type: DataTypes.STRING(80), allowNull: false },
      label: { type: DataTypes.STRING(160), allowNull: false },
      value: { type: DataTypes.DECIMAL(10, 4), allowNull: false, defaultValue: 0 },
      delta: { type: DataTypes.DECIMAL(8, 4), allowNull: false, defaultValue: 0 },
      sampleSize: { type: DataTypes.INTEGER, allowNull: true },
      narrative: { type: DataTypes.TEXT, allowNull: true },
      sparkline: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      tags: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      persona: { type: DataTypes.STRING(80), allowNull: true },
      personaLabel: { type: DataTypes.STRING(160), allowNull: true },
      channel: { type: DataTypes.STRING(80), allowNull: true },
      channelLabel: { type: DataTypes.STRING(160), allowNull: true },
      timeframe: { type: DataTypes.STRING(16), allowNull: false, defaultValue: '14d' },
      compareTo: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'previous_period' },
      includeBenchmarks: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { underscored: true, tableName: 'monitoring_metrics' },
  );

  MonitoringMetric.prototype.toExplorerMetric = function () {
    const plain = this.get({ plain: true });
    return {
      id: plain.id,
      key: plain.metricKey,
      label: plain.label,
      value: Number.parseFloat(plain.value),
      delta: Number.parseFloat(plain.delta),
      sampleSize: plain.sampleSize,
      narrative: plain.narrative,
      sparkline: plain.sparkline,
      tags: plain.tags,
      persona: plain.persona,
      personaLabel: plain.personaLabel,
      channel: plain.channel,
      channelLabel: plain.channelLabel,
      timeframe: plain.timeframe,
      compareTo: plain.compareTo,
      includeBenchmarks: Boolean(plain.includeBenchmarks),
    };
  };

  const MonitoringMetricAlert = sequelize.define(
    'MonitoringMetricAlert',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      metricKey: { type: DataTypes.STRING(80), allowNull: false },
      title: { type: DataTypes.STRING(160), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false },
      status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'watching' },
      threshold: { type: DataTypes.DECIMAL(10, 4), allowNull: true },
      value: { type: DataTypes.DECIMAL(10, 4), allowNull: true },
      severity: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'medium' },
      timeframe: { type: DataTypes.STRING(16), allowNull: false, defaultValue: '14d' },
      persona: { type: DataTypes.STRING(80), allowNull: true },
      channel: { type: DataTypes.STRING(80), allowNull: true },
    },
    { underscored: true, tableName: 'monitoring_metric_alerts' },
  );

  MonitoringMetricAlert.prototype.toExplorerAlert = function () {
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
      persona: plain.persona,
      channel: plain.channel,
    };
  };

  const MonitoringMetricsSavedView = sequelize.define(
    'MonitoringMetricsSavedView',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING(160), allowNull: false },
      timeframe: { type: DataTypes.STRING(16), allowNull: false, defaultValue: '14d' },
      query: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
      createdBy: { type: DataTypes.STRING(120), allowNull: true },
    },
    { underscored: true, tableName: 'monitoring_metric_views' },
  );

  MonitoringMetricsSavedView.prototype.toExplorerView = function () {
    const plain = this.get({ plain: true });
    return {
      id: plain.id,
      name: plain.name,
      timeframe: plain.timeframe,
      query: plain.query,
      createdBy: plain.createdBy,
      createdAt: plain.createdAt?.toISOString?.() ?? null,
      updatedAt: plain.updatedAt?.toISOString?.() ?? null,
    };
  };

  const MonitoringAuditEvent = sequelize.define(
    'MonitoringAuditEvent',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      severity: { type: DataTypes.STRING(16), allowNull: false },
      action: { type: DataTypes.STRING(160), allowNull: false },
      summary: { type: DataTypes.STRING(400), allowNull: false },
      actorName: { type: DataTypes.STRING(160), allowNull: false },
      actorType: { type: DataTypes.STRING(80), allowNull: false },
      resourceKey: { type: DataTypes.STRING(160), allowNull: false },
      resourceLabel: { type: DataTypes.STRING(160), allowNull: false },
      resourceType: { type: DataTypes.STRING(80), allowNull: false },
      occurredAt: { type: DataTypes.DATE, allowNull: false },
      metadata: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
      relatedIncidents: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    },
    { underscored: true, tableName: 'monitoring_audit_events' },
  );

  MonitoringAuditEvent.prototype.toViewerEvent = function () {
    const plain = this.get({ plain: true });
    return {
      id: plain.id,
      severity: plain.severity,
      action: plain.action,
      summary: plain.summary,
      actor: { name: plain.actorName, type: plain.actorType },
      resource: { key: plain.resourceKey, label: plain.resourceLabel, type: plain.resourceType },
      timestamp: plain.occurredAt.toISOString(),
      metadata: plain.metadata,
      relatedIncidents: plain.relatedIncidents,
    };
  };

  const MonitoringAuditSummary = sequelize.define(
    'MonitoringAuditSummary',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      timeframe: { type: DataTypes.STRING(16), allowNull: false, unique: true },
      totalEvents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      criticalEvents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      medianResponseMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      compliancePosture: { type: DataTypes.STRING(320), allowNull: false },
      residualRiskNarrative: { type: DataTypes.STRING(400), allowNull: false },
    },
    { underscored: true, tableName: 'monitoring_audit_summaries' },
  );

  MonitoringAuditSummary.prototype.toViewerSummary = function () {
    const plain = this.get({ plain: true });
    return {
      timeframe: plain.timeframe,
      total: plain.totalEvents,
      critical: plain.criticalEvents,
      medianResponseMinutes: plain.medianResponseMinutes,
      compliancePosture: plain.compliancePosture,
      residualRiskNarrative: plain.residualRiskNarrative,
    };
  };

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    service.__setDependencies({
      models: {
        MonitoringInsightsSnapshot,
        MonitoringMetric,
        MonitoringMetricAlert,
        MonitoringMetricsSavedView,
        MonitoringAuditEvent,
        MonitoringAuditSummary,
        sequelize,
      },
      sequelize,
    });
  });

  afterAll(async () => {
    service.__resetDependencies();
    await fs.rm(path.join(process.cwd(), 'storage', 'exports', 'monitoring'), { recursive: true, force: true });
    await sequelize.close();
  });

  beforeEach(async () => {
    await MonitoringAuditEvent.destroy({ where: {} });
    await MonitoringMetricsSavedView.destroy({ where: {} });
    await MonitoringMetricAlert.destroy({ where: {} });
    await MonitoringMetric.destroy({ where: {} });
    await MonitoringInsightsSnapshot.destroy({ where: {} });
    await MonitoringAuditSummary.destroy({ where: {} });
  });

  it('returns the latest insights overview for a timeframe', async () => {
    await MonitoringInsightsSnapshot.bulkCreate([
      {
        timeframe: '14d',
        capturedAt: new Date('2024-06-01T12:00:00Z'),
        totalReach: 1200,
        totalReachDelta: 0.12,
        engagementRate: 0.4,
        engagementRateDelta: 0.08,
        conversionLift: 0.21,
        conversionLiftDelta: 0.04,
        anomalyCoverage: 0.9,
        anomalyCoverageDelta: 0.15,
        timeline: [{ value: 0.2 }],
      },
      {
        timeframe: '14d',
        capturedAt: new Date('2024-06-02T12:00:00Z'),
        totalReach: 1800,
        totalReachDelta: 0.15,
        engagementRate: 0.42,
        engagementRateDelta: 0.1,
        conversionLift: 0.25,
        conversionLiftDelta: 0.06,
        anomalyCoverage: 0.92,
        anomalyCoverageDelta: 0.18,
        timeline: [{ value: 0.25 }],
      },
    ]);

    const overview = await service.getInsightsOverview({ timeframe: '14d' });
    expect(overview.summary.totalReach).toBe(1800);
    expect(overview.timeline).toEqual([{ value: 0.25 }]);
  });

  it('lists metrics explorer data with alerts and search filtering', async () => {
    await MonitoringMetric.create({
      timeframe: '14d',
      metricKey: 'engagementRate',
      label: 'Engagement rate',
      value: 0.41,
      delta: 0.05,
      sampleSize: 1000,
      narrative: 'Great progress',
      sparkline: [{ value: 0.2 }],
      tags: ['narrative'],
      persona: 'creators',
      personaLabel: 'Creators',
      channel: 'email',
      channelLabel: 'Email',
      includeBenchmarks: true,
    });
    await MonitoringMetricAlert.create({
      timeframe: '14d',
      metricKey: 'engagementRate',
      title: 'Alert',
      description: 'Threshold breached',
      status: 'at_risk',
      threshold: 0.35,
      value: 0.41,
      severity: 'high',
    });

    const explorer = await service.listMetricsExplorer({ timeframe: '14d', search: 'progress' });
    expect(explorer.metrics).toHaveLength(1);
    expect(explorer.metrics[0].label).toBe('Engagement rate');
    expect(explorer.alerts).toHaveLength(1);
    expect(explorer.filters.metrics[0]).toEqual({ value: 'engagementRate', label: 'Engagement rate' });
  });

  it('creates and deletes saved metric views', async () => {
    const created = await service.createMetricsExplorerView(
      {
        name: 'Executive pulse',
        query: {
          timeframe: '14d',
          metric: 'engagementRate',
          persona: 'creators',
          includeBenchmarks: true,
        },
      },
      { actorId: 42 },
    );

    expect(created.name).toBe('Executive pulse');

    const views = await service.listMetricsExplorerViews();
    expect(views).toHaveLength(1);

    await service.deleteMetricsExplorerView(created.id);
    expect(await service.listMetricsExplorerViews()).toHaveLength(0);
  });

  it('lists audit trail data with pagination and filters', async () => {
    await MonitoringAuditEvent.bulkCreate([
      {
        severity: 'high',
        action: 'policy.updated',
        summary: 'Updated policy',
        actorName: 'Sonia Malik',
        actorType: 'compliance_manager',
        resourceKey: 'policy-1',
        resourceLabel: 'Consent policy',
        resourceType: 'policy',
        occurredAt: new Date(),
        metadata: { responseMinutes: 28 },
      },
      {
        severity: 'medium',
        action: 'workflow.published',
        summary: 'Published workflow',
        actorName: 'Marcel Ortiz',
        actorType: 'operations_lead',
        resourceKey: 'workflow-1',
        resourceLabel: 'Creator onboarding',
        resourceType: 'workflow',
        occurredAt: new Date(),
        metadata: { responseMinutes: 35 },
      },
    ]);
    await MonitoringAuditSummary.create({
      timeframe: '14d',
      totalEvents: 24,
      criticalEvents: 2,
      medianResponseMinutes: 32,
      compliancePosture: 'Excellent',
      residualRiskNarrative: 'Monitor webhook verification.',
    });

    const trail = await service.listAuditTrail({ timeframe: '14d', page: 1, pageSize: 10 });
    expect(trail.items).toHaveLength(2);
    expect(trail.summary.total).toBe(24);
    expect(trail.filters.severities.find((option) => option.value === 'high')).toBeTruthy();
  });

  it('exports audit trail rows to disk', async () => {
    await MonitoringAuditEvent.create({
      severity: 'high',
      action: 'policy.updated',
      summary: 'Updated policy',
      actorName: 'Sonia Malik',
      actorType: 'compliance_manager',
      resourceKey: 'policy-1',
      resourceLabel: 'Consent policy',
      resourceType: 'policy',
      occurredAt: new Date(),
      metadata: { responseMinutes: 28 },
    });

    const result = await service.exportAuditTrail({ timeframe: '14d' });
    expect(result.fileUrl).toContain('/exports/monitoring/');
    expect(result.filePath).toContain(path.join('storage', 'exports', 'monitoring'));

    const content = await fs.readFile(result.filePath, 'utf8');
    expect(content.split('\n').length).toBeGreaterThan(1);
  });
});
