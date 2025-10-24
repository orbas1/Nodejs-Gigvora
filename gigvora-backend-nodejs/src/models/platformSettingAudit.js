import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const PLATFORM_SETTING_AUDIT_CHANGE_TYPES = Object.freeze(['create', 'update', 'delete']);

export const PlatformSettingAudit = sequelize.define(
  'PlatformSettingAudit',
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    settingKey: { type: DataTypes.STRING(160), allowNull: false },
    actorId: { type: DataTypes.INTEGER, allowNull: true },
    actorType: { type: DataTypes.STRING(120), allowNull: true },
    changeType: {
      type: DataTypes.ENUM(...PLATFORM_SETTING_AUDIT_CHANGE_TYPES),
      allowNull: false,
      defaultValue: 'update',
    },
    summary: { type: DataTypes.STRING(255), allowNull: true },
    diff: { type: jsonType, allowNull: false, defaultValue: [] },
    beforeSnapshot: { type: jsonType, allowNull: false, defaultValue: {} },
    afterSnapshot: { type: jsonType, allowNull: false, defaultValue: {} },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  {
    tableName: 'platform_setting_audits',
    indexes: [
      { fields: ['settingKey'] },
      { fields: ['actorId'] },
      { fields: ['changeType'] },
      { fields: ['createdAt'] },
    ],
  },
);

export default PlatformSettingAudit;
