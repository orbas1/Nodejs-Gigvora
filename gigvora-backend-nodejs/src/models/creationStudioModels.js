import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const CREATION_STUDIO_ITEM_TYPES = [
  'project',
  'gig',
  'job',
  'launchpad_job',
  'launchpad_project',
  'volunteer_opportunity',
  'networking_session',
  'blog_post',
  'group',
  'page',
  'ad',
];

export const CREATION_STUDIO_ITEM_STATUSES = ['draft', 'scheduled', 'published', 'archived'];
export const CREATION_STUDIO_VISIBILITIES = ['private', 'workspace', 'public'];

export const CreationStudioItem = sequelize.define(
  'CreationStudioItem',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    type: { type: DataTypes.ENUM(...CREATION_STUDIO_ITEM_TYPES), allowNull: false },
    title: { type: DataTypes.STRING(180), allowNull: false },
    headline: { type: DataTypes.STRING(255), allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM(...CREATION_STUDIO_ITEM_STATUSES), allowNull: false, defaultValue: 'draft' },
    visibility: { type: DataTypes.ENUM(...CREATION_STUDIO_VISIBILITIES), allowNull: false, defaultValue: 'workspace' },
    category: { type: DataTypes.STRING(120), allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    targetAudience: { type: DataTypes.STRING(255), allowNull: true },
    launchDate: { type: DataTypes.DATE, allowNull: true },
    publishAt: { type: DataTypes.DATE, allowNull: true },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    endDate: { type: DataTypes.DATE, allowNull: true },
    imageUrl: { type: DataTypes.STRING(500), allowNull: true },
    tags: { type: jsonType, allowNull: true },
    settings: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    budgetAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    budgetCurrency: { type: DataTypes.STRING(6), allowNull: true },
    compensationMin: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    compensationMax: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    compensationCurrency: { type: DataTypes.STRING(6), allowNull: true },
    durationWeeks: { type: DataTypes.INTEGER, allowNull: true },
    commitmentHours: { type: DataTypes.INTEGER, allowNull: true },
    remoteEligible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: 'creation_studio_items',
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['workspaceId', 'type'] },
      { fields: ['type', 'status'] },
      { fields: ['status'] },
      { fields: ['launchDate'] },
      { fields: ['publishAt'] },
    ],
  },
);

CreationStudioItem.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    createdById: plain.createdById,
    type: plain.type,
    title: plain.title,
    headline: plain.headline,
    summary: plain.summary,
    content: plain.content,
    status: plain.status,
    visibility: plain.visibility,
    category: plain.category,
    location: plain.location,
    targetAudience: plain.targetAudience,
    launchDate: plain.launchDate,
    publishAt: plain.publishAt,
    publishedAt: plain.publishedAt,
    endDate: plain.endDate,
    imageUrl: plain.imageUrl,
    tags: Array.isArray(plain.tags) ? plain.tags : [],
    settings: plain.settings ?? {},
    metadata: plain.metadata ?? {},
    budgetAmount: plain.budgetAmount,
    budgetCurrency: plain.budgetCurrency,
    compensationMin: plain.compensationMin,
    compensationMax: plain.compensationMax,
    compensationCurrency: plain.compensationCurrency,
    durationWeeks: plain.durationWeeks,
    commitmentHours: plain.commitmentHours,
    remoteEligible: plain.remoteEligible,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    deletedAt: plain.deletedAt,
  };
};

export default CreationStudioItem;
