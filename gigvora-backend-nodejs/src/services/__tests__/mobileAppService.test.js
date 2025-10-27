import { Sequelize, DataTypes } from 'sequelize';

const PLATFORMS = ['ios', 'android'];
const STATUSES = ['active', 'paused', 'retired'];
const RELEASE_CHANNELS = ['production', 'beta', 'internal'];
const COMPLIANCE_STATUSES = ['ok', 'review', 'blocked'];
const VERSION_STATUSES = ['draft', 'in_review', 'released', 'deprecated'];
const VERSION_TYPES = ['major', 'minor', 'patch', 'hotfix'];
const FEATURE_ROLLOUT_TYPES = ['global', 'percentage', 'cohort'];

const testSequelize = new Sequelize('sqlite::memory:', { logging: false });

const MobileApp = testSequelize.define(
  'MobileApp',
  {
    displayName: { type: DataTypes.STRING(255), allowNull: false },
    slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    platform: { type: DataTypes.ENUM(...PLATFORMS), allowNull: false, defaultValue: 'ios' },
    status: { type: DataTypes.ENUM(...STATUSES), allowNull: false, defaultValue: 'active' },
    releaseChannel: { type: DataTypes.ENUM(...RELEASE_CHANNELS), allowNull: false, defaultValue: 'production' },
    complianceStatus: { type: DataTypes.ENUM(...COMPLIANCE_STATUSES), allowNull: false, defaultValue: 'ok' },
    currentVersion: { type: DataTypes.STRING(40), allowNull: true },
    latestBuildNumber: { type: DataTypes.STRING(40), allowNull: true },
    minimumSupportedVersion: { type: DataTypes.STRING(40), allowNull: true },
    storeUrl: { type: DataTypes.STRING(500), allowNull: true },
    supportEmail: { type: DataTypes.STRING(255), allowNull: true },
    supportUrl: { type: DataTypes.STRING(500), allowNull: true },
    marketingUrl: { type: DataTypes.STRING(500), allowNull: true },
    iconUrl: { type: DataTypes.STRING(500), allowNull: true },
    heroImageUrl: { type: DataTypes.STRING(500), allowNull: true },
    rolloutNotes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: DataTypes.JSON, allowNull: true },
  },
  { tableName: 'mobile_apps' },
);

const MobileAppVersion = testSequelize.define(
  'MobileAppVersion',
  {
    appId: { type: DataTypes.INTEGER, allowNull: false },
    version: { type: DataTypes.STRING(40), allowNull: false },
    buildNumber: { type: DataTypes.STRING(40), allowNull: true },
    status: { type: DataTypes.ENUM(...VERSION_STATUSES), allowNull: false, defaultValue: 'draft' },
    releaseType: { type: DataTypes.ENUM(...VERSION_TYPES), allowNull: false, defaultValue: 'patch' },
    releaseChannel: { type: DataTypes.ENUM(...RELEASE_CHANNELS), allowNull: false, defaultValue: 'production' },
    rolloutPercentage: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    downloadUrl: { type: DataTypes.STRING(500), allowNull: true },
    releaseNotes: { type: DataTypes.TEXT, allowNull: true },
    releaseNotesUrl: { type: DataTypes.STRING(500), allowNull: true },
    checksum: { type: DataTypes.STRING(120), allowNull: true },
    minOsVersion: { type: DataTypes.STRING(40), allowNull: true },
    sizeBytes: { type: DataTypes.BIGINT, allowNull: true },
    scheduledAt: { type: DataTypes.DATE, allowNull: true },
    releasedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: DataTypes.JSON, allowNull: true },
  },
  { tableName: 'mobile_app_versions' },
);

const MobileAppFeature = testSequelize.define(
  'MobileAppFeature',
  {
    appId: { type: DataTypes.INTEGER, allowNull: false },
    key: { type: DataTypes.STRING(160), allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    rolloutType: { type: DataTypes.ENUM(...FEATURE_ROLLOUT_TYPES), allowNull: false, defaultValue: 'global' },
    rolloutValue: { type: DataTypes.JSON, allowNull: true },
    minAppVersion: { type: DataTypes.STRING(40), allowNull: true },
    maxAppVersion: { type: DataTypes.STRING(40), allowNull: true },
    audienceRoles: { type: DataTypes.JSON, allowNull: true },
    metadata: { type: DataTypes.JSON, allowNull: true },
  },
  { tableName: 'mobile_app_features' },
);

MobileApp.hasMany(MobileAppVersion, { foreignKey: 'appId', as: 'versions', onDelete: 'CASCADE' });
MobileAppVersion.belongsTo(MobileApp, { foreignKey: 'appId', as: 'app' });
MobileApp.hasMany(MobileAppFeature, { foreignKey: 'appId', as: 'features', onDelete: 'CASCADE' });
MobileAppFeature.belongsTo(MobileApp, { foreignKey: 'appId', as: 'app' });

MobileApp.beforeValidate((app) => {
  if (!app.slug && app.displayName) {
    app.slug = app.displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 160);
  }
});

const serviceModule = await import('../mobileAppService.js');
serviceModule.__setDependencies({
  models: { MobileApp, MobileAppVersion, MobileAppFeature, sequelize: testSequelize },
  sequelize: testSequelize,
});

const {
  listMobileApps,
  createMobileApp,
  updateMobileApp,
  createMobileAppVersion,
  updateMobileAppVersion,
  createMobileAppFeature,
  updateMobileAppFeature,
  deleteMobileAppFeature,
} = serviceModule;

describe('mobileAppService', () => {
  beforeAll(async () => {
    await testSequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await MobileAppFeature.destroy({ where: {} });
    await MobileAppVersion.destroy({ where: {} });
    await MobileApp.destroy({ where: {} });
  });

  afterAll(async () => {
    await testSequelize.close();
    serviceModule.__resetDependencies();
  });

  it('creates and lists mobile apps with summary metrics', async () => {
    const app = await createMobileApp({
      displayName: 'Gigvora Companion',
      platform: 'ios',
      status: 'active',
      releaseChannel: 'beta',
      complianceStatus: 'ok',
      storeUrl: 'https://apps.apple.com/app',
    });

    expect(app).toMatchObject({
      displayName: 'Gigvora Companion',
      platform: 'ios',
      status: 'active',
      releaseChannel: 'beta',
    });

    const created = await MobileApp.findByPk(app.id);
    await MobileAppVersion.create({
      appId: created.id,
      version: '2.5.0',
      status: 'in_review',
      releaseType: 'minor',
      releaseChannel: 'beta',
      rolloutPercentage: 50,
      scheduledAt: new Date(Date.now() + 3600_000),
    });
    await MobileAppFeature.create({
      appId: created.id,
      key: 'mobile-ai',
      name: 'Mobile AI Insights',
      enabled: true,
      rolloutType: 'percentage',
      rolloutValue: { percentage: 25 },
      audienceRoles: ['mentor'],
    });

    const result = await listMobileApps({ includeInactive: true });
    expect(result.apps).toHaveLength(1);
    expect(result.summary.totalApps).toBe(1);
    expect(result.summary.pendingReviews).toBe(1);
    expect(result.summary.upcomingReleases).toBe(1);
    expect(result.summary.activeFeatures).toBe(1);
    expect(result.apps[0]).toMatchObject({
      displayName: 'Gigvora Companion',
      platform: 'ios',
      versions: expect.any(Array),
      features: expect.any(Array),
    });
  });

  it('updates mobile app attributes', async () => {
    const app = await createMobileApp({ displayName: 'Gigvora Companion', platform: 'ios' });
    const updated = await updateMobileApp(app.id, {
      displayName: 'Gigvora Executive Companion',
      status: 'paused',
      releaseChannel: 'internal',
      complianceStatus: 'review',
      supportEmail: 'support@gigvora.com',
      marketingUrl: 'https://gigvora.com/mobile',
    });

    expect(updated).toMatchObject({
      displayName: 'Gigvora Executive Companion',
      status: 'paused',
      releaseChannel: 'internal',
      complianceStatus: 'review',
      supportEmail: 'support@gigvora.com',
      marketingUrl: 'https://gigvora.com/mobile',
    });
  });

  it('creates and updates mobile app versions', async () => {
    const app = await createMobileApp({ displayName: 'Gigvora Companion', platform: 'ios' });
    const version = await createMobileAppVersion(app.id, {
      version: '3.0.0',
      releaseType: 'major',
      status: 'in_review',
      releaseChannel: 'beta',
      rolloutPercentage: 30,
      downloadUrl: 'https://cdn.gigvora.com/app.ipa',
      scheduledAt: new Date().toISOString(),
    });

    expect(version).toMatchObject({ version: '3.0.0', releaseType: 'major', status: 'in_review' });

    const updated = await updateMobileAppVersion(app.id, version.id, {
      status: 'released',
      rolloutPercentage: 100,
      releasedAt: new Date().toISOString(),
    });

    expect(updated).toMatchObject({ status: 'released', rolloutPercentage: 100 });
  });

  it('creates, updates, and deletes mobile app features', async () => {
    const app = await createMobileApp({ displayName: 'Gigvora Companion', platform: 'ios' });
    const feature = await createMobileAppFeature(app.id, {
      key: 'mobile-ai',
      name: 'Mobile AI Insights',
      enabled: true,
      rolloutType: 'percentage',
      rolloutPercentage: 50,
      audienceRoles: ['mentor', 'founder'],
    });

    expect(feature).toMatchObject({ key: 'mobile-ai', enabled: true, rolloutType: 'percentage' });
    expect(feature.audienceRoles).toEqual(expect.arrayContaining(['mentor', 'founder']));

    const updated = await updateMobileAppFeature(app.id, feature.id, {
      rolloutType: 'cohort',
      audienceRoles: ['mentor'],
      enabled: false,
    });

    expect(updated).toMatchObject({ rolloutType: 'cohort', enabled: false });
    expect(updated.audienceRoles).toEqual(['mentor']);

    await deleteMobileAppFeature(app.id, feature.id);
    const count = await MobileAppFeature.count();
    expect(count).toBe(0);
  });
});
