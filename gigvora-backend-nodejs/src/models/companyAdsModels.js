import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

function defineModel(name, attributes, options, toPublicObject) {
  const existing = sequelize.models[name];
  if (existing) {
    if (toPublicObject && !existing.prototype.toPublicObject) {
      existing.prototype.toPublicObject = toPublicObject;
    }
    return existing;
  }
  const model = sequelize.define(name, attributes, options);
  if (toPublicObject) {
    model.prototype.toPublicObject = toPublicObject;
  }
  return model;
}

export const AdCampaign = defineModel(
  'AdCampaign',
  {
    name: { type: DataTypes.STRING(255), allowNull: false },
    objective: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'brand' },
    status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'draft' },
    budgetCents: { type: DataTypes.BIGINT, allowNull: true },
    currencyCode: { type: DataTypes.STRING(8), allowNull: true },
    startDate: { type: DataTypes.DATE, allowNull: true },
    endDate: { type: DataTypes.DATE, allowNull: true },
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    metadata: { type: DataTypes.JSON, allowNull: true },
  },
  { tableName: 'ad_campaigns' },
  function toPublicObject() {
    const plain = this.get({ plain: true });
    return {
      id: plain.id,
      name: plain.name,
      objective: plain.objective,
      status: plain.status,
      budgetCents: plain.budgetCents == null ? null : Number(plain.budgetCents),
      currencyCode: plain.currencyCode ?? null,
      startDate: plain.startDate ?? null,
      endDate: plain.endDate ?? null,
      ownerId: plain.ownerId ?? null,
      metadata: plain.metadata ?? null,
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
    };
  },
);

export const AdCreative = defineModel(
  'AdCreative',
  {
    campaignId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    type: { type: DataTypes.STRING(40), allowNull: false },
    status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'draft' },
    format: { type: DataTypes.STRING(40), allowNull: true },
    headline: { type: DataTypes.STRING(255), allowNull: true },
    subheadline: { type: DataTypes.STRING(255), allowNull: true },
    body: { type: DataTypes.TEXT, allowNull: true },
    callToAction: { type: DataTypes.STRING(120), allowNull: true },
    ctaUrl: { type: DataTypes.STRING(1024), allowNull: true },
    mediaUrl: { type: DataTypes.STRING(1024), allowNull: true },
    durationSeconds: { type: DataTypes.INTEGER, allowNull: true },
    primaryColor: { type: DataTypes.STRING(16), allowNull: true },
    accentColor: { type: DataTypes.STRING(16), allowNull: true },
    metadata: { type: DataTypes.JSON, allowNull: true },
  },
  { tableName: 'ad_creatives' },
  function toPublicObject() {
    const plain = this.get({ plain: true });
    return {
      id: plain.id,
      campaignId: plain.campaignId,
      name: plain.name,
      type: plain.type,
      status: plain.status,
      format: plain.format ?? null,
      headline: plain.headline ?? null,
      subheadline: plain.subheadline ?? null,
      body: plain.body ?? null,
      callToAction: plain.callToAction ?? null,
      ctaUrl: plain.ctaUrl ?? null,
      mediaUrl: plain.mediaUrl ?? null,
      durationSeconds: plain.durationSeconds == null ? null : Number(plain.durationSeconds),
      primaryColor: plain.primaryColor ?? null,
      accentColor: plain.accentColor ?? null,
      metadata: plain.metadata ?? null,
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
    };
  },
);

export const AdPlacement = defineModel(
  'AdPlacement',
  {
    creativeId: { type: DataTypes.INTEGER, allowNull: false },
    surface: { type: DataTypes.STRING(80), allowNull: false },
    position: { type: DataTypes.STRING(80), allowNull: false },
    status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'scheduled' },
    pacingMode: { type: DataTypes.STRING(40), allowNull: true },
    weight: { type: DataTypes.INTEGER, allowNull: true },
    maxImpressionsPerHour: { type: DataTypes.INTEGER, allowNull: true },
    priority: { type: DataTypes.INTEGER, allowNull: true },
    startAt: { type: DataTypes.DATE, allowNull: true },
    endAt: { type: DataTypes.DATE, allowNull: true },
    opportunityType: { type: DataTypes.STRING(80), allowNull: true },
    metadata: { type: DataTypes.JSON, allowNull: true },
  },
  { tableName: 'ad_placements' },
  function toPublicObject() {
    const plain = this.get({ plain: true });
    return {
      id: plain.id,
      creativeId: plain.creativeId,
      surface: plain.surface,
      position: plain.position,
      status: plain.status,
      pacingMode: plain.pacingMode ?? null,
      weight: plain.weight == null ? null : Number(plain.weight),
      maxImpressionsPerHour:
        plain.maxImpressionsPerHour == null ? null : Number(plain.maxImpressionsPerHour),
      priority: plain.priority == null ? null : Number(plain.priority),
      startAt: plain.startAt,
      endAt: plain.endAt,
      opportunityType: plain.opportunityType ?? null,
      metadata: plain.metadata ?? null,
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
    };
  },
);

AdCampaign.hasMany(AdCreative, { foreignKey: 'campaignId', as: 'creatives', onDelete: 'CASCADE' });
AdCreative.belongsTo(AdCampaign, { foreignKey: 'campaignId', as: 'campaign' });
AdCreative.hasMany(AdPlacement, { foreignKey: 'creativeId', as: 'placements', onDelete: 'CASCADE' });
AdPlacement.belongsTo(AdCreative, { foreignKey: 'creativeId', as: 'creative' });

export default { AdCampaign, AdCreative, AdPlacement };
