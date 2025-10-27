import { Op } from 'sequelize';
import models from '../models/index.js';
import logger from '../utils/logger.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

let modelsContainer = models;
let sequelizeInstance = models.sequelize;
let log = logger.child({ component: 'mobileAppService' });

function getModels() {
  modelsContainer = modelsContainer ?? models;
  return modelsContainer;
}

function getSequelize(strict = false) {
  const instance = sequelizeInstance ?? getModels()?.sequelize ?? models.sequelize;
  if (strict && (!instance || typeof instance.transaction !== 'function')) {
    throw new Error('Sequelize instance is not configured for mobileAppService.');
  }
  return instance;
}

function reinitialiseLogger(nextLogger) {
  if (nextLogger) {
    log = typeof nextLogger.child === 'function' ? nextLogger.child({ component: 'mobileAppService' }) : nextLogger;
  } else {
    log = logger.child({ component: 'mobileAppService' });
  }
}

export function __setDependencies({ models: overrides, sequelize: sequelizeOverride, logger: loggerOverride } = {}) {
  modelsContainer = overrides ?? models;
  sequelizeInstance = sequelizeOverride ?? modelsContainer?.sequelize ?? models.sequelize;
  reinitialiseLogger(loggerOverride);
}

export function __resetDependencies() {
  modelsContainer = models;
  sequelizeInstance = models.sequelize;
  reinitialiseLogger();
}

function getMobileAppModel() {
  const MobileApp = getModels()?.MobileApp;
  if (!MobileApp) {
    throw new Error('MobileApp model is not configured.');
  }
  return MobileApp;
}

function getMobileAppVersionModel() {
  const MobileAppVersion = getModels()?.MobileAppVersion;
  if (!MobileAppVersion) {
    throw new Error('MobileAppVersion model is not configured.');
  }
  return MobileAppVersion;
}

function getMobileAppFeatureModel() {
  const MobileAppFeature = getModels()?.MobileAppFeature;
  if (!MobileAppFeature) {
    throw new Error('MobileAppFeature model is not configured.');
  }
  return MobileAppFeature;
}

function getEnumValues(attribute) {
  const values = attribute?.values;
  return Array.isArray(values) ? values : [];
}

function normaliseString(value, { lower = false, maxLength } = {}) {
  if (value == null) {
    return undefined;
  }
  let text = `${value}`.trim();
  if (!text) {
    return undefined;
  }
  if (typeof maxLength === 'number') {
    text = text.slice(0, maxLength);
  }
  return lower ? text.toLowerCase() : text;
}

function sanitiseSlug(value) {
  return normaliseString(value, { lower: true, maxLength: 160 });
}

function sanitiseArray(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => normaliseString(entry, { lower: true }))
      .filter((entry, index, array) => entry && array.indexOf(entry) === index);
  }
  return `${value}`
    .split(',')
    .map((entry) => normaliseString(entry, { lower: true }))
    .filter((entry, index, array) => entry && array.indexOf(entry) === index);
}

function sanitisePercentage(value) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError('rolloutPercentage must be a valid number between 0 and 100.');
  }
  if (numeric < 0 || numeric > 100) {
    throw new ValidationError('rolloutPercentage must be between 0 and 100.');
  }
  return Math.round(numeric * 100) / 100;
}

function parseDate(value, fieldName) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date.`);
  }
  return date;
}

async function fetchMobileApp(appId, { includeAssociations = true } = {}) {
  const MobileApp = getMobileAppModel();
  const MobileAppVersion = getMobileAppVersionModel();
  const MobileAppFeature = getMobileAppFeatureModel();
  const app = await MobileApp.findByPk(appId, {
    include: includeAssociations
      ? [
          { model: MobileAppVersion, as: 'versions', order: [['createdAt', 'DESC']] },
          { model: MobileAppFeature, as: 'features', order: [['name', 'ASC']] },
        ]
      : undefined,
  });
  if (!app) {
    throw new NotFoundError('Mobile app not found.');
  }
  return app;
}

function formatApp(record, options) {
  return typeof record.toAdminJSON === 'function' ? record.toAdminJSON(options) : record;
}

function formatVersion(record) {
  return typeof record.toAdminJSON === 'function' ? record.toAdminJSON() : record;
}

function formatFeature(record) {
  return typeof record.toAdminJSON === 'function' ? record.toAdminJSON() : record;
}

export async function listMobileApps({ includeInactive = false } = {}) {
  const MobileApp = getMobileAppModel();
  const MobileAppVersion = getMobileAppVersionModel();
  const MobileAppFeature = getMobileAppFeatureModel();

  const where = {};
  if (!includeInactive) {
    where.status = 'active';
  }

  const apps = await MobileApp.findAll({
    where,
    include: [
      {
        model: MobileAppVersion,
        as: 'versions',
        separate: true,
        order: [['createdAt', 'DESC']],
      },
      {
        model: MobileAppFeature,
        as: 'features',
        separate: true,
        order: [['name', 'ASC']],
      },
    ],
    order: [
      ['updatedAt', 'DESC'],
      ['id', 'DESC'],
    ],
  });

  const MobileAppFeatureModel = getMobileAppFeatureModel();
  const MobileAppVersionModel = getMobileAppVersionModel();

  const [totalApps, pendingReviews, upcomingReleases, enabledFeatures] = await Promise.all([
    MobileApp.count(),
    MobileAppVersionModel.count({ where: { status: 'in_review' } }),
    MobileAppVersionModel.count({ where: { scheduledAt: { [Op.gt]: new Date() } } }),
    MobileAppFeatureModel.count({ where: { enabled: true } }),
  ]);

  return {
    apps: apps.map((app) => formatApp(app)),
    summary: {
      totalApps,
      pendingReviews,
      upcomingReleases,
      activeFeatures: enabledFeatures,
    },
  };
}

function assertEnum(value, allowed, field) {
  if (value == null) {
    return undefined;
  }
  const normalised = `${value}`.trim().toLowerCase();
  if (!allowed.includes(normalised)) {
    throw new ValidationError(`${field} must be one of: ${allowed.join(', ')}.`);
  }
  return normalised;
}

export async function createMobileApp(payload = {}) {
  const MobileApp = getMobileAppModel();
  const attributes = MobileApp.rawAttributes ?? {};

  const platform = assertEnum(payload.platform ?? attributes.platform?.defaultValue, getEnumValues(attributes.platform), 'platform');
  const status = assertEnum(payload.status ?? attributes.status?.defaultValue, getEnumValues(attributes.status), 'status');
  const releaseChannel = assertEnum(
    payload.releaseChannel ?? attributes.releaseChannel?.defaultValue,
    getEnumValues(attributes.releaseChannel),
    'releaseChannel',
  );
  const complianceStatus = assertEnum(
    payload.complianceStatus ?? attributes.complianceStatus?.defaultValue,
    getEnumValues(attributes.complianceStatus),
    'complianceStatus',
  );

  const app = await MobileApp.create({
    displayName: normaliseString(payload.displayName) ?? (() => {
      throw new ValidationError('displayName is required.');
    })(),
    slug: sanitiseSlug(payload.slug),
    platform,
    status,
    releaseChannel,
    complianceStatus,
    currentVersion: normaliseString(payload.currentVersion),
    latestBuildNumber: normaliseString(payload.latestBuildNumber),
    minimumSupportedVersion: normaliseString(payload.minimumSupportedVersion),
    storeUrl: normaliseString(payload.storeUrl),
    supportEmail: normaliseString(payload.supportEmail),
    supportUrl: normaliseString(payload.supportUrl),
    marketingUrl: normaliseString(payload.marketingUrl),
    iconUrl: normaliseString(payload.iconUrl),
    heroImageUrl: normaliseString(payload.heroImageUrl),
    rolloutNotes: normaliseString(payload.rolloutNotes),
    metadata: payload.metadata ?? null,
  });

  const reloaded = await fetchMobileApp(app.id);
  log.debug({ appId: app.id }, 'Created mobile app record.');
  return formatApp(reloaded);
}

export async function updateMobileApp(appId, payload = {}) {
  if (!appId) {
    throw new ValidationError('appId is required.');
  }
  const app = await fetchMobileApp(appId, { includeAssociations: false });
  const attributes = app.constructor.rawAttributes ?? {};

  if (payload.displayName != null) {
    const name = normaliseString(payload.displayName);
    if (!name) {
      throw new ValidationError('displayName cannot be blank.');
    }
    app.displayName = name;
  }
  if (payload.slug !== undefined) {
    app.slug = sanitiseSlug(payload.slug);
  }
  if (payload.platform !== undefined) {
    app.platform = assertEnum(payload.platform, getEnumValues(attributes.platform), 'platform');
  }
  if (payload.status !== undefined) {
    app.status = assertEnum(payload.status, getEnumValues(attributes.status), 'status');
  }
  if (payload.releaseChannel !== undefined) {
    app.releaseChannel = assertEnum(
      payload.releaseChannel,
      getEnumValues(attributes.releaseChannel),
      'releaseChannel',
    );
  }
  if (payload.complianceStatus !== undefined) {
    app.complianceStatus = assertEnum(
      payload.complianceStatus,
      getEnumValues(attributes.complianceStatus),
      'complianceStatus',
    );
  }

  app.currentVersion = payload.currentVersion !== undefined ? normaliseString(payload.currentVersion) ?? null : app.currentVersion;
  app.latestBuildNumber =
    payload.latestBuildNumber !== undefined ? normaliseString(payload.latestBuildNumber) ?? null : app.latestBuildNumber;
  app.minimumSupportedVersion =
    payload.minimumSupportedVersion !== undefined
      ? normaliseString(payload.minimumSupportedVersion) ?? null
      : app.minimumSupportedVersion;
  app.storeUrl = payload.storeUrl !== undefined ? normaliseString(payload.storeUrl) ?? null : app.storeUrl;
  app.supportEmail = payload.supportEmail !== undefined ? normaliseString(payload.supportEmail) ?? null : app.supportEmail;
  app.supportUrl = payload.supportUrl !== undefined ? normaliseString(payload.supportUrl) ?? null : app.supportUrl;
  app.marketingUrl = payload.marketingUrl !== undefined ? normaliseString(payload.marketingUrl) ?? null : app.marketingUrl;
  app.iconUrl = payload.iconUrl !== undefined ? normaliseString(payload.iconUrl) ?? null : app.iconUrl;
  app.heroImageUrl = payload.heroImageUrl !== undefined ? normaliseString(payload.heroImageUrl) ?? null : app.heroImageUrl;
  app.rolloutNotes = payload.rolloutNotes !== undefined ? normaliseString(payload.rolloutNotes) ?? null : app.rolloutNotes;
  if (payload.metadata !== undefined) {
    if (payload.metadata && typeof payload.metadata !== 'object') {
      throw new ValidationError('metadata must be an object or null.');
    }
    app.metadata = payload.metadata ?? null;
  }

  await app.save();
  const reloaded = await fetchMobileApp(app.id);
  log.debug({ appId: app.id }, 'Updated mobile app record.');
  return formatApp(reloaded);
}

function buildVersionPayload(appId, payload, attributes) {
  const version = normaliseString(payload.version, { maxLength: 40 });
  if (!version) {
    throw new ValidationError('version is required.');
  }
  const releaseType = assertEnum(
    payload.releaseType ?? attributes.releaseType?.defaultValue,
    getEnumValues(attributes.releaseType),
    'releaseType',
  );
  const status = assertEnum(payload.status ?? attributes.status?.defaultValue, getEnumValues(attributes.status), 'status');
  const releaseChannel = assertEnum(
    payload.releaseChannel ?? attributes.releaseChannel?.defaultValue,
    getEnumValues(attributes.releaseChannel),
    'releaseChannel',
  );

  const rolloutPercentage = payload.rolloutPercentage !== undefined ? sanitisePercentage(payload.rolloutPercentage) : null;

  return {
    appId,
    version,
    buildNumber: normaliseString(payload.buildNumber),
    status,
    releaseType,
    releaseChannel,
    rolloutPercentage,
    downloadUrl: normaliseString(payload.downloadUrl),
    releaseNotes: normaliseString(payload.releaseNotes),
    releaseNotesUrl: normaliseString(payload.releaseNotesUrl),
    checksum: normaliseString(payload.checksum),
    minOsVersion: normaliseString(payload.minOsVersion),
    sizeBytes:
      payload.sizeBytes == null || payload.sizeBytes === '' ? null : Math.max(Number.parseInt(payload.sizeBytes, 10), 0) || 0,
    scheduledAt: parseDate(payload.scheduledAt, 'scheduledAt'),
    releasedAt: parseDate(payload.releasedAt, 'releasedAt'),
    metadata: payload.metadata ?? null,
  };
}

export async function createMobileAppVersion(appId, payload = {}) {
  if (!appId) {
    throw new ValidationError('appId is required.');
  }
  await fetchMobileApp(appId, { includeAssociations: false });
  const MobileAppVersion = getMobileAppVersionModel();
  const attributes = MobileAppVersion.rawAttributes ?? {};

  const versionPayload = buildVersionPayload(appId, payload, attributes);
  const record = await MobileAppVersion.create(versionPayload);
  log.debug({ appId, versionId: record.id }, 'Created mobile app version.');
  return formatVersion(record);
}

export async function updateMobileAppVersion(appId, versionId, payload = {}) {
  if (!appId || !versionId) {
    throw new ValidationError('appId and versionId are required.');
  }
  await fetchMobileApp(appId, { includeAssociations: false });
  const MobileAppVersion = getMobileAppVersionModel();
  const record = await MobileAppVersion.findOne({ where: { id: versionId, appId } });
  if (!record) {
    throw new NotFoundError('Mobile app version not found.');
  }
  const attributes = MobileAppVersion.rawAttributes ?? {};

  if (payload.version !== undefined) {
    record.version = normaliseString(payload.version, { maxLength: 40 }) ?? record.version;
  }
  if (payload.buildNumber !== undefined) {
    record.buildNumber = normaliseString(payload.buildNumber) ?? null;
  }
  if (payload.status !== undefined) {
    record.status = assertEnum(payload.status, getEnumValues(attributes.status), 'status');
  }
  if (payload.releaseType !== undefined) {
    record.releaseType = assertEnum(payload.releaseType, getEnumValues(attributes.releaseType), 'releaseType');
  }
  if (payload.releaseChannel !== undefined) {
    record.releaseChannel = assertEnum(
      payload.releaseChannel,
      getEnumValues(attributes.releaseChannel),
      'releaseChannel',
    );
  }
  if (payload.rolloutPercentage !== undefined) {
    record.rolloutPercentage = sanitisePercentage(payload.rolloutPercentage);
  }
  if (payload.downloadUrl !== undefined) {
    record.downloadUrl = normaliseString(payload.downloadUrl) ?? null;
  }
  if (payload.releaseNotes !== undefined) {
    record.releaseNotes = normaliseString(payload.releaseNotes) ?? null;
  }
  if (payload.releaseNotesUrl !== undefined) {
    record.releaseNotesUrl = normaliseString(payload.releaseNotesUrl) ?? null;
  }
  if (payload.checksum !== undefined) {
    record.checksum = normaliseString(payload.checksum) ?? null;
  }
  if (payload.minOsVersion !== undefined) {
    record.minOsVersion = normaliseString(payload.minOsVersion) ?? null;
  }
  if (payload.sizeBytes !== undefined) {
    record.sizeBytes =
      payload.sizeBytes == null || payload.sizeBytes === '' ? null : Math.max(Number.parseInt(payload.sizeBytes, 10), 0) || 0;
  }
  if (payload.scheduledAt !== undefined) {
    record.scheduledAt = parseDate(payload.scheduledAt, 'scheduledAt');
  }
  if (payload.releasedAt !== undefined) {
    record.releasedAt = parseDate(payload.releasedAt, 'releasedAt');
  }
  if (payload.metadata !== undefined) {
    if (payload.metadata && typeof payload.metadata !== 'object') {
      throw new ValidationError('metadata must be an object or null.');
    }
    record.metadata = payload.metadata ?? null;
  }

  await record.save();
  log.debug({ appId, versionId }, 'Updated mobile app version.');
  return formatVersion(record);
}

function buildFeatureRollout(rolloutType, rolloutPercentage, audienceRoles) {
  if (rolloutType === 'percentage') {
    const percentage = sanitisePercentage(rolloutPercentage);
    return percentage == null ? null : { percentage };
  }
  if (rolloutType === 'cohort') {
    const roles = sanitiseArray(audienceRoles);
    return roles.length ? { roles } : { roles: [] };
  }
  return null;
}

function buildFeaturePayload(appId, payload, attributes) {
  const key = normaliseString(payload.key, { lower: true, maxLength: 160 });
  if (!key) {
    throw new ValidationError('key is required.');
  }
  const name = normaliseString(payload.name, { maxLength: 255 });
  if (!name) {
    throw new ValidationError('name is required.');
  }
  const rolloutType = assertEnum(
    payload.rolloutType ?? attributes.rolloutType?.defaultValue,
    getEnumValues(attributes.rolloutType),
    'rolloutType',
  );
  const audienceRoles = sanitiseArray(payload.audienceRoles);
  const rolloutValue = buildFeatureRollout(rolloutType, payload.rolloutPercentage, audienceRoles);

  return {
    appId,
    key,
    name,
    description: normaliseString(payload.description),
    enabled: payload.enabled != null ? Boolean(payload.enabled) : false,
    rolloutType,
    rolloutValue,
    minAppVersion: normaliseString(payload.minAppVersion),
    maxAppVersion: normaliseString(payload.maxAppVersion),
    audienceRoles,
    metadata: payload.metadata ?? null,
  };
}

export async function createMobileAppFeature(appId, payload = {}) {
  if (!appId) {
    throw new ValidationError('appId is required.');
  }
  await fetchMobileApp(appId, { includeAssociations: false });
  const MobileAppFeature = getMobileAppFeatureModel();
  const attributes = MobileAppFeature.rawAttributes ?? {};
  const featurePayload = buildFeaturePayload(appId, payload, attributes);
  const record = await MobileAppFeature.create(featurePayload);
  log.debug({ appId, featureId: record.id }, 'Created mobile app feature.');
  return formatFeature(record);
}

export async function updateMobileAppFeature(appId, featureId, payload = {}) {
  if (!appId || !featureId) {
    throw new ValidationError('appId and featureId are required.');
  }
  await fetchMobileApp(appId, { includeAssociations: false });
  const MobileAppFeature = getMobileAppFeatureModel();
  const record = await MobileAppFeature.findOne({ where: { id: featureId, appId } });
  if (!record) {
    throw new NotFoundError('Mobile app feature not found.');
  }
  const attributes = MobileAppFeature.rawAttributes ?? {};

  if (payload.key !== undefined) {
    const key = normaliseString(payload.key, { lower: true, maxLength: 160 });
    if (!key) {
      throw new ValidationError('key cannot be blank.');
    }
    record.key = key;
  }
  if (payload.name !== undefined) {
    const name = normaliseString(payload.name, { maxLength: 255 });
    if (!name) {
      throw new ValidationError('name cannot be blank.');
    }
    record.name = name;
  }
  if (payload.description !== undefined) {
    record.description = normaliseString(payload.description) ?? null;
  }
  if (payload.enabled !== undefined) {
    record.enabled = Boolean(payload.enabled);
  }
  if (payload.rolloutType !== undefined) {
    record.rolloutType = assertEnum(payload.rolloutType, getEnumValues(attributes.rolloutType), 'rolloutType');
  }
  if (payload.minAppVersion !== undefined) {
    record.minAppVersion = normaliseString(payload.minAppVersion) ?? null;
  }
  if (payload.maxAppVersion !== undefined) {
    record.maxAppVersion = normaliseString(payload.maxAppVersion) ?? null;
  }
  if (payload.audienceRoles !== undefined) {
    record.audienceRoles = sanitiseArray(payload.audienceRoles);
  }
  if (payload.metadata !== undefined) {
    if (payload.metadata && typeof payload.metadata !== 'object') {
      throw new ValidationError('metadata must be an object or null.');
    }
    record.metadata = payload.metadata ?? null;
  }

  if (payload.rolloutType !== undefined || payload.rolloutPercentage !== undefined || payload.audienceRoles !== undefined) {
    record.rolloutValue = buildFeatureRollout(record.rolloutType, payload.rolloutPercentage, record.audienceRoles);
  }

  await record.save();
  log.debug({ appId, featureId }, 'Updated mobile app feature.');
  return formatFeature(record);
}

export async function deleteMobileAppFeature(appId, featureId) {
  if (!appId || !featureId) {
    throw new ValidationError('appId and featureId are required.');
  }
  await fetchMobileApp(appId, { includeAssociations: false });
  const MobileAppFeature = getMobileAppFeatureModel();
  const record = await MobileAppFeature.findOne({ where: { id: featureId, appId } });
  if (!record) {
    throw new NotFoundError('Mobile app feature not found.');
  }
  await record.destroy();
  log.debug({ appId, featureId }, 'Deleted mobile app feature.');
  return { success: true };
}

export default {
  listMobileApps,
  createMobileApp,
  updateMobileApp,
  createMobileAppVersion,
  updateMobileAppVersion,
  createMobileAppFeature,
  updateMobileAppFeature,
  deleteMobileAppFeature,
};
