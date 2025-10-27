import { Sequelize, DataTypes } from 'sequelize';

const testSequelize = new Sequelize('sqlite::memory:', { logging: false });

const EnterpriseReleaseTrack = testSequelize.define(
  'EnterpriseReleaseTrack',
  {
    platformKey: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    platformName: { type: DataTypes.STRING(160), allowNull: false },
    channel: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'stable' },
    currentVersion: { type: DataTypes.STRING(64), allowNull: false },
    parityScore: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 100 },
    mobileReadiness: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    releaseVelocityWeeks: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    lastReleaseAt: { type: DataTypes.DATE, allowNull: true },
    nextReleaseWindow: { type: DataTypes.DATE, allowNull: true },
    status: {
      type: DataTypes.ENUM('stable', 'rolling', 'delayed', 'blocked'),
      allowNull: false,
      defaultValue: 'stable',
    },
    blockers: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    notes: { type: DataTypes.TEXT, allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: 'enterprise_release_tracks' },
);

const ExecutiveAlignmentInitiative = testSequelize.define(
  'ExecutiveAlignmentInitiative',
  {
    initiativeKey: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    executiveOwner: { type: DataTypes.STRING(160), allowNull: false },
    sponsorTeam: { type: DataTypes.STRING(160), allowNull: true },
    status: {
      type: DataTypes.ENUM('planning', 'on_track', 'at_risk', 'blocked', 'complete'),
      allowNull: false,
      defaultValue: 'planning',
    },
    progressPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    riskLevel: { type: DataTypes.ENUM('low', 'medium', 'high'), allowNull: false, defaultValue: 'medium' },
    nextMilestoneAt: { type: DataTypes.DATE, allowNull: true },
    lastReviewAt: { type: DataTypes.DATE, allowNull: true },
    governanceCadence: { type: DataTypes.STRING(120), allowNull: true },
    outcomeMetric: { type: DataTypes.STRING(160), allowNull: true },
    narrative: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'executive_alignment_initiatives' },
);

const serviceModule = await import('../enterprise360Service.js');

const noopCache = {
  remember: async (_key, _ttl, factory) => factory(),
};

serviceModule.__setDependencies({
  models: { EnterpriseReleaseTrack, ExecutiveAlignmentInitiative },
  cache: noopCache,
});

const { getEnterprise360Snapshot, __resetDependencies } = serviceModule;

describe('enterprise360Service', () => {
  beforeAll(async () => {
    await testSequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await ExecutiveAlignmentInitiative.destroy({ where: {} });
    await EnterpriseReleaseTrack.destroy({ where: {} });
  });

  afterAll(async () => {
    await testSequelize.close();
    __resetDependencies();
  });

  it('aggregates parity, readiness, and governance signals', async () => {
    await EnterpriseReleaseTrack.bulkCreate([
      {
        platformKey: 'web_command_center',
        platformName: 'Web Command Center',
        currentVersion: '2024.09.1',
        parityScore: 99.2,
        mobileReadiness: 98.8,
        releaseVelocityWeeks: 2.5,
        nextReleaseWindow: new Date('2024-04-15T12:00:00Z'),
      },
      {
        platformKey: 'ios_companion',
        platformName: 'iOS Companion',
        currentVersion: '2.14.0',
        parityScore: 94.5,
        mobileReadiness: 95.5,
        releaseVelocityWeeks: 3,
        status: 'rolling',
        nextReleaseWindow: new Date('2024-04-10T12:00:00Z'),
        blockers: [
          {
            code: 'privacy_review',
            severity: 'medium',
            summary: 'Awaiting updated app privacy submission.',
            owner: 'mobile-platform',
          },
        ],
      },
      {
        platformKey: 'android_companion',
        platformName: 'Android Companion',
        currentVersion: '2.13.2',
        parityScore: 90.1,
        mobileReadiness: 91.2,
        releaseVelocityWeeks: 3.2,
        status: 'blocked',
        nextReleaseWindow: new Date('2024-04-20T12:00:00Z'),
        blockers: [
          {
            code: 'play_store',
            severity: 'high',
            summary: 'Play Store compliance review pending.',
            owner: 'security',
          },
        ],
      },
    ]);

    await ExecutiveAlignmentInitiative.bulkCreate([
      {
        initiativeKey: 'enterprise-360-rollout',
        title: 'Enterprise 360 Rollout',
        executiveOwner: 'Alex Morgan',
        sponsorTeam: 'Platform PMO',
        status: 'on_track',
        progressPercent: 72.3,
        nextMilestoneAt: new Date('2024-04-18T16:00:00Z'),
        governanceCadence: 'Bi-weekly steering committee',
      },
      {
        initiativeKey: 'mobile-governance',
        title: 'Mobile Governance Harmonisation',
        executiveOwner: 'Jamie Rivera',
        sponsorTeam: 'Security & Compliance',
        status: 'at_risk',
        progressPercent: 45.5,
        nextMilestoneAt: new Date('2024-04-12T11:00:00Z'),
        governanceCadence: 'Weekly tiger team sync',
      },
    ]);

    const snapshot = await getEnterprise360Snapshot();

    expect(snapshot.summary.parityScore).toBeCloseTo((99.2 + 94.5 + 90.1) / 3, 1);
    expect(snapshot.summary.mobileReadinessScore).toBeCloseTo((95.5 + 91.2) / 2, 1);
    expect(snapshot.summary.releaseVelocityWeeks).toBeCloseTo((2.5 + 3 + 3.2) / 3, 1);
    expect(snapshot.summary.mobileContinuityRisk).toBe('critical');
    expect(snapshot.summary.atRiskInitiativeCount).toBe(1);

    expect(snapshot.continuity.riskLevel).toBe('critical');
    expect(snapshot.continuity.platforms).toHaveLength(2);
    expect(snapshot.continuity.platforms.map((track) => track.platformKey)).toEqual(
      expect.arrayContaining(['ios_companion', 'android_companion']),
    );

    expect(
      ['Weekly tiger team sync', 'Bi-weekly steering committee'],
    ).toContain(snapshot.governance.cadence);
    expect(snapshot.governance.atRiskCount).toBe(1);
    expect(snapshot.initiatives).toHaveLength(2);
    expect(snapshot.tracks.find((track) => track.platformKey === 'android_companion')?.status).toBe('blocked');
  });

  it('returns cached snapshot when includeInactive flag changes', async () => {
    await EnterpriseReleaseTrack.create({
      platformKey: 'tablet_pilot',
      platformName: 'Tablet Pilot',
      currentVersion: '2024.04.0-beta',
      parityScore: 88.4,
      mobileReadiness: 89.1,
      releaseVelocityWeeks: 4.2,
      status: 'blocked',
      active: false,
    });

    const withActive = await getEnterprise360Snapshot();
    const withInactive = await getEnterprise360Snapshot({ includeInactive: true });

    expect(withActive.tracks).toHaveLength(0);
    expect(withInactive.tracks).toHaveLength(1);
    expect(withInactive.summary.mobileContinuityRisk).toBe('steady');
  });
});
