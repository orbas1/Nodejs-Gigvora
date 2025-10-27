import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { Sequelize, DataTypes } from 'sequelize';

import FeatureFlagService from '../featureFlagService.js';

const testDb = new Sequelize('sqlite::memory:', { logging: false });

const FeatureFlag = testDb.define(
  'FeatureFlag',
  {
    key: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('draft', 'active', 'disabled'), allowNull: false, defaultValue: 'draft' },
    rolloutType: { type: DataTypes.ENUM('global', 'percentage', 'cohort'), allowNull: false, defaultValue: 'global' },
    rolloutPercentage: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    metadata: { type: DataTypes.JSON, allowNull: true },
  },
  { tableName: 'feature_flags' },
);

const FeatureFlagAssignment = testDb.define(
  'FeatureFlagAssignment',
  {
    flagId: { type: DataTypes.INTEGER, allowNull: false },
    audienceType: { type: DataTypes.ENUM('user', 'workspace', 'membership', 'domain'), allowNull: false },
    audienceValue: { type: DataTypes.STRING(255), allowNull: false },
    rolloutPercentage: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    conditions: { type: DataTypes.JSON, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'feature_flag_assignments' },
);

FeatureFlag.hasMany(FeatureFlagAssignment, { foreignKey: 'flagId', as: 'assignments' });
FeatureFlagAssignment.belongsTo(FeatureFlag, { foreignKey: 'flagId', as: 'flag' });

const domainRegistry = {
  getContextModels: () => ({ FeatureFlag, FeatureFlagAssignment }),
};

const service = new FeatureFlagService({ domainRegistry });

describe('FeatureFlagService', () => {
  beforeAll(async () => {
    await testDb.sync({ force: true });
  });

  beforeEach(async () => {
    await FeatureFlagAssignment.destroy({ where: {} });
    await FeatureFlag.destroy({ where: {} });
  });

  afterAll(async () => {
    await testDb.close();
  });

  it('returns evaluation metadata for global and disabled flags', async () => {
    await FeatureFlag.create({
      key: 'global-rollout',
      name: 'Global Rollout',
      status: 'active',
      rolloutType: 'global',
      metadata: { defaultVariant: 'general_availability' },
    });

    await FeatureFlag.create({
      key: 'disabled-flag',
      name: 'Disabled Flag',
      status: 'disabled',
      rolloutType: 'cohort',
      metadata: { owner: 'ops' },
    });

    const evaluation = await service.evaluateForUser(
      { id: 42, email: 'member@example.com', memberships: ['member'] },
      {},
    );

    expect(evaluation['global-rollout']).toMatchObject({
      enabled: true,
      status: 'active',
      variant: 'general_availability',
      reason: 'global_rollout',
    });
    expect(evaluation['disabled-flag']).toMatchObject({
      enabled: false,
      status: 'disabled',
      reason: 'flag_disabled',
    });
  });

  it('matches cohort assignments and merges metadata', async () => {
    const flag = await FeatureFlag.create({
      key: 'mentor-ai',
      name: 'Mentor AI Preview',
      status: 'active',
      rolloutType: 'cohort',
      metadata: { defaultVariant: 'ai_profile_annotations', productArea: 'mobile' },
    });

    await FeatureFlagAssignment.create({
      flagId: flag.id,
      audienceType: 'membership',
      audienceValue: 'mentor',
      rolloutPercentage: 100,
      conditions: {
        variant: 'mentor_ai_preview',
        metadata: { cohort: 'mentor-preview', channel: 'guided' },
      },
    });

    const evaluation = await service.evaluateForUser(
      { id: 77, email: 'coach@example.com', memberships: ['Mentor'] },
      {},
    );

    expect(evaluation['mentor-ai']).toMatchObject({
      enabled: true,
      reason: 'target_membership',
      variant: 'mentor_ai_preview',
      matchedAudience: { type: 'membership', value: 'mentor' },
    });
    expect(evaluation['mentor-ai'].metadata).toMatchObject({
      productArea: 'mobile',
      cohort: 'mentor-preview',
      channel: 'guided',
    });
  });

  it('enforces rollout gates for assignment percentages', async () => {
    const flag = await FeatureFlag.create({
      key: 'workspace-beta',
      name: 'Workspace Beta',
      status: 'active',
      rolloutType: 'cohort',
    });

    await FeatureFlagAssignment.create({
      flagId: flag.id,
      audienceType: 'workspace',
      audienceValue: '88',
      rolloutPercentage: 0,
    });

    const evaluation = await service.evaluateForUser(
      { id: 19, email: 'pilot@example.com', memberships: ['member'] },
      { workspaceIds: [88] },
    );

    expect(evaluation['workspace-beta']).toMatchObject({
      enabled: false,
      reason: 'assignment_not_matched',
    });
  });
});

