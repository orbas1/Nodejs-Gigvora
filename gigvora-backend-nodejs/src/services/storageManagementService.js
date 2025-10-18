import { Op } from 'sequelize';
import sequelize from '../models/sequelizeClient.js';
import {
  StorageLocation,
  StorageLifecycleRule,
  StorageUploadPreset,
  StorageAuditEvent,
} from '../models/storageManagementModels.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const STORAGE_PROVIDERS = new Set(['cloudflare_r2', 'aws_s3', 'azure_blob', 'gcp_storage', 'digitalocean_spaces']);
const LOCATION_STATUSES = new Set(['active', 'maintenance', 'disabled']);
const LIFECYCLE_STATUSES = new Set(['active', 'paused', 'disabled']);
const STORAGE_CLASSES = new Set([
  'standard',
  'standard_ia',
  'one_zone_ia',
  'intelligent_tiering',
  'glacier',
  'glacier_deep_archive',
  'coldline',
  'archive',
]);
const ENCRYPTION_MODES = new Set(['managed', 'sse-s3', 'sse-kms', 'client-side', 'none']);

function coerceBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lowered = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(lowered)) {
      return true;
    }
    if (['false', '0', 'no', 'off'].includes(lowered)) {
      return false;
    }
  }
  if (typeof value === 'number') {
    if (Number.isFinite(value)) {
      return value !== 0;
    }
  }
  return fallback;
}

function coerceNumber(value, fallback = 0, { min, max, precision } = {}) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ValidationError('Numeric value expected.');
  }
  let normalized = numeric;
  if (typeof min === 'number' && normalized < min) {
    normalized = min;
  }
  if (typeof max === 'number' && normalized > max) {
    normalized = max;
  }
  if (typeof precision === 'number') {
    const multiplier = 10 ** precision;
    normalized = Math.round(normalized * multiplier) / multiplier;
  }
  return normalized;
}

function coerceInteger(value, fallback = 0, options = {}) {
  const numeric = coerceNumber(value, fallback, options);
  return Number.isFinite(numeric) ? Math.trunc(numeric) : fallback;
}

function normalizeString(value, fieldName, { required = false, maxLength, lowerCase = false } = {}) {
  if (value == null) {
    if (required) {
      throw new ValidationError(`${fieldName} is required.`);
    }
    return null;
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    if (required) {
      throw new ValidationError(`${fieldName} is required.`);
    }
    return null;
  }
  if (maxLength && trimmed.length > maxLength) {
    throw new ValidationError(`${fieldName} must be at most ${maxLength} characters.`);
  }
  return lowerCase ? trimmed.toLowerCase() : trimmed;
}

function normalizeKey(value, { required = false } = {}) {
  const normalized = normalizeString(value, 'location key', { required, maxLength: 120, lowerCase: true });
  if (!normalized) {
    return null;
  }
  const cleaned = normalized
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (!cleaned) {
    throw new ValidationError('location key must contain alphanumeric characters.');
  }
  return cleaned;
}

function uniqueStringList(values = []) {
  if (typeof values === 'string') {
    values = values
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  if (!Array.isArray(values)) {
    return [];
  }
  const unique = new Set();
  values.forEach((value) => {
    if (typeof value !== 'string') {
      return;
    }
    const trimmed = value.trim();
    if (trimmed) {
      unique.add(trimmed);
    }
  });
  return Array.from(unique);
}

function resolveActor(context = {}) {
  if (!context) {
    return {};
  }
  if (context.actor) {
    return {
      actorId: context.actor.id ?? context.actor.actorId ?? null,
      actorEmail: context.actor.email ?? context.actor.actorEmail ?? null,
      actorName: context.actor.name ?? context.actor.actorName ?? null,
    };
  }
  return {
    actorId: context.actorId ?? context.userId ?? null,
    actorEmail: context.actorEmail ?? context.email ?? null,
    actorName: context.actorName ?? context.name ?? null,
  };
}

async function recordAuditEvent({ eventType, targetType, targetId, summary, metadata = {}, context, transaction }) {
  if (!eventType) {
    return null;
  }
  const actor = resolveActor(context);
  return StorageAuditEvent.create(
    {
      eventType,
      targetType: targetType ?? null,
      targetId: targetId ?? null,
      summary: summary ?? null,
      metadata,
      actorId: actor.actorId ?? null,
      actorEmail: actor.actorEmail ?? null,
      actorName: actor.actorName ?? null,
    },
    { transaction },
  );
}

function sanitizeLocationPayload(payload = {}, { existing } = {}) {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Invalid storage location payload.');
  }

  const result = {};

  if ('locationKey' in payload || !existing) {
    const key = normalizeKey(payload.locationKey ?? payload.key, { required: !existing });
    if (key) {
      result.locationKey = key;
    }
  }

  if ('name' in payload || !existing) {
    const name = normalizeString(payload.name, 'name', { required: !existing, maxLength: 255 });
    if (name) {
      result.name = name;
    }
  }

  if ('provider' in payload || !existing) {
    const provider = normalizeString(payload.provider, 'provider', { required: !existing, maxLength: 60, lowerCase: true });
    if (provider && !STORAGE_PROVIDERS.has(provider)) {
      throw new ValidationError(`Unsupported storage provider: ${provider}`);
    }
    if (provider) {
      result.provider = provider;
    }
  }

  if ('bucket' in payload || !existing) {
    const bucket = normalizeString(payload.bucket, 'bucket', { required: !existing, maxLength: 255 });
    if (bucket) {
      result.bucket = bucket;
    }
  }

  if ('region' in payload) {
    result.region = normalizeString(payload.region, 'region', { maxLength: 120 });
  }

  if ('endpoint' in payload) {
    result.endpoint = normalizeString(payload.endpoint, 'endpoint', { maxLength: 255 });
  }

  if ('publicBaseUrl' in payload) {
    result.publicBaseUrl = normalizeString(payload.publicBaseUrl, 'public base url', { maxLength: 2048 });
  }

  if ('defaultPathPrefix' in payload) {
    result.defaultPathPrefix = normalizeString(payload.defaultPathPrefix, 'default path prefix', { maxLength: 255 });
  }

  if ('status' in payload || !existing) {
    const status = normalizeString(payload.status, 'status', { required: !existing, maxLength: 32, lowerCase: true });
    if (status && !LOCATION_STATUSES.has(status)) {
      throw new ValidationError(`Invalid status: ${status}`);
    }
    if (status) {
      result.status = status;
    }
  }

  if ('isPrimary' in payload) {
    result.isPrimary = coerceBoolean(payload.isPrimary, existing?.isPrimary ?? false);
  }

  if ('versioningEnabled' in payload) {
    result.versioningEnabled = coerceBoolean(payload.versioningEnabled, existing?.versioningEnabled ?? false);
  }

  if ('replicationEnabled' in payload) {
    result.replicationEnabled = coerceBoolean(payload.replicationEnabled, existing?.replicationEnabled ?? false);
  }

  if ('kmsKeyArn' in payload) {
    result.kmsKeyArn = normalizeString(payload.kmsKeyArn, 'kms key arn', { maxLength: 255 });
  }

  if ('accessKeyId' in payload) {
    result.credentialAccessKeyId = normalizeString(payload.accessKeyId, 'access key id', { maxLength: 255 });
  }

  if ('roleArn' in payload) {
    result.credentialRoleArn = normalizeString(payload.roleArn, 'role arn', { maxLength: 255 });
  }

  if ('externalId' in payload) {
    result.credentialExternalId = normalizeString(payload.externalId, 'external id', { maxLength: 255 });
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'secretAccessKey')) {
    if (payload.secretAccessKey === null) {
      result.credentialSecret = null;
    } else {
      const secret = normalizeString(payload.secretAccessKey, 'secret access key', { maxLength: 1024 });
      if (secret) {
        result.credentialSecret = secret;
      }
    }
  }

  if ('metadata' in payload) {
    if (payload.metadata && typeof payload.metadata === 'object') {
      result.metadata = payload.metadata;
    } else if (payload.metadata == null) {
      result.metadata = {};
    }
  }

  if ('currentUsageMb' in payload) {
    result.currentUsageMb = coerceNumber(payload.currentUsageMb, existing?.currentUsageMb ?? 0, { min: 0, precision: 2 });
  }

  if ('objectCount' in payload) {
    result.objectCount = coerceInteger(payload.objectCount, existing?.objectCount ?? 0, { min: 0 });
  }

  if ('ingestBytes24h' in payload) {
    result.ingestBytes24h = coerceInteger(payload.ingestBytes24h, existing?.ingestBytes24h ?? 0, { min: 0 });
  }

  if ('egressBytes24h' in payload) {
    result.egressBytes24h = coerceInteger(payload.egressBytes24h, existing?.egressBytes24h ?? 0, { min: 0 });
  }

  if ('errorCount24h' in payload) {
    result.errorCount24h = coerceInteger(payload.errorCount24h, existing?.errorCount24h ?? 0, { min: 0 });
  }

  if ('lastInventoryAt' in payload) {
    const value = payload.lastInventoryAt;
    if (!value) {
      result.lastInventoryAt = null;
    } else {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        throw new ValidationError('lastInventoryAt must be a valid date.');
      }
      result.lastInventoryAt = date;
    }
  }

  return result;
}

function sanitizeLifecyclePayload(payload = {}, { existing } = {}) {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Invalid lifecycle rule payload.');
  }

  const result = {};

  if ('locationId' in payload || !existing) {
    const id = coerceInteger(payload.locationId, existing?.locationId ?? null, { min: 1 });
    if (!id) {
      throw new ValidationError('locationId is required.');
    }
    result.locationId = id;
  }

  if ('name' in payload || !existing) {
    const name = normalizeString(payload.name, 'name', { required: !existing, maxLength: 180 });
    if (name) {
      result.name = name;
    }
  }

  if ('description' in payload) {
    const description = normalizeString(payload.description, 'description');
    result.description = description;
  }

  if ('status' in payload || !existing) {
    const status = normalizeString(payload.status, 'status', { required: !existing, maxLength: 32, lowerCase: true });
    if (status && !LIFECYCLE_STATUSES.has(status)) {
      throw new ValidationError(`Invalid lifecycle status: ${status}`);
    }
    if (status) {
      result.status = status;
    }
  }

  if ('filterPrefix' in payload) {
    result.filterPrefix = normalizeString(payload.filterPrefix, 'filter prefix', { maxLength: 255 });
  }

  if ('transitionAfterDays' in payload) {
    const value = payload.transitionAfterDays;
    if (value == null || value === '') {
      result.transitionAfterDays = null;
    } else {
      result.transitionAfterDays = coerceInteger(value, existing?.transitionAfterDays ?? null, { min: 1 });
    }
  }

  if ('transitionStorageClass' in payload) {
    const storageClass = normalizeString(payload.transitionStorageClass, 'transition storage class', {
      maxLength: 64,
      lowerCase: true,
    });
    if (storageClass && !STORAGE_CLASSES.has(storageClass)) {
      throw new ValidationError(`Unsupported storage class: ${storageClass}`);
    }
    result.transitionStorageClass = storageClass;
  }

  if ('expireAfterDays' in payload) {
    const value = payload.expireAfterDays;
    if (value == null || value === '') {
      result.expireAfterDays = null;
    } else {
      result.expireAfterDays = coerceInteger(value, existing?.expireAfterDays ?? null, { min: 1 });
    }
  }

  if ('deleteExpiredObjects' in payload) {
    result.deleteExpiredObjects = coerceBoolean(payload.deleteExpiredObjects, existing?.deleteExpiredObjects ?? false);
  }

  if ('compressObjects' in payload) {
    result.compressObjects = coerceBoolean(payload.compressObjects, existing?.compressObjects ?? false);
  }

  if ('metadata' in payload) {
    if (payload.metadata && typeof payload.metadata === 'object') {
      result.metadata = payload.metadata;
    } else if (payload.metadata == null) {
      result.metadata = {};
    }
  }

  return result;
}

function sanitizeUploadPresetPayload(payload = {}, { existing } = {}) {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Invalid upload preset payload.');
  }
  const result = {};

  if ('locationId' in payload || !existing) {
    const id = coerceInteger(payload.locationId, existing?.locationId ?? null, { min: 1 });
    if (!id) {
      throw new ValidationError('locationId is required.');
    }
    result.locationId = id;
  }

  if ('name' in payload || !existing) {
    const name = normalizeString(payload.name, 'name', { required: !existing, maxLength: 160 });
    if (name) {
      result.name = name;
    }
  }

  if ('description' in payload) {
    result.description = normalizeString(payload.description, 'description');
  }

  if ('pathPrefix' in payload) {
    result.pathPrefix = normalizeString(payload.pathPrefix, 'path prefix', { maxLength: 255 });
  }

  if ('allowedMimeTypes' in payload) {
    result.allowedMimeTypes = uniqueStringList(payload.allowedMimeTypes);
  }

  if ('allowedRoles' in payload) {
    result.allowedRoles = uniqueStringList(payload.allowedRoles).map((role) => role.toLowerCase());
  }

  if ('maxSizeMb' in payload || !existing) {
    result.maxSizeMb = coerceNumber(payload.maxSizeMb, existing?.maxSizeMb ?? 50, { min: 1, max: 1024, precision: 2 });
  }

  if ('requireModeration' in payload) {
    result.requireModeration = coerceBoolean(payload.requireModeration, existing?.requireModeration ?? false);
  }

  if ('encryption' in payload) {
    const encryption = normalizeString(payload.encryption, 'encryption', { maxLength: 60, lowerCase: true });
    if (encryption && !ENCRYPTION_MODES.has(encryption)) {
      throw new ValidationError(`Unsupported encryption mode: ${encryption}`);
    }
    result.encryption = encryption;
  }

  if ('expiresAfterMinutes' in payload) {
    const value = payload.expiresAfterMinutes;
    if (value == null || value === '') {
      result.expiresAfterMinutes = null;
    } else {
      result.expiresAfterMinutes = coerceInteger(value, existing?.expiresAfterMinutes ?? null, { min: 5, max: 7 * 24 * 60 });
    }
  }

  if ('active' in payload) {
    result.active = coerceBoolean(payload.active, existing?.active ?? true);
  }

  if ('metadata' in payload) {
    if (payload.metadata && typeof payload.metadata === 'object') {
      result.metadata = payload.metadata;
    } else if (payload.metadata == null) {
      result.metadata = {};
    }
  }

  return result;
}

function computeSummary(locations) {
  const summary = {
    totalUsageMb: 0,
    totalObjects: 0,
    totalLocations: locations.length,
    activeLocations: 0,
    ingestBytes24h: 0,
    egressBytes24h: 0,
    errorCount24h: 0,
  };

  locations.forEach((location) => {
    const metrics = location.metrics ?? {};
    summary.totalUsageMb += Number(metrics.currentUsageMb ?? 0);
    summary.totalObjects += Number(metrics.objectCount ?? 0);
    summary.ingestBytes24h += Number(metrics.ingestBytes24h ?? 0);
    summary.egressBytes24h += Number(metrics.egressBytes24h ?? 0);
    summary.errorCount24h += Number(metrics.errorCount24h ?? 0);
    if (location.status === 'active') {
      summary.activeLocations += 1;
    }
  });

  summary.totalUsageGb = summary.totalUsageMb / 1024;
  summary.ingestMb24h = summary.ingestBytes24h / (1024 * 1024);
  summary.egressMb24h = summary.egressBytes24h / (1024 * 1024);
  summary.hasHealthyPrimary = locations.some((location) => location.isPrimary && location.status === 'active');

  return summary;
}

export async function getStorageOverview() {
  const [locationRecords, lifecycleRecords, uploadPresetRecords, auditRecords] = await Promise.all([
    StorageLocation.findAll({ order: [['isPrimary', 'DESC'], ['name', 'ASC']] }),
    StorageLifecycleRule.findAll({
      include: [{ model: StorageLocation, as: 'location', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
    }),
    StorageUploadPreset.findAll({
      include: [{ model: StorageLocation, as: 'location', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
    }),
    StorageAuditEvent.findAll({ order: [['createdAt', 'DESC']], limit: 25 }),
  ]);

  const locations = locationRecords.map((record) => record.toPublicObject());
  const lifecycleRules = lifecycleRecords.map((record) => record.toPublicObject());
  const uploadPresets = uploadPresetRecords.map((record) => record.toPublicObject());
  const auditLog = auditRecords.map((record) => record.toPublicObject());

  const summary = computeSummary(locations);

  return {
    summary,
    locations,
    lifecycleRules,
    uploadPresets,
    auditLog,
  };
}

async function ensureLocationKeyUnique(locationKey, { excludeId, transaction } = {}) {
  if (!locationKey) {
    return;
  }
  const where = { locationKey };
  if (excludeId) {
    where.id = { [Op.ne]: excludeId };
  }
  const existing = await StorageLocation.findOne({ where, transaction });
  if (existing) {
    throw new ValidationError('Storage location key must be unique.');
  }
}

async function promotePrimaryIfNeeded({ locationId, transaction }) {
  if (!locationId) {
    return;
  }
  await StorageLocation.update(
    { isPrimary: false },
    {
      where: { id: { [Op.ne]: locationId } },
      transaction,
    },
  );
}

export async function createStorageLocation(payload, context = {}) {
  const sanitized = sanitizeLocationPayload(payload, {});

  return sequelize.transaction(async (transaction) => {
    await ensureLocationKeyUnique(sanitized.locationKey, { transaction });

    const location = await StorageLocation.create(sanitized, { transaction });

    if (sanitized.isPrimary) {
      await promotePrimaryIfNeeded({ locationId: location.id, transaction });
    }

    const auditMetadata = { ...sanitized };
    delete auditMetadata.credentialSecret;

    await recordAuditEvent({
      eventType: 'storage.location.created',
      targetType: 'storage_location',
      targetId: location.id,
      summary: `Created storage location ${location.name}`,
      metadata: auditMetadata,
      context,
      transaction,
    });

    await location.reload({ transaction });
    return location.toPublicObject();
  });
}

export async function updateStorageLocation(locationId, payload, context = {}) {
  if (!locationId) {
    throw new ValidationError('locationId is required.');
  }

  return sequelize.transaction(async (transaction) => {
    const location = await StorageLocation.findByPk(locationId, { transaction });
    if (!location) {
      throw new NotFoundError('Storage location not found.');
    }

    const sanitized = sanitizeLocationPayload(payload, { existing: location });

    if (sanitized.locationKey) {
      await ensureLocationKeyUnique(sanitized.locationKey, { excludeId: location.id, transaction });
    }

    await location.update(sanitized, { transaction });

    if (Object.prototype.hasOwnProperty.call(sanitized, 'isPrimary') && sanitized.isPrimary) {
      await promotePrimaryIfNeeded({ locationId: location.id, transaction });
    }

    const auditMetadata = { ...sanitized };
    delete auditMetadata.credentialSecret;

    await recordAuditEvent({
      eventType: 'storage.location.updated',
      targetType: 'storage_location',
      targetId: location.id,
      summary: `Updated storage location ${location.name}`,
      metadata: auditMetadata,
      context,
      transaction,
    });

    await location.reload({ transaction });
    return location.toPublicObject();
  });
}

export async function deleteStorageLocation(locationId, context = {}) {
  if (!locationId) {
    throw new ValidationError('locationId is required.');
  }

  return sequelize.transaction(async (transaction) => {
    const location = await StorageLocation.findByPk(locationId, { transaction });
    if (!location) {
      throw new NotFoundError('Storage location not found.');
    }

    if (location.isPrimary) {
      const otherLocations = await StorageLocation.count({
        where: { id: { [Op.ne]: location.id } },
        transaction,
      });
      if (otherLocations > 0) {
        throw new ValidationError('Promote another location before deleting the primary storage location.');
      }
    }

    await StorageUploadPreset.destroy({ where: { locationId: location.id }, transaction });
    await StorageLifecycleRule.destroy({ where: { locationId: location.id }, transaction });

    await location.destroy({ transaction });

    await recordAuditEvent({
      eventType: 'storage.location.deleted',
      targetType: 'storage_location',
      targetId: locationId,
      summary: `Deleted storage location ${location.name}`,
      context,
      transaction,
    });

    return true;
  });
}

async function assertLocationExists(locationId, transaction) {
  const location = await StorageLocation.findByPk(locationId, { transaction });
  if (!location) {
    throw new ValidationError('Associated storage location not found.');
  }
  return location;
}

export async function createLifecycleRule(payload, context = {}) {
  const sanitized = sanitizeLifecyclePayload(payload, {});
  return sequelize.transaction(async (transaction) => {
    const location = await assertLocationExists(sanitized.locationId, transaction);
    const rule = await StorageLifecycleRule.create(sanitized, { transaction });

    await recordAuditEvent({
      eventType: 'storage.lifecycle.created',
      targetType: 'storage_lifecycle_rule',
      targetId: rule.id,
      summary: `Created lifecycle rule ${rule.name}`,
      metadata: { locationId: rule.locationId, locationName: location.name },
      context,
      transaction,
    });

    await rule.reload({ include: [{ model: StorageLocation, as: 'location', attributes: ['id', 'name'] }], transaction });
    return rule.toPublicObject();
  });
}

export async function updateLifecycleRule(ruleId, payload, context = {}) {
  if (!ruleId) {
    throw new ValidationError('ruleId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const rule = await StorageLifecycleRule.findByPk(ruleId, {
      include: [{ model: StorageLocation, as: 'location', attributes: ['id', 'name'] }],
      transaction,
    });
    if (!rule) {
      throw new NotFoundError('Lifecycle rule not found.');
    }

    const sanitized = sanitizeLifecyclePayload(payload, { existing: rule });
    if (sanitized.locationId && sanitized.locationId !== rule.locationId) {
      await assertLocationExists(sanitized.locationId, transaction);
    }

    await rule.update(sanitized, { transaction });

    await recordAuditEvent({
      eventType: 'storage.lifecycle.updated',
      targetType: 'storage_lifecycle_rule',
      targetId: rule.id,
      summary: `Updated lifecycle rule ${rule.name}`,
      metadata: sanitized,
      context,
      transaction,
    });

    await rule.reload({ include: [{ model: StorageLocation, as: 'location', attributes: ['id', 'name'] }], transaction });
    return rule.toPublicObject();
  });
}

export async function deleteLifecycleRule(ruleId, context = {}) {
  if (!ruleId) {
    throw new ValidationError('ruleId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const rule = await StorageLifecycleRule.findByPk(ruleId, { transaction });
    if (!rule) {
      throw new NotFoundError('Lifecycle rule not found.');
    }
    await rule.destroy({ transaction });

    await recordAuditEvent({
      eventType: 'storage.lifecycle.deleted',
      targetType: 'storage_lifecycle_rule',
      targetId: ruleId,
      summary: `Deleted lifecycle rule ${rule.name}`,
      context,
      transaction,
    });

    return true;
  });
}

export async function createUploadPreset(payload, context = {}) {
  const sanitized = sanitizeUploadPresetPayload(payload, {});
  return sequelize.transaction(async (transaction) => {
    const location = await assertLocationExists(sanitized.locationId, transaction);
    const preset = await StorageUploadPreset.create(sanitized, { transaction });

    await recordAuditEvent({
      eventType: 'storage.upload-preset.created',
      targetType: 'storage_upload_preset',
      targetId: preset.id,
      summary: `Created upload preset ${preset.name}`,
      metadata: { locationId: preset.locationId, locationName: location.name },
      context,
      transaction,
    });

    await preset.reload({ include: [{ model: StorageLocation, as: 'location', attributes: ['id', 'name'] }], transaction });
    return preset.toPublicObject();
  });
}

export async function updateUploadPreset(presetId, payload, context = {}) {
  if (!presetId) {
    throw new ValidationError('presetId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const preset = await StorageUploadPreset.findByPk(presetId, {
      include: [{ model: StorageLocation, as: 'location', attributes: ['id', 'name'] }],
      transaction,
    });
    if (!preset) {
      throw new NotFoundError('Upload preset not found.');
    }

    const sanitized = sanitizeUploadPresetPayload(payload, { existing: preset });
    if (sanitized.locationId && sanitized.locationId !== preset.locationId) {
      await assertLocationExists(sanitized.locationId, transaction);
    }

    await preset.update(sanitized, { transaction });

    await recordAuditEvent({
      eventType: 'storage.upload-preset.updated',
      targetType: 'storage_upload_preset',
      targetId: preset.id,
      summary: `Updated upload preset ${preset.name}`,
      metadata: sanitized,
      context,
      transaction,
    });

    await preset.reload({ include: [{ model: StorageLocation, as: 'location', attributes: ['id', 'name'] }], transaction });
    return preset.toPublicObject();
  });
}

export async function deleteUploadPreset(presetId, context = {}) {
  if (!presetId) {
    throw new ValidationError('presetId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const preset = await StorageUploadPreset.findByPk(presetId, { transaction });
    if (!preset) {
      throw new NotFoundError('Upload preset not found.');
    }
    await preset.destroy({ transaction });

    await recordAuditEvent({
      eventType: 'storage.upload-preset.deleted',
      targetType: 'storage_upload_preset',
      targetId: presetId,
      summary: `Deleted upload preset ${preset.name}`,
      context,
      transaction,
    });

    return true;
  });
}

export default {
  getStorageOverview,
  createStorageLocation,
  updateStorageLocation,
  deleteStorageLocation,
  createLifecycleRule,
  updateLifecycleRule,
  deleteLifecycleRule,
  createUploadPreset,
  updateUploadPreset,
  deleteUploadPreset,
};
