import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const APPEARANCE_THEME_STATUSES = Object.freeze(['draft', 'active', 'archived']);
export const APPEARANCE_ASSET_TYPES = Object.freeze([
  'logo_light',
  'logo_dark',
  'favicon',
  'hero',
  'illustration',
  'background',
  'icon',
  'pattern',
  'other',
]);
export const APPEARANCE_ASSET_STATUSES = Object.freeze(['active', 'inactive', 'archived']);
export const APPEARANCE_LAYOUT_STATUSES = Object.freeze(['draft', 'published', 'archived']);
export const APPEARANCE_LAYOUT_PAGES = Object.freeze(['marketing', 'dashboard', 'auth', 'admin', 'support']);
export const APPEARANCE_COMPONENT_PROFILE_STATUSES = Object.freeze(['draft', 'active', 'archived']);

export const AppearanceTheme = sequelize.define(
  'AppearanceTheme',
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(...APPEARANCE_THEME_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
    },
    isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    tokens: { type: jsonType, allowNull: false, defaultValue: {} },
    accessibility: { type: jsonType, allowNull: false, defaultValue: {} },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
    updatedBy: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'appearance_themes',
    indexes: [
      { unique: true, fields: ['slug'] },
      { fields: ['status'] },
      { fields: ['isDefault'] },
    ],
  },
);

export const AppearanceAsset = sequelize.define(
  'AppearanceAsset',
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    themeId: { type: DataTypes.UUID, allowNull: true },
    type: { type: DataTypes.ENUM(...APPEARANCE_ASSET_TYPES), allowNull: false, defaultValue: 'other' },
    label: { type: DataTypes.STRING(120), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    url: { type: DataTypes.STRING(2048), allowNull: false },
    altText: { type: DataTypes.STRING(255), allowNull: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
    allowedRoles: { type: jsonType, allowNull: false, defaultValue: [] },
    status: {
      type: DataTypes.ENUM(...APPEARANCE_ASSET_STATUSES),
      allowNull: false,
      defaultValue: 'active',
    },
    isPrimary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
    updatedBy: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'appearance_assets',
    indexes: [
      { fields: ['themeId'] },
      { fields: ['type'] },
      { fields: ['status'] },
    ],
  },
);

export const AppearanceLayout = sequelize.define(
  'AppearanceLayout',
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    themeId: { type: DataTypes.UUID, allowNull: true },
    name: { type: DataTypes.STRING(160), allowNull: false },
    slug: { type: DataTypes.STRING(160), allowNull: false },
    page: {
      type: DataTypes.ENUM(...APPEARANCE_LAYOUT_PAGES),
      allowNull: false,
      defaultValue: 'marketing',
    },
    status: {
      type: DataTypes.ENUM(...APPEARANCE_LAYOUT_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
    },
    version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    config: { type: jsonType, allowNull: false, defaultValue: {} },
    allowedRoles: { type: jsonType, allowNull: false, defaultValue: [] },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
    releaseNotes: { type: DataTypes.TEXT, allowNull: true },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
    updatedBy: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'appearance_layouts',
    indexes: [
      { fields: ['themeId'] },
      { fields: ['page'] },
      { fields: ['status'] },
      { unique: true, fields: ['page', 'slug'] },
    ],
  },
);

export const AppearanceComponentProfile = sequelize.define(
  'AppearanceComponentProfile',
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    themeId: { type: DataTypes.UUID, allowNull: true },
    componentKey: { type: DataTypes.STRING(120), allowNull: false },
    status: {
      type: DataTypes.ENUM(...APPEARANCE_COMPONENT_PROFILE_STATUSES),
      allowNull: false,
      defaultValue: 'active',
    },
    definition: { type: jsonType, allowNull: false, defaultValue: {} },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
    updatedBy: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'appearance_component_profiles',
    indexes: [
      { fields: ['componentKey'] },
      { fields: ['status'] },
    ],
  },
);

AppearanceTheme.hasMany(AppearanceAsset, { foreignKey: 'themeId', as: 'assets' });
AppearanceAsset.belongsTo(AppearanceTheme, { foreignKey: 'themeId', as: 'theme' });

AppearanceTheme.hasMany(AppearanceLayout, { foreignKey: 'themeId', as: 'layouts' });
AppearanceLayout.belongsTo(AppearanceTheme, { foreignKey: 'themeId', as: 'theme' });

AppearanceTheme.hasMany(AppearanceComponentProfile, { foreignKey: 'themeId', as: 'componentProfiles' });
AppearanceComponentProfile.belongsTo(AppearanceTheme, { foreignKey: 'themeId', as: 'theme' });

AppearanceTheme.prototype.toPublicObject = function toPublicObject({ includeRelations = false } = {}) {
  const plain = this.get({ plain: true });
  const base = {
    id: plain.id,
    slug: plain.slug,
    name: plain.name,
    description: plain.description ?? '',
    status: plain.status,
    isDefault: Boolean(plain.isDefault),
    tokens: plain.tokens ?? {},
    accessibility: plain.accessibility ?? {},
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    createdBy: plain.createdBy ?? null,
    updatedBy: plain.updatedBy ?? null,
  };

  if (!includeRelations) {
    return base;
  }

  return {
    ...base,
    assets: Array.isArray(plain.assets) ? plain.assets.map((asset) => ({ ...asset })) : [],
    layouts: Array.isArray(plain.layouts) ? plain.layouts.map((layout) => ({ ...layout })) : [],
    componentProfiles: Array.isArray(plain.componentProfiles)
      ? plain.componentProfiles.map((profile) => ({ ...profile }))
      : [],
  };
};

AppearanceAsset.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    themeId: plain.themeId ?? null,
    type: plain.type,
    label: plain.label,
    description: plain.description ?? '',
    url: plain.url,
    altText: plain.altText ?? '',
    metadata: plain.metadata ?? {},
    allowedRoles: Array.isArray(plain.allowedRoles) ? plain.allowedRoles : [],
    status: plain.status,
    isPrimary: Boolean(plain.isPrimary),
    sortOrder: plain.sortOrder ?? 0,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    createdBy: plain.createdBy ?? null,
    updatedBy: plain.updatedBy ?? null,
  };
};

AppearanceLayout.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    themeId: plain.themeId ?? null,
    name: plain.name,
    slug: plain.slug,
    page: plain.page,
    status: plain.status,
    version: plain.version ?? 1,
    config: plain.config ?? {},
    allowedRoles: Array.isArray(plain.allowedRoles) ? plain.allowedRoles : [],
    metadata: plain.metadata ?? {},
    releaseNotes: plain.releaseNotes ?? '',
    publishedAt: plain.publishedAt ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    createdBy: plain.createdBy ?? null,
    updatedBy: plain.updatedBy ?? null,
  };
};

AppearanceComponentProfile.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    themeId: plain.themeId ?? null,
    componentKey: plain.componentKey,
    status: plain.status,
    definition: plain.definition ?? {},
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    createdBy: plain.createdBy ?? null,
    updatedBy: plain.updatedBy ?? null,
  };
};

export default {
  AppearanceTheme,
  AppearanceAsset,
  AppearanceLayout,
  AppearanceComponentProfile,
  APPEARANCE_THEME_STATUSES,
  APPEARANCE_ASSET_TYPES,
  APPEARANCE_ASSET_STATUSES,
  APPEARANCE_LAYOUT_STATUSES,
  APPEARANCE_LAYOUT_PAGES,
  APPEARANCE_COMPONENT_PROFILE_STATUSES,
};
