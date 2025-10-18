import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const DatabaseConnectionProfile = sequelize.define(
  'DatabaseConnectionProfile',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    environment: { type: DataTypes.STRING(60), allowNull: false },
    role: { type: DataTypes.STRING(60), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    dialect: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'postgres' },
    host: { type: DataTypes.STRING(255), allowNull: false },
    port: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5432 },
    databaseName: { type: DataTypes.STRING(255), allowNull: false },
    username: { type: DataTypes.STRING(255), allowNull: false },
    passwordCiphertext: { type: DataTypes.TEXT, allowNull: true },
    sslMode: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'require' },
    options: { type: jsonType, allowNull: false, defaultValue: {} },
    allowedRoles: { type: jsonType, allowNull: false, defaultValue: [] },
    isPrimary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    readOnly: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'unknown' },
    lastTestedAt: { type: DataTypes.DATE, allowNull: true },
    lastTestedBy: { type: DataTypes.STRING(120), allowNull: true },
    lastTestError: { type: DataTypes.TEXT, allowNull: true },
    lastRotatedAt: { type: DataTypes.DATE, allowNull: true },
    lastRotatedBy: { type: DataTypes.STRING(120), allowNull: true },
  },
  {
    tableName: 'database_connection_profiles',
    indexes: [
      { fields: ['slug'], unique: true },
      { fields: ['environment', 'role'] },
      { fields: ['status'] },
    ],
  },
);

DatabaseConnectionProfile.prototype.toAdminPayload = function toAdminPayload() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    name: plain.name,
    slug: plain.slug,
    environment: plain.environment,
    role: plain.role,
    description: plain.description,
    dialect: plain.dialect,
    host: plain.host,
    port: plain.port,
    database: plain.databaseName,
    username: plain.username,
    sslMode: plain.sslMode,
    options: plain.options ?? {},
    allowedRoles: Array.isArray(plain.allowedRoles) ? plain.allowedRoles : [],
    isPrimary: Boolean(plain.isPrimary),
    readOnly: Boolean(plain.readOnly),
    status: plain.status ?? 'unknown',
    lastTestedAt: plain.lastTestedAt,
    lastTestedBy: plain.lastTestedBy,
    lastTestError: plain.lastTestError,
    lastRotatedAt: plain.lastRotatedAt,
    lastRotatedBy: plain.lastRotatedBy,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export default DatabaseConnectionProfile;
