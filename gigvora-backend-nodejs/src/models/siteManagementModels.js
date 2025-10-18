import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const SITE_PAGE_STATUSES = ['draft', 'review', 'published', 'archived'];

export const SiteSetting = sequelize.define(
  'SiteSetting',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    key: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    value: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  {
    tableName: 'site_settings',
    indexes: [{ unique: true, fields: ['key'] }],
  },
);

SiteSetting.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    key: plain.key,
    value: plain.value ?? {},
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const SitePage = sequelize.define(
  'SitePage',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    summary: { type: DataTypes.STRING(500), allowNull: true },
    heroTitle: { type: DataTypes.STRING(200), allowNull: true },
    heroSubtitle: { type: DataTypes.STRING(400), allowNull: true },
    heroImageUrl: { type: DataTypes.STRING(2048), allowNull: true },
    heroImageAlt: { type: DataTypes.STRING(255), allowNull: true },
    ctaLabel: { type: DataTypes.STRING(120), allowNull: true },
    ctaUrl: { type: DataTypes.STRING(2048), allowNull: true },
    layout: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'standard' },
    body: { type: DataTypes.TEXT('long'), allowNull: true },
    featureHighlights: { type: jsonType, allowNull: true, defaultValue: [] },
    seoTitle: { type: DataTypes.STRING(200), allowNull: true },
    seoDescription: { type: DataTypes.STRING(500), allowNull: true },
    seoKeywords: { type: jsonType, allowNull: true, defaultValue: [] },
    thumbnailUrl: { type: DataTypes.STRING(2048), allowNull: true },
    status: { type: DataTypes.ENUM(...SITE_PAGE_STATUSES), allowNull: false, defaultValue: 'draft' },
    publishedAt: { type: DataTypes.DATE, allowNull: true },
    allowedRoles: { type: jsonType, allowNull: true, defaultValue: [] },
  },
  {
    tableName: 'site_pages',
    indexes: [
      { unique: true, fields: ['slug'] },
      { fields: ['status'] },
    ],
  },
);

SitePage.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    slug: plain.slug,
    title: plain.title,
    summary: plain.summary,
    heroTitle: plain.heroTitle,
    heroSubtitle: plain.heroSubtitle,
    heroImageUrl: plain.heroImageUrl,
    heroImageAlt: plain.heroImageAlt,
    ctaLabel: plain.ctaLabel,
    ctaUrl: plain.ctaUrl,
    layout: plain.layout,
    body: plain.body,
    featureHighlights: Array.isArray(plain.featureHighlights) ? plain.featureHighlights : [],
    seoTitle: plain.seoTitle,
    seoDescription: plain.seoDescription,
    seoKeywords: Array.isArray(plain.seoKeywords) ? plain.seoKeywords : [],
    thumbnailUrl: plain.thumbnailUrl,
    status: plain.status,
    publishedAt: plain.publishedAt,
    allowedRoles: Array.isArray(plain.allowedRoles) ? plain.allowedRoles : [],
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const SiteNavigationLink = sequelize.define(
  'SiteNavigationLink',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    menuKey: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'primary' },
    label: { type: DataTypes.STRING(160), allowNull: false },
    url: { type: DataTypes.STRING(2048), allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
    icon: { type: DataTypes.STRING(120), allowNull: true },
    orderIndex: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    isExternal: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    openInNewTab: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    allowedRoles: { type: jsonType, allowNull: true, defaultValue: [] },
    parentId: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: 'site_navigation_links',
    indexes: [
      { fields: ['menuKey', 'orderIndex'] },
    ],
  },
);

SiteNavigationLink.belongsTo(SiteNavigationLink, { as: 'parent', foreignKey: 'parentId' });

SiteNavigationLink.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    menuKey: plain.menuKey,
    label: plain.label,
    url: plain.url,
    description: plain.description,
    icon: plain.icon,
    orderIndex: plain.orderIndex,
    isExternal: Boolean(plain.isExternal),
    openInNewTab: Boolean(plain.openInNewTab),
    allowedRoles: Array.isArray(plain.allowedRoles) ? plain.allowedRoles : [],
    parentId: plain.parentId ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export default {
  SiteSetting,
  SitePage,
  SiteNavigationLink,
  SITE_PAGE_STATUSES,
};
