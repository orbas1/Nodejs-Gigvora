import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const PlatformSetting = sequelize.define(
  'PlatformSetting',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    key: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    value: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  {
    tableName: 'platform_settings',
    indexes: [{ unique: true, fields: ['key'] }],
  },
);

PlatformSetting.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    key: plain.key,
    value: plain.value ?? {},
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export default PlatformSetting;
