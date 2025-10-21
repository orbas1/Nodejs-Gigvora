import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

export const creationStudioSequelize = sequelize;

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const CREATION_STUDIO_ITEM_TYPES = Object.freeze([
  'gig',
  'project',
  'job',
  'launchpad_project',
  'launchpad_job',
  'volunteering',
  'networking_session',
  'group',
  'page',
  'ad',
]);

export const CREATION_STUDIO_ITEM_STATUSES = Object.freeze(['draft', 'review', 'scheduled', 'published', 'archived']);
export const CREATION_STUDIO_VISIBILITIES = Object.freeze(['private', 'members', 'workspace', 'connections', 'public']);
export const CREATION_STUDIO_FORMATS = Object.freeze(['async', 'virtual', 'in_person', 'hybrid', 'flex']);
export const CREATION_STUDIO_APPLICATION_TYPES = Object.freeze(['gigvora', 'internal', 'external', 'email', 'form']);
export const CREATION_STUDIO_PAYOUT_TYPES = Object.freeze(['fixed', 'hourly', 'stipend', 'unpaid', 'equity']);
export const CREATION_STUDIO_ROLE_OPTIONS = Object.freeze([
  'freelancer',
  'agency',
  'company',
  'headhunter',
  'mentor',
  'user',
  'admin',
]);
export const CREATION_STUDIO_STEPS = Object.freeze(['type', 'basics', 'details', 'collaboration', 'settings', 'share']);

export const CreationStudioItem = sequelize.define(
  'CreationStudioItem',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    workspaceId: { type: DataTypes.INTEGER, allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    updatedById: { type: DataTypes.INTEGER, allowNull: true },
    type: { type: DataTypes.ENUM(...CREATION_STUDIO_ITEM_TYPES), allowNull: false },
    title: { type: DataTypes.STRING(180), allowNull: false },
    slug: { type: DataTypes.STRING(200), allowNull: true, unique: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...CREATION_STUDIO_ITEM_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
    },
    visibility: {
      type: DataTypes.ENUM(...CREATION_STUDIO_VISIBILITIES),
      allowNull: false,
      defaultValue: 'private',
    },
    format: {
      type: DataTypes.ENUM(...CREATION_STUDIO_FORMATS),
      allowNull: false,
      defaultValue: 'async',
    },
    heroImageUrl: { type: DataTypes.STRING(255), allowNull: true },
    heroVideoUrl: { type: DataTypes.STRING(255), allowNull: true },
    thumbnailUrl: { type: DataTypes.STRING(255), allowNull: true },
    tags: { type: jsonType, allowNull: true },
    deliverables: { type: jsonType, allowNull: true },
    audienceSegments: { type: jsonType, allowNull: true },
    roleAccess: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    settings: { type: jsonType, allowNull: true },
    ctaLabel: { type: DataTypes.STRING(120), allowNull: true },
    ctaUrl: { type: DataTypes.STRING(255), allowNull: true },
    applicationType: {
      type: DataTypes.ENUM(...CREATION_STUDIO_APPLICATION_TYPES),
      allowNull: false,
      defaultValue: 'external',
    },
    applicationUrl: { type: DataTypes.STRING(255), allowNull: true },
    applicationInstructions: { type: DataTypes.TEXT, allowNull: true },
    applicationDeadline: { type: DataTypes.DATE, allowNull: true },
    startAt: { type: DataTypes.DATE, allowNull: true },
    endAt: { type: DataTypes.DATE, allowNull: true },
    scheduledAt: { type: DataTypes.DATE, allowNull: true },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    locationLabel: { type: DataTypes.STRING(180), allowNull: true },
    locationDetails: { type: jsonType, allowNull: true },
    experienceLevel: { type: DataTypes.STRING(120), allowNull: true },
    commitmentHours: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    payoutType: {
      type: DataTypes.ENUM(...CREATION_STUDIO_PAYOUT_TYPES),
      allowNull: false,
      defaultValue: 'fixed',
    },
    compensationCurrency: { type: DataTypes.STRING(6), allowNull: false, defaultValue: 'USD' },
    compensationMin: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    compensationMax: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    shareMessage: { type: DataTypes.TEXT, allowNull: true },
    shareTargets: { type: jsonType, allowNull: true },
    shareSlug: { type: DataTypes.STRING(120), allowNull: true, unique: true },
  },
  {
    tableName: 'creation_studio_items',
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['owner_id'] },
      { fields: ['workspace_id'] },
      { fields: ['type', 'status'] },
      { fields: ['status', 'visibility'] },
      { unique: true, fields: ['share_slug'] },
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
    indexes: [{ unique: true, fields: ['item_id', 'step_key'] }],
  },
);

export const CreationStudioAsset = sequelize.define(
  'CreationStudioAsset',
  {
    itemId: { type: DataTypes.INTEGER, allowNull: false },
    label: { type: DataTypes.STRING(180), allowNull: false },
    type: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'image' },
    url: { type: DataTypes.STRING(255), allowNull: false },
    thumbnailUrl: { type: DataTypes.STRING(255), allowNull: true },
    altText: { type: DataTypes.STRING(200), allowNull: true },
    caption: { type: DataTypes.STRING(255), allowNull: true },
    isPrimary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    orderIndex: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'creation_studio_assets',
    underscored: true,
    indexes: [{ fields: ['item_id', 'order_index'] }],
  },
);

export const CreationStudioPermission = sequelize.define(
  'CreationStudioPermission',
  {
    itemId: { type: DataTypes.INTEGER, allowNull: false },
    role: { type: DataTypes.STRING(60), allowNull: false },
    canView: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    canEdit: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    canPublish: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    canManageAssets: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: 'creation_studio_permissions',
    underscored: true,
    indexes: [{ unique: true, fields: ['item_id', 'role'] }],
  },
);

CreationStudioItem.hasMany(CreationStudioStep, { foreignKey: 'itemId', as: 'steps', onDelete: 'CASCADE', hooks: true });
CreationStudioStep.belongsTo(CreationStudioItem, { foreignKey: 'itemId', as: 'item' });

CreationStudioItem.hasMany(CreationStudioAsset, { foreignKey: 'itemId', as: 'assets', onDelete: 'CASCADE', hooks: true });
CreationStudioAsset.belongsTo(CreationStudioItem, { foreignKey: 'itemId', as: 'item' });

CreationStudioItem.hasMany(CreationStudioPermission, {
  foreignKey: 'itemId',
  as: 'permissions',
  onDelete: 'CASCADE',
  hooks: true,
});
CreationStudioPermission.belongsTo(CreationStudioItem, { foreignKey: 'itemId', as: 'item' });

let synced = false;
export async function syncCreationStudioModels() {
  if (synced) {
    return;
  }
  await CreationStudioItem.sync();
  await CreationStudioStep.sync();
  await CreationStudioAsset.sync();
  await CreationStudioPermission.sync();
  synced = true;
}

export default CreationStudioItem;
