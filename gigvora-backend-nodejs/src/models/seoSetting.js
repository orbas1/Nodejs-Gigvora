import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

function normaliseKeywordArray(keywords) {
  if (!Array.isArray(keywords)) {
    return [];
  }
  return Array.from(
    new Set(
      keywords
        .map((keyword) => `${keyword}`.trim())
        .filter((keyword) => keyword.length > 0 && keyword.length <= 120),
    ),
  );
}

function normalisePath(path) {
  if (typeof path !== 'string') {
    return '/';
  }
  if (!path.startsWith('/')) {
    return `/${path.trim()}`;
  }
  return path.trim() || '/';
}

function normaliseUrl(url) {
  if (typeof url !== 'string' || url.trim().length === 0) {
    return '';
  }
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    return trimmed;
  }
  return `/${trimmed}`;
}

function normaliseStringMap(record) {
  if (!record || typeof record !== 'object') {
    return {};
  }
  return Object.fromEntries(
    Object.entries(record)
      .map(([key, value]) => [key, typeof value === 'string' ? value : `${value}`])
      .filter(([key, value]) => key && value),
  );
}

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
    alternateLocales: { type: jsonType, allowNull: false, defaultValue: [] },
    previewImage: { type: DataTypes.STRING(2048), allowNull: true },
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
    path: {
      type: DataTypes.STRING(255),
      allowNull: false,
      set(value) {
        this.setDataValue('path', normalisePath(value));
      },
    },
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

SeoSetting.addHook('beforeValidate', (setting) => {
  setting.key = (setting.key || '').trim();
  setting.defaultKeywords = normaliseKeywordArray(setting.defaultKeywords);
  setting.noindexPaths = normaliseKeywordArray(setting.noindexPaths).map(normalisePath);
  setting.canonicalBaseUrl = normaliseUrl(setting.canonicalBaseUrl);
  setting.sitemapUrl = normaliseUrl(setting.sitemapUrl);
  setting.verificationCodes = normaliseStringMap(setting.verificationCodes);
  setting.socialDefaults = typeof setting.socialDefaults === 'object' ? setting.socialDefaults : {};
  setting.structuredData = typeof setting.structuredData === 'object' ? setting.structuredData : {};
  setting.alternateLocales = normaliseKeywordArray(setting.alternateLocales);
});

SeoPageOverride.addHook('beforeValidate', (override) => {
  override.keywords = normaliseKeywordArray(override.keywords);
  override.metaTags = Array.isArray(override.metaTags) ? override.metaTags : [];
  override.social = typeof override.social === 'object' ? override.social : {};
  override.twitter = typeof override.twitter === 'object' ? override.twitter : {};
  override.structuredData = typeof override.structuredData === 'object' ? override.structuredData : {};
  override.canonicalUrl = normaliseUrl(override.canonicalUrl);
});

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
    defaultKeywords: normaliseKeywordArray(plain.defaultKeywords),
    canonicalBaseUrl: plain.canonicalBaseUrl ?? '',
    sitemapUrl: plain.sitemapUrl ?? '',
    allowIndexing: Boolean(plain.allowIndexing ?? true),
    robotsPolicy: plain.robotsPolicy ?? '',
    noindexPaths: (plain.noindexPaths ?? []).map(normalisePath),
    verificationCodes: normaliseStringMap(plain.verificationCodes),
    socialDefaults: plain.socialDefaults ?? {},
    structuredData: plain.structuredData ?? {},
    alternateLocales: normaliseKeywordArray(plain.alternateLocales),
    previewImage: plain.previewImage ?? '',
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
    keywords: normaliseKeywordArray(plain.keywords),
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

SeoSetting.resolveForPath = async function resolveForPath(path, { key } = {}) {
  const normalisedPath = normalisePath(path);
  const where = key ? { key } : {};

  const setting = await SeoSetting.findOne({
    where,
    include: [{ model: SeoPageOverride, as: 'overrides' }],
    order: [['updatedAt', 'DESC']],
  });
  if (!setting) {
    return null;
  }

  const override = setting.overrides?.find((item) => item.path === normalisedPath);
  if (!override) {
    return setting.toPublicObject();
  }

  const overrideShape = override.toPublicObject();
  const merged = override.applyTo(setting);
  return { ...merged, activeOverride: overrideShape };
};

SeoSetting.prototype.getOverrideForPath = function getOverrideForPath(path) {
  const normalisedPath = normalisePath(path);
  return this.overrides?.find((override) => override.path === normalisedPath) ?? null;
};

SeoPageOverride.prototype.applyTo = function applyTo(setting) {
  const base = typeof setting?.toPublicObject === 'function' ? setting.toPublicObject() : setting;
  const override = this.toPublicObject();
  return {
    ...base,
    defaultTitle: override.title || base?.defaultTitle,
    defaultDescription: override.description || base?.defaultDescription,
    defaultKeywords: override.keywords.length ? override.keywords : base?.defaultKeywords ?? [],
    canonicalBaseUrl: override.canonicalUrl || base?.canonicalBaseUrl,
    socialDefaults: { ...(base?.socialDefaults ?? {}), ...override.social },
    structuredData: { ...(base?.structuredData ?? {}), ...override.structuredData },
    metaTags: override.metaTags.length ? override.metaTags : base?.metaTags ?? [],
    allowIndexing: override.noindex ? false : base?.allowIndexing,
  };
};

export default SeoSetting;
