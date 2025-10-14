import { DataTypes } from 'sequelize';
import {
  sequelize,
  ProviderWorkspace,
  ProviderWorkspaceMember,
} from './index.js';

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

ProviderWorkspace.hasMany(ProviderAvailabilityWindow, {
  foreignKey: 'workspaceId',
  as: 'availabilityWindows',
});
ProviderAvailabilityWindow.belongsTo(ProviderWorkspace, {
  foreignKey: 'workspaceId',
  as: 'workspace',
});
ProviderAvailabilityWindow.belongsTo(ProviderWorkspaceMember, {
  foreignKey: 'memberId',
  as: 'member',
});

ProviderWorkspace.hasMany(ProviderWellbeingLog, {
  foreignKey: 'workspaceId',
  as: 'wellbeingLogs',
});
ProviderWellbeingLog.belongsTo(ProviderWorkspace, {
  foreignKey: 'workspaceId',
  as: 'workspace',
});
ProviderWellbeingLog.belongsTo(ProviderWorkspaceMember, {
  foreignKey: 'memberId',
  as: 'member',
});

export default {
  ProviderAvailabilityWindow,
  ProviderWellbeingLog,
};
