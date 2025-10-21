import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

export const creationStudioSequelize = sequelize;

const dialect = creationStudioSequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const CREATION_STUDIO_ITEM_TYPES = Object.freeze([
  'gig',
  'job',
  'project',
  'launchpad_job',
  'launchpad_project',
  'volunteer_opportunity',
  'networking_session',
  'group',
  'page',
  'ad',
  'blog_post',
  'event',
]);

export const CREATION_STUDIO_ITEM_STATUSES = Object.freeze(['draft', 'scheduled', 'published', 'archived']);
export const CREATION_STUDIO_VISIBILITIES = Object.freeze(['private', 'workspace', 'connections', 'public']);
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
    visibility: {
      type: DataTypes.ENUM(...CREATION_STUDIO_VISIBILITIES),
      allowNull: false,
      defaultValue: 'private',
    },
    format: { type: DataTypes.ENUM(...CREATION_STUDIO_FORMATS), allowNull: false, defaultValue: 'async' },
    heroImageUrl: { type: DataTypes.STRING(500), allowNull: true },
    heroVideoUrl: { type: DataTypes.STRING(500), allowNull: true },
    thumbnailUrl: { type: DataTypes.STRING(500), allowNull: true },
    tags: { type: jsonType, allowNull: false, defaultValue: [] },
    deliverables: { type: jsonType, allowNull: false, defaultValue: [] },
    audienceSegments: { type: jsonType, allowNull: false, defaultValue: [] },
    roleAccess: { type: jsonType, allowNull: false, defaultValue: [] },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
    settings: { type: jsonType, allowNull: false, defaultValue: {} },
    ctaLabel: { type: DataTypes.STRING(160), allowNull: true },
    ctaUrl: { type: DataTypes.STRING(500), allowNull: true },
    applicationType: {
      type: DataTypes.ENUM(...CREATION_STUDIO_APPLICATION_TYPES),
      allowNull: false,
      defaultValue: 'external',
    },
    applicationUrl: { type: DataTypes.STRING(500), allowNull: true },
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
    paranoid: true,
    indexes: [
      { fields: ['owner_id'] },
      { fields: ['type'] },
      { fields: ['status'] },
      { fields: ['visibility'] },
      { fields: ['slug'] },
    ],
  },
);

CreationStudioItem.prototype.toPublicObject = function toPublicObject({ includeRelationships = true } = {}) {
  const plain = this.get({ plain: true });
  const payload = {
    id: plain.id,
    ownerId: plain.ownerId,
    type: plain.type,
    title: plain.title,
    slug: plain.slug ?? null,
    summary: plain.summary ?? null,
    description: plain.description ?? null,
    status: plain.status,
    visibility: plain.visibility,
    format: plain.format,
    heroImageUrl: plain.heroImageUrl ?? null,
    heroVideoUrl: plain.heroVideoUrl ?? null,
    thumbnailUrl: plain.thumbnailUrl ?? null,
    tags: Array.isArray(plain.tags) ? plain.tags : [],
    deliverables: Array.isArray(plain.deliverables) ? plain.deliverables : [],
    audienceSegments: Array.isArray(plain.audienceSegments) ? plain.audienceSegments : [],
    roleAccess: Array.isArray(plain.roleAccess) ? plain.roleAccess : [],
    metadata: plain.metadata ?? {},
    settings: plain.settings ?? {},
    cta: { label: plain.ctaLabel ?? null, url: plain.ctaUrl ?? null },
    application: {
      type: plain.applicationType,
      url: plain.applicationUrl ?? null,
      instructions: plain.applicationInstructions ?? null,
      deadline: plain.applicationDeadline ?? null,
    },
    schedule: {
      startAt: plain.startAt ?? null,
      endAt: plain.endAt ?? null,
      scheduledAt: plain.scheduledAt ?? null,
      publishedAt: plain.publishedAt ?? null,
    },
    location: {
      label: plain.locationLabel ?? null,
      details: plain.locationDetails ?? null,
    },
    experienceLevel: plain.experienceLevel ?? null,
    commitmentHours: plain.commitmentHours != null ? Number(plain.commitmentHours) : null,
    payoutType: plain.payoutType,
    compensation: {
      currency: plain.compensationCurrency,
      minimum: plain.compensationMin != null ? Number(plain.compensationMin) : null,
      maximum: plain.compensationMax != null ? Number(plain.compensationMax) : null,
    },
    createdById: plain.createdById ?? null,
    updatedById: plain.updatedById ?? null,
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
    deletedAt: plain.deletedAt ?? null,
  };

  if (!includeRelationships) {
    return payload;
  }

  const assets = Array.isArray(plain.assets) ? plain.assets : [];
  const permissions = Array.isArray(plain.permissions) ? plain.permissions : [];

  return {
    ...payload,
    assets: assets.map((asset) => (typeof asset.toPublicObject === 'function' ? asset.toPublicObject() : asset)),
    permissions: permissions.map((permission) =>
      typeof permission.toPublicObject === 'function' ? permission.toPublicObject() : permission,
    ),
  };
};

export const CreationStudioAsset = creationStudioSequelize.define(
  'CreationStudioAsset',
  {
    itemId: { type: DataTypes.INTEGER, allowNull: false },
    label: { type: DataTypes.STRING(180), allowNull: false },
    type: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'image' },
    url: { type: DataTypes.STRING(500), allowNull: false },
    thumbnailUrl: { type: DataTypes.STRING(500), allowNull: true },
    altText: { type: DataTypes.STRING(255), allowNull: true },
    caption: { type: DataTypes.STRING(255), allowNull: true },
    isPrimary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    orderIndex: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'creation_studio_assets',
    underscored: true,
    indexes: [
      { fields: ['item_id'] },
      { fields: ['order_index'] },
    ],
  },
);

CreationStudioAsset.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    itemId: plain.itemId,
    label: plain.label,
    type: plain.type,
    url: plain.url,
    thumbnailUrl: plain.thumbnailUrl ?? null,
    altText: plain.altText ?? null,
    caption: plain.caption ?? null,
    isPrimary: Boolean(plain.isPrimary),
    orderIndex: plain.orderIndex ?? 0,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
  };
};

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

CreationStudioPermission.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    itemId: plain.itemId,
    role: plain.role,
    canView: Boolean(plain.canView),
    canEdit: Boolean(plain.canEdit),
    canPublish: Boolean(plain.canPublish),
    canManageAssets: Boolean(plain.canManageAssets),
    createdAt: plain.createdAt ?? null,
    updatedAt: plain.updatedAt ?? null,
  };
};

if (!CreationStudioItem.associations?.assets) {
  CreationStudioItem.hasMany(CreationStudioAsset, {
    as: 'assets',
    foreignKey: 'itemId',
    onDelete: 'CASCADE',
    hooks: true,
  });
}
if (!CreationStudioAsset.associations?.item) {
  CreationStudioAsset.belongsTo(CreationStudioItem, { foreignKey: 'itemId', as: 'item' });
}
if (!CreationStudioItem.associations?.permissions) {
  CreationStudioItem.hasMany(CreationStudioPermission, {
    as: 'permissions',
    foreignKey: 'itemId',
    onDelete: 'CASCADE',
    hooks: true,
  });
}
if (!CreationStudioPermission.associations?.item) {
  CreationStudioPermission.belongsTo(CreationStudioItem, { foreignKey: 'itemId', as: 'item' });
}

export async function syncCreationStudioModels(options = {}) {
  const syncOptions = { alter: false, ...options };
  await CreationStudioItem.sync(syncOptions);
  await CreationStudioAsset.sync(syncOptions);
  await CreationStudioPermission.sync(syncOptions);
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
