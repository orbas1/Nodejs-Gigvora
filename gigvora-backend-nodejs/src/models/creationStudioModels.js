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
  'volunteer_opportunity',
  'mentorship_offering',
  'networking_session',
  'blog_post',
  'group',
  'page',
  'ad',
  'event',
  'cv',
  'cover_letter',
]);

export const CREATION_STUDIO_ITEM_STATUSES = Object.freeze(['draft', 'in_review', 'scheduled', 'published', 'archived']);
export const CREATION_STUDIO_VISIBILITIES = Object.freeze(['private', 'workspace', 'connections', 'community', 'public']);
export const CREATION_STUDIO_STEPS = Object.freeze(['type', 'basics', 'details', 'collaboration', 'settings', 'share']);
export const CREATION_STUDIO_COLLABORATOR_STATUSES = Object.freeze([
  'invited',
  'sent',
  'accepted',
  'declined',
  'removed',
]);

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
    headline: { type: DataTypes.STRING(240), allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM(...CREATION_STUDIO_ITEM_STATUSES), allowNull: false, defaultValue: 'draft' },
    visibility: { type: DataTypes.ENUM(...CREATION_STUDIO_VISIBILITIES), allowNull: false, defaultValue: 'workspace' },
    category: { type: DataTypes.STRING(120), allowNull: true },
    targetAudience: { type: DataTypes.STRING(255), allowNull: true },
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
    underscored: true,
    tableName: 'creation_studio_items',
  },
);

export const CreationStudioCollaborator = sequelize.define(
  'CreationStudioCollaborator',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    workspaceId: { type: DataTypes.INTEGER, allowNull: true },
    itemId: { type: DataTypes.INTEGER, allowNull: true },
    trackType: { type: DataTypes.ENUM(...CREATION_STUDIO_ITEM_TYPES), allowNull: false },
    email: { type: DataTypes.STRING(320), allowNull: false },
    role: { type: DataTypes.STRING(120), allowNull: false },
    status: {
      type: DataTypes.ENUM(...CREATION_STUDIO_COLLABORATOR_STATUSES),
      allowNull: false,
      defaultValue: 'invited',
    },
    invitedById: { type: DataTypes.INTEGER, allowNull: true },
    respondedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    underscored: true,
    tableName: 'creation_studio_collaborators',
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
CreationStudioItem.hasMany(CreationStudioCollaborator, { foreignKey: 'itemId', as: 'collaborators' });
CreationStudioCollaborator.belongsTo(CreationStudioItem, { foreignKey: 'itemId', as: 'item' });

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

CreationStudioCollaborator.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    ...plain,
    metadata: plain.metadata ?? {},
  };
};

export default CreationStudioItem;
