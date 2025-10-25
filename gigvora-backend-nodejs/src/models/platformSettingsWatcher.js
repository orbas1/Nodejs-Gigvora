import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const PLATFORM_SETTINGS_WATCHER_CHANNELS = ['notification', 'email'];
export const PLATFORM_SETTINGS_WATCHER_DIGEST_FREQUENCIES = ['immediate', 'hourly', 'daily', 'weekly'];

export const PlatformSettingsWatcher = sequelize.define(
  'PlatformSettingsWatcher',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: true },
    deliveryChannel: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'notification',
      validate: {
        isIn: [PLATFORM_SETTINGS_WATCHER_CHANNELS],
      },
    },
    digestFrequency: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'immediate',
      validate: {
        isIn: [PLATFORM_SETTINGS_WATCHER_DIGEST_FREQUENCIES],
      },
    },
    role: { type: DataTypes.STRING(120), allowNull: true },
    description: { type: DataTypes.STRING(500), allowNull: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
    enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    lastDigestAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'platform_settings_watchers',
    indexes: [
      { fields: ['enabled'] },
      { fields: ['digestFrequency'] },
    ],
    defaultScope: {
      order: [['id', 'ASC']],
    },
  },
);

PlatformSettingsWatcher.prototype.toPublicObject = function toPublicObject() {
  const plain = this.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId ?? null,
    email: plain.email ?? null,
    deliveryChannel: plain.deliveryChannel,
    digestFrequency: plain.digestFrequency,
    role: plain.role ?? null,
    description: plain.description ?? null,
    metadata: plain.metadata && typeof plain.metadata === 'object' ? { ...plain.metadata } : {},
    enabled: Boolean(plain.enabled),
    lastDigestAt: plain.lastDigestAt ? new Date(plain.lastDigestAt).toISOString() : null,
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
  };
};

export default PlatformSettingsWatcher;
