import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const CREATION_STUDIO_ITEM_TYPES = Object.freeze([
  'gig',
  'job',
  'project',
  'launchpad_job',
  'launchpad_project',
  'volunteering',
  'networking_session',
  'blog_post',
  'group',
  'page',
  'ad',
  'event',
]);

export const CREATION_STUDIO_ITEM_STATUSES = Object.freeze(['draft', 'scheduled', 'published', 'archived']);
export const CREATION_STUDIO_VISIBILITIES = Object.freeze(['private', 'workspace', 'public']);
export const CREATION_STUDIO_STEPS = Object.freeze(['type', 'basics', 'details', 'collaboration', 'settings', 'share']);

export const CreationStudioItem = sequelize.define(
  'CreationStudioItem',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: true },
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    updatedById: { type: DataTypes.INTEGER, allowNull: true },
    type: { type: DataTypes.ENUM(...CREATION_STUDIO_ITEM_TYPES), allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    slug: { type: DataTypes.STRING(200), allowNull: true, unique: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM(...CREATION_STUDIO_ITEM_STATUSES), allowNull: false, defaultValue: 'draft' },
    visibility: { type: DataTypes.ENUM(...CREATION_STUDIO_VISIBILITIES), allowNull: false, defaultValue: 'private' },
    heroImageUrl: { type: DataTypes.STRING(500), allowNull: true },
    locationLabel: { type: DataTypes.STRING(180), allowNull: true },
    locationMode: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'hybrid' },
    tags: { type: jsonType, allowNull: true },
    settings: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    shareTargets: { type: jsonType, allowNull: true },
    shareMessage: { type: DataTypes.TEXT, allowNull: true },
    launchAt: { type: DataTypes.DATE, allowNull: true },
    publishAt: { type: DataTypes.DATE, allowNull: true },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    archivedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    underscored: true,
    tableName: 'creation_studio_items',
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
    underscored: true,
    tableName: 'creation_studio_steps',
    indexes: [{ unique: true, fields: ['item_id', 'step_key'] }],
  },
);

CreationStudioItem.hasMany(CreationStudioStep, { foreignKey: 'itemId', as: 'steps' });
CreationStudioStep.belongsTo(CreationStudioItem, { foreignKey: 'itemId', as: 'item' });

CreationStudioItem.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    tags: Array.isArray(plain.tags) ? plain.tags : [],
    settings: plain.settings ?? {},
    metadata: plain.metadata ?? {},
    shareTargets: Array.isArray(plain.shareTargets) ? plain.shareTargets : [],
  };
};

export default CreationStudioItem;
