import { Sequelize, DataTypes } from 'sequelize';

import * as service from '../releaseManagementService.js';

describe('releaseManagementService', () => {
  const sequelize = new Sequelize('sqlite::memory:', { logging: false });

  const jsonType = DataTypes.JSON;

  const ReleasePipeline = sequelize.define(
    'ReleasePipeline',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      key: { type: DataTypes.STRING(120), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(200), allowNull: false },
      version: { type: DataTypes.STRING(60), allowNull: true },
      summary: { type: DataTypes.TEXT, allowNull: true },
      ownerName: { type: DataTypes.STRING(160), allowNull: true },
      ownerEmail: { type: DataTypes.STRING(160), allowNull: true },
      status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'in_progress' },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      activePhaseKey: { type: DataTypes.STRING(120), allowNull: true },
      startedAt: { type: DataTypes.DATE, allowNull: true },
      targetReleaseAt: { type: DataTypes.DATE, allowNull: true },
      releasedAt: { type: DataTypes.DATE, allowNull: true },
      releaseNotesUrl: { type: DataTypes.STRING(255), allowNull: true },
      releaseNotesRef: { type: DataTypes.STRING(160), allowNull: true },
      metadata: { type: jsonType, allowNull: false, defaultValue: {} },
    },
    { tableName: 'release_pipelines', underscored: true },
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

  const ReleasePhase = sequelize.define(
    'ReleasePhase',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      releaseId: { type: DataTypes.INTEGER, allowNull: false },
      key: { type: DataTypes.STRING(120), allowNull: false },
      name: { type: DataTypes.STRING(160), allowNull: false },
      summary: { type: DataTypes.STRING(400), allowNull: true },
      ownerName: { type: DataTypes.STRING(160), allowNull: true },
      status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'pending' },
      coveragePercent: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
      orderIndex: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      startedAt: { type: DataTypes.DATE, allowNull: true },
      completedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'release_phases', underscored: true },
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

  const ReleaseSegment = sequelize.define(
    'ReleaseSegment',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      releaseId: { type: DataTypes.INTEGER, allowNull: false },
      key: { type: DataTypes.STRING(120), allowNull: false },
      name: { type: DataTypes.STRING(160), allowNull: false },
      summary: { type: DataTypes.STRING(400), allowNull: true },
      ownerName: { type: DataTypes.STRING(160), allowNull: true },
      status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'pending' },
      coveragePercent: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    },
    { tableName: 'release_segments', underscored: true },
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

  const ReleaseChecklistItem = sequelize.define(
    'ReleaseChecklistItem',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      releaseId: { type: DataTypes.INTEGER, allowNull: false },
      key: { type: DataTypes.STRING(120), allowNull: false },
      name: { type: DataTypes.STRING(200), allowNull: false },
      description: { type: DataTypes.STRING(400), allowNull: true },
      ownerName: { type: DataTypes.STRING(160), allowNull: true },
      status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'pending' },
      dueAt: { type: DataTypes.DATE, allowNull: true },
      completedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'release_checklist_items', underscored: true },
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

  const ReleaseMonitor = sequelize.define(
    'ReleaseMonitor',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      releaseId: { type: DataTypes.INTEGER, allowNull: true },
      monitorKey: { type: DataTypes.STRING(120), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(200), allowNull: false },
      description: { type: DataTypes.STRING(400), allowNull: true },
      environment: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'production' },
      status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'unknown' },
      coveragePercent: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
      metrics: { type: jsonType, allowNull: false, defaultValue: {} },
      metadata: { type: jsonType, allowNull: false, defaultValue: {} },
      lastSampledAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'release_monitors', underscored: true },
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

  const ReleaseEvent = sequelize.define(
    'ReleaseEvent',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      releaseId: { type: DataTypes.INTEGER, allowNull: true },
      eventType: { type: DataTypes.STRING(80), allowNull: false },
      resourceKey: { type: DataTypes.STRING(160), allowNull: true },
      status: { type: DataTypes.STRING(32), allowNull: true },
      summary: { type: DataTypes.STRING(400), allowNull: true },
      actorName: { type: DataTypes.STRING(160), allowNull: true },
      actorRole: { type: DataTypes.STRING(120), allowNull: true },
      payload: { type: jsonType, allowNull: false, defaultValue: {} },
      occurredAt: { type: DataTypes.DATE, allowNull: false },
    },
    { tableName: 'release_events', underscored: true },
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

  const ReleasePipelineRun = sequelize.define(
    'ReleasePipelineRun',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      releaseId: { type: DataTypes.INTEGER, allowNull: true },
      pipelineKey: { type: DataTypes.STRING(120), allowNull: false },
      status: { type: DataTypes.STRING(32), allowNull: false },
      startedAt: { type: DataTypes.DATE, allowNull: false },
      completedAt: { type: DataTypes.DATE, allowNull: true },
      durationMs: { type: DataTypes.INTEGER, allowNull: true },
      tasks: { type: jsonType, allowNull: false, defaultValue: [] },
      metadata: { type: jsonType, allowNull: false, defaultValue: {} },
    },
    { tableName: 'release_pipeline_runs', underscored: true },
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

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    service.__setDependencies({
      models: {
        ReleasePipeline,
        ReleasePhase,
        ReleaseSegment,
        ReleaseChecklistItem,
        ReleaseMonitor,
        ReleaseEvent,
        ReleasePipelineRun,
        sequelize,
      },
      sequelize,
    });
  });

  afterAll(async () => {
    service.__resetDependencies();
    await sequelize.close();
  });

  beforeEach(async () => {
    await ReleasePipelineRun.destroy({ where: {} });
    await ReleaseEvent.destroy({ where: {} });
    await ReleaseMonitor.destroy({ where: {} });
    await ReleaseChecklistItem.destroy({ where: {} });
    await ReleaseSegment.destroy({ where: {} });
    await ReleasePhase.destroy({ where: {} });
    await ReleasePipeline.destroy({ where: {} });
  });

  it('upserts an active release and returns snapshot', async () => {
    await service.upsertActiveRelease({
      key: '2025-network-elevation',
      name: 'Network Elevation',
      version: '2025.05',
      owner: 'ops@gigvora.com',
      phases: [
        { key: 'plan', name: 'Plan', status: 'complete', coverage: 100 },
        { key: 'canary', name: 'Canary', status: 'in_progress', coverage: 40 },
      ],
      segments: [{ key: 'enterprise', name: 'Enterprise', status: 'rolling_out', coverage: 45 }],
      checklist: [{ key: 'ci-signed-off', name: 'CI signed off', status: 'pending' }],
    });

    const snapshot = await service.getReleaseRolloutSnapshot();
    expect(snapshot.active).toBe(true);
    expect(snapshot.release.name).toBe('Network Elevation');
    expect(snapshot.release.phase).toBe('canary');
    expect(snapshot.release.phases).toHaveLength(2);
    expect(snapshot.checklist.total).toBe(1);
  });

  it('updates phase and checklist status with audit events', async () => {
    await service.upsertActiveRelease({
      key: '2025-network-elevation',
      name: 'Network Elevation',
      phases: [
        { key: 'plan', name: 'Plan', status: 'complete', coverage: 100 },
        { key: 'canary', name: 'Canary', status: 'in_progress', coverage: 40 },
      ],
      checklist: [{ key: 'ci-signed-off', name: 'CI signed off', status: 'pending' }],
    });

    const phase = await service.markReleasePhaseStatus('canary', 'complete', {
      coverage: 75,
      summary: 'Canary cohorts validated.',
    });
    expect(phase.status).toBe('complete');
    expect(phase.coverage).toBe(75);

    const checklistItem = await service.markChecklistItemStatus('ci-signed-off', 'complete', {
      summary: 'CI pipeline green.',
    });
    expect(checklistItem.status).toBe('complete');

    const events = await ReleaseEvent.findAll({ order: [['occurredAt', 'ASC']] });
    const eventTypes = events.map((event) => event.eventType);
    expect(eventTypes).toEqual(expect.arrayContaining(['phase_status', 'checklist_status']));
  });

  it('returns phases ordered by sequence index within rollout snapshots', async () => {
    await service.upsertActiveRelease({
      key: '2025-network-elevation',
      name: 'Network Elevation',
      phases: [
        { key: 'plan', name: 'Plan', status: 'complete', coverage: 100 },
        { key: 'canary', name: 'Canary', status: 'in_progress', coverage: 40 },
        { key: 'global', name: 'Global rollout', status: 'pending', coverage: 0 },
      ],
    });

    const release = await ReleasePipeline.findOne({ include: [{ model: ReleasePhase, as: 'phases' }] });
    const phasesByKey = Object.fromEntries(release.phases.map((phase) => [phase.key, phase]));
    await phasesByKey.plan.update({ orderIndex: 2 });
    await phasesByKey.canary.update({ orderIndex: 0 });
    await phasesByKey.global.update({ orderIndex: 1 });

    const snapshot = await service.getReleaseRolloutSnapshot();
    const phaseKeys = snapshot.release.phases.map((phase) => phase.key);
    expect(phaseKeys).toEqual(['canary', 'global', 'plan']);
    expect(snapshot.release.phases.map((phase) => phase.order)).toEqual([0, 1, 2]);
  });

  it('records monitor samples and pipeline runs', async () => {
    await service.upsertActiveRelease({ key: '2025-network-elevation', name: 'Network Elevation' });

    const monitor = await service.recordMonitorSample('ci-frontend-test', {
      name: 'CI Frontend tests',
      environment: 'ci',
      status: 'passing',
      metrics: { durationMs: 42000 },
    });
    expect(monitor.status).toBe('passing');
    expect(monitor.metrics.durationMs).toBe(42000);

    const run = await service.recordPipelineRunResult(
      'full-stack-ci',
      {
        status: 'failed',
        startedAt: new Date('2025-04-20T10:00:00Z'),
        completedAt: new Date('2025-04-20T10:03:00Z'),
        durationMs: 180000,
        tasks: [{ name: 'frontend:test', status: 'failed', durationMs: 60000 }],
      },
      {},
    );
    expect(run.status).toBe('failed');
    expect(run.tasks).toHaveLength(1);

    const events = await ReleaseEvent.findAll({ order: [['occurredAt', 'DESC']] });
    const latestEvent = events[0];
    expect(latestEvent.eventType).toBe('pipeline_run');
  });

  it('provides aggregated release state with events and pipeline history', async () => {
    await service.upsertActiveRelease({
      key: '2025-network-elevation',
      name: 'Network Elevation',
      phases: [{ key: 'plan', name: 'Plan', status: 'complete', coverage: 100 }],
      checklist: [{ key: 'launch', name: 'Launch readiness', status: 'pending' }],
    });

    await service.recordMonitorSample('api-latency', {
      name: 'API latency',
      status: 'warning',
      environment: 'production',
      metrics: { p95Ms: 320 },
      coverage: 80,
    });

    await service.recordPipelineRunResult('full-stack-ci', { status: 'passed', tasks: [] });

    const state = await service.getReleaseState();
    expect(state.release.name).toBe('Network Elevation');
    expect(state.monitors).toHaveLength(1);
    expect(state.pipelineRuns.length).toBeGreaterThanOrEqual(1);
    expect(state.events.length).toBeGreaterThanOrEqual(1);
  });
});
