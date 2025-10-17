import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const CREATION_STUDIO_TYPES = [
  'project',
  'gig',
  'job',
  'launchpad_job',
  'launchpad_project',
  'volunteering',
  'networking_session',
  'group',
  'page',
  'ad',
  'blog_post',
  'event',
];

export const CREATION_STUDIO_STATUSES = ['draft', 'scheduled', 'published', 'archived'];
export const CREATION_STUDIO_VISIBILITIES = ['private', 'connections', 'public'];
export const CREATION_STUDIO_STEPS = ['type', 'basics', 'details', 'collaboration', 'settings', 'share'];

export const CreationStudioItem = sequelize.define(
  'CreationStudioItem',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    lastEditedBy: { type: DataTypes.INTEGER, allowNull: true },
    type: { type: DataTypes.ENUM(...CREATION_STUDIO_TYPES), allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    tagline: { type: DataTypes.STRING(240), allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM(...CREATION_STUDIO_STATUSES), allowNull: false, defaultValue: 'draft' },
    visibility: { type: DataTypes.ENUM(...CREATION_STUDIO_VISIBILITIES), allowNull: false, defaultValue: 'private' },
    heroImageUrl: { type: DataTypes.STRING(255), allowNull: true },
    locationLabel: { type: DataTypes.STRING(180), allowNull: true },
    locationMode: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'hybrid' },
    schedule: { type: jsonType, allowNull: true },
    settings: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    shareTargets: { type: jsonType, allowNull: true },
    shareMessage: { type: DataTypes.TEXT, allowNull: true },
    tags: { type: jsonType, allowNull: true },
    launchAt: { type: DataTypes.DATE, allowNull: true },
    shareSlug: { type: DataTypes.STRING(80), allowNull: true, unique: true },
  },
  {
    tableName: 'creation_studio_items',
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['type'] },
      { fields: ['status'] },
    ],
  },
);

export const CreationStudioStep = sequelize.define(
  'CreationStudioStep',
  {
    itemId: { type: DataTypes.INTEGER, allowNull: false },
    stepKey: { type: DataTypes.STRING(60), allowNull: false },
    completed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    data: { type: jsonType, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    lastEditedBy: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'creation_studio_steps',
    underscored: true,
    indexes: [
      { unique: true, fields: ['item_id', 'step_key'] },
    ],
  },
);

CreationStudioItem.hasMany(CreationStudioStep, {
  foreignKey: 'itemId',
  as: 'steps',
  onDelete: 'CASCADE',
  hooks: true,
});
CreationStudioStep.belongsTo(CreationStudioItem, {
  foreignKey: 'itemId',
  as: 'item',
});

export default {
  CreationStudioItem,
  CreationStudioStep,
  CREATION_STUDIO_TYPES,
  CREATION_STUDIO_STATUSES,
  CREATION_STUDIO_VISIBILITIES,
  CREATION_STUDIO_STEPS,
};
