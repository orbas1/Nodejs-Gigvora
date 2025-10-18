import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const SystemSetting = sequelize.define(
  'SystemSetting',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    key: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    category: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'global' },
    value: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  {
    tableName: 'system_settings',
    indexes: [
      { unique: true, fields: ['key'] },
      { fields: ['category'] },
    ],
  },
);

SystemSetting.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    key: plain.key,
    category: plain.category,
    value: plain.value ?? {},
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export default SystemSetting;
