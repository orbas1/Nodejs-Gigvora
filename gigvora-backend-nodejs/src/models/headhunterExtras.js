import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const ProviderAvailabilityWindow = sequelize.define(
  'ProviderAvailabilityWindow',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    memberId: { type: DataTypes.INTEGER, allowNull: true },
    dayOfWeek: {
      type: DataTypes.ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
      allowNull: false,
      defaultValue: 'monday',
    },
    startTimeUtc: { type: DataTypes.TIME, allowNull: false },
    endTimeUtc: { type: DataTypes.TIME, allowNull: false },
    availabilityType: {
      type: DataTypes.ENUM('interview', 'outreach', 'focus', 'downtime'),
      allowNull: false,
      defaultValue: 'interview',
    },
    broadcastChannels: { type: jsonType, allowNull: true },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'provider_availability_windows',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['dayOfWeek'] },
    ],
  },
);

export const ProviderWellbeingLog = sequelize.define(
  'ProviderWellbeingLog',
  {
    workspaceId: { type: DataTypes.INTEGER, allowNull: false },
    memberId: { type: DataTypes.INTEGER, allowNull: true },
    energyScore: { type: DataTypes.INTEGER, allowNull: true },
    stressScore: { type: DataTypes.INTEGER, allowNull: true },
    workloadScore: { type: DataTypes.INTEGER, allowNull: true },
    wellbeingScore: { type: DataTypes.INTEGER, allowNull: true },
    travelDays: { type: DataTypes.INTEGER, allowNull: true },
    hydrationLevel: { type: DataTypes.INTEGER, allowNull: true },
    recordedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    metadata: { type: jsonType, allowNull: true },
  },
  {
    tableName: 'provider_wellbeing_logs',
    indexes: [
      { fields: ['workspaceId'] },
      { fields: ['recordedAt'] },
    ],
  },
);

function resolveModel(name) {
  return sequelize.models[name];
}

const providerWorkspace = () => resolveModel('ProviderWorkspace');
const providerWorkspaceMember = () => resolveModel('ProviderWorkspaceMember');

function registerAssociations() {
  const workspace = providerWorkspace();
  const member = providerWorkspaceMember();

  if (workspace && !workspace.associations?.availabilityWindows) {
    workspace.hasMany(ProviderAvailabilityWindow, {
      foreignKey: 'workspaceId',
      as: 'availabilityWindows',
    });
  }
  if (workspace && !ProviderAvailabilityWindow.associations?.workspace) {
    ProviderAvailabilityWindow.belongsTo(workspace, {
      foreignKey: 'workspaceId',
      as: 'workspace',
    });
  }
  if (member && !ProviderAvailabilityWindow.associations?.member) {
    ProviderAvailabilityWindow.belongsTo(member, {
      foreignKey: 'memberId',
      as: 'member',
    });
  }

  if (workspace && !workspace.associations?.wellbeingLogs) {
    workspace.hasMany(ProviderWellbeingLog, {
      foreignKey: 'workspaceId',
      as: 'wellbeingLogs',
    });
  }
  if (workspace && !ProviderWellbeingLog.associations?.workspace) {
    ProviderWellbeingLog.belongsTo(workspace, {
      foreignKey: 'workspaceId',
      as: 'workspace',
    });
  }
  if (member && !ProviderWellbeingLog.associations?.member) {
    ProviderWellbeingLog.belongsTo(member, {
      foreignKey: 'memberId',
      as: 'member',
    });
  }
}

registerAssociations();

export default {
  ProviderAvailabilityWindow,
  ProviderWellbeingLog,
};
