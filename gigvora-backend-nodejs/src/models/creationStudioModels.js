import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const CREATION_STUDIO_TYPES = [
  'project',
import { Sequelize, DataTypes } from 'sequelize';
import databaseConfig from '../config/database.js';

const { url, ...sequelizeOptions } = databaseConfig;

export const creationStudioSequelize = url
  ? new Sequelize(url, { ...sequelizeOptions, define: { underscored: true, ...sequelizeOptions.define } })
  : new Sequelize({ ...sequelizeOptions, define: { underscored: true, ...sequelizeOptions.define } });

const dialect = creationStudioSequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const CREATION_STUDIO_ITEM_TYPES = Object.freeze([
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
  'blog_post',
  'ad',
]);

export const CREATION_STUDIO_ITEM_STATUSES = Object.freeze([
  'draft',
  'review',
  'scheduled',
  'published',
  'archived',
]);

export const CREATION_STUDIO_VISIBILITIES = Object.freeze(['private', 'members', 'unlisted', 'public']);

export const CREATION_STUDIO_FORMATS = Object.freeze(['async', 'virtual', 'in_person', 'hybrid', 'flex']);

export const CREATION_STUDIO_APPLICATION_TYPES = Object.freeze([
  'gigvora',
  'internal',
  'external',
  'email',
  'form',
]);

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

export const CreationStudioItem = creationStudioSequelize.define(
  'CreationStudioItem',
  {
    ownerId: { type: DataTypes.INTEGER, allowNull: false },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    updatedById: { type: DataTypes.INTEGER, allowNull: true },
    type: { type: DataTypes.ENUM(...CREATION_STUDIO_ITEM_TYPES), allowNull: false },
    title: { type: DataTypes.STRING(180), allowNull: false },
    slug: { type: DataTypes.STRING(200), allowNull: true, unique: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM(...CREATION_STUDIO_ITEM_STATUSES), allowNull: false, defaultValue: 'draft' },
    visibility: { type: DataTypes.ENUM(...CREATION_STUDIO_VISIBILITIES), allowNull: false, defaultValue: 'private' },
    format: { type: DataTypes.ENUM(...CREATION_STUDIO_FORMATS), allowNull: false, defaultValue: 'async' },
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
    experienceLevel: { type: DataTypes.STRING(80), allowNull: true },
    commitmentHours: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    payoutType: {
      type: DataTypes.ENUM(...CREATION_STUDIO_PAYOUT_TYPES),
      allowNull: false,
      defaultValue: 'fixed',
    },
    compensationCurrency: { type: DataTypes.STRING(6), allowNull: false, defaultValue: 'USD' },
    compensationMin: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    compensationMax: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
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
      { fields: ['owner_id'] },
      { fields: ['type', 'status'] },
      { fields: ['status', 'visibility'] },
    ],
  },
);

export const CreationStudioAsset = creationStudioSequelize.define(
  'CreationStudioAsset',
  {
    itemId: { type: DataTypes.INTEGER, allowNull: false },
    label: { type: DataTypes.STRING(180), allowNull: false },
    type: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'image' },
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
    indexes: [{ fields: ['item_id'] }],
  },
);

export const CreationStudioPermission = creationStudioSequelize.define(
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
    indexes: [
      { fields: ['item_id'] },
      { unique: true, fields: ['item_id', 'role'] },
    ],
  },
);

CreationStudioItem.hasMany(CreationStudioAsset, {
  as: 'assets',
  foreignKey: 'itemId',
  onDelete: 'CASCADE',
});
CreationStudioAsset.belongsTo(CreationStudioItem, { foreignKey: 'itemId' });

CreationStudioItem.hasMany(CreationStudioPermission, {
  as: 'permissions',
  foreignKey: 'itemId',
  onDelete: 'CASCADE',
});
CreationStudioPermission.belongsTo(CreationStudioItem, { foreignKey: 'itemId' });

export async function syncCreationStudioModels(options = {}) {
  await creationStudioSequelize.sync({ alter: false, ...options });
}

export default {
  creationStudioSequelize,
  CreationStudioItem,
  CreationStudioAsset,
  CreationStudioPermission,
  CREATION_STUDIO_ITEM_TYPES,
  CREATION_STUDIO_ITEM_STATUSES,
  CREATION_STUDIO_VISIBILITIES,
  CREATION_STUDIO_FORMATS,
  CREATION_STUDIO_APPLICATION_TYPES,
  CREATION_STUDIO_PAYOUT_TYPES,
  CREATION_STUDIO_ROLE_OPTIONS,
  syncCreationStudioModels,
};
