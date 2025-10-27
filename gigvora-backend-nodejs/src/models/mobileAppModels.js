import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';
import { applyModelSlug, normaliseEmail } from '../utils/modelNormalizers.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const MOBILE_APP_PLATFORMS = ['ios', 'android'];
export const MOBILE_APP_STATUSES = ['active', 'paused', 'retired'];
export const MOBILE_APP_RELEASE_CHANNELS = ['production', 'beta', 'internal'];
export const MOBILE_APP_COMPLIANCE_STATUSES = ['ok', 'review', 'blocked'];
export const MOBILE_APP_VERSION_STATUSES = ['draft', 'in_review', 'released', 'deprecated'];
export const MOBILE_APP_VERSION_TYPES = ['major', 'minor', 'patch', 'hotfix'];
export const MOBILE_APP_FEATURE_ROLLOUT_TYPES = ['global', 'percentage', 'cohort'];

const sanitiseUrl = (value) => {
  if (!value) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
};

const sanitiseText = (value) => {
  if (!value) {
    return null;
  }
  const text = String(value).trim();
  return text.length ? text : null;
};

const sanitisePercentage = (value) => {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return Math.min(Math.max(numeric, 0), 100);
};

const sanitiseAudienceRoles = (value) => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => `${entry ?? ''}`.trim().toLowerCase())
      .filter((entry, index, array) => entry.length && array.indexOf(entry) === index);
  }
  return `${value}`
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry, index, array) => entry.length && array.indexOf(entry) === index);
};

export const MobileApp = sequelize.define(
  'MobileApp',
  {
    displayName: { type: DataTypes.STRING(255), allowNull: false },
    slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    platform: {
      type: DataTypes.ENUM(...MOBILE_APP_PLATFORMS),
      allowNull: false,
      defaultValue: 'ios',
      validate: { isIn: [MOBILE_APP_PLATFORMS] },
    },
    status: {
      type: DataTypes.ENUM(...MOBILE_APP_STATUSES),
      allowNull: false,
      defaultValue: 'active',
      validate: { isIn: [MOBILE_APP_STATUSES] },
    },
    releaseChannel: {
      type: DataTypes.ENUM(...MOBILE_APP_RELEASE_CHANNELS),
      allowNull: false,
      defaultValue: 'production',
      validate: { isIn: [MOBILE_APP_RELEASE_CHANNELS] },
    },
    complianceStatus: {
      type: DataTypes.ENUM(...MOBILE_APP_COMPLIANCE_STATUSES),
      allowNull: false,
      defaultValue: 'ok',
      validate: { isIn: [MOBILE_APP_COMPLIANCE_STATUSES] },
    },
    currentVersion: { type: DataTypes.STRING(40), allowNull: true },
    latestBuildNumber: { type: DataTypes.STRING(40), allowNull: true },
    minimumSupportedVersion: { type: DataTypes.STRING(40), allowNull: true },
    storeUrl: { type: DataTypes.STRING(500), allowNull: true },
    supportEmail: { type: DataTypes.STRING(255), allowNull: true },
    supportUrl: { type: DataTypes.STRING(500), allowNull: true },
    marketingUrl: { type: DataTypes.STRING(500), allowNull: true },
    iconUrl: { type: DataTypes.STRING(500), allowNull: true },
    heroImageUrl: { type: DataTypes.STRING(500), allowNull: true },
    rolloutNotes: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'mobile_apps',
    indexes: [
      { fields: ['platform'] },
      { fields: ['status'] },
      { fields: ['releaseChannel'] },
    ],
  },
);

MobileApp.addHook('beforeValidate', (app) => {
  applyModelSlug(app, {
    slugField: 'slug',
    sourceField: 'displayName',
    fallback: 'mobile-app',
    maxLength: 160,
  });
  app.supportEmail = normaliseEmail(app.supportEmail);
  app.storeUrl = sanitiseUrl(app.storeUrl);
  app.supportUrl = sanitiseUrl(app.supportUrl);
  app.marketingUrl = sanitiseUrl(app.marketingUrl);
  app.iconUrl = sanitiseUrl(app.iconUrl);
  app.heroImageUrl = sanitiseUrl(app.heroImageUrl);
  app.rolloutNotes = sanitiseText(app.rolloutNotes);
  app.currentVersion = sanitiseText(app.currentVersion);
  app.latestBuildNumber = sanitiseText(app.latestBuildNumber);
  app.minimumSupportedVersion = sanitiseText(app.minimumSupportedVersion);
});

MobileApp.prototype.toAdminJSON = function toAdminJSON({ includeAssociations = true } = {}) {
  const plain = this.get({ plain: true });
  const response = {
    id: plain.id,
    displayName: plain.displayName,
    slug: plain.slug,
    platform: plain.platform,
    status: plain.status,
    releaseChannel: plain.releaseChannel,
    complianceStatus: plain.complianceStatus,
    currentVersion: plain.currentVersion ?? null,
    latestBuildNumber: plain.latestBuildNumber ?? null,
    minimumSupportedVersion: plain.minimumSupportedVersion ?? null,
    storeUrl: plain.storeUrl ?? null,
    supportEmail: plain.supportEmail ?? null,
    supportUrl: plain.supportUrl ?? null,
    marketingUrl: plain.marketingUrl ?? null,
    iconUrl: plain.iconUrl ?? null,
    heroImageUrl: plain.heroImageUrl ?? null,
    rolloutNotes: plain.rolloutNotes ?? null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };

  if (includeAssociations) {
    response.versions = Array.isArray(this.versions)
      ? this.versions.map((version) =>
          typeof version.toAdminJSON === 'function' ? version.toAdminJSON() : version,
        )
      : [];
    response.features = Array.isArray(this.features)
      ? this.features.map((feature) =>
          typeof feature.toAdminJSON === 'function' ? feature.toAdminJSON() : feature,
        )
      : [];
  }

  return response;
};

export const MobileAppVersion = sequelize.define(
  'MobileAppVersion',
  {
    appId: { type: DataTypes.INTEGER, allowNull: false },
    version: { type: DataTypes.STRING(40), allowNull: false },
    buildNumber: { type: DataTypes.STRING(40), allowNull: true },
    status: {
      type: DataTypes.ENUM(...MOBILE_APP_VERSION_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [MOBILE_APP_VERSION_STATUSES] },
    },
    releaseType: {
      type: DataTypes.ENUM(...MOBILE_APP_VERSION_TYPES),
      allowNull: false,
      defaultValue: 'patch',
      validate: { isIn: [MOBILE_APP_VERSION_TYPES] },
    },
    releaseChannel: {
      type: DataTypes.ENUM(...MOBILE_APP_RELEASE_CHANNELS),
      allowNull: false,
      defaultValue: 'production',
      validate: { isIn: [MOBILE_APP_RELEASE_CHANNELS] },
    },
    rolloutPercentage: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    downloadUrl: { type: DataTypes.STRING(500), allowNull: true },
    releaseNotes: { type: DataTypes.TEXT, allowNull: true },
    releaseNotesUrl: { type: DataTypes.STRING(500), allowNull: true },
    checksum: { type: DataTypes.STRING(120), allowNull: true },
    minOsVersion: { type: DataTypes.STRING(40), allowNull: true },
    sizeBytes: { type: DataTypes.BIGINT, allowNull: true },
    scheduledAt: { type: DataTypes.DATE, allowNull: true },
    releasedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'mobile_app_versions',
    indexes: [
      { unique: true, fields: ['appId', 'version'] },
      { fields: ['status'] },
      { fields: ['scheduledAt'] },
      { fields: ['releaseChannel'] },
    ],
  },
);

MobileAppVersion.addHook('beforeValidate', (version) => {
  version.buildNumber = sanitiseText(version.buildNumber);
  version.version = sanitiseText(version.version);
  version.downloadUrl = sanitiseUrl(version.downloadUrl);
  version.releaseNotes = sanitiseText(version.releaseNotes);
  version.releaseNotesUrl = sanitiseUrl(version.releaseNotesUrl);
  version.checksum = sanitiseText(version.checksum);
  version.minOsVersion = sanitiseText(version.minOsVersion);
  version.sizeBytes = version.sizeBytes == null ? null : Number(version.sizeBytes);
  version.rolloutPercentage = sanitisePercentage(version.rolloutPercentage);
});

MobileAppVersion.prototype.toAdminJSON = function toAdminJSON() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    appId: plain.appId,
    version: plain.version,
    buildNumber: plain.buildNumber ?? null,
    status: plain.status,
    releaseType: plain.releaseType,
    releaseChannel: plain.releaseChannel,
    rolloutPercentage: plain.rolloutPercentage == null ? null : Number(plain.rolloutPercentage),
    downloadUrl: plain.downloadUrl ?? null,
    releaseNotes: plain.releaseNotes ?? null,
    releaseNotesUrl: plain.releaseNotesUrl ?? null,
    checksum: plain.checksum ?? null,
    minOsVersion: plain.minOsVersion ?? null,
    sizeBytes: plain.sizeBytes == null ? null : Number(plain.sizeBytes),
    scheduledAt: plain.scheduledAt ? new Date(plain.scheduledAt).toISOString() : null,
    releasedAt: plain.releasedAt ? new Date(plain.releasedAt).toISOString() : null,
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const MobileAppFeature = sequelize.define(
  'MobileAppFeature',
  {
    appId: { type: DataTypes.INTEGER, allowNull: false },
    key: { type: DataTypes.STRING(160), allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    rolloutType: {
      type: DataTypes.ENUM(...MOBILE_APP_FEATURE_ROLLOUT_TYPES),
      allowNull: false,
      defaultValue: 'global',
      validate: { isIn: [MOBILE_APP_FEATURE_ROLLOUT_TYPES] },
    },
    rolloutValue: { type: jsonType, allowNull: true },
    minAppVersion: { type: DataTypes.STRING(40), allowNull: true },
    maxAppVersion: { type: DataTypes.STRING(40), allowNull: true },
    audienceRoles: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'mobile_app_features',
    indexes: [
      { unique: true, fields: ['appId', 'key'] },
      { fields: ['enabled'] },
      { fields: ['rolloutType'] },
    ],
  },
);

MobileAppFeature.addHook('beforeValidate', (feature) => {
  feature.key = sanitiseText(feature.key)?.toLowerCase().replace(/[^a-z0-9._-]+/g, '-') ?? null;
  feature.name = sanitiseText(feature.name);
  feature.description = sanitiseText(feature.description);
  feature.rolloutValue = feature.rolloutValue ?? null;
  feature.minAppVersion = sanitiseText(feature.minAppVersion);
  feature.maxAppVersion = sanitiseText(feature.maxAppVersion);
  feature.audienceRoles = sanitiseAudienceRoles(feature.audienceRoles);
  feature.metadata = feature.metadata ?? null;
});

MobileAppFeature.prototype.toAdminJSON = function toAdminJSON() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    appId: plain.appId,
    key: plain.key,
    name: plain.name,
    description: plain.description ?? null,
    enabled: Boolean(plain.enabled),
    rolloutType: plain.rolloutType,
    rolloutValue: plain.rolloutValue ?? null,
    rolloutPercentage:
      plain.rolloutType === 'percentage' && plain.rolloutValue?.percentage != null
        ? Number(plain.rolloutValue.percentage)
        : null,
    minAppVersion: plain.minAppVersion ?? null,
    maxAppVersion: plain.maxAppVersion ?? null,
    audienceRoles: Array.isArray(plain.audienceRoles) ? plain.audienceRoles : [],
    metadata: plain.metadata ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

MobileApp.hasMany(MobileAppVersion, {
  foreignKey: 'appId',
  as: 'versions',
  onDelete: 'CASCADE',
  hooks: true,
});
MobileAppVersion.belongsTo(MobileApp, { foreignKey: 'appId', as: 'app' });

MobileApp.hasMany(MobileAppFeature, {
  foreignKey: 'appId',
  as: 'features',
  onDelete: 'CASCADE',
  hooks: true,
});
MobileAppFeature.belongsTo(MobileApp, { foreignKey: 'appId', as: 'app' });

export default {
  MobileApp,
  MobileAppVersion,
  MobileAppFeature,
};
