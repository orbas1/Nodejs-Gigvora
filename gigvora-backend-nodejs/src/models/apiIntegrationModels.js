import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const ApiProvider = sequelize.define(
  'ApiProvider',
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING(160), allowNull: false },
    slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    status: {
      type: DataTypes.ENUM('active', 'degraded', 'deprecated', 'planned'),
      allowNull: false,
      defaultValue: 'active',
    },
    baseUrl: { type: DataTypes.STRING(512), allowNull: true },
    sandboxBaseUrl: { type: DataTypes.STRING(512), allowNull: true },
    docsUrl: { type: DataTypes.STRING(512), allowNull: true },
    iconUrl: { type: DataTypes.STRING(512), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    contactEmail: { type: DataTypes.STRING(255), allowNull: true },
    callPriceCents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'api_providers',
    indexes: [
      { unique: true, fields: ['slug'] },
      { fields: ['status'] },
    ],
  },
);

ApiProvider.prototype.toPublicObject = function toPublicObject({ includeClients = true } = {}) {
  const plain = this.get({ plain: true });
  const provider = {
    id: plain.id,
    name: plain.name,
    slug: plain.slug,
    status: plain.status,
    baseUrl: plain.baseUrl ?? null,
    sandboxBaseUrl: plain.sandboxBaseUrl ?? null,
    docsUrl: plain.docsUrl ?? null,
    iconUrl: plain.iconUrl ?? null,
    description: plain.description ?? null,
    contactEmail: plain.contactEmail ?? null,
    metadata: plain.metadata ?? {},
    callPriceCents: Number.isFinite(plain.callPriceCents) ? Number(plain.callPriceCents) : 0,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };

  if (includeClients && Array.isArray(plain.clients)) {
    provider.clients = plain.clients.map((client) =>
      typeof client.toPublicObject === 'function'
        ? client.toPublicObject()
        : client,
    );
  }

  return provider;
};

export const ApiClient = sequelize.define(
  'ApiClient',
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    providerId: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    contactEmail: { type: DataTypes.STRING(255), allowNull: true },
    status: {
      type: DataTypes.ENUM('active', 'suspended', 'revoked'),
      allowNull: false,
      defaultValue: 'active',
    },
    accessLevel: {
      type: DataTypes.ENUM('read', 'write', 'admin'),
      allowNull: false,
      defaultValue: 'read',
    },
    rateLimitPerMinute: { type: DataTypes.INTEGER, allowNull: true },
    ipAllowList: { type: jsonType, allowNull: true },
    scopes: { type: jsonType, allowNull: true },
    webhookUrl: { type: DataTypes.STRING(512), allowNull: true },
    webhookSecretHash: { type: DataTypes.STRING(255), allowNull: true },
    webhookSecretLastFour: { type: DataTypes.STRING(8), allowNull: true },
    walletAccountId: { type: DataTypes.INTEGER, allowNull: true },
    callPriceCents: { type: DataTypes.INTEGER, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    createdBy: { type: DataTypes.STRING(160), allowNull: true },
    lastUsedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'api_clients',
    indexes: [
      { fields: ['providerId'] },
      { fields: ['status'] },
      { unique: true, fields: ['slug'] },
    ],
  },
);

ApiClient.prototype.toPublicObject = function toPublicObject({ includeKeys = true, includeProvider = false } = {}) {
  const plain = this.get({ plain: true });
  const client = {
    id: plain.id,
    providerId: plain.providerId,
    name: plain.name,
    slug: plain.slug,
    description: plain.description ?? null,
    contactEmail: plain.contactEmail ?? null,
    status: plain.status,
    accessLevel: plain.accessLevel,
    rateLimitPerMinute: plain.rateLimitPerMinute ?? null,
    ipAllowList: Array.isArray(plain.ipAllowList) ? plain.ipAllowList : [],
    scopes: Array.isArray(plain.scopes) ? plain.scopes : [],
    webhookUrl: plain.webhookUrl ?? null,
    webhookSecretLastFour: plain.webhookSecretLastFour ?? null,
    metadata: plain.metadata ?? {},
    createdBy: plain.createdBy ?? null,
    walletAccountId: plain.walletAccountId ?? null,
    callPriceCents: Number.isFinite(plain.callPriceCents) ? Number(plain.callPriceCents) : null,
    lastUsedAt: plain.lastUsedAt ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };

  if (includeKeys && Array.isArray(plain.keys)) {
    client.keys = plain.keys.map((key) =>
      typeof key.toPublicObject === 'function'
        ? key.toPublicObject()
        : key,
    );
  }

  if (Array.isArray(plain.usageMetrics)) {
    client.usage = plain.usageMetrics.map((metric) =>
      typeof metric.toPublicObject === 'function'
        ? metric.toPublicObject()
        : metric,
    );
  }

  if (includeProvider && plain.provider && typeof plain.provider.toPublicObject === 'function') {
    client.provider = plain.provider.toPublicObject({ includeClients: false });
  }

  return client;
};

export const ApiClientKey = sequelize.define(
  'ApiClientKey',
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    clientId: { type: DataTypes.UUID, allowNull: false },
    label: { type: DataTypes.STRING(160), allowNull: true },
    secretHash: { type: DataTypes.STRING(255), allowNull: false },
    secretLastFour: { type: DataTypes.STRING(8), allowNull: false },
    createdBy: { type: DataTypes.STRING(160), allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    lastRotatedAt: { type: DataTypes.DATE, allowNull: true },
    revokedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'api_client_keys',
    indexes: [
      { fields: ['clientId'] },
      { fields: ['revokedAt'] },
    ],
  },
);

ApiClientKey.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    clientId: plain.clientId,
    label: plain.label ?? null,
    secretLastFour: plain.secretLastFour,
    createdBy: plain.createdBy ?? null,
    expiresAt: plain.expiresAt ?? null,
    lastRotatedAt: plain.lastRotatedAt ?? null,
    revokedAt: plain.revokedAt ?? null,
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ApiClientAuditEvent = sequelize.define(
  'ApiClientAuditEvent',
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    clientId: { type: DataTypes.UUID, allowNull: false },
    eventType: { type: DataTypes.STRING(80), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    actor: { type: DataTypes.STRING(160), allowNull: true },
    ipAddress: { type: DataTypes.STRING(64), allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'api_client_audit_events',
    indexes: [
      { fields: ['clientId'] },
      { fields: ['createdAt'] },
    ],
  },
);

ApiClientAuditEvent.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    clientId: plain.clientId,
    eventType: plain.eventType,
    description: plain.description ?? null,
    actor: plain.actor ?? null,
    ipAddress: plain.ipAddress ?? null,
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const ApiClientUsageMetric = sequelize.define(
  'ApiClientUsageMetric',
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    clientId: { type: DataTypes.UUID, allowNull: false },
    metricDate: { type: DataTypes.DATEONLY, allowNull: false },
    requestCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    errorCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    avgLatencyMs: { type: DataTypes.INTEGER, allowNull: true },
    peakLatencyMs: { type: DataTypes.INTEGER, allowNull: true },
    lastRequestAt: { type: DataTypes.DATE, allowNull: true },
    billableRequestCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    billedAmountCents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: 'api_client_usage_metrics',
    indexes: [
      { unique: true, fields: ['clientId', 'metricDate'] },
    ],
  },
);

ApiClientUsageMetric.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    clientId: plain.clientId,
    metricDate: plain.metricDate,
    requestCount: plain.requestCount ?? 0,
    errorCount: plain.errorCount ?? 0,
    avgLatencyMs: plain.avgLatencyMs ?? null,
    peakLatencyMs: plain.peakLatencyMs ?? null,
    lastRequestAt: plain.lastRequestAt ?? null,
    billableRequestCount: Number(plain.billableRequestCount ?? 0),
    billedAmountCents: Number(plain.billedAmountCents ?? 0),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

ApiProvider.hasMany(ApiClient, { as: 'clients', foreignKey: 'providerId' });
ApiClient.belongsTo(ApiProvider, { as: 'provider', foreignKey: 'providerId' });

ApiClient.hasMany(ApiClientKey, { as: 'keys', foreignKey: 'clientId' });
ApiClientKey.belongsTo(ApiClient, { as: 'client', foreignKey: 'clientId' });

ApiClient.hasMany(ApiClientAuditEvent, { as: 'auditEvents', foreignKey: 'clientId' });
ApiClientAuditEvent.belongsTo(ApiClient, { as: 'client', foreignKey: 'clientId' });

ApiClient.hasMany(ApiClientUsageMetric, { as: 'usageMetrics', foreignKey: 'clientId' });
ApiClientUsageMetric.belongsTo(ApiClient, { as: 'client', foreignKey: 'clientId' });

export default {
  ApiProvider,
  ApiClient,
  ApiClientKey,
  ApiClientAuditEvent,
  ApiClientUsageMetric,
};
