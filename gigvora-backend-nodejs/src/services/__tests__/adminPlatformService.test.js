import { Sequelize, DataTypes } from 'sequelize';

const FEATURE_FLAG_STATUSES = ['draft', 'active', 'disabled'];
const FEATURE_FLAG_ROLLOUT_TYPES = ['global', 'percentage', 'cohort'];
const FEATURE_FLAG_AUDIENCE_TYPES = ['user', 'workspace', 'membership', 'domain'];

const testSequelize = new Sequelize('sqlite::memory:', { logging: false });

const FeatureFlag = testSequelize.define(
  'FeatureFlag',
  {
    key: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...FEATURE_FLAG_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
    },
    rolloutType: {
      type: DataTypes.ENUM(...FEATURE_FLAG_ROLLOUT_TYPES),
      allowNull: false,
      defaultValue: 'global',
    },
    rolloutPercentage: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    metadata: { type: DataTypes.JSON, allowNull: true },
  },
  { tableName: 'feature_flags' },
);

const FeatureFlagAssignment = testSequelize.define(
  'FeatureFlagAssignment',
  {
    flagId: { type: DataTypes.INTEGER, allowNull: false },
    audienceType: {
      type: DataTypes.ENUM(...FEATURE_FLAG_AUDIENCE_TYPES),
      allowNull: false,
      defaultValue: 'user',
    },
    audienceValue: { type: DataTypes.STRING(255), allowNull: false },
    rolloutPercentage: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    conditions: { type: DataTypes.JSON, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'feature_flag_assignments' },
);

FeatureFlag.hasMany(FeatureFlagAssignment, { foreignKey: 'flagId', as: 'assignments', onDelete: 'CASCADE' });
FeatureFlagAssignment.belongsTo(FeatureFlag, { foreignKey: 'flagId', as: 'flag' });

const serviceModule = await import('../adminPlatformService.js');
serviceModule.__setDependencies({
  models: { FeatureFlag, FeatureFlagAssignment, sequelize: testSequelize },
  sequelize: testSequelize,
});

const { listFeatureFlags, getFeatureFlag, updateFeatureFlag } = serviceModule;

const actor = { actorId: 101, roles: ['admin'] };

describe('adminPlatformService', () => {
  beforeAll(async () => {
    await testSequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await FeatureFlagAssignment.destroy({ where: {} });
    await FeatureFlag.destroy({ where: {} });
  });

  afterAll(async () => {
    await testSequelize.close();
    serviceModule.__resetDependencies();
  });

  it('lists feature flags with pagination and filtering', async () => {
    await FeatureFlag.bulkCreate([
      {
        key: 'mobile-app-beta',
        name: 'Mobile Companion Beta',
        description: 'Controls the beta programme for the mobile companion app.',
        status: 'active',
        rolloutType: 'percentage',
        rolloutPercentage: 25,
        metadata: { productArea: 'mobile' },
      },
      {
        key: 'mobile-profiles-ai-insights',
        name: 'AI Profile Insights',
        description: 'Enables AI generated insights in mobile profiles.',
        status: 'disabled',
        rolloutType: 'cohort',
        metadata: { productArea: 'mobile' },
      },
    ]);

    const allFlags = await listFeatureFlags();
    expect(allFlags.flags).toHaveLength(2);
    expect(allFlags.pagination.total).toBe(2);

    const activeFlags = await listFeatureFlags({ status: 'active' });
    expect(activeFlags.flags).toHaveLength(1);
    expect(activeFlags.flags[0]).toMatchObject({ key: 'mobile-app-beta', enabled: true });

    const searchResult = await listFeatureFlags({ search: 'ai' });
    expect(searchResult.flags).toHaveLength(1);
    expect(searchResult.flags[0].key).toBe('mobile-profiles-ai-insights');
  });

  it('returns flag details with assignments', async () => {
    const flag = await FeatureFlag.create({
      key: 'mobile-app-beta',
      name: 'Mobile Companion Beta',
      description: 'Controls the beta programme.',
      status: 'active',
      rolloutType: 'percentage',
      rolloutPercentage: 25,
      metadata: { productArea: 'mobile' },
    });

    await FeatureFlagAssignment.create({
      flagId: flag.id,
      audienceType: 'membership',
      audienceValue: 'mentor',
      rolloutPercentage: 25,
    });

    const record = await getFeatureFlag('mobile-app-beta');
    expect(record).toMatchObject({
      key: 'mobile-app-beta',
      enabled: true,
      assignments: expect.arrayContaining([
        expect.objectContaining({ audienceType: 'membership', audienceValue: 'mentor' }),
      ]),
    });
  });

  it('updates metadata, status, and assignments', async () => {
    const flag = await FeatureFlag.create({
      key: 'mobile-app-beta',
      name: 'Mobile Companion Beta',
      description: 'Controls the beta programme.',
      status: 'active',
      rolloutType: 'percentage',
      rolloutPercentage: 25,
      metadata: { productArea: 'mobile' },
    });

    await FeatureFlagAssignment.create({
      flagId: flag.id,
      audienceType: 'membership',
      audienceValue: 'mentor',
      rolloutPercentage: 25,
    });

    const updated = await updateFeatureFlag(
      'mobile-app-beta',
      {
        enabled: false,
        description: 'Temporarily paused for QA.',
        rolloutType: 'global',
        rolloutPercentage: null,
        metadata: { qaOwner: 'quality@gigvora.com' },
        assignments: [
          {
            audienceType: 'domain',
            audienceValue: 'gigvora.com',
            rolloutPercentage: 50,
          },
        ],
      },
      actor,
    );

    expect(updated.enabled).toBe(false);
    expect(updated.status).toBe('disabled');
    expect(updated.description).toContain('Temporarily paused');
    expect(updated.rolloutType).toBe('global');
    expect(updated.rolloutPercentage).toBeNull();
    expect(updated.metadata).toMatchObject({ productArea: 'mobile', qaOwner: 'quality@gigvora.com' });
    expect(updated.assignments).toHaveLength(1);
    expect(updated.assignments[0]).toMatchObject({ audienceType: 'domain', audienceValue: 'gigvora.com' });
  });
});
