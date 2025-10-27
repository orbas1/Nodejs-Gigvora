import { DataTypes } from 'sequelize';

import sequelize from './sequelizeClient.js';

const DIALECT = sequelize.getDialect();
const JSON_TYPE = ['postgres', 'postgresql'].includes(DIALECT) ? DataTypes.JSONB : DataTypes.JSON;

function defineModel(name, attributes, options = {}) {
  if (sequelize.models[name]) {
    return sequelize.models[name];
  }
  return sequelize.define(name, attributes, options);
}

export const EnterpriseReleaseTrack = defineModel(
  'EnterpriseReleaseTrack',
  {
    platformKey: { type: DataTypes.STRING(80), allowNull: false, unique: true, field: 'platform_key' },
    platformName: { type: DataTypes.STRING(160), allowNull: false, field: 'platform_name' },
    channel: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'stable' },
    currentVersion: { type: DataTypes.STRING(64), allowNull: false, field: 'current_version' },
    parityScore: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 100, field: 'parity_score' },
    mobileReadiness: { type: DataTypes.DECIMAL(5, 2), allowNull: true, field: 'mobile_readiness' },
    releaseVelocityWeeks: { type: DataTypes.DECIMAL(5, 2), allowNull: true, field: 'release_velocity_weeks' },
    lastReleaseAt: { type: DataTypes.DATE, allowNull: true, field: 'last_release_at' },
    nextReleaseWindow: { type: DataTypes.DATE, allowNull: true, field: 'next_release_window' },
    status: {
      type: DataTypes.ENUM('stable', 'rolling', 'delayed', 'blocked'),
      allowNull: false,
      defaultValue: 'stable',
    },
    blockers: { type: JSON_TYPE, allowNull: false, defaultValue: [] },
    notes: { type: DataTypes.TEXT, allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: 'enterprise_release_tracks',
    underscored: true,
    paranoid: false,
  },
);

export const ExecutiveAlignmentInitiative = defineModel(
  'ExecutiveAlignmentInitiative',
  {
    initiativeKey: { type: DataTypes.STRING(120), allowNull: false, unique: true, field: 'initiative_key' },
    title: { type: DataTypes.STRING(255), allowNull: false },
    executiveOwner: { type: DataTypes.STRING(160), allowNull: false, field: 'executive_owner' },
    sponsorTeam: { type: DataTypes.STRING(160), allowNull: true, field: 'sponsor_team' },
    status: {
      type: DataTypes.ENUM('planning', 'on_track', 'at_risk', 'blocked', 'complete'),
      allowNull: false,
      defaultValue: 'planning',
    },
    progressPercent: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0, field: 'progress_percent' },
    riskLevel: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'medium',
      field: 'risk_level',
    },
    nextMilestoneAt: { type: DataTypes.DATE, allowNull: true, field: 'next_milestone_at' },
    lastReviewAt: { type: DataTypes.DATE, allowNull: true, field: 'last_review_at' },
    governanceCadence: { type: DataTypes.STRING(120), allowNull: true, field: 'governance_cadence' },
    outcomeMetric: { type: DataTypes.STRING(160), allowNull: true, field: 'outcome_metric' },
    narrative: { type: DataTypes.TEXT, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'executive_alignment_initiatives',
    underscored: true,
    paranoid: false,
  },
);

export default {
  sequelize,
  EnterpriseReleaseTrack,
  ExecutiveAlignmentInitiative,
};
