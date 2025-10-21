import { DataTypes, Op } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const STORAGE_LOCATION_STATUSES = ['active', 'maintenance', 'degraded', 'disabled'];
export const STORAGE_RULE_STATUSES = ['active', 'disabled'];

function parseDecimal(value) {
  if (value == null) {
    return 0;
  }
  if (typeof value === 'number') {
    return value;
  }
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseInteger(value) {
  if (value == null) {
    return 0;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.trunc(value) : 0;
  }
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeLocationKey(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function sanitizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => (typeof item === 'string' ? item.trim().toLowerCase() : String(item ?? '').trim().toLowerCase()))
    .filter((item, index, list) => item.length > 0 && list.indexOf(item) === index);
}

async function withTransaction(handler, { transaction } = {}) {
  if (transaction) {
    return handler(transaction);
  }
  const managed = await sequelize.transaction();
  try {
    const result = await handler(managed);
    await managed.commit();
    return result;
  } catch (error) {
    await managed.rollback();
    throw error;
  }
}

export const StorageLocation = sequelize.define(
  'StorageLocation',
  {
    locationKey: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    provider: { type: DataTypes.STRING(60), allowNull: false },
    bucket: { type: DataTypes.STRING(255), allowNull: false },
    region: { type: DataTypes.STRING(120), allowNull: true },
    endpoint: { type: DataTypes.STRING(255), allowNull: true },
    publicBaseUrl: { type: DataTypes.STRING(2048), allowNull: true },
    defaultPathPrefix: { type: DataTypes.STRING(255), allowNull: true },
    status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'active', validate: { isIn: [STORAGE_LOCATION_STATUSES] } },
    isPrimary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    versioningEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    replicationEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    kmsKeyArn: { type: DataTypes.STRING(255), allowNull: true },
    credentialAccessKeyId: { type: DataTypes.STRING(255), allowNull: true },
    credentialSecret: { type: DataTypes.STRING(1024), allowNull: true },
    credentialRoleArn: { type: DataTypes.STRING(255), allowNull: true },
    credentialExternalId: { type: DataTypes.STRING(255), allowNull: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
    currentUsageMb: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    objectCount: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    ingestBytes24h: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    egressBytes24h: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    errorCount24h: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    lastInventoryAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'storage_locations',
    indexes: [
      { fields: ['provider'] },
      { fields: ['status'] },
      { fields: ['isPrimary'] },
    ],
  },
);

StorageLocation.addHook('beforeValidate', (location) => {
  location.locationKey = normalizeLocationKey(location.locationKey);
  if (!STORAGE_LOCATION_STATUSES.includes(location.status)) {
    location.status = 'active';
  }
  location.metadata = location.metadata ?? {};
  location.currentUsageMb = parseDecimal(location.currentUsageMb);
  location.objectCount = parseInteger(location.objectCount);
  location.ingestBytes24h = parseInteger(location.ingestBytes24h);
  location.egressBytes24h = parseInteger(location.egressBytes24h);
  location.errorCount24h = parseInteger(location.errorCount24h);
});

StorageLocation.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const usageSummary = this.getUsageSummary();
  return {
    id: plain.id,
    key: plain.locationKey,
    name: plain.name,
    provider: plain.provider,
    bucket: plain.bucket,
    region: plain.region ?? null,
    endpoint: plain.endpoint ?? null,
    publicBaseUrl: plain.publicBaseUrl ?? null,
    defaultPathPrefix: plain.defaultPathPrefix ?? null,
    status: plain.status,
    isPrimary: Boolean(plain.isPrimary),
    versioningEnabled: Boolean(plain.versioningEnabled),
    replicationEnabled: Boolean(plain.replicationEnabled),
    kmsKeyArn: plain.kmsKeyArn ?? null,
    metadata: plain.metadata ?? {},
    metrics: {
      currentUsageMb: usageSummary.currentUsageMb,
      objectCount: usageSummary.objectCount,
      ingestBytes24h: usageSummary.ingestBytes24h,
      egressBytes24h: usageSummary.egressBytes24h,
      errorCount24h: usageSummary.errorCount24h,
      lastInventoryAt: plain.lastInventoryAt ? plain.lastInventoryAt.toISOString() : null,
    },
    health: {
      status: this.status,
      isHealthy: this.isHealthy(),
    },
    credentials: {
      accessKeyId: plain.credentialAccessKeyId ?? null,
      roleArn: plain.credentialRoleArn ?? null,
      externalId: plain.credentialExternalId ?? null,
      hasSecretAccessKey: Boolean(plain.credentialSecret),
    },
    createdAt: plain.createdAt ? plain.createdAt.toISOString() : null,
    updatedAt: plain.updatedAt ? plain.updatedAt.toISOString() : null,
  };
};

StorageLocation.prototype.getUsageSummary = function getUsageSummary() {
  return {
    currentUsageMb: parseDecimal(this.currentUsageMb),
    objectCount: parseInteger(this.objectCount),
    ingestBytes24h: parseInteger(this.ingestBytes24h),
    egressBytes24h: parseInteger(this.egressBytes24h),
    errorCount24h: parseInteger(this.errorCount24h),
  };
};

StorageLocation.prototype.isHealthy = function isHealthy() {
  const { errorCount24h, currentUsageMb } = this.getUsageSummary();
  if (this.status === 'disabled') {
    return false;
  }
  if (this.status === 'degraded' || errorCount24h > 100) {
    return false;
  }
  return currentUsageMb >= 0;
};

StorageLocation.prototype.markAsPrimary = async function markAsPrimary(options = {}) {
  return withTransaction(async (transaction) => {
    await StorageLocation.update(
      { isPrimary: false },
      {
        where: {
          id: { [Op.ne]: this.id },
          isPrimary: true,
        },
        transaction,
      },
    );
    await this.update({ isPrimary: true }, { transaction });
    return this;
  }, options);
};

StorageLocation.recordUsageDelta = async function recordUsageDelta(locationKey, delta = {}, options = {}) {
  const normalisedKey = normalizeLocationKey(locationKey);
  return withTransaction(async (transaction) => {
    const location = await StorageLocation.findOne({ where: { locationKey: normalisedKey }, transaction });
    if (!location) {
      throw new Error(`Storage location ${normalisedKey} not found`);
    }

    const summary = location.getUsageSummary();
    const nextSummary = {
      currentUsageMb: Math.max(0, summary.currentUsageMb + parseDecimal(delta.currentUsageMb ?? delta.mbDelta ?? 0)),
      objectCount: Math.max(0, summary.objectCount + parseInteger(delta.objectCount ?? delta.objectDelta ?? 0)),
      ingestBytes24h: Math.max(0, summary.ingestBytes24h + parseInteger(delta.ingestBytes24h ?? delta.ingestDelta ?? 0)),
      egressBytes24h: Math.max(0, summary.egressBytes24h + parseInteger(delta.egressBytes24h ?? delta.egressDelta ?? 0)),
      errorCount24h: Math.max(0, summary.errorCount24h + parseInteger(delta.errorCount24h ?? delta.errorDelta ?? 0)),
    };

    Object.assign(location, nextSummary);
    if (delta.status && STORAGE_LOCATION_STATUSES.includes(delta.status)) {
      location.status = delta.status;
    }
    if (delta.lastInventoryAt) {
      location.lastInventoryAt = new Date(delta.lastInventoryAt);
    }

    await location.save({ transaction });
    return location;
  }, options);
};

export const StorageLifecycleRule = sequelize.define(
  'StorageLifecycleRule',
  {
    locationId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(180), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'active', validate: { isIn: [STORAGE_RULE_STATUSES] } },
    filterPrefix: { type: DataTypes.STRING(255), allowNull: true },
    transitionAfterDays: { type: DataTypes.INTEGER, allowNull: true },
    transitionStorageClass: { type: DataTypes.STRING(64), allowNull: true },
    expireAfterDays: { type: DataTypes.INTEGER, allowNull: true },
    deleteExpiredObjects: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    compressObjects: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  {
    tableName: 'storage_lifecycle_rules',
    indexes: [
      { fields: ['locationId'] },
      { fields: ['status'] },
    ],
  },
);

StorageLifecycleRule.addHook('beforeValidate', (rule) => {
  rule.status = STORAGE_RULE_STATUSES.includes(rule.status) ? rule.status : 'active';
  rule.metadata = rule.metadata ?? {};
});

StorageLifecycleRule.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const location = this.location ?? this.StorageLocation ?? null;
  return {
    id: plain.id,
    locationId: plain.locationId,
    locationName: location?.name ?? null,
    name: plain.name,
    description: plain.description ?? null,
    status: plain.status,
    filterPrefix: plain.filterPrefix ?? null,
    transitionAfterDays: plain.transitionAfterDays ?? null,
    transitionStorageClass: plain.transitionStorageClass ?? null,
    expireAfterDays: plain.expireAfterDays ?? null,
    deleteExpiredObjects: Boolean(plain.deleteExpiredObjects),
    compressObjects: Boolean(plain.compressObjects),
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt ? plain.createdAt.toISOString() : null,
    updatedAt: plain.updatedAt ? plain.updatedAt.toISOString() : null,
  };
};

StorageLifecycleRule.prototype.isActive = function isActive() {
  return this.status === 'active';
};

export const StorageUploadPreset = sequelize.define(
  'StorageUploadPreset',
  {
    locationId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    pathPrefix: { type: DataTypes.STRING(255), allowNull: true },
    allowedMimeTypes: { type: jsonType, allowNull: false, defaultValue: [] },
    maxSizeMb: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 50 },
    allowedRoles: { type: jsonType, allowNull: false, defaultValue: [] },
    requireModeration: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    encryption: { type: DataTypes.STRING(60), allowNull: true },
    expiresAfterMinutes: { type: DataTypes.INTEGER, allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  {
    tableName: 'storage_upload_presets',
    indexes: [
      { fields: ['locationId'] },
      { fields: ['active'] },
    ],
  },
);

StorageUploadPreset.addHook('beforeValidate', (preset) => {
  preset.allowedMimeTypes = sanitizeStringArray(preset.allowedMimeTypes);
  preset.allowedRoles = sanitizeStringArray(preset.allowedRoles);
  preset.metadata = preset.metadata ?? {};
  preset.maxSizeMb = parseDecimal(preset.maxSizeMb) || 0;
});

StorageUploadPreset.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  const location = this.location ?? this.StorageLocation ?? null;
  const parseArray = (value) => {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.map((item) => (typeof item === 'string' ? item : String(item ?? ''))).filter((item) => item.length > 0);
  };
  return {
    id: plain.id,
    locationId: plain.locationId,
    locationName: location?.name ?? null,
    name: plain.name,
    description: plain.description ?? null,
    pathPrefix: plain.pathPrefix ?? null,
    allowedMimeTypes: parseArray(plain.allowedMimeTypes),
    maxSizeMb: parseDecimal(plain.maxSizeMb),
    allowedRoles: parseArray(plain.allowedRoles),
    requireModeration: Boolean(plain.requireModeration),
    encryption: plain.encryption ?? null,
    expiresAfterMinutes: plain.expiresAfterMinutes ?? null,
    active: Boolean(plain.active),
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt ? plain.createdAt.toISOString() : null,
    updatedAt: plain.updatedAt ? plain.updatedAt.toISOString() : null,
  };
};

StorageUploadPreset.prototype.isRoleAllowed = function isRoleAllowed(actorRoles = []) {
  const allowedRoles = sanitizeStringArray(this.allowedRoles);
  if (allowedRoles.length === 0 || allowedRoles.includes('guest')) {
    return true;
  }
  return actorRoles.some((role) => allowedRoles.includes(role));
};

StorageUploadPreset.prototype.isMimeTypeAllowed = function isMimeTypeAllowed(mimeType) {
  const allowedMimeTypes = sanitizeStringArray(this.allowedMimeTypes);
  if (allowedMimeTypes.length === 0) {
    return true;
  }
  const sanitized = String(mimeType ?? '').trim().toLowerCase();
  if (!sanitized) {
    return false;
  }
  return allowedMimeTypes.some((allowed) => {
    if (allowed.endsWith('/*')) {
      const prefix = allowed.slice(0, -1);
      return sanitized.startsWith(prefix);
    }
    return allowed === sanitized;
  });
};

export const StorageAuditEvent = sequelize.define(
  'StorageAuditEvent',
  {
    actorId: { type: DataTypes.INTEGER, allowNull: true },
    actorEmail: { type: DataTypes.STRING(255), allowNull: true },
    actorName: { type: DataTypes.STRING(255), allowNull: true },
    eventType: { type: DataTypes.STRING(60), allowNull: false },
    targetType: { type: DataTypes.STRING(60), allowNull: true },
    targetId: { type: DataTypes.INTEGER, allowNull: true },
    summary: { type: DataTypes.STRING(255), allowNull: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  {
    tableName: 'storage_audit_events',
    indexes: [
      { fields: ['eventType'] },
      { fields: ['createdAt'] },
    ],
  },
);

StorageAuditEvent.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    actorId: plain.actorId ?? null,
    actorEmail: plain.actorEmail ?? null,
    actorName: plain.actorName ?? null,
    eventType: plain.eventType,
    targetType: plain.targetType ?? null,
    targetId: plain.targetId ?? null,
    summary: plain.summary ?? null,
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt ? plain.createdAt.toISOString() : null,
  };
};

StorageLocation.hasMany(StorageLifecycleRule, { foreignKey: 'locationId', as: 'lifecycleRules' });
StorageLifecycleRule.belongsTo(StorageLocation, { foreignKey: 'locationId', as: 'location' });

StorageLocation.hasMany(StorageUploadPreset, { foreignKey: 'locationId', as: 'uploadPresets' });
StorageUploadPreset.belongsTo(StorageLocation, { foreignKey: 'locationId', as: 'location' });

export default {
  StorageLocation,
  StorageLifecycleRule,
  StorageUploadPreset,
  StorageAuditEvent,
  STORAGE_LOCATION_STATUSES,
  STORAGE_RULE_STATUSES,
};
