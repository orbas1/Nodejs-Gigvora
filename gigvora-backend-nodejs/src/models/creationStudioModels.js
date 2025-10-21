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
  'volunteer_opportunity',
  'networking_session',
  'blog_post',
  'group',
  'page',
  'ad',
  'event',
]);

export const CREATION_STUDIO_TYPES = Object.freeze([
  'project',
  'volunteering',
  'networking_session',
  'group',
  'page',
  'ad',
  'blog_post',
  'event',
]);

export const CREATION_STUDIO_ITEM_STATUSES = Object.freeze(['draft', 'review', 'scheduled', 'published', 'archived']);
export const CREATION_STUDIO_STATUSES = Object.freeze(['draft', 'scheduled', 'published', 'archived']);
export const CREATION_STUDIO_VISIBILITIES = Object.freeze(['private', 'workspace', 'connections', 'members', 'unlisted', 'public']);
export const CREATION_STUDIO_STEPS = Object.freeze(['type', 'basics', 'details', 'collaboration', 'settings', 'share']);
export const CREATION_STUDIO_FORMATS = Object.freeze(['async', 'virtual', 'in_person', 'hybrid', 'flex']);
export const CREATION_STUDIO_APPLICATION_TYPES = Object.freeze(['gigvora', 'internal', 'external', 'email', 'form']);
export const CREATION_STUDIO_PAYOUT_TYPES = Object.freeze(['fixed', 'hourly', 'stipend', 'unpaid', 'equity']);
export const CREATION_STUDIO_ROLE_OPTIONS = Object.freeze(['freelancer', 'agency', 'company', 'headhunter', 'mentor', 'user', 'admin']);

export const CreationStudioItem = creationStudioSequelize.define(
  'CreationStudioItem',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: true },
    ownerId: { type: DataTypes.INTEGER, allowNull: true },
    createdById: { type: DataTypes.INTEGER, allowNull: true },
    updatedById: { type: DataTypes.INTEGER, allowNull: true },
    type: { type: DataTypes.ENUM(...CREATION_STUDIO_ITEM_TYPES), allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    slug: { type: DataTypes.STRING(200), allowNull: true, unique: true },
    headline: { type: DataTypes.STRING(255), allowNull: true },
    tagline: { type: DataTypes.STRING(240), allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM(...CREATION_STUDIO_ITEM_STATUSES), allowNull: false, defaultValue: 'draft' },
    visibility: { type: DataTypes.ENUM(...CREATION_STUDIO_VISIBILITIES), allowNull: false, defaultValue: 'private' },
    format: { type: DataTypes.ENUM(...CREATION_STUDIO_FORMATS), allowNull: false, defaultValue: 'async' },
    category: { type: DataTypes.STRING(120), allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    locationLabel: { type: DataTypes.STRING(180), allowNull: true },
    locationMode: { type: DataTypes.STRING(40), allowNull: true },
    locationDetails: { type: jsonType, allowNull: true },
    targetAudience: { type: jsonType, allowNull: true },
    schedule: { type: jsonType, allowNull: true },
    shareTargets: { type: jsonType, allowNull: true },
    shareMessage: { type: DataTypes.TEXT, allowNull: true },
    settings: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    deliverables: { type: jsonType, allowNull: true },
    audienceSegments: { type: jsonType, allowNull: true },
    roleAccess: { type: jsonType, allowNull: true },
    tags: { type: jsonType, allowNull: true },
    launchDate: { type: DataTypes.DATE, allowNull: true },
    publishAt: { type: DataTypes.DATE, allowNull: true },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    startAt: { type: DataTypes.DATE, allowNull: true },
    endAt: { type: DataTypes.DATE, allowNull: true },
    scheduledAt: { type: DataTypes.DATE, allowNull: true },
    applicationType: { type: DataTypes.ENUM(...CREATION_STUDIO_APPLICATION_TYPES), allowNull: false, defaultValue: 'external' },
    applicationUrl: { type: DataTypes.STRING(255), allowNull: true },
    applicationInstructions: { type: DataTypes.TEXT, allowNull: true },
    applicationDeadline: { type: DataTypes.DATE, allowNull: true },
    experienceLevel: { type: DataTypes.STRING(80), allowNull: true },
    commitmentHours: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    payoutType: { type: DataTypes.ENUM(...CREATION_STUDIO_PAYOUT_TYPES), allowNull: false, defaultValue: 'fixed' },
    compensationCurrency: { type: DataTypes.STRING(6), allowNull: false, defaultValue: 'USD' },
    compensationMin: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    compensationMax: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    budgetAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    budgetCurrency: { type: DataTypes.STRING(6), allowNull: true },
    durationWeeks: { type: DataTypes.INTEGER, allowNull: true },
    remoteEligible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    heroImageUrl: { type: DataTypes.STRING(500), allowNull: true },
    heroVideoUrl: { type: DataTypes.STRING(500), allowNull: true },
    thumbnailUrl: { type: DataTypes.STRING(500), allowNull: true },
    ctaLabel: { type: DataTypes.STRING(120), allowNull: true },
    ctaUrl: { type: DataTypes.STRING(255), allowNull: true },
    shareSlug: { type: DataTypes.STRING(80), allowNull: true, unique: true },
  },
  {
    tableName: 'creation_studio_items',
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['workspace_id', 'type'] },
      { fields: ['type', 'status'] },
      { fields: ['status'] },
      { fields: ['visibility'] },
    ],
  },
);

CreationStudioItem.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    workspaceId: plain.workspaceId,
    ownerId: plain.ownerId,
    createdById: plain.createdById,
    type: plain.type,
    title: plain.title,
    headline: plain.headline,
    summary: plain.summary,
    content: plain.content,
    status: plain.status,
    visibility: plain.visibility,
    format: plain.format,
    category: plain.category,
    location: plain.location,
    targetAudience: plain.targetAudience ?? [],
    schedule: plain.schedule ?? {},
    settings: plain.settings ?? {},
    metadata: plain.metadata ?? {},
    tags: Array.isArray(plain.tags) ? plain.tags : [],
    launchDate: plain.launchDate,
    publishAt: plain.publishAt,
    publishedAt: plain.publishedAt,
    startAt: plain.startAt,
    endAt: plain.endAt,
    applicationDeadline: plain.applicationDeadline,
    applicationType: plain.applicationType,
    applicationUrl: plain.applicationUrl,
    payoutType: plain.payoutType,
    compensationCurrency: plain.compensationCurrency,
    compensationMin: plain.compensationMin,
    compensationMax: plain.compensationMax,
    budgetAmount: plain.budgetAmount,
    budgetCurrency: plain.budgetCurrency,
    durationWeeks: plain.durationWeeks,
    remoteEligible: plain.remoteEligible,
    ctaLabel: plain.ctaLabel,
    ctaUrl: plain.ctaUrl,
    heroImageUrl: plain.heroImageUrl,
    thumbnailUrl: plain.thumbnailUrl,
    shareSlug: plain.shareSlug,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    deletedAt: plain.deletedAt,
  };
};

export const CreationStudioStep = creationStudioSequelize.define(
  'CreationStudioStep',
  {
    itemId: { type: DataTypes.INTEGER, allowNull: false },
    stepKey: { type: DataTypes.ENUM(...CREATION_STUDIO_STEPS), allowNull: false },
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
    role: { type: DataTypes.ENUM(...CREATION_STUDIO_ROLE_OPTIONS), allowNull: false },
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

CreationStudioItem.hasMany(CreationStudioStep, { as: 'steps', foreignKey: 'itemId', onDelete: 'CASCADE', hooks: true });
CreationStudioStep.belongsTo(CreationStudioItem, { as: 'item', foreignKey: 'itemId' });

CreationStudioItem.hasMany(CreationStudioAsset, { as: 'assets', foreignKey: 'itemId', onDelete: 'CASCADE', hooks: true });
CreationStudioAsset.belongsTo(CreationStudioItem, { as: 'item', foreignKey: 'itemId' });

CreationStudioItem.hasMany(CreationStudioPermission, { as: 'permissions', foreignKey: 'itemId', onDelete: 'CASCADE', hooks: true });
CreationStudioPermission.belongsTo(CreationStudioItem, { as: 'item', foreignKey: 'itemId' });

export async function syncCreationStudioModels(options = {}) {
  await creationStudioSequelize.sync({ alter: false, ...options });
}

export default {
  creationStudioSequelize,
  CreationStudioItem,
  CreationStudioStep,
  CreationStudioAsset,
  CreationStudioPermission,
  CREATION_STUDIO_ITEM_TYPES,
  CREATION_STUDIO_ITEM_STATUSES,
  CREATION_STUDIO_VISIBILITIES,
  CREATION_STUDIO_FORMATS,
  CREATION_STUDIO_APPLICATION_TYPES,
  CREATION_STUDIO_PAYOUT_TYPES,
  CREATION_STUDIO_ROLE_OPTIONS,
  CREATION_STUDIO_TYPES,
  CREATION_STUDIO_STATUSES,
  CREATION_STUDIO_STEPS,
  syncCreationStudioModels,
};
