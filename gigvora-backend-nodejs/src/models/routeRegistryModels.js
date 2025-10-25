import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const RouteRegistryEntry = sequelize.define(
  'RouteRegistryEntry',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    routeId: { type: DataTypes.STRING(180), allowNull: false, unique: true },
    collection: { type: DataTypes.STRING(80), allowNull: false },
    path: { type: DataTypes.STRING(255), allowNull: false },
    absolutePath: { type: DataTypes.STRING(255), allowNull: false },
    modulePath: { type: DataTypes.STRING(255), allowNull: true },
    title: { type: DataTypes.STRING(160), allowNull: false },
    icon: { type: DataTypes.STRING(120), allowNull: true },
    persona: { type: DataTypes.STRING(60), allowNull: true },
    featureFlag: { type: DataTypes.STRING(120), allowNull: true },
    shellTheme: { type: DataTypes.STRING(60), allowNull: true },
    allowedRoles: { type: jsonType, allowNull: true, defaultValue: [] },
    allowedMemberships: { type: jsonType, allowNull: true, defaultValue: [] },
    metadata: { type: jsonType, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    deprecatedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'route_registry_entries',
    indexes: [
      { fields: ['collection', 'isActive'] },
      { fields: ['absolutePath'] },
    ],
  },
);

RouteRegistryEntry.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    routeId: plain.routeId,
    collection: plain.collection,
    path: plain.path,
    absolutePath: plain.absolutePath,
    modulePath: plain.modulePath ?? null,
    title: plain.title,
    icon: plain.icon ?? null,
    persona: plain.persona ?? null,
    featureFlag: plain.featureFlag ?? null,
    shellTheme: plain.shellTheme ?? null,
    allowedRoles: Array.isArray(plain.allowedRoles) ? plain.allowedRoles : [],
    allowedMemberships: Array.isArray(plain.allowedMemberships) ? plain.allowedMemberships : [],
    metadata: plain.metadata ?? {},
    isActive: Boolean(plain.isActive),
    deprecatedAt: plain.deprecatedAt ?? null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export default RouteRegistryEntry;
