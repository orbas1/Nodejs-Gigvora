import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const SeoSetting = sequelize.define(
  'SeoSetting',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    key: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    siteName: { type: DataTypes.STRING(180), allowNull: false, defaultValue: 'Gigvora' },
    defaultTitle: { type: DataTypes.STRING(180), allowNull: false, defaultValue: 'Gigvora' },
    defaultDescription: { type: DataTypes.TEXT('long'), allowNull: false, defaultValue: '' },
    defaultKeywords: { type: jsonType, allowNull: false, defaultValue: [] },
    canonicalBaseUrl: { type: DataTypes.STRING(2048), allowNull: true },
    sitemapUrl: { type: DataTypes.STRING(2048), allowNull: true },
    allowIndexing: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    robotsPolicy: { type: DataTypes.TEXT('long'), allowNull: true },
    noindexPaths: { type: jsonType, allowNull: false, defaultValue: [] },
    verificationCodes: { type: jsonType, allowNull: false, defaultValue: {} },
    socialDefaults: { type: jsonType, allowNull: false, defaultValue: {} },
    structuredData: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  {
    tableName: 'seo_settings',
    indexes: [{ unique: true, fields: ['key'] }],
  },
);

export const SeoPageOverride = sequelize.define(
  'SeoPageOverride',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    seoSettingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'seo_settings',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    path: { type: DataTypes.STRING(255), allowNull: false },
    title: { type: DataTypes.STRING(180), allowNull: true },
    description: { type: DataTypes.TEXT('long'), allowNull: true },
    keywords: { type: jsonType, allowNull: false, defaultValue: [] },
    canonicalUrl: { type: DataTypes.STRING(2048), allowNull: true },
    social: { type: jsonType, allowNull: false, defaultValue: {} },
    twitter: { type: jsonType, allowNull: false, defaultValue: {} },
    structuredData: { type: jsonType, allowNull: false, defaultValue: {} },
    metaTags: { type: jsonType, allowNull: false, defaultValue: [] },
    noindex: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: 'seo_page_overrides',
    indexes: [{ unique: true, fields: ['seoSettingId', 'path'] }],
  },
);

SeoSetting.hasMany(SeoPageOverride, {
  as: 'overrides',
  foreignKey: 'seoSettingId',
  onDelete: 'CASCADE',
  hooks: true,
});

SeoPageOverride.belongsTo(SeoSetting, {
  as: 'setting',
  foreignKey: 'seoSettingId',
});

SeoSetting.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    key: plain.key,
    siteName: plain.siteName,
    defaultTitle: plain.defaultTitle,
    defaultDescription: plain.defaultDescription ?? '',
    defaultKeywords: Array.isArray(plain.defaultKeywords) ? plain.defaultKeywords : [],
    canonicalBaseUrl: plain.canonicalBaseUrl ?? '',
    sitemapUrl: plain.sitemapUrl ?? '',
    allowIndexing: Boolean(plain.allowIndexing ?? true),
    robotsPolicy: plain.robotsPolicy ?? '',
    noindexPaths: Array.isArray(plain.noindexPaths) ? plain.noindexPaths : [],
    verificationCodes: plain.verificationCodes ?? {},
    socialDefaults: plain.socialDefaults ?? {},
    structuredData: plain.structuredData ?? {},
    overrides: Array.isArray(plain.overrides)
      ? plain.overrides.map((override) =>
          typeof override?.toPublicObject === 'function'
            ? override.toPublicObject()
            : override,
        )
      : [],
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

SeoPageOverride.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    seoSettingId: plain.seoSettingId,
    path: plain.path,
    title: plain.title ?? '',
    description: plain.description ?? '',
    keywords: Array.isArray(plain.keywords) ? plain.keywords : [],
    canonicalUrl: plain.canonicalUrl ?? '',
    social: plain.social ?? {},
    twitter: plain.twitter ?? {},
    structuredData: plain.structuredData ?? {},
    metaTags: Array.isArray(plain.metaTags) ? plain.metaTags : [],
    noindex: Boolean(plain.noindex),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export default SeoSetting;
