import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

function ensureModel(name, attributes, options = {}) {
  if (sequelize.models[name]) {
    return sequelize.models[name];
  }
  return sequelize.define(name, attributes, options);
}

export const IntegrationStubEnvironment = ensureModel(
  'IntegrationStubEnvironment',
  {
    slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    service: { type: DataTypes.STRING(160), allowNull: false },
    baseUrl: { type: DataTypes.STRING(500), allowNull: false },
    metadataEndpoint: { type: DataTypes.STRING(500), allowNull: false },
    eventsEndpoint: { type: DataTypes.STRING(500), allowNull: true },
    fallbackOrigin: { type: DataTypes.STRING(500), allowNull: true },
    allowedOrigins: { type: jsonType, allowNull: false, defaultValue: [] },
    viewRoles: { type: jsonType, allowNull: false, defaultValue: [] },
    manageRoles: { type: jsonType, allowNull: false, defaultValue: [] },
    workspaceSlug: { type: DataTypes.STRING(160), allowNull: true },
    workspaceId: { type: DataTypes.INTEGER, allowNull: true },
    releaseChannel: { type: DataTypes.STRING(120), allowNull: true },
    region: { type: DataTypes.STRING(120), allowNull: true },
    buildNumber: { type: DataTypes.STRING(160), allowNull: true },
    ownerTeam: { type: DataTypes.STRING(160), allowNull: true },
    version: { type: DataTypes.STRING(120), allowNull: true },
    requiresApiKey: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    apiKeyPreview: { type: DataTypes.STRING(255), allowNull: true },
    lastStatus: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'unknown' },
    lastMessage: { type: DataTypes.TEXT, allowNull: true },
    lastError: { type: DataTypes.TEXT, allowNull: true },
    lastCheckedAt: { type: DataTypes.DATE, allowNull: true },
    lastMetadata: { type: jsonType, allowNull: true },
    lastTelemetry: { type: jsonType, allowNull: true },
  },
  { tableName: 'integration_stub_environments' },
);

export const IntegrationStubEnvironmentCheck = ensureModel(
  'IntegrationStubEnvironmentCheck',
  {
    environmentId: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.STRING(60), allowNull: false },
    checkedAt: { type: DataTypes.DATE, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: true },
    error: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
    config: { type: jsonType, allowNull: true },
  },
  { tableName: 'integration_stub_environment_checks' },
);

IntegrationStubEnvironment.hasMany(IntegrationStubEnvironmentCheck, {
  as: 'checks',
  foreignKey: 'environmentId',
});
IntegrationStubEnvironmentCheck.belongsTo(IntegrationStubEnvironment, {
  as: 'environment',
  foreignKey: 'environmentId',
});

export default {
  IntegrationStubEnvironment,
  IntegrationStubEnvironmentCheck,
};
